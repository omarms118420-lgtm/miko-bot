const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "autosetname", aliases: ["اسم-تلقائي"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 3, role: 1, shortDescription: { ar: "تغيير لقب الأعضاء الجدد تلقائياً" }, category: "مجموعة", guide: { ar: "{pn} set [اللقب]: {userName} = اسم العضو\n{pn} on/off\n{pn} view" } },
  onStart: async function ({ message, args, event, threadsData }) {
    const type = (args[0] || "").toLowerCase();
    if (type === "set") { const config = args.slice(1).join(" "); if (!config) return message.reply("⚠️ يرجى إدخال اللقب"); await threadsData.set(event.threadID, { autoSetName: config }); return message.reply("✅ تم تعيين اللقب التلقائي: " + config); }
    if (type === "on") { await threadsData.set(event.threadID, { autoSetNameEnabled: true }); return message.reply("✅ تم تفعيل الاسم التلقائي"); }
    if (type === "off") { await threadsData.set(event.threadID, { autoSetNameEnabled: false }); return message.reply("✅ تم إيقاف الاسم التلقائي"); }
    if (type === "view") { const data = await threadsData.get(event.threadID); return message.reply("الاسم التلقائي الحالي: " + (data?.autoSetName || "غير محدد")); }
    return message.reply("⚠️ الاستخدام: -autosetname set/on/off/view");
  }
};
