const axios = require("axios");
const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "anisearch", aliases: ["بحث-أنيمي", "anime"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 5, role: 0, shortDescription: { ar: "البحث عن أنيمي" }, category: "ترفيه", guide: { ar: "{pn} [اسم الأنيمي]" } },
  onStart: async function ({ message, args }) {
    if (!args.length) return message.reply("⚠️ يرجى إدخال اسم الأنيمي");
    const query = args.join(" ");
    try {
      const res = await axios.get("https://api.jikan.moe/v4/anime?q=" + encodeURIComponent(query) + "&limit=3");
      const results = res.data?.data || [];
      if (!results.length) return message.reply("❌ لا توجد نتائج لـ: " + query);
      let body = "◈━━━━━━━━━━━━━━━━━━━━◈\n     🎌  نتائج الأنيمي\n◈━━━━━━━━━━━━━━━━━━━━◈\n";
      results.forEach((a, i) => {
        body += "  ❖ " + (i+1) + ". " + (a.title_arabic || a.title) + "\n";
        body += "     النوع: " + (a.type || "غير محدد") + "  |  التقييم: " + (a.score || "غير محدد") + " ⭐\n";
        body += "     الحلقات: " + (a.episodes || "غير معروف") + "\n";
        if (i < results.length - 1) body += "  ─────────────────────\n";
      });
      body += "◈━━━━━━━━━━━━━━━━━━━━◈";
      return message.reply(body);
    } catch(e) { return message.reply("❌ فشل البحث. حاول لاحقاً."); }
  }
};
