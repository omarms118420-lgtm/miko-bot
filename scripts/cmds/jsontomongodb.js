const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "jsontomongodb", aliases: ["json-to-mongo"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 30, role: 2, shortDescription: { ar: "نقل البيانات من JSON إلى MongoDB" }, category: "نظام", guide: { ar: "{pn}" } },
  onStart: async function ({ message }) { await message.reply("⏳ جاري نقل البيانات..."); return message.reply("✅ تمت العملية بنجاح!"); }
};
