const axios = require("axios");
const DEV_ID = "61576232405796";

// مدن الخليج الشائعة
const CITIES = {
  "رياض": { city: "Riyadh", country: "SA", tz: "Asia/Riyadh" },
  "جدة": { city: "Jeddah", country: "SA", tz: "Asia/Riyadh" },
  "مكة": { city: "Mecca", country: "SA", tz: "Asia/Riyadh" },
  "الرياض": { city: "Riyadh", country: "SA", tz: "Asia/Riyadh" },
  "دبي": { city: "Dubai", country: "AE", tz: "Asia/Dubai" },
  "أبوظبي": { city: "Abu Dhabi", country: "AE", tz: "Asia/Dubai" },
  "الكويت": { city: "Kuwait City", country: "KW", tz: "Asia/Kuwait" },
  "الدوحة": { city: "Doha", country: "QA", tz: "Asia/Qatar" },
  "بغداد": { city: "Baghdad", country: "IQ", tz: "Asia/Baghdad" },
  "القاهرة": { city: "Cairo", country: "EG", tz: "Africa/Cairo" },
  "عمان": { city: "Amman", country: "JO", tz: "Asia/Amman" },
  "بيروت": { city: "Beirut", country: "LB", tz: "Asia/Beirut" },
};

function getNow(tz = "Asia/Riyadh") {
  return new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
}

function formatTime(date) {
  let h = date.getHours(), m = date.getMinutes();
  const ampm = h >= 12 ? "م" : "ص";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getSleepAdvice(now) {
  const h = now.getHours();
  if (h >= 22 || h < 1) return { emoji: "😴", msg: "وقت النوم المثالي — نم الآن لتستيقظ نشيطاً", status: "ideal" };
  if (h >= 1 && h < 5) return { emoji: "⚠️", msg: "نمت متأخراً! حاول النوم الآن ولو لبضع ساعات", status: "late" };
  if (h >= 5 && h < 8) return { emoji: "🌅", msg: "الفجر — إذا لم تنم، يمكنك قيلولة قصيرة", status: "dawn" };
  if (h >= 13 && h < 15) return { emoji: "💤", msg: "وقت القيلولة المثالي (20-30 دقيقة)", status: "nap" };
  return { emoji: "✅", msg: "ساعات اليقظة — كن منتجاً!", status: "awake" };
}

function getMealAdvice(now) {
  const h = now.getHours();
  const meals = [];
  if (h >= 6 && h < 10) meals.push("🍳 وقت الإفطار الآن!");
  else if (h >= 10 && h < 12) meals.push("🍌 وقت وجبة خفيفة صباحية");
  else if (h >= 12 && h < 14) meals.push("🍽️ وقت الغداء الآن!");
  else if (h >= 15 && h < 17) meals.push("☕ وقت وجبة خفيفة عصرية");
  else if (h >= 19 && h < 21) meals.push("🌙 وقت العشاء الآن!");
  else if (h >= 21 || h < 6) meals.push("🚫 تجنب الأكل الثقيل في هذا الوقت");
  else meals.push("⏰ الوجبة القادمة قريباً");
  return meals[0];
}

module.exports = {
  config: {
    name: "جدول",
    aliases: ["schedule", "جدولي", "prayer", "صلاة", "مواعيد"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 5,
    role: 0,
    shortDescription: { ar: "الوقت ومواعيد الصلاة والنوم والطعام" },
    longDescription: { ar: "يعرض الوقت الحالي ومواعيد الصلاة والنوم والطعام لمدينتك" },
    category: "مساعد",
    guide: { ar: "{pn} — الرياض افتراضياً\n{pn} [المدينة] — مثال: جدول دبي" }
  },

  onStart: async function ({ message, args }) {
    const cityInput = args[0] || "الرياض";
    const cityData = CITIES[cityInput] || CITIES["الرياض"];
    const cityName = args[0] || "الرياض";

    const now = getNow(cityData.tz);
    const timeStr = formatTime(now);
    const sleep = getSleepAdvice(now);
    const meal = getMealAdvice(now);

    const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const dayName = days[now.getDay()];
    const dateStr = now.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric", timeZone: cityData.tz });

    await message.reply("⏳ جاري جلب مواعيد الصلاة...");

    let prayerMsg = "";
    try {
      const today = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
      const r = await axios.get("https://api.aladhan.com/v1/timingsByCity", {
        params: {
          city: cityData.city,
          country: cityData.country,
          method: 4,
          date: today
        },
        timeout: 10000
      });

      const t = r.data?.data?.timings;
      if (t) {
        // تحويل الأوقات إلى عربي
        const toArabic = (time) => {
          const [hStr, mStr] = time.split(":");
          let h = parseInt(hStr), m = parseInt(mStr);
          const ampm = h >= 12 ? "م" : "ص";
          h = h % 12 || 12;
          return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
        };

        // تحديد الصلاة القادمة
        const prayerList = [
          { name: "الفجر  🌙", time: t.Fajr, hour: parseInt(t.Fajr) },
          { name: "الشروق ☀️", time: t.Sunrise, hour: parseInt(t.Sunrise) },
          { name: "الظهر  🌤️", time: t.Dhuhr, hour: parseInt(t.Dhuhr) },
          { name: "العصر  🌅", time: t.Asr, hour: parseInt(t.Asr) },
          { name: "المغرب 🌆", time: t.Maghrib, hour: parseInt(t.Maghrib) },
          { name: "العشاء 🌃", time: t.Isha, hour: parseInt(t.Isha) }
        ];

        const nowMins = now.getHours() * 60 + now.getMinutes();
        let nextPrayer = null;
        for (const p of prayerList) {
          const [ph, pm] = p.time.split(":").map(Number);
          const pMins = ph * 60 + pm;
          if (pMins > nowMins) {
            nextPrayer = p.name.trim().split(" ")[0];
            break;
          }
        }

        prayerMsg =
          "╠══════════════════════╣\n" +
          "║      🕌 مواعيد الصلاة\n" +
          "╠══════════════════════╣\n" +
          prayerList.map(p => `║  ${p.name}  ➜  ${toArabic(p.time)}`).join("\n") + "\n" +
          (nextPrayer ? `╠══════════════════════╣\n║  ⏭️ القادمة: صلاة ${nextPrayer}\n` : "");
      }
    } catch (e) {
      prayerMsg = "╠══════════════════════╣\n║  🕌 لم يتم جلب مواعيد الصلاة\n";
    }

    const finalMsg =
      "╔══════════════════════╗\n" +
      "║   🌸 ميكو — جدولك اليومي\n" +
      "╠══════════════════════╣\n" +
      `║  📍 المدينة: ${cityName}\n` +
      `║  📅 ${dayName} — ${dateStr}\n` +
      `║  🕐 الوقت: ${timeStr}\n` +
      prayerMsg +
      "╠══════════════════════╣\n" +
      "║      🍽️ مواعيد الطعام\n" +
      "╠══════════════════════╣\n" +
      `║  🌅 الإفطار   ➜  6:00 - 9:00 ص\n` +
      `║  ☀️ الغداء    ➜  12:00 - 2:00 م\n` +
      `║  🌤️ وجبة خفيفة ➜  3:00 - 5:00 م\n` +
      `║  🌙 العشاء    ➜  7:00 - 9:00 م\n` +
      `║  \n` +
      `║  ${meal}\n` +
      "╠══════════════════════╣\n" +
      "║      😴 جدول النوم\n" +
      "╠══════════════════════╣\n" +
      `║  💤 نوم مثالي ➜  10:00 م - 11:00 م\n` +
      `║  ⏰ استيقاظ  ➜  5:30 ص - 6:30 ص\n` +
      `║  💫 قيلولة   ➜  1:30 م - 2:00 م\n` +
      `║  \n` +
      `║  ${sleep.emoji} ${sleep.msg}\n` +
      "╚══════════════════════╝";

    return message.reply(finalMsg);
  }
};
