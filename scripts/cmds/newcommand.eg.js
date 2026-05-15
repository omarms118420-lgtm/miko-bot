const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "newcommand",
    aliases: ["أمر-جديد"],
    version: "1.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 0,
    shortDescription: { ar: "مثال على إنشاء أمر جديد" },
    longDescription: { ar: "ملف مثال لتوضيح كيفية إنشاء أمر جديد للبوت" },
    category: "نظام",
    guide: { ar: "{pn}" }
  },

  onStart: async function ({ message }) {
    return message.reply(
      "╔═══════════════════╗\n" +
      "║  📝 مثال أمر جديد  ║\n" +
      "╠═══════════════════╣\n" +
      "║  هذا ملف مثال لإنشاء\n" +
      "║  أوامر جديدة للبوت\n" +
      "╠═══════════════════╣\n" +
      "║  👨‍💻 المطوّر : " + DEV_ID + "\n" +
      "╚═══════════════════╝"
    );
  }
};
