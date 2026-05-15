const os = require("os");

const DEV_ID = "61576232405796";
const BOT_NAME = "ميكو";
const startTime = Date.now();

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up", "upt", "وقت"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 5,
    role: 0,
    category: "نظام",
    shortDescription: { ar: "عرض وقت تشغيل البوت ومعلومات النظام" },
    longDescription: { ar: "يعرض وقت التشغيل والذاكرة والمعالج ومعلومات البوت" },
    guide: { ar: "{pn}" }
  },

  onStart: async function ({ api, event, threadsData, usersData }) {
    try {
      const uptimeInMs = Date.now() - startTime;
      const totalSeconds = Math.floor(uptimeInMs / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const uptime = days + " يوم " + hours + " ساعة " + minutes + " دقيقة " + seconds + " ثانية";

      const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
      const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
      const usedMem = (totalMem - freeMem).toFixed(2);
      const ramUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
      const cpuModel = os.cpus()[0]?.model || "غير معروف";

      const now = new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });

      const pingStart = Date.now();
      await api.sendMessage("⏳ جاري تحميل معلومات النظام...", event.threadID);
      const ping = Date.now() - pingStart;

      let allUsers = [], allThreads = [];
      try { allUsers = await usersData.getAll(); } catch (e) {}
      try { allThreads = await threadsData.getAll(); } catch (e) {}

      const info =
        "╔═══════════════════╗\n" +
        "║  ⚙️ معلومات النظام  ║\n" +
        "╠═══════════════════╣\n" +
        "║  🤖 الاسم : " + BOT_NAME + "\n" +
        "║  🟢 وقت التشغيل : " + uptime + "\n" +
        "║  📅 الوقت : " + now + "\n" +
        "║  📡 البينج : " + ping + "ms\n" +
        "╠═══════════════════╣\n" +
        "║  💻 المعالج : " + cpuModel.substring(0, 25) + "\n" +
        "║  📊 الذاكرة المستخدمة : " + ramUsage + " MB\n" +
        "║  💾 الذاكرة : " + usedMem + " GB / " + totalMem + " GB\n" +
        "╠═══════════════════╣\n" +
        "║  👥 المستخدمون : " + allUsers.length + "\n" +
        "║  💬 المجموعات : " + allThreads.length + "\n" +
        "╚═══════════════════╝";

      await api.sendMessage(info, event.threadID);

    } catch (err) {
      console.error("خطأ في uptime.js:", err);
      return api.sendMessage("⚠️ حدث خطأ أثناء عرض معلومات النظام.", event.threadID);
    }
  }
};
