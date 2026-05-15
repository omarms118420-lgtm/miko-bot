const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "moon",
    aliases: ["قمر", "mn"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 0,
    shortDescription: { ar: "عرض مرحلة القمر الحالية" },
    longDescription: { ar: "يعرض مرحلة القمر اليوم" },
    category: "أدوات",
    guide: { ar: "{pn}" }
  },

  onStart: async function ({ message }) {
    const phases = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    const phaseIndex = Math.floor((dayOfYear % 30) / 30 * 8);
    const phase = phases[phaseIndex];
    const phaseName = ["محاق", "هلال متصاعد", "تربيع أول", "أحدب متصاعد", "بدر", "أحدب متناقص", "تربيع أخير", "هلال متناقص"][phaseIndex];
    const dateStr = today.toLocaleDateString("ar-SA");
    return message.reply(
      "╔═══════════════════╗\n" +
      "║  🌙 مرحلة القمر  ║\n" +
      "╠═══════════════════╣\n" +
      "║  التاريخ : " + dateStr + "\n" +
      "║  المرحلة : " + phase + " " + phaseName + "\n" +
      "╚═══════════════════╝"
    );
  }
};
