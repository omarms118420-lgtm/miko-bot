const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "call", aliases: ["اتصال"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 30, role: 0, shortDescription: { ar: "إرسال رسالة لمجموعة أخرى" }, category: "أدوات", guide: { ar: "{pn} [آيدي المجموعة] [الرسالة]" } },
  onStart: async function ({ api, message, args, event }) {
    if (args.length < 2) return message.reply("⚠️ الاستخدام: -call [آيدي المجموعة] [الرسالة]");
    const targetID = args[0];
    const content = args.slice(1).join(" ");
    try {
      await api.sendMessage("📞 رسالة من " + event.threadID + ":\n" + content, targetID);
      return message.reply("✅ تم إرسال الرسالة!");
    } catch(e) { return message.reply("❌ فشل الإرسال"); }
  }
};
