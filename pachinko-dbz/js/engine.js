/* =========================================================
 *  抽選エンジン（演出とは独立。早送り・シミュレーターでも共用）
 * ========================================================= */
'use strict';

class Machine {
  constructor(spec, settings, rng = Math.random) {
    this.spec = spec;
    this.set = settings;           // { rot, budget, lendUnit, rate, densapoCost, netLossPerRound }
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.balls = 0;            // 持ち玉（上皿＋ドル箱）
    this.invest = 0;           // 現金投資（円）
    this.lent = 0;             // 借りた玉数
    this.mode = 'normal';      // normal | rush | lt | jitan
    this.stLeft = 0;           // 残りST（高確率）回数
    this.jtLeft = 0;           // 残り時短（低確率・電サポ）回数
    this.modeSpins = 0;        // 現モードの消化回転数
    this.hesoHold = [];
    this.denHold = [];
    this.frac = 0;             // 電サポ増減の端数
    this.c = {
      totalSpins: 0, spinsNormal: 0, sinceHit: 0,
      hits: 0, firstHits: 0, rushEntries: 0, ltEntries: 0,
      chain: 0, maxChain: 0, chainBalls: 0, maxChainBalls: 0,
      totalOut: 0,            // 大当りによる純増合計
      maxBalls: 0,
      hitLog: [],             // {spin, kind, label, mode, chain}
      graph: [[0, 0]],        // [総回転, 差玉]
      rushLog: [],            // {chain, balls, lt}
      ev: 0,                  // 仕事量（理論期待値の積算・円）
      normalUsed: 0,          // 通常時の消費玉（純）：実測回転率用
    };
  }

  /* ---------- 各種確率 ---------- */
  get densapo() { return this.mode !== 'normal'; }
  get pHeso() { const r = this.set.rot / 250; return r / (1 + r); }   // ヘソ賞球1込みで「千円=250玉でrot回転」になる入賞率
  get diff() { return this.balls - this.lent; }                        // 差玉

  /* ---------- 貸し出し ---------- */
  canLend() { return this.invest + this.set.lendUnit <= this.set.budget; }
  lend() {
    if (!this.canLend()) return false;
    const b = Math.round(this.set.lendUnit / 4);
    this.invest += this.set.lendUnit;
    this.balls += b;
    this.lent += b;
    return true;
  }

  /* ---------- 打ち出し（左打ち・1球） ---------- *
   * return: null=玉切れ（投資上限）, {heso:bool, held:bool}
   */
  shootLeft() {
    if (this.balls <= 0 && !this.lend()) return null;
    this.balls -= 1;
    this.c.normalUsed += 1;
    if (this.rng() < this.pHeso) {
      this.balls += this.spec.prize.heso;
      this.c.normalUsed -= this.spec.prize.heso;
      if (this.hesoHold.length < 4) {
        const h = this.makeHold('heso');
        this.hesoHold.push(h);
        return { heso: true, held: true, hold: h };
      }
      return { heso: true, held: false };
    }
    return { heso: false };
  }

  /* 電サポ中：電チュー保留補充（右打ち）。1回転あたりの玉増減は変動開始時に計上 */
  fillDen() {
    if (this.denHold.length >= 4) return null;
    if (this.balls <= 0 && !this.lend()) return null;
    const h = this.makeHold('den');
    this.denHold.push(h);
    return h;
  }

  makeHold(src) {
    // 抽選値は入賞時に取得。当否判定は変動開始時のモードで行う（確変中は残保留も高確率判定）
    const h = { src, r: this.rng(), r2: this.rng(), plan: null, id: Math.random().toString(36).slice(2, 9) };
    h.preview = this.judge(h, this.mode); // 先読み用（入賞時点のモード）
    return h;
  }

  judge(h, mode) {
    const p = (mode === 'rush' || mode === 'lt') && this.stLeft > 0 ? this.spec.high : this.spec.low;
    // 先読み時点でSTが残っているかを近似：ST残0のrush/ltは低確率
    const hit = h.r < p;
    if (!hit) return { hit: false };
    let table;
    if (h.src === 'heso') table = this.spec.heso;
    else if (mode === 'lt' && this.spec.lt.length) table = this.spec.lt;
    else table = this.spec.den;
    const W = table.reduce((s, d) => s + d.w, 0);
    let x = h.r2 * W, kind = table[table.length - 1];
    for (const d of table) { if ((x -= d.w) < 0) { kind = d; break; } }
    return { hit: true, kind };
  }

  /* ---------- 変動開始 ---------- */
  takeSpin() {
    let h = null;
    if (this.denHold.length) h = this.denHold.shift();       // 特図2優先消化
    else if (this.hesoHold.length) h = this.hesoHold.shift();
    if (!h) return null;
    const modeAtStart = this.mode;
    const inSt = (this.mode === 'rush' || this.mode === 'lt') && this.stLeft > 0;
    const res = this.judge(h, this.mode);
    this.c.totalSpins++;
    this.c.sinceHit++;
    if (this.mode === 'normal') this.c.spinsNormal++;
    if (this.densapo) {
      this.frac -= this.set.densapoCost;
      const whole = Math.trunc(this.frac);
      if (whole !== 0) { this.balls += whole; this.frac -= whole; }
      if (this.balls < 0) { this.lend(); }
      if (this.balls < 0) this.balls = 0;
    }
    this.modeSpins++;
    // 仕事量：通常時の現金投資ベースの期待値
    if (this.mode === 'normal' && this.evPerSpin != null) this.c.ev += this.evPerSpin;
    const spin = {
      hold: h, src: h.src, hit: res.hit, kind: res.kind || null, mode: modeAtStart, inSt,
      stLeft: this.stLeft, jtLeft: this.jtLeft, modeSpins: this.modeSpins,
      holdsAfter: this.hesoHold.length + this.denHold.length,
      spinNo: this.c.totalSpins, sinceHit: this.c.sinceHit,
    };
    return spin;
  }

  /* ---------- 変動終了 ---------- *
   * return: { bonus } or { modeEnd: {...} } or {}
   */
  endSpin(spin) {
    const c = this.c;
    if (spin.hit) {
      const k = spin.kind;
      const first = spin.mode === 'normal';
      c.hits++;
      if (first) { c.firstHits++; c.chain = 1; c.chainBalls = 0; }
      else c.chain++;
      c.maxChain = Math.max(c.maxChain, c.chain);
      c.hitLog.push({ spin: c.sinceHit, total: c.totalSpins, kind: k.id, label: k.label, rounds: k.rounds, mode: spin.mode, chain: c.chain, src: spin.src, time: Date.now() });
      c.sinceHit = 0;
      return { bonus: { kind: k, first, fromMode: spin.mode, rounds: k.rounds, next: k.next } };
    }
    // ハズレ：残回数を減算
    if (this.mode === 'rush' || this.mode === 'lt' || this.mode === 'jitan') {
      if (this.stLeft > 0) this.stLeft--;
      else if (this.jtLeft > 0) this.jtLeft--;
      if (this.stLeft <= 0 && this.jtLeft <= 0) return { modeEnd: this.endMode() };
    }
    this.pushGraph();
    return {};
  }

  endMode() {
    const prev = this.mode;
    const info = { mode: prev, chain: this.c.chain, balls: this.c.chainBalls, spins: this.modeSpins };
    if (prev === 'rush' || prev === 'lt') {
      this.c.rushLog.push({ chain: this.c.chain, balls: this.c.chainBalls, lt: prev === 'lt' || this._hadLt, time: Date.now() });
    }
    this._hadLt = false;
    this.mode = 'normal';
    this.stLeft = 0; this.jtLeft = 0; this.modeSpins = 0;
    // 電チュー残保留は通常時へ（低確率で判定）
    return info;
  }

  /* ---------- 大当りラウンド ---------- */
  roundResult() {
    // 1R：10カウント×賞球。打ち出しロス＋オーバー入賞をざっくり乱数化
    const p = this.spec.prize;
    const loss = this.set.netLossPerRound;
    const jitter = Math.round((this.rng() - 0.5) * 4);
    const net = p.attacker * p.count - loss + jitter;
    return net;
  }
  addRound(net) {
    this.balls += net;
    this.c.totalOut += net;
    this.c.chainBalls += net;
    this.c.maxBalls = Math.max(this.c.maxBalls, this.balls);
  }

  /* 大当り終了後のモード移行 */
  finishBonus(bonus) {
    const k = bonus.kind;
    const next = k.next;
    const prev = this.mode;
    if (next === 'rush') {
      if (prev !== 'rush' && prev !== 'lt') { this.c.rushEntries++; }
      this.mode = 'rush';
      const m = this.spec.modes.rush; this.stLeft = m.st; this.jtLeft = m.jitan;
    } else if (next === 'lt') {
      if (prev !== 'lt') this.c.ltEntries++;
      if (prev !== 'rush' && prev !== 'lt') this.c.rushEntries++;
      this._hadLt = true;
      this.mode = 'lt';
      const m = this.spec.modes.lt; this.stLeft = m.st; this.jtLeft = m.jitan;
    } else if (next === 'jitan') {
      this.mode = 'jitan';
      const m = this.spec.modes.jitan; this.stLeft = 0; this.jtLeft = m.jitan;
    }
    this.modeSpins = 0;
    this.pushGraph();
    return { mode: this.mode };
  }

  /* 大当りを一括処理（早送り用） */
  runBonusInstant(bonus) {
    for (let i = 0; i < bonus.rounds; i++) this.addRound(this.roundResult());
    return this.finishBonus(bonus);
  }

  pushGraph() {
    const g = this.c.graph;
    const last = g[g.length - 1];
    const pt = [this.c.totalSpins, this.diff];
    if (last && last[0] === pt[0]) g[g.length - 1] = pt; else g.push(pt);
    if (g.length > 6000) { // 間引き
      const ng = [];
      for (let i = 0; i < g.length; i += 2) ng.push(g[i]);
      if (ng[ng.length - 1] !== g[g.length - 1]) ng.push(g[g.length - 1]);
      this.c.graph = ng;
    }
  }

  /* ---------- 早送り ---------- *
   * stopWhen: 'hit' | 'modeEnd' | number(回転数)
   * return: { spin(当りスピン,未消化), reason }
   * 当りスピンは takeSpin 済みで endSpin していない状態で返す（演出を見せるため）
   */
  fastForward(stopWhen, opts = {}) {
    const maxIter = 5_000_000;
    let spins = 0;
    const startMode = this.mode;
    for (let it = 0; it < maxIter; it++) {
      if (opts.maxNormal && this.mode === 'normal' && this.c.spinsNormal >= opts.maxNormal) return { reason: 'count' };
      // 保留補充
      if (this.densapo) {
        while (this.denHold.length < 4) { if (!this.fillDen()) break; }
        if (!this.denHold.length && !this.hesoHold.length) return { reason: 'budget' };
      } else {
        // 保留4で止め打ち
        let guard = 0;
        while (this.hesoHold.length < 1 && guard++ < 100000) {
          if (this.shootLeft() === null) return { reason: 'budget' };
        }
      }
      const spin = this.takeSpin();
      if (!spin) continue;
      spins++;
      if (spin.hit && stopWhen === 'hit') return { reason: 'hit', spin };
      const r = this.endSpin(spin);
      if (r.bonus) {
        if (opts.showBonusHit && stopWhen === 'modeEnd') { return { reason: 'hitInMode', spin, pre: r }; }
        this.runBonusInstant(r.bonus);
      }
      if (stopWhen === 'modeEnd' && this.mode === 'normal') return { reason: 'modeEnd', info: r.modeEnd };
      if (typeof stopWhen === 'number' && spins >= stopWhen) return { reason: 'count' };
    }
    return { reason: 'limit' };
  }

  /* 精算 */
  settle() {
    const rate = this.set.rate;
    const yen = Math.floor(this.balls * rate);
    return {
      balls: this.balls, invest: this.invest, back: yen,
      profit: yen - this.invest,
      returnRate: this.invest > 0 ? yen / this.invest : null,
    };
  }

  snapshot() {
    return JSON.parse(JSON.stringify({
      balls: this.balls, invest: this.invest, lent: this.lent, mode: this.mode, stLeft: this.stLeft,
      jtLeft: this.jtLeft, modeSpins: this.modeSpins, frac: this.frac, c: this.c, _hadLt: this._hadLt,
      hesoHold: this.hesoHold.map(h => ({ ...h, plan: null })), denHold: this.denHold.map(h => ({ ...h, plan: null })),
    }));
  }
  restore(s) { Object.assign(this, s); }
}

/* ---------- ヘッドレス・シミュレーター ---------- */
function simulateSessions(spec, settings, sessions, spinsPerSession) {
  const results = [];
  const a = analyze(spec, settings);
  for (let s = 0; s < sessions; s++) {
    const m = new Machine(spec, { ...settings, budget: 1e12 });
    m.evPerSpin = a.evPerSpin;
    let guard = 0;
    while (guard++ < 1e6) {
      if (m.mode !== 'normal') { m.fastForward('modeEnd'); continue; }
      const r = m.fastForward('hit', { maxNormal: spinsPerSession });
      if (r.reason !== 'hit') break;
      const e = m.endSpin(r.spin);
      m.runBonusInstant(e.bonus);
    }
    const st = m.settle();
    results.push({ ...st, spins: m.c.spinsNormal, firstHits: m.c.firstHits, hits: m.c.hits, rush: m.c.rushEntries, maxChain: m.c.maxChain });
  }
  return results;
}
