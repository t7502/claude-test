/* =========================================================
 *  演出ディレクター：変動・大当り・RUSHの演出進行
 * ========================================================= */
'use strict';

const HOLD_CLASS = ['h-white', 'h-blue', 'h-green', 'h-red', 'h-gold', 'h-rainbow'];
const TELOP_CLASS = ['t-white', 't-blue', 't-green', 't-red', 't-db'];
const CUT_CLASS = ['blue', 'green', 'red', 'gold'];
const rnd = (a) => a[Math.floor(Math.random() * a.length)];

const Director = {
  /* ===== 予告 ===== */
  async yHoldChange(plan, onChange) {
    const who = rnd(['悟空', 'ベジータ', 'ピッコロ', '悟飯', 'トランクス', 'クリリン']);
    SFX.holdChange(plan.holdFinal);
    await Stage.show(`${tok(who, 'left small')}<div class="hold-change ${HOLD_CLASS[plan.holdFinal]}"><i></i></div><div class="tech-name">保留変化!!</div>`, 'holdChgL', 1100);
    onChange && onChange(plan.holdFinal);
  },
  async yJikai() {
    SFX.kyuin();
    const title = rnd(JIKAI_TITLES);
    await Stage.show(`<div class="jikai"><div class="jk-h">次回 ドラゴンボールZ</div>
      <div class="jk-t">「${esc(title)}」</div><div class="jk-f">${tok('悟空', 'small')}<span>ぜってぇ見てくれよな!</span></div></div>`, 'jikaiL', 3600);
  },
  async yScouter(level) {
    const lv = YOKOKU.scouter.levels[level];
    const d = Stage.layer(`<div class="scouter-lens big"><div class="sc-who">スカウター</div><div class="sc-num">0</div><div class="sc-cap"></div></div>`, 'scouterL');
    const el = d.querySelector('.sc-num'); const cap = d.querySelector('.sc-cap');
    const targets = [5, 1500, 8000, 18000, 530000, 999999];
    const tgt = targets[level];
    for (let i = 1; i <= 10; i++) { el.textContent = Math.floor(tgt * i / 10 * (0.8 + Math.random() * 0.4)).toLocaleString(); SFX.tick(); await T.wait(80); }
    if (level === 5) {
      el.textContent = 'ERROR'; cap.textContent = 'バ、バカな…!!'; await T.wait(500);
      SFX.explode(); d.classList.add('broken'); await Stage.flash('#fff'); await T.wait(700);
    } else {
      el.textContent = lv.replace('戦闘力 ', ''); cap.textContent = ['ゴミめ…', 'ほう…', 'ベジータ「8000以上だ!!」', 'なかなかやるな', '私の戦闘力は53万です', ''][level];
      SFX.yokoku(level); await T.wait(1300);
    }
    d.remove();
  },
  async yRadar(level) {
    const n = level + 1;
    const d = Stage.layer(`${tok('ブルマ', 'left small')}<div class="radar"><div class="radar-sweep"></div></div><div class="radar-cap">反応 0個</div>`, 'radarL');
    const radar = d.querySelector('.radar'); const cap = d.querySelector('.radar-cap');
    for (let i = 1; i <= n; i++) {
      const a = Math.random() * Math.PI * 2, r = 20 + Math.random() * 30;
      radar.insertAdjacentHTML('beforeend', `<i style="left:${50 + Math.cos(a) * r}%;top:${50 + Math.sin(a) * r}%"></i>`);
      cap.textContent = `反応 ${i}個`; SFX.tick(); await T.wait(260);
    }
    if (n === 7) { cap.innerHTML = `${[1, 2, 3, 4, 5, 6, 7].map(i => dball(i)).join('')}<br>7個そろった!!`; SFX.kyuin(); await T.wait(1400); }
    else await T.wait(800);
    d.remove();
  },
  async yKaioken(level) {
    const d = Stage.layer(`${tok('悟空', 'center')}<div class="kaioken-text"></div>`, 'kaiokenL');
    const tx = d.querySelector('.kaioken-text');
    for (let i = 0; i <= level; i++) {
      tx.textContent = YOKOKU.kaioken.levels[i];
      d.style.setProperty('--k', (i + 1) / 5);
      d.className = `layer kaiokenL kl${i}`;
      SFX.yokoku(i); if (i >= 3) SFX.kyuin();
      await T.wait(700);
    }
    await T.wait(500); d.remove();
  },
  async yGinyu() { await Stage.step({ t: 'pose', list: ['リクーム', 'バータ', 'ジース', 'グルド', 'ギニュー'] }); },
  async yFusion(level) {
    if (level === 2) {
      SFX.yokoku(3);
      await Stage.show(`<div class="fusion-row">${tok('悟空')}<div class="fz">ポタラ!!</div>${tok('ベジータ')}</div>`, 'fusionL', 1200);
      SFX.kyuin();
      await Stage.show(tok('ベジット', 'center big') + '<div class="tech-name">ベジット 参上!!</div>', 'fusionL', 1500);
      return;
    }
    const d = Stage.layer(`<div class="fusion-row">${tok('悟天')}<div class="fz">フュー…</div>${tok('トランクス')}</div>`, 'fusionL');
    SFX.yokoku(1); await T.wait(900);
    d.querySelector('.fz').textContent = 'ジョン!! はっ!!'; await T.wait(700);
    if (level === 0) { d.innerHTML = `<div class="fat">${tok('ゴテンクス', 'center fatgk')}</div><div class="tech-name small">……失敗（太っちょゴテンクス）</div>`; SFX.gasa(); }
    else { d.innerHTML = tok('ゴテンクス', 'center big') + '<div class="tech-name">ゴテンクス 誕生!!</div>'; SFX.kyuin(); }
    await T.wait(1400); d.remove();
  },
  async yPseudo(n) {
    for (let i = 1; i <= n; i++) {
      await T.wait(900);
      Stage.stopReel(0, 1 + Math.floor(Math.random() * 9));
      await T.wait(250);
      Stage.stopReel(2, 1 + Math.floor(Math.random() * 9));
      // 中図柄にドラゴンボール（擬似連図柄）
      Stage.reelEls[1].innerHTML = `<div class="zu zdb">${dball(i + 3)}</div>`;
      Stage.spinning[1] = false; clearInterval(Stage.reelTimers[1]);
      SFX.yokoku(i + 1);
      await Stage.show(`<div class="pseudo">NEXT<b>×${i + 1}</b><div>${Array.from({ length: i + 1 }, (_, k) => dball(k + 1)).join('')}</div></div>`, 'pseudoL' + (i >= 3 ? ' hot' : ''), 900);
      Stage.spinAll();
    }
  },
  async ySerif(level) {
    const [who, text] = rnd(SERIF_POOL);
    SFX.yokoku(level);
    if (level >= 3) SFX.kyuin();
    await Stage.show(`${tok(who, 'left')}<div class="bubble">${esc(text)}</div>`, `line serif sc-${['white', 'blue', 'green', 'red', 'gold'][level]}`, 1900);
  },
  async yKame(level) {
    SFX.yokoku(level); if (level >= 3) SFX.kyuin();
    const t = ['ほっほっほ', 'どれ、ワシも一肌脱ぐかの', 'MAXパワーじゃ!!', 'これは…来るぞい!!', 'かぁ～めぇ～はぁ～めぇ～波ーーっ!!'][level];
    await Stage.show(`<div class="cut-band">${tok('亀仙人', 'big')}<div class="cut-text">${t}</div></div>`, `cutin cc-${['white', 'blue', 'green', 'red', 'gold'][level]}`, 1800);
  },
  async ySatan() {
    SFX.yokoku(2);
    await Stage.show(`${tok('ミスター・サタン', 'center')}<div class="tech-name">ハーッハッハ!! チャンスだ!!</div>`, 'satanL', 1600);
  },
  async yYamcha() {
    SFX.gasa();
    await Stage.show(`${tok('ヤムチャ', 'center fallen')}<div class="tech-name small">ヤムチャが倒れている…</div>`, 'yamchaL', 1500);
  },

  /* ===== プレミア ===== */
  async premium(id) {
    SFX.premium();
    Stage.lcd.classList.add('dark');
    if (id === 'shenron') {
      $('#gimShenron').classList.add('on');
      await Stage.show(`<div class="shenron"><div class="sr-body">${tok('神龍', 'center huge')}</div>
        <div class="sr-text">さあ 願いを言え…<br>どんな願いもひとつだけ叶えてやろう</div></div>`, 'premiumL', 3800);
      $('#gimShenron').classList.remove('on');
    } else if (id === 'porunga') {
      await Stage.show(`<div class="shenron porunga">${tok('ポルンガ', 'center huge')}<div class="sr-text">タッカラプト ポッポルンガ<br>プピリット パロ!!</div></div>`, 'premiumL', 3600);
    } else if (id === 'kaiou') {
      await Stage.show(`${tok('界王様', 'center big')}<div class="bubble big">布団が…ふっとんだ!!</div><div class="tech-name">悟空「…………」</div>`, 'premiumL kaiou', 3200);
    } else if (id === 'bardock') {
      await Stage.show(`${tok('バーダック', 'center big')}<div class="bubble big">カカロット… 頼んだぞ…!!</div>`, 'premiumL bardock', 3200);
    }
    Stage.lcd.classList.remove('dark');
    await Stage.show(`<div class="kakutei">大当り確定!!</div>`, 'kakuteiL', 1300);
  },

  /* ===== 通常時の変動 ===== */
  async playNormal(spin, plan, hooks = {}) {
    const ctx = {};
    Stage.clearFx(); Stage.small(false); Stage.spinAll();
    Stage.setStage(plan.reach && REACH_BY_ID[plan.reach].tier !== 'N' ? 'カメハウス' : rnd(['カメハウス', '荒野', 'ナメック星', 'セルゲーム会場', '天下一武道会']));
    const y = plan.y;
    const reach = plan.reach ? REACH_BY_ID[plan.reach] : null;
    let anyYokoku = false;
    const t0 = performance.now();

    if (plan.holdInit !== plan.holdFinal) { await this.yHoldChange(plan, hooks.onHoldChange); anyYokoku = true; }
    if (plan.premium && plan.premium !== 'zenkaiten') { await this.premium(plan.premium); anyYokoku = true; }
    if (y.jikai != null) { await this.yJikai(); anyYokoku = true; }
    if (y.pseudo != null) { await this.yPseudo(y.pseudo + 1); anyYokoku = true; }
    const order = ['scouter', 'radar', 'serif', 'kaioken', 'ginyu', 'satan', 'yamcha', 'fusion', 'kame'];
    for (const k of order) {
      if (y[k] == null) continue;
      anyYokoku = true;
      switch (k) {
        case 'scouter': await this.yScouter(y[k]); break;
        case 'radar': await this.yRadar(y[k]); break;
        case 'serif': await this.ySerif(y[k]); break;
        case 'kaioken': await this.yKaioken(y[k]); break;
        case 'ginyu': await this.yGinyu(); break;
        case 'satan': await this.ySatan(); break;
        case 'yamcha': await this.yYamcha(); break;
        case 'fusion': await this.yFusion(y[k]); break;
        case 'kame': await this.yKame(y[k]); break;
      }
    }
    // 変動時間（保留数による短縮）
    if (!reach) {
      const base = hooks.shortMiss ? [3000, 2500, 1800, 1200] : [9000, 7000, 4500, 2600];
      const target = base[Math.min(3, spin ? spin.holdsAfter : 0)];
      const el = (performance.now() - t0) * T.speed;
      await T.wait(Math.max(600, target - el));
    } else await T.wait(900);

    const [L, C, R] = plan.reels;
    Stage.stopReel(0, L); await T.wait(450);
    if (reach && reach.tier === 'ZEN') { await this.zenkaiten(plan); return; }
    Stage.stopReel(2, R);
    if (!reach) { await T.wait(350); Stage.stopReel(1, C); await T.wait(500); return; }

    // ---- リーチ ----
    Stage.reelsBox.classList.add('reach-on');
    SFX.reach();
    await Stage.show(`<div class="reach-call">リーチ!!</div>`, 'reachL', 900);
    if (reach.tier === 'N') {
      Stage.spinReel(1);
      await T.wait(3200);
      await this.decide(plan, reach, ctx);
      return;
    }
    // 発展
    Stage.spinReel(1);
    Stage.small(true);
    Stage.lcd.classList.add('reach');
    await Stage.show(`<div class="dev">発展!!</div>`, 'devL', 700);
    const tCls = TELOP_CLASS[y.telop ?? 0];
    if ((y.telop ?? 0) >= 3) SFX.kyuin();
    Stage.setStage(reach.stage);
    await Stage.show(`<div class="title-band ${tCls}"><div class="tb-tier">${reach.tier === 'SPSP' ? 'SPSPリーチ' : 'SPリーチ'}</div><div class="tb-name">${esc(reach.name)}</div></div>`, 'titleL', 1900);
    if (reach.vs) await Stage.show(`<div class="vs">${tok(reach.vs[0], 'big')}<b>VS</b>${tok(reach.vs[1], 'big')}</div>`, 'vsL', 1600);
    for (const s of reach.steps) await Stage.step(s, ctx);
    await this.decide(plan, reach, ctx);
  },

  /* 決着：カットイン→ボタン→結果 */
  async decide(plan, reach, ctx) {
    const y = plan.y;
    const hit = plan.hit;
    const [L, C, R] = plan.reels;
    if (reach.tier === 'N') {
      if (hit) { Stage.stopReel(1, C); await this.hitShow(plan); }
      else { await T.wait(400); Stage.stopReel(1, C); SFX.lose(); await T.wait(700); }
      return;
    }
    // 最終カットイン
    const cut = y.cutin ?? 0;
    await Stage.step({ t: 'cut', who: reach.vs ? reach.vs[0] : '悟空', text: reach.btn ? reach.btn + '!!' : '決めろ!!', color: CUT_CLASS[cut] });
    // ボタン
    await Btn.wait({ type: y.btype ?? 0, color: y.button ?? 0, label: reach.btn || 'PUSH' });
    const revive = hit && y.revive != null;
    if (hit && !revive) {
      for (const s of reach.win) await Stage.step(s, ctx);
      Stage.stopReel(1, C);
      await this.hitShow(plan);
    } else {
      for (const s of reach.lose) await Stage.step(s, ctx);
      const missC = (L % 9) + 1;
      Stage.stopReel(1, revive ? missC : C);
      SFX.lose();
      await T.wait(900);
      if (revive) {
        Stage.lcd.classList.add('dark');
        await T.wait(700);
        await Stage.show(`${tok('ヤジロベー', 'left')}<div class="bubble">仙豆だ! 食え!!</div>`, 'line', 1500);
        Stage.lcd.classList.remove('dark');
        SFX.kyuin();
        await Stage.show(`<div class="revive">復活!!</div>`, 'reviveL', 1100);
        Stage.stopReel(1, C);
        await this.hitShow(plan);
      }
    }
    Stage.small(false);
    Stage.lcd.classList.remove('reach');
  },

  async zenkaiten(plan) {
    SFX.premium();
    Stage.lcd.classList.add('rainbow-bg');
    await Stage.show(`<div class="genki-ball big"></div><div class="kakutei">元気玉 全回転!!</div>`, 'zenL', 1500);
    const n = plan.reels[0];
    for (let k = 0; k < 9; k++) {
      const v = ((n + k) % 9) + 1;
      Stage.setReels([v, v, v]);
      SFX.tick();
      await T.wait(330);
    }
    Stage.setReels(plan.reels);
    Stage.lcd.classList.remove('rainbow-bg');
    await this.hitShow(plan);
  },

  async hitShow(plan) {
    Stage.reelsBox.classList.add('hit-on');
    SFX.win();
    const n = plan.reels[0];
    await Stage.show(`<div class="oatari"><div class="oa-num">${n}${n}${n}</div><div class="oa-text">大当り!!</div><div class="oa-who">${esc(ZUGARA[n].who)}図柄</div></div>`, 'oatariL', 2200);
  },

  /* ===== RUSH中の変動 ===== */
  async playRush(spin, plan, m) {
    Stage.clearFx(); Stage.small(true); Stage.spinAll();
    const lt = plan.kind === 'lt';
    const enemy = RUSH_ENEMIES[(m.c.chain + (lt ? 7 : 0)) % RUSH_ENEMIES.length];
    Stage.setStage(enemy.stage);
    const hero = lt ? rnd(['悟空(SS3)', 'ベジット', 'ゴテンクス', '悟飯(SS2)']) : rnd(['悟空(SS)', 'ベジータ(SS)', '悟飯(SS2)', 'トランクス', 'ピッコロ']);
    const bt = Stage.layer(`<div class="battle">${tok(hero, 'bt-hero')}<b class="bt-vs">VS</b>${tok(enemy.who, 'bt-enemy')}</div>`, 'battleL keep');
    const last = !spin.inSt ? false : spin.stLeft <= 1;
    if (plan.hit && plan.style === 0) {
      SFX.kyuin();
      await Stage.show(`<div class="kakutei">キュイン!!</div>`, 'kakuteiL', 800);
    }
    if (plan.style === 1) {
      await T.wait(500);
      await Stage.show(`${tok(enemy.who, 'left small')}<div class="bubble">これで終わりだ!!</div>`, 'line', 1200);
      await Stage.show(`<div class="cut-band">${tok(plan.tech.who, 'big')}<div class="cut-text">${esc(plan.tech.name)}!!</div></div>`, `cutin cc-${CUT_CLASS[plan.chanceColor]}`, 1300);
    } else if (plan.style === 2 || last) {
      await Btn.wait({ type: 0, color: plan.hit ? Math.min(5, 2 + plan.chanceColor) : plan.chanceColor, label: last ? 'ラストチャンス!!' : '必殺技!!', timeout: 2500 });
    } else {
      await T.wait(lt ? 900 : 1300);
    }
    const [a, b, c] = plan.reels;
    Stage.stopReel(0, a); await T.wait(120); Stage.stopReel(2, c); await T.wait(120);
    if (plan.hit) {
      Stage.stopReel(1, b);
      SFX.rushHit();
      bt.remove();
      await Stage.show(`${tok(plan.tech.who, 'left small')}<div class="beam-one" style="--bc:${plan.tech.color}"></div>
        <div class="tech-name">${esc(plan.tech.name)}!!</div><div class="geki">撃破!!</div>`, 'beamL win', 1900);
    } else {
      Stage.stopReel(1, b);
      if (plan.style === 1) await Stage.show(`${tok(enemy.who, 'center small')}<div class="tech-name small">耐えた…!</div>`, 'line', 800);
      await T.wait(250);
      bt.remove();
    }
  },

  /* ===== 神龍チャレンジ（時短） ===== */
  async playJitan(spin, plan, m) {
    Stage.clearFx(); Stage.small(true); Stage.spinAll();
    Stage.setStage('神龍チャレンジ');
    const total = m.spec.modes.jitan.jitan;
    const got = Math.min(7, Math.floor(m.modeSpins / (total / 7)));
    Stage.layer(`<div class="db-collect">${[1, 2, 3, 4, 5, 6, 7].map(i => dball(i, i <= got ? 'got' : 'no')).join('')}</div>`, 'keep dbL');
    if (plan.style === 1) await Stage.show(`${tok('ブルマ', 'left small')}<div class="bubble">レーダーに反応!!</div>`, 'line', 1000);
    else await T.wait(1000);
    const [a, b, c] = plan.reels;
    Stage.stopReel(0, a); Stage.stopReel(2, c); Stage.stopReel(1, b);
    if (plan.hit) {
      SFX.premium();
      Stage.fx.querySelector('.dbL')?.remove();
      $('#gimShenron').classList.add('on');
      await Stage.show(`<div class="shenron">${tok('神龍', 'center huge')}<div class="sr-text">願いを言え…!!<br><b>引き戻し!! 超サイヤ人RUSHへ!!</b></div></div>`, 'premiumL', 3000);
      $('#gimShenron').classList.remove('on');
    } else await T.wait(200);
  },

  /* ===== 大当りラウンド ===== */
  async playBonus(bonus, m, hooks) {
    const k = bonus.kind;
    Stage.clearFx(); Stage.small(true);
    Stage.setTheme('bonus');
    hooks.migi(true);
    const isLt = k.next === 'lt';
    const first = bonus.first;
    const fromJitan = bonus.fromMode === 'jitan';
    // オープニング
    if (isLt && bonus.fromMode !== 'lt') {
      SFX.lt();
      Stage.lcd.classList.add('rainbow-bg');
      await Stage.show(`<div class="lt-in"><div class="lt-a">LUCKY TRIGGER</div><div class="lt-b">ULTIMATE BURST</div>${tok('ベジット', 'center big')}<div class="lt-c">3000発 獲得濃厚!!</div></div>`, 'ltL', 4200);
      Stage.lcd.classList.remove('rainbow-bg');
    } else if (first && k.rounds >= 10) {
      SFX.rushIn();
      await Stage.show(`<div class="rush-in">${tok('悟空(SS)', 'center big')}<div class="ri-a">超サイヤ人RUSH</div><div class="ri-b">直撃!!</div></div>`, 'rushInL', 3000);
    } else if (!first) {
      await Stage.show(`<div class="chain-call"><b>${m.c.chain}</b>連!!<div>${esc(k.label)}</div></div>`, 'chainL', 1800);
    } else {
      await Stage.show(`<div class="bonus-title">BONUS<br><small>${k.rounds}R</small></div>`, 'bonusTL', 1500);
    }
    await Stage.show(`<div class="migi-call">右打ちしてください ➡➡</div>`, 'migiL', 1200);
    const panel = Stage.layer(`<div class="round-panel"><div class="rp-r">ROUND <b>1</b>/${k.rounds}</div><div class="rp-g">+<b>0</b>発</div>
      <div class="rp-mem"></div></div>`, 'keep roundL');
    const rEl = panel.querySelector('.rp-r b'), gEl = panel.querySelector('.rp-g b'), mem = panel.querySelector('.rp-mem');
    let gained = 0;
    const mems = [...MEMORIES].sort(() => Math.random() - 0.5);
    for (let r = 1; r <= k.rounds; r++) {
      rEl.textContent = r;
      SFX.round();
      if (isLt && r === 11) await Stage.show(`<div class="chain-call"><b>BURST</b>2nd!!<div>さらに1500発!!</div></div>`, 'chainL', 1300);
      const mm = mems[r % mems.length];
      mem.innerHTML = `${tok(mm[0], 'small')}<span>${esc(mm[1])}</span>`;
      const net = m.roundResult();
      const per = Math.round(net / 10);
      for (let i = 0; i < 10; i++) {
        const add = i === 9 ? net - per * 9 : per;
        m.addRound(add); gained += add; gEl.textContent = gained.toLocaleString();
        hooks.update();
        hooks.attacker && hooks.attacker();
        if (!T.instant && !T.skip) SFX.payout();
        await T.wait(520);
      }
      // 初当り3Rの昇格演出（最終ラウンド）
      if (first && k.rounds <= 5 && r === k.rounds) await this.promotion(k.next === 'rush');
      await T.wait(900);
    }
    panel.remove();
    // エンディング
    hooks.migi(k.next !== 'normal');
    if (first || fromJitan) {
      if (k.next === 'rush' || k.next === 'lt') {
        SFX.rushIn();
        Stage.lcd.classList.add('gold');
        await Stage.show(`<div class="rush-in">${tok('悟空(SS)', 'center big')}<div class="ri-a">超サイヤ人RUSH</div><div class="ri-b">突入!!</div><div class="ri-c">ST ${m.spec.modes.rush.st}回 / 継続率 約${(modeContinue(m.spec, 'rush') * 100).toFixed(1)}%</div></div>`, 'rushInL', 3200);
        Stage.lcd.classList.remove('gold');
      } else if (k.next === 'jitan') {
        await Stage.show(`<div class="jitan-in">${[1, 2, 3, 4, 5, 6, 7].map(i => dball(i)).join('')}<div class="ri-a">神龍チャレンジ</div><div class="ri-c">時短${m.spec.modes.jitan.jitan}回でドラゴンボールを集めろ!</div></div>`, 'jitanInL', 2800);
      }
    }
    return gained;
  },

  /* 昇格（超サイヤ人チャレンジ） */
  async promotion(success) {
    await Stage.show(`<div class="title-band t-red"><div class="tb-tier">昇格チャレンジ</div><div class="tb-name">超サイヤ人になれるか!?</div></div>`, 'titleL', 1500);
    await Stage.show(`<div class="vs">${tok('悟空', 'big')}<b>VS</b>${tok('フリーザ(最終)', 'big')}</div>`, 'vsL', 1300);
    await Stage.step({ t: 'line', who: 'フリーザ(最終)', text: 'ナメック星もろとも消えてしまえ!!' });
    await Btn.wait({ type: success && Math.random() < 0.3 ? 2 : 0, color: success ? pickWeighted([5, 10, 25, 40, 20]) : pickWeighted([45, 35, 15, 5, 0]), label: '覚醒せよ!!' });
    if (success) {
      await Stage.step({ t: 'ssj', who: '悟空(SS)', text: '超サイヤ人 覚醒!!' });
    } else {
      await Stage.step({ t: 'line', who: 'フリーザ(最終)', text: 'ホーッホッホッホ! 残念でしたね!' });
      await Stage.show(`<div class="narr">まだだ…! ドラゴンボールを集めて神龍を呼べ!</div>`, 'narrL', 1600);
    }
  },

  /* RUSH終了 */
  async modeEnd(info, m) {
    Stage.clearFx(); Stage.small(false);
    if (info.mode === 'jitan') {
      SFX.end();
      await Stage.show(`<div class="end-panel"><div class="ep-t">神龍チャレンジ 終了</div><div class="ep-n">ドラゴンボールが…石になった…</div></div>`, 'endL', 2400);
      return;
    }
    SFX.end();
    await Stage.show(`<div class="end-panel"><div class="ep-t">${info.mode === 'lt' ? 'ULTIMATE BURST' : '超サイヤ人RUSH'} 終了</div>
      <div class="ep-c"><b>${info.chain}</b>連</div><div class="ep-n">TOTAL <b>${info.balls.toLocaleString()}</b>発</div>
      <div class="ep-q">${esc(rnd(['オラ、ワクワクしたぞ!', 'またな!', 'いい戦いだった…', 'カカロット…おまえがナンバー1だ']))}</div></div>`, 'endL', 4000);
  },
};
