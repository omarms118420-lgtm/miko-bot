const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "badwords", aliases: ["كلمات-محظورة", "bw"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 3, role: 1, shortDescription: { ar: "إدارة الكلمات المحظورة" }, category: "إدارة", guide: { ar: "{pn} add [كلمات]: إضافة\n{pn} delete [كلمات]: حذف\n{pn} list: العرض\n{pn} on/off: تفعيل/إيقاف" } },
  onStart: async function ({ message, args, event, threadsData }) {
    const type = (args[0] || "").toLowerCase();
    const data = await threadsData.get(event.threadID);
    const wordList = data?.badWords || [];
    if (type === "add" || type === "إضافة") {
      const words = args.slice(1).join(" ").split(/[,|،]/);
      const trimmed = words.map(w => w.trim()).filter(w => w.length >= 2);
      if (!trimmed.length) return message.reply("⚠️ يرجى إدخال كلمات صالحة (حرفان على الأقل)");
      const newList = [...new Set([...wordList, ...trimmed])];
      await threadsData.set(event.threadID, { badWords: newList });
      return message.reply("✅ تم إضافة " + trimmed.length + " كلمة محظورة");
    }
    if (type === "delete" || type === "حذف") {
      const words = args.slice(1).join(" ").split(/[,|،]/);
      const toDelete = words.map(w => w.trim());
      const newList = wordList.filter(w => !toDelete.includes(w));
      await threadsData.set(event.threadID, { badWords: newList });
      return message.reply("✅ تم حذف الكلمات المحظورة");
    }
    if (type === "list" || type === "قائمة") {
      if (!wordList.length) return message.reply("⚠️ لا توجد كلمات محظورة في هذه المجموعة");
      return message.reply("╔═══════════════════╗\n║  🚫 الكلمات المحظورة  ║\n╠═══════════════════╣\n║  " + wordList.join("، ") + "\n╚═══════════════════╝");
    }
    if (type === "on") { await threadsData.set(event.threadID, { badWordsEnabled: true }); return message.reply("✅ تم تفعيل نظام الكلمات المحظورة"); }
    if (type === "off") { await threadsData.set(event.threadID, { badWordsEnabled: false }); return message.reply("✅ تم إيقاف نظام الكلمات المحظورة"); }
    return message.reply("⚠️ الاستخدام: -badwords add/delete/list/on/off");
  }
};
