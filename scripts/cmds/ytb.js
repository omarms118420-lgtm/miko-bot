const axios = require("axios");
const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "ytb",
    aliases: ["يوتيوب", "youtube", "yt"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 10,
    role: 0,
    shortDescription: { ar: "تنزيل أو معلومات من يوتيوب" },
    longDescription: { ar: "تنزيل فيديو أو صوت أو عرض معلومات من يوتيوب" },
    category: "موسيقى",
    guide: {
      ar: "  {pn} فيديو [الاسم/الرابط]: تنزيل فيديو\n  {pn} صوت [الاسم/الرابط]: تنزيل صوت\n  {pn} معلومات [الاسم/الرابط]: معلومات الفيديو"
    }
  },

  onStart: async function ({ message, args }) {
    const type = (args[0] || "").toLowerCase();
    const query = args.slice(1).join(" ");
    if (!type || !query) return message.reply(
      "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
      "     🎬  تنزيل يوتيوب\n" +
      "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
      "  ❖ -ytb فيديو [اسم]\n" +
      "  ❖ -ytb صوت [اسم]\n" +
      "  ❖ -ytb معلومات [اسم]\n" +
      "◈━━━━━━━━━━━━━━━━━━━━◈"
    );
    await message.reply("⏳ جاري البحث عن: " + query + " ...");
    try {
      const res = await axios.get("https://yt-search-api.vercel.app/api/search?q=" + encodeURIComponent(query));
      const results = res.data?.items || [];
      if (!results.length) return message.reply("❌ لا توجد نتائج لـ: " + query);
      const first = results[0];
      if (type === "info" || type === "معلومات") {
        return message.reply(
          "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
          "     📺  معلومات الفيديو\n" +
          "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
          "  ❖ العنوان    ➜  " + first.title + "\n" +
          "  ❖ المدة      ➜  " + (first.duration || "غير معروف") + "\n" +
          "  ❖ المشاهدات  ➜  " + (first.views || "غير معروف") + "\n" +
          "  ❖ الرابط     ➜  " + (first.url || "غير متوفر") + "\n" +
          "◈━━━━━━━━━━━━━━━━━━━━◈"
        );
      }
      return message.reply(
        "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
        "     🎵  نتيجة البحث\n" +
        "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
        "  ❖ العنوان  ➜  " + first.title + "\n" +
        "  ❖ الرابط   ➜  " + (first.url || "غير متوفر") + "\n" +
        "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
        "  ⚠️ خدمة التنزيل تتطلب إعداداً إضافياً\n" +
        "  يمكنك نسخ الرابط أعلاه للتنزيل\n" +
        "◈━━━━━━━━━━━━━━━━━━━━◈"
      );
    } catch (e) {
      return message.reply("❌ فشل الاتصال بيوتيوب. حاول لاحقاً.");
    }
  }
};
