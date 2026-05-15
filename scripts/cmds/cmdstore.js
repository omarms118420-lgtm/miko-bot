const axios = require("axios");
const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "cmdstore", aliases: ["متجر-أوامر"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 5, role: 2, shortDescription: { ar: "متجر الأوامر" }, category: "نظام", guide: { ar: "{pn} [اسم الأمر]: البحث عن أمر" } },
  onStart: async function ({ message, args }) {
    if (!args.length) return message.reply("⚠️ يرجى إدخال اسم الأمر للبحث");
    return message.reply("🔍 جاري البحث في متجر الأوامر عن: " + args.join(" ") + "\n(الخدمة قيد الإعداد)");
  }
};
