const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "notification",
    aliases: ["إشعار", "noti"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 10,
    role: 2,
    shortDescription: { ar: "إرسال إشعار لجميع المجموعات" },
    longDescription: { ar: "يرسل إشعاراً لجميع المجموعات التي يوجد فيها البوت" },
    category: "نظام",
    guide: { ar: "{pn} [الرسالة]" }
  },

  onStart: async function ({ api, message, args, threadsData }) {
    if (!args.length) return message.reply("⚠️ يرجى إدخال محتوى الإشعار");
    const content = args.join(" ");
    const threads = await threadsData.getAll();
    let count = 0;
    await message.reply("⏳ جاري إرسال الإشعار لـ " + threads.length + " مجموعة...");
    for (const thread of threads) {
      try {
        await api.sendMessage(
          "╔═══════════════════╗\n" +
          "║  📢 إشعار من المشرف  ║\n" +
          "╠═══════════════════╣\n" +
          "║  " + content + "\n" +
          "╠═══════════════════╣\n" +
          "╚═══════════════════╝",
          thread.threadID
        );
        count++;
        await new Promise(r => setTimeout(r, global.GoatBot?.configCommands?.envCommands?.notification?.delayPerGroup || 250));
      } catch (e) {}
    }
    return message.reply("✅ تم إرسال الإشعار لـ " + count + " مجموعة بنجاح!");
  }
};
