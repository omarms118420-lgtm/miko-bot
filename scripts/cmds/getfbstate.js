const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "getfbstate", aliases: ["احصل-كوكي"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 10, role: 2, shortDescription: { ar: "الحصول على fbstate الحالي" }, category: "نظام", guide: { ar: "{pn}" } },
  onStart: async function ({ api, message, event }) {
    try {
      const appState = api.getAppState();
      await api.sendMessage("🔐 fbstate الحالي:\n" + JSON.stringify(appState).substring(0, 1000) + "...", event.senderID);
      return message.reply("✅ تم إرسال fbstate إلى رسالتك الخاصة!");
    } catch(e) { return message.reply("❌ فشل الحصول على fbstate"); }
  }
};
