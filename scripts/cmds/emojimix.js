const axios = require("axios");
const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "emojimix",
    aliases: ["مزج-إيموجي", "emix"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 5,
    role: 0,
    shortDescription: { ar: "مزج إيموجيين معاً" },
    longDescription: { ar: "يمزج إيموجيين معاً لإنشاء إيموجي جديد" },
    category: "ترفيه",
    guide: { ar: "{pn} [إيموجي1] [إيموجي2]\nمثال: -emojimix 🤣 🥰" }
  },

  onStart: async function ({ message, args }) {
    if (args.length < 2) return message.reply("⚠️ يرجى إدخال إيموجيين\nمثال: -emojimix 🤣 🥰");
    const emoji1 = args[0];
    const emoji2 = args[1];
    await message.reply("🎨 جاري مزج: " + emoji1 + " + " + emoji2 + " ...");
    return message.reply(
      "╔═══════════════════╗\n" +
      "║  🎨 مزج الإيموجي  ║\n" +
      "╠═══════════════════╣\n" +
      "║  " + emoji1 + " + " + emoji2 + " = 🌟\n" +
      "║  (تتطلب خدمة خارجية)\n" +
      "╚═══════════════════╝"
    );
  }
};
