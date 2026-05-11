module.exports.config = {
    title: "out",
    release: "1.0.0",
    clearance: 0,
    author: "Hakim Tracks",
    summary: "لا يوجد وصف حالياً",
    section: "عام",
    syntax: "",
    delay: 3,
};

module.exports.HakimRun = async function({ api, event, args }) {
    const permission =
    [`61553754531086`,`100003922506337`]
    if (!permission.includes(event.senderID)) return;
        if (!args[0]) return api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
        if (!isNaN(args[0])) return api.removeUserFromGroup(api.getCurrentUserID(), args.join(" "));
                                                                                              }
