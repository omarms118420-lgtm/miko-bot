const HakimCommand = require('./HakimCommand.js');
const HakimReply = require('./HakimReply.js');
const HakimReaction = require('./HakimReaction.js');
const logger = require('../utils/logger.js');
const userData = require('../database/userData');

module.exports = async function({ event, api }) {
    if (!event) return;


    for (const [name, command] of Mirror.client.commands) {
        if (command.HakimEvent) {
            try {
                await command.HakimEvent({ api, event, userData });
            } catch (e) {
                logger.error(`خطأ في HakimEvent للأمر ${name}:`, e);
            }
        }
    }

    try {
        const props = { event, api, userData };
        switch (event.type) {
            case "message":
            case "message_reply":

                const isReply = event.messageReply && Mirror.client.HakimReply.some(item => item.messageID == event.messageReply.messageID);
                if (isReply) {
                    await HakimReply(props);
                } else {
                    await HakimCommand(props);
                }
                break;

            case "message_reaction":
                await HakimReaction(props);
                break;

            case "log:subscribe":
            case "log:unsubscribe":
                for (const [name, command] of Mirror.client.commands) {
                    if (command.config.eventType && command.config.eventType.includes(event.logMessageType)) {
                        await command.HakimRun({ ...props, args: [] });
                    }
                }
                break;
        }
    } catch (error) {
        logger.error("خطأ غير متوقع في المعالج الرئيسي (minHandle):", error);
    }
};