/* ぶらりにっぽん — 地図スタイル
 * ・航空写真: 国土地理院「全国最新写真（シームレス）」
 * ・道路/地名/建物: OpenFreeMap（OpenStreetMap / OpenMapTiles スキーマ）
 * ・地形: AWS Terrain Tiles（Terrarium 形式）
 */
'use strict';

const MapStyle = (() => {
  const NAME = ['coalesce', ['get', 'name:ja'], ['get', 'name'], ['get', 'name:latin']];
  const FONT = ['Noto Sans Regular'];
  const FONT_B = ['Noto Sans Bold'];

  // 道路クラスごとの色（日本の道路地図風）
  const ROAD_COLOR = ['match', ['get', 'class'],
    'motorway', '#29a35a',
    'trunk', '#e8553f',
    'primary', '#f08a3c',
    'secondary', '#f3c53a',
    'tertiary', '#ffffff',
    '#ffffff'];

  const roadWidth = (scale) => ['interpolate', ['exponential', 1.6], ['zoom'],
    8, ['*', scale, ['match', ['get', 'class'], 'motorway', 1.6, 'trunk', 1.3, 'primary', 1.0, 0.5]],
    14, ['*', scale, ['match', ['get', 'class'], 'motorway', 5, 'trunk', 4.5, 'primary', 4, 'secondary', 3.2, 'tertiary', 2.6, 1.6]],
    18, ['*', scale, ['match', ['get', 'class'], 'motorway', 28, 'trunk', 26, 'primary', 22, 'secondary', 18, 'tertiary', 14, 9]],
  ];

  const MAJOR_ROADS = ['match', ['get', 'class'], ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'], true, false];
  const ALL_ROADS = ['match', ['get', 'class'],
    ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service', 'track', 'path', 'raceway', 'busway'], true, false];

  function build() {
    return {
      version: 8,
      name: 'buraeri-nippon',
      glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
      sky: {
        'sky-color': '#6fa8e6',
        'horizon-color': '#dceaf7',
        'fog-color': '#e4edf5',
        'sky-horizon-blend': 0.6,
        'horizon-fog-blend': 0.7,
        'fog-ground-blend': 0.75,
        'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 8, 0.6, 12, 0],
      },
      sources: {
        photo: {
          type: 'raster',
          tiles: ['https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'],
          tileSize: 256, minzoom: 2, maxzoom: 18,
          attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル（全国最新写真）</a>',
        },
        omt: {
          type: 'vector',
          url: 'https://tiles.openfreemap.org/planet',
          attribution: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        },
        dem: {
          type: 'raster-dem',
          tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
          encoding: 'terrarium', tileSize: 256, maxzoom: 14,
          attribution: '地形: <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank">Terrain Tiles (Mapzen/AWS)</a>',
        },
        landmarkModels: { type: 'geojson', data: Models.buildAll(LANDMARKS) },
        landmarks: {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: LANDMARKS.map((l) => ({ type: 'Feature', properties: { name: l.name, rank: l.rank }, geometry: { type: 'Point', coordinates: [l.lng, l.lat] } })) },
        },
        route: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
        dest: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
      },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#2f5f86' } },
        { id: 'photo', type: 'raster', source: 'photo', paint: { 'raster-fade-duration': 150, 'raster-saturation': 0.05, 'raster-contrast': 0.05 } },

        // 県境
        { id: 'boundary-pref', type: 'line', source: 'omt', 'source-layer': 'boundary',
          filter: ['all', ['==', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]],
          paint: { 'line-color': '#ffe9a8', 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.8, 12, 2.5], 'line-dasharray': [3, 2], 'line-opacity': 0.85 } },

        // 道路（強調表示）
        { id: 'road-casing', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 7,
          filter: MAJOR_ROADS, layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': 'rgba(30,30,30,0.55)', 'line-width': roadWidth(1.25), 'line-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.4, 16, 0.35] } },
        { id: 'road-minor', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 14,
          filter: ['match', ['get', 'class'], ['minor', 'service'], true, false], layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#ffffff', 'line-width': roadWidth(0.55), 'line-opacity': 0.28 } },
        { id: 'road-major', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 6,
          filter: MAJOR_ROADS, layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': ROAD_COLOR, 'line-width': roadWidth(0.75), 'line-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.8, 15, 0.55, 18, 0.42] } },
        { id: 'rail', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 10,
          filter: ['all', ['==', ['get', 'class'], 'rail'], ['!', ['has', 'service']]],
          paint: { 'line-color': '#5b5b66', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 18, 4], 'line-dasharray': [4, 3], 'line-opacity': 0.75 } },

        // 目的地への線
        { id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round' },
          paint: { 'line-color': '#ff3d7f', 'line-width': 3, 'line-dasharray': [2, 2], 'line-opacity': 0.8 } },

        // 3D建物（OpenStreetMap）
        { id: 'buildings-3d', type: 'fill-extrusion', source: 'omt', 'source-layer': 'building', minzoom: 13.5,
          filter: ['!=', ['get', 'hide_3d'], true],
          paint: {
            'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 6],
              0, '#ddd7cd', 20, '#d2d0cb', 60, '#c2c9d1', 150, '#a9b9c8'],
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13.5, 0, 14.5, ['coalesce', ['get', 'render_height'], 6]],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
            'fill-extrusion-opacity': 0.92,
            'fill-extrusion-vertical-gradient': true,
          } },

        // 有名建築物の立体モデル
        { id: 'landmark-models', type: 'fill-extrusion', source: 'landmarkModels', minzoom: 11,
          paint: {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'base'],
            'fill-extrusion-opacity': 1,
            'fill-extrusion-vertical-gradient': true,
          } },

        // ---- ラベル ----
        { id: 'water-name', type: 'symbol', source: 'omt', 'source-layer': 'water_name',
          filter: ['==', ['geometry-type'], 'Point'],
          layout: { 'text-field': NAME, 'text-font': FONT, 'text-size': 13 },
          paint: { 'text-color': '#d8f0ff', 'text-halo-color': 'rgba(10,40,70,0.8)', 'text-halo-width': 1.4 } },
        { id: 'peak', type: 'symbol', source: 'omt', 'source-layer': 'mountain_peak', minzoom: 9,
          filter: ['has', 'name'],
          layout: { 'text-field': ['concat', NAME, ['case', ['has', 'ele'], ['concat', '\n', ['to-string', ['get', 'ele']], 'm'], '']], 'text-font': FONT, 'text-size': 12, 'text-pitch-alignment': 'viewport' },
          paint: { 'text-color': '#fff7e6', 'text-halo-color': 'rgba(70,40,10,0.85)', 'text-halo-width': 1.4 } },
        { id: 'road-label', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 12,
          filter: ['any', ['has', 'name'], ['has', 'ref']],
          layout: {
            'symbol-placement': 'line', 'symbol-spacing': 280,
            'text-field': ['coalesce', ['get', 'name:ja'], ['get', 'name'], ['get', 'ref']],
            'text-font': FONT, 'text-size': ['interpolate', ['linear'], ['zoom'], 12, 11, 18, 15],
            'text-pitch-alignment': 'viewport', 'text-rotation-alignment': 'map', 'text-max-angle': 35,
          },
          paint: { 'text-color': '#ffffff', 'text-halo-color': 'rgba(20,20,20,0.85)', 'text-halo-width': 1.6 } },
        { id: 'station', type: 'symbol', source: 'omt', 'source-layer': 'poi', minzoom: 12,
          filter: ['all', ['match', ['get', 'class'], ['railway'], true, false], ['match', ['get', 'subclass'], ['station', 'halt'], true, false]],
          layout: { 'text-field': ['let', 'n', NAME, ['case', ['==', ['slice', ['var', 'n'], ['-', ['length', ['var', 'n']], 1]], '駅'], ['var', 'n'], ['concat', ['var', 'n'], '駅']]], 'text-font': FONT_B, 'text-size': 13, 'text-pitch-alignment': 'viewport', 'text-anchor': 'bottom', 'text-offset': [0, -0.4] },
          paint: { 'text-color': '#ffffff', 'text-halo-color': 'rgba(0,70,150,0.9)', 'text-halo-width': 1.8 } },
        { id: 'airport', type: 'symbol', source: 'omt', 'source-layer': 'aerodrome_label', minzoom: 8,
          layout: { 'text-field': NAME, 'text-font': FONT_B, 'text-size': 13, 'text-pitch-alignment': 'viewport' },
          paint: { 'text-color': '#ffffff', 'text-halo-color': 'rgba(60,60,120,0.9)', 'text-halo-width': 1.6 } },
        { id: 'place-small', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 12,
          filter: ['match', ['get', 'class'], ['neighbourhood', 'quarter', 'suburb', 'hamlet', 'isolated_dwelling'], true, false],
          layout: { 'text-field': NAME, 'text-font': FONT, 'text-size': ['interpolate', ['linear'], ['zoom'], 12, 11, 17, 15], 'text-pitch-alignment': 'viewport', 'text-padding': 4 },
          paint: { 'text-color': '#fffbe8', 'text-halo-color': 'rgba(40,30,10,0.85)', 'text-halo-width': 1.5 } },
        { id: 'place-town', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 8,
          filter: ['match', ['get', 'class'], ['town', 'village'], true, false],
          layout: { 'text-field': NAME, 'text-font': FONT_B, 'text-size': ['interpolate', ['linear'], ['zoom'], 8, 11, 14, 16], 'text-pitch-alignment': 'viewport' },
          paint: { 'text-color': '#ffffff', 'text-halo-color': 'rgba(30,30,30,0.85)', 'text-halo-width': 1.6 } },
        { id: 'place-city', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 4,
          filter: ['==', ['get', 'class'], 'city'],
          layout: { 'text-field': NAME, 'text-font': FONT_B, 'text-size': ['interpolate', ['linear'], ['zoom'], 4, 11, 10, 18], 'text-pitch-alignment': 'viewport' },
          paint: { 'text-color': '#ffffff', 'text-halo-color': 'rgba(20,20,20,0.9)', 'text-halo-width': 1.8 } },
        { id: 'place-pref', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 4, maxzoom: 9,
          filter: ['==', ['get', 'class'], 'state'],
          layout: { 'text-field': NAME, 'text-font': FONT_B, 'text-size': 15, 'text-letter-spacing': 0.15, 'text-pitch-alignment': 'viewport' },
          paint: { 'text-color': '#ffe9a8', 'text-halo-color': 'rgba(60,40,0,0.85)', 'text-halo-width': 1.8 } },
        { id: 'landmark-dot', type: 'circle', source: 'landmarks',
          filter: ['any', ['==', ['get', 'rank'], 1], ['all', ['==', ['get', 'rank'], 2], ['>=', ['zoom'], 9]], ['>=', ['zoom'], 12]],
          paint: { 'circle-radius': 5, 'circle-color': '#ffcf33', 'circle-stroke-color': '#7a2a00', 'circle-stroke-width': 2, 'circle-pitch-alignment': 'viewport' } },
        { id: 'landmark-label', type: 'symbol', source: 'landmarks',
          filter: ['any', ['==', ['get', 'rank'], 1], ['all', ['==', ['get', 'rank'], 2], ['>=', ['zoom'], 9]], ['>=', ['zoom'], 12]],
          layout: {
            'text-field': ['get', 'name'], 'text-font': FONT_B,
            'text-size': ['interpolate', ['linear'], ['zoom'], 5, 12, 14, 16],
            'text-pitch-alignment': 'viewport', 'text-anchor': 'bottom', 'text-offset': [0, -0.6], 'text-allow-overlap': true,
          },
          paint: { 'text-color': '#ffe25c', 'text-halo-color': 'rgba(70,20,0,0.9)', 'text-halo-width': 2 } },
        { id: 'dest-label', type: 'symbol', source: 'dest',
          layout: { 'text-field': ['concat', '目的地：', ['get', 'name']], 'text-font': FONT_B, 'text-size': 16, 'text-allow-overlap': true, 'text-pitch-alignment': 'viewport', 'text-anchor': 'bottom' },
          paint: { 'text-color': '#ffffff', 'text-halo-color': '#d0105a', 'text-halo-width': 2.4 } },
      ],
    };
  }

  /* ミニマップ用の軽量スタイル */
  function buildMini() {
    return {
      version: 8,
      glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
      sources: {
        omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
        me: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
        trail: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
      },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#e9efe4' } },
        { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': '#8fc3e6' } },
        { id: 'pref', type: 'line', source: 'omt', 'source-layer': 'boundary', filter: ['all', ['==', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]],
          paint: { 'line-color': '#a08a5a', 'line-width': 1, 'line-dasharray': [3, 2] } },
        { id: 'roads', type: 'line', source: 'omt', 'source-layer': 'transportation', filter: MAJOR_ROADS,
          paint: { 'line-color': ROAD_COLOR, 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.6, 14, 3] } },
        { id: 'trail', type: 'line', source: 'trail', paint: { 'line-color': '#2266ff', 'line-width': 2.5, 'line-opacity': 0.75 } },
        { id: 'city', type: 'symbol', source: 'omt', 'source-layer': 'place', filter: ['match', ['get', 'class'], ['city', 'town', 'suburb'], true, false],
          layout: { 'text-field': NAME, 'text-font': FONT, 'text-size': 10 },
          paint: { 'text-color': '#333', 'text-halo-color': '#fff', 'text-halo-width': 1.2 } },
      ],
    };
  }

  return { build, buildMini };
})();
