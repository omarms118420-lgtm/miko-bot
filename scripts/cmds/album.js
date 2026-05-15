const axios = require("axios");
const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "album", aliases: ["ألبوم"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 5, role: 0, shortDescription: { ar: "البحث عن ألبوم موسيقي" }, category: "موسيقى", guide: { ar: "{pn} [اسم الفنان/الألبوم]" } },
  onStart: async function ({ message, args }) {
    if (!args.length) return message.reply("⚠️ يرجى إدخال اسم الألبوم أو الفنان");
    const query = args.join(" ");
    return message.reply("🎵 البحث عن: " + query + "\n(تتطلب خدمة موسيقى خارجية)");
  }
};
