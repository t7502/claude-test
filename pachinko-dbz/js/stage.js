/* =========================================================
 *  液晶ステージ：時間管理 / ボタン / 図柄 / 演出ステップ描画
 * ========================================================= */
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- 時間（倍速・スキップ対応） ---------- */
const T = {
  speed: 1,
  skip: false,         // 現在の演出を飛ばす
  instant: false,      // 演出なしモード
  pending: new Set(),
  wait(ms) {
    if (this.skip || this.instant) return Promise.resolve();
    return new Promise(res => {
      const o = { res, id: 0 };
      o.id = setTimeout(() => { this.pending.delete(o); res(); }, Math.max(0, ms / this.speed));
      this.pending.add(o);
    });
  },
  skipNow() {
    this.skip = true;
    for (const o of this.pending) { clearTimeout(o.id); o.res(); }
    this.pending.clear();
    Btn.release();
  },
};

/* ---------- ボタン ---------- */
const Btn = {
  auto: false,
  _press: null, _down: false, _mash: 0, _waiting: false,
  el: null,
  init() {
    this.el = $('#pushBtn');
    const down = (e) => { e.preventDefault(); this.down(); };
    const up = (e) => { e.preventDefault(); this.up(); };
    this.el.addEventListener('pointerdown', down);
    this.el.addEventListener('pointerup', up);
    this.el.addEventListener('pointerleave', () => { if (this._down) this.up(); });
    window.addEventListener('keydown', (e) => {
      if (!(e.code === 'Space' || e.code === 'Enter')) return;
      if (/INPUT|SELECT|TEXTAREA|SUMMARY/.test(document.activeElement?.tagName || '')) return;
      e.preventDefault();
      if (!e.repeat) this.down();
    });
    window.addEventListener('keyup', (e) => {
      if (!(e.code === 'Space' || e.code === 'Enter')) return;
      if (/INPUT|SELECT|TEXTAREA|SUMMARY/.test(document.activeElement?.tagName || '')) return;
      e.preventDefault();
      this.up();
    });
  },
  down() {
    SFX.unlock();
    this._down = true;
    this.el.classList.add('pressed');
    if (this._waiting) { this._mash++; if (this._press) this._press('down'); }
  },
  up() {
    this._down = false;
    this.el.classList.remove('pressed');
    if (this._press) this._press('up');
  },
  release() { if (this._press) this._press('force'); },
  /* type: 0 PUSH / 1 連打 / 2 長押し / 3 剣 */
  async wait({ type = 0, color = 0, label = 'PUSH', timeout = 5000 } = {}) {
    if (T.skip || T.instant) return;
    const colorName = ['white', 'blue', 'green', 'red', 'gold', 'rainbow'][color] || 'white';
    const prompt = document.createElement('div');
    prompt.className = `btn-prompt bt${type} bc-${colorName}`;
    const typeLabel = ['PUSH!!', '連打!!', '長押し!!', 'Zソードを押せ!!'][type];
    prompt.innerHTML = `<div class="bp-ring"><div class="bp-core">${type === 3 ? '⚔' : '●'}</div></div>
      <div class="bp-label">${esc(label)}</div><div class="bp-type">${typeLabel}</div>
      <div class="bp-gauge"><i></i></div>`;
    Stage.fx.appendChild(prompt);
    this.el.className = `push bc-${colorName} bt${type} active`;
    SFX.buttonAppear(color);
    if (color >= 4) SFX.kyuin();
    this._waiting = true; this._mash = 0;
    const gauge = prompt.querySelector('.bp-gauge i');
    const tmo = timeout / T.speed;
    const start = performance.now();
    await new Promise(resolve => {
      let done = false, holdStart = null, raf = 0;
      const finish = () => { if (done) return; done = true; cancelAnimationFrame(raf); this._press = null; resolve(); };
      const need = type === 1 ? 12 : 1;
      const holdMs = 1500 / Math.max(1, T.speed / 2);
      this._press = (ev) => {
        if (ev === 'force') return finish();
        if (type === 0 || type === 3) { if (ev === 'down') { SFX.button(); finish(); } }
        else if (type === 1) { if (ev === 'down') { SFX.mash(); gauge.style.width = Math.min(100, this._mash / need * 100) + '%'; prompt.classList.add('hit'); setTimeout(() => prompt.classList.remove('hit'), 60); if (this._mash >= need) { SFX.button(); finish(); } } }
        else if (type === 2) { if (ev === 'down') { holdStart = performance.now(); SFX.charge(holdMs / 1000); } else if (ev === 'up') { holdStart = null; } }
      };
      const loop = () => {
        const now = performance.now();
        if (type === 2 && holdStart != null) {
          const r = (now - holdStart) / holdMs;
          gauge.style.width = Math.min(100, r * 100) + '%';
          if (r >= 1) { SFX.button(); return finish(); }
        } else if (type !== 1) {
          gauge.style.width = Math.max(0, 100 - (now - start) / tmo * 100) + '%';
        }
        if (this.auto && now - start > 700 / T.speed) { SFX.button(); return finish(); }
        if (now - start > tmo) { return finish(); }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      if (this._down && (type === 0 || type === 3)) { /* 押しっぱなしは無効 */ }
    });
    this._waiting = false;
    this.el.className = 'push';
    prompt.classList.add('gone');
    setTimeout(() => prompt.remove(), 300);
  },
};

/* ---------- キャラクタートークン ---------- */
function tok(who, cls = '') {
  const c = CH[who] || CH['ナレーション'];
  const ss = c.ss ? ` ss ss${c.ss}` : '';
  const name = who.replace(/\(.*\)/, '');
  const suffix = (who.match(/\((.*)\)/) || [])[1] || '';
  return `<div class="tok${ss} ${cls}" style="--c1:${c.c[0]};--c2:${c.c[1]};--aura:${c.aura}">
    <div class="tok-face"><span>${esc(c.k)}</span></div>
    <div class="tok-name">${esc(name)}${suffix ? `<small>${esc(suffix)}</small>` : ''}</div></div>`;
}
function dball(n, cls = '') {
  const stars = '★'.repeat(n);
  return `<span class="dball s${n} ${cls}"><b>${stars}</b></span>`;
}

/* ---------- ステージ本体 ---------- */
const Stage = {
  lcd: null, fx: null, reelEls: [], spinning: [false, false, false], reelTimers: [],
  init() {
    this.lcd = $('#lcd');
    this.fx = $('#lcdFx');
    this.reelEls = $$('#lcd .reel');
    this.info = $('#lcdInfo');
    this.bgName = $('#lcdStage');
    this.mini = $('#miniReels');
    this.reelsBox = $('#reels');
    this.setReels([7, 5, 3], true);
  },
  clearFx() { this.fx.innerHTML = ''; this.lcd.classList.remove('shake', 'dark', 'reach', 'gold', 'rainbow-bg', 'hot'); },
  setTheme(mode) {
    const m = $('#machine');
    m.classList.remove('m-normal', 'm-rush', 'm-lt', 'm-jitan', 'm-bonus');
    m.classList.add('m-' + mode);
  },
  setStage(name) { this.bgName.textContent = name || ''; this.lcd.dataset.stage = name || ''; },
  setInfo(html) { this.info.innerHTML = html; },
  zuHTML(n) {
    const z = ZUGARA[n];
    const c = CH[z.who];
    return `<div class="zu z${n}" style="--c1:${c.c[0]};--c2:${c.c[1]}"><b>${n}</b><span>${esc(z.who)}</span></div>`;
  },
  setReels(nums, instant) {
    nums.forEach((n, i) => { this.reelEls[i].innerHTML = this.zuHTML(n); });
    this.updateMini(nums);
  },
  updateMini(nums) { this.mini.innerHTML = nums.map(n => `<span>${n ?? '-'}</span>`).join(''); },
  spinAll() {
    for (let i = 0; i < 3; i++) this.spinReel(i);
    this.reelsBox.classList.remove('reach-on', 'hit-on');
  },
  spinReel(i) {
    clearInterval(this.reelTimers[i]);
    this.spinning[i] = true;
    this.reelEls[i].classList.add('spin');
    let n = 1 + Math.floor(Math.random() * 9);
    this.reelTimers[i] = setInterval(() => { n = n % 9 + 1; this.reelEls[i].innerHTML = this.zuHTML(n); }, 70);
    this.mini.children[i] && (this.mini.children[i].textContent = '▼');
  },
  stopReel(i, n) {
    clearInterval(this.reelTimers[i]);
    this.spinning[i] = false;
    this.reelEls[i].classList.remove('spin');
    this.reelEls[i].innerHTML = this.zuHTML(n);
    this.reelEls[i].classList.add('stop');
    setTimeout(() => this.reelEls[i].classList.remove('stop'), 200);
    if (this.mini.children[i]) this.mini.children[i].textContent = n;
    if (!T.instant) SFX.reelStop();
  },
  stopAll(nums) { nums.forEach((n, i) => this.stopReel(i, n)); },
  small(on) { this.lcd.classList.toggle('reels-small', !!on); },

  /* 汎用オーバーレイ */
  layer(html, cls = '') {
    const d = document.createElement('div');
    d.className = 'layer ' + cls;
    d.innerHTML = html;
    this.fx.appendChild(d);
    return d;
  },
  async show(html, cls, ms) {
    const d = this.layer(html, cls);
    await T.wait(ms);
    d.classList.add('out');
    await T.wait(180);
    d.remove();
  },
  async flash(color = '#fff') {
    SFX.flash();
    const d = this.layer('', 'flash');
    d.style.background = color;
    await T.wait(350);
    d.remove();
  },
  async shake() { this.lcd.classList.add('shake'); await T.wait(500); this.lcd.classList.remove('shake'); },

  /* ---------- 演出ステップ ---------- */
  async step(s, ctx = {}) {
    if (T.skip || T.instant) return;
    switch (s.t) {
      case 'line': return this.show(`${tok(s.who, 'left')}<div class="bubble">${esc(s.text)}</div>`, `line ${s.color ? 'c-' + s.color : ''}`, 1600 + s.text.length * 45);
      case 'voice': return this.show(`<div class="voice-from">${tok(s.who, 'ghost')}</div><div class="bubble voice">${esc(s.text)}</div>`, 'line voiceL', 2600);
      case 'narr': return this.show(`<div class="narr">${esc(s.text)}</div>`, 'narrL', 1500 + s.text.length * 40);
      case 'cut': SFX.kyuin(); return this.show(`<div class="cut-band">${tok(s.who, 'big')}<div class="cut-text${s.text.length > 14 ? ' long' : ''}">${esc(s.text)}</div></div>`, `cutin cc-${s.color || 'red'}`, 2200);
      case 'flash': return this.flash(s.color);
      case 'shake': SFX.explode(); return this.shake();
      case 'wait': return T.wait(s.ms);
      case 'scouterNum': {
        SFX.yokoku(2);
        const d = this.layer(`<div class="scouter-lens"><div class="sc-who">${esc(s.who)}</div><div class="sc-num">0</div><div class="sc-cap">${esc(s.text)}</div></div>`, 'scouterL');
        const el = d.querySelector('.sc-num');
        for (let i = 1; i <= 8; i++) { el.textContent = String(Math.floor(Math.random() * 99999)); SFX.tick(); await T.wait(90); }
        el.textContent = s.val; await T.wait(1800); d.remove(); return;
      }
      case 'charge': SFX.charge(1.6); return this.show(`${tok(s.who, 'center')}<div class="charge-orb" style="--cc:${s.color}"></div><div class="narr">${esc(s.text)}</div>`, 'chargeL', 2000);
      case 'beamShot': {
        SFX.beam();
        await this.show(`${tok(s.who, 'left small')}<div class="beam-one" style="--bc:${s.color}"></div><div class="tech-name">${esc(s.name)}!!</div>`, 'beamL', 1800);
        return;
      }
      case 'aura': SFX.charge(1); return this.show(`${tok(s.who, 'center big')}<div class="tech-name" style="color:${s.color}">${esc(s.text)}</div>`, 'auraL', 1800);
      case 'transform': SFX.flash(); return this.show(`${tok(s.who, 'center big')}<div class="tech-name">${esc(s.text)}</div>`, 'transformL', 1700);
      case 'rage': {
        SFX.explode();
        this.lcd.classList.add('shake');
        await this.show(`<div class="rage-text">${esc(s.text)}</div>${tok(s.who, 'center big')}`, 'rageL', 2600);
        this.lcd.classList.remove('shake');
        return;
      }
      case 'ssj': {
        SFX.charge(2); SFX.explode();
        this.lcd.classList.add('gold');
        await this.show(`<div class="ssj-burst"></div>${tok(s.who, 'center big')}<div class="ssj-text">${esc(s.text)}</div>`, 'ssjL', 2800);
        return;
      }
      case 'slash': SFX.flash(); return this.show(`${tok(s.who, 'center')}<div class="slash"></div><div class="tech-name">一閃!!</div>`, 'slashL', 1500);
      case 'pose': {
        const d = this.layer(`<div class="pose-row"></div><div class="tech-name pose-cap">ギニュー特戦隊!!</div>`, 'poseL');
        const row = d.querySelector('.pose-row');
        for (const w of s.list) { row.insertAdjacentHTML('beforeend', tok(w, 'pop')); SFX.yokoku(1); await T.wait(380); }
        await T.wait(1400); d.remove(); return;
      }
      case 'fusion': {
        const d = this.layer(`<div class="fusion-row">${tok(s.a)}<div class="fz">フュー…</div>${tok(s.b)}</div>`, 'fusionL');
        SFX.yokoku(1); await T.wait(1000);
        d.querySelector('.fz').textContent = 'ジョン!! はっ!!'; SFX.flash();
        await T.wait(900); d.innerHTML = tok('ゴテンクス', 'center big'); SFX.kyuin(); await T.wait(1400); d.remove(); return;
      }
      case 'clash': {
        SFX.beam();
        const d = this.layer(`<div class="clash">${tok(s.a.who, 'cl-a')}${tok(s.b.who, 'cl-b')}
          <div class="beam a" style="--bc:${s.a.color}"><span>${esc(s.a.name)}</span></div>
          <div class="beam b" style="--bc:${s.b.color}"><span>${esc(s.b.name)}</span></div><div class="spark"></div></div>`, 'clashL keep');
        ctx.clash = d;
        d.style.setProperty('--pos', '50%');
        await T.wait(1800);
        return;
      }
      case 'clashEnd': {
        const d = ctx.clash || this.fx.querySelector('.clashL');
        if (d) { d.style.setProperty('--pos', s.win === 'a' ? '100%' : '0%'); SFX.explode(); await T.wait(1200); d.remove(); }
        return;
      }
      case 'genkiGather': {
        const d = this.layer(`<div class="genki-ball"></div><div class="narr">地球中から元気が集まってくる――</div>`, 'genkiL keep');
        ctx.genki = d;
        SFX.charge(2.5);
        for (let i = 0; i < 6; i++) { d.style.setProperty('--g', (0.5 + i * 0.12).toFixed(2)); await T.wait(380); }
        return;
      }
      case 'genkiShot': {
        const d = ctx.genki || this.layer(`<div class="genki-ball"></div>`, 'genkiL');
        d.classList.add(s.win ? 'shot-win' : 'shot-lose');
        SFX.beam(); await T.wait(1400); SFX.explode(); await this.flash(s.win ? '#bfe9ff' : '#ff9ec7'); d.remove();
        return;
      }
    }
  },
};
