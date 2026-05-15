const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "shortcut", aliases: ["اختصار"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 3, role: 0, shortDescription: { ar: "إضافة اختصار لرسالة" }, category: "أدوات", guide: { ar: "{pn} add [الاختصار] => [المحتوى]\n{pn} delete [الاختصار]\n{pn} list: القائمة" } },
  onStart: async function ({ message, args, event, threadsData }) {
    const type = (args[0] || "").toLowerCase();
    const data = await threadsData.get(event.threadID);
    const shortcuts = data?.shortcuts || {};
    if (type === "add") {
      const combined = args.slice(1).join(" ");
      const parts = combined.split("=>");
      if (parts.length < 2) return message.reply("⚠️ الاستخدام: -shortcut add [اختصار] => [محتوى]");
      const key = parts[0].trim(); const value = parts[1].trim();
      shortcuts[key] = value;
      await threadsData.set(event.threadID, { shortcuts });
      return message.reply("✅ تم إضافة الاختصار: " + key + " => " + value);
    }
    if (type === "delete") { const key = args[1]; if (!key || !shortcuts[key]) return message.reply("❌ الاختصار \"" + key + "\" غير موجود"); delete shortcuts[key]; await threadsData.set(event.threadID, { shortcuts }); return message.reply("✅ تم حذف الاختصار: " + key); }
    if (type === "list") {
      if (!Object.keys(shortcuts).length) return message.reply("⚠️ لا توجد اختصارات مضافة");
      let body = "╔═══════════════════╗\n║  🔖 قائمة الاختصارات  ║\n╠═══════════════════╣\n";
      Object.entries(shortcuts).forEach(([k, v]) => { body += "║  " + k + " => " + v.substring(0, 30) + "\n"; });
      body += "╚═══════════════════╝";
      return message.reply(body);
    }
    return message.reply("⚠️ الاستخدام: -shortcut add/delete/list");
  }
};
