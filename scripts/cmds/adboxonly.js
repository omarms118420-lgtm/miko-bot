const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "adboxonly", aliases: ["مشرف-مجموعة-فقط"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 3, role: 1, shortDescription: { ar: "تفعيل/إيقاف وضع مشرفي المجموعة فقط" }, category: "إدارة", guide: { ar: "{pn} on/off" } },
  onStart: async function ({ message, args, event, threadsData }) {
    const type = (args[0] || "").toLowerCase();
    if (type === "on" || type === "تفعيل") { await threadsData.set(event.threadID, { adBoxOnly: true }); return message.reply("✅ تم تفعيل: مشرفو المجموعة فقط يمكنهم استخدام البوت"); }
    if (type === "off" || type === "إيقاف") { await threadsData.set(event.threadID, { adBoxOnly: false }); return message.reply("✅ تم إيقاف وضع مشرفي المجموعة فقط"); }
    return message.reply("⚠️ الاستخدام: -adboxonly on أو -adboxonly off");
  }
};
