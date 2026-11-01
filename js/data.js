/* ぶらりにっぽん — データ定義（乗り物・出発地・ランドマーク・都道府県） */
'use strict';

/* ---------- 乗り物 ----------
 * max: 最高速度 [km/h]   rev: 後退最高速度 [km/h]
 * accel / brake / drag: 加速・減速・惰性減速 [m/s^2]
 * turn: 最大旋回速度 [deg/s]   zoom/pitch: カメラ基準値
 * roads: 道路アシストで追従する道路の種類 ('car' | 'foot')
 */
const VEHICLES = {
  walk:   { label: '徒歩',         group: 'foot',  max: 5,   rev: 3,  accel: 1.5, brake: 3,  drag: 2.0, turn: 100, zoom: 19.2, pitch: 72, roads: 'foot' },
  run:    { label: 'ランニング',   group: 'foot',  max: 12,  rev: 4,  accel: 2.0, brake: 4,  drag: 2.0, turn: 90,  zoom: 18.9, pitch: 72, roads: 'foot' },
  bike:   { label: '自転車',       group: 'bike',  max: 25,  rev: 0,  accel: 1.2, brake: 3,  drag: 0.3, turn: 70,  zoom: 18.6, pitch: 72, roads: 'foot' },
  sedan:  { label: '乗用車',       group: 'car',   max: 140, rev: 20, accel: 3.0, brake: 7,  drag: 0.35, turn: 45, zoom: 18.0, pitch: 73, roads: 'car' },
  kei:    { label: '軽自動車',     group: 'car',   max: 110, rev: 20, accel: 2.3, brake: 7,  drag: 0.35, turn: 50, zoom: 18.1, pitch: 73, roads: 'car' },
  sports: { label: 'スポーツカー', group: 'car',   max: 300, rev: 25, accel: 7.5, brake: 11, drag: 0.35, turn: 45, zoom: 17.8, pitch: 74, roads: 'car' },
  truck:  { label: 'トラック',     group: 'car',   max: 100, rev: 15, accel: 1.3, brake: 4.5, drag: 0.3, turn: 35, zoom: 17.7, pitch: 70, roads: 'car' },
  bus:    { label: 'バス',         group: 'car',   max: 100, rev: 15, accel: 1.2, brake: 4.5, drag: 0.3, turn: 35, zoom: 17.7, pitch: 70, roads: 'car' },
  plane:  { label: '飛行機',       group: 'plane', max: 920, rev: 0,  accel: 9,   brake: 6,  drag: 0.4, turn: 14,  zoom: 16.5, pitch: 66, roads: null, plane: true },
};

const VEHICLE_GROUPS = [
  { id: 'foot',  label: '徒歩・ラン', icon: '🚶', items: ['walk', 'run'] },
  { id: 'bike',  label: '自転車',     icon: '🚲', items: ['bike'] },
  { id: 'car',   label: '車',         icon: '🚗', items: ['sedan', 'kei', 'sports', 'truck', 'bus'] },
  { id: 'plane', label: '飛行機',     icon: '✈️', items: ['plane'] },
];

/* 倍速の段階 */
const SPEED_MULTIPLIERS = [1, 2, 3, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

/* ---------- 出発地のおすすめ ---------- */
const START_SPOTS = [
  { name: '東京駅',         lng: 139.76712, lat: 35.68075, heading: 270 },
  { name: '銀座四丁目',     lng: 139.76505, lat: 35.67175, heading: 320 },
  { name: '渋谷駅',         lng: 139.70160, lat: 35.65840, heading: 0 },
  { name: '新宿駅',         lng: 139.70060, lat: 35.69040, heading: 90 },
  { name: '池袋駅',         lng: 139.71090, lat: 35.72950, heading: 180 },
  { name: '上野駅',         lng: 139.77730, lat: 35.71360, heading: 180 },
  { name: '品川駅',         lng: 139.74000, lat: 35.62850, heading: 0 },
  { name: '羽田空港',       lng: 139.78070, lat: 35.54940, heading: 340 },
  { name: '横浜みなとみらい', lng: 139.63300, lat: 35.45700, heading: 60 },
  { name: '名古屋駅',       lng: 136.88160, lat: 35.17090, heading: 90 },
  { name: '京都駅',         lng: 135.75880, lat: 34.98580, heading: 0 },
  { name: '大阪・梅田',     lng: 135.49820, lat: 34.70250, heading: 180 },
  { name: '大阪・難波',     lng: 135.50130, lat: 34.66620, heading: 0 },
  { name: '神戸・三宮',     lng: 135.19560, lat: 34.69500, heading: 180 },
  { name: '広島駅',         lng: 132.47530, lat: 34.39740, heading: 250 },
  { name: '福岡・博多駅',   lng: 130.42070, lat: 33.58980, heading: 300 },
  { name: '札幌駅',         lng: 141.35060, lat: 43.06870, heading: 180 },
  { name: '仙台駅',         lng: 140.88250, lat: 38.26010, heading: 270 },
  { name: '那覇・国際通り', lng: 127.68960, lat: 26.21530, heading: 60 },
  { name: '那覇空港',       lng: 127.64650, lat: 26.20640, heading: 0 },
  { name: '富士山 五合目',  lng: 138.73330, lat: 35.39550, heading: 220 },
];

/* ---------- ランドマーク ----------
 * model: js/models.js にある立体モデルの種類（無いものはラベルのみ／地図データの建物で表示）
 * rank: 1 = 遠くからでも表示, 2 = 中ズーム, 3 = 近くのみ
 */
const LANDMARKS = [
  // 東京
  { name: '東京タワー',         lng: 139.745433, lat: 35.658581, rank: 1, model: 'tokyoTower' },
  { name: '東京スカイツリー',   lng: 139.810700, lat: 35.710063, rank: 1, model: 'skytree' },
  { name: '東京駅 丸の内駅舎',  lng: 139.765100, lat: 35.681200, rank: 2 },
  { name: '皇居',               lng: 139.752800, lat: 35.685175, rank: 2 },
  { name: '国会議事堂',         lng: 139.744858, lat: 35.675888, rank: 2 },
  { name: '東京都庁',           lng: 139.692101, lat: 35.689634, rank: 2 },
  { name: '渋谷スクランブル交差点', lng: 139.700553, lat: 35.659494, rank: 2 },
  { name: '明治神宮',           lng: 139.699326, lat: 35.676398, rank: 2 },
  { name: '浅草寺・雷門',       lng: 139.796340, lat: 35.711090, rank: 2 },
  { name: 'レインボーブリッジ', lng: 139.763100, lat: 35.636300, rank: 2 },
  { name: '東京ビッグサイト',   lng: 139.794200, lat: 35.629800, rank: 3 },
  { name: '六本木ヒルズ',       lng: 139.729100, lat: 35.660400, rank: 3 },
  { name: '日本武道館',         lng: 139.749700, lat: 35.693300, rank: 3 },
  { name: '上野恩賜公園',       lng: 139.771400, lat: 35.714600, rank: 3 },
  { name: '秋葉原電気街',       lng: 139.771500, lat: 35.699600, rank: 3 },
  { name: '羽田空港',           lng: 139.779800, lat: 35.549400, rank: 2 },
  { name: '成田空港',           lng: 140.392900, lat: 35.772000, rank: 2 },
  // 関東・中部
  { name: '横浜ランドマークタワー', lng: 139.631308, lat: 35.454735, rank: 2, model: 'landmarkTower' },
  { name: '横浜赤レンガ倉庫',   lng: 139.643000, lat: 35.452700, rank: 3 },
  { name: '鎌倉大仏',           lng: 139.535789, lat: 35.316830, rank: 2 },
  { name: '日光東照宮',         lng: 139.598800, lat: 36.758000, rank: 2 },
  { name: '富士山',             lng: 138.727363, lat: 35.360638, rank: 1 },
  { name: '松本城',             lng: 137.968783, lat: 36.238630, rank: 2, model: 'matsumotoCastle' },
  { name: '名古屋城',           lng: 136.899100, lat: 35.185600, rank: 1, model: 'nagoyaCastle' },
  { name: '兼六園',             lng: 136.662412, lat: 36.562123, rank: 2 },
  { name: '白川郷',             lng: 136.906400, lat: 36.257700, rank: 2 },
  // 近畿
  { name: '大阪城',             lng: 135.526201, lat: 34.687315, rank: 1, model: 'osakaCastle' },
  { name: '通天閣',             lng: 135.506306, lat: 34.652499, rank: 2, model: 'tsutenkaku' },
  { name: 'あべのハルカス',     lng: 135.513714, lat: 34.645942, rank: 2, model: 'harukas' },
  { name: '道頓堀',             lng: 135.501300, lat: 34.668700, rank: 3 },
  { name: '京都タワー',         lng: 135.759312, lat: 34.987514, rank: 2, model: 'kyotoTower' },
  { name: '金閣寺',             lng: 135.729243, lat: 35.039370, rank: 2, model: 'kinkakuji' },
  { name: '清水寺',             lng: 135.785046, lat: 34.994856, rank: 2 },
  { name: '伏見稲荷大社',       lng: 135.772672, lat: 34.967140, rank: 2 },
  { name: '東大寺 大仏殿',      lng: 135.839839, lat: 34.688993, rank: 2 },
  { name: '姫路城',             lng: 134.693906, lat: 34.839449, rank: 1, model: 'himejiCastle' },
  { name: '神戸ポートタワー',   lng: 135.186626, lat: 34.682621, rank: 2, model: 'kobeTower' },
  { name: '明石海峡大橋',       lng: 135.021400, lat: 34.616700, rank: 2 },
  // 中国・四国
  { name: '原爆ドーム',         lng: 132.453592, lat: 34.395483, rank: 2 },
  { name: '厳島神社 大鳥居',    lng: 132.318500, lat: 34.296300, rank: 2, model: 'torii' },
  { name: '出雲大社',           lng: 132.685526, lat: 35.401983, rank: 2 },
  { name: '瀬戸大橋',           lng: 133.816700, lat: 34.416700, rank: 2 },
  { name: '道後温泉',           lng: 132.786400, lat: 33.852100, rank: 3 },
  { name: '高知城',             lng: 133.531300, lat: 33.560700, rank: 2 },
  // 九州・沖縄
  { name: '福岡タワー',         lng: 130.351513, lat: 33.593316, rank: 2, model: 'fukuokaTower' },
  { name: '熊本城',             lng: 130.705834, lat: 32.806186, rank: 1, model: 'kumamotoCastle' },
  { name: '桜島',               lng: 130.657200, lat: 31.585300, rank: 1 },
  { name: '首里城',             lng: 127.719473, lat: 26.217047, rank: 1, model: 'shuriCastle' },
  // 北海道・東北
  { name: 'さっぽろテレビ塔',   lng: 141.356387, lat: 43.061068, rank: 2, model: 'sapporoTower' },
  { name: '札幌市時計台',       lng: 141.353628, lat: 43.062596, rank: 3 },
  { name: '五稜郭',             lng: 140.756981, lat: 41.796896, rank: 2 },
  { name: '仙台城跡',           lng: 140.856000, lat: 38.252800, rank: 2 },
];

/* 都道府県コード → 名称（住所表示のフォールバック用） */
const PREFECTURES = ['', '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県',
  '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県',
  '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県',
  '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'];
