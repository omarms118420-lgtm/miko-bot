const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ══════════════════════════════════════════════════════════════════
//       🌑 عالم السحر الأسود — العالم المفتوح الأسطوري 🌑
//          v5.0 — ملك الظلام، التحول الأسود، استدعاء الوحوش
// ══════════════════════════════════════════════════════════════════

const TMP = path.join(__dirname, "../../tmp");
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

const players = new Map(); // userID → playerData

// ══════════════════════════════════════════════════════════════════
//  ⚔️ الأسلحة
// ══════════════════════════════════════════════════════════════════
const WEAPONS = {
  fists:       { name: "👊 قبضة الظلام",       damage: 10, cost: 0,    unlock: 1,  img: "warrior dark fantasy fist punch glowing dark energy" },
  sword:       { name: "🗡️ سيف الأرواح",       damage: 22, cost: 100,  unlock: 1,  img: "dark fantasy soul sword glowing evil ancient" },
  axe:         { name: "🪓 فأس التنين",         damage: 30, cost: 180,  unlock: 3,  img: "dragon bone axe dark fantasy glowing black fire ancient" },
  staff:       { name: "🔮 عصا الكون الأسود",   damage: 38, cost: 260,  unlock: 5,  img: "black cosmos magic staff glowing evil ancient fantasy" },
  scythe:      { name: "☠️ منجل الملاك الساقط", damage: 48, cost: 400,  unlock: 7,  img: "fallen angel scythe dark energy glowing black fantasy boss" },
  darkform:    { name: "🌑 التحول الأسود",       damage: 120, cost: 0,  unlock: 8,  special: true, img: "black transformation dark warrior losing control massive power dark energy explosion" },
};

// ══════════════════════════════════════════════════════════════════
//  👹 الأعداء — تسلسل هرمي (الكل يخشى ملك الظلام)
// ══════════════════════════════════════════════════════════════════
const ENEMIES = {
  forest: [
    { id: "wolf",    name: "🐺 ذئب الظلام",          hp: 60,   atk: 12, xp: 30,  gold: 20, lvlReq: 1, img: "dark shadow wolf glowing red eyes dark forest horror fantasy attack" },
    { id: "zombie",  name: "🧟 الزومبي الشيطاني",    hp: 75,   atk: 15, xp: 40,  gold: 25, lvlReq: 1, img: "demonic zombie dark fantasy glowing eyes rotting undead attack horror" },
    { id: "spider",  name: "🕷️ عنكبوت الجحيم الأسود", hp: 55,   atk: 10, xp: 28,  gold: 18, lvlReq: 1, img: "massive black hell spider dark fantasy glowing toxic attack horror" },
    { id: "skeleton",name: "💀 الهيكل العظمي الغاضب", hp: 90,   atk: 18, xp: 50,  gold: 35, lvlReq: 2, img: "giant angry skeleton warrior dark armor glowing eyes fantasy horror attack" },
  ],
  demons: [
    { id: "imp",     name: "😈 شيطان الهاوية",       hp: 100,  atk: 22, xp: 65,  gold: 50, lvlReq: 3, img: "abyss demon small dark fire red glowing attack fantasy horror battle" },
    { id: "sorcerer",name: "🧙 الساحر الشرير",        hp: 130,  atk: 28, xp: 90,  gold: 70, lvlReq: 4, img: "evil dark sorcerer black magic glowing purple attack fantasy boss" },
    { id: "ghoul",   name: "👺 غول الأبراج",          hp: 140,  atk: 25, xp: 85,  gold: 65, lvlReq: 4, img: "tower ghoul dark fantasy massive claws glowing attack horror boss" },
    { id: "prince",  name: "🔥 أمير الشياطين",        hp: 220,  atk: 38, xp: 140, gold: 110, lvlReq: 5, boss: true, img: "demon prince fire throne evil powerful boss dark fantasy cinematic dramatic epic" },
  ],
  mountains: [
    { id: "giant",   name: "⛰️ عملاق الصخر الأسود",   hp: 200,  atk: 35, xp: 120, gold: 95,  lvlReq: 6, img: "massive black rock giant dark fantasy attack mountains epic battle horror" },
    { id: "dragon",  name: "🐉 التنين الأسود",         hp: 280,  atk: 45, xp: 160, gold: 130, lvlReq: 7, boss: true, img: "massive black dragon dark fire breathing epic battle fantasy cinematic dramatic boss" },
    { id: "eye",     name: "👁️ عين الكون الشيطانية",  hp: 180,  atk: 50, xp: 140, gold: 115, lvlReq: 7, img: "giant cosmic demon eye dark magic swirling horror fantasy boss cinematic" },
    { id: "fallen",  name: "🪽 الملاك الساقط",         hp: 320,  atk: 55, xp: 190, gold: 150, lvlReq: 8, boss: true, img: "fallen angel dark wings black armor glowing red eyes epic boss battle fantasy cinematic" },
  ],
  // ── ملك الظلام ─── يظهر فقط بعد المستوى 10 ──
  final: [
    { id: "darkking", name: "👑 مَلِك الظَّلام", hp: 2000, atk: 100, xp: 999, gold: 999, lvlReq: 10, boss: true, final: true,
      img: "ultimate king of darkness massive evil throne dark energy swirling destroying world apocalypse fantasy ultra boss cinematic epic dramatic 8k",
      intro: `\n💀━━━━━━━━━━━━━━━━━━━━━━━━━━━━💀\n`
           + `     👑 مَلِك الظَّلام يظهر!! 👑\n`
           + `💀━━━━━━━━━━━━━━━━━━━━━━━━━━━━💀\n\n`
           + `🌑 الأرض ترتجف... السماء تتشقق...\n`
           + `💀 كل الوحوش والشياطين تهرب وترتعش خوفاً!\n`
           + `🔥 ملك الظلام: «لقد جئتَ لتحدّيني؟\n`
           + `   أنا مَن أوجد الظلام... أنا مَن يدمّر الوجود!\n`
           + `   حتى الشياطين تُقبّل قدميّ خوفاً...\n`
           + `   وأنتَ... مجرد حشرة سأسحقها!» 😈\n\n`
           + `⚠️ تحذير: هذه أصعب معركة في التاريخ!\n`
           + `💀 HP: 2000 | ⚔️ هجوم: 100\n`
    }
  ]
};

// ══════════════════════════════════════════════════════════════════
//  🌑 وحوش الاستدعاء
// ══════════════════════════════════════════════════════════════════
const SUMMONS = {
  shadow_wolf:   { name: "🐺 ذئب الظل",        atk: 20, cost: 80,  unlockLvl: 4, img: "summoning dark shadow wolf spirit dark fantasy glowing magic circle" },
  dark_warrior:  { name: "⚔️ المحارب المظلم",   atk: 35, cost: 130, unlockLvl: 6, img: "summoning dark ghost warrior spirit dark fantasy magic circle glowing" },
  fallen_dragon: { name: "🐉 تنين الظل",        atk: 60, cost: 220, unlockLvl: 9, img: "summoning fallen shadow dragon dark magic circle spirit fantasy epic" },
};

// ══════════════════════════════════════════════════════════════════
//  🧪 الجرعات
// ══════════════════════════════════════════════════════════════════
const POTIONS = {
  small:   { name: "🧪 جرعة شفاء صغيرة",    heal: 40,  cost: 45,  desc: "+40 صحة" },
  big:     { name: "💊 جرعة شفاء كبيرة",     heal: 90,  cost: 100, desc: "+90 صحة" },
  full:    { name: "✨ إكسير الخلود",          heal: 9999,cost: 220, desc: "صحة كاملة" },
  shield:  { name: "🛡️ درع الظلام",           shield: 4, cost: 150, desc: "يقلل ضرر 4 جولات" },
  power:   { name: "💥 مشروب القوة",           atkBoost: 20, cost: 160, desc: "+20 ضرر مؤقت" },
};

// ══════════════════════════════════════════════════════════════════
//  🎮 حالة اللاعب
// ══════════════════════════════════════════════════════════════════
function newPlayer(name, id) {
  return {
    id, name, gender: null,
    level: 1, xp: 0, xpNeeded: 100,
    health: 100, maxHealth: 100,
    baseAtk: 10, atkBoost: 0,
    gold: 200, points: 0,
    weapon: "fists",
    inventory: { weapons: ["fists"], potions: [] },
    shieldTurns: 0,
    darkFormUnlocked: false,
    darkFormTurns: 0,
    darkFormLostControl: false,
    summonUnlocked: false,
    activeSummon: null,
    wins: 0, losses: 0,
    zonesCleared: [],
    finalBossDefeated: false,
    inBattle: null,
    created: false,
  };
}

function getPlayer(uid, name) {
  if (!players.has(uid)) players.set(uid, newPlayer(name, uid));
  return players.get(uid);
}

// ══════════════════════════════════════════════════════════════════
//  🖼️ صور وذكاء اصطناعي
// ══════════════════════════════════════════════════════════════════
async function getImage(prompt) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ", dark fantasy art, 8k, cinematic, dramatic lighting, highly detailed")}?width=768&height=512&nologo=true&model=flux&seed=${Math.floor(Math.random() * 99999)}`;
  try {
    const r = await axios.get(url, { responseType: "stream", timeout: 35000 });
    return r.data;
  } catch { return null; }
}

async function aiStory(prompt) {
  try {
    const r = await axios.post("https://text.pollinations.ai/", {
      messages: [{ role: "user", content: prompt }],
      model: "openai", seed: Math.floor(Math.random() * 9999)
    }, { timeout: 15000 });
    return r.data?.choices?.[0]?.message?.content || r.data?.content || "";
  } catch {
    try {
      const r2 = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`, { timeout: 10000 });
      return typeof r2.data === "string" ? r2.data : "";
    } catch { return ""; }
  }
}

// ══════════════════════════════════════════════════════════════════
//  📊 واجهة الحالة
// ══════════════════════════════════════════════════════════════════
function hpBar(cur, max, len = 10) {
  const f = Math.max(0, Math.round((Math.max(0, cur) / max) * len));
  return "█".repeat(f) + "░".repeat(len - f);
}

function statusLine(p) {
  const wpn = WEAPONS[p.weapon];
  const atk = wpn.damage + p.baseAtk + p.atkBoost;
  return `❤️ ${hpBar(p.health, p.maxHealth)} ${p.health}/${p.maxHealth}\n`
    + `⭐ Lv.${p.level} | XP: ${p.xp}/${p.xpNeeded} | 🏆 ${p.points} نقطة\n`
    + `⚔️ ${wpn.name} | ضرر: ${atk}\n`
    + `💰 ${p.gold} ذهب\n`
    + (p.activeSummon ? `🌑 مستدعى: ${p.activeSummon.name} (${p.activeSummon.atk} ضرر)\n` : "")
    + (p.darkFormTurns > 0 ? `🌑 التحول الأسود: ${p.darkFormTurns} جولة متبقية!\n` : "");
}

// ══════════════════════════════════════════════════════════════════
//  📨 تسجيل الرد
// ══════════════════════════════════════════════════════════════════
function setReply(msgID, threadID, senderID, phase, p, extra = {}) {
  global.GoatBot.onReply.set(msgID, {
    commandName: "عالم", messageID: msgID,
    threadID, author: senderID, phase, player: p, ...extra
  });
}

// ══════════════════════════════════════════════════════════════════
//  🏠 القائمة الرئيسية
// ══════════════════════════════════════════════════════════════════
async function showMenu(api, threadID, uid, p, extra = "") {
  const canDarkForm = p.darkFormUnlocked || p.level >= 8;
  if (!p.darkFormUnlocked && p.level >= 8) p.darkFormUnlocked = true;
  if (!p.summonUnlocked && p.level >= 4) p.summonUnlocked = true;

  const readyFinal = p.level >= 10 && !p.finalBossDefeated;
  const img = await getImage(
    p.gender === "female"
      ? "dark fantasy female warrior hero standing epic pose glowing purple dark world cinematic"
      : "dark fantasy male warrior hero standing epic pose glowing dark energy cinematic"
  );

  const body = `\n🌑━━━━━━━━━━━━━━━━━━━━━━━━🌑\n`
    + `   ⚫ عالم السحر الأسود ⚫\n`
    + `🌑━━━━━━━━━━━━━━━━━━━━━━━━🌑\n\n`
    + (extra ? extra + "\n\n" : "")
    + statusLine(p) + "\n"
    + `🌑━━━━━━━━━━━━━━━━━━━━━━━━🌑\n\n`
    + `1️⃣ 🗺️ المناطق والاستكشاف\n`
    + `2️⃣ 💪 التدريب والتطور\n`
    + `3️⃣ 🏪 المتجر\n`
    + `4️⃣ 🎒 حقيبتي\n`
    + (p.summonUnlocked ? `5️⃣ 🌑 استدعاء وحوش الظلام\n` : `5️⃣ 🔒 استدعاء (يفتح Lv.4)\n`)
    + (canDarkForm ? `6️⃣ 🌑 التحول الأسود ⚠️\n` : `6️⃣ 🔒 التحول الأسود (يفتح Lv.8)\n`)
    + (readyFinal ? `7️⃣ 💀 مواجهة مَلِك الظَّلام ⚠️👑\n` : "")
    + `\n💬 أرسل رقم خيارك`;

  const sent = await api.sendMessage(
    img ? { body, attachment: img } : { body },
    threadID
  );
  setReply(sent.messageID, threadID, uid, "main_menu", p);
}

// ══════════════════════════════════════════════════════════════════
//  🗺️ قائمة المناطق
// ══════════════════════════════════════════════════════════════════
async function showZones(api, threadID, uid, p) {
  const cleared = z => p.zonesCleared.includes(z) ? " ✅" : "";
  const body = `\n🗺️━━━━━━━━━━━━━━━━━━━━━━━━🗺️\n`
    + `         اختر منطقة الاستكشاف\n`
    + `🗺️━━━━━━━━━━━━━━━━━━━━━━━━🗺️\n\n`
    + `1️⃣ 🌲 الغابة السوداء${cleared("forest")}\n`
    + `   ذئاب • زومبي • عناكب • هياكل\n`
    + `   المستوى المطلوب: 1+\n\n`
    + `2️⃣ 🔥 عالم الشياطين${cleared("demons")}\n`
    + `   شياطين • سحرة • أمير الشياطين\n`
    + `   المستوى المطلوب: 3+\n\n`
    + `3️⃣ ⛰️ جبال الوحوش${cleared("mountains")}\n`
    + `   عمالقة • تنين أسود • ملاك ساقط\n`
    + `   المستوى المطلوب: 6+\n\n`
    + `0️⃣ ↩️ رجوع\n\n`
    + `💬 أرسل رقم الوجهة`;

  const sent = await api.sendMessage({ body }, threadID);
  setReply(sent.messageID, threadID, uid, "zones", p);
}

// ══════════════════════════════════════════════════════════════════
//  ⚔️ بدء المعركة
// ══════════════════════════════════════════════════════════════════
async function startBattle(api, threadID, uid, p, zone, forcedEnemy = null) {
  const list = ENEMIES[zone];
  let eligible = forcedEnemy ? [forcedEnemy] : list.filter(e => p.level >= (e.lvlReq || 1));
  if (!eligible.length) eligible = list;

  const enemy = { ...eligible[Math.floor(Math.random() * eligible.length)], maxHp: 0 };
  enemy.maxHp = enemy.hp;
  p.inBattle = { enemy, zone, turn: 0 };

  let introText = enemy.final ? enemy.intro : "";

  // توليد قصة المعركة بالذكاء الاصطناعي
  const storyPrompt = enemy.final
    ? `أنت تصف لحظة ظهور مَلِك الظَّلام في لعبة مغامرة عربية. إنه أقوى شرير في الكون. كل الوحوش تهرب خوفاً منه. اكتب 3 جمل درامية مرعبة ومثيرة باللغة العربية تصف لحظة ظهوره وهو يريد تدمير العالم.`
    : `في لعبة مغامرة عربية سحرية، اكتب وصفاً درامياً مرعباً لـ"${enemy.name}" وهو يهاجم البطل. جملتان فقط، باللغة العربية، مثيرتان.`;

  const [story, img] = await Promise.all([
    aiStory(storyPrompt),
    getImage(enemy.img)
  ]);

  const body = introText
    + `\n⚔️━━━━━━━━━━━━━━━━━━━━━━━━⚔️\n`
    + `       💀 ${enemy.name} يهاجم! 💀\n`
    + `⚔️━━━━━━━━━━━━━━━━━━━━━━━━⚔️\n\n`
    + (story ? `📖 ${story}\n\n` : "")
    + `👹 ${enemy.name}\n`
    + `❤️ ${hpBar(enemy.hp, enemy.maxHp)} ${enemy.hp}/${enemy.maxHp}\n`
    + `💀 قوة هجومه: ${enemy.atk}\n\n`
    + `🛡️ أنت:\n`
    + `❤️ ${hpBar(p.health, p.maxHealth)} ${p.health}/${p.maxHealth}\n`
    + `⚔️ ضررك: ${WEAPONS[p.weapon].damage + p.baseAtk + p.atkBoost}\n\n`
    + `⚔️━━━━━━━━━━━━━━━━━━━━━━━━⚔️\n\n`
    + `1️⃣ ⚔️ هجوم عادي\n`
    + `2️⃣ 💥 هجوم مزدوج (×1.8 ضرر)\n`
    + `3️⃣ 🧪 استخدم جرعة\n`
    + (p.activeSummon ? `4️⃣ 🌑 أمر المستدعى بالهجوم (+${p.activeSummon.atk})\n` : "")
    + `5️⃣ 🏃 هرب\n\n`
    + `💬 أرسل رقم قرارك`;

  const sent = await api.sendMessage(
    img ? { body, attachment: img } : { body },
    threadID
  );
  setReply(sent.messageID, threadID, uid, "battle", p);
}

// ══════════════════════════════════════════════════════════════════
//  ⚔️ معالجة جولة القتال
// ══════════════════════════════════════════════════════════════════
async function processBattle(api, threadID, uid, p, choice) {
  const battle = p.inBattle;
  const enemy = battle.enemy;
  const wpn = WEAPONS[p.weapon];
  const baseAtk = wpn.damage + p.baseAtk + p.atkBoost;
  let log = "";
  let extraImg = null;

  // هرب
  if (choice === "5") {
    p.inBattle = null;
    p.activeSummon = null;
    return showMenu(api, threadID, uid, p, "🏃 هربتَ من المعركة!");
  }

  // جرعة
  if (choice === "3") {
    const pots = p.inventory.potions;
    if (!pots.length) {
      log = "⚠️ لا جرعات في حقيبتك!\n";
    } else {
      const pid = pots.shift();
      const pot = POTIONS[pid];
      if (pot.heal) { const h = Math.min(p.maxHealth - p.health, pot.heal); p.health += h; log = `💊 ${pot.name} → +${h} صحة!\n`; }
      if (pot.shield) { p.shieldTurns = pot.shield; log = `🛡️ ${pot.name} مفعّل ${pot.shield} جولات!\n`; }
      if (pot.atkBoost) { p.atkBoost += pot.atkBoost; log = `💥 ${pot.name} → +${pot.atkBoost} ضرر!\n`; }
    }
  }

  // ── التحول الأسود — فقدان السيطرة ──
  if (p.darkFormTurns > 0) {
    p.darkFormTurns--;
    if (p.darkFormTurns === 0) {
      p.darkFormLostControl = true;
      const selfDmg = Math.floor(Math.random() * 60) + 30;
      p.health -= selfDmg;
      log += `\n🌑 التحول الأسود... فقدتَ السيطرة!!\n💔 هاجمتَ نفسك بـ ${selfDmg} ضرر!!\n`;
      p.weapon = p.inventory.weapons.find(w => w !== "darkform") || "fists";
      extraImg = await getImage("dark warrior losing control black energy explosion self damage horror dramatic");
    }
  }

  // ── هجوم اللاعب ──
  if (choice === "1" || choice === "2") {
    let dmg = choice === "2" ? Math.floor(baseAtk * 1.8) : baseAtk;
    if (Math.random() < 0.18) { dmg *= 2; log += `🎯 ضربة حاسمة!\n`; }
    enemy.hp -= dmg;
    log += `⚔️ ضربتَ ${enemy.name} بـ ${dmg} ضرر!\n`;
  }

  // ── هجوم المستدعى ──
  if (choice === "4" && p.activeSummon) {
    enemy.hp -= p.activeSummon.atk;
    log += `🌑 ${p.activeSummon.name} هاجم بـ ${p.activeSummon.atk} ضرر!\n`;
  }

  // ── موت العدو ──
  if (enemy.hp <= 0) {
    return await handleWin(api, threadID, uid, p, enemy, log);
  }

  // ── هجوم العدو ──
  let eDmg = enemy.atk;
  if (p.shieldTurns > 0) { eDmg = Math.floor(eDmg * 0.35); p.shieldTurns--; log += `🛡️ الدرع قلّل الضرر!\n`; }
  if (enemy.final && Math.random() < 0.3) { eDmg = Math.floor(eDmg * 1.5); log += `💀 ملك الظلام أطلق قوة تدمير الكون!!\n`; }
  p.health -= eDmg;
  log += `👹 ${enemy.name} ضربكَ بـ ${eDmg} ضرر!\n`;

  // موت اللاعب
  if (p.health <= 0) {
    p.health = 8;
    p.inBattle = null;
    p.activeSummon = null;
    p.losses++;
    const lost = Math.min(80, p.gold);
    p.gold -= lost;

    const deathImg = await getImage(enemy.final
      ? "king of darkness winning warrior defeated apocalypse dark fantasy dramatic"
      : "dark fantasy warrior defeated fallen dramatic cinematic");
    const deathMsg = `\n💀━━━━━━━━━━━━━━━━━━━━━━━━💀\n`
      + `      💀 سقطتَ في المعركة! 💀\n`
      + `💀━━━━━━━━━━━━━━━━━━━━━━━━💀\n\n`
      + log
      + `\n😵 الصحة وصلت للصفر!\n`
      + `💰 خسرتَ ${lost} ذهب\n`
      + (enemy.final ? `\n👑 ملك الظلام يضحك: «أهذا كل ما لديك؟!» 😈\n` : "")
      + `\n🔄 عد لتتدرب وتعود أقوى!`;

    const sent = await api.sendMessage(
      deathImg ? { body: deathMsg, attachment: deathImg } : { body: deathMsg },
      threadID
    );
    setTimeout(() => showMenu(api, threadID, uid, p), 2000);
    return;
  }

  // استمرار المعركة
  battle.turn++;
  const continueBody = `\n⚔️━━━━━━━━━━━━━━━━━━━━━━━━⚔️\n`
    + `    ⚔️ جولة ${battle.turn + 1} ⚔️\n`
    + `⚔️━━━━━━━━━━━━━━━━━━━━━━━━⚔️\n\n`
    + log + "\n"
    + `👹 ${enemy.name}: ${hpBar(Math.max(0, enemy.hp), enemy.maxHp)} ${Math.max(0, enemy.hp)}/${enemy.maxHp}\n`
    + `❤️ أنت: ${hpBar(p.health, p.maxHealth)} ${p.health}/${p.maxHealth}\n\n`
    + `1️⃣ ⚔️ هجوم | 2️⃣ 💥 هجوم مزدوج\n`
    + `3️⃣ 🧪 جرعة | `
    + (p.activeSummon ? `4️⃣ 🌑 مستدعى | ` : "")
    + `5️⃣ 🏃 هرب\n\n`
    + `💬 أرسل رقم قرارك`;

  const sent = await api.sendMessage(
    extraImg ? { body: continueBody, attachment: extraImg } : { body: continueBody },
    threadID
  );
  setReply(sent.messageID, threadID, uid, "battle", p);
}

async function handleWin(api, threadID, uid, p, enemy, log) {
  p.inBattle = null;
  p.wins++;
  p.gold += enemy.gold;
  p.xp += enemy.xp;
  p.points += Math.floor(enemy.xp * 1.5);
  if (p.activeSummon && Math.random() < 0.3) p.activeSummon = null; // المستدعى قد يختفي

  let lvlUp = "";
  while (p.xp >= p.xpNeeded) {
    p.xp -= p.xpNeeded;
    p.level++;
    p.xpNeeded = Math.floor(p.xpNeeded * 1.45);
    p.maxHealth += 20;
    p.baseAtk += 3;
    p.health = p.maxHealth;
    lvlUp += `\n🎊 ترقيت للمستوى ${p.level}!\n❤️ +20 صحة | ⚔️ +3 قوة هجوم!\n`;
    if (p.level === 4) { p.summonUnlocked = true; lvlUp += `🌑 فتحتَ قدرة استدعاء الوحوش!\n`; }
    if (p.level === 8) { p.darkFormUnlocked = true; lvlUp += `🌑 فتحتَ التحول الأسود!\n`; }
  }

  // هل صرفت منطقة؟
  const zone = p.inBattle?.zone;

  const isKingDefeated = enemy.final;
  const victoryImg = await getImage(isKingDefeated
    ? "epic hero defeating king of darkness light vs darkness victory world saved cinematic stunning"
    : `epic victory warrior defeating ${enemy.id} dark fantasy glowing triumphant`
  );

  let ending = "";
  if (isKingDefeated) {
    p.finalBossDefeated = true;
    ending = `\n👑━━━━━━━━━━━━━━━━━━━━━━━━👑\n`
      + `   🌟 أنقذتَ العالم! 🌟\n`
      + `👑━━━━━━━━━━━━━━━━━━━━━━━━👑\n\n`
      + `💀 ملك الظلام سقط!\n`
      + `🌍 العالم حرّ بفضلكَ!\n`
      + `🏆 أنتَ بطل الأساطير إلى الأبد!\n`;
  }

  const winBody = `\n🏆━━━━━━━━━━━━━━━━━━━━━━━━🏆\n`
    + `         🎉 انتصرتَ! 🎉\n`
    + `🏆━━━━━━━━━━━━━━━━━━━━━━━━🏆\n\n`
    + log
    + `\n💀 ${enemy.name} هُزم!\n\n`
    + `💰 +${enemy.gold} ذهب\n`
    + `⭐ +${enemy.xp} XP\n`
    + `🏆 +${Math.floor(enemy.xp * 1.5)} نقاط\n`
    + lvlUp + ending;

  const sent = await api.sendMessage(
    victoryImg ? { body: winBody, attachment: victoryImg } : { body: winBody },
    threadID
  );
  setTimeout(() => showMenu(api, threadID, uid, p), 2000);
}

// ══════════════════════════════════════════════════════════════════
//  💪 التدريب
// ══════════════════════════════════════════════════════════════════
async function showTraining(api, threadID, uid, p) {
  const img = await getImage("dark fantasy warrior intense training dark dojo fire dramatic epic");
  const body = `\n💪━━━━━━━━━━━━━━━━━━━━━━━━💪\n`
    + `        💪 التدريب والتطور 💪\n`
    + `💪━━━━━━━━━━━━━━━━━━━━━━━━💪\n\n`
    + `💰 ذهبك: ${p.gold}\n`
    + `⚔️ هجومك الحالي: ${p.baseAtk + WEAPONS[p.weapon].damage}\n\n`
    + `1️⃣ ⚔️ تدريب القتال — 50 ذهب\n`
    + `   +8 ضرر دائم لكل هجوم\n\n`
    + `2️⃣ 🧘 تأمل الظلام — 70 ذهب\n`
    + `   +30 صحة قصوى دائمة\n\n`
    + `3️⃣ 🌑 فنون الظلام المحرّمة — 120 ذهب\n`
    + `   +15 ضرر + +20 صحة (متقدم)\n\n`
    + `4️⃣ 💨 تدريب السرعة — 60 ذهب\n`
    + `   20% فرصة إضافية للضربة الحاسمة\n\n`
    + `0️⃣ ↩️ رجوع\n\n`
    + `💬 أرسل رقم خيارك`;

  const sent = await api.sendMessage(
    img ? { body, attachment: img } : { body },
    threadID
  );
  setReply(sent.messageID, threadID, uid, "training", p);
}

async function processTraining(api, threadID, uid, p, choice) {
  if (choice === "0") return showMenu(api, threadID, uid, p);
  const opts = {
    "1": { cost: 50,  atkUp: 8,  hpUp: 0,  msg: "⚔️ تدربتَ بشدة!\n+8 ضرر دائم!" },
    "2": { cost: 70,  atkUp: 0,  hpUp: 30, msg: "🧘 تأملتَ في الظلام!\n+30 صحة قصوى!" },
    "3": { cost: 120, atkUp: 15, hpUp: 20, msg: "🌑 تعلمتَ فنون الظلام!\n+15 ضرر +20 صحة!" },
    "4": { cost: 60,  atkUp: 5,  hpUp: 0,  msg: "💨 تدربتَ على السرعة!\n+5 ضرر + احتمال ضربات حاسمة أعلى!" },
  };
  const o = opts[choice];
  if (!o) return showTraining(api, threadID, uid, p);
  if (p.gold < o.cost) return showMenu(api, threadID, uid, p, `❌ تحتاج ${o.cost} ذهب للتدريب!`);
  p.gold -= o.cost;
  p.baseAtk += o.atkUp;
  p.maxHealth += o.hpUp;
  p.health = Math.min(p.maxHealth, p.health + o.hpUp);

  const img = await getImage("warrior intense training dark energy glowing power up fantasy dramatic");
  const sent = await api.sendMessage(
    img ? { body: `💪 ${o.msg}\n\n⚔️ هجومك الآن: ${p.baseAtk + WEAPONS[p.weapon].damage}\n❤️ صحتك القصوى: ${p.maxHealth}`, attachment: img }
        : { body: `💪 ${o.msg}` },
    threadID
  );
  setTimeout(() => showMenu(api, threadID, uid, p), 1500);
}

// ══════════════════════════════════════════════════════════════════
//  🌑 الاستدعاء
// ══════════════════════════════════════════════════════════════════
async function showSummon(api, threadID, uid, p) {
  if (!p.summonUnlocked) return showMenu(api, threadID, uid, p, "🔒 الاستدعاء يفتح عند المستوى 4!");

  const img = await getImage("dark magic summoning circle glowing purple creatures rising epic fantasy cinematic");
  let list = "";
  const keys = Object.keys(SUMMONS);
  keys.forEach((k, i) => {
    const s = SUMMONS[k];
    const can = p.level >= s.unlockLvl;
    list += `${i + 1}️⃣ ${s.name} — ${s.cost} ذهب\n   ⚔️ ${s.atk} ضرر/جولة ${can ? "" : `(يفتح Lv.${s.unlockLvl})`}\n\n`;
  });

  const body = `\n🌑━━━━━━━━━━━━━━━━━━━━━━━━🌑\n`
    + `     🌑 استدعاء وحوش الظلام 🌑\n`
    + `🌑━━━━━━━━━━━━━━━━━━━━━━━━🌑\n\n`
    + `💰 ذهبك: ${p.gold}\n\n`
    + list
    + `0️⃣ ↩️ رجوع\n\n`
    + `💬 أرسل رقم ما تريد استدعاءه`;

  const sent = await api.sendMessage(
    img ? { body, attachment: img } : { body },
    threadID
  );
  setReply(sent.messageID, threadID, uid, "summon", p);
}

async function processSummon(api, threadID, uid, p, choice) {
  if (choice === "0") return showMenu(api, threadID, uid, p);
  const keys = Object.keys(SUMMONS);
  const idx = parseInt(choice) - 1;
  if (isNaN(idx) || idx < 0 || idx >= keys.length) return showSummon(api, threadID, uid, p);

  const key = keys[idx];
  const s = SUMMONS[key];
  if (p.level < s.unlockLvl) return showMenu(api, threadID, uid, p, `🔒 ${s.name} يفتح عند المستوى ${s.unlockLvl}!`);
  if (p.gold < s.cost) return showMenu(api, threadID, uid, p, `❌ تحتاج ${s.cost} ذهب!`);

  p.gold -= s.cost;
  p.activeSummon = { ...s };

  const img = await getImage(s.img);
  const sent = await api.sendMessage(
    img ? { body: `\n🌑 استدعيتَ ${s.name}!\n⚔️ سيهاجم معك بـ ${s.atk} ضرر في كل جولة!\n🌑 استخدم الخيار 4 في المعركة لأمره بالهجوم!`, attachment: img }
        : { body: `🌑 استدعيتَ ${s.name}! سيقاتل معك!` },
    threadID
  );
  setTimeout(() => showMenu(api, threadID, uid, p), 2000);
}

// ══════════════════════════════════════════════════════════════════
//  🌑 التحول الأسود
// ══════════════════════════════════════════════════════════════════
async function activateDarkForm(api, threadID, uid, p) {
  if (!p.darkFormUnlocked) return showMenu(api, threadID, uid, p, "🔒 التحول الأسود يفتح عند المستوى 8!");
  if (p.inBattle) {
    p.weapon = "darkform";
    p.darkFormTurns = 3;
    p.darkFormLostControl = false;

    const img = await getImage(WEAPONS.darkform.img);
    const sent = await api.sendMessage(
      img ? { body: `\n🌑━━━━━━━━━━━━━━━━━━━━━━━━🌑\n`
               + `   ⚠️ التحول الأسود مُفعّل! ⚠️\n`
               + `🌑━━━━━━━━━━━━━━━━━━━━━━━━🌑\n\n`
               + `💀 ضررك الآن: 120 لـ 3 جولات!\n`
               + `⚠️ بعد 3 جولات ستفقد السيطرة!\n`
               + `💔 قد تهاجم نفسك!`,
             attachment: img }
           : { body: "🌑 التحول الأسود مُفعّل! ⚠️" },
      threadID
    );
    return;
  }

  const img = await getImage(WEAPONS.darkform.img);
  const body = `\n🌑━━━━━━━━━━━━━━━━━━━━━━━━🌑\n`
    + `       🌑 التحول الأسود 🌑\n`
    + `🌑━━━━━━━━━━━━━━━━━━━━━━━━🌑\n\n`
    + `⚡ ضرر هائل: 120 لـ 3 جولات\n`
    + `⚠️ بعد 3 جولات: تفقد السيطرة!\n`
    + `💔 ستهاجم نفسك بـ 30-90 ضرر!\n\n`
    + `يُفعَّل تلقائياً في المعركة التالية.\n`
    + `🔙 ابدأ معركة لتفعيله!`;

  await api.sendMessage(
    img ? { body, attachment: img } : { body },
    threadID
  );
  p.weapon = "darkform";
  p.darkFormTurns = 3;
  setTimeout(() => showMenu(api, threadID, uid, p), 2000);
}

// ══════════════════════════════════════════════════════════════════
//  🏪 المتجر
// ══════════════════════════════════════════════════════════════════
async function showShop(api, threadID, uid, p) {
  const img = await getImage("dark fantasy black market glowing potions ancient weapons night mysterious cinematic");
  const allItems = [
    ...Object.entries(WEAPONS).filter(([id]) => id !== "darkform" && id !== "fists"),
    ...Object.entries(POTIONS)
  ];

  let list = "";
  allItems.forEach(([id, item], i) => {
    const isWeapon = !!item.damage;
    const owned = isWeapon && p.inventory.weapons.includes(id);
    const equipped = isWeapon && p.weapon === id;
    const needLvl = isWeapon && item.unlock > p.level;
    list += `${i + 1}️⃣ ${item.name} — ${item.cost} 💰\n`;
    if (isWeapon) list += `   💥 ضرر: ${item.damage}${needLvl ? ` (يفتح Lv.${item.unlock})` : ""}${owned ? (equipped ? " ✅مجهز" : " ✔مملوك") : ""}\n`;
    else list += `   ${item.desc}\n`;
  });

  const body = `\n🏪━━━━━━━━━━━━━━━━━━━━━━━━🏪\n`
    + `       🏪 سوق السحر الأسود 🏪\n`
    + `🏪━━━━━━━━━━━━━━━━━━━━━━━━🏪\n\n`
    + `💰 رصيدك: ${p.gold} ذهب\n\n`
    + list + "\n"
    + `0️⃣ ↩️ رجوع\n\n`
    + `💬 أرسل رقم ما تريد شراءه`;

  const sent = await api.sendMessage(
    img ? { body, attachment: img } : { body },
    threadID
  );
  setReply(sent.messageID, threadID, uid, "shop", p, { shopItems: allItems });
}

async function processBuy(api, threadID, uid, p, choice, shopItems) {
  if (choice === "0") return showMenu(api, threadID, uid, p);
  const idx = parseInt(choice) - 1;
  if (isNaN(idx) || idx < 0 || idx >= shopItems.length) return showShop(api, threadID, uid, p);

  const [id, item] = shopItems[idx];
  const isWeapon = !!item.damage;

  if (isWeapon) {
    if (item.unlock > p.level) return showMenu(api, threadID, uid, p, `🔒 هذا السلاح يحتاج المستوى ${item.unlock}!`);
    if (p.inventory.weapons.includes(id)) { p.weapon = id; return showMenu(api, threadID, uid, p, `✅ جهّزتَ ${item.name}!`); }
    if (p.gold < item.cost) return showMenu(api, threadID, uid, p, `❌ تحتاج ${item.cost} ذهب!`);
    p.gold -= item.cost;
    p.inventory.weapons.push(id);
    p.weapon = id;
    return showMenu(api, threadID, uid, p, `✅ اشتريتَ وجهّزتَ ${item.name}!\n💥 ضررك الآن: ${item.damage + p.baseAtk}`);
  } else {
    if (p.gold < item.cost) return showMenu(api, threadID, uid, p, `❌ تحتاج ${item.cost} ذهب!`);
    p.gold -= item.cost;
    p.inventory.potions.push(id);
    return showMenu(api, threadID, uid, p, `✅ اشتريتَ ${item.name}!\n🎒 في حقيبتك الآن`);
  }
}

// ══════════════════════════════════════════════════════════════════
//  👑 ملك الظلام — المعركة النهائية
// ══════════════════════════════════════════════════════════════════
async function startFinalBoss(api, threadID, uid, p) {
  if (p.level < 10) return showMenu(api, threadID, uid, p, "⚠️ تحتاج المستوى 10 لمواجهة ملك الظلام!");

  const king = ENEMIES.final[0];
  const intro = king.intro + "\n⏳ جارٍ استدعاء الظلام المطلق...";
  await api.sendMessage(intro, threadID);

  await new Promise(r => setTimeout(r, 1500));
  await startBattle(api, threadID, uid, p, "final", { ...king });
}

// ══════════════════════════════════════════════════════════════════
//  🎭 إنشاء الشخصية
// ══════════════════════════════════════════════════════════════════
async function showCharCreate(api, threadID, uid, p) {
  const img = await getImage("dark fantasy character creation screen male female warrior selection epic cinematic");
  const body = `\n🌑━━━━━━━━━━━━━━━━━━━━━━━━🌑\n`
    + `   ⚫ عالم السحر الأسود ⚫\n`
    + `      إنشاء شخصيتك\n`
    + `🌑━━━━━━━━━━━━━━━━━━━━━━━━🌑\n\n`
    + `⚔️ اختر جنس شخصيتك:\n\n`
    + `1️⃣ 🧔 محارب (ذكر)\n`
    + `2️⃣ 🧝‍♀️ محاربة (أنثى)\n\n`
    + `💬 أرسل 1 أو 2`;

  const sent = await api.sendMessage(
    img ? { body, attachment: img } : { body },
    threadID
  );
  setReply(sent.messageID, threadID, uid, "char_create", p);
}

// ══════════════════════════════════════════════════════════════════
//  🔧 تصدير الأمر
// ══════════════════════════════════════════════════════════════════
module.exports = {
  config: {
    name: "عالم",
    aliases: ["السحر", "blackworld", "magicworld", "darkworld"],
    version: "5.0",
    author: "ماهر",
    countDown: 5, role: 0,
    shortDescription: "🌑 عالم السحر الأسود — العالم المفتوح الأسطوري",
    longDescription: "لعبة مغامرة مفتوحة مع قتال وأسلحة ومتجر وتدريب واستدعاء وتحول أسود وملك الظلام",
    category: "game",
    guide: "اكتب: عالم السحر",
    usePrefix: false
  },

  onStart: async function ({ api, event }) {
    const { threadID, senderID } = event;
    let name = "البطل";
    try { const i = await api.getUserInfo(senderID); name = i[senderID]?.name || name; } catch {}

    const p = getPlayer(senderID, name);

    if (!p.created) {
      return showCharCreate(api, threadID, senderID, p);
    }

    await showMenu(api, threadID, senderID, p, `🌑 مرحباً بعودتك يا ${p.name}!`);
  },

  onReply: async function ({ api, event, Reply }) {
    const { threadID, senderID, body } = event;
    if (Reply.author && Reply.author !== senderID) return;

    const input = body.trim();
    const p = Reply.player || getPlayer(senderID, "البطل");

    switch (Reply.phase) {

      // ── إنشاء الشخصية ──
      case "char_create": {
        if (!["1","2"].includes(input)) return showCharCreate(api, threadID, senderID, p);
        p.gender = input === "1" ? "male" : "female";
        p.created = true;
        const charImg = await getImage(
          p.gender === "male"
            ? "dark fantasy male warrior hero epic armor glowing dark energy standing tall cinematic dramatic portrait"
            : "dark fantasy female warrior hero epic armor glowing dark energy standing tall cinematic dramatic portrait"
        );
        const intro = `\n🌑━━━━━━━━━━━━━━━━━━━━━━━━🌑\n`
          + `   شخصيتك جاهزة يا ${p.name}!\n`
          + `🌑━━━━━━━━━━━━━━━━━━━━━━━━🌑\n\n`
          + `${p.gender === "male" ? "🧔 المحارب" : "🧝‍♀️ المحاربة"}: ${p.name}\n`
          + `❤️ الصحة: 100 | ⚔️ الهجوم: 10\n`
          + `💰 الذهب: 200 | ⭐ المستوى: 1\n\n`
          + `🌑 عالمك ينتظر...\n`
          + `👑 ملك الظلام يريد تدمير كل شيء!\n`
          + `⚔️ تدرّب وقاتل حتى تصله!`;

        const sent = await api.sendMessage(
          charImg ? { body: intro, attachment: charImg } : { body: intro },
          threadID
        );
        setTimeout(() => showMenu(api, threadID, senderID, p), 2000);
        return;
      }

      case "main_menu":
        if (input === "1") return showZones(api, threadID, senderID, p);
        if (input === "2") return showTraining(api, threadID, senderID, p);
        if (input === "3") return showShop(api, threadID, senderID, p);
        if (input === "4") return showInventory(api, threadID, senderID, p);
        if (input === "5") return showSummon(api, threadID, senderID, p);
        if (input === "6") return activateDarkForm(api, threadID, senderID, p);
        if (input === "7") return startFinalBoss(api, threadID, senderID, p);
        return showMenu(api, threadID, senderID, p);

      case "zones":
        if (input === "0") return showMenu(api, threadID, senderID, p);
        if (input === "1") return startBattle(api, threadID, senderID, p, "forest");
        if (input === "2") {
          if (p.level < 3) return showMenu(api, threadID, senderID, p, "⚠️ تحتاج المستوى 3 لعالم الشياطين!");
          return startBattle(api, threadID, senderID, p, "demons");
        }
        if (input === "3") {
          if (p.level < 6) return showMenu(api, threadID, senderID, p, "⚠️ تحتاج المستوى 6 لجبال الوحوش!");
          return startBattle(api, threadID, senderID, p, "mountains");
        }
        return showZones(api, threadID, senderID, p);

      case "battle":
        if (!["1","2","3","4","5"].includes(input))
          return api.sendMessage("⚠️ أرسل رقم صحيح (1-5)!", threadID);
        return processBattle(api, threadID, senderID, p, input);

      case "training":
        return processTraining(api, threadID, senderID, p, input);

      case "shop":
        return processBuy(api, threadID, senderID, p, input, Reply.shopItems || []);

      case "summon":
        return processSummon(api, threadID, senderID, p, input);

      case "inventory":
        if (input === "0") return showMenu(api, threadID, senderID, p);
        return showMenu(api, threadID, senderID, p);

      default:
        return showMenu(api, threadID, senderID, p);
    }
  }
};

// ══════════════════════════════════════════════════════════════════
//  🎒 الحقيبة
// ══════════════════════════════════════════════════════════════════
async function showInventory(api, threadID, uid, p) {
  const wpnStr = p.inventory.weapons.map(id => {
    const w = WEAPONS[id];
    return `${w.name} (💥${w.damage})${p.weapon === id ? " ✅" : ""}`;
  }).join("\n") || "لا أسلحة";

  const potStr = p.inventory.potions.map(id => POTIONS[id]?.name || id).join("\n") || "لا جرعات";

  const body = `\n🎒━━━━━━━━━━━━━━━━━━━━━━━━🎒\n`
    + `           🎒 حقيبتك 🎒\n`
    + `🎒━━━━━━━━━━━━━━━━━━━━━━━━🎒\n\n`
    + `⚔️ الأسلحة:\n${wpnStr}\n\n`
    + `🧪 الجرعات:\n${potStr}\n\n`
    + `💰 ذهب: ${p.gold} | 🏆 نقاط: ${p.points}\n`
    + `⭐ Lv.${p.level} | ✅ ${p.wins} انتصار | ❌ ${p.losses} هزيمة\n`
    + `🌑 استدعاء: ${p.activeSummon ? p.activeSummon.name : "لا يوجد"}\n\n`
    + `0️⃣ ↩️ رجوع`;

  const sent = await api.sendMessage({ body }, threadID);
  setReply(sent.messageID, threadID, uid, "inventory", p);
}
