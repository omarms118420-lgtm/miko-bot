const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "td", aliases: ["إلى-اليوم", "today"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 3, role: 0, shortDescription: { ar: "عرض التاريخ والوقت الحالي" }, category: "أدوات", guide: { ar: "{pn}" } },
  onStart: async function ({ message }) {
    const now = new Date();
    const dateAr = now.toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Riyadh" });
    const timeAr = now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Riyadh" });
    return message.reply("╔═══════════════════╗\n║  📅 التاريخ والوقت  ║\n╠═══════════════════╣\n║  📆 التاريخ : " + dateAr + "\n║  🕐 الوقت : " + timeAr + "\n╚═══════════════════╝");
  }
};
