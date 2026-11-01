/* =========================================================
 *  盤面（釘と玉の動き）— 見た目用のアニメーション
 * ========================================================= */
'use strict';

const Board = {
  W: 600, H: 760,
  balls: [],
  init() {
    this.cv = $('#boardCanvas');
    this.ctx = this.cv.getContext('2d');
    this.cv.width = this.W; this.cv.height = this.H;
    this.bg = document.createElement('canvas');
    this.bg.width = this.W; this.bg.height = this.H;
    this.drawBg();
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      this.frame(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },
  drawBg() {
    const g = this.bg.getContext('2d');
    const grd = g.createRadialGradient(300, 330, 60, 300, 380, 520);
    grd.addColorStop(0, '#1b2a55'); grd.addColorStop(1, '#050816');
    g.fillStyle = grd; g.fillRect(0, 0, this.W, this.H);
    // ガイドレール
    g.strokeStyle = '#c9a227'; g.lineWidth = 6;
    g.beginPath(); g.arc(300, 380, 360, Math.PI * 1.02, Math.PI * 1.98); g.stroke();
    g.lineWidth = 2; g.strokeStyle = '#8a7020';
    g.beginPath(); g.arc(300, 380, 345, Math.PI * 1.03, Math.PI * 1.97); g.stroke();
    // 釘（液晶の外側）
    const lcd = { x: 70, y: 70, w: 460, h: 330 };
    g.fillStyle = '#d8d8e0';
    for (let y = 40; y < 740; y += 18) {
      for (let x = 20 + ((y / 18) % 2) * 9; x < 590; x += 18) {
        if (x > lcd.x - 6 && x < lcd.x + lcd.w + 6 && y > lcd.y - 6 && y < lcd.y + lcd.h + 60) continue;
        const dx = x - 300, dy = y - 380;
        if (Math.hypot(dx, dy) > 340) continue;
        if (Math.random() < 0.55) continue;
        g.beginPath(); g.arc(x, y, 1.8, 0, Math.PI * 2); g.fill();
      }
    }
    // ヘソ周辺の命釘
    g.fillStyle = '#fff';
    [[288, 500], [312, 500], [276, 488], [324, 488]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 2.4, 0, Math.PI * 2); g.fill(); });
    // ステージ
    g.fillStyle = '#3a2a10'; g.fillRect(150, 470, 300, 8);
    g.fillStyle = '#c9a227'; g.fillRect(150, 468, 300, 2);
    // アウト口
    g.fillStyle = '#000'; g.beginPath(); g.arc(300, 735, 16, 0, Math.PI * 2); g.fill();
    // 右打ちルート表示
    g.strokeStyle = 'rgba(255,200,0,.25)'; g.lineWidth = 14; g.lineCap = 'round';
    g.beginPath(); g.moveTo(520, 60); g.quadraticCurveTo(580, 300, 520, 560); g.stroke();
  },
  /* side: 'L'|'R'  target: 'heso'|'out'|'den'|'atk' */
  spawn(side, target) {
    if (this.balls.length > 60) return;
    const P = {
      heso: [300, 515], out: [300 + (Math.random() - 0.5) * 30, 735], den: [528, 585], atk: [460, 650],
    };
    const end = P[target] || P.out;
    let start, ctrl;
    if (side === 'L') {
      start = [150 + Math.random() * 40, 40];
      ctrl = [20 + Math.random() * 60, 260 + Math.random() * 200];
      if (target === 'out' && Math.random() < 0.5) { ctrl = [40, 600]; }
    } else {
      start = [470 + Math.random() * 30, 40];
      ctrl = [585, 300 + Math.random() * 100];
    }
    this.balls.push({ start, ctrl, end, t: 0, dur: 0.9 + Math.random() * 0.5, wob: Math.random() * 6, target });
  },
  frame(dt) {
    const g = this.ctx;
    g.drawImage(this.bg, 0, 0);
    const sp = Math.min(T.speed, 4);
    for (const b of this.balls) {
      b.t += dt * sp / b.dur;
      const t = Math.min(1, b.t);
      const x = (1 - t) * (1 - t) * b.start[0] + 2 * (1 - t) * t * b.ctrl[0] + t * t * b.end[0] + Math.sin(t * 30 + b.wob) * 4 * (1 - t);
      const y = (1 - t) * (1 - t) * b.start[1] + 2 * (1 - t) * t * b.ctrl[1] + t * t * b.end[1];
      const grd = g.createRadialGradient(x - 2, y - 2, 1, x, y, 6);
      grd.addColorStop(0, '#fff'); grd.addColorStop(1, '#8a8f99');
      g.fillStyle = grd; g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill();
    }
    this.balls = this.balls.filter(b => b.t < 1);
  },
};
