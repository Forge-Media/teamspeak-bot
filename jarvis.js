const { TeamSpeak } = require("ts3-nodejs-library");
const slackHelper = require("./helpers/slackHelper");
const firebaseHelper = require("./helpers/firebaseHelper");
const steamHelper = require("./helpers/steamHelper");

/**
 * This is a thin wrapper around ts3-nodejs-library and slackbots,
 * which handles conencting, closing and dispatching appropriately.
 * Represents a Jarvis Bot Instance
 * @version 1.1
 * @type {class}
 * @param {object} config - Config object passed from a configuration file
 * @param {number} cid - The Bot's Default Channel passed as a ChannelID number
 * @property {TeamSpeak3 Class} ts - Stores an instance of the TeamSpeak Query Class
 * @property {slackHelper Class} slack - Stores an instance of the slackbots (slackHelper) Class
 * @property {steamHelper Class} steam - Stores an instance of the slackbots (slackHelper) Class
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
		this.steam = null;
		this.firebase = new firebaseHelper(config.settings.nickname);
		this.whoami;
		this.enabled = true;
		this.teamspeakReady = false;
		this.slackReady = false;
		this.cid = config.settings.channel;
		this.name = config.settings.nickname;
		this.config = config;
		this.onMessage = function() {};
		this.init();
	}

	/**
	 * Intilises Jarvis and connects to all Teamspeak 3 servers
	 * On successful Teamspeak connection, integrations are established
	 * Replaces connectToTS()
	 * @version 1.0
	 * @memberof Jarvis
	 */
	async init() {
		try {
			console.log(`${this.name}:`, "Connecting to Teamspeak");
			this.ts = await TeamSpeak.connect(this.config.settings);
		} catch (err) {
			this.closeTS();
			console.error("CATCHED", err.message);
		}

		Promise.all([this.ts.registerEvent("textprivate"), this.ts.whoami()])
			.then(res => {
				console.info(`${this.name}:`, "Subscribed to Private Teamspeak Text Messages");
				this.whoami = res[1];
				this.teamspeakReady = true;
				console.info(`${this.name}:`, "Teamspeak connection is Ready");
				return this.ts.clientMove(this.whoami.client_id, this.cid);
			})
			.then(() => {
				// Once Teamspeak 3 connection is established, connect to Slack
				if (this.config.integrations.slackHelper.config) {
					this.connectToSlack();
				}

				// Once Teamspeak 3 connection is established, connect to Steam
				if (this.config.integrations.steamHelper.config) {
					this.steam = new steamHelper(this.config.integrations.steamHelper.config, this.name, this.firebase.db, this.ts);
				}
			})
			.catch(err => {
				console.error("CATCHED", err.message);
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
	 * Connects Jarvis to a Slack Server
	 * @version 1.0
	 * @memberof Jarvis
	 */
	connectToSlack() {
		this.slack = new slackHelper(this.config.integrations.slackHelper.config);

		this.slack.on("open", () => {
			this.slackReady = true;
			console.info(`${this.name}:`, `Slack connection is Ready`);
		});

		this.slack.on("error", e => {
			this.closeSlack();
			console.error("Jarvis Slack Error:", e.message);
		});
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
