/* =========================================================
 *  スペック定義 & 理論値計算
 *  e ドラゴンボールZ 超覚醒 (ファンメイド・個人で楽しむ用)
 * ========================================================= */
'use strict';

const SPECS = {
  /* ---------- 319ver（ミドル・LT搭載）---------- */
  '319': {
    id: '319',
    name: 'e ドラゴンボールZ 超覚醒 319ver',
    short: '319ver',
    typeLabel: 'ST機（ラッキートリガー搭載）',
    low: 1 / 319.7,
    high: 1 / 99.4,
    lowLabel: '1/319.7',
    highLabel: '1/99.4',
    prize: { heso: 1, den: 1, other: 3, attacker: 15, count: 10 },
    // ヘソ（特図1）振り分け
    heso: [
      { id: 'H10R', w: 3,  rounds: 10, label: '10R（約1500発）＋超サイヤ人RUSH直行', next: 'rush' },
      { id: 'H3RR', w: 52, rounds: 3,  label: '3R（約450発）＋超サイヤ人RUSH',       next: 'rush' },
      { id: 'H3RJ', w: 45, rounds: 3,  label: '3R（約450発）＋神龍チャレンジ（時短100回）', next: 'jitan' },
    ],
    // 電チュー（特図2）振り分け（RUSH中・神龍チャレンジ中）
    den: [
      { id: 'D3000', w: 3,  rounds: 20, label: '3000発（10R×2）＋LT「ULTIMATE BURST」突入', next: 'lt' },
      { id: 'D1500', w: 62, rounds: 10, label: '10R（約1500発）＋超サイヤ人RUSH継続',   next: 'rush' },
      { id: 'D450',  w: 35, rounds: 3,  label: '3R（約450発）＋超サイヤ人RUSH継続',     next: 'rush' },
    ],
    // LT（上位RUSH）中 電チュー振り分け
    lt: [
      { id: 'L3000', w: 50, rounds: 20, label: '3000発（10R×2）＋ULTIMATE BURST継続', next: 'lt' },
      { id: 'L1500', w: 50, rounds: 10, label: '10R（約1500発）＋ULTIMATE BURST継続', next: 'lt' },
    ],
    modes: {
      rush:  { name: '超サイヤ人RUSH',        st: 163, jitan: 0 },
      lt:    { name: 'ULTIMATE BURST',        st: 163, jitan: 200 },
      jitan: { name: '神龍チャレンジ',        st: 0,   jitan: 100 },
    },
  },

  /* ---------- 399ver（荒波・LT搭載）---------- */
  '399': {
    id: '399',
    name: 'e ドラゴンボールZ 超覚醒 399ver',
    short: '399ver',
    typeLabel: 'ST機（ラッキートリガー搭載・オール1500）',
    low: 1 / 399.6,
    high: 1 / 79.9,
    lowLabel: '1/399.6',
    highLabel: '1/79.9',
    prize: { heso: 1, den: 1, other: 3, attacker: 15, count: 10 },
    heso: [
      { id: 'H10R', w: 2,  rounds: 10, label: '10R（約1500発）＋超サイヤ人RUSH直行', next: 'rush' },
      { id: 'H3RR', w: 48, rounds: 3,  label: '3R（約450発）＋超サイヤ人RUSH',       next: 'rush' },
      { id: 'H3RJ', w: 50, rounds: 3,  label: '3R（約450発）＋神龍チャレンジ（時短100回）', next: 'jitan' },
    ],
    den: [
      { id: 'D3000', w: 5, rounds: 20, label: '3000発（10R×2）＋LT「ULTIMATE BURST」突入', next: 'lt' },
      { id: 'D1500', w: 95, rounds: 10, label: '10R（約1500発）＋超サイヤ人RUSH継続',   next: 'rush' },
    ],
    lt: [
      { id: 'L3000', w: 50, rounds: 20, label: '3000発（10R×2）＋ULTIMATE BURST継続', next: 'lt' },
      { id: 'L1500', w: 50, rounds: 10, label: '10R（約1500発）＋ULTIMATE BURST継続', next: 'lt' },
    ],
    modes: {
      rush:  { name: '超サイヤ人RUSH', st: 135, jitan: 0 },
      lt:    { name: 'ULTIMATE BURST', st: 135, jitan: 120 },
      jitan: { name: '神龍チャレンジ', st: 0,   jitan: 100 },
    },
  },

  /* ---------- 甘デジ 1/99.9ver ---------- */
  '99': {
    id: '99',
    name: 'e ドラゴンボールZ 超覚醒 甘デジ 99ver',
    short: '甘99ver',
    typeLabel: 'ST機（甘デジ）',
    low: 1 / 99.9,
    high: 1 / 39.9,
    lowLabel: '1/99.9',
    highLabel: '1/39.9',
    prize: { heso: 1, den: 1, other: 3, attacker: 10, count: 10 },
    heso: [
      { id: 'H3RR', w: 50, rounds: 3, label: '3R（約300発）＋超サイヤ人RUSH', next: 'rush' },
      { id: 'H3RJ', w: 50, rounds: 3, label: '3R（約300発）＋神龍チャレンジ（時短50回）', next: 'jitan' },
    ],
    den: [
      { id: 'D10R', w: 20, rounds: 10, label: '10R（約1000発）＋RUSH継続', next: 'rush' },
      { id: 'D5R',  w: 80, rounds: 5,  label: '5R（約500発）＋RUSH継続',   next: 'rush' },
    ],
    lt: [],
    modes: {
      rush:  { name: '超サイヤ人RUSH', st: 55, jitan: 0 },
      lt:    { name: 'ULTIMATE BURST', st: 55, jitan: 0 },
      jitan: { name: '神龍チャレンジ', st: 0,  jitan: 50 },
    },
  },
};

const EXCHANGE_RATES = [
  { v: 4.0,  label: '等価（4.00円 / 25玉）' },
  { v: 3.57, label: '28玉交換（3.57円）' },
  { v: 3.33, label: '30玉交換（3.33円）' },
  { v: 3.03, label: '33玉交換（3.03円）' },
  { v: 2.5,  label: '40玉交換（2.50円）' },
];

/* 指定ラウンド数の総払出（グロス） */
function grossOf(spec, rounds) { return rounds * spec.prize.attacker * spec.prize.count; }

/* 継続率など */
function modeContinue(spec, modeKey) {
  const m = spec.modes[modeKey];
  return 1 - Math.pow(1 - spec.high, m.st) * Math.pow(1 - spec.low, m.jitan);
}
/* そのモード1回あたり（当たるか終わるまで）の期待回転数 */
function modeExpectedSpins(spec, modeKey) {
  const m = spec.modes[modeKey];
  const q = spec.high, p = spec.low;
  const a = m.st > 0 ? (1 - Math.pow(1 - q, m.st)) / q : 0;
  const surviveSt = Math.pow(1 - q, m.st);
  const b = m.jitan > 0 ? surviveSt * (1 - Math.pow(1 - p, m.jitan)) / p : 0;
  return a + b;
}

/**
 * 理論値計算
 * opts: { netLossPerRound, densapoCost, rate (円/玉), rot (千円あたり回転数) }
 */
function analyze(spec, opts) {
  const lossR = opts.netLossPerRound ?? 7;
  const cost = opts.densapoCost ?? 0.2;
  const net = (rounds) => grossOf(spec, rounds) - lossR * rounds;
  const sumW = (arr) => arr.reduce((s, d) => s + d.w, 0);

  const cU = modeContinue(spec, 'lt');
  const esU = modeExpectedSpins(spec, 'lt');
  const cN = modeContinue(spec, 'rush');
  const esN = modeExpectedSpins(spec, 'rush');
  const cJ = modeContinue(spec, 'jitan');
  const esJ = modeExpectedSpins(spec, 'jitan');

  // V_U：LT中の期待純増
  let VU = 0;
  if (spec.lt.length) {
    const W = sumW(spec.lt);
    const A = spec.lt.reduce((s, d) => s + d.w / W * net(d.rounds), 0);
    VU = (-cost * esU + cU * A) / (1 - cU);
  }
  // V_N：通常RUSH中の期待純増
  const WD = sumW(spec.den);
  let toN = 0, constN = 0;
  for (const d of spec.den) {
    const w = d.w / WD;
    if (d.next === 'rush') { toN += w; constN += w * net(d.rounds); }
    else { constN += w * (net(d.rounds) + VU); }
  }
  const VN = (-cost * esN + cN * constN) / (1 - cN * toN);
  // 電チュー当選時の価値
  const denHitValue = spec.den.reduce((s, d) => s + d.w / WD * (net(d.rounds) + (d.next === 'lt' ? VU : VN)), 0);
  // 時短中
  const VJ = -cost * esJ + cJ * denHitValue;

  const WH = sumW(spec.heso);
  let E = 0, rushDirect = 0;
  for (const d of spec.heso) {
    const w = d.w / WH;
    if (d.next === 'rush') { E += w * (net(d.rounds) + VN); rushDirect += w; }
    else { E += w * (net(d.rounds) + VJ); }
  }
  const rushEntry = rushDirect + (1 - rushDirect) * cJ;

  // 平均連チャン（RUSH 1回あたり、初当り含まず）
  const avgChainN = cN / (1 - cN);
  const avgChainU = spec.lt.length ? cU / (1 - cU) : 0;
  const ltRate = spec.den.filter(d => d.next === 'lt').reduce((s, d) => s + d.w / WD, 0);

  const rate = opts.rate ?? 4;
  const rot = opts.rot ?? 18;
  const border = 1000 / (spec.low * E * rate);      // 千円あたりボーダー
  const borderEq = 1000 / (spec.low * E * 4);
  const evPerSpin = spec.low * E * rate - 1000 / rot; // 円/回転（現金投資ベース）
  const payoutRate = (spec.low * E * rate) / (1000 / rot); // 機械割的な数値
  return {
    cN, cU, cJ, esN, esU, esJ, VN, VU, VJ, E, rushEntry, rushDirect, avgChainN, avgChainU, ltRate,
    border, borderEq, evPerSpin, payoutRate, denHitValue,
    netOf: net,
  };
}

/* 比率表示ヘルパ */
const pct = (x, d = 1) => (x * 100).toFixed(d) + '%';
