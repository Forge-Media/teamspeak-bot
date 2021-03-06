/**
     ██╗ █████╗ ██████╗ ██╗   ██╗██╗███████╗
     ██║██╔══██╗██╔══██╗██║   ██║██║██╔════╝
     ██║███████║██████╔╝██║   ██║██║███████╗
██   ██║██╔══██║██╔══██╗╚██╗ ██╔╝██║╚════██║
╚█████╔╝██║  ██║██║  ██║ ╚████╔╝ ██║███████║
 ╚════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝
 * @module Jarvis-Teamspeak-Bot
 * @desc Jarvis is an extensible Teamspeak 3 bot written in Javascript, which can be extended by building your own plugins 
 * or simply forking and hacking it to your own liking. The bot has been written using standard ES6 Javascript.
 * @version 0.9.1
 * @author Jeremy Paton jeremy@jeremypaton.com
 */

const Jarvis = require("./jarvis");
const config = require("./config/config");

// Needs to be removed (as of TS3-NodeJS-Library v2.0)
// Replace with "TeamSpeak.connect()"
const jarvis = new Jarvis(config);

console.info("Loading plugins...");
const plugins = require("./plugins").init(config.plugins);

// Object containing essential configurations, functions and messages which plugins can access
const generic_helpers = {
	help_message: () => {
		return plugins.getHelpMessage();
	},
	integrations: config.integrations,
	error_message: config.messages,
};

// Initialise plugins from all available, passing Generic Helper Functions
plugins.startPlugins(generic_helpers, jarvis);

/**
 * Jarvis core-generic message handler
 * This function is called when Jarvis recieves a direct text message on Teamspeak
 * @version 1.1
 * @memberof Jarvis-Teamspeak-Bot
 * @param {function} data - Callback-function in which data is the direct text message
 */
jarvis.messageHandler(function (data) {
	if (data.targetmode != 1) {
		return;
	}
	plugins.onMessage(
		String(data.msg),
		new (function () {
			this.ts = jarvis.ts;
			this.db = jarvis.firebase.db;
			this.steam = jarvis.steam;
			this.riot = jarvis.riot;
			this.invoker = data.invoker;
			this.groups = data.invoker.servergroups;
			this.error_message = generic_helpers.error_message;
			this.help_message = generic_helpers.help_message;
			this.integrations = generic_helpers.integrations;
			this.log_to_slack = (message) => {
				const logsChannelID = config.integrations.slackHelper.logsChannelID;
				jarvis.logToSlack(logsChannelID, message);
			};
		})()
	);
});
