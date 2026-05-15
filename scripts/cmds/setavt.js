const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "setavt", aliases: ["تعيين-صورة", "setpfp"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 10, role: 1, shortDescription: { ar: "تعيين صورة للمجموعة" }, category: "مجموعة", guide: { ar: "أرسل الأمر مع صورة مرفقة: {pn}" } },
  onStart: async function ({ api, message, event }) {
    const attachment = event.attachments?.[0];
    if (!attachment?.url) return message.reply("⚠️ يرجى إرفاق صورة مع الأمر");
    try { const axios = require("axios"); const res = await axios.get(attachment.url, { responseType: "stream" }); await api.changeGroupImage(res.data, event.threadID); return message.reply("✅ تم تغيير صورة المجموعة بنجاح!"); } catch(e) { return message.reply("❌ فشل تغيير صورة المجموعة"); }
  }
};
