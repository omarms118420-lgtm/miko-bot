const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "ignoreonlyad", aliases: ["تجاهل-مشرف"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 3, role: 1, shortDescription: { ar: "إضافة/إزالة مستخدم من قائمة التجاهل" }, category: "إدارة", guide: { ar: "{pn} @ذكر: تبديل حالة التجاهل" } },
  onStart: async function ({ message, event, threadsData }) {
    const mentioned = Object.keys(event.mentions || {});
    if (!mentioned.length) return message.reply("⚠️ يرجى ذكر المستخدم");
    const data = await threadsData.get(event.threadID);
    const ignoreList = data?.ignoreList || [];
    const uid = mentioned[0];
    if (ignoreList.includes(uid)) {
      await threadsData.set(event.threadID, { ignoreList: ignoreList.filter(id => id !== uid) });
      return message.reply("✅ تمت إزالة " + event.mentions[uid] + " من قائمة التجاهل");
    }
    ignoreList.push(uid);
    await threadsData.set(event.threadID, { ignoreList });
    return message.reply("✅ تمت إضافة " + event.mentions[uid] + " لقائمة التجاهل");
  }
};
