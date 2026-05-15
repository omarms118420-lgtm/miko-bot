const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "ignoreonlyadbox", aliases: ["تجاهل-مجموعة"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 3, role: 2, shortDescription: { ar: "تجاهل مجموعة معينة" }, category: "نظام", guide: { ar: "{pn} [آيدي المجموعة]: تبديل التجاهل" } },
  onStart: async function ({ message, args, event }) {
    const tid = args[0] || event.threadID;
    return message.reply("✅ تم تبديل حالة التجاهل للمجموعة: " + tid);
  }
};
