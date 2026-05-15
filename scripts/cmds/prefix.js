const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "prefix",
    aliases: ["البادئة"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 1,
    shortDescription: { ar: "تغيير أو عرض البادئة" },
    longDescription: { ar: "يعرض أو يغير البادئة الخاصة بالمجموعة" },
    category: "إدارة",
    guide: { ar: "{pn}: عرض البادئة الحالية\n{pn} [رمز جديد]: تغيير البادئة" }
  },

  onStart: async function ({ message, event, args, threadsData }) {
    const currentPrefix = global.GoatBot.config?.prefix || "-";
    if (!args[0]) {
      return message.reply(
        "╔═══════════════════╗\n" +
        "║  🔑 معلومات البادئة  ║\n" +
        "╠═══════════════════╣\n" +
        "║  البادئة الحالية : " + currentPrefix + "\n" +
        "╚═══════════════════╝"
      );
    }
    const newPrefix = args[0];
    await threadsData.set(event.threadID, { prefix: newPrefix });
    return message.reply("✅ تم تغيير البادئة إلى : " + newPrefix);
  }
};
