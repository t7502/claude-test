/* ぶらりにっぽん — 有名建築物の簡易3Dモデル
 * MapLibre の fill-extrusion（押し出しポリゴン）を積み重ねて形を作る。
 * 各パーツは properties { color, base, height }（単位 m）を持つ GeoJSON ポリゴン。
 */
'use strict';

const Models = (() => {
  const D2R = Math.PI / 180;

  // 中心 (lng0, lat0) からのローカル座標 (x: 東 m, y: 北 m) → [lng, lat]
  function projector(lng0, lat0, rotDeg = 0) {
    const kx = 111320 * Math.cos(lat0 * D2R), ky = 110574;
    const c = Math.cos(rotDeg * D2R), s = Math.sin(rotDeg * D2R);
    return (x, y) => {
      const rx = x * c - y * s, ry = x * s + y * c;
      return [lng0 + rx / kx, lat0 + ry / ky];
    };
  }

  function rect(P, cx, cy, w, d) {
    const hw = w / 2, hd = d / 2;
    return [[P(cx - hw, cy - hd), P(cx + hw, cy - hd), P(cx + hw, cy + hd), P(cx - hw, cy + hd), P(cx - hw, cy - hd)]];
  }

  function ngon(P, cx, cy, r, n = 16, rot = 0) {
    const ring = [];
    for (let i = 0; i <= n; i++) {
      const a = (i % n) / n * Math.PI * 2 + rot * D2R;
      ring.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
    return [ring];
  }

  const lerp = (a, b, t) => a + (b - a) * t;

  class Builder {
    constructor(lng, lat, rot = 0) { this.P = projector(lng, lat, rot); this.features = []; }
    add(coords, base, height, color) {
      this.features.push({ type: 'Feature', properties: { base, height, color }, geometry: { type: 'Polygon', coordinates: coords } });
      return this;
    }
    box(cx, cy, w, d, base, top, color) { return this.add(rect(this.P, cx, cy, w, d), base, top, color); }
    cyl(cx, cy, r, base, top, color, n = 16, rot = 0) { return this.add(ngon(this.P, cx, cy, r, n, rot), base, top, color); }
    // 先細りの四角柱（段を重ねて近似）
    taperBox(w0, w1, h0, h1, steps, colorFn) {
      for (let i = 0; i < steps; i++) {
        const t = i / steps, t2 = (i + 1) / steps;
        const w = lerp(w0, w1, (t + t2) / 2);
        this.box(0, 0, w, w, lerp(h0, h1, t), lerp(h0, h1, t2), colorFn(i));
      }
      return this;
    }
    taperCyl(r0, r1, h0, h1, steps, colorFn, n = 16, rot = 0) {
      for (let i = 0; i < steps; i++) {
        const t = i / steps, t2 = (i + 1) / steps;
        this.cyl(0, 0, lerp(r0, r1, (t + t2) / 2), lerp(h0, h1, t), lerp(h0, h1, t2), colorFn(i), n, rot);
      }
      return this;
    }
    // 4本脚のトラス塔の脚部分
    legs(off0, off1, size, h0, h1, steps, colorFn) {
      for (let i = 0; i < steps; i++) {
        const t = i / steps, t2 = (i + 1) / steps;
        const o = lerp(off0, off1, (t + t2) / 2);
        for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          this.box(sx * o, sy * o, size, size, lerp(h0, h1, t), lerp(h0, h1, t2), colorFn(i));
        }
      }
      return this;
    }
  }

  /* ---- 日本の城（天守）ジェネレータ ---- */
  function castle(b, o) {
    const stone = o.stone || '#8f8a7e';
    // 石垣（2段で少し末広がり）
    b.box(0, 0, o.w + 14, o.d + 14, 0, o.sh * 0.5, stone);
    b.box(0, 0, o.w + 8, o.d + 8, o.sh * 0.5, o.sh, stone);
    const H = o.h - o.sh;
    const th = H / o.tiers;
    let z = o.sh;
    for (let i = 0; i < o.tiers; i++) {
      const k = 1 - (i / o.tiers) * 0.55;
      const w = o.w * k, d = o.d * k;
      const wallTop = z + th * 0.68;
      b.box(0, 0, w, d, z, wallTop, i === 0 && o.wall0 ? o.wall0 : o.wall);
      if (o.band) b.box(0, 0, w + 0.6, d + 0.6, wallTop - 1.2, wallTop, o.band);
      // 屋根（外に張り出す）
      b.box(0, 0, w + 6, d + 6, wallTop, wallTop + th * 0.16, o.roof);
      b.box(0, 0, w + 2.5, d + 2.5, wallTop + th * 0.16, z + th, o.roof);
      z += th;
    }
    // 最上部の大棟としゃちほこ
    b.box(0, 0, o.w * 0.3, 2.2, z, z + 2.2, o.roof);
    if (o.shachi) {
      b.box(-o.w * 0.14, 0, 1.6, 1.6, z + 2.2, z + 4.2, o.shachi);
      b.box(o.w * 0.14, 0, 1.6, 1.6, z + 2.2, z + 4.2, o.shachi);
    }
    return b;
  }

  const ORANGE = '#f0561f', WHITE = '#f4f4f0';

  const builders = {
    tokyoTower(b) {
      const band = (i) => (i % 2 === 0 ? ORANGE : WHITE);
      b.legs(44, 13, 9, 0, 100, 10, (i) => (i % 3 === 2 ? WHITE : ORANGE));
      b.box(0, 0, 40, 40, 58, 62, ORANGE); // 第一層のつなぎ
      b.taperBox(28, 23, 100, 145, 3, band);
      b.box(0, 0, 33, 33, 145, 160, '#e3e7ea'); // メインデッキ
      b.taperBox(21, 12, 160, 223, 6, band);
      b.box(0, 0, 14, 14, 223, 250, '#e3e7ea'); // トップデッキ
      b.taperBox(9, 4, 250, 300, 5, band);
      b.taperBox(2.6, 1.6, 300, 333, 3, band);
    },
    skytree(b) {
      const body = (i) => (i % 2 ? '#e9eef3' : '#d9e2ea');
      b.taperCyl(38, 21, 0, 340, 14, body, 12);
      b.cyl(0, 0, 27, 340, 375, '#93a9bc', 18); // 天望デッキ
      b.taperCyl(17, 15, 375, 445, 3, body, 14);
      b.cyl(0, 0, 19, 445, 455, '#93a9bc', 18); // 天望回廊
      b.taperCyl(13, 9, 455, 500, 2, body, 14);
      b.taperCyl(6, 1.5, 500, 634, 6, (i) => (i % 2 ? '#ffffff' : '#e6e6e6'), 10);
    },
    tsutenkaku(b) {
      const c = (i) => (i % 2 ? '#d5d8dc' : '#c3c7cc');
      b.box(0, 0, 32, 32, 0, 6, '#9aa0a6');
      b.legs(13, 9, 5, 6, 22, 3, c);
      b.taperBox(18, 14, 22, 88, 8, c);
      b.box(0, 0, 22, 22, 88, 98, '#f2e7c9'); // 展望台
      b.box(0, 0, 12, 12, 98, 103, '#eadfb5');
      b.taperBox(6, 2, 103, 108, 2, () => '#e0e0e0');
    },
    harukas(b) {
      const g = '#9fb4c6';
      b.box(0, 0, 75, 48, 0, 120, g);
      b.box(6, 0, 62, 42, 120, 220, '#a8bccc');
      b.box(10, 0, 46, 34, 220, 300, '#b3c5d4');
    },
    landmarkTower(b) {
      b.taperBox(72, 46, 0, 296, 12, (i) => (i % 2 ? '#cbc4b8' : '#bdb6a9'));
    },
    kyotoTower(b) {
      b.box(0, 0, 62, 34, 0, 31, '#e9e7e2');
      b.taperCyl(9.5, 6.5, 31, 98, 6, () => '#f7f7f7', 14);
      b.cyl(0, 0, 11, 98, 110, '#dfe4e8', 16);
      b.cyl(0, 0, 4, 110, 117, '#f2f2f2', 10);
      b.taperCyl(2.5, 0.8, 117, 131, 3, (i) => (i % 2 ? '#e34040' : '#f7f7f7'), 8);
    },
    kobeTower(b) {
      const red = '#d0222c';
      const prof = [13, 10.5, 8, 6, 5, 4.6, 5, 6, 7.5, 9];
      for (let i = 0; i < prof.length; i++) b.cyl(0, 0, prof[i], i * 9, (i + 1) * 9, red, 14);
      b.cyl(0, 0, 10.5, 90, 99, '#e8e8e8', 16);
      b.taperCyl(4, 1.5, 99, 108, 2, () => red, 10);
    },
    fukuokaTower(b) {
      b.cyl(0, 0, 22, 0, 6, '#c9d1d8', 3, 90);
      b.cyl(0, 0, 17, 6, 200, '#a9c3d8', 3, 90);
      b.cyl(0, 0, 12, 116, 124, '#dbe6ee', 3, 90);
      b.taperCyl(5, 1, 200, 234, 4, () => '#d8dde2', 6);
    },
    sapporoTower(b) {
      const c = (i) => (i % 2 ? '#f07a2c' : '#e8622a');
      b.box(0, 0, 28, 28, 0, 18, '#d8d4cc');
      b.legs(12, 6, 3, 18, 60, 6, c);
      b.taperBox(12, 9, 60, 90, 4, c);
      b.box(0, 0, 14, 14, 90, 97, '#f0f0f0'); // 展望台
      b.taperBox(8, 2, 97, 147, 8, c);
    },
    osakaCastle(b) { castle(b, { sh: 14, w: 34, d: 30, h: 55, tiers: 5, wall: '#f4f2ea', roof: '#4f9a86', band: '#c9a640', shachi: '#e3bd47' }); },
    nagoyaCastle(b) { castle(b, { sh: 19, w: 36, d: 32, h: 55, tiers: 5, wall: '#f5f3ee', roof: '#5e9f8f', shachi: '#e3bd47' }); },
    himejiCastle(b) { castle(b, { sh: 15, w: 30, d: 22, h: 46, tiers: 5, wall: '#fbfbf8', roof: '#7a7f86', shachi: '#7a7f86' }); },
    kumamotoCastle(b) { castle(b, { sh: 12, w: 30, d: 26, h: 42, tiers: 4, wall: '#262626', band: '#efefef', roof: '#55595e', shachi: '#55595e' }); },
    matsumotoCastle(b) { castle(b, { sh: 8, w: 20, d: 17, h: 30, tiers: 5, wall: '#1f1f1f', band: '#e8e8e8', roof: '#4b5055', shachi: '#4b5055' }); },
    shuriCastle(b) {
      b.box(0, 0, 44, 30, 0, 2, '#d8cdb8');
      b.box(0, 0, 30, 17, 2, 10, '#c8312a');
      b.box(0, 0, 36, 22, 10, 12, '#b5442c');
      b.box(0, 0, 26, 13, 12, 16, '#c8312a');
      b.box(0, 0, 30, 17, 16, 18.5, '#b5442c');
      b.box(0, 0, 14, 4, 18.5, 20, '#e0b23c');
    },
    kinkakuji(b) {
      const gold = '#d6ae3b', roof = '#3e352d';
      b.box(0, 0, 18, 14, 0, 4, '#b58f3a');
      b.box(0, 0, 20, 16, 4, 5, roof);
      b.box(0, 0, 16, 12, 5, 8, gold);
      b.box(0, 0, 18, 14, 8, 9, roof);
      b.box(0, 0, 10, 10, 9, 11.2, gold);
      b.box(0, 0, 12, 12, 11.2, 12, roof);
      b.box(0, 0, 1.5, 1.5, 12, 13.2, gold);
    },
    torii(b) {
      const red = '#d1322b';
      b.cyl(-5.5, 0, 1.2, 0, 16, red, 10);
      b.cyl(5.5, 0, 1.2, 0, 16, red, 10);
      // 控え柱
      for (const x of [-5.5, 5.5]) for (const y of [-3.2, 3.2]) b.cyl(x, y, 0.6, 0, 9, red, 8);
      b.box(0, 0, 18, 1.4, 11, 12.4, red);           // 貫
      b.box(0, 0, 21, 2.2, 14.4, 15.4, red);         // 島木
      b.box(0, 0, 24, 2.6, 15.4, 16.6, '#262626');   // 笠木
    },
  };

  function buildAll(landmarks) {
    const features = [];
    for (const lm of landmarks) {
      if (!lm.model || !builders[lm.model]) continue;
      const b = new Builder(lm.lng, lm.lat, lm.rot || 0);
      builders[lm.model](b);
      for (const f of b.features) features.push(f);
    }
    return { type: 'FeatureCollection', features };
  }

  return { buildAll };
})();
