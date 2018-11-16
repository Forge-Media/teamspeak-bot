/**
 * Plugin used to host a Slack Bot, intergrating Slack and Teamspeak.
 * Cross-posts announcements from an #announcements channel to Teamspeak
 * @example !slackBot
 * @module Plugin-slackBot
 */

let SlackBot = require("slackbots");
let bot = undefined;
let channels = ["C5PCTEBKK", "CE642J5KQ"];

/**
 * Active Worker: Creates and runs a new slack bot
 *
 * @version 1.0
 * @memberof Plugin-createClan
 * @param	{object} helpers - Generic helper object for error messages
 */
exports.run = helpers => {
	// Create Slack Bot
	let conf = helpers.plugin_config("slackBot");
	bot = new SlackBot(conf);
	/*
	bot.on("start", function() {
		let params = {
			icon_emoji: ":mrrobot:"
		};

		bot.postMessageToChannel("dev-tests", "Jarvis Bot Says Hello", params);
	});*/

	bot.on("error", err => {
		console.error(err);
	});

	/**
	 * @param {object} data
	 */
	bot.on("message", data => {
		if (data.type !== "message") {
			return;
		}
		if (data.subtype === "message_deleted") {
			return;
		}
		if (channels.includes(data.channel)) {
			// broadcastToTeamspeak(data.text);
			console.log(data.text);
		}
	});
};
