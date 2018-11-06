const TeamSpeak3 = require("ts3-nodejs-library");

/**
 * Represents a Jarvis Bot Instance
 * @version 1.0
 * @type {Class}
 * @param {object} config - Config object passed from a configuration file
 * @param {number} cid - The Bot's Default Channel passed as a ChannelID number
 * @property {TeamSpeak3 Class} cl - Stores an instance of the TeamSpeak Query Class
 * @property {object} whoami - Contains usefull information about the Bot's connection
 * @property {boolean} enabled - If the bot is enabled (not in use currently)
 * @property {boolean} restarted - If the bot is has bot been restarted (not in use currently)
 * @property {boolean} ready - If the bot is ready to be used
 * @property {number} cid - The Bot's Default Channel
 * @property {String} name - The Bot's Name
 * @property {object} config - Config object
 * @property {function} onMessage - Callback function
 */
class Jarvis {
	constructor(config, cid) {
		this.cl = null;
		this.whoami;
		this.enabled = true;
		this.restarted = false;
		this.ready = false;
		this.cid = cid;
		this.name = config.settings.nickname;
		this.config = config;
		this.onMessage = function() {};
		this.connect();
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
	 * @version 1.0
	 * @memberof Jarvis
	 */
	close() {
		this.enabled = false;
		if (this.cl) {
			this.cl.close();
		}
	}

	/**
	 * Connects Jarvis to a Teamspeak 3 server
	 * @version 1.0
	 * @memberof Jarvis
	 */
	connect() {
		this.cl = new TeamSpeak3(this.config.settings);

		this.cl.on("ready", () => {
			// Register Jarivs to the following events
			Promise.all([this.cl.registerEvent("textprivate"), this.cl.whoami()])
				.then(res => {
					console.info(this.name, "Subscribed to Private Text Messages");
					this.whoami = res[1];
					this.ready = true;
					this.cl.clientMove(this.whoami.client_id, this.cid).catch(e => {
						console.error("CATCHED", e.message);
					});
					console.info(this.name, "Ready");
				})
				.catch(e => {
					console.error("CATCHED", e.message);
				});
		});

		this.cl.on("textmessage", data => {
			// Stop the bot responding to its own replies, causing an infinite loop (0_o)
			if (this.enabled && this.whoami.client_unique_identifier != data.invoker.getCache().client_unique_identifier) {
				this.onMessage(data);
			}
		});

		// Error event gets fired when an Error during connecting or an Error during Processing of an Event happens
		this.cl.on("error", e => {
			console.error("Jarvis Error", e.message);
			this.close();
		});

		// Close event gets fired when the Connection to the TeamSpeak Server has been closed
		// The e variable is not always set
		this.cl.on("close", e => {
			this.close();
			console.error("Jarvis Connection has been closed!", e);
		});
	}
}

module.exports = Jarvis;
