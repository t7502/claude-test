/* ぶらりにっぽん — ゲーム本体 */
'use strict';

(() => {
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const EARTH = 40075016.686;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const angDiff = (a, b) => ((a - b + 540) % 360) - 180; // a - b を -180..180 に
  const now = () => performance.now();

  /* ---------- 設定の保存 ---------- */
  const SAVE_KEY = 'burari-nippon-v1';
  const saved = (() => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; } })();
  const opts = Object.assign({ roads: true, buildings: true, terrain: true, labels: true, mini: true }, saved.opts || {});
  function persist() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ vehicle: S.vehicleId, multIdx: S.multIdx, assist: S.assist, opts, start: S.start }));
    } catch (e) { /* noop */ }
  }

  /* ---------- 状態 ---------- */
  const S = {
    mode: 'setup', paused: false,
    vehicleId: VEHICLES[saved.vehicle] ? saved.vehicle : 'sedan',
    multIdx: Number.isInteger(saved.multIdx) ? clamp(saved.multIdx, 0, SPEED_MULTIPLIERS.length - 1) : 0,
    assist: saved.assist !== false,
    start: saved.start || null, dest: null,
    lng: 139.767, lat: 35.681, heading: 0, speed: 0, alt: 0,
    zoom: 17, zoomOffset: 0, cam: 0,
    input: { accel: false, brake: false, left: false, right: false },
    steer: 0, cruise: false, lastSteerT: 0, assistTarget: null, brakeHoldT: 0,
    dist: 0, gtime: 0,
    place: { pref: '', city: '', town: '' }, lastGeoPos: null, nearLm: new Set(), arrived: false,
  };
  const V = () => VEHICLES[S.vehicleId];
  const mult = () => SPEED_MULTIPLIERS[S.multIdx];

  /* ---------- 地図 ---------- */
  const map = new maplibregl.Map({
    container: 'map',
    style: MapStyle.build(),
    bounds: [[127.5, 25.5], [146.0, 45.6]],
    fitBoundsOptions: { padding: 20 },
    maxPitch: 85,
    attributionControl: { compact: true },
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    fadeDuration: 120,
  });
  window.__game = { map, S };

  map.on('error', (e) => { if (e && e.error) console.warn('[map]', e.error.message || e.error); });

  let startMarker = null;
  function setStartMarker(lng, lat) {
    if (!startMarker) {
      const el = document.createElement('div'); el.className = 'start-marker';
      startMarker = new maplibregl.Marker({ element: el });
    }
    startMarker.setLngLat([lng, lat]).addTo(map);
  }

  /* ---------- 住所（国土地理院 逆ジオコーダ） ---------- */
  let muniLoaded = false;
  function loadMuni() {
    if (muniLoaded) return; muniLoaded = true;
    window.GSI = window.GSI || {};
    const sc = document.createElement('script');
    sc.src = 'https://maps.gsi.go.jp/js/muni.js';
    document.head.appendChild(sc);
  }
  function muniName(code) {
    const arr = window.GSI && window.GSI.MUNI_ARRAY;
    const n = parseInt(code, 10);
    const pref = PREFECTURES[Math.floor(n / 1000)] || '';
    let city = '';
    if (arr) {
      const rec = arr[String(n)] || arr[code];
      if (rec) {
        const p = rec.split(',');
        city = (p[3] || '').replace(/[\s　]+/g, '');
      }
    }
    return { pref, city };
  }
  async function reverseGeocode(lng, lat) {
    const url = `https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${lat.toFixed(6)}&lon=${lng.toFixed(6)}`;
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 4000);
    try {
      const r = await fetch(url, { signal: ctl.signal });
      const j = await r.json();
      if (!j || !j.results) return null;
      const m = muniName(j.results.muniCd);
      return { pref: m.pref, city: m.city, town: j.results.lv01Nm && j.results.lv01Nm !== '－' ? j.results.lv01Nm : '' };
    } catch (e) { return null; } finally { clearTimeout(to); }
  }

  // ジオコーダが使えない時：画面上の地名ラベルから一番近いものを探す
  function nearestPlaceLabel() {
    const c = map.project([S.lng, S.lat]);
    let best = null, bd = Infinity;
    const layers = ['place-small', 'place-town', 'place-city'].filter((l) => map.getLayer(l));
    let feats = [];
    try { feats = map.queryRenderedFeatures({ layers }); } catch (e) { return null; }
    for (const f of feats) {
      if (f.geometry.type !== 'Point') continue;
      const p = map.project(f.geometry.coordinates);
      const d = Math.hypot(p.x - c.x, p.y - c.y);
      if (d < bd) { bd = d; best = f; }
    }
    return best ? (best.properties['name:ja'] || best.properties.name) : null;
  }

  /* ---------- 設定画面 UI ---------- */
  function multText(m) { return '×' + m.toLocaleString(); }
  function fmtDur(sec) {
    if (!isFinite(sec)) return '—';
    if (sec < 60) return Math.max(1, Math.round(sec)) + '秒';
    const m = Math.round(sec / 60);
    if (m < 60) return m + '分';
    const h = Math.floor(m / 60), mm = m % 60;
    if (h < 48) return h + '時間' + (mm ? mm + '分' : '');
    return Math.round(h / 24) + '日';
  }
  function fmtDist(m) { return m < 1000 ? Math.round(m) + ' m' : (m < 100000 ? (m / 1000).toFixed(1) : Math.round(m / 1000).toLocaleString()) + ' km'; }

  function renderGroupTabs() {
    const box = $('groupTabs'); box.innerHTML = '';
    for (const g of VEHICLE_GROUPS) {
      const b = document.createElement('button');
      b.className = 'tab' + (g.items.includes(S.vehicleId) ? ' on' : '');
      b.innerHTML = `<span class="ic">${g.icon}</span>${g.label}`;
      b.onclick = () => { if (!g.items.includes(S.vehicleId)) setVehicle(g.items[0]); };
      box.appendChild(b);
    }
  }
  function renderVehicleChips(boxId, all) {
    const box = $(boxId); box.innerHTML = '';
    const g = VEHICLE_GROUPS.find((x) => x.items.includes(S.vehicleId));
    const ids = all ? Object.keys(VEHICLES) : g.items;
    for (const id of ids) {
      const b = document.createElement('button');
      b.className = 'chip' + (id === S.vehicleId ? ' on' : '');
      b.textContent = `${VEHICLES[id].label}（最高${VEHICLES[id].max}km/h）`;
      b.onclick = () => setVehicle(id);
      box.appendChild(b);
    }
  }
  function setVehicle(id) {
    const wasPlane = V().plane;
    S.vehicleId = id;
    S.speed = clamp(S.speed, -V().rev / 3.6, V().max / 3.6);
    if (wasPlane && !V().plane) S.alt = 0;
    renderGroupTabs(); renderVehicleChips('vehicleChips'); renderVehicleChips('vehicleChips2', true);
    renderVehicleSprite(); updateMultUI(); persist();
  }
  function updateMultUI() {
    const m = mult();
    for (const id of ['multLabel', 'multLabel2']) $(id).textContent = multText(m);
    $('multBtn').textContent = multText(m);
    $('multRange').value = $('multRange2').value = S.multIdx;
    const v = V();
    const cruise = (v.plane ? 900 : v.max * (v.group === 'car' ? 0.7 : 0.85)) / 3.6; // 想定巡航 m/s
    const t1 = 400000 / (cruise * m), t2 = 1550000 / (cruise * m);
    $('multHint').innerHTML = `${v.label}・巡航 約${Math.round(cruise * 3.6)}km/h ×${m.toLocaleString()} の場合<br>` +
      `東京→大阪（直線 約400km）：約${fmtDur(t1)} ／ 東京→那覇（約1,550km）：約${fmtDur(t2)}`;
  }
  function setMult(i) { S.multIdx = clamp(i, 0, SPEED_MULTIPLIERS.length - 1); updateMultUI(); persist(); }

  function setStart(st) {
    S.start = st;
    $('startName').textContent = st.name;
    $('startBtn').disabled = false;
    setStartMarker(st.lng, st.lat);
    for (const c of $('spotChips').children) c.classList.toggle('on', c.textContent === st.name);
    persist();
  }

  function initSetupUI() {
    for (const sp of START_SPOTS) {
      const b = document.createElement('button');
      b.className = 'chip'; b.textContent = sp.name;
      b.onclick = () => { setStart({ ...sp }); map.flyTo({ center: [sp.lng, sp.lat], zoom: 13, duration: 1800 }); };
      $('spotChips').appendChild(b);
    }
    const sel = $('destSelect');
    const groups = [['ランドマーク', LANDMARKS], ['主要な駅・空港など', START_SPOTS]];
    for (const [label, list] of groups) {
      const og = document.createElement('optgroup'); og.label = label;
      list.forEach((l, i) => { const o = document.createElement('option'); o.value = label[0] + i; o.textContent = l.name; og.appendChild(o); });
      sel.appendChild(og);
    }
    sel.onchange = () => {
      const v = sel.value;
      if (!v) { S.dest = null; return; }
      const list = v[0] === 'ラ' ? LANDMARKS : START_SPOTS;
      const d = list[parseInt(v.slice(1), 10)];
      S.dest = { name: d.name, lng: d.lng, lat: d.lat };
    };
    $('multRange').oninput = (e) => setMult(+e.target.value);
    $('multRange2').oninput = (e) => setMult(+e.target.value);
    $('startBtn').onclick = startTrip;
    $('sheetHandle').onclick = () => $('setup').classList.toggle('collapsed');

    renderGroupTabs(); renderVehicleChips('vehicleChips'); renderVehicleChips('vehicleChips2', true); updateMultUI();
    if (S.start) setStart(S.start);

    map.on('click', async (e) => {
      if (S.mode !== 'setup') return;
      const { lng, lat } = e.lngLat;
      const st = { name: `地図で選んだ地点（${lat.toFixed(3)}, ${lng.toFixed(3)}）`, lng, lat, heading: 0 };
      setStart(st);
      loadMuni();
      const a = await reverseGeocode(lng, lat);
      if (a && S.start === st && (a.pref || a.city)) { st.name = `${a.pref}${a.city}${a.town}`; setStart(st); }
    });
  }

  /* ---------- 移動開始 / 終了 ---------- */
  const HANDLERS = ['dragPan', 'scrollZoom', 'boxZoom', 'dragRotate', 'keyboard', 'doubleClickZoom', 'touchZoomRotate', 'touchPitch'];
  const playPadding = () => ({ top: Math.round(window.innerHeight * 0.45), bottom: 0, left: 0, right: 0 });

  function bearingTo(lng, lat) {
    const kx = 111320 * Math.cos(S.lat * D2R), ky = 110574;
    return (Math.atan2((lng - S.lng) * kx, (lat - S.lat) * ky) * R2D + 360) % 360;
  }
  function distTo(lng, lat) {
    // 球面距離（ハバーサイン）
    const p1 = S.lat * D2R, p2 = lat * D2R, dp = p2 - p1, dl = (lng - S.lng) * D2R;
    const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 2 * 6371008 * Math.asin(Math.min(1, Math.sqrt(a)));
  }
  function bearingGreat(lng, lat) {
    const p1 = S.lat * D2R, p2 = lat * D2R, dl = (lng - S.lng) * D2R;
    const y = Math.sin(dl) * Math.cos(p2), x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return (Math.atan2(y, x) * R2D + 360) % 360;
  }

  function startTrip() {
    if (!S.start) return;
    S.mode = 'intro'; S.paused = false;
    S.lng = S.start.lng; S.lat = S.start.lat;
    S.heading = S.dest ? bearingGreat(S.dest.lng, S.dest.lat) : (S.start.heading || 0);
    S.speed = 0; S.alt = 0; S.dist = 0; S.gtime = 0; S.cruise = false; S.zoomOffset = 0;
    S.arrived = false; S.nearLm.clear(); S.place = { pref: '', city: '', town: '' }; S.lastGeoPos = null;
    trail.length = 0;
    document.body.className = 'mode-play';
    $('setup').hidden = true; $('hud').hidden = false;
    $('cruiseBtn').classList.remove('on');
    $('assistBtn').classList.toggle('on', S.assist);
    if (startMarker) startMarker.remove();
    HANDLERS.forEach((h) => map[h].disable());
    applyOpts();
    setDest();
    renderVehicleSprite();
    $('vehicle').style.visibility = 'hidden';
    loadMuni();
    ensureMini();
    S.zoom = V().zoom;
    map.once('moveend', () => {
      if (S.mode !== 'intro') return;
      S.mode = 'play';
      $('vehicle').style.visibility = '';
      toast(S.start.name.startsWith('地図で') ? '出発！' : `${S.start.name}から出発！`);
      updatePlace(true);
    });
    // ※ 動きを減らす設定の端末では flyTo が即座に完了するため、リスナー登録後に呼ぶ
    map.setPadding(playPadding());
    map.flyTo({ center: [S.lng, S.lat], zoom: S.zoom, pitch: V().pitch, bearing: S.heading, duration: 3200, essential: true });
  }

  function backToSetup() {
    S.mode = 'setup';
    $('pause').hidden = true; $('hud').hidden = true; $('setup').hidden = false; $('setup').classList.remove('collapsed');
    document.body.className = 'mode-setup';
    setTerrain(false);
    HANDLERS.forEach((h) => map[h].enable());
    const name = [S.place.pref, S.place.city, S.place.town].join('') || '前回の到達地点';
    setStart({ name, lng: S.lng, lat: S.lat, heading: S.heading });
    map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
    map.flyTo({ center: [S.lng, S.lat], zoom: Math.min(map.getZoom(), 11), pitch: 0, bearing: 0, duration: 1800 });
  }

  function setDest() {
    const src = map.getSource('dest');
    if (src) src.setData({ type: 'FeatureCollection', features: S.dest ? [{ type: 'Feature', properties: { name: S.dest.name }, geometry: { type: 'Point', coordinates: [S.dest.lng, S.dest.lat] } }] : [] });
    $('destBox').hidden = !S.dest;
    if (S.dest) $('destName').textContent = '目的地：' + S.dest.name;
  }

  /* ---------- 表示オプション ---------- */
  const LABEL_LAYERS = ['place-small', 'place-town', 'place-city', 'place-pref', 'station', 'airport', 'road-label', 'peak', 'water-name'];
  function setVis(ids, on) {
    for (const id of ids) {
      try { if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); } catch (e) { /* スタイル読込中 */ }
    }
  }
  function setTerrain(on) { try { map.setTerrain(on ? { source: 'dem', exaggeration: 1 } : null); } catch (e) { /* noop */ } }
  function applyOpts() {
    setVis(['road-casing', 'road-minor', 'road-major'], opts.roads);
    setVis(['buildings-3d'], opts.buildings);
    setVis(LABEL_LAYERS, opts.labels);
    if (S.mode !== 'setup') setTerrain(opts.terrain);
    $('mini').hidden = !opts.mini;
    for (const k of Object.keys(opts)) { const el = $('opt' + k[0].toUpperCase() + k.slice(1)); if (el) el.checked = opts[k]; }
  }

  /* ---------- ミニマップ ---------- */
  let mini = null, miniZoomIdx = 0;
  const MINI_ZOOMS = [9, 12, 6];
  const trail = [];
  function ensureMini() {
    if (mini || !opts.mini) return;
    try {
      mini = new maplibregl.Map({ container: 'miniMap', style: MapStyle.buildMini(), center: [S.lng, S.lat], zoom: MINI_ZOOMS[0], interactive: false, attributionControl: false, pixelRatio: 1, fadeDuration: 0 });
    } catch (e) { mini = null; }
  }
  $('mini').addEventListener('click', () => {
    miniZoomIdx = (miniZoomIdx + 1) % MINI_ZOOMS.length;
    $('mini').classList.toggle('big', miniZoomIdx === 2);
    if (mini) setTimeout(() => mini.resize(), 250);
  });

  /* ---------- 乗り物の表示 ---------- */
  function renderVehicleSprite() {
    const v = V();
    const el = $('vehicle');
    el.className = 'vehicle ' + v.group;
    el.innerHTML = Sprites.svg(S.vehicleId);
    $('assistBtn').hidden = !!v.plane;
  }

  /* ---------- 入力 ---------- */
  function bindHold(id, key) {
    const el = $(id);
    const on = (e) => { e.preventDefault(); S.input[key] = true; el.classList.add('active'); try { el.setPointerCapture(e.pointerId); } catch (_) { /* noop */ } };
    const off = () => { S.input[key] = false; el.classList.remove('active'); };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('lostpointercapture', off);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  bindHold('accelBtn', 'accel'); bindHold('brakeBtn', 'brake'); bindHold('leftBtn', 'left'); bindHold('rightBtn', 'right');

  const KEYMAP = { ArrowUp: 'accel', KeyW: 'accel', ArrowDown: 'brake', KeyS: 'brake', Space: 'brake', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  window.addEventListener('keydown', (e) => {
    if (S.mode !== 'play') return;
    if (KEYMAP[e.code]) { S.input[KEYMAP[e.code]] = true; e.preventDefault(); }
    if (e.code === 'KeyC') toggleCruise();
    if (e.code === 'Escape') togglePause();
  });
  window.addEventListener('keyup', (e) => { if (KEYMAP[e.code]) S.input[KEYMAP[e.code]] = false; });
  window.addEventListener('blur', () => { for (const k in S.input) S.input[k] = false; });

  function toggleCruise() {
    S.cruise = !S.cruise;
    $('cruiseBtn').classList.toggle('on', S.cruise);
    toast(S.cruise ? `クルーズ ON（${Math.round(Math.abs(S.speed) * 3.6)}km/h を維持）` : 'クルーズ OFF', 1400);
  }
  $('cruiseBtn').onclick = toggleCruise;
  $('assistBtn').onclick = () => {
    S.assist = !S.assist; $('assistBtn').classList.toggle('on', S.assist); persist();
    toast(S.assist ? '道路アシスト ON：道なりに自動でハンドルを切ります' : '道路アシスト OFF', 1800);
  };
  const QUICK_MULTS = [1, 10, 100, 1000, 10000];
  $('multBtn').onclick = () => {
    const m = mult();
    const next = QUICK_MULTS.find((x) => x > m) || 1;
    setMult(SPEED_MULTIPLIERS.indexOf(next));
    toast('倍速 ' + multText(next), 1000);
  };
  $('zoomIn').onclick = () => { S.zoomOffset = clamp(S.zoomOffset + 0.75, -6, 2); };
  $('zoomOut').onclick = () => { S.zoomOffset = clamp(S.zoomOffset - 0.75, -6, 2); };
  const CAMS = ['後方視点', '見下ろし視点', '真上視点（地図）'];
  $('camBtn').onclick = () => { S.cam = (S.cam + 1) % CAMS.length; toast(CAMS[S.cam], 1000); };
  function togglePause() {
    if (S.mode !== 'play') return;
    S.paused = !S.paused;
    $('pause').hidden = !S.paused;
    if (S.paused) renderVehicleChips('vehicleChips2', true);
  }
  $('pauseBtn').onclick = togglePause;
  $('resumeBtn').onclick = togglePause;
  $('toSetupBtn').onclick = backToSetup;
  for (const k of Object.keys(opts)) {
    const el = $('opt' + k[0].toUpperCase() + k.slice(1));
    el.onchange = () => { opts[k] = el.checked; if (k === 'mini') ensureMini(); applyOpts(); persist(); };
  }

  /* ---------- トースト ---------- */
  let toastTimer = 0;
  function toast(msg, ms = 2600) {
    const el = $('toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  /* ---------- 物理 ---------- */
  function physics(dt) {
    const v = V(), m = mult();
    const vmax = v.max / 3.6, vrev = v.rev / 3.6;
    const I = S.input;

    // ハンドル（なめらかに）
    const st = (I.right ? 1 : 0) - (I.left ? 1 : 0);
    S.steer += (st - S.steer) * Math.min(1, dt * 7);
    if (st !== 0) S.lastSteerT = now();

    // アクセル・ブレーキ
    if (I.accel && !I.brake) {
      S.speed += (S.speed < 0 ? v.brake : v.accel * (1 - 0.55 * clamp(S.speed / vmax, 0, 1))) * dt;
      S.brakeHoldT = 0;
    } else if (I.brake) {
      if (S.speed > 0.05) { S.speed = Math.max(0, S.speed - v.brake * dt); S.brakeHoldT = 0; if (S.cruise) toggleCruise(); }
      else {
        S.brakeHoldT += dt;
        if (vrev > 0 && S.brakeHoldT > 0.35) S.speed = Math.max(-vrev, S.speed - v.accel * 0.6 * dt);
        else S.speed = Math.min(0, S.speed + v.brake * dt);
      }
    } else if (!S.cruise) {
      const dec = v.drag + (Math.abs(S.speed) / vmax) * v.drag;
      S.speed = S.speed > 0 ? Math.max(0, S.speed - dec * dt) : Math.min(0, S.speed + dec * dt);
      S.brakeHoldT = 0;
    }
    S.speed = clamp(S.speed, -vrev, vmax);

    // 飛行機の高度
    if (v.plane) {
      const vTake = 75, vCruise = 230;
      const target = S.speed < vTake ? 0 : Math.min(10000, (S.speed - vTake) / (vCruise - vTake) * 10000);
      const rate = Math.min(3000, 12 * Math.sqrt(m) * (target < S.alt ? 1.5 : 1));
      S.alt += clamp(target - S.alt, -rate * dt, rate * dt);
    }

    // 旋回
    const sp = Math.abs(S.speed);
    let yaw;
    if (v.plane) yaw = v.turn * S.steer * (S.alt > 5 ? 1 : clamp(sp / 8, 0, 1) * 2);
    else if (v.group === 'foot') yaw = v.turn * S.steer;
    else yaw = v.turn * S.steer * clamp(sp / 3, 0, 1) / (1 + sp / 28);
    if (S.speed < 0) yaw = -yaw;
    S.heading += yaw * dt;

    // 道路アシスト（ハンドルを触っていない時だけ）
    if (S.assistTarget !== null && Math.abs(S.steer) < 0.05) {
      const diff = angDiff(S.assistTarget, S.heading);
      const maxRate = (v.roads === 'foot' ? 140 : 80) * (m >= 20 ? 2 : 1);
      S.heading += clamp(diff * Math.min(1, dt * 5), -maxRate * dt, maxRate * dt);
    }
    S.heading = (S.heading + 360) % 360;

    // 移動（飛行機は地上走行中だけ倍速を最大×10に抑える）
    const mEff = v.plane && S.alt < 5 ? Math.min(m, 10) : m;
    const d = S.speed * mEff * dt;
    if (d !== 0) {
      const h = S.heading * D2R;
      S.lat = clamp(S.lat + (d * Math.cos(h)) / 110574, -84, 84);
      S.lng += (d * Math.sin(h)) / (111320 * Math.cos(S.lat * D2R));
      if (S.lng > 180) S.lng -= 360; else if (S.lng < -180) S.lng += 360;
      S.dist += Math.abs(d);
      S.gtime += dt * mEff;
    }
  }

  /* ---------- 道路アシスト：近くの道路の向きを調べる ---------- */
  const CLASS_W = { motorway: 6, trunk: 5, primary: 4, secondary: 3, tertiary: 2, minor: 1, service: 0, track: -2, path: -2, busway: 1 };
  // 点(0,0)から線分ABへの最近点（ローカル座標 m）
  function nearestOnLines(lines, kx, ky, cb) {
    for (const ln of lines) {
      for (let i = 0; i < ln.length - 1; i++) {
        const ax = (ln[i][0] - S.lng) * kx, ay = (ln[i][1] - S.lat) * ky;
        const bx = (ln[i + 1][0] - S.lng) * kx, by = (ln[i + 1][1] - S.lat) * ky;
        const sx = bx - ax, sy = by - ay, L2 = sx * sx + sy * sy;
        if (L2 < 0.25) continue;
        const t = clamp(-(ax * sx + ay * sy) / L2, 0, 1);
        const qx = ax + sx * t, qy = ay + sy * t;
        cb(Math.hypot(qx, qy), qx, qy, sx, sy, L2);
      }
    }
  }

  function assistUpdate() {
    S.assistTarget = null;
    const v = V();
    const veff = Math.abs(S.speed) * mult();
    if (!S.assist || !v.roads || Math.abs(S.speed) < 0.6 || veff > 3000 || now() - S.lastSteerT < 700) return;
    const maxD = clamp(veff * 0.5, 12, 150);
    const { features } = RoadData.near(S.lng, S.lat, maxD, 'transportation');
    if (!features.length) return;
    const kx = 111320 * Math.cos(S.lat * D2R), ky = 110574;
    const travel = S.speed >= 0 ? S.heading : S.heading + 180;
    let best = null;
    for (const f of features) {
      const cls = f.props.class;
      if (!(cls in CLASS_W)) continue;
      if (v.roads === 'car' && (cls === 'path' || cls === 'track')) continue;
      if (f.props.brunnel === 'tunnel' && cls === 'path') continue;
      const bonus = CLASS_W[cls] * 1.2;
      nearestOnLines(f.lines, kx, ky, (dist, qx, qy, sx, sy, L2) => {
        if (dist > maxD) return;
        let brg = Math.atan2(sx, sy) * R2D, dir = 1;
        let diff = angDiff(brg, travel);
        if (Math.abs(diff) > 90) { dir = -1; brg += 180; diff = angDiff(brg, travel); }
        if (Math.abs(diff) > 55) return;
        const score = dist + Math.abs(diff) * 0.35 - bonus;
        if (!best || score < best.score) {
          const L = Math.sqrt(L2);
          best = { score, qx, qy, ux: dir * sx / L, uy: dir * sy / L };
        }
      });
    }
    if (!best) return;
    const look = clamp(veff * 0.7, 8, 160);
    const tx = best.qx + best.ux * look, ty = best.qy + best.uy * look;
    let tgt = Math.atan2(tx, ty) * R2D;
    if (S.speed < 0) tgt += 180;
    S.assistTarget = (tgt + 360) % 360;
  }

  /* ---------- カメラ ---------- */
  function camera(dt) {
    const v = V(), m = mult();
    const veff = Math.abs(S.speed) * m;
    let target = v.zoom;
    if (veff > 1) {
      const zs = Math.log2(EARTH * Math.cos(S.lat * D2R) / (512 * veff / 150));
      target = Math.min(target, zs + 0.3);
    }
    if (v.plane) target = Math.min(target, 17 - Math.log2(1 + S.alt / 120));
    if (S.cam === 1) target -= 1;
    if (S.cam === 2) target -= 1.5;
    target = clamp(target + S.zoomOffset, 3, 20.5);
    S.zoom += (target - S.zoom) * Math.min(1, dt * 1.6);
    const pitch = S.cam === 0 ? v.pitch : (S.cam === 1 ? 50 : 0);
    map.jumpTo({ center: [S.lng, S.lat], zoom: S.zoom, bearing: S.heading, pitch });
  }

  /* ---------- HUD ---------- */
  let lastHud = 0, lastAssist = 0, lastRoad = 0, lastGeo = 0, lastMini = 0, lastTrail = 0, geoBusy = false;
  function roadLabel(p) {
    const name = p['name:ja'] || p.name || '';
    let ref = p.ref || '';
    if (ref && /^\d+$/.test(ref) && p.class === 'trunk') ref = `国道${ref}号`;
    return { name, ref };
  }
  const CLASS_JA = { motorway: '高速道路', trunk: '国道（幹線道路）', primary: '主要道路', secondary: '県道クラスの道路', tertiary: '一般道', minor: '生活道路', service: '構内道路', path: '歩道・小道', track: '農道・林道' };
  function updateRoad() {
    if ((V().plane && S.alt > 30) || Math.abs(S.speed) * mult() > 3000) { $('roadBox').hidden = true; return; }
    const kx = 111320 * Math.cos(S.lat * D2R), ky = 110574;
    const pick = (layer, maxD, ok) => {
      let best = null, bd = maxD;
      for (const f of RoadData.near(S.lng, S.lat, maxD, layer).features) {
        if (!ok(f.props)) continue;
        nearestOnLines(f.lines, kx, ky, (d) => { if (d < bd) { bd = d; best = f; } });
      }
      return best;
    };
    const wide = V().roads === 'car' ? 22 : 14;
    let name = '', ref = '';
    const f = pick('transportation_name', wide, (p) => p.name || p.ref || p['name:ja']);
    if (f) ({ name, ref } = roadLabel(f.props));
    if (!name && !ref) {
      const g = pick('transportation', wide * 0.7, (p) => p.class in CLASS_JA);
      if (g) name = CLASS_JA[g.props.class] + (g.props.brunnel === 'bridge' ? '（橋）' : g.props.brunnel === 'tunnel' ? '（トンネル）' : '');
    }
    $('roadBox').hidden = !(name || ref);
    $('roadRef').textContent = ref; $('roadName').textContent = name;
  }

  async function updatePlace(force) {
    if (geoBusy) return;
    if (!force && S.lastGeoPos && distTo(S.lastGeoPos[0], S.lastGeoPos[1]) < 40) return;
    geoBusy = true;
    S.lastGeoPos = [S.lng, S.lat];
    const a = await reverseGeocode(S.lng, S.lat);
    geoBusy = false;
    if (S.mode !== 'play') return;
    if (a && (a.pref || a.city)) {
      if (a.pref && a.pref !== S.place.pref && S.place.pref) toast(`${a.pref}に入りました`, 3000);
      else if (a.city && a.city !== S.place.city && S.place.city) toast(`${a.city}に入りました`, 2400);
      S.place = a;
      $('placePref').textContent = [a.pref, a.city].filter(Boolean).join(' ');
      $('placeName').textContent = a.town || a.city || a.pref;
    } else {
      const n = nearestPlaceLabel();
      $('placePref').textContent = a === null ? '付近の地名' : '海上・県外';
      $('placeName').textContent = n || (V().plane && S.alt > 30 ? '上空' : '—');
    }
  }

  function updateHud() {
    const v = V(), m = mult();
    const kmh = Math.abs(S.speed) * 3.6;
    $('spd').textContent = Math.round(kmh);
    $('effSpd').textContent = m > 1 ? `体感 ${Math.round(kmh * m).toLocaleString()} km/h（${multText(m)}）` : '';
    $('altBox').hidden = !v.plane;
    if (v.plane) $('altBox').textContent = S.alt < 5 ? (kmh > 1 ? '地上走行中（270km/h で離陸）' : '地上') : `高度 ${Math.round(S.alt).toLocaleString()} m`;
    $('dist').textContent = '移動 ' + fmtDist(S.dist);
    $('gtime').textContent = '実時間換算 ' + fmtDur(S.gtime);
    $('needle').style.transform = `rotate(${-S.heading}deg)`;

    // 乗り物の見た目
    const el = $('vehicle');
    el.style.transform = `rotate(${S.steer * (v.plane ? 18 : 5)}deg)`;
    el.classList.toggle('braking', S.input.brake || (S.speed < -0.05));
    el.classList.toggle('moving', Math.abs(S.speed) > 0.2);
    if (v.group === 'foot' || v.group === 'bike') el.style.setProperty('--bobT', clamp(2.2 / (Math.abs(S.speed) + 0.6), 0.25, 1.2) + 's');
    const scale = v.plane ? clamp(1 - S.alt / 20000, 0.55, 1) : 1;
    el.querySelector('.veh').style.transform = `translateY(-82%) scale(${scale})`;

    // 最寄りのランドマーク
    let best = null, bd = Infinity;
    for (const lm of LANDMARKS) { const d = distTo(lm.lng, lm.lat); if (d < bd) { bd = d; best = lm; } }
    if (best) {
      $('lmName').textContent = best.name;
      $('lmDist').textContent = fmtDist(bd);
      $('lmArrow').style.transform = `rotate(${bearingGreat(best.lng, best.lat) - S.heading - 90}deg)`;
      const near = v.plane ? 3000 : 400;
      if (bd < near && !S.nearLm.has(best.name)) { S.nearLm.add(best.name); toast(`★ ${best.name} の近くです`, 3000); }
    }
    // 目的地
    if (S.dest) {
      const d = distTo(S.dest.lng, S.dest.lat);
      $('destDist').textContent = fmtDist(d);
      $('destArrow').style.transform = `rotate(${bearingGreat(S.dest.lng, S.dest.lat) - S.heading - 90}deg)`;
      const arr = v.plane ? 3000 : 150;
      if (!S.arrived && d < arr) { S.arrived = true; toast(`🏁 ${S.dest.name} に到着！（実時間換算 ${fmtDur(S.gtime)}）`, 5000); }
    }
  }

  function updateMini() {
    if (!mini || !opts.mini) return;
    mini.jumpTo({ center: [S.lng, S.lat], zoom: MINI_ZOOMS[miniZoomIdx] });
    document.querySelector('.mini-me').style.transform = `rotate(${S.heading}deg)`;
    const src = mini.getSource('trail');
    if (src) src.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: trail.length > 1 ? trail : [[S.lng, S.lat], [S.lng, S.lat]] } });
  }

  /* ---------- メインループ ---------- */
  let last = now();
  function frame() {
    const t = now();
    const dt = Math.min(0.1, (t - last) / 1000);
    last = t;
    if (S.mode === 'play' && !S.paused) {
      if (t - lastAssist > 90) { lastAssist = t; assistUpdate(); }
      physics(dt);
      camera(dt);
      if (t - lastHud > 100) { lastHud = t; updateHud(); }
      if (t - lastRoad > 400) { lastRoad = t; updateRoad(); }
      if (t - lastGeo > 1500) { lastGeo = t; updatePlace(false); }
      if (t - lastTrail > 1000) {
        lastTrail = t;
        const p = trail[trail.length - 1];
        if (!p || Math.abs(p[0] - S.lng) + Math.abs(p[1] - S.lat) > 0.0003) { trail.push([S.lng, S.lat]); if (trail.length > 3000) trail.shift(); }
      }
      if (t - lastMini > 200) { lastMini = t; updateMini(); }
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => { if (S.mode === 'play' || S.mode === 'intro') map.setPadding(playPadding()); });

  let booted = false;
  function boot() {
    if (booted) return; booted = true;
    // 出典表示は小さく折りたたむ（ⓘ で開く）
    document.querySelectorAll('.maplibregl-ctrl-attrib').forEach((el) => el.classList.remove('maplibregl-compact-show'));
    applyOpts();
    initSetupUI();
    requestAnimationFrame(frame);
  }
  map.on('load', boot);
  map.on('sourcedata', (e) => {
    if (e.sourceId === 'omt') { const src = map.getSource('omt'); if (src && src.tiles && src.tiles[0]) RoadData.setTemplate(src.tiles[0]); }
  });
  // 一部のタイルが読めなくてもUIは動かす
  setTimeout(boot, 8000);
})();
