const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "setrankup", aliases: ["إعداد-ترقية"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 3, role: 1, shortDescription: { ar: "تخصيص رسالة الترقية" }, category: "معلومات", guide: { ar: "{pn} text [النص]: تعيين رسالة الترقية\n{pn} reset: إعادة التعيين\n{pn} on/off: تفعيل/إيقاف" } },
  onStart: async function ({ message, args, event, threadsData }) {
    const type = (args[0] || "").toLowerCase();
    if (type === "text") { const content = args.slice(1).join(" "); if (!content) return message.reply("⚠️ يرجى إدخال النص"); await threadsData.set(event.threadID, { rankUpMsg: content }); return message.reply("✅ تم تعيين رسالة الترقية: " + content); }
    if (type === "reset") { await threadsData.set(event.threadID, { rankUpMsg: "" }); return message.reply("✅ تمت إعادة تعيين رسالة الترقية"); }
    if (type === "on") { await threadsData.set(event.threadID, { rankUpEnabled: true }); return message.reply("✅ تم تفعيل رسائل الترقية"); }
    if (type === "off") { await threadsData.set(event.threadID, { rankUpEnabled: false }); return message.reply("✅ تم إيقاف رسائل الترقية"); }
    return message.reply("⚠️ الاستخدام: -setrankup text/reset/on/off");
  }
};
