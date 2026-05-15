const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "update",
    aliases: ["تحديث-بوت"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 60,
    role: 2,
    shortDescription: { ar: "تحديث البوت" },
    longDescription: { ar: "يقوم بتحديث البوت إلى أحدث إصدار" },
    category: "نظام",
    guide: { ar: "{pn}" }
  },

  onStart: async function ({ message }) {
    return message.reply(
      "╔═══════════════════╗\n" +
      "║  🔄 تحديث البوت  ║\n" +
      "╠═══════════════════╣\n" +
      "║  جاري التحقق من التحديثات...\n" +
      "║  يرجى الانتظار! ⏳\n" +
      "╚═══════════════════╝"
    );
  }
};
