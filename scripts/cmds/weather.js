const axios = require("axios");
const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "weather",
    aliases: ["طقس", "wth"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 5,
    role: 0,
    shortDescription: { ar: "عرض حالة الطقس" },
    longDescription: { ar: "يعرض حالة الطقس الحالية والتوقعات للموقع المطلوب" },
    category: "أدوات",
    guide: { ar: "{pn} [المدينة]" }
  },

  onStart: async function ({ message, args }) {
    if (!args[0]) return message.reply("⚠️ يرجى إدخال اسم المدينة");
    const city = args.join(" ");
    try {
      const res = await axios.get(
        "https://wttr.in/" + encodeURIComponent(city) + "?format=j1&lang=ar",
        { timeout: 10000 }
      );
      const d = res.data;
      const cur = d.current_condition?.[0];
      const area = d.nearest_area?.[0];
      const cityName = area?.areaName?.[0]?.value || city;
      const countryName = area?.country?.[0]?.value || "";
      const tempC = cur?.temp_C || "?";
      const feelsC = cur?.FeelsLikeC || "?";
      const humidity = cur?.humidity || "?";
      const windKm = cur?.windspeedKmph || "?";
      const desc = cur?.lang_ar?.[0]?.value || cur?.weatherDesc?.[0]?.value || "غير معروف";
      return message.reply(
        "╔═══════════════════╗\n" +
        "║  ⛅ حالة الطقس  ║\n" +
        "╠═══════════════════╣\n" +
        "║  🌍 المدينة : " + cityName + (countryName ? "، " + countryName : "") + "\n" +
        "║  🌤️ الحالة : " + desc + "\n" +
        "║  🌡️ الحرارة : " + tempC + "°م\n" +
        "║  🌡️ تبدو كـ : " + feelsC + "°م\n" +
        "║  💧 الرطوبة : " + humidity + "%\n" +
        "║  💨 الرياح : " + windKm + " كم/ساعة\n" +
        "╚═══════════════════╝"
      );
    } catch (e) {
      return message.reply("❌ لم يتم العثور على المدينة: " + city + "\nتأكد من كتابة الاسم بالإنجليزية مثل: Riyadh");
    }
  }
};
