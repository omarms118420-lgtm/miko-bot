const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "Bank", aliases: ["بنك", "bank"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 3, role: 0, shortDescription: { ar: "نظام البنك - الإيداع والسحب" }, category: "مال", guide: { ar: "{pn} deposit [مبلغ]: إيداع\n{pn} withdraw [مبلغ]: سحب\n{pn} info: معلومات حسابك" } },
  onStart: async function ({ message, args, event, usersData }) {
    const type = (args[0] || "").toLowerCase();
    const amount = parseInt(args[1]);
    const data = await usersData.get(event.senderID);
    const wallet = data?.money || 0;
    const bank = data?.bank || 0;
    if (type === "deposit" || type === "إيداع") {
      if (isNaN(amount) || amount <= 0) return message.reply("⚠️ يرجى إدخال مبلغ صحيح");
      if (amount > wallet) return message.reply("❌ رصيد محفظتك غير كافٍ!");
      await usersData.set(event.senderID, { money: wallet - amount, bank: bank + amount });
      return message.reply("✅ تم إيداع " + amount + "$ في البنك");
    }
    if (type === "withdraw" || type === "سحب") {
      if (isNaN(amount) || amount <= 0) return message.reply("⚠️ يرجى إدخال مبلغ صحيح");
      if (amount > bank) return message.reply("❌ رصيد البنك غير كافٍ!");
      await usersData.set(event.senderID, { money: wallet + amount, bank: bank - amount });
      return message.reply("✅ تم سحب " + amount + "$ من البنك");
    }
    return message.reply("╔═══════════════════╗\n║  🏦 حساب البنك  ║\n╠═══════════════════╣\n║  💰 المحفظة : " + wallet + " $\n║  🏦 البنك : " + bank + " $\n║  💳 الإجمالي : " + (wallet + bank) + " $\n╚═══════════════════╝");
  }
};
