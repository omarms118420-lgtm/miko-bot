const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "rank",
    aliases: ["رتبة", "rnk", "level"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 5,
    role: 0,
    shortDescription: { ar: "عرض رتبتك أو رتبة شخص آخر" },
    longDescription: { ar: "يعرض رتبة المستخدم ومستواه وخبرته في المجموعة" },
    category: "معلومات",
    guide: {
      ar: "   {pn}: عرض رتبتك\n   {pn} @ذكر: عرض رتبة الشخص المذكور"
    }
  },

  onStart: async function ({ message, event, usersData }) {
    const mentioned = Object.keys(event.mentions || {});
    const uid = mentioned.length > 0 ? mentioned[0] : event.senderID;
    const name = mentioned.length > 0 ? event.mentions[mentioned[0]] : "أنت";
    const data = await usersData.get(uid);
    const exp = data?.exp || 0;
    const level = Math.floor(exp / 100) + 1;
    const nextLevel = level * 100;
    const progress = Math.floor((exp % 100) / 100 * 10);
    const bar = "█".repeat(progress) + "░".repeat(10 - progress);
    return message.reply(
      "╔═══════════════════╗\n" +
      "║  🏆 بطاقة الرتبة  ║\n" +
      "╠═══════════════════╣\n" +
      "║  👤 الاسم : " + name + "\n" +
      "║  ⭐ المستوى : " + level + "\n" +
      "║  💫 الخبرة : " + exp + " / " + nextLevel + "\n" +
      "║  📊 التقدم : [" + bar + "]\n" +
      "╚═══════════════════╝"
    );
  }
};
