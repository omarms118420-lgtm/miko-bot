const { commands } = global.GoatBot;
const fs = require("fs-extra");
const path = require("path");

const PREFIX = "-";
const MENU_IMAGE_PATH = path.join(__dirname, "../../assets/menu_anime_girl.png");

const ENCIRCLED = ["⓵","⓶","⓷","⓸","⓹","⓺","⓻","⓼","⓽","⓾","⓫","⓬","⓭","⓮","⓯","⓰","⓱","⓲","⓳","⓴"];

const HDR_TOP  = "🌸 ╔════ ∘◦ ✥ ◦∘ ════╗";
const HDR_MID  = "\t༒☾ 𝙼𝙸𝙺𝙾 𝙼𝙴𝙽𝚄 ☽༒";
const HDR_BOT  = "\t╚════ ∘◦ ✥ ◦∘ ════╝";
const SEP      = "★ᯓ──────────────ᯓ★";

const CAT_MAP = {
  "معلومات":        { en: "𝙸𝙽𝙵𝙾",        emoji: "📊" },
  "نظام":           { en: "𝚂𝚈𝚂𝚃𝙴𝙼",      emoji: "⚙" },
  "ترفيه":          { en: "𝙴𝙽𝚃𝙴𝚁𝚃𝙰𝙸𝙽",   emoji: "🎭" },
  "ألعاب":          { en: "𝙶𝙰𝙼𝙴𝚂",       emoji: "🎮" },
  "موسيقى":         { en: "𝙼𝚄𝚂𝙸𝙲",       emoji: "🎵" },
  "أدوات":          { en: "𝚃𝙾𝙾𝙻𝚂",       emoji: "🛠" },
  "مال":            { en: "𝙴𝙲𝙾𝙽𝙾𝙼𝚈",    emoji: "💰" },
  "إدارة":          { en: "𝙰𝙳𝙼𝙸𝙽",       emoji: "👑" },
  "مجموعة":         { en: "𝙶𝚁𝙾𝚄𝙿",       emoji: "👥" },
  "عام":            { en: "𝙾𝚃𝙷𝙴𝚁𝚂",      emoji: "➕" },
  "ذكاء اصطناعي":  { en: "𝙰𝙸",           emoji: "🤖" },
  "خدمات":          { en: "𝚂𝙴𝚁𝚅𝙸𝙲𝙴𝚂",   emoji: "🔗" },
  "الصور":          { en: "𝙼𝙴𝙳𝙸𝙰",       emoji: "🖼" },
  "صور":            { en: "𝙼𝙴𝙳𝙸𝙰",       emoji: "🖼" }
};

function catInfo(cat) {
  const key = (cat || "عام").trim();
  return CAT_MAP[key] || { en: key.toUpperCase(), emoji: "📂" };
}

module.exports = {
  config: {
    name: "اوامر",
    aliases: ["menu", "مساعدة", "قائمة", "help"],
    version: "6.0",
    author: "ميكو",
    role: 0,
    category: "معلومات",
    priority: 1,
    shortDescription: { ar: "قائمة أوامر البوت" },
    longDescription: { ar: "عرض جميع أوامر البوت مقسّمة حسب الأقسام" },
    guide: { ar: "{pn} — عرض الأقسام\n{pn} [رقم] — عرض أوامر القسم\n{pn} [اسم الأمر] — تفاصيل الأمر" }
  },

  onChat: async function ({ event, message }) {
    const text = (event.body || "").trim();
    if (!text) return;
    const lower = text.toLowerCase();
    const isHelp =
      lower.startsWith("help") || lower.startsWith("menu") ||
      text.startsWith("مساعدة") || text.startsWith("قائمة") || text.startsWith("اوامر");
    if (!isHelp) return;
    const parts = text.split(/\s+/);
    parts.shift();
    return this.onStart({ message, args: parts, event, role: 0 });
  },

  onStart: async function ({ message, args, event, role = 0 }) {
    const categories = {};
    for (const [name, cmd] of commands.entries()) {
      if ((cmd.config?.role ?? 0) <= role) {
        const cat = (cmd.config?.category || "عام").trim();
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(name);
      }
    }

    const catList = Object.keys(categories).sort((a, b) => a.localeCompare(b, "ar"));
    const arg = args[0];

    if (!arg) {
      let body = "";
      body += `${HDR_TOP}\n`;
      body += `${HDR_MID}\n`;
      body += `${HDR_BOT}\n`;
      body += `\t\t📚 الـــفـــئـــات 📚\n`;
      catList.forEach((cat, i) => {
        const { en, emoji } = catInfo(cat);
        const num = ENCIRCLED[i] || `${i + 1}`;
        body += `${num} \t『${emoji} | ${en}』\n`;
      });
      body += `\n${SEP}\n`;
      body += `🔎 | رد بـ رقــم الــفــئــة\n`;
      body += `📝 | أرسل اوامر 'اسم الأمر' لـمـزيـد مـن الـمـعـلـومـات\n`;
      body += `📜 | اجـمـالـي عـدد الاوامـر : ${commands.size}`;

      const replyPayload = { body };
      if (fs.existsSync(MENU_IMAGE_PATH)) {
        replyPayload.attachment = fs.createReadStream(MENU_IMAGE_PATH);
      }

      return message.reply(replyPayload, (err, info) => {
        if (!err && info?.messageID) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "اوامر",
            messageID: info.messageID,
            categories,
            catList,
            role
          });
        }
      });
    }

    if (/^\d+$/.test(arg)) {
      return showCategory(message, parseInt(arg), catList, categories);
    }

    const cmdObj =
      commands.get(arg.toLowerCase()) ||
      commands.get(global.GoatBot.aliases?.get(arg.toLowerCase()));

    if (!cmdObj || (cmdObj.config?.role ?? 0) > role) {
      return message.reply(
        `${HDR_TOP}\n${HDR_MID}\n${HDR_BOT}\n` +
        `❌ الأمر "${arg}" غير موجود\n` +
        `${SEP}\n` +
        `💡 أرسل ${PREFIX}اوامر لعرض القائمة`
      );
    }

    const cfg = cmdObj.config;
    const shortDesc = cfg.shortDescription?.ar || cfg.shortDescription?.en || cfg.shortDescription || "لا يوجد وصف";
    const longDesc  = cfg.longDescription?.ar  || cfg.longDescription?.en  || cfg.longDescription  || "لا يوجد وصف تفصيلي";
    const usage     = cfg.guide?.ar || cfg.guide?.en || cfg.guide || "لا يوجد مثال";
    const aliases   = cfg.aliases?.length ? cfg.aliases.join(" | ") : "لا يوجد";
    const { en, emoji } = catInfo(cfg.category || "عام");

    const details =
      `${HDR_TOP}\n${HDR_MID}\n${HDR_BOT}\n` +
      `\t\t📌 تـفـاصـيـل الأمـر\n` +
      `${SEP}\n` +
      `❖ الاسم       ➜  ${cfg.name}\n` +
      `❖ القسم       ➜  ${emoji} ${en}\n` +
      `❖ البديلة     ➜  ${aliases}\n` +
      `${SEP}\n` +
      `📝 الوصف:\n${shortDesc}\n` +
      `${SEP}\n` +
      `📖 التفصيل:\n${String(longDesc).replace(/\n/g, "\n")}\n` +
      `${SEP}\n` +
      `🧩 الاستخدام:\n` +
      `${String(usage).replace(/{p}/g, PREFIX).replace(/{n}/g, cfg.name).replace(/{pn}/g, PREFIX + cfg.name)}\n` +
      `${SEP}`;

    return message.reply(details);
  },

  onReply: async function ({ message, event, Reply }) {
    const text = (event.body || "").trim();
    if (!/^\d+$/.test(text)) {
      return message.reply("⚠️ يرجى إرسال رقم القسم فقط.");
    }
    const { categories, catList } = Reply;
    return showCategory(message, parseInt(text), catList, categories);
  }
};

function showCategory(message, num, catList, categories) {
  const idx = num - 1;
  if (idx < 0 || idx >= catList.length) {
    return message.reply(
      `🌸 ╔════ ∘◦ ✥ ◦∘ ════╗\n` +
      `\t༒☾ 𝙼𝙸𝙺𝙾 𝙼𝙴𝙽𝚄 ☽༒\n` +
      `\t╚════ ∘◦ ✥ ◦∘ ════╝\n` +
      `❌ القسم رقم ${num} غير موجود\n` +
      `الأقسام المتاحة: ١ إلى ${catList.length}\n` +
      `★ᯓ──────────────ᯓ★`
    );
  }
  const cat = catList[idx];
  const cmdsInCat = categories[cat];
  const { en, emoji } = catInfo(cat);

  let body = `🌸 ╔════ ∘◦ ✥ ◦∘ ════╗\n`;
  body += `\t༒☾ ${emoji} ${en} ☽༒\n`;
  body += `\t╚════ ∘◦ ✥ ◦∘ ════╝\n`;
  body += `\t\t📜 قـائـمـة الأوامـر\n`;
  body += `★ᯓ──────────────ᯓ★\n`;
  cmdsInCat.sort().forEach((n, i) => {
    const encNum = ["⓵","⓶","⓷","⓸","⓹","⓺","⓻","⓼","⓽","⓾","⓫","⓬","⓭","⓮","⓯","⓰","⓱","⓲","⓳","⓴"][i] || `${i+1}`;
    body += `${encNum} 『${n}』\n`;
  });
  body += `★ᯓ──────────────ᯓ★\n`;
  body += `📝 | أرسل اوامر 'اسم الأمر' لـمـزيـد مـن الـمـعـلـومـات\n`;
  body += `📜 | عـدد أوامـر الـقـسـم : ${cmdsInCat.length}`;
  return message.reply(body);
}
