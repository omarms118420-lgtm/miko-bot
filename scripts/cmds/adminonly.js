const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "adminonly",
    aliases: ["مشرفين-فقط", "adonly"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 1,
    shortDescription: { ar: "تفعيل/إيقاف وضع المشرفين فقط" },
    longDescription: { ar: "يحدد ما إذا كان البوت يستجيب فقط لأوامر المشرفين في المجموعة" },
    category: "إدارة",
    guide: { ar: "{pn} on: تفعيل\n{pn} off: إيقاف" }
  },

  onStart: async function ({ message, args, event, threadsData }) {
    const type = (args[0] || "").toLowerCase();
    if (type === "on" || type === "تفعيل") {
      await threadsData.set(event.threadID, { adminOnly: true });
      return message.reply("✅ تم تفعيل وضع المشرفين فقط في هذه المجموعة");
    }
    if (type === "off" || type === "إيقاف") {
      await threadsData.set(event.threadID, { adminOnly: false });
      return message.reply("✅ تم إيقاف وضع المشرفين فقط في هذه المجموعة");
    }
    return message.reply("⚠️ الاستخدام: -adminonly on أو -adminonly off");
  }
};
