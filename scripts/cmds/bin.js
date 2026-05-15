const axios = require("axios");
const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "bin", aliases: ["بطاقة-بنك"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 5, role: 0, shortDescription: { ar: "فحص بطاقة البنك" }, category: "أدوات", guide: { ar: "{pn} [الـBIN]" } },
  onStart: async function ({ message, args }) {
    if (!args[0]) return message.reply("⚠️ يرجى إدخال رقم الـ BIN (أول 6 أرقام من رقم البطاقة)");
    const bin = args[0];
    try {
      const res = await axios.get("https://lookup.binlist.net/" + bin);
      const d = res.data;
      return message.reply(
        "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
        "     💳  معلومات البطاقة\n" +
        "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
        "  ❖ رقم BIN   ➜  " + bin + "\n" +
        "  ❖ النوع     ➜  " + (d.type || "غير محدد") + "\n" +
        "  ❖ العلامة   ➜  " + (d.brand || "غير محدد") + "\n" +
        "  ❖ البنك     ➜  " + (d.bank?.name || "غير محدد") + "\n" +
        "  ❖ الدولة    ➜  " + (d.country?.name || "غير محدد") + "\n" +
        "◈━━━━━━━━━━━━━━━━━━━━◈"
      );
    } catch(e) { return message.reply("❌ لا تتوفر معلومات لهذا الـ BIN"); }
  }
};
