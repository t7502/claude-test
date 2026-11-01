/* =========================================================
 *  アプリ本体：実戦ループ / 早送り / 設定 / 記録 / スペック / 演出鑑賞
 * ========================================================= */
'use strict';

const LS = {
  get(k, d) { try { const v = localStorage.getItem('dbz.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('dbz.' + k, JSON.stringify(v)); } catch { /* 容量オーバー等 */ } },
  del(k) { localStorage.removeItem('dbz.' + k); },
};

const DEFAULTS = {
  specId: '319', rot: 18, budget: 30000, lendUnit: 1000, rate: 4,
  densapoCost: 0.2, netLossPerRound: 7,
  speed: 1, autoBtn: false, shortMiss: false, stopAt4: true,
  volume: 0.5, muted: false, ffShowHit: true, ffShowBonus: false,
};
const yen = (n) => (n < 0 ? '-' : '') + '¥' + Math.abs(Math.round(n)).toLocaleString();
const num = (n) => Math.round(n).toLocaleString();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const App = {
  set: null, m: null, session: null,
  handle: false, busy: false, req: null, paused: false,
  shotAcc: 0, denAcc: 0, inBonus: false, lastSave: 0,

  init() {
    this.set = { ...DEFAULTS, ...LS.get('settings', {}) };
    Stage.init(); Btn.init(); Board.init();
    this.bindTabs(); this.bindControls(); this.bindSettings();
    SFX.setVolume(this.set.volume); SFX.setMuted(this.set.muted);
    Btn.auto = this.set.autoBtn;
    T.speed = this.set.speed;
    const cur = LS.get('current', null);
    if (cur && cur.specId && SPECS[cur.specId]) this.resume(cur);
    else this.newSession();
    this.renderSpec(); this.renderRecords(); this.renderGallery();
    this.tickLoop();
    this.spinLoop();
    window.addEventListener('beforeunload', () => this.save());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.save(); });
  },

  /* ---------------- セッション ---------------- */
  machineSettings() {
    const s = this.set;
    return { rot: +s.rot, budget: +s.budget, lendUnit: +s.lendUnit, rate: +s.rate, densapoCost: +s.densapoCost, netLossPerRound: +s.netLossPerRound };
  },
  newSession() {
    const spec = SPECS[this.set.specId];
    this.m = new Machine(spec, this.machineSettings());
    this.m.evPerSpin = analyze(spec, this.m.set).evPerSpin;
    this.session = { id: Date.now(), start: Date.now(), specId: spec.id };
    Stage.setTheme('normal'); Stage.clearFx(); Stage.setReels([7, 5, 3]);
    this.setHandle(false);
    this.updateAll();
    this.save();
  },
  resume(cur) {
    const spec = SPECS[cur.specId];
    this.m = new Machine(spec, this.machineSettings());
    this.m.restore(cur.m);
    this.m.evPerSpin = analyze(spec, this.m.set).evPerSpin;
    this.session = cur.session;
    Stage.setTheme(this.m.mode === 'normal' ? 'normal' : this.m.mode);
    this.migi(this.m.densapo);
    this.updateAll();
    this.toast('前回の続きから再開しました');
  },
  save() {
    if (!this.m) return;
    if (this.m.invest === 0 && this.m.c.totalSpins === 0) { LS.del('current'); return; }
    LS.set('current', { specId: this.m.spec.id, session: this.session, m: this.m.snapshot() });
  },
  applyMachineSettings() {
    if (!this.m) return;
    Object.assign(this.m.set, this.machineSettings());
    this.m.evPerSpin = analyze(this.m.spec, this.m.set).evPerSpin;
  },

  /* 精算して記録 */
  async settle() {
    if (this.busy || this.inBonus || this.m.mode !== 'normal') {
      if (!(await ask('大当り中・RUSH中です。現在の持ち玉で精算しますか？（残りの電サポは放棄します）'))) return;
    }
    await this.pauseAndWait();
    const m = this.m;
    if (m.invest === 0 && m.c.totalSpins === 0) { this.toast('まだ打っていません'); return; }
    const st = m.settle();
    const rec = {
      id: this.session.id, start: this.session.start, end: Date.now(),
      spec: m.spec.id, specName: m.spec.short, rot: m.set.rot, rate: m.set.rate,
      invest: st.invest, back: st.back, profit: st.profit, returnRate: st.returnRate, balls: st.balls,
      spins: m.c.totalSpins, spinsNormal: m.c.spinsNormal, firstHits: m.c.firstHits, hits: m.c.hits,
      rush: m.c.rushEntries, lt: m.c.ltEntries, maxChain: m.c.maxChain, maxBalls: m.c.maxBalls,
      ev: Math.round(m.c.ev), realRot: m.c.normalUsed > 0 ? m.c.spinsNormal * 250 / m.c.normalUsed : null,
      graph: thinGraph(m.c.graph, 200), rushLog: m.c.rushLog.slice(-50),
    };
    const recs = LS.get('records', []);
    recs.push(rec); LS.set('records', recs);
    this.showModal(`<h3>精算しました</h3>
      <table class="kv">
        <tr><th>投資</th><td>${yen(rec.invest)}</td></tr>
        <tr><th>持ち玉</th><td>${num(rec.balls)}玉 × ${rec.rate}円</td></tr>
        <tr><th>回収</th><td>${yen(rec.back)}</td></tr>
        <tr><th>収支</th><td class="${rec.profit >= 0 ? 'plus' : 'minus'}">${rec.profit >= 0 ? '+' : ''}${yen(rec.profit)}</td></tr>
        <tr><th>回収率</th><td>${rec.returnRate == null ? '—' : (rec.returnRate * 100).toFixed(1) + '%'}</td></tr>
        <tr><th>総回転</th><td>${num(rec.spins)}回転（初当り ${rec.firstHits}回 / RUSH ${rec.rush}回 / 最大 ${rec.maxChain}連）</td></tr>
        <tr><th>仕事量</th><td>${yen(rec.ev)}</td></tr>
      </table><p class="note">記録タブに保存しました。新しい台で打ち始めます。</p>`);
    LS.del('current');
    this.newSession();
    this.renderRecords();
  },

  /* ---------------- ループ ---------------- */
  tickLoop() {
    let last = performance.now(), uiAcc = 0;
    const loop = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (this.handle && !this.inBonus && !this.paused && !this.req) this.shoot(dt * T.speed);
      uiAcc += dt;
      if (uiAcc > 0.15) { uiAcc = 0; this.updateCounters(); }
      if (now - this.lastSave > 5000) { this.lastSave = now; this.save(); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },
  shoot(dt) {
    const m = this.m;
    if (m.densapo) {
      this.denAcc += dt;
      if (this.denAcc > 0.5) {
        this.denAcc = 0;
        if (m.denHold.length < 4) {
          const h = m.fillDen();
          if (!h) return this.budgetOver();
          Board.spawn('R', 'den'); this.renderHolds();
        } else Board.spawn('R', 'out');
      }
      return;
    }
    this.shotAcc += dt * 100 / 60; // 100発/分
    let n = Math.floor(this.shotAcc);
    this.shotAcc -= n;
    if (n > 400) n = 400;
    for (let i = 0; i < n; i++) {
      if (this.set.stopAt4 && m.hesoHold.length >= 4) { this.shotAcc = 0; break; }
      const r = m.shootLeft();
      if (r === null) return this.budgetOver();
      if (i < 3 || Math.random() < 3 / n) Board.spawn('L', r.heso ? 'heso' : 'out');
      if (i < 2 && !T.instant) SFX.ball();
      if (r.held) {
        r.hold.plan = this.planFor(r.hold, 'normal');
        SFX.heso();
        if (r.hold.plan.holdInit > 0) SFX.hold(r.hold.plan.holdInit);
        this.renderHolds();
      }
    }
  },
  budgetOver() {
    this.setHandle(false);
    this.showModal(`<h3>投資上限に達しました</h3><p>設定した投資上限 <b>${yen(this.m.set.budget)}</b> を使い切りました。</p>
      <div class="row"><button class="btn" data-act="budget+5000">上限を +5,000円</button><button class="btn" data-act="budget+10000">上限を +10,000円</button>
      <button class="btn primary" data-act="settle">精算して記録</button></div>`);
  },
  planFor(hold, mode) {
    const spec = this.m.spec;
    const res = hold.preview;
    if (mode === 'normal') return planNormal(spec, res.hit);
    if (mode === 'jitan') return planJitan(res.hit);
    return planRush(res.hit, Math.random, mode);
  },

  async spinLoop() {
    for (;;) {
      try {
        if (this.paused) { await sleep(80); continue; }
        if (this.req) { await this.handleReq(); continue; }
        const m = this.m;
        const spin = m.takeSpin();
        if (!spin) { await sleep(50); continue; }
        await this.playSpin(spin);
      } catch (e) {
        console.error(e);
        this.busy = false; this.inBonus = false; T.skip = false; T.instant = false;
        await sleep(200);
      }
    }
  },

  /* 1変動の再生〜大当り処理まで */
  async playSpin(spin, opts = {}) {
    const m = this.m;
    this.busy = true; T.skip = false;
    let plan = spin.hold.plan;
    const pm = spin.mode;
    const okPlan = plan && plan.hit === spin.hit && ((pm === 'normal' && plan.kind === 'normal') || (pm !== 'normal' && plan.kind === pm));
    if (!okPlan) {
      if (pm === 'normal') plan = planNormal(m.spec, spin.hit, Math.random, plan && plan.kind === 'normal' ? {} : {});
      else if (pm === 'jitan') plan = planJitan(spin.hit);
      else plan = planRush(spin.hit, Math.random, pm);
    }
    this.current = { spin, plan };
    this.renderHolds();
    this.updateInfo(spin);
    if (pm === 'normal') {
      await Director.playNormal(spin, plan, { onHoldChange: () => this.renderHolds(true), shortMiss: this.set.shortMiss });
    } else if (pm === 'jitan') await Director.playJitan(spin, plan, m);
    else await Director.playRush(spin, plan, m);
    T.skip = false;
    const r = m.endSpin(spin);
    this.current = null;
    if (r.bonus) await this.runBonus(r.bonus, opts.instantBonus);
    if (r.modeEnd) {
      this.migi(false);
      await Director.modeEnd(r.modeEnd, m);
      T.skip = false;
      Stage.setTheme('normal');
      Stage.setStage('カメハウス');
    }
    this.renderHolds();
    this.updateAll();
    this.busy = false;
  },
  async runBonus(bonus, instant) {
    const m = this.m;
    this.inBonus = true;
    this.updateAll();
    if (instant) { T.instant = true; }
    await Director.playBonus(bonus, m, {
      update: () => this.updateCounters(),
      migi: (on) => this.migi(on),
      attacker: () => { if (Math.random() < 0.5) Board.spawn('R', 'atk'); },
    });
    T.instant = false; T.skip = false;
    m.finishBonus(bonus);
    Stage.setTheme(m.mode);
    this.migi(m.densapo);
    this.inBonus = false;
    this.save();
  },

  /* ---------------- 早送り ---------------- */
  request(kind) {
    if (this.req) return;
    this.req = kind;
    if (this.busy) T.skipNow();
  },
  async handleReq() {
    const kind = this.req;
    const m = this.m;
    try {
      if (kind === 'hit' || typeof kind === 'number') {
        if (m.mode !== 'normal') { this.toast('RUSH・時短中は「RUSH終了まで早送り」を使ってください'); return; }
        const opt = typeof kind === 'number' ? { maxNormal: m.c.spinsNormal + kind } : {};
        const before = m.c.spinsNormal;
        const res = m.fastForward('hit', opt);
        this.toast(`${num(m.c.spinsNormal - before)}回転 早送りしました`);
        this.updateAll();
        if (res.reason === 'budget') { this.req = null; this.budgetOver(); return; }
        if (res.reason === 'hit') {
          this.req = null;
          if (this.set.ffShowHit) {
            res.spin.hold.plan = planNormal(m.spec, true);
            await this.playSpin(res.spin, { instantBonus: this.set.ffShowBonus ? false : false });
          } else {
            T.instant = true;
            await this.playSpin(res.spin, { instantBonus: true });
            T.instant = false;
          }
        }
      } else if (kind === 'modeEnd') {
        if (m.mode === 'normal') { this.toast('RUSH・時短中ではありません'); return; }
        const startMode = m.mode;
        const chainBefore = m.c.chain;
        const res = m.fastForward('modeEnd');
        if (res.reason === 'modeEnd') {
          this.migi(false);
          Stage.setTheme('normal');
          this.req = null;
          await Director.modeEnd(res.info || { mode: startMode, chain: m.c.chain, balls: m.c.chainBalls }, m);
        } else if (res.reason === 'budget') { this.budgetOver(); }
        this.updateAll();
        Stage.setStage('カメハウス');
      } else if (kind === 'bonusSkip') {
        // 何もしない（演出スキップのみ）
      }
    } finally {
      this.req = null;
      this.renderHolds();
      this.updateAll();
      this.save();
    }
  },
  async pauseAndWait() {
    this.setHandle(false);
    this.paused = true;
    if (this.busy) T.skipNow();
    for (let i = 0; i < 400 && (this.busy || this.inBonus); i++) await sleep(25);
    // 保留は残したまま
    this.paused = false;
  },

  /* ---------------- 表示 ---------------- */
  setHandle(on) {
    this.handle = on;
    $('#handleBtn').classList.toggle('on', on);
    $('#handleBtn').textContent = on ? 'ハンドル OFF（打ち出し停止）' : 'ハンドル ON（打ち出し）';
    if (on) SFX.unlock();
  },
  migi(on) { $('#migiUchi').classList.toggle('on', !!on); },
  renderHolds(changed) {
    const m = this.m;
    const icon = (h) => {
      const p = h.plan;
      const c = p && p.kind === 'normal' ? HOLD_CLASS[p.holdInit] : 'h-white';
      return `<i class="hold ${c}"></i>`;
    };
    $('#holdHeso').innerHTML = [0, 1, 2, 3].map(i => m.hesoHold[i] ? icon(m.hesoHold[i]) : '<i class="hold empty"></i>').join('');
    $('#holdDen').innerHTML = [0, 1, 2, 3].map(i => m.denHold[i] ? '<i class="hold h-den"></i>' : '<i class="hold empty"></i>').join('');
    const cur = this.current;
    let c = 'empty';
    if (cur) { const p = cur.plan; c = p.kind === 'normal' ? HOLD_CLASS[changed ? p.holdFinal : p.holdInit] : 'h-den'; }
    $('#holdCur').className = 'hold cur ' + c;
  },
  updateInfo(spin) {
    const m = this.m;
    let html = '';
    if (m.mode === 'rush' || m.mode === 'lt') {
      const left = m.stLeft + m.jtLeft;
      html = `<b class="${m.mode}">${esc(m.spec.modes[m.mode].name)}</b> 残り<b>${left}</b>回 ${m.stLeft === 0 ? '(時短)' : ''} ／ <b>${m.c.chain}</b>連 ／ ${num(m.c.chainBalls)}発`;
    } else if (m.mode === 'jitan') {
      html = `<b class="jitan">神龍チャレンジ</b> 残り<b>${m.jtLeft}</b>回`;
    } else html = '';
    Stage.setInfo(html);
  },
  updateCounters() {
    const m = this.m; const c = m.c;
    const st = m.settle();
    const set = (id, v) => { const el = document.getElementById(id); if (el && el.textContent !== String(v)) el.textContent = v; };
    set('dBalls', num(m.balls));
    set('dInvest', yen(m.invest));
    set('dDiff', (m.diff >= 0 ? '+' : '') + num(m.diff));
    set('dProfit', (st.profit >= 0 ? '+' : '') + yen(st.profit));
    $('#dProfit').className = st.profit >= 0 ? 'plus' : 'minus';
    set('dRate', st.returnRate == null ? '—' : (st.returnRate * 100).toFixed(1) + '%');
    set('dSince', num(c.sinceHit));
    set('dTotal', num(c.totalSpins));
    set('dHits', `${c.hits} / ${c.firstHits}`);
    set('dProb', c.firstHits ? '1/' + (c.spinsNormal / c.firstHits).toFixed(1) : '—');
    set('dRush', `${c.rushEntries}${c.ltEntries ? `（LT ${c.ltEntries}）` : ''}`);
    set('dMax', `${c.maxChain}連`);
    set('dRealRot', c.normalUsed > 50 ? (c.spinsNormal * 250 / c.normalUsed).toFixed(1) : '—');
    set('dEv', yen(c.ev));
    set('dBudget', `${yen(m.invest)} / ${yen(m.set.budget)}`);
    $('#budgetBar').style.width = Math.min(100, m.invest / m.set.budget * 100) + '%';
    if (this.busy && this.current && this.current.spin.mode !== 'normal') this.updateInfo();
  },
  updateAll() {
    this.updateCounters();
    this.updateInfo();
    this.renderHolds();
    this.renderHistory();
    drawGraph($('#slump'), this.m.c.graph);
    const mode = this.m.mode;
    $('#modeLabel').textContent = mode === 'normal' ? (this.inBonus ? '大当り中' : '通常時') : this.m.spec.modes[mode].name;
    $('#modeLabel').className = 'mode-label ml-' + (this.inBonus ? 'bonus' : mode);
    $('#specLabel').textContent = this.m.spec.name;
  },
  renderHistory() {
    const log = this.m.c.hitLog.slice(-30).reverse();
    $('#history').innerHTML = log.length ? log.map(h => `<li class="hk-${h.mode}"><span class="hs">${num(h.spin)}回</span><span class="hl">${esc(h.label.replace(/（.*?）/g, ''))}</span><span class="hc">${h.mode === 'normal' ? '初当り' : h.chain + '連'}</span></li>`).join('') : '<li class="empty">まだ大当りはありません</li>';
  },
  toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('on'), 2400);
  },
  showModal(html) {
    const md = $('#modal');
    $('#modalBody').innerHTML = html;
    md.classList.add('on');
  },

  /* ---------------- UI結線 ---------------- */
  bindTabs() {
    $$('.tab').forEach(b => b.addEventListener('click', () => {
      $$('.tab').forEach(x => x.classList.toggle('on', x === b));
      $$('.pane').forEach(p => p.classList.toggle('on', p.id === b.dataset.pane));
      if (b.dataset.pane === 'pRecords') this.renderRecords();
      if (b.dataset.pane === 'pSpec') this.renderSpec();
    }));
  },
  bindControls() {
    $('#handleBtn').addEventListener('click', () => this.setHandle(!this.handle));
    $('#ffHit').addEventListener('click', () => { SFX.unlock(); this.request('hit'); });
    $('#ff100').addEventListener('click', () => this.request(100));
    $('#ff1000').addEventListener('click', () => this.request(1000));
    $('#ffRush').addEventListener('click', () => this.request('modeEnd'));
    $('#skipFx').addEventListener('click', () => T.skipNow());
    $('#settleBtn').addEventListener('click', () => this.settle());
    $('#lendBtn').addEventListener('click', () => { if (this.m.lend()) { this.toast(`${yen(this.m.set.lendUnit)} 貸出`); this.updateAll(); } else this.budgetOver(); });
    $$('.speed button').forEach(b => b.addEventListener('click', () => this.setSpeed(+b.dataset.sp)));
    this.setSpeed(this.set.speed);
    $('#modal').addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]');
      if (e.target.id === 'modal' || (a && a.dataset.act === 'close')) { $('#modal').classList.remove('on'); return; }
      if (!a) return;
      const act = a.dataset.act;
      if (act.startsWith('budget+')) {
        this.set.budget = +this.set.budget + +act.slice(7); this.saveSettings(); this.applyMachineSettings(); this.fillSettings();
        $('#modal').classList.remove('on'); this.toast(`投資上限を ${yen(this.set.budget)} にしました`); this.updateAll();
      } else if (act === 'settle') { $('#modal').classList.remove('on'); this.settle(); }
    });
    window.addEventListener('keydown', (e) => {
      if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || '')) return;
      if (e.key === 'h' || e.key === 'H') this.setHandle(!this.handle);
      if (e.key === 'f' || e.key === 'F') this.request('hit');
      if (e.key === 's' || e.key === 'S') T.skipNow();
    });
  },
  setSpeed(sp) {
    this.set.speed = sp; T.speed = sp; this.saveSettings();
    $$('.speed button').forEach(b => b.classList.toggle('on', +b.dataset.sp === sp));
  },
  saveSettings() { LS.set('settings', this.set); },

  bindSettings() {
    const f = $('#settingsForm');
    f.addEventListener('input', () => this.readSettings());
    f.addEventListener('change', () => this.readSettings());
    $('#rot').addEventListener('input', () => { $('#rotVal').textContent = $('#rot').value; });
    $('#applySpec').addEventListener('click', async () => {
      const id = $('#specSel').value;
      if (id === this.m.spec.id) { this.toast('同じ機種です'); return; }
      if (this.m.c.totalSpins > 0 && !(await ask('台を移動します。今の台は精算して記録します。よろしいですか？'))) return;
      this.set.specId = id; this.saveSettings();
      if (this.m.c.totalSpins > 0 || this.m.invest > 0) await this.settle();
      else this.newSession();
      $('#modal').classList.remove('on');
      this.renderSpec();
      this.toast(SPECS[id].name + ' に移動しました');
    });
    this.fillSettings();
  },
  fillSettings() {
    const s = this.set;
    $('#specSel').innerHTML = Object.values(SPECS).map(sp => `<option value="${sp.id}">${esc(sp.name)}</option>`).join('');
    $('#specSel').value = s.specId;
    $('#rot').value = s.rot; $('#rotVal').textContent = s.rot;
    $('#budget').value = s.budget;
    $('#lendUnit').value = s.lendUnit;
    $('#rate').innerHTML = EXCHANGE_RATES.map(r => `<option value="${r.v}">${r.label}</option>`).join('');
    $('#rate').value = s.rate;
    $('#densapoCost').value = s.densapoCost;
    $('#netLoss').value = s.netLossPerRound;
    $('#autoBtn').checked = s.autoBtn;
    $('#shortMiss').checked = s.shortMiss;
    $('#stopAt4').checked = s.stopAt4;
    $('#ffShowHit').checked = s.ffShowHit;
    $('#volume').value = s.volume;
    $('#muted').checked = s.muted;
  },
  readSettings() {
    const s = this.set;
    s.rot = +$('#rot').value;
    s.budget = Math.max(1000, +$('#budget').value || 30000);
    s.lendUnit = +$('#lendUnit').value;
    s.rate = +$('#rate').value;
    s.densapoCost = +$('#densapoCost').value;
    s.netLossPerRound = +$('#netLoss').value;
    s.autoBtn = $('#autoBtn').checked; Btn.auto = s.autoBtn;
    s.shortMiss = $('#shortMiss').checked;
    s.stopAt4 = $('#stopAt4').checked;
    s.ffShowHit = $('#ffShowHit').checked;
    s.volume = +$('#volume').value; SFX.setVolume(s.volume);
    s.muted = $('#muted').checked; SFX.setMuted(s.muted);
    this.saveSettings();
    this.applyMachineSettings();
    this.updateCounters();
    this.renderSpecCalc();
  },

  /* ---------------- スペック表 ---------------- */
  renderSpec() {
    const spec = this.m.spec;
    const a = analyze(spec, this.m.set);
    const WH = spec.heso.reduce((s, d) => s + d.w, 0), WD = spec.den.reduce((s, d) => s + d.w, 0), WL = spec.lt.reduce((s, d) => s + d.w, 0);
    const distRows = (arr, W) => arr.map(d => `<tr><td>${esc(d.label)}</td><td>${(d.w / W * 100).toFixed(1)}%</td><td>${num(grossOf(spec, d.rounds))}発</td><td>約${num(a.netOf(d.rounds))}発</td></tr>`).join('');
    const rushM = spec.modes.rush, ltM = spec.modes.lt, jM = spec.modes.jitan;
    const missRows = missReachTable(spec);
    const reachRows = REACHES.map(r => {
      const row = missRows.find(x => x.r.id === r.id);
      const perSpin = spec.low * r.f + (row ? row.freq * (1 - spec.low) : 0);
      return `<tr class="tier-${r.tier}"><td>${r.tier}</td><td>${esc(r.name)}</td><td>${(r.E * 100).toFixed(r.E < 0.1 ? 1 : 0)}%</td><td>1/${perSpin > 0 ? (1 / perSpin).toFixed(0) : '∞'}</td></tr>`;
    }).join('');
    const yRows = Object.entries(YOKOKU).filter(([k]) => !['button', 'btype', 'telop', 'cutin'].includes(k) || true).map(([k, y]) => {
      const cells = y.levels.map((lv, i) => {
        const e = yokokuExpect(spec, k, i);
        return `<span class="yk ${e >= 0.5 ? 'hot' : e >= 0.2 ? 'warm' : ''}">${esc(lv)}<b>${e >= 0.999 ? '確定' : (e * 100).toFixed(e < 0.1 ? 1 : 0) + '%'}</b></span>`;
      }).join('');
      return `<tr><th>${esc(y.name)}</th><td>${cells}</td></tr>`;
    }).join('');
    $('#specBody').innerHTML = `
      <h3>${esc(spec.name)}</h3>
      <p class="note">タイプ：${esc(spec.typeLabel)}　※ファンメイドの架空スペックです（実機とは関係ありません）</p>
      <table class="spec">
        <tr><th>大当り確率（低確率）</th><td>${spec.lowLabel}</td></tr>
        <tr><th>大当り確率（高確率 / ST中）</th><td>${spec.highLabel}</td></tr>
        <tr><th>賞球数</th><td>ヘソ ${spec.prize.heso} ＆ 電チュー ${spec.prize.den} ＆ 一般入賞 ${spec.prize.other} ＆ アタッカー ${spec.prize.attacker}</td></tr>
        <tr><th>カウント</th><td>${spec.prize.count}カウント（1R = ${spec.prize.attacker * spec.prize.count}発）</td></tr>
        <tr><th>超サイヤ人RUSH</th><td>ST ${rushM.st}回${rushM.jitan ? ` ＋ 時短${rushM.jitan}回` : ''}（電サポ ${rushM.st + rushM.jitan}回）</td></tr>
        <tr><th>RUSH継続率</th><td><b>約${pct(a.cN)}</b>（平均連チャン 約${(a.avgChainN + 1).toFixed(2)}連 ※突入時の大当り含む）</td></tr>
        ${spec.lt.length ? `<tr><th>LT「ULTIMATE BURST」</th><td>ST ${ltM.st}回 ＋ 時短${ltM.jitan}回 ／ 継続率 <b>約${pct(a.cU)}</b> ／ RUSH中LT突入率 ${pct(a.ltRate)}</td></tr>` : ''}
        <tr><th>神龍チャレンジ（時短）</th><td>時短${jM.jitan}回（引き戻し率 約${pct(a.cJ)}）</td></tr>
        <tr><th>RUSH直行率（初当り）</th><td>${pct(a.rushDirect)}</td></tr>
        <tr><th>トータルRUSH突入率</th><td><b>約${pct(a.rushEntry)}</b>（神龍チャレンジ引き戻し込み）</td></tr>
        <tr><th>初当り1回の期待出玉</th><td>約${num(a.E)}発（純増・電サポ増減込み）</td></tr>
        <tr><th>RUSH 1回の期待出玉</th><td>約${num(a.VN)}発</td></tr>
        ${spec.lt.length ? `<tr><th>LT 1回の期待出玉</th><td>約${num(a.VU)}発（＋突入時の3000発）</td></tr>` : ''}
      </table>
      <h4>ヘソ（特図1）振り分け</h4>
      <table class="dist"><tr><th>内容</th><th>割合</th><th>払出</th><th>実出玉目安</th></tr>${distRows(spec.heso, WH)}</table>
      <h4>電チュー（特図2）振り分け ― RUSH・神龍チャレンジ中</h4>
      <table class="dist"><tr><th>内容</th><th>割合</th><th>払出</th><th>実出玉目安</th></tr>${distRows(spec.den, WD)}</table>
      ${spec.lt.length ? `<h4>LT（ULTIMATE BURST）中 振り分け</h4><table class="dist"><tr><th>内容</th><th>割合</th><th>払出</th><th>実出玉目安</th></tr>${distRows(spec.lt, WL)}</table>` : ''}
      <div id="specCalc"></div>
      <h4>リーチ期待度（通常時）</h4>
      <div class="table-wrap"><table class="dist reach"><tr><th>種別</th><th>リーチ名</th><th>期待度</th><th>出現率(1変動)</th></tr>${reachRows}</table></div>
      <h4>予告・チャンスアップ期待度（理論値）</h4>
      <table class="ytable">${yRows}</table>
      <h4>プレミア（大当り確定）</h4>
      <ul class="plist">${PREMIUM.map(p => `<li>${esc(p.name)}</li>`).join('')}<li>元気玉全回転リーチ</li><li>保留・ボタン 虹（神龍柄）</li></ul>
      <h4>収支シミュレーター</h4>
      <div class="sim">
        <label>回数 <input id="simN" type="number" value="300" min="10" max="5000"></label>
        <label>1回の通常回転数 <input id="simSp" type="number" value="2000" min="100" max="20000" step="100"></label>
        <button class="btn" id="simRun">シミュレート</button>
        <div id="simOut"></div>
      </div>`;
    this.renderSpecCalc();
    $('#simRun').addEventListener('click', () => this.runSim());
  },
  renderSpecCalc() {
    const el = $('#specCalc'); if (!el) return;
    const spec = this.m.spec;
    const a = analyze(spec, this.m.set);
    const rows = EXCHANGE_RATES.map(r => {
      const b = analyze(spec, { ...this.m.set, rate: r.v });
      return `<tr><td>${r.label}</td><td>${b.border.toFixed(1)}回転</td></tr>`;
    }).join('');
    el.innerHTML = `<h4>ボーダー（千円あたり回転数・持ち玉比率0%）</h4>
      <table class="dist"><tr><th>交換率</th><th>ボーダー</th></tr>${rows}</table>
      <p class="calc">現在の設定：<b>${this.m.set.rot}回転/千円</b>・${this.m.set.rate}円交換 → 1回転あたり期待値 <b class="${a.evPerSpin >= 0 ? 'plus' : 'minus'}">${a.evPerSpin >= 0 ? '+' : ''}${a.evPerSpin.toFixed(2)}円</b>
      （理論回収率 ${(a.payoutRate * 100).toFixed(1)}%）／ 1000回転あたり ${yen(a.evPerSpin * 1000)}</p>`;
  },
  async runSim() {
    const n = Math.min(5000, Math.max(10, +$('#simN').value || 300));
    const sp = Math.min(20000, Math.max(100, +$('#simSp').value || 2000));
    const out = $('#simOut');
    out.textContent = '計算中…';
    await sleep(30);
    const res = [];
    const chunk = 25;
    for (let i = 0; i < n; i += chunk) {
      res.push(...simulateSessions(this.m.spec, { ...this.m.set }, Math.min(chunk, n - i), sp));
      out.textContent = `計算中… ${res.length}/${n}`;
      await sleep(0);
    }
    const inv = res.reduce((s, r) => s + r.invest, 0), back = res.reduce((s, r) => s + r.back, 0);
    const prof = res.map(r => r.profit).sort((a, b) => a - b);
    const win = prof.filter(p => p > 0).length;
    const avg = prof.reduce((s, p) => s + p, 0) / n;
    const fh = res.reduce((s, r) => s + r.firstHits, 0), spins = res.reduce((s, r) => s + r.spins, 0), rush = res.reduce((s, r) => s + r.rush, 0);
    out.innerHTML = `<table class="kv">
      <tr><th>平均収支</th><td class="${avg >= 0 ? 'plus' : 'minus'}">${yen(avg)}</td></tr>
      <tr><th>勝率</th><td>${(win / n * 100).toFixed(1)}%</td></tr>
      <tr><th>回収率（総回収/総投資）</th><td>${(back / inv * 100).toFixed(1)}%</td></tr>
      <tr><th>最大勝ち / 最大負け</th><td>${yen(prof[prof.length - 1])} / ${yen(prof[0])}</td></tr>
      <tr><th>中央値</th><td>${yen(prof[Math.floor(n / 2)])}</td></tr>
      <tr><th>実測初当り確率</th><td>1/${(spins / Math.max(1, fh)).toFixed(1)}</td></tr>
      <tr><th>実測RUSH突入率</th><td>${(rush / Math.max(1, fh) * 100).toFixed(1)}%</td></tr></table>
      <canvas id="simHist" width="600" height="160"></canvas>`;
    drawHist($('#simHist'), prof);
  },

  /* ---------------- 記録 ---------------- */
  renderRecords() {
    const recs = LS.get('records', []);
    const sum = (k) => recs.reduce((s, r) => s + (r[k] || 0), 0);
    const inv = sum('invest'), back = sum('back');
    const fh = sum('firstHits'), sn = recs.reduce((s, r) => s + (r.spinsNormal || r.spins || 0), 0);
    $('#recSummary').innerHTML = recs.length ? `<table class="kv">
      <tr><th>実戦回数</th><td>${recs.length}回</td></tr>
      <tr><th>総投資</th><td>${yen(inv)}</td></tr>
      <tr><th>総回収</th><td>${yen(back)}</td></tr>
      <tr><th>トータル収支</th><td class="${back - inv >= 0 ? 'plus' : 'minus'}">${back - inv >= 0 ? '+' : ''}${yen(back - inv)}</td></tr>
      <tr><th>トータル回収率</th><td>${inv ? (back / inv * 100).toFixed(1) + '%' : '—'}</td></tr>
      <tr><th>総回転数</th><td>${num(sum('spins'))}回転</td></tr>
      <tr><th>初当り</th><td>${fh}回（実測 1/${fh ? (sn / fh).toFixed(1) : '—'}）</td></tr>
      <tr><th>RUSH突入</th><td>${sum('rush')}回（${fh ? (sum('rush') / fh * 100).toFixed(1) : '—'}%）／ LT ${sum('lt')}回</td></tr>
      <tr><th>最大連チャン</th><td>${Math.max(0, ...recs.map(r => r.maxChain || 0))}連</td></tr>
      <tr><th>仕事量合計</th><td>${yen(sum('ev'))}</td></tr></table>` : '<p class="note">まだ記録はありません。実戦して「精算」すると保存されます。</p>';
    let acc = 0;
    drawGraph($('#recGraph'), [[0, 0], ...recs.map((r, i) => [i + 1, acc += r.profit])], { unit: '円', xLabel: '回' });
    $('#recTable').innerHTML = `<tr><th>日時</th><th>機種</th><th>回転率</th><th>総回転</th><th>初当り</th><th>RUSH</th><th>最大連</th><th>投資</th><th>回収</th><th>収支</th><th>回収率</th><th></th></tr>` +
      recs.slice().reverse().map(r => `<tr>
        <td>${new Date(r.start).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
        <td>${esc(r.specName || r.spec)}</td><td>${r.rot}${r.realRot ? `<small>(実${r.realRot.toFixed(1)})</small>` : ''}</td>
        <td>${num(r.spins)}</td><td>${r.firstHits}</td><td>${r.rush}${r.lt ? `<small>LT${r.lt}</small>` : ''}</td><td>${r.maxChain}</td>
        <td>${yen(r.invest)}</td><td>${yen(r.back)}</td><td class="${r.profit >= 0 ? 'plus' : 'minus'}">${r.profit >= 0 ? '+' : ''}${yen(r.profit)}</td>
        <td>${r.returnRate == null ? '—' : (r.returnRate * 100).toFixed(0) + '%'}</td>
        <td><button class="mini" data-del="${r.id}">削除</button></td></tr>`).join('');
    $$('#recTable [data-del]').forEach(b => b.addEventListener('click', async () => {
      if (!(await ask('この記録を削除しますか？'))) return;
      LS.set('records', LS.get('records', []).filter(r => String(r.id) !== b.dataset.del));
      this.renderRecords();
    }));
  },
  exportCsv() {
    const recs = LS.get('records', []);
    const head = ['開始', '終了', '機種', '回転率設定', '実測回転率', '交換率', '総回転', '通常回転', '初当り', '大当り', 'RUSH', 'LT', '最大連', '投資', '回収', '収支', '回収率', '仕事量'];
    const rows = recs.map(r => [new Date(r.start).toLocaleString('ja-JP'), new Date(r.end).toLocaleString('ja-JP'), r.specName, r.rot, r.realRot ? r.realRot.toFixed(2) : '', r.rate, r.spins, r.spinsNormal, r.firstHits, r.hits, r.rush, r.lt, r.maxChain, r.invest, r.back, r.profit, r.returnRate == null ? '' : (r.returnRate * 100).toFixed(1), r.ev]);
    const csv = '﻿' + [head, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = `dbz_pachinko_records_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch { /* ダウンロード不可の環境 */ }
    this.showModal(`<h3>CSV</h3><p class="note">ダウンロードできない環境では、下の内容をコピーして表計算ソフトに貼り付けてください。</p>
      <textarea id="csvText" readonly style="width:100%;height:200px;background:#0a0f1a;color:#fff;font-size:11px">${esc(csv.slice(1))}</textarea>
      <div class="row"><button class="btn primary" id="csvCopy" type="button">コピー</button></div>`);
    $('#csvCopy').addEventListener('click', async () => {
      const ta = $('#csvText');
      try { await navigator.clipboard.writeText(ta.value); this.toast('コピーしました'); }
      catch { ta.select(); try { document.execCommand('copy'); this.toast('コピーしました'); } catch { this.toast('手動で選択してコピーしてください'); } }
    });
  },

  /* ---------------- 演出鑑賞 ---------------- */
  renderGallery() {
    const g = $('#galleryForm');
    const opt = (arr) => `<option value="">（なし）</option>` + arr.map((l, i) => `<option value="${i}">${esc(l)}</option>`).join('');
    const ykeys = ['hold', 'jikai', 'pseudo', 'scouter', 'radar', 'serif', 'kaioken', 'ginyu', 'satan', 'yamcha', 'fusion', 'kame', 'telop', 'cutin', 'button', 'btype', 'revive'];
    g.innerHTML = `
      <div class="grow"><label>リーチ<select id="gReach"><option value="">リーチなし</option>${REACHES.map(r => `<option value="${r.id}">[${r.tier}] ${esc(r.name)}（${(r.E * 100).toFixed(r.E < .1 ? 1 : 0)}%）</option>`).join('')}</select></label>
      <label>結果<select id="gHit"><option value="1">当り</option><option value="0">ハズレ</option><option value="r">ランダム（期待度どおり）</option></select></label>
      <label>プレミア<select id="gPrem"><option value="">なし</option>${PREMIUM.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label>
      <label>図柄<select id="gZu"><option value="">ランダム</option>${ZUGARA.slice(1).map(z => `<option value="${z.n}">${z.n}：${esc(z.who)}</option>`).join('')}</select></label></div>
      <details open><summary>予告・チャンスアップを指定</summary><div class="ygrid">
      ${ykeys.map(k => `<label>${esc(YOKOKU[k].name)}<select data-y="${k}">${k === 'hold' ? YOKOKU[k].levels.map((l, i) => `<option value="${i}">${esc(l)}</option>`).join('') : opt(YOKOKU[k].levels)}</select></label>`).join('')}
      </div><button class="mini" id="gRandom" type="button">予告をおまかせ（抽選）</button></details>
      <div class="row"><button class="btn primary" id="gPlay" type="button">▶ この演出を再生</button>
      <button class="btn" id="gAll" type="button">名シーン全部見る（SP/SPSP連続）</button></div>
      <div class="row"><button class="btn s" id="gSkip" type="button">演出スキップ（S）</button><button class="btn s warn" id="gStop" type="button">鑑賞を止める</button></div>
      <h4>特殊演出</h4>
      <div class="row wrap">
        <button class="btn s" data-gsp="promoOk" type="button">昇格成功→RUSH突入</button>
        <button class="btn s" data-gsp="promoNg" type="button">昇格失敗→神龍チャレンジ</button>
        <button class="btn s" data-gsp="direct" type="button">10R RUSH直撃</button>
        <button class="btn s" data-gsp="rushHit" type="button">RUSH中 撃破</button>
        <button class="btn s" data-gsp="rushLast" type="button">RUSH ラストチャンス</button>
        <button class="btn s" data-gsp="lt" type="button">LT ULTIMATE BURST突入</button>
        <button class="btn s" data-gsp="jitanHit" type="button">神龍チャレンジ 引き戻し</button>
        <button class="btn s" data-gsp="end" type="button">RUSH終了画面</button>
      </div>
      <p class="note">※鑑賞中は実戦の打ち出しが止まります。抽選・収支には一切影響しません。</p>`;
    $('#gRandom').addEventListener('click', () => {
      const hit = $('#gHit').value === '1';
      const p = planNormal(this.m.spec, hit, Math.random, $('#gReach').value ? { reach: $('#gReach').value } : {});
      $$('[data-y]').forEach(s => { const v = p.y[s.dataset.y]; s.value = v == null ? (s.dataset.y === 'hold' ? '0' : '') : String(v); });
    });
    $('#gPlay').addEventListener('click', () => this.galleryPlay());
    $('#gAll').addEventListener('click', () => this.galleryAll());
    $('#gSkip').addEventListener('click', () => T.skipNow());
    $('#gStop').addEventListener('click', () => { this.gallerying = false; this.galleryStop = true; T.skipNow(); });
    $$('[data-gsp]').forEach(b => b.addEventListener('click', () => this.gallerySpecial(b.dataset.gsp)));
  },
  async galleryPrep() {
    if (this.gallerying) return false;
    if (this.inBonus || this.m.mode !== 'normal') { this.toast('大当り・RUSH中は鑑賞できません（早送りで終わらせてください）'); return false; }
    this.gallerying = true;
    this.setHandle(false);
    this.paused = true;
    if (this.busy) T.skipNow();
    for (let i = 0; i < 400 && this.busy; i++) await sleep(25);
    T.skip = false;
    $('#machine').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  },
  galleryDone() {
    T.skip = false; T.instant = false;
    Stage.clearFx(); Stage.small(false); Stage.setTheme('normal'); this.migi(false);
    this.paused = false; this.gallerying = false;
    this.renderHolds();
  },
  galleryPlan(reachId) {
    let hitSel = $('#gHit').value;
    const reach = reachId ?? $('#gReach').value;
    let hit;
    if (hitSel === 'r') { const r = REACH_BY_ID[reach]; hit = Math.random() < (r ? r.E : this.m.spec.low); }
    else hit = hitSel === '1';
    const forced = {};
    if (reach) forced.reach = reach;
    const prem = $('#gPrem').value; if (prem) forced.premium = prem;
    if ($('#gZu').value) forced.zugara = +$('#gZu').value;
    const p = planNormal(this.m.spec, hit, Math.random, forced);
    if (!reach) { p.reach = null; p.reels = makeReels(hit && !prem ? false : hit, false); if (hit) p.reels = makeReels(true, false, Math.random, forced.zugara); }
    if (reachId == null) {
      $$('[data-y]').forEach(s => { const k = s.dataset.y; p.y[k] = s.value === '' ? null : +s.value; });
      p.holdFinal = p.y.hold ?? 0; p.holdInit = p.holdFinal > 0 ? 0 : 0;
    } else {
      // 連続鑑賞は予告を軽めに
      for (const k of ['jikai', 'pseudo', 'scouter', 'radar', 'serif', 'kaioken', 'ginyu', 'satan', 'yamcha', 'fusion', 'kame', 'revive']) p.y[k] = null;
    }
    if (p.y.revive != null && !hit) p.y.revive = null;
    if (!hit && p.y.button === 5) p.y.button = 4;
    return p;
  },
  async galleryPlay() {
    if (!(await this.galleryPrep())) return;
    try {
      const p = this.galleryPlan();
      this.current = { spin: { mode: 'normal' }, plan: p };
      this.renderHolds();
      await Director.playNormal({ holdsAfter: 0 }, p, { onHoldChange: () => this.renderHolds(true) });
      await sleep(600);
    } finally { this.current = null; this.galleryDone(); }
  },
  async galleryAll() {
    if (!(await this.galleryPrep())) return;
    this.toast('名シーンを連続再生します（Sキー／演出スキップで1つ飛ばし）');
    try {
      this.galleryStop = false;
      for (const r of REACHES.filter(r => r.tier === 'SP' || r.tier === 'SPSP' || r.tier === 'ZEN')) {
        if (this.galleryStop) break;
        T.skip = false;
        const p = this.galleryPlan(r.id);
        await Director.playNormal({ holdsAfter: 0 }, p, {});
        await sleep(400);
      }
    } finally { this.galleryDone(); }
  },
  async gallerySpecial(kind) {
    if (!(await this.galleryPrep())) return;
    // 鑑賞用のダミー台（収支に影響しない）
    const dm = new Machine(this.m.spec, { ...this.m.set, budget: 1e9 });
    const hooks = { update: () => {}, migi: (on) => this.migi(on), attacker: () => Board.spawn('R', 'atk') };
    const spec = this.m.spec;
    try {
      if (kind === 'promoOk' || kind === 'promoNg' || kind === 'direct') {
        const k = kind === 'direct' ? spec.heso.find(d => d.rounds >= 10) || spec.heso[0] : spec.heso.find(d => d.rounds <= 5 && d.next === (kind === 'promoOk' ? 'rush' : 'jitan'));
        const p = planNormal(spec, true); p.reach = 'normal'; p.y = { telop: 0, cutin: 0, button: 0, btype: 0 };
        await Director.playNormal({ holdsAfter: 0 }, p, {});
        await Director.playBonus({ kind: k, first: true, fromMode: 'normal', rounds: k.rounds, next: k.next }, dm, hooks);
      } else if (kind === 'rushHit' || kind === 'rushLast') {
        dm.mode = 'rush'; dm.c.chain = 3; dm.stLeft = kind === 'rushLast' ? 1 : 80;
        Stage.setTheme('rush');
        const p = planRush(true, Math.random, 'rush'); if (kind === 'rushHit') p.style = 1;
        await Director.playRush({ inSt: true, stLeft: dm.stLeft }, p, dm);
      } else if (kind === 'lt') {
        const k = spec.den.find(d => d.next === 'lt');
        if (!k) { this.toast('この機種にLTはありません'); return; }
        dm.mode = 'rush'; dm.c.chain = 4; Stage.setTheme('rush');
        await Director.playBonus({ kind: k, first: false, fromMode: 'rush', rounds: k.rounds, next: 'lt' }, dm, hooks);
      } else if (kind === 'jitanHit') {
        dm.mode = 'jitan'; dm.modeSpins = 60; Stage.setTheme('jitan');
        await Director.playJitan({}, planJitan(true), dm);
      } else if (kind === 'end') {
        await Director.modeEnd({ mode: 'rush', chain: 12, balls: 15230 }, dm);
      }
      await sleep(500);
    } finally { this.galleryDone(); }
  },
};

/* ---------- 確認ダイアログ（confirmの代わり） ---------- */
function ask(msg) {
  return new Promise(resolve => {
    const d = document.createElement('div');
    d.className = 'modal on ask';
    d.innerHTML = `<div class="modal-box"><p>${esc(msg)}</p><div class="row"><button class="btn primary" data-a="1" type="button">OK</button><button class="btn" data-a="0" type="button">キャンセル</button></div></div>`;
    d.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      if (!b && e.target !== d) return;
      d.remove(); resolve(!!b && b.dataset.a === '1');
    });
    document.body.appendChild(d);
  });
}

/* ---------- グラフ描画 ---------- */
function thinGraph(g, n) {
  if (g.length <= n) return g;
  const out = []; const step = g.length / n;
  for (let i = 0; i < n; i++) out.push(g[Math.floor(i * step)]);
  out.push(g[g.length - 1]);
  return out;
}
function drawGraph(cv, pts, opt = {}) {
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, W, H);
  if (!pts || pts.length < 2) { ctx.fillStyle = '#667'; ctx.font = '12px sans-serif'; ctx.fillText('データなし', 10, 20); return; }
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs, x0 + 1);
  let y0 = Math.min(0, ...ys), y1 = Math.max(0, ...ys);
  const pad = (y1 - y0) * 0.1 || 100; y0 -= pad; y1 += pad;
  const X = (x) => 36 + (x - x0) / (x1 - x0) * (W - 46);
  const Y = (y) => 8 + (y1 - y) / (y1 - y0) * (H - 22);
  ctx.strokeStyle = '#2a3350'; ctx.lineWidth = 1;
  ctx.font = '10px sans-serif'; ctx.fillStyle = '#8890a8';
  const step = niceStep((y1 - y0) / 4);
  for (let v = Math.ceil(y0 / step) * step; v <= y1; v += step) {
    ctx.beginPath(); ctx.moveTo(36, Y(v)); ctx.lineTo(W - 6, Y(v)); ctx.stroke();
    ctx.fillText(Math.abs(v) >= 10000 ? (v / 10000).toFixed(1) + '万' : String(Math.round(v)), 2, Y(v) + 3);
  }
  ctx.strokeStyle = '#aab'; ctx.beginPath(); ctx.moveTo(36, Y(0)); ctx.lineTo(W - 6, Y(0)); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = ys[ys.length - 1] >= 0 ? '#ffcf3a' : '#4fa3ff';
  ctx.beginPath();
  pts.forEach((p, i) => { const x = X(p[0]), y = Y(p[1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.stroke();
  ctx.fillStyle = '#8890a8';
  ctx.fillText(`${Math.round(x1)}${opt.xLabel || '回転'}`, W - 60, H - 3);
  if (opt.unit) ctx.fillText(opt.unit, 2, H - 3);
}
function niceStep(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(1, raw))));
  for (const m of [1, 2, 5, 10]) if (raw <= m * p) return m * p;
  return 10 * p;
}
function drawHist(cv, vals) {
  const ctx = cv.getContext('2d'); const W = cv.width, H = cv.height;
  ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, W, H);
  const lo = vals[0], hi = vals[vals.length - 1]; const bins = 30;
  const bw = (hi - lo) / bins || 1;
  const cnt = new Array(bins).fill(0);
  vals.forEach(v => cnt[Math.min(bins - 1, Math.floor((v - lo) / bw))]++);
  const mx = Math.max(...cnt);
  cnt.forEach((c, i) => {
    const x = 10 + i * (W - 20) / bins, h = c / mx * (H - 30);
    ctx.fillStyle = lo + (i + 0.5) * bw >= 0 ? '#ffcf3a' : '#4fa3ff';
    ctx.fillRect(x, H - 18 - h, (W - 20) / bins - 2, h);
  });
  ctx.fillStyle = '#aab'; ctx.font = '10px sans-serif';
  ctx.fillText(yen(lo), 10, H - 4); ctx.fillText(yen(hi), W - 80, H - 4);
  const zx = 10 + (0 - lo) / (hi - lo) * (W - 20);
  if (zx > 10 && zx < W - 10) { ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(zx, 0); ctx.lineTo(zx, H - 18); ctx.stroke(); }
}

window.addEventListener('DOMContentLoaded', () => {
  App.init();
  $('#csvBtn').addEventListener('click', () => App.exportCsv());
  $('#clearRec').addEventListener('click', async () => { if (await ask('全ての記録を削除しますか？（元に戻せません）')) { LS.set('records', []); App.renderRecords(); } });
  $('#newSession').addEventListener('click', () => App.settle());
});
