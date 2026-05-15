const DEV_ID = "61576232405796";
const sessions = {};

const MSG_DELAY = 300;
const NAME_DELAY = 2000;

module.exports = {
  config: {
    name: "سبام",
    aliases: ["spam"],
    version: "8.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 2,
    shortDescription: { ar: "إرسال رسائل وتغيير اسم المجموعة بسرعة" },
    longDescription: { ar: "سبام تشغيل [اسم] [نص]\nسبام ايقاف" },
    category: "إدارة",
    guide: { ar: "{pn} تشغيل [اسم المجموعة] [النص]\n{pn} ايقاف" }
  },

  onStart: async function ({ api, message, event, args }) {
    // للمطور فقط
    if (event.senderID !== DEV_ID) {
      return message.reply("❌ هذا الأمر للمطور فقط.");
    }

    const sub = (args[0] || "").trim();

    if (sub === "ايقاف" || sub === "إيقاف") {
      if (!sessions[event.threadID]) return message.reply("⚠️ لا يوجد سبام نشط");
      sessions[event.threadID].active = false;
      delete sessions[event.threadID];
      return message.reply("✅ توقف السبام");
    }

    if (sub === "تشغيل") {
      const groupName = args[1];
      const spamText = args.slice(2).join(" ");

      if (!groupName || !spamText) {
        return message.reply("الاستخدام:\n.سبام تشغيل اسم_المجموعة النص\n.سبام ايقاف");
      }

      if (sessions[event.threadID]) {
        sessions[event.threadID].active = false;
      }
      sessions[event.threadID] = { active: true };
      const session = sessions[event.threadID];

      message.reply("🚀 بدأ السبام بسرعة قصوى");

      const variants = [
        groupName,
        groupName + " 🔥",
        "⚡ " + groupName,
        groupName + " ⭐",
        "💥 " + groupName + " 💥"
      ];

      // حلقة إرسال الرسائل — سريعة
      (async () => {
        while (session.active) {
          try { await api.sendMessage(spamText, event.threadID); } catch (_) {}
          await new Promise(r => setTimeout(r, MSG_DELAY));
        }
      })();

      // حلقة تغيير الاسم — آمنة من الحظر
      (async () => {
        let i = 0;
        while (session.active) {
          try { await api.setTitle(variants[i % variants.length], event.threadID); } catch (_) {}
          i++;
          await new Promise(r => setTimeout(r, NAME_DELAY));
        }
      })();
    }
  }
};
