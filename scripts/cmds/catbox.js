const axios = require("axios");
const FormData = require("form-data");
const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "catbox", aliases: ["رفع-ملف"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 10, role: 0, shortDescription: { ar: "رفع ملف على catbox.moe" }, category: "أدوات", guide: { ar: "أرفق ملفاً مع الأمر {pn}" } },
  onStart: async function ({ message, event }) {
    return message.reply("⚠️ يرجى إرسال الأمر مع ملف مرفق لرفعه");
  }
};
