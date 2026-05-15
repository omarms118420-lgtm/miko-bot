const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

const OWNER_ID = "61576232405796";

module.exports = (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) => {
	const handlerEvents = require(process.env.NODE_ENV == 'development' ? "./handlerEvents.dev.js" : "./handlerEvents.js")(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

	return async function (event) {
		const senderID = event.senderID || event.userID || event.author;
		const body = (event.body || "").trim();

		// ══════════════ أمر غادري — يخرج البوت من المجموعة فوراً ══════════════
		if (body === "غادري" && senderID === OWNER_ID && event.threadID) {
			const message = createFuncMessage(api, event);
			try {
				await message.reply("👋 سأغادر المجموعة الآن...");
				await api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
			} catch (_) {}
			return;
		}

		// ══════════════ نظام التقييد ══════════════
		// تفعيل التقييد بدون بادئة
		if (body === "تقييد" && senderID === OWNER_ID) {
			global.botLockdown = true;
			global.botLockdownOwner = OWNER_ID;
			const message = createFuncMessage(api, event);
			return message.reply(
				"╔═══════════════════╗\n" +
				"║  🔒 تم تفعيل التقييد  ║\n" +
				"╠═══════════════════╣\n" +
				"║  البوت يرد عليك فقط الآن\n" +
				"║  لا يستجيب لأي شخص آخر\n" +
				"╠═══════════════════╣\n" +
				"║  لإلغاء: اكتب «إلغاء تقييد»\n" +
				"╚═══════════════════╝"
			);
		}

		// إلغاء التقييد بدون بادئة
		if (
			(body === "إلغاء تقييد" || body === "الغاء تقييد" || body === "إلغاء-تقييد") &&
			senderID === OWNER_ID
		) {
			global.botLockdown = false;
			global.botLockdownOwner = null;
			const message = createFuncMessage(api, event);
			return message.reply(
				"╔═══════════════════╗\n" +
				"║  ✅ تم إلغاء التقييد  ║\n" +
				"╠═══════════════════╣\n" +
				"║  البوت يرد على الجميع الآن\n" +
				"╚═══════════════════╝"
			);
		}

		// حجب الردود على الجميع ما عدا المالك عند التقييد
		if (global.botLockdown === true && senderID !== OWNER_ID) {
			return; // صمت تام — لا رد لأي شخص آخر
		}
		// ══════════════════════════════════════════

		// Check if the bot is in the inbox and anti inbox is enabled
		if (
			global.GoatBot.config.antiInbox == true &&
			(event.senderID == event.threadID || event.userID == event.senderID || event.isGroup == false) &&
			(event.senderID || event.userID || event.isGroup == false)
		)
			return;

		const message = createFuncMessage(api, event);

		await handlerCheckDB(usersData, threadsData, event);
		const handlerChat = await handlerEvents(event, message);
		if (!handlerChat)
			return;

		const {
			onAnyEvent, onFirstChat, onStart, onChat,
			onReply, onEvent, handlerEvent, onReaction,
			typ, presence, read_receipt
		} = handlerChat;


		onAnyEvent();
		switch (event.type) {
			case "message":
			case "message_reply":
			case "message_unsend":
				onFirstChat();
				onChat();
				onStart();
				onReply();
				break;
			case "event":
				handlerEvent();
				onEvent();
				break;
			case "message_reaction":
				onReaction();
				break;
			case "typ":
				typ();
				break;
			case "presence":
				presence();
				break;
			case "read_receipt":
				read_receipt();
				break;
			default:
				break;
		}
	};
};
