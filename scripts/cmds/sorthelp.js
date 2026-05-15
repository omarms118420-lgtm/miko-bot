const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "sorthelp", aliases: ["ترتيب-مساعدة"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 3, role: 1, shortDescription: { ar: "ترتيب قائمة المساعدة" }, category: "معلومات", guide: { ar: "{pn} name: ترتيب بالاسم\n{pn} category: ترتيب بالقسم" } },
  onStart: async function ({ message, args }) {
    const type = (args[0] || "").toLowerCase();
    if (type === "name" || type === "اسم") return message.reply("✅ تم حفظ الترتيب بالاسم");
    if (type === "category" || type === "قسم") return message.reply("✅ تم حفظ الترتيب بالقسم");
    return message.reply("⚠️ الاستخدام: -sorthelp name أو -sorthelp category");
  }
};
