const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "callad",
    aliases: ["تواصل", "report"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 30,
    role: 0,
    shortDescription: { ar: "إرسال رسالة لمشرف البوت" },
    longDescription: { ar: "يرسل تقريراً أو استفساراً أو ملاحظة لمشرف البوت" },
    category: "أدوات",
    guide: { ar: "{pn} [الرسالة]" }
  },

  onStart: async function ({ api, message, event, args }) {
    if (!args.length) return message.reply("⚠️ يرجى إدخال الرسالة التي تريد إرسالها للمشرف");
    const content = args.join(" ");
    const now = new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });
    const isGroup = event.isGroup;
    const info = isGroup ? "\n- المجموعة: " + event.threadID : "\n- من محادثة خاصة";

    const adminMsg =
      "📬 رسالة جديدة من مستخدم\n" +
      "المرسل: " + event.senderID + info + "\n" +
      "الوقت: " + now + "\n" +
      "──────────────\n" +
      content + "\n" +
      "──────────────\n" +
      "رد على هذه الرسالة للتواصل مع المستخدم";

    const admins = global.GoatBot.config?.adminBot || [DEV_ID];
    for (const adminId of admins) {
      if (adminId) {
        try { await api.sendMessage(adminMsg, adminId); } catch (e) {}
      }
    }

    return message.reply("✅ تم إرسال رسالتك للمشرف بنجاح!");
  }
};
