const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "inbox",
    aliases: ["رسالة-خاصة", "dm"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 5,
    role: 0,
    shortDescription: { ar: "إرسال رسالة خاصة عبر البوت" },
    longDescription: { ar: "يرسل البوت رسالة خاصة لمستخدم محدد" },
    category: "أدوات",
    guide: { ar: "{pn} [الآيدي] [الرسالة]" }
  },

  onStart: async function ({ api, message, args }) {
    if (args.length < 2) return message.reply("⚠️ الاستخدام: -inbox [الآيدي] [الرسالة]");
    const targetID = args[0];
    const content = args.slice(1).join(" ");
    try {
      await api.sendMessage(content, targetID);
      return message.reply("✅ تم إرسال الرسالة الخاصة بنجاح!");
    } catch (e) {
      return message.reply("❌ فشل إرسال الرسالة. تأكد من الآيدي.");
    }
  }
};
