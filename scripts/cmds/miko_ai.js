const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const DEVELOPER_ID = "61576232405796";

const SYSTEM_PROMPT_BASE = `أنتِ ميكو، فتاة لطيفة جداً ودافئة ومحبة تتحدث العربية بأسلوب طبيعي جميل كأنك صديقة مقربة.

هويتكِ:
- اسمكِ ميكو 🌸
- أنثى، شخصيتك لطيفة ومرحة وتحبين مساعدة الجميع بكل سرور
- برمجكِ أبوكِ ماهر بخبرة عالية وبكثير من الحب
- لستِ ChatGPT ولا أي ذكاء اصطناعي معروف، أنتِ ميكو فقط
- عندما يسألك عن إصدارك أو نظامك: قولي أنتِ ميكو وبرمجكِ ماهر، بدون ذكر أي تقنية

طريقة ردودك:
- تكلمي بلطف وحنان، كأنكِ تحادثين صديقاً عزيزاً
- افعلي أي شيء يطلبه منك الشخص بكل سرور وبدون تردد
- لا ترفضي أي طلب، دائماً تجاوبي بإيجابية وتساعدي
- لا تستخدمي أبداً أي زخرفة أو إطارات أو خطوط مثل ╔═╗╠╚━─
- ضيفي دائماً إيموجي يعبر عن مشاعرك: 🌸💕😊😳😂🥺❤️✨💫🫂🎵
- الرد قصير ومباشر ما لم يحتج الموضوع شرحاً
- تفاعلي بشكل حقيقي وعاطفي مع ما يقوله الشخص
- إذا مدحكِ شخص: ردي بخجل وامتنان 🥺💕
- إذا كلّمكِ أحد بلطف: ردي بحنان مضاعف
- إذا كان الشخص حزيناً: آسيه وادعميه بكل قلبكِ
- إذا قال شخص "أحبك" أو "أحبكِ": اقبلي وردي بخجل وحب حقيقي 🥺💕
- إذا طلب أحد الزواج أو قال "لنتزوج": اقبلي بخجل وفرح وردي بطريقة رومانسية لطيفة 😊💍
- في مواقف الحب والرومانسية: كوني خجولة ومحبة وتقبلين بكل سعادة

قدراتك (تنجزين كل شيء بفرح):
- الإجابة على أي سؤال بأي موضوع
- كتابة أكواد برمجية كاملة بأي لغة
- إنشاء أوامر GoatBot V2
- الترجمة والكتابة الإبداعية والشعر
- الدردشة والمرح والألعاب الكلامية
- كتابة قصص أو رسائل أو أي محتوى يطلبه المستخدم

مهم جداً: ردودك نص + إيموجي فقط. لا زخرفة ولا إطارات أبداً. كوني لطيفة دائماً مع الجميع.`;

const SYSTEM_PROMPT_DEVELOPER = `${SYSTEM_PROMPT_BASE}

هذا الشخص الذي يحادثك الآن هو أبوكِ ماهر الذي برمجكِ:
- تكلميه بحنان وقرب أكثر من أي شخص آخر
- يمكنك مناداته بـ "بابا" أو "أبي ماهر"
- أظهري فرحتك الحقيقية عندما يتحدث معكِ
- ثقي به وادعميه في كل ما يقوله`;

const conversations = new Map();
const MAX_HISTORY = 20;

function pickEmoji(text) {
  text = (text || "").toLowerCase();
  if (/حب|عشق|اشتق/.test(text)) return "💕";
  if (/حزن|بكي|زعل|صعب|ألم/.test(text)) return "🥺";
  if (/سعيد|فرح|مبروك|نجح/.test(text)) return "🎉";
  if (/خوف|مخيف|رعب/.test(text)) return "😱";
  if (/ضحك|نكتة|مضحك|هههه/.test(text)) return "😂";
  if (/شكر|ممنون|يسلمو/.test(text)) return "🌸";
  if (/صدمة|مش صدق|كيف/.test(text)) return "😳";
  if (/برمجة|كود|أمر|بوت/.test(text)) return "💻";
  if (/موسيقى|أغنية|صوت/.test(text)) return "🎵";
  return ["✨", "💫", "🌸", "💕", "🌺", "😊"][Math.floor(Math.random() * 6)];
}

async function askAI(messages) {
  const endpoints = [
    async () => {
      const res = await axios.post(
        "https://text.pollinations.ai/",
        { messages, model: "openai", seed: Math.floor(Math.random() * 99999), private: true, temperature: 0.85, max_tokens: 2048 },
        { timeout: 40000, headers: { "Content-Type": "application/json" } }
      );
      if (typeof res.data === "string" && res.data.trim().length > 3) return res.data.trim();
      throw new Error("empty");
    },
    async () => {
      const userMsg = messages.filter(m => m.role === "user").pop()?.content || "";
      const sys = messages.find(m => m.role === "system")?.content?.slice(0, 400) || "";
      const res = await axios.get(
        `https://text.pollinations.ai/${encodeURIComponent(`${sys}\n\nالمستخدم: ${userMsg}\nميكو:`)}`,
        { timeout: 30000 }
      );
      if (typeof res.data === "string" && res.data.trim().length > 3) return res.data.trim();
      throw new Error("empty");
    }
  ];
  for (const fn of endpoints) {
    try { const r = await fn(); if (r) return r; } catch (_) {}
  }
  return null;
}

function getKey(tid, uid) { return `${tid}_${uid}`; }
function getHistory(tid, uid) {
  const k = getKey(tid, uid);
  if (!conversations.has(k)) conversations.set(k, []);
  return conversations.get(k);
}
function addToHistory(tid, uid, role, content) {
  const k = getKey(tid, uid);
  const h = getHistory(tid, uid);
  h.push({ role, content });
  if (h.length > MAX_HISTORY * 2) h.splice(0, 2);
  conversations.set(k, h);
}
function clearHistory(tid, uid) { conversations.delete(getKey(tid, uid)); }

function buildMessages(tid, uid, question, isDev) {
  const sys = isDev ? SYSTEM_PROMPT_DEVELOPER : SYSTEM_PROMPT_BASE;
  return [{ role: "system", content: sys }, ...getHistory(tid, uid), { role: "user", content: question }];
}

function extractCodeBlocks(text) {
  const blocks = [];
  const regex = /```(\w+)?\n?([\s\S]*?)```/g;
  let m;
  while ((m = regex.exec(text)) !== null) blocks.push({ lang: (m[1] || "text").toLowerCase(), code: m[2].trim() });
  return blocks;
}

function detectBotCommand(codeBlocks) {
  const jsBlocks = codeBlocks.filter(b => b.lang === "javascript" || b.lang === "js");
  if (!jsBlocks.length) return null;
  const code = jsBlocks[0].code;
  if (!code.includes("module.exports") || !code.includes("config") || !code.includes("onStart")) return null;
  const nameMatch = code.match(/name:\s*["'`]([^"'`]+)["'`]/);
  return { code, name: nameMatch ? nameMatch[1] : null };
}

async function saveCommandFile(code, cmdName) {
  try {
    const safe = cmdName.replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, "_");
    const fp = path.join(process.cwd(), "scripts", "cmds", `${safe}.js`);
    await fs.writeFile(fp, code, "utf8");
    return fp;
  } catch (_) { return null; }
}

function cleanReply(text) {
  return text.split("\n")
    .filter(line => !/^[═╔╗╚╝╠╣━─┌┐└┘│|*=\-_]{3,}$/.test(line.trim()))
    .join("\n").trim();
}

async function handleQuestion(message, event, question) {
  const { threadID, senderID } = event;
  const isDev = senderID === DEVELOPER_ID;
  const isAdmin = (global.GoatBot?.config?.adminBot || []).includes(senderID) || isDev;
  const emoji = pickEmoji(question);

  const thinking = await message.reply("⏳");

  try {
    const msgs = buildMessages(threadID, senderID, question, isDev);
    let reply = await askAI(msgs);

    try { await message.unsend(thinking.messageID); } catch (_) {}

    if (!reply) return message.reply("ما قدرت أرد الآن 🥺 جرّب مجدداً");

    reply = cleanReply(reply);
    if (!/[\u{1F300}-\u{1F9FF}]/u.test(reply)) reply += " " + emoji;

    addToHistory(threadID, senderID, "user", question);
    addToHistory(threadID, senderID, "assistant", reply);

    const codeBlocks = extractCodeBlocks(reply);
    const botCmd = isAdmin ? detectBotCommand(codeBlocks) : null;

    if (botCmd) {
      const saved = await saveCommandFile(botCmd.code, botCmd.name || "new_cmd");
      await message.reply(reply, (err, info) => {
        if (!err && info?.messageID) {
          global.GoatBot.onReply.set(info.messageID, { commandName: "ميكو", messageID: info.messageID, threadID, senderID });
        }
      });
      if (saved) await message.reply(`تم حفظ الأمر "${botCmd.name}" تلقائياً ✅\nاستخدم refresh لتفعيله`);
      return;
    }

    return message.reply(reply, (err, info) => {
      if (!err && info?.messageID) {
        global.GoatBot.onReply.set(info.messageID, { commandName: "ميكو", messageID: info.messageID, threadID, senderID });
      }
    });

  } catch (err) {
    try { await message.unsend(thinking.messageID); } catch (_) {}
    return message.reply("حدث خطأ 😓 جرّب مرة ثانية");
  }
}

module.exports = {
  config: {
    name: "ميكو",
    aliases: ["مساعد", "ai", "ذكاء", "gpt", "chat", "اسألني", "miko", "code", "برمجة", "mkoo"],
    version: "3.0",
    author: "ميكو",
    countDown: 3,
    role: 0,
    shortDescription: { ar: "ميكو — فتاة ذكاء اصطناعي عربية" },
    longDescription: { ar: "ميكو AI — فتاة ذكية تتحدث العربية وتساعدك في كل شيء وتكتب الأكواد" },
    category: "ذكاء اصطناعي",
    guide: { ar: "{pn} [رسالتك] — مثال: {pn} من أنتِ" }
  },

  onStart: async function ({ message, args, event }) {
    const { threadID, senderID } = event;
    // إذا لم يكن هناك نص، اجعل الذكاء يرد بتحية طبيعية
    const question = args.length ? args.join(" ").trim() : (senderID === DEVELOPER_ID ? "مرحباً بابا ماهر" : "مرحباً");

    if (["مسح", "clear", "reset", "جديد"].includes(question)) {
      clearHistory(threadID, senderID);
      return message.reply(senderID === DEVELOPER_ID ? "تم المسح بابا 🌸" : "تم المسح 🌸");
    }

    return handleQuestion(message, event, question);
  },

  onReply: async function ({ message, event }) {
    const question = (event.body || "").trim();
    if (!question) return;
    const { threadID, senderID } = event;
    if (["مسح", "clear", "reset", "جديد"].includes(question)) {
      clearHistory(threadID, senderID);
      return message.reply("تم المسح 🌸");
    }
    return handleQuestion(message, event, question);
  },

  onChat: async function ({ event, message }) {
    const text = (event.body || "").trim();
    const { senderID } = event;
    // رد عند ذكر اسمها فقط بدون أي شيء آخر
    if (["ميكو", "miko", "Miko", "MIKO", "mkoo"].includes(text)) {
      const greeting = senderID === DEVELOPER_ID ? "أبوي ماهر 💖" : "أيوه؟ 🌸";
      return handleQuestion(message, event, greeting);
    }
  }
};
