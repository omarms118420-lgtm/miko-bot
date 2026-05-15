const DEV_ID = "61576232405796";
const MAX_WARNS = 3;

module.exports = {
  config: {
    name: "warn",
    aliases: ["تحذير", "wrn"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 1,
    shortDescription: { ar: "تحذير عضو في المجموعة" },
    longDescription: { ar: "يحذر عضواً، وعند 3 تحذيرات يتم طرده تلقائياً" },
    category: "إدارة",
    guide: {
      ar: "   {pn} @ذكر [السبب]: تحذير عضو\n   {pn} list: قائمة المحذَّرين\n   {pn} unwarn @ذكر: إزالة تحذير"
    }
  },

  onStart: async function ({ api, message, event, args, usersData }) {
    const type = (args[0] || "").toLowerCase();
    const mentioned = Object.keys(event.mentions || {});

    if (type === "list" || type === "قائمة") {
      return message.reply("⚠️ ميزة القائمة قيد التطوير. استخدم -warn @ذكر [السبب]");
    }

    if (type === "unwarn" || type === "إزالة") {
      if (!mentioned.length) return message.reply("⚠️ يرجى ذكر الشخص الذي تريد إزالة تحذيره");
      for (const uid of mentioned) {
        const data = await usersData.get(uid);
        const warns = Math.max(0, (data?.warns || 1) - 1);
        await usersData.set(uid, { warns });
      }
      return message.reply("✅ تمت إزالة التحذير بنجاح!");
    }

    if (!mentioned.length) return message.reply("⚠️ يرجى ذكر الشخص الذي تريد تحذيره");
    const reason = args.slice(1).join(" ").replace(/<[^>]+>/g, "").trim() || "لم يُذكر سبب";
    const now = new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });

    for (const uid of mentioned) {
      const data = await usersData.get(uid);
      const warns = (data?.warns || 0) + 1;
      await usersData.set(uid, { warns });

      if (warns >= MAX_WARNS) {
        try { await api.removeUserFromGroup(uid, event.threadID); } catch (e) {}
        await usersData.set(uid, { warns: 0 });
        await message.reply(
          "╔═══════════════════╗\n" +
          "║  ⛔ تم الطرد  ║\n" +
          "╠═══════════════════╣\n" +
          "║  تم طرد " + event.mentions[uid] + "\n" +
          "║  بسبب تجاوز " + MAX_WARNS + " تحذيرات\n" +
          "╚═══════════════════╝"
        );
      } else {
        await message.reply(
          "╔═══════════════════╗\n" +
          "║  ⚠️ تحذير  ║\n" +
          "╠═══════════════════╣\n" +
          "║  👤 " + event.mentions[uid] + "\n" +
          "║  📝 السبب : " + reason + "\n" +
          "║  🔢 عدد التحذيرات : " + warns + "/" + MAX_WARNS + "\n" +
          "║  🕐 الوقت : " + now + "\n" +
          "╚═══════════════════╝"
        );
      }
    }
  }
};
