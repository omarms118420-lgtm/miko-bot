const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "emojimean",
    aliases: ["معنى-إيموجي", "emean"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 0,
    shortDescription: { ar: "معنى الإيموجي" },
    longDescription: { ar: "يشرح معنى الإيموجي المذكور" },
    category: "ترفيه",
    guide: { ar: "{pn} [إيموجي]\nمثال: -emojimean 😂" }
  },

  onStart: async function ({ message, args }) {
    if (!args[0]) return message.reply("⚠️ يرجى إدخال إيموجي");
    const emoji = args[0];
    const codePoint = emoji.codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0");
    return message.reply(
      "╔═══════════════════╗\n" +
      "║  😊 معنى الإيموجي  ║\n" +
      "╠═══════════════════╣\n" +
      "║  الإيموجي : " + emoji + "\n" +
      "║  الكود : U+" + (codePoint || "N/A") + "\n" +
      "╚═══════════════════╝"
    );
  }
};
