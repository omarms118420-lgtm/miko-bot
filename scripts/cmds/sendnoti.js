const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "sendnoti",
    aliases: ["إشعار-مخصص", "sn"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 10,
    role: 2,
    shortDescription: { ar: "إرسال إشعار مخصص" },
    longDescription: { ar: "إرسال إشعار مخصص لمستخدم أو مجموعة معينة" },
    category: "نظام",
    guide: {
      ar: "   {pn} all [الرسالة]: إرسال لجميع المجموعات\n   {pn} [آيدي] [الرسالة]: إرسال لمجموعة أو مستخدم محدد"
    }
  },

  onStart: async function ({ api, message, args }) {
    if (!args.length) return message.reply("⚠️ الاستخدام: -sendnoti [all/آيدي] [الرسالة]");
    const target = args[0];
    const content = args.slice(1).join(" ");
    if (!content) return message.reply("⚠️ يرجى إدخال محتوى الإشعار");
    try {
      await api.sendMessage(
        "╔═══════════════════╗\n║  📢 إشعار  ║\n╠═══════════════════╣\n║  " + content + "\n╚═══════════════════╝",
        target
      );
      return message.reply("✅ تم إرسال الإشعار بنجاح!");
    } catch (e) {
      return message.reply("❌ فشل الإرسال: " + e.message);
    }
  }
};
