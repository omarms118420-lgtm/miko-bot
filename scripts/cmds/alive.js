const fs = require("fs-extra");
const axios = require("axios");

const BOT_NAME = "ميكو";

module.exports = {
  config: {
    name: "alive",
    aliases: ["حي", "نشط"],
    version: "3.0",
    author: BOT_NAME,
    shortDescription: { ar: "التحقق من أن البوت يعمل" },
    longDescription: { ar: "يرد بحالة البوت مع معلومات التشغيل" },
    category: "alive",
    guide: { ar: "{pn}" },
    usePrefix: true
  },

  onStart: async ({ message }) => sendAlive(message),

  onChat: async ({ event, message }) => {
    const text = (event.body || "").toLowerCase().trim();
    if (text === "alive" || text === "حي" || text === "نشط") {
      await sendAlive(message);
    }
  }
};

async function sendAlive(message) {
  const uptime = process.uptime();
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);
  const uptimeStr = `${h} ساعة ${m} دقيقة ${s} ثانية`;
  const now = new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });

  const body =
    `╔═══════════════════╗\n` +
    `║  💚 بوت ${BOT_NAME} نشط! 💚  ║\n` +
    `╠═══════════════════╣\n` +
    `║  🤖 الاسم : ${BOT_NAME}\n` +
    `║  ✅ الحالة : يعمل بكفاءة\n` +
    `║  ⏱️ وقت التشغيل : ${uptimeStr}\n` +
    `║  🕐 الوقت الحالي : ${now}\n` +
    `╠═══════════════════╣\n` +
    `║  🌸 أنا هنا دائماً لخدمتك! 🌸\n` +
    `╚═══════════════════╝`;

  try {
    const voiceUrl = "https://files.catbox.moe/fq5vsd.mp3";
    const voicePath = `/tmp/alive_${Date.now()}.mp3`;
    const res = await axios({ method: "GET", url: voiceUrl, responseType: "stream", timeout: 8000 });
    const writer = res.data.pipe(fs.createWriteStream(voicePath));
    writer.on("finish", async () => {
      try {
        await message.reply({ body, attachment: fs.createReadStream(voicePath) });
      } catch (e) {
        await message.reply(body);
      } finally {
        try { fs.unlinkSync(voicePath); } catch (e) {}
      }
    });
    writer.on("error", async () => await message.reply(body));
  } catch (err) {
    await message.reply(body);
  }
}
