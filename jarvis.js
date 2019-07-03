/**
 * This is a thin wrapper around ts3-nodejs-library which
 * handles conencting, closing and dispatching appropriately.
 */

const TeamSpeak3 = require("ts3-nodejs-library");
const slackBot = require("./slack-api");

/**
 * Represents a Jarvis Bot Instance
 * @version 1.1
 * @type {object}
 * @param {object} config - Config object passed from a configuration file
 * @param {number} cid - The Bot's Default Channel passed as a ChannelID number
 * @property {TeamSpeak3 Class} ts - Stores an instance of the TeamSpeak Query Class
 * @property {slack-api Class} slack - Stores an instance of the slackbots (slack-api) Class
 * @property {object} whoami - Contains usefull information about the Bot's connection
 * @property {boolean} enabled - If the bot is enabled (not in use currently)
 * @property {boolean} teamspeakReady - If Teamspeak-intergration is ready to be used
 * @property {boolean} slackReady - If slack-intergration is ready to be used
 * @property {number} cid - The Bot's Default Channel
 * @property {String} name - The Bot's Name
 * @property {object} config - Config object
 * @property {function} onMessage - Callback function
 */
class Jarvis {
	constructor(config) {
		this.ts = null;
		this.slack = null;
		this.whoami;
		this.enabled = true;
		this.teamspeakReady = false;
		this.slackReady = false;
		this.cid = config.settings.channel;
		this.name = config.settings.nickname;
		this.config = config;
		this.onMessage = function() {};
		this.connectToTS();
		if (config.integrations.slackBot.config) {
			this.connectToSlack();
		}
	}

	/**
	 * Jarvis generic message handler
	 * This function requires a callback-function which will be used when Jarvis recieves a message
	 * @version 1.0
	 * @memberof Jarvis
	 * @param {function} callback - Callback-function
	 */
	messageHandler(callback) {
		this.onMessage = callback;
	}

	/**
	 * Disconnects Jarvis from a Teamspeak 3 server
	 * @version 1.1
	 * @memberof Jarvis
	 */
	closeTS() {
		this.enabled = false;
		this.teamspeakReady = false;
	}

	/**
	 * Disconnects Jarvis from slack
	 * @version 1.1
	 * @memberof Jarvis
	 */
	closeSlack() {
		this.slackReady = false;
	}

	/**
	 * Connects Jarvis to a Teamspeak 3 server
	 * @version 1.0.1
	 * @memberof Jarvis
	 */
	connectToTS() {
		this.ts = new TeamSpeak3(this.config.settings);
		// Avoids the possibility for EventEmitter memory leaks
		this.ts.setMaxListeners(110);
		this.ts.on("ready", () => {
			// Register Jarivs to the following events
			Promise.all([this.ts.registerEvent("textprivate"), this.ts.whoami()])
				.then(res => {
					console.info(this.name, "Subscribed to Private Teamspeak Text Messages");
					this.whoami = res[1];
					this.ready = true;
					this.ts.clientMove(this.whoami.client_id, this.cid).catch(e => {
						console.error("CATCHED", e.message);
					});
					console.info(this.name, "Teamspeak connection is Ready");
				})
				.catch(e => {
					console.error("CATCHED", e.message);
				});
		});

		this.ts.on("textmessage", data => {
			// Stop the bot responding to its own replies, causing an infinite loop (0_o)
			if (this.enabled && this.whoami.client_unique_identifier != data.invoker.getPropertyByName("client_unique_identifier")) {
				this.onMessage(data);
			}
		});

		// Error event gets fired when an Error during connecting or an Error during Processing of an Event happens
		this.ts.on("error", e => {
			this.closeTS();
			console.error("Jarvis Error:", e.message);
		});

		// Close event gets fired when the Connection to the TeamSpeak Server has been closed
		// The e variable is not always set
		this.ts.on("close", e => {
			this.closeTS();
			console.error("Jarvis Connection has been closed!", e);
		});
	}

	/**
	 * Connects Jarvis to a Slack Server
	 * @version 1.0
	 * @memberof Jarvis
	 */
	connectToSlack() {
		this.slack = new slackBot(this.config.integrations.slackBot.config);

		this.slack.on("open", () => {
			this.slackReady = true;
			console.info(this.name, `Slack connection is Ready`);
		});

		this.slack.on("error", e => {
			this.closeSlack();
			console.error("Jarvis Slack Error:", e.message);
		});
	}

	/**
	 * Jarvis external-log utility
	 * This function can be used to log an event messsage to a given slack channel
	 * TO DO: Return promise possibly for success and fail events for better error handling
	 * @version 1.0
	 * @memberof Jarvis
	 * @property {string} channelID - The ID of the channel the message will be sent to, can be private or public channel
	 * @property {string} message - The message text to be sent
	 */
	logToSlack(channelID, message) {
		if (this.slackReady) {
			// Not sure if promises work correctly here:
			// https://github.com/mishk0/slack-bot-api/issues/54
			this.slack.postMessage(channelID, message).fail(error => {
				console.error("Jarvis Error:", error.message);
			});
		}
	}
}

module.exports = Jarvis;
