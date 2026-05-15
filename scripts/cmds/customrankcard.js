const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "customrankcard", aliases: ["تخصيص-رتبة", "crc"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 5, role: 0, shortDescription: { ar: "تخصيص بطاقة الرتبة" }, category: "معلومات", guide: { ar: "{pn} [الخيار] [القيمة]\nالخيارات: maincolor, subcolor, reset\nمثال: {pn} maincolor #ff0000\n{pn} reset: إعادة تعيين الافتراضي" } },
  onStart: async function ({ message, args, event, usersData }) {
    const option = (args[0] || "").toLowerCase();
    const value = args.slice(1).join(" ");
    if (!option) return message.reply("╔═══════════════════╗\n║  🎨 تخصيص الرتبة  ║\n╠═══════════════════╣\n║  -crc maincolor [لون]\n║  -crc subcolor [لون]\n║  -crc textcolor [لون]\n║  -crc reset: إعادة التعيين\n╚═══════════════════╝");
    if (option === "reset") { await usersData.set(event.senderID, { rankCardConfig: {} }); return message.reply("✅ تمت إعادة تعيين بطاقة الرتبة للافتراضي"); }
    if (!value) return message.reply("⚠️ يرجى إدخال القيمة");
    const data = await usersData.get(event.senderID);
    const config = data?.rankCardConfig || {};
    config[option] = value;
    await usersData.set(event.senderID, { rankCardConfig: config });
    return message.reply("✅ تم حفظ التغيير: " + option + " = " + value);
  }
};
