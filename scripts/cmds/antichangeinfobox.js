const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "antichangeinfobox", aliases: ["حماية-مجموعة", "antichange"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 3, role: 1, shortDescription: { ar: "تفعيل/إيقاف حماية معلومات المجموعة" }, category: "إدارة", guide: { ar: "{pn} avt/name/theme on/off" } },
  onStart: async function ({ message, args, event, threadsData }) {
    const type = (args[0] || "").toLowerCase();
    const status = (args[1] || "").toLowerCase();
    const typeMap = { avt: "الصورة", name: "الاسم", theme: "الثيم", emoji: "الإيموجي" };
    const typeAr = typeMap[type];
    if (!typeAr || !["on", "off", "تفعيل", "إيقاف"].includes(status)) {
      return message.reply("⚠️ الاستخدام: -antichangeinfobox [avt/name/theme/emoji] [on/off]");
    }
    const isOn = status === "on" || status === "تفعيل";
    const data = { [`antiChange_${type}`]: isOn };
    await threadsData.set(event.threadID, data);
    return message.reply((isOn ? "✅ تم تفعيل" : "✅ تم إيقاف") + " حماية " + typeAr + " المجموعة");
  }
};
