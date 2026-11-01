/* ぶらりにっぽん — 道路データ読み取り
 * 車両位置のベクタータイル（Mapbox Vector Tile 形式, z14）を取得・デコードし、
 * 周囲の道路の形状と名前を返す。画面の描画状態に依存しないので、
 * 視点角度や倍速に関係なく「道なり走行」と「道路名表示」に使える。
 */
'use strict';

const RoadData = (() => {
  const Z = 14;
  const LAYERS = { transportation: true, transportation_name: true };
  const cache = new Map(); // key → { state: 'loading'|'ok'|'err', data }
  const MAX_CACHE = 48;
  let inflight = 0;
  let template = null;

  /* ---- 最小限の protobuf リーダ ---- */
  class Pbf {
    constructor(buf) { this.buf = buf; this.pos = 0; this.len = buf.length; }
    varint() {
      const b = this.buf; let val = 0, shift = 0, byte;
      do {
        byte = b[this.pos++];
        val += (byte & 0x7f) * Math.pow(2, shift);
        shift += 7;
      } while (byte >= 0x80 && this.pos < this.len);
      return val;
    }
    svarint() { const n = this.varint(); return n % 2 === 1 ? (n + 1) / -2 : n / 2; }
    bytesEnd() { const l = this.varint(); return this.pos + l; }
    string() {
      const end = this.bytesEnd();
      const s = new TextDecoder().decode(this.buf.subarray(this.pos, end));
      this.pos = end; return s;
    }
    skip(wt) {
      if (wt === 0) this.varint();
      else if (wt === 1) this.pos += 8;
      else if (wt === 2) this.pos = this.bytesEnd();
      else if (wt === 5) this.pos += 4;
      else throw new Error('wire type ' + wt);
    }
    packed() { const end = this.bytesEnd(); const out = []; while (this.pos < end) out.push(this.varint()); return out; }
  }

  function readValue(p) {
    const end = p.bytesEnd(); let v = null;
    while (p.pos < end) {
      const tag = p.varint(), f = tag >> 3, wt = tag & 7;
      if (f === 1) v = p.string();
      else if (f === 2) { v = new DataView(p.buf.buffer, p.buf.byteOffset + p.pos, 4).getFloat32(0, true); p.pos += 4; }
      else if (f === 3) { v = new DataView(p.buf.buffer, p.buf.byteOffset + p.pos, 8).getFloat64(0, true); p.pos += 8; }
      else if (f === 4 || f === 5) v = p.varint();
      else if (f === 6) v = p.svarint();
      else if (f === 7) v = !!p.varint();
      else p.skip(wt);
    }
    return v;
  }

  function readFeature(p) {
    const end = p.bytesEnd(); const ft = { tags: null, type: 0, geom: null };
    while (p.pos < end) {
      const tag = p.varint(), f = tag >> 3, wt = tag & 7;
      if (f === 2) ft.tags = p.packed();
      else if (f === 3) ft.type = p.varint();
      else if (f === 4) ft.geom = p.packed();
      else p.skip(wt);
    }
    return ft;
  }

  function readLayer(p) {
    const end = p.bytesEnd();
    const L = { name: '', extent: 4096, keys: [], values: [], raw: [] };
    while (p.pos < end) {
      const tag = p.varint(), f = tag >> 3, wt = tag & 7;
      if (f === 1) L.name = p.string();
      else if (f === 2) {
        if (!LAYERS[L.name] && L.name) { p.skip(wt); continue; }
        L.raw.push(readFeature(p));
      } else if (f === 3) L.keys.push(p.string());
      else if (f === 4) L.values.push(readValue(p));
      else if (f === 5) L.extent = p.varint();
      else p.skip(wt);
    }
    return L;
  }

  // タイル内座標 → 経緯度（ライン）
  function decodeLines(geom, extent, z, tx, ty) {
    const lines = []; let cur = null, x = 0, y = 0, i = 0;
    const n = Math.pow(2, z);
    const toLL = (px, py) => {
      const lng = (tx + px / extent) / n * 360 - 180;
      const yy = Math.PI * (1 - 2 * (ty + py / extent) / n);
      return [lng, Math.atan(Math.sinh(yy)) * 180 / Math.PI];
    };
    while (i < geom.length) {
      const ci = geom[i++], cmd = ci & 7, cnt = ci >> 3;
      if (cmd === 1 || cmd === 2) {
        for (let k = 0; k < cnt; k++) {
          const dx = geom[i++], dy = geom[i++];
          x += (dx >> 1) ^ -(dx & 1); y += (dy >> 1) ^ -(dy & 1);
          if (cmd === 1) { cur = []; lines.push(cur); }
          cur.push(toLL(x, y));
        }
      }
    }
    return lines.filter((l) => l.length > 1);
  }

  function decodeTile(buf, z, x, y) {
    const p = new Pbf(new Uint8Array(buf));
    const out = { transportation: [], transportation_name: [] };
    while (p.pos < p.len) {
      const tag = p.varint(), f = tag >> 3, wt = tag & 7;
      if (f !== 3) { p.skip(wt); continue; }
      const L = readLayer(p);
      if (!LAYERS[L.name]) continue;
      for (const ft of L.raw) {
        if (ft.type !== 2 || !ft.geom) continue; // ラインのみ
        const props = {};
        if (ft.tags) for (let k = 0; k + 1 < ft.tags.length; k += 2) props[L.keys[ft.tags[k]]] = L.values[ft.tags[k + 1]];
        const lines = decodeLines(ft.geom, L.extent, z, x, y);
        let minX = 180, minY = 90, maxX = -180, maxY = -90;
        for (const ln of lines) for (const c of ln) {
          if (c[0] < minX) minX = c[0]; if (c[0] > maxX) maxX = c[0];
          if (c[1] < minY) minY = c[1]; if (c[1] > maxY) maxY = c[1];
        }
        out[L.name].push({ props, lines, bbox: [minX, minY, maxX, maxY] });
      }
    }
    return out;
  }

  function tileOf(lng, lat) {
    const n = Math.pow(2, Z);
    const x = Math.floor((lng + 180) / 360 * n);
    const r = lat * Math.PI / 180;
    const y = Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n);
    return [x, y];
  }

  function request(x, y) {
    const key = `${Z}/${x}/${y}`;
    if (cache.has(key)) { const e = cache.get(key); cache.delete(key); cache.set(key, e); return e; }
    if (!template || inflight >= 4) return null;
    const entry = { state: 'loading', data: null };
    cache.set(key, entry);
    inflight++;
    const url = template.replace('{z}', Z).replace('{x}', x).replace('{y}', y);
    fetch(url).then((r) => {
      if (r.status === 204 || r.status === 404) return new ArrayBuffer(0);
      if (!r.ok) throw new Error(r.status);
      return r.arrayBuffer();
    }).then((buf) => {
      entry.data = decodeTile(buf, Z, x, y); entry.state = 'ok';
    }).catch(() => {
      entry.state = 'err'; setTimeout(() => cache.delete(key), 5000);
    }).finally(() => { inflight--; });
    while (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
    return entry;
  }

  /* 位置 (lng,lat) から radius[m] 以内にかかるタイルの道路を返す（未取得なら取得開始し null） */
  function near(lng, lat, radius, layer) {
    const [x, y] = tileOf(lng, lat);
    const dLat = radius / 110574, dLng = radius / (111320 * Math.cos(lat * Math.PI / 180));
    const tiles = new Set([`${x},${y}`]);
    for (const [ax, ay] of [[-dLng, -dLat], [dLng, -dLat], [-dLng, dLat], [dLng, dLat]]) {
      const t = tileOf(lng + ax, lat + ay); tiles.add(`${t[0]},${t[1]}`);
    }
    const res = []; let ready = true;
    for (const k of tiles) {
      const [tx, ty] = k.split(',').map(Number);
      const e = request(tx, ty);
      if (!e || e.state !== 'ok') { if (!e || e.state === 'loading') ready = false; continue; }
      for (const f of e.data[layer]) {
        const b = f.bbox;
        if (lng < b[0] - dLng || lng > b[2] + dLng || lat < b[1] - dLat || lat > b[3] + dLat) continue;
        res.push(f);
      }
    }
    return { ready, features: res };
  }

  function setTemplate(t) { if (t && t !== template) { template = t; cache.clear(); } }

  return { near, setTemplate, decodeTile, tileOf };
})();
