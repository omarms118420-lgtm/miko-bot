const stringSimilarity = require('string-similarity');
const logger = require('../utils/logger.js');
const loggerAdvanced = require('../utils/logger_advanced.js');
const securityAdvanced = require('../utils/security_advanced.js');
const userData = require('../database/userData');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

if (global.isBotActive === undefined) global.isBotActive = true;
const botOwnerID = "100003922506337";

module.exports = async function({ event, api, userData }) {
    const { body, senderID, threadID, messageID } = event;

    if (!body) return;

    if (senderID === botOwnerID) {
        if (body.toLowerCase() === "ايقاف") {
            global.isBotActive = false;
            loggerAdvanced.logInfo('البوت تم إيقافه من قبل المطور');
            return api.sendMessage("واخيرا وقت الراحة ヽʕ•͡-•ʔﾉ ", threadID, messageID);
        }
        if (body.toLowerCase() === "تشغيل") {
            global.isBotActive = true;
            loggerAdvanced.logInfo('البوت تم تشغيله من قبل المطور');
            return api.sendMessage("عاد الاسد اللهم لا حسد ヽʕ•͡-•ʔﾉ ", threadID, messageID);
        }
    }

    if (!global.isBotActive && senderID !== botOwnerID) return; 

    const { config, commands, cooldowns } = Mirror.client;
    const prefix = config.PREFIX;
    
    let args, commandName;
    
    if (prefix) {
        const prefixRegex = new RegExp(`^(${escapeRegex(prefix)})\\s*`);
        if (!prefixRegex.test(body)) return; 
    
        const [matchedPrefix] = body.match(prefixRegex);
        args = body.slice(matchedPrefix.length).trim().split(/ +/);
        commandName = args.shift().toLowerCase();
    } else {
        const words = body.trim().split(/ +/);
        commandName = words[0].toLowerCase();
        if (!commands.has(commandName)) {
            return;
        }
        args = words.slice(1);
    }
    
    let command = commands.get(commandName);
    
    if (!command && prefix) {
        const allCommandNames = Array.from(commands.keys());
        const bestMatch = stringSimilarity.findBestMatch(commandName, allCommandNames);
        if (bestMatch.bestMatch.rating >= 0.5) {
            return api.sendMessage(`⚠️ الأمر "${commandName}" غير موجود. هل تقصد "${bestMatch.bestMatch.target}"؟`, threadID, messageID);
        }
        return;
    } else if (!command) {
        return;
    }
    const suspiciousCheck = securityAdvanced.checkSuspiciousCommand(commandName, args);
    if (suspiciousCheck.suspicious) {
        loggerAdvanced.logSecurity('SUSPICIOUS_COMMAND', senderID, {
            command: suspiciousCheck.command,
            pattern: suspiciousCheck.pattern,
            args
        });
        return api.sendMessage("🚫 هذا الأمر غير مسموح به.", threadID, messageID);
    }

    let userPermission = 0;
    if (config.ADMINBOT.includes(senderID)) { 
        userPermission = 2; 
    } else {
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            if (threadInfo.adminIDs.some(admin => admin.id === senderID)) {
                userPermission = 1; 
            }
        } catch (e) { userPermission = 0; }
    }

    if ((command.config.clearance || 0) > userPermission) {
        loggerAdvanced.logSecurity('PERMISSION_DENIED', senderID, {
            command: commandName,
            requiredPermission: command.config.clearance,
            userPermission
        });
        return api.sendMessage("🚫 ليس لديك الصلاحية الكافية لاستخدام هذا الأمر.", threadID, messageID);
    }

    const now = Date.now();
    const cooldownTime = (command.config.delay || 3) * 1000;
    const userCooldowns = cooldowns.get(senderID) || new Map();
        
    if (userCooldowns.has(command.config.title) && (now - userCooldowns.get(command.config.title)) < cooldownTime) {
        return api.setMessageReaction("⏳", messageID, () => {}, true);
    }

    let user = await userData.get(senderID);

    if (!user) {
        try {
            const userInfo = await api.getUserInfo(senderID);
            const name = userInfo[senderID]?.name || "مستخدم ميرور";
            const type = config.ADMINBOT.includes(senderID) ? "مطور" : "مستخدم";
            await userData.create(senderID, name, type);
            user = await userData.get(senderID);
            logger.loader(`تم إنشاء سجل تلقائي للمستخدم: ${name} [${senderID}]`, 'event');
        } catch (e) {
            logger.error("فشل إنشاء سجل للمستخدم:", e);
        }
    }

    if (config.ADMINBOT.includes(senderID) && user) {
        user.isDeveloper = true;
        user.dungeon = user.dungeon || {};
        user.dungeon.gate = "S";
        user.dungeon.rank = "كلاود نايت";
        user.dungeon.health = 999999;
        user.dungeon.level = 999;
    }

    const props = { 
        api, 
        event, 
        args, 
        permission: userPermission, 
        userData,
        user,
        commands,
        config
    };

    const startTime = Date.now();

    const delay = Math.floor(Math.random() * (1500 - 500 + 1)) + 500; 
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
        await command.HakimRun(props);     
        loggerAdvanced.logCommand(senderID, user?.name || "مستخدم", commandName, args, threadID, true);
        
        userCooldowns.set(command.config.title, now);
        cooldowns.set(senderID, userCooldowns);

    } catch (error) {
        logger.error(`خطأ في تنفيذ الأمر ${command.config.title}:`, error);
        
        loggerAdvanced.logCommand(senderID, user?.name || "مستخدم", commandName, args, threadID, false);
        loggerAdvanced.logError(error, {
            command: commandName,
            userID: senderID,
            threadID
        });
        
        api.sendMessage(`❌ حدث خطأ في النظام المترابط:\n${error.message}`, threadID, messageID);
    }

    const executionTime = Date.now() - startTime;
    loggerAdvanced.logPerformance(commandName, executionTime);
};
