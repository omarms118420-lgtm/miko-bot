const axios = require("axios");
const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "appstore",
    aliases: ["متجر", "apps"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 5,
    role: 0,
    shortDescription: { ar: "البحث في متجر التطبيقات" },
    longDescription: { ar: "يبحث عن تطبيق في متجر App Store" },
    category: "أدوات",
    guide: { ar: "{pn} [اسم التطبيق]" }
  },

  onStart: async function ({ message, args }) {
    if (!args.length) return message.reply("⚠️ يرجى إدخال اسم التطبيق");
    const keyword = args.join(" ");
    await message.reply("🔍 جاري البحث عن: " + keyword + " ...");
    try {
      const res = await axios.get(
        "https://itunes.apple.com/search?term=" + encodeURIComponent(keyword) + "&media=software&limit=3"
      );
      const results = res.data?.results || [];
      if (!results.length) return message.reply("❌ لا توجد نتائج لـ: " + keyword);
      let body = "╔═══════════════════╗\n║  📱 نتائج App Store  ║\n╠═══════════════════╣\n";
      results.forEach((app, i) => {
        body += "║  " + (i + 1) + ". " + app.trackName + "\n";
        body += "║     المطور: " + app.artistName + "\n";
        body += "║     التقييم: " + (app.averageUserRating?.toFixed(1) || "N/A") + " ⭐\n";
        if (i < results.length - 1) body += "╠═══════════════════╣\n";
      });
      body += "╚═══════════════════╝";
      return message.reply(body);
    } catch (e) {
      return message.reply("❌ فشل الاتصال بمتجر التطبيقات");
    }
  }
};
