/* =========================================================
 *  演出データ：キャラクター / 予告 / リーチ（名シーン）/ 期待度テーブル
 * ========================================================= */
'use strict';

/* ---------- キャラクター（色テーマ） ---------- */
const CH = {
  '悟空':       { c: ['#ff7a1a', '#1a3cff'], k: '空', aura: '#fff6' },
  '悟空(SS)':   { c: ['#ffd400', '#ff7a1a'], k: '空', aura: '#ffe600', ss: 1 },
  '悟空(SS3)':  { c: ['#ffe14d', '#ff7a1a'], k: '空', aura: '#ffe600', ss: 3 },
  '悟飯':       { c: ['#7a3cff', '#ff7a1a'], k: '飯', aura: '#fff6' },
  '悟飯(SS2)':  { c: ['#ffe600', '#7a3cff'], k: '飯', aura: '#ffe600', ss: 2 },
  'グレートサイヤマン': { c: ['#00a14b', '#e60012'], k: '正', aura: '#fff6' },
  '悟天':       { c: ['#ff7a1a', '#1a3cff'], k: '天', aura: '#fff6' },
  'ピッコロ':   { c: ['#3fa535', '#7a3cff'], k: '笛', aura: '#c9ffb0' },
  'ベジータ':   { c: ['#1a3cff', '#e8e8e8'], k: '王', aura: '#c8d4ff' },
  'ベジータ(SS)': { c: ['#ffd400', '#1a3cff'], k: '王', aura: '#ffe600', ss: 1 },
  '魔人ベジータ': { c: ['#ffd400', '#2a0040'], k: 'M', aura: '#ffe600', ss: 1 },
  'トランクス': { c: ['#7a5cff', '#2a2a2a'], k: '剣', aura: '#d9ccff' },
  'クリリン':   { c: ['#ff7a1a', '#ffd9b3'], k: '栗', aura: '#fff6' },
  'ヤムチャ':   { c: ['#ff7a1a', '#333'], k: '狼', aura: '#fff6' },
  '天津飯':     { c: ['#2f8f2f', '#fff'], k: '三', aura: '#fff6' },
  '餃子':       { c: ['#ffffff', '#ff4fa3'], k: '餃', aura: '#fff6' },
  'ゴテンクス': { c: ['#ffd400', '#1aa0ff'], k: 'G', aura: '#ffe600', ss: 3 },
  'ベジット':   { c: ['#ffd400', '#ff7a1a'], k: 'V', aura: '#ffe600', ss: 1 },
  '亀仙人':     { c: ['#ffffff', '#ff4f00'], k: '亀', aura: '#fff6' },
  'ブルマ':     { c: ['#28c6c6', '#ff4fa3'], k: 'B', aura: '#fff6' },
  'チチ':       { c: ['#d6005c', '#ffd400'], k: 'チ', aura: '#fff6' },
  'ビーデル':   { c: ['#2a2a2a', '#ff4fa3'], k: 'V', aura: '#fff6' },
  'ヤジロベー': { c: ['#8a5a2b', '#fff'], k: '侍', aura: '#fff6' },
  'ウーロン':   { c: ['#ff9ec7', '#333'], k: '豚', aura: '#fff6' },
  'プーアル':   { c: ['#5cb8ff', '#fff'], k: 'P', aura: '#fff6' },
  'ミスター・サタン': { c: ['#2a2a2a', '#ffd400'], k: '王', aura: '#fff6' },
  '界王様':     { c: ['#3a7bd5', '#111'], k: '界', aura: '#fff6' },
  '界王神':     { c: ['#b06cff', '#ffd400'], k: '神', aura: '#fff6' },
  '神様':       { c: ['#3fa535', '#fff'], k: '神', aura: '#fff6' },
  'デンデ':     { c: ['#3fa535', '#fff'], k: 'デ', aura: '#fff6' },
  'ミスター・ポポ': { c: ['#111', '#fff'], k: 'ポ', aura: '#fff6' },
  '最長老':     { c: ['#3fa535', '#ddd'], k: '長', aura: '#fff6' },
  'ラディッツ': { c: ['#5a3a2a', '#1a1a1a'], k: 'R', aura: '#c8a0ff' },
  'ナッパ':     { c: ['#5a3a2a', '#e8e8e8'], k: 'N', aura: '#ffb0b0' },
  '栽培マン':   { c: ['#4caf50', '#1a1a1a'], k: '栽', aura: '#b0ffb0' },
  'キュイ':     { c: ['#9b59b6', '#ccc'], k: 'Q', aura: '#fff6' },
  'ザーボン':   { c: ['#00a0a0', '#ffd400'], k: 'Z', aura: '#fff6' },
  'ドドリア':   { c: ['#ff69b4', '#333'], k: 'D', aura: '#fff6' },
  'ギニュー':   { c: ['#7a3cff', '#e8e8e8'], k: 'G', aura: '#d9b0ff' },
  'リクーム':   { c: ['#ff4f4f', '#e8e8e8'], k: 'R', aura: '#ffb0b0' },
  'バータ':     { c: ['#1a6cff', '#e8e8e8'], k: 'B', aura: '#b0d0ff' },
  'ジース':     { c: ['#ff3030', '#ffffff'], k: 'J', aura: '#ffb0b0' },
  'グルド':     { c: ['#3fa535', '#e8e8e8'], k: 'G', aura: '#b0ffb0' },
  'フリーザ':   { c: ['#ffffff', '#7a3cff'], k: 'F', aura: '#e8c8ff' },
  'フリーザ(最終)': { c: ['#ffffff', '#b000ff'], k: 'F', aura: '#ff8cff' },
  'コルド大王': { c: ['#ffffff', '#5a2a8a'], k: 'K', aura: '#e8c8ff' },
  'ドクター・ゲロ': { c: ['#dddddd', '#2a2a2a'], k: '20', aura: '#fff6' },
  '人造人間19号': { c: ['#ffffff', '#1a1a1a'], k: '19', aura: '#fff6' },
  '人造人間16号': { c: ['#ff7a1a', '#3fa535'], k: '16', aura: '#fff6' },
  '人造人間17号': { c: ['#1a1a1a', '#ff7a1a'], k: '17', aura: '#fff6' },
  '人造人間18号': { c: ['#ffe14d', '#1a3cff'], k: '18', aura: '#fff6' },
  'セル':       { c: ['#3fa535', '#111'], k: 'C', aura: '#b0ffb0' },
  'セル(完全体)': { c: ['#3fa535', '#ffffff'], k: 'C', aura: '#d0ffd0' },
  'セルジュニア': { c: ['#5cc0ff', '#111'], k: 'Jr', aura: '#b0e0ff' },
  'バビディ':   { c: ['#ffd400', '#5a2a8a'], k: 'B', aura: '#fff6' },
  'ダーブラ':   { c: ['#d6005c', '#111'], k: 'D', aura: '#ff8080' },
  '魔人ブウ':   { c: ['#ff9ec7', '#7a3cff'], k: 'ブ', aura: '#ffc0e0' },
  '魔人ブウ(純粋)': { c: ['#ff9ec7', '#ff3030'], k: 'ブ', aura: '#ff80c0' },
  'バーダック': { c: ['#2a2a2a', '#e60012'], k: 'B', aura: '#fff6' },
  'ウーブ':     { c: ['#5a3a2a', '#ff7a1a'], k: 'U', aura: '#fff6' },
  '神龍':       { c: ['#2f8f2f', '#ffd400'], k: '龍', aura: '#b0ffb0' },
  'ポルンガ':   { c: ['#2f8f2f', '#ffffff'], k: '龍', aura: '#b0ffb0' },
  'ナレーション': { c: ['#222', '#ffd400'], k: '…', aura: '#fff6' },
};
const ALL_CHARACTERS = Object.keys(CH).filter(k => k !== 'ナレーション');

/* ---------- 液晶図柄 ---------- */
const ZUGARA = [null,
  { n: 1, who: 'ヤムチャ' }, { n: 2, who: '天津飯' }, { n: 3, who: 'クリリン' },
  { n: 4, who: 'ピッコロ' }, { n: 5, who: '悟飯' }, { n: 6, who: 'トランクス' },
  { n: 7, who: '悟空' }, { n: 8, who: 'ベジータ' }, { n: 9, who: '悟天' },
];

/* ---------- 色テーブル ---------- */
const COLORS = ['白', '青', '緑', '赤', '金', '虹'];
const COLOR_CSS = { '白': '#f4f4f4', '青': '#2a7bff', '緑': '#1fc75a', '赤': '#ff1f3a', '金': '#ffd400', '虹': 'rainbow', 'DB': 'db' };

/*
 * 予告テーブル。cat：hit / missSP（SP以上ハズレ）/ missN（ノーマルハズレ）/ miss0（リーチなし）
 * occ: 出現率、w: 各段階の重み
 */
const YOKOKU = {
  hold: {
    name: '保留変化（先読み含む）',
    levels: ['白', '青', '緑', '赤', '金(ドラゴンボール柄)', '虹(神龍柄)'],
    occ: { hit: 1, missSP: 1, missN: 1, miss0: 1 },
    w: {
      hit:    [26, 18, 16, 24, 13, 3],
      missSP: [70, 17, 8.5, 4.2, 0.3, 0],
      missN:  [88, 10, 2, 0, 0, 0],
      miss0:  [97.5, 2.2, 0.3, 0, 0, 0],
    },
  },
  scouter: {
    name: 'スカウター予告（戦闘力）',
    levels: ['戦闘力 5', '戦闘力 1,500', '8000以上だ!', '戦闘力 18,000', '戦闘力 53万', '測定不能（スカウター爆発）'],
    occ: { hit: 0.45, missSP: 0.28, missN: 0.12, miss0: 0.025 },
    w: {
      hit:    [6, 10, 18, 24, 26, 16],
      missSP: [36, 30, 19, 10, 4.6, 0.4],
      missN:  [60, 32, 8, 0, 0, 0],
      miss0:  [80, 20, 0, 0, 0, 0],
    },
  },
  kaioken: {
    name: '界王拳ステップアップ予告',
    levels: ['界王拳!', '界王拳 3倍!', '界王拳 4倍!!', '界王拳 10倍!!!', '界王拳 20倍だーっ!!!!'],
    occ: { hit: 0.40, missSP: 0.30, missN: 0.10, miss0: 0.02 },
    w: {
      hit:    [8, 18, 28, 28, 18],
      missSP: [44, 31, 17, 7, 1],
      missN:  [75, 22, 3, 0, 0],
      miss0:  [90, 10, 0, 0, 0],
    },
  },
  radar: {
    name: 'ドラゴンレーダー予告（ブルマ）',
    levels: ['1個', '2個', '3個', '4個', '5個', '6個', '7個 そろった!'],
    occ: { hit: 0.30, missSP: 0.20, missN: 0.08, miss0: 0.02 },
    w: {
      hit:    [4, 7, 10, 14, 18, 21, 26],
      missSP: [30, 25, 18, 12, 9, 5, 1],
      missN:  [55, 30, 15, 0, 0, 0, 0],
      miss0:  [70, 30, 0, 0, 0, 0, 0],
    },
  },
  kame: {
    name: '亀仙人カットイン',
    levels: ['白', '青', '緑', '赤', '金'],
    occ: { hit: 0.50, missSP: 0.40, missN: 0.15, miss0: 0.02 },
    w: {
      hit:    [8, 14, 22, 38, 18],
      missSP: [52, 30, 12, 5.6, 0.4],
      missN:  [80, 18, 2, 0, 0],
      miss0:  [95, 5, 0, 0, 0],
    },
  },
  serif: {
    name: 'キャラセリフ予告',
    levels: ['白', '青', '緑', '赤', '金'],
    occ: { hit: 0.55, missSP: 0.45, missN: 0.25, miss0: 0.06 },
    w: {
      hit:    [10, 16, 22, 34, 18],
      missSP: [50, 30, 13, 6.5, 0.5],
      missN:  [76, 20, 4, 0, 0],
      miss0:  [92, 8, 0, 0, 0],
    },
  },
  ginyu: {
    name: 'ギニュー特戦隊 群予告',
    levels: ['ファイティングポーズ'],
    occ: { hit: 0.22, missSP: 0.05, missN: 0.004, miss0: 0.0005 },
    w: { hit: [1], missSP: [1], missN: [1], miss0: [1] },
  },
  fusion: {
    name: 'フュージョン予告',
    levels: ['失敗（太ゴテンクス）', '成功（ゴテンクス）', 'ポタラ（ベジット）'],
    occ: { hit: 0.16, missSP: 0.07, missN: 0.02, miss0: 0.003 },
    w: {
      hit:    [10, 55, 35],
      missSP: [75, 24, 1],
      missN:  [100, 0, 0],
      miss0:  [100, 0, 0],
    },
  },
  pseudo: {
    name: 'ドラゴンボール擬似連',
    levels: ['擬似2', '擬似3', '擬似4（激アツ）'],
    occ: { hit: 0.50, missSP: 0.28, missN: 0.05, miss0: 0.004 },
    w: {
      hit:    [26, 40, 34],
      missSP: [70, 27, 3],
      missN:  [100, 0, 0],
      miss0:  [100, 0, 0],
    },
  },
  jikai: {
    name: '次回予告',
    levels: ['次回予告'],
    occ: { hit: 0.10, missSP: 0.006, missN: 0, miss0: 0 },
    w: { hit: [1], missSP: [1], missN: [1], miss0: [1] },
  },
  satan: {
    name: 'ミスター・サタン予告',
    levels: ['ハーッハッハ!'],
    occ: { hit: 0.08, missSP: 0.06, missN: 0.02, miss0: 0.004 },
    w: { hit: [1], missSP: [1], missN: [1], miss0: [1] },
  },
  yamcha: {
    name: 'ヤムチャ予告（ガセ）',
    levels: ['ヤムチャ…'],
    occ: { hit: 0.02, missSP: 0.05, missN: 0.03, miss0: 0.006 },
    w: { hit: [1], missSP: [1], missN: [1], miss0: [1] },
  },
  telop: {
    name: 'リーチタイトル テロップ色',
    levels: ['白', '青', '緑', '赤', 'ドラゴンボール柄'],
    occ: { hit: 1, missSP: 1, missN: 1, miss0: 1 },
    w: {
      hit:    [4, 14, 26, 40, 16],
      missSP: [38, 36, 17, 8.5, 0.5],
      missN:  [100, 0, 0, 0, 0],
      miss0:  [100, 0, 0, 0, 0],
    },
  },
  cutin: {
    name: '最終カットイン',
    levels: ['青', '緑', '赤', '金'],
    occ: { hit: 1, missSP: 1, missN: 1, miss0: 1 },
    w: {
      hit:    [8, 18, 46, 28],
      missSP: [55, 30, 14, 1],
      missN:  [100, 0, 0, 0],
      miss0:  [100, 0, 0, 0],
    },
  },
  button: {
    name: 'ボタン色',
    levels: ['白', '青', '緑', '赤', '金', '虹（確定）'],
    occ: { hit: 1, missSP: 1, missN: 1, miss0: 1 },
    w: {
      hit:    [8, 14, 20, 36, 18, 4],
      missSP: [48, 29, 14, 8.6, 0.4, 0],
      missN:  [100, 0, 0, 0, 0, 0],
      miss0:  [100, 0, 0, 0, 0, 0],
    },
  },
  btype: {
    name: 'ボタンの種類',
    levels: ['PUSH', '連打（気をぶつけろ!）', '長押し（元気を集めろ!）', 'Zソード（剣）ボタン'],
    occ: { hit: 1, missSP: 1, missN: 1, miss0: 1 },
    w: {
      hit:    [30, 25, 25, 20],
      missSP: [62, 22, 14, 2],
      missN:  [100, 0, 0, 0],
      miss0:  [100, 0, 0, 0],
    },
  },
  revive: {
    name: '仙豆復活',
    levels: ['ヤジロベーが仙豆を投げた!'],
    occ: { hit: 0.06, missSP: 0, missN: 0, miss0: 0 },
    w: { hit: [1], missSP: [1], missN: [1], miss0: [1] },
  },
};

/* プレミア（確定）演出：当り時のみ */
const PREMIUM = [
  { id: 'shenron', name: '神龍降臨（願いを言え）', occHit: 0.012 },
  { id: 'porunga', name: 'ポルンガ降臨（タッカラプト ポッポルンガ プピリット パロ）', occHit: 0.006 },
  { id: 'kaiou',   name: '界王様のダジャレ（確定）', occHit: 0.008 },
  { id: 'bardock', name: 'バーダック 最後の抵抗（確定）', occHit: 0.005 },
];

/* ---------- 戦闘技 ---------- */
const TECHS = [
  { who: '悟空(SS)', name: 'かめはめ波', color: '#5cc8ff' },
  { who: 'ベジータ(SS)', name: 'ファイナルフラッシュ', color: '#ffe14d' },
  { who: 'ベジータ', name: 'ギャリック砲', color: '#c070ff' },
  { who: 'ベジータ(SS)', name: 'ビッグバンアタック', color: '#7ad7ff' },
  { who: '悟飯', name: '魔閃光', color: '#ffe14d' },
  { who: 'ピッコロ', name: '魔貫光殺砲', color: '#ffe14d' },
  { who: 'クリリン', name: '気円斬', color: '#ffe14d' },
  { who: 'ヤムチャ', name: '繰気弾', color: '#ffe14d' },
  { who: 'ヤムチャ', name: '狼牙風風拳', color: '#fff' },
  { who: '天津飯', name: '気功砲', color: '#ffe14d' },
  { who: 'トランクス', name: 'バーニングアタック', color: '#ffb340' },
  { who: 'トランクス', name: '剣で一閃', color: '#ffffff' },
  { who: 'ゴテンクス', name: 'スーパーゴーストカミカゼアタック', color: '#f0f0ff' },
  { who: '悟空(SS3)', name: 'かめはめ波（SS3）', color: '#5cc8ff' },
  { who: 'ベジット', name: 'ファイナルかめはめ波', color: '#7ad7ff' },
  { who: '悟空', name: '元気玉', color: '#7ad7ff' },
  { who: '人造人間18号', name: '気功波', color: '#ffe14d' },
  { who: '悟飯(SS2)', name: 'かめはめ波（片手）', color: '#5cc8ff' },
];
const RUSH_ENEMIES = [
  { who: 'ラディッツ', stage: '荒野' }, { who: 'ナッパ', stage: '荒野' }, { who: 'ベジータ', stage: '荒野' },
  { who: 'キュイ', stage: 'ナメック星' }, { who: 'ドドリア', stage: 'ナメック星' }, { who: 'ザーボン', stage: 'ナメック星' },
  { who: 'ギニュー', stage: 'ナメック星' }, { who: 'フリーザ(最終)', stage: 'ナメック星' }, { who: 'コルド大王', stage: '地球' },
  { who: '人造人間19号', stage: '南の都' }, { who: 'ドクター・ゲロ', stage: '山岳地帯' }, { who: '人造人間17号', stage: '山岳地帯' },
  { who: 'セル', stage: '島' }, { who: 'セル(完全体)', stage: 'セルゲーム会場' }, { who: 'セルジュニア', stage: 'セルゲーム会場' },
  { who: 'ダーブラ', stage: 'バビディの宇宙船' }, { who: '魔人ブウ', stage: '荒野' }, { who: '魔人ブウ(純粋)', stage: '界王神界' },
];

/* ---------- 名シーン回想（ラウンド中に流れる） ---------- */
const MEMORIES = [
  ['悟空', 'ラディッツ襲来。悟空は自らがサイヤ人だと知る'],
  ['ピッコロ', '宿敵ピッコロとの共闘。魔貫光殺砲がラディッツを貫く'],
  ['ピッコロ', '1年間の修行。悟飯を荒野に置き去りにしたピッコロ'],
  ['ヤムチャ', '栽培マンの自爆…ヤムチャ倒れる'],
  ['餃子', '「天さん…さよなら…」餃子、ナッパに特攻'],
  ['ピッコロ', '悟飯をかばうピッコロ「死ぬなよ…悟飯…」'],
  ['悟空', '筋斗雲で駆けつける悟空。界王拳でナッパを圧倒'],
  ['ベジータ', 'かめはめ波 vs ギャリック砲。界王拳4倍の賭け'],
  ['クリリン', '大猿ベジータへ、元気玉は悟飯→クリリン→悟飯へ'],
  ['ブルマ', 'ブルマ、ナメック星へ。ドラゴンレーダーを手に'],
  ['最長老', '最長老、クリリンと悟飯の潜在能力を引き出す'],
  ['ギニュー', 'ギニュー特戦隊、スペシャルファイティングポーズ'],
  ['ギニュー', 'ボディチェンジ！ …しかしカエルと入れ替わる'],
  ['フリーザ', '「私の戦闘力は53万です」'],
  ['ピッコロ', 'ネイルと同化したピッコロ、第二形態フリーザに挑む'],
  ['ベジータ', 'ベジータ、涙の最期。サイヤ人の誇りを悟空に託す'],
  ['悟空', '超元気玉…いや、ナメック星の元気玉がフリーザに直撃'],
  ['悟空(SS)', '「クリリンのことかーーーっ!!!!!」超サイヤ人覚醒'],
  ['トランクス', '謎の少年トランクス、フリーザを一刀両断'],
  ['悟空', '心臓病。人造人間との闘いの最中に倒れる悟空'],
  ['ベジータ(SS)', '「超ベジータだ!」ベジータ、超サイヤ人に'],
  ['人造人間16号', '16号「悟飯…もう我慢しなくていい…」'],
  ['悟飯(SS2)', '超サイヤ人2覚醒。セルジュニアを瞬殺'],
  ['悟空', '瞬間移動。セルと共に界王星へ…「じゃあな」'],
  ['悟飯(SS2)', '親子かめはめ波。悟空の声が悟飯に届く'],
  ['ミスター・サタン', 'セルゲームのヒーロー、ミスター・サタン'],
  ['グレートサイヤマン', '正義の味方グレートサイヤマン参上'],
  ['魔人ベジータ', '魔人ベジータ、ブウに挑み自らを犠牲に'],
  ['悟空(SS3)', '超サイヤ人3。金色の髪が腰まで伸びる'],
  ['ゴテンクス', 'フュー…ジョン！ はっ！ ゴテンクス誕生'],
  ['ベジット', 'ポタラ合体！ 最強戦士ベジット'],
  ['ミスター・サタン', 'サタンの呼びかけで地球人が手を上げる'],
  ['ベジータ', '「がんばれカカロット…おまえがナンバー1だ!!」'],
  ['悟空', '超元気玉！ 魔人ブウ、完全消滅'],
  ['ウーブ', '10年後。ウーブとの出会い'],
  ['亀仙人', '亀仙人、カメハウスで変わらぬマイペース'],
];

/* ---------- 次回予告タイトル（オリジナル） ---------- */
const JIKAI_TITLES = [
  '怒りの超サイヤ人!! 伝説が今目覚める',
  '悟飯の叫び! 父さんの声が聞こえる',
  'みんなの元気をオラにくれ!! 超元気玉炸裂',
  '最強の合体戦士! その名はベジット',
  'ギニュー特戦隊 ナメック星に参上!',
  'さらば誇り高き王子… ベジータ最期の賭け',
  '天下分け目の超決戦! 当たるぞ!!',
];

/* ---------- リーチ（名シーン）定義 ----------
 * tier: N=ノーマル / SP / SPSP / ZEN=全回転
 * f: 当り時の選択率 / E: 期待度（通常時）
 * steps: 演出ステップ（stage.jsで再生）
 * win/lose: 決着の演出
 */
const REACHES = [
  {
    id: 'normal', tier: 'N', name: 'ノーマルリーチ', f: 0.02, E: 0.015, stage: 'カメハウス',
    steps: [], win: [], lose: [],
  },
  {
    id: 'saibaman', tier: 'SP', name: '栽培マン襲来リーチ', f: 0.02, E: 0.04, stage: '荒野',
    vs: ['ヤムチャ', '栽培マン'],
    steps: [
      { t: 'line', who: 'ヤムチャ', text: 'ここはオレに任せてもらおうか' },
      { t: 'line', who: '栽培マン', text: 'キキッ…!!' },
      { t: 'narr', text: '栽培マンがヤムチャに飛びついた――！' },
    ],
    btn: '狼牙風風拳',
    win: [{ t: 'line', who: 'ヤムチャ', text: '狼牙風風拳!! 見たか!!' }],
    lose: [{ t: 'flash', color: '#fff' }, { t: 'narr', text: 'ヤムチャ…倒れる（あのポーズで）' }],
  },
  {
    id: 'raditz', tier: 'SP', name: '宿敵共闘リーチ ～魔貫光殺砲～', f: 0.04, E: 0.08, stage: '荒野',
    vs: ['悟空', 'ラディッツ'],
    steps: [
      { t: 'scouterNum', who: 'ラディッツ', val: '5', text: '戦闘力たったの5か…ゴミめ' },
      { t: 'line', who: '悟飯', text: 'お父さんをいじめるなーっ!!' },
      { t: 'flash', color: '#fff' },
      { t: 'line', who: 'ラディッツ', text: 'な、なんだこのガキの戦闘力は…!?' },
      { t: 'line', who: '悟空', text: 'ピッコロ! 今だ、オラごとやれっ!!' },
      { t: 'charge', who: 'ピッコロ', text: '指先に気が集中していく…', color: '#ffe14d' },
    ],
    btn: '魔貫光殺砲',
    win: [{ t: 'beamShot', who: 'ピッコロ', name: '魔貫光殺砲', color: '#ffe14d' }, { t: 'line', who: 'ピッコロ', text: '終わりだ…' }],
    lose: [{ t: 'line', who: 'ラディッツ', text: 'フン、そんな技など当たらん!' }],
  },
  {
    id: 'nappa', tier: 'SP', name: 'ナッパ襲来リーチ ～筋斗雲の到着～', f: 0.05, E: 0.12, stage: '荒野',
    vs: ['悟空', 'ナッパ'],
    steps: [
      { t: 'line', who: 'ナッパ', text: 'ベジータぁ、こいつらまとめて片付けちまうぜ' },
      { t: 'line', who: '天津飯', text: 'ハァァ…気功砲!!' },
      { t: 'line', who: '餃子', text: '天さん…さよなら…' },
      { t: 'flash', color: '#fff' },
      { t: 'line', who: 'ピッコロ', text: '死ぬなよ…悟飯…' },
      { t: 'narr', text: 'そのとき――黄色い雲が空を切り裂いた！' },
      { t: 'cut', who: '悟空', text: '待たせたな！' },
    ],
    btn: '界王拳',
    win: [{ t: 'aura', who: '悟空', color: '#ff2a2a', text: '界王拳!!' }, { t: 'narr', text: '一撃！ ナッパは崩れ落ちた！' }],
    lose: [{ t: 'line', who: 'ナッパ', text: 'へっへっへ、効かねえなぁ!' }],
  },
  {
    id: 'ginyu', tier: 'SP', name: 'ギニュー特戦隊リーチ ～ボディチェンジ～', f: 0.07, E: 0.18, stage: 'ナメック星',
    vs: ['悟空', 'ギニュー'],
    steps: [
      { t: 'pose', list: ['リクーム', 'バータ', 'ジース', 'グルド', 'ギニュー'] },
      { t: 'line', who: 'グルド', text: '時間よ止まれ!!' },
      { t: 'line', who: 'リクーム', text: 'リクーム…ウルトラ…ファイティング…' },
      { t: 'line', who: 'ギニュー', text: 'お前の体、いただくぞ! チェ～～ンジ!!' },
      { t: 'flash', color: '#c070ff' },
      { t: 'narr', text: 'ボディチェンジの光が放たれた――!' },
    ],
    btn: '投げろ!',
    win: [{ t: 'narr', text: '悟空が投げ込んだのは――カエル!!' }, { t: 'line', who: 'ギニュー', text: 'ケロ…ケロケロ!?' }],
    lose: [{ t: 'line', who: 'ギニュー', text: '素晴らしい! この体は頂いた!' }],
  },
  {
    id: 'galick', tier: 'SP', name: '超決戦リーチ ～かめはめ波vsギャリック砲～', f: 0.08, E: 0.25, stage: '荒野',
    vs: ['悟空', 'ベジータ'],
    steps: [
      { t: 'line', who: 'ベジータ', text: '地球ごと消してやる!! ギャリック砲!!' },
      { t: 'line', who: '悟空', text: 'か…め…は…め…' },
      { t: 'clash', a: { who: '悟空', name: 'かめはめ波', color: '#5cc8ff' }, b: { who: 'ベジータ', name: 'ギャリック砲', color: '#c070ff' } },
      { t: 'line', who: '悟空', text: '界王拳…3倍だーっ!!' },
      { t: 'line', who: '悟空', text: 'もうひとつおまけに… 4倍だーーっ!!' },
    ],
    btn: '界王拳4倍',
    win: [{ t: 'clashEnd', win: 'a' }, { t: 'narr', text: 'かめはめ波が押し勝った!!' }],
    lose: [{ t: 'clashEnd', win: 'b' }, { t: 'line', who: 'ベジータ', text: 'ハーッハッハ! 甘いぞカカロット!' }],
  },
  {
    id: 'freeza', tier: 'SP', name: '宇宙の帝王リーチ ～戦闘力53万～', f: 0.08, E: 0.28, stage: 'ナメック星',
    vs: ['ベジータ', 'フリーザ'],
    steps: [
      { t: 'scouterNum', who: 'フリーザ', val: '530,000', text: '私の戦闘力は53万です' },
      { t: 'line', who: 'フリーザ', text: 'ですが、もちろんフルパワーであなたと戦う気はありませんからご心配なく' },
      { t: 'transform', who: 'フリーザ', text: '第二形態…第三形態…' },
      { t: 'transform', who: 'フリーザ(最終)', text: '最終形態!!' },
      { t: 'line', who: 'ベジータ', text: '伝説の超サイヤ人は…このオレだ!!' },
      { t: 'narr', text: 'そのとき、メディカルマシーンの扉が開いた――' },
    ],
    btn: '悟空 参戦',
    win: [{ t: 'cut', who: '悟空', text: '後はオラにまかせろ' }, { t: 'narr', text: '悟空、フリーザを圧倒!!' }],
    lose: [{ t: 'line', who: 'フリーザ(最終)', text: 'ホーッホッホッホ!!' }],
  },
  {
    id: 'android', tier: 'SP', name: '人造人間リーチ ～未来から来た少年～', f: 0.07, E: 0.25, stage: '山岳地帯',
    vs: ['ベジータ(SS)', '人造人間17号'],
    steps: [
      { t: 'line', who: 'トランクス', text: '…フリーザ、おまえはオレが倒す' },
      { t: 'slash', who: 'トランクス' },
      { t: 'line', who: 'ドクター・ゲロ', text: '17号…18号…目覚めよ' },
      { t: 'line', who: '人造人間18号', text: 'ちょっとは楽しませてくれるのかい?' },
      { t: 'line', who: '人造人間16号', text: '……' },
      { t: 'aura', who: 'ベジータ(SS)', color: '#ffe600', text: '超ベジータだ!!' },
    ],
    btn: 'ビッグバンアタック',
    win: [{ t: 'beamShot', who: 'ベジータ(SS)', name: 'ビッグバンアタック', color: '#7ad7ff' }, { t: 'narr', text: '人造人間を吹き飛ばした!!' }],
    lose: [{ t: 'line', who: '人造人間17号', text: 'おしまいかい? つまらないな' }],
  },
  {
    id: 'gotenks', tier: 'SP', name: 'フュージョンリーチ ～最強の合体戦士～', f: 0.04, E: 0.30, stage: '神殿',
    vs: ['ゴテンクス', '魔人ブウ'],
    steps: [
      { t: 'line', who: 'ピッコロ', text: '30分だ。それ以上は合体が解ける' },
      { t: 'fusion', a: '悟天', b: 'トランクス' },
      { t: 'line', who: 'ゴテンクス', text: '死神様のお通りだ!!' },
      { t: 'line', who: 'ゴテンクス', text: 'スーパーゴーストカミカゼアタック!!' },
    ],
    btn: '超サイヤ人3',
    win: [{ t: 'aura', who: 'ゴテンクス', color: '#ffe600', text: '超サイヤ人3!!' }, { t: 'narr', text: 'ゴースト達が一斉に爆発!!' }],
    lose: [{ t: 'narr', text: '合体の時間切れ……' }],
  },
  {
    id: 'ssj', tier: 'SPSP', name: '怒りの超サイヤ人覚醒リーチ', f: 0.13, E: 0.55, stage: 'ナメック星（崩壊寸前）',
    vs: ['悟空', 'フリーザ(最終)'],
    steps: [
      { t: 'line', who: 'フリーザ(最終)', text: 'まずはこいつから死んでもらいましょうか' },
      { t: 'line', who: 'クリリン', text: 'ご、悟空…!!' },
      { t: 'flash', color: '#ffffff' }, { t: 'shake' },
      { t: 'narr', text: '……' },
      { t: 'rage', who: '悟空', text: 'クリリンのことかーーーーっ!!!!!' },
      { t: 'ssj', who: '悟空(SS)', text: 'オラは怒ったぞーーっ!!! フリーザーーっ!!!' },
    ],
    btn: '超サイヤ人覚醒',
    win: [{ t: 'cut', who: '悟空(SS)', text: '穏やかな心を持ちながら激しい怒りによって目覚めた伝説の戦士…' }, { t: 'narr', text: '超サイヤ人 孫悟空 覚醒!!' }],
    lose: [{ t: 'line', who: 'フリーザ(最終)', text: 'サルが…! ホーッホッホッホ!' }],
  },
  {
    id: 'ssj2', tier: 'SPSP', name: 'セルゲームリーチ ～超サイヤ人2覚醒～', f: 0.10, E: 0.50, stage: 'セルゲーム会場',
    vs: ['悟飯', 'セル(完全体)'],
    steps: [
      { t: 'line', who: 'セル(完全体)', text: 'さぁ、セルジュニア達よ。遊んでやれ' },
      { t: 'line', who: '人造人間16号', text: '悟飯…もう我慢しなくていい…' },
      { t: 'line', who: '人造人間16号', text: '正しいことのために戦うことは罪ではない…' },
      { t: 'flash', color: '#fff' }, { t: 'shake' },
      { t: 'narr', text: 'セルが16号の頭を踏み潰した――' },
      { t: 'ssj', who: '悟飯(SS2)', text: '…………' },
    ],
    btn: '覚醒',
    win: [{ t: 'cut', who: '悟飯(SS2)', text: '許さないぞ…おまえたち…' }, { t: 'narr', text: '超サイヤ人2 覚醒!! セルジュニア一掃!!' }],
    lose: [{ t: 'line', who: 'セル(完全体)', text: 'どうした? その程度か!' }],
  },
  {
    id: 'majinvegeta', tier: 'SPSP', name: '誇り高き王子リーチ ～魔人ベジータ最期の賭け～', f: 0.07, E: 0.45, stage: '荒野',
    vs: ['魔人ベジータ', '魔人ブウ'],
    steps: [
      { t: 'line', who: 'トランクス', text: 'パパ…!' },
      { t: 'line', who: '魔人ベジータ', text: 'トランクス…赤ん坊の頃から抱いてやったことがなかったな' },
      { t: 'narr', text: 'ベジータは息子を気絶させ、ピッコロに託した――' },
      { t: 'line', who: '魔人ベジータ', text: 'さらばだ ブルマ…トランクス… そして カカロット…' },
      { t: 'charge', who: '魔人ベジータ', text: '全エネルギーを解放する…', color: '#ffe600' },
    ],
    btn: 'ファイナルエクスプロージョン',
    win: [{ t: 'flash', color: '#fff' }, { t: 'shake' }, { t: 'narr', text: 'ファイナルエクスプロージョン!! 誇り高き王子の一撃!!' }],
    lose: [{ t: 'flash', color: '#fff' }, { t: 'narr', text: 'ブウの肉片が…集まっていく……' }],
  },
  {
    id: 'ssj3', tier: 'SPSP', name: '超サイヤ人3リーチ ～時間稼ぎの超変身～', f: 0.05, E: 0.45, stage: '荒野',
    vs: ['悟空(SS3)', '魔人ブウ'],
    steps: [
      { t: 'line', who: '悟空', text: 'これが超サイヤ人を超えた…' },
      { t: 'ssj', who: '悟空(SS3)', text: 'さらにそれを超えた…超サイヤ人3だ!!' },
      { t: 'shake' },
      { t: 'line', who: '魔人ブウ', text: 'おまえ つよい! でも ブウ もっと つよい!' },
    ],
    btn: 'かめはめ波',
    win: [{ t: 'beamShot', who: '悟空(SS3)', name: 'かめはめ波', color: '#5cc8ff' }, { t: 'narr', text: '超サイヤ人3の全力が炸裂!!' }],
    lose: [{ t: 'narr', text: '時間切れ… 超サイヤ人3が解けてしまった' }],
  },
  {
    id: 'oyako', tier: 'SPSP', name: '親子かめはめ波リーチ', f: 0.09, E: 0.70, stage: 'セルゲーム会場',
    vs: ['悟飯(SS2)', 'セル(完全体)'],
    steps: [
      { t: 'line', who: 'セル(完全体)', text: '地球ごと消えてなくなれーっ!!' },
      { t: 'clash', a: { who: '悟飯(SS2)', name: 'かめはめ波（片手）', color: '#5cc8ff' }, b: { who: 'セル(完全体)', name: 'かめはめ波', color: '#9bff6b' } },
      { t: 'line', who: 'ベジータ', text: 'くそったれーーっ!!' },
      { t: 'voice', who: '悟空', text: '悟飯…今だ! 全てを出しきれ!! 父さんがついてるぞ!!' },
    ],
    btn: '親子かめはめ波',
    win: [{ t: 'clashEnd', win: 'a' }, { t: 'narr', text: '親子かめはめ波!! セル、完全消滅!!' }],
    lose: [{ t: 'clashEnd', win: 'b' }, { t: 'line', who: 'セル(完全体)', text: 'ふははは! 私の勝ちだ!' }],
  },
  {
    id: 'genki', tier: 'SPSP', name: '超元気玉リーチ ～おまえがナンバー1だ～', f: 0.07, E: 0.80, stage: '界王神界',
    vs: ['悟空', '魔人ブウ(純粋)'],
    steps: [
      { t: 'line', who: '悟空', text: 'みんな… オラに元気をわけてくれ!!' },
      { t: 'line', who: 'ミスター・サタン', text: '地球のみんな! 手を上げてくれーっ!!' },
      { t: 'genkiGather' },
      { t: 'line', who: 'ベジータ', text: 'がんばれカカロット… おまえがナンバー1だ!!' },
      { t: 'line', who: 'ポルンガ', text: '願いを叶えてやろう（悟空の体力が回復した）' },
    ],
    btn: '超元気玉',
    btnType: 2,
    win: [{ t: 'genkiShot', win: true }, { t: 'line', who: '悟空', text: 'またな!! 今度は…いいヤツに生まれ変われよ!' }],
    lose: [{ t: 'genkiShot', win: false }, { t: 'narr', text: '純粋ブウが元気玉を押し返す…!!' }],
  },
  {
    id: 'zenkaiten', tier: 'ZEN', name: '元気玉全回転リーチ', f: 0.02, E: 1.0, stage: '界王星',
    steps: [], win: [], lose: [],
  },
];
const REACH_BY_ID = Object.fromEntries(REACHES.map(r => [r.id, r]));

/* セリフ予告の候補 */
const SERIF_POOL = [
  ['悟空', 'オッス! オラ悟空! いっちょやってみっか!'],
  ['悟空', 'オラ、ワクワクすっぞ!'],
  ['ベジータ', 'カカロットォ…!!'],
  ['ベジータ', 'オレはサイヤ人の王子だ!'],
  ['ピッコロ', '悟飯、ぼーっとするな!'],
  ['悟飯', 'お父さん…!'],
  ['クリリン', 'ずるいぞ悟空!'],
  ['ブルマ', 'ちょっとベジータ! ちゃんと聞いてるの!?'],
  ['ブルマ', 'ドラゴンレーダーに反応あり!'],
  ['亀仙人', 'ほっほっほ。どれ、ワシも見物しようかの'],
  ['チチ', '悟飯ちゃんは勉強するだ!'],
  ['天津飯', '餃子…見ていろ…!'],
  ['トランクス', 'この時代の悟空さんに…'],
  ['人造人間18号', 'あたしたちはただ遊んでるだけさ'],
  ['セル(完全体)', '完全体になった気分は最高だ!'],
  ['フリーザ', '大人しくドラゴンボールを渡しなさい'],
  ['ギニュー', 'ギニュー特戦隊、参上!'],
  ['バータ', '宇宙一のスピードを見せてやる!'],
  ['ジース', 'クラッシャーボール!'],
  ['界王様', '悟空、時間がないぞ!'],
  ['界王神', 'これは…バビディの仕業です'],
  ['魔人ブウ', 'おまえ、チョコになっちゃえ!'],
  ['ミスター・サタン', 'ハーッハッハ! 世界チャンピオンのサタン様だ!'],
  ['ビーデル', 'グレートサイヤマン、正体を見せなさい!'],
  ['ヤジロベー', '仙豆、持ってきてやったぞ'],
  ['ウーロン', 'ギャルのパンティおくれーっ!'],
  ['デンデ', '大丈夫、ボクが治します!'],
  ['ミスター・ポポ', 'ミスター・ポポ、ここで待つ'],
  ['ナッパ', 'ベジータ、こいつ戦闘力が変わったぞ!'],
  ['ラディッツ', 'カカロット、なぜ地球人を滅ぼさなかった'],
  ['ダーブラ', '暗黒魔界の王、ダーブラ'],
  ['バビディ', 'パッパラパー!'],
];

/* ---------- 期待度ユーティリティ ---------- */
function pickWeighted(weights, rng = Math.random) {
  const W = weights.reduce((s, w) => s + w, 0);
  if (W <= 0) return 0;
  let x = rng() * W;
  for (let i = 0; i < weights.length; i++) { if ((x -= weights[i]) < 0) return i; }
  return weights.length - 1;
}

/* 通常時のハズレ時リーチ出現率（1変動あたり）を期待度から逆算 */
function missReachTable(spec) {
  const ph = spec.low;
  const rows = REACHES.filter(r => r.E < 1).map(r => ({ r, freq: r.f * ph * (1 - r.E) / r.E / (1 - ph) }));
  return rows;
}

/* 予告ごとの期待度（理論値） */
function yokokuExpect(spec, key, levelIdx) {
  const y = YOKOKU[key];
  const ph = spec.low;
  // ハズレ時のカテゴリ比率
  const rows = missReachTable(spec);
  const pSP = rows.filter(x => x.r.tier !== 'N').reduce((s, x) => s + x.freq, 0);
  const pN = rows.filter(x => x.r.tier === 'N').reduce((s, x) => s + x.freq, 0);
  const p0 = 1 - pSP - pN;
  const prob = (cat) => {
    const w = y.w[cat]; const W = w.reduce((s, v) => s + v, 0);
    return y.occ[cat] * (W ? w[levelIdx] / W : 0);
  };
  const h = ph * prob('hit');
  const m = (1 - ph) * (pSP * prob('missSP') + pN * prob('missN') + p0 * prob('miss0'));
  return h + m > 0 ? h / (h + m) : 0;
}

/* ---------- 変動プラン生成（通常時） ---------- */
function planNormal(spec, hit, rng = Math.random, forced = {}) {
  const plan = { kind: 'normal', hit, y: {} };
  // リーチ選択
  let reach = null;
  if (forced.reach) reach = REACH_BY_ID[forced.reach];
  else if (hit) reach = REACHES[pickWeighted(REACHES.map(r => r.f), rng)];
  else {
    const rows = missReachTable(spec);
    const x = rng();
    let acc = 0;
    for (const row of rows) { acc += row.freq; if (x < acc) { reach = row.r; break; } }
  }
  plan.reach = reach ? reach.id : null;
  const cat = hit ? 'hit' : !reach ? 'miss0' : reach.tier === 'N' ? 'missN' : 'missSP';
  plan.cat = cat;

  const roll = (key) => {
    if (forced[key] != null) return forced[key];
    const y = YOKOKU[key];
    if (rng() >= y.occ[cat]) return null;
    return pickWeighted(y.w[cat], rng);
  };
  for (const key of Object.keys(YOKOKU)) plan.y[key] = roll(key);
  // ボタン種別はリーチ固有指定を優先
  if (reach && reach.btnType != null && forced.btype == null) plan.y.btype = reach.btnType;
  // 保留：初期色（変化前）
  plan.holdFinal = plan.y.hold ?? 0;
  plan.holdInit = plan.holdFinal > 0 && rng() < 0.55 ? Math.floor(rng() * plan.holdFinal) : plan.holdFinal;
  // プレミア
  plan.premium = forced.premium ?? null;
  if (hit && plan.premium == null) {
    for (const p of PREMIUM) { if (rng() < p.occHit) { plan.premium = p.id; break; } }
  }
  if (reach && reach.tier === 'ZEN') plan.premium = plan.premium || 'zenkaiten';
  // 復活は当り＆SP以上
  if (!(hit && reach && (reach.tier === 'SP' || reach.tier === 'SPSP'))) plan.y.revive = null;
  // 虹ボタンは当りのみ
  if (!hit && plan.y.button === 5) plan.y.button = 3;
  // 図柄
  plan.reels = makeReels(hit, !!reach, rng, forced.zugara);
  return plan;
}

function makeReels(hit, reach, rng = Math.random, forcedNum) {
  const r9 = () => 1 + Math.floor(rng() * 9);
  if (hit) { const n = forcedNum || r9(); return [n, n, n]; }
  if (reach) {
    const n = r9();
    const off = rng() < 0.7 ? (rng() < 0.5 ? 1 : -1) : (1 + Math.floor(rng() * 7));
    let c = ((n - 1 + off + 9) % 9) + 1;
    if (c === n) c = (n % 9) + 1;
    return [n, c, n];
  }
  let a = r9(), b = r9(), c = r9();
  if (a === c) c = (c % 9) + 1;
  return [a, b, c];
}

/* RUSH中 */
function planRush(hit, rng = Math.random, modeKey = 'rush') {
  const plan = { kind: modeKey, hit };
  plan.tech = TECHS[Math.floor(rng() * TECHS.length)];
  // 演出：当り時の告知タイプ
  // 0:即撃破(先告知) 1:バトル決着 2:ボタン告知 3:後告知(変動停止後)
  plan.style = hit ? pickWeighted([25, 40, 25, 10], rng) : (rng() < 0.12 ? 1 : (rng() < 0.05 ? 2 : -1));
  plan.chanceColor = pickWeighted(hit ? [10, 30, 40, 20] : [60, 30, 9, 1], rng);
  plan.reels = makeReels(hit, false, rng);
  return plan;
}

/* 時短（神龍チャレンジ） */
function planJitan(hit, rng = Math.random) {
  return { kind: 'jitan', hit, style: hit ? pickWeighted([50, 50], rng) : (rng() < 0.08 ? 1 : -1), reels: makeReels(hit, false, rng) };
}
