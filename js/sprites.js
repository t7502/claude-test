/* ぶらりにっぽん — 乗り物の後ろ姿（SVG） */
'use strict';

const Sprites = (() => {
  const wheel = (x, y, w = 26, h = 30) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#1b1b1d"/>`;
  const shadow = (w = 170) => `<ellipse cx="100" cy="133" rx="${w / 2}" ry="7" fill="rgba(0,0,0,.35)"/>`;
  const tail = (x, y, w = 26, h = 10) => `<rect class="tail" x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#d4141c"/>`;

  const S = {
    sedan: `
      ${shadow(176)}
      ${wheel(22, 100)}${wheel(152, 100)}
      <path d="M14 78 Q16 62 40 58 L160 58 Q184 62 186 78 L186 112 Q186 118 178 118 L22 118 Q14 118 14 112Z" fill="#3a6fb4"/>
      <path d="M46 58 Q56 26 76 24 L124 24 Q144 26 154 58Z" fill="#2f5e9b"/>
      <path d="M56 56 Q64 32 80 31 L120 31 Q136 32 144 56Z" fill="#9fc3df" opacity=".9"/>
      ${tail(20, 76, 34)}${tail(146, 76, 34)}
      <rect x="78" y="90" width="44" height="12" rx="2" fill="#f2f2f2"/><rect x="18" y="104" width="164" height="6" fill="#2a3240"/>`,
    kei: `
      ${shadow(150)}
      ${wheel(32, 100, 22)}${wheel(146, 100, 22)}
      <path d="M26 46 Q28 22 52 20 L148 20 Q172 22 174 46 L174 114 Q174 118 168 118 L32 118 Q26 118 26 114Z" fill="#f0c541"/>
      <path d="M40 26 L160 26 Q166 28 166 36 L166 62 L34 62 L34 36 Q34 28 40 26Z" fill="#9fc3df"/>
      ${tail(30, 70, 14, 26)}${tail(156, 70, 14, 26)}
      <rect x="80" y="88" width="40" height="12" rx="2" fill="#f2f2f2"/><rect x="28" y="106" width="144" height="6" fill="#4a4030"/>`,
    sports: `
      ${shadow(186)}
      ${wheel(14, 102, 32, 26)}${wheel(154, 102, 32, 26)}
      <path d="M6 92 Q8 74 34 70 L166 70 Q192 74 194 92 L194 116 Q194 120 186 120 L14 120 Q6 120 6 116Z" fill="#d4251f"/>
      <path d="M48 70 Q62 46 80 44 L120 44 Q138 46 152 70Z" fill="#b51e19"/>
      <path d="M60 68 Q70 52 84 50 L116 50 Q130 52 140 68Z" fill="#a8c7de"/>
      <rect x="10" y="60" width="180" height="6" rx="2" fill="#1d1d1d"/><rect x="26" y="64" width="6" height="10" fill="#1d1d1d"/><rect x="168" y="64" width="6" height="10" fill="#1d1d1d"/>
      ${tail(14, 86, 40, 7)}${tail(146, 86, 40, 7)}
      <circle cx="84" cy="114" r="5" fill="#777"/><circle cx="116" cy="114" r="5" fill="#777"/>`,
    truck: `
      ${shadow(180)}
      ${wheel(16, 108, 36, 22)}${wheel(148, 108, 36, 22)}
      <rect x="10" y="4" width="180" height="104" rx="4" fill="#eef0f2" stroke="#b8bec4" stroke-width="2"/>
      <line x1="100" y1="6" x2="100" y2="106" stroke="#b8bec4" stroke-width="2"/>
      <rect x="20" y="40" width="6" height="30" fill="#b8bec4"/><rect x="174" y="40" width="6" height="30" fill="#b8bec4"/>
      <rect x="10" y="108" width="180" height="8" fill="#2d2d2d"/>
      ${tail(14, 110, 22, 8)}${tail(164, 110, 22, 8)}`,
    bus: `
      ${shadow(180)}
      ${wheel(22, 110, 30, 20)}${wheel(148, 110, 30, 20)}
      <rect x="12" y="2" width="176" height="114" rx="10" fill="#2c9a5c"/>
      <rect x="12" y="60" width="176" height="56" rx="6" fill="#f3f3ee"/>
      <rect x="26" y="12" width="148" height="40" rx="4" fill="#a5c8dc"/>
      <rect x="62" y="74" width="76" height="18" rx="3" fill="#333"/><text x="100" y="88" font-size="12" fill="#ffcc33" text-anchor="middle" font-family="sans-serif">回送</text>
      ${tail(18, 96, 14, 16)}${tail(168, 96, 14, 16)}`,
    walk: `
      ${shadow(70)}
      <g class="bob">
        <rect class="legL" x="82" y="84" width="14" height="46" rx="6" fill="#2e3f63"/>
        <rect class="legR" x="104" y="84" width="14" height="46" rx="6" fill="#2e3f63"/>
        <rect x="74" y="40" width="52" height="52" rx="16" fill="#6c8ca8"/>
        <rect class="armL" x="64" y="44" width="12" height="40" rx="6" fill="#6c8ca8"/>
        <rect class="armR" x="124" y="44" width="12" height="40" rx="6" fill="#6c8ca8"/>
        <rect x="80" y="44" width="40" height="40" rx="10" fill="#8d6e4c"/>
        <circle cx="100" cy="24" r="18" fill="#2b2420"/>
      </g>`,
    run: `
      ${shadow(70)}
      <g class="bob">
        <rect class="legL" x="82" y="84" width="14" height="44" rx="6" fill="#1f1f2b"/>
        <rect class="legR" x="104" y="84" width="14" height="44" rx="6" fill="#1f1f2b"/>
        <rect x="76" y="42" width="48" height="48" rx="14" fill="#ff7a3d"/>
        <rect class="armL" x="64" y="46" width="12" height="34" rx="6" fill="#e7b896"/>
        <rect class="armR" x="124" y="46" width="12" height="34" rx="6" fill="#e7b896"/>
        <circle cx="100" cy="26" r="17" fill="#2b2420"/><rect x="83" y="20" width="34" height="5" fill="#ffffff"/>
      </g>`,
    bike: `
      ${shadow(60)}
      <rect x="95" y="88" width="10" height="44" rx="4" fill="#1b1b1d"/>
      <rect x="66" y="56" width="68" height="6" rx="3" fill="#777"/>
      <g class="bob">
        <rect class="legL" x="82" y="76" width="12" height="40" rx="6" fill="#2e3f63"/>
        <rect class="legR" x="106" y="76" width="12" height="40" rx="6" fill="#2e3f63"/>
        <rect x="76" y="30" width="48" height="50" rx="14" fill="#4aa36a"/>
        <circle cx="100" cy="16" r="16" fill="#e8e8e8"/><rect x="86" y="10" width="28" height="4" fill="#4aa36a"/>
      </g>
      <rect x="92" y="84" width="16" height="6" rx="2" fill="#d4141c" class="tail"/>`,
    plane: `
      <path d="M100 6 L108 50 L100 54 L92 50Z" fill="#e9edf2"/>
      <path d="M100 10 L106 46 L94 46Z" fill="#2f5aa8"/>
      <path d="M4 82 L92 70 L108 70 L196 82 L196 86 L108 82 L92 82 L4 86Z" fill="#dfe4ea"/>
      <path d="M58 54 L100 50 L142 54 L142 58 L100 56 L58 58Z" fill="#d5dbe2"/>
      <circle cx="100" cy="76" r="22" fill="#f2f4f7"/><circle cx="100" cy="76" r="8" fill="#b7c0ca"/>
      <circle cx="56" cy="90" r="10" fill="#c6ced7"/><circle cx="56" cy="90" r="5" fill="#59606a"/>
      <circle cx="144" cy="90" r="10" fill="#c6ced7"/><circle cx="144" cy="90" r="5" fill="#59606a"/>
      <circle class="nav" cx="6" cy="84" r="3" fill="#e33"/><circle class="nav" cx="194" cy="84" r="3" fill="#3e3"/>`,
  };

  function svg(id) {
    return `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" class="veh veh-${id}">${S[id] || S.sedan}</svg>`;
  }
  return { svg };
})();
