const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "Overflow", aliases: ["فيضان", "of"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 3, role: 0, shortDescription: { ar: "لعبة ممتعة" }, category: "ألعاب", guide: { ar: "{pn}" } },
  onStart: async function ({ message }) { return message.reply("╔═══════════════════╗\n║  🎮 لعبة Overflow  ║\n╠═══════════════════╣\n║  اللعبة قيد التطوير!\n╚═══════════════════╝"); }
};
