const moment = require("moment-timezone");
const axios = require("axios");

const DEV_ID = "61576232405796";
const BOT_NAME = "ميكو";

module.exports = {
  config: {
    name: "info",
    aliases: ["معلومات", "inf", "in4"],
    version: "3.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 5,
    role: 0,
    shortDescription: { ar: "معلومات البوت والمطوّر" },
    longDescription: { ar: "يعرض معلومات تفصيلية عن البوت والمطوّر مع فيديو" },
    category: "معلومات",
    guide: { ar: "{pn}" }
  },

  onStart: async function ({ message }) {
    await this.sendInfo(message);
  },

  onChat: async function ({ event, message }) {
    const text = (event.body || "").toLowerCase().trim();
    if (text === "info" || text === "معلومات" || text === "inf") {
      await this.sendInfo(message);
    }
  },

  sendInfo: async function (message) {
    const devFB = "fb.com/profile/" + DEV_ID;

    const now = moment().tz("Asia/Riyadh");
    const time = now.format("h:mm:ss A");
    const date = now.format("DD/MM/YYYY");

    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    const uptimeStr = h + "س " + m + "د " + s + "ث";

    const videoUrl = "https://files.catbox.moe/lphsv4.mp4";

    const body =
      "╔═══════════════════╗\n" +
      "║  🤖 بوت " + BOT_NAME + " 🌸  ║\n" +
      "╠═══════════════════╣\n" +
      "║  👨‍💻 معلومات المطوّر\n" +
      "║  ╰➤ الفيسبوك : " + devFB + "\n" +
      "║  ╰➤ الآيدي : " + DEV_ID + "\n" +
      "╠═══════════════════╣\n" +
      "║  🤖 معلومات البوت\n" +
      "║  ╰➤ الاسم : " + BOT_NAME + "\n" +
      "║  ╰➤ الوقت : " + time + "\n" +
      "║  ╰➤ التاريخ : " + date + "\n" +
      "║  ╰➤ وقت التشغيل : " + uptimeStr + "\n" +
      "║  ╰➤ الحالة : ✅ يعمل\n" +
      "╚═══════════════════╝\n" +
      "\n🌸 قد لا أكون مثالياً، لكنني دائماً هنا لك 🌸";

    try {
      const response = await axios.get(videoUrl, { responseType: "stream" });
      await message.reply({ body, attachment: response.data });
    } catch (err) {
      await message.reply(body);
    }
  }
};
