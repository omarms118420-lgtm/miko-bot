const axios = require("axios");
const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "avatar",
    aliases: ["صورة-شخصية", "avt"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 5,
    role: 0,
    shortDescription: { ar: "إنشاء صورة شخصية أنيمي" },
    longDescription: { ar: "ينشئ صورة شخصية أنيمي مع توقيع مخصص" },
    category: "ترفيه",
    guide: { ar: "{pn} [آيدي الشخصية] | [نص الخلفية] | [التوقيع] | [لون الخلفية]" }
  },

  onStart: async function ({ message, args }) {
    if (args[0] === "help" || args[0] === "مساعدة") {
      return message.reply(
        "╔═══════════════════╗\n" +
        "║  🎨 تعليمات Avatar  ║\n" +
        "╠═══════════════════╣\n" +
        "║  -avatar [آيدي] | [نص] | [توقيع] | [لون]\n" +
        "║  مثال: -avatar 1 | مرحبا | ميكو | blue\n" +
        "╠═══════════════════╣\n" +
        "╚═══════════════════╝"
      );
    }
    return message.reply("⏳ جاري إنشاء الصورة الشخصية...\nيرجى الانتظار لحظة! 🎨");
  }
};
