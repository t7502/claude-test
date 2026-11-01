/* =========================================================
 *  効果音（WebAudioで合成。外部音源なし）
 * ========================================================= */
'use strict';

const SFX = (() => {
  let ctx = null, master = null;
  let vol = 0.5, muted = false;
  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = vol;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, { type = 'square', gain = 0.15, at = 0, slide = 0, attack = 0.005 } = {}) {
    if (muted || !ensure()) return;
    const t0 = ctx.currentTime + at;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, { gain = 0.3, at = 0, lp = 1800 } = {}) {
    if (muted || !ensure()) return;
    const t0 = ctx.currentTime + at;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0);
  }
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const seq = (notes, step, opts = {}) => notes.forEach((n, i) => { if (n) tone(N(n), step * (opts.len || 1.6), { ...opts, at: i * step }); });

  return {
    setVolume(v) { vol = v; if (master) master.gain.value = v; },
    setMuted(m) { muted = m; },
    unlock() { ensure(); },
    ball() { tone(2400, 0.02, { type: 'triangle', gain: 0.025 }); },
    heso() { tone(1568, 0.06, { type: 'square', gain: 0.06 }); tone(2093, 0.08, { type: 'square', gain: 0.05, at: 0.05 }); },
    reelStop() { tone(330, 0.07, { type: 'square', gain: 0.1 }); },
    reach() { seq([76, 79, 83, 88], 0.09, { type: 'sawtooth', gain: 0.1 }); },
    yokoku(level = 0) { const b = 70 + level * 3; seq([b, b + 4, b + 7], 0.06, { type: 'square', gain: 0.08 }); },
    hold(level = 0) { seq([84 + level * 2, 88 + level * 2], 0.05, { type: 'triangle', gain: 0.12 }); },
    holdChange(level = 0) { seq([72, 76, 79, 84 + level], 0.05, { type: 'square', gain: 0.1 }); },
    button() { tone(880, 0.12, { type: 'square', gain: 0.15 }); tone(1320, 0.18, { type: 'square', gain: 0.1, at: 0.06 }); },
    buttonAppear(level = 0) { seq([60 + level * 2, 67 + level * 2, 72 + level * 2], 0.07, { type: 'sawtooth', gain: 0.12 }); },
    mash() { tone(600 + Math.random() * 400, 0.05, { type: 'square', gain: 0.07 }); },
    charge(dur = 1.5) { tone(120, dur, { type: 'sawtooth', gain: 0.08, slide: 8, attack: 0.1 }); },
    beam() { noise(1.2, { gain: 0.25, lp: 3000 }); tone(200, 1.2, { type: 'sawtooth', gain: 0.08, slide: 0.5 }); },
    explode() { noise(1.6, { gain: 0.5, lp: 900 }); tone(80, 1.2, { type: 'sine', gain: 0.3, slide: 0.3 }); },
    flash() { tone(3000, 0.25, { type: 'sine', gain: 0.1, slide: 0.2 }); },
    gasa() { seq([60, 56, 52], 0.12, { type: 'triangle', gain: 0.1 }); },
    lose() { seq([67, 63, 60, 55], 0.14, { type: 'triangle', gain: 0.12 }); },
    kyuin() { // 激アツ「キュイン」
      tone(1200, 0.5, { type: 'sawtooth', gain: 0.12, slide: 2.2 });
      tone(1800, 0.5, { type: 'square', gain: 0.06, slide: 2.2, at: 0.02 });
    },
    premium() { seq([84, 88, 91, 96, 91, 96, 100], 0.08, { type: 'square', gain: 0.14 }); noise(0.8, { gain: 0.15, lp: 6000, at: 0.1 }); },
    win() { seq([72, 76, 79, 84, 0, 84, 88, 91, 96], 0.1, { type: 'square', gain: 0.14 }); },
    fanfare() { seq([67, 67, 67, 72, 0, 76, 74, 76, 79, 0, 84], 0.12, { type: 'square', gain: 0.13 }); seq([55, 0, 60, 0, 64, 0, 67, 0, 72], 0.13, { type: 'triangle', gain: 0.1 }); },
    round() { seq([79, 84], 0.08, { type: 'square', gain: 0.08 }); },
    payout() { tone(1760, 0.03, { type: 'square', gain: 0.025 }); },
    rushIn() { seq([60, 64, 67, 72, 76, 79, 84, 88, 91, 96], 0.07, { type: 'sawtooth', gain: 0.13 }); noise(1.0, { gain: 0.2, lp: 5000, at: 0.5 }); },
    rushHit() { seq([84, 91, 96, 100], 0.07, { type: 'square', gain: 0.14 }); },
    lt() { seq([72, 76, 79, 83, 86, 90, 93, 98, 102], 0.06, { type: 'sawtooth', gain: 0.14 }); seq([60, 64, 67, 71, 74, 78, 81, 86], 0.07, { type: 'square', gain: 0.1, at: 0.1 }); },
    end() { seq([72, 67, 64, 60], 0.2, { type: 'triangle', gain: 0.12 }); },
    tick() { tone(1000, 0.03, { type: 'square', gain: 0.05 }); },
  };
})();
