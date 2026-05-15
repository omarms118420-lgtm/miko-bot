const axios = require("axios");
const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "imgur", aliases: ["رفع-صورة"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 10, role: 0, shortDescription: { ar: "رفع صورة على Imgur" }, category: "أدوات", guide: { ar: "أرفق صورة مع الأمر {pn}" } },
  onStart: async function ({ message }) { return message.reply("⚠️ يرجى إرسال الأمر مع صورة مرفقة لرفعها"); }
};
