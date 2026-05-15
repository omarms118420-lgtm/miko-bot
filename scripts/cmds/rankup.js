const DEV_ID = "61576232405796";
module.exports = {
  config: {
    name: "rankup",
    aliases: ["رفع-رتبة", "rup"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 1,
    shortDescription: { ar: "إعداد نظام الترقية التلقائي" },
    longDescription: { ar: "تفعيل أو إيقاف نظام إشعارات الترقية عند ارتفاع المستوى" },
    category: "معلومات",
    guide: { ar: "{pn} تفعيل — تشغيل النظام\n{pn} إيقاف — إيقاف النظام\n{pn} حالة — عرض الإعدادات" }
  },
  onStart: async function ({ message, args, event, threadsData }) {
    const type = (args[0] || "").toLowerCase().trim();
    if (type === "on" || type === "تفعيل") {
      await threadsData.set(event.threadID, { rankUpEnabled: true });
      return message.reply("✅ تم تفعيل نظام الترقية التلقائي");
    }
    if (type === "off" || type === "إيقاف") {
      await threadsData.set(event.threadID, { rankUpEnabled: false });
      return message.reply("✅ تم إيقاف نظام الترقية التلقائي");
    }
    if (type === "view" || type === "حالة") {
      const data = await threadsData.get(event.threadID);
      return message.reply(
        "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
        "     ⭐  نظام الترقية\n" +
        "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
        "  ❖ الحالة  ➜  " + (data?.rankUpEnabled ? "مفعّل ✅" : "موقوف ❌") + "\n" +
        "◈━━━━━━━━━━━━━━━━━━━━◈"
      );
    }
    return message.reply("⚠️ الاستخدام: -rankup تفعيل / إيقاف / حالة");
  }
};
