const DEV_ID = "61576232405796";
const BOT_NAME = "ميكو";

module.exports = {
  config: {
    name: "tid",
    aliases: ["gid", "آيدي-مجموعة"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 0,
    shortDescription: { ar: "عرض آيدي المجموعة" },
    longDescription: { ar: "يعرض آيدي المجموعة الحالية" },
    category: "معلومات",
    guide: { ar: "{pn}" }
  },

  onStart: async function ({ message, event }) {
    return message.reply(
      "╔═══════════════════╗\n" +
      "║  💬 آيدي المجموعة  ║\n" +
      "╠═══════════════════╣\n" +
      "║  ╰➤ الآيدي : " + event.threadID + "\n" +
      "╚═══════════════════╝"
    );
  }
};
