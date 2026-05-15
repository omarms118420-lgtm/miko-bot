const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "rules",
    aliases: ["قوانين", "rls"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 0,
    shortDescription: { ar: "عرض أو تعديل قوانين المجموعة" },
    longDescription: { ar: "يعرض قوانين المجموعة أو يضيف/يحذف منها" },
    category: "إدارة",
    guide: {
      ar: "   {pn}: عرض القوانين\n   {pn} set [القوانين]: تعيين قوانين جديدة\n   {pn} reset: مسح القوانين"
    }
  },

  onStart: async function ({ message, event, args, threadsData }) {
    const type = (args[0] || "").toLowerCase();
    const data = await threadsData.get(event.threadID);
    const currentRules = data?.rules || "";

    if (type === "set" || type === "تعيين") {
      const newRules = args.slice(1).join(" ");
      if (!newRules) return message.reply("⚠️ يرجى إدخال القوانين الجديدة");
      await threadsData.set(event.threadID, { rules: newRules });
      return message.reply("✅ تم حفظ قوانين المجموعة بنجاح!");
    }

    if (type === "reset" || type === "مسح") {
      await threadsData.set(event.threadID, { rules: "" });
      return message.reply("✅ تم مسح قوانين المجموعة");
    }

    if (!currentRules) {
      return message.reply(
        "╔═══════════════════╗\n" +
        "║  📋 قوانين المجموعة  ║\n" +
        "╠═══════════════════╣\n" +
        "║  لم تُضف قوانين بعد!\n" +
        "║  استخدم: -rules set [القوانين]\n" +
        "╚═══════════════════╝"
      );
    }

    return message.reply(
      "╔═══════════════════╗\n" +
      "║  📋 قوانين المجموعة  ║\n" +
      "╠═══════════════════╣\n" +
      currentRules + "\n" +
      "╚═══════════════════╝"
    );
  }
};
