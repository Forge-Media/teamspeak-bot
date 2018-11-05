const TeamSpeak3 = require("ts3-nodejs-library");

/**
 * Represents a Jarvis Bot Instance
 * @version 1.0
 * @type {Class}
 * @param {object}  config    - Config object passed from a configuration file
 * @param {integer} cid       - The Bots Default Channel passed as a ChannelID number
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
		console.log(this.config.settings);
		this.onMessage = function() {};
		this.connect();
	}

	/**
	 * Jarvis Bot generic message handler
	 * This function requires a callback-function which will be used when the bot recieves a message
	 * @version 1.0
	 * @param {function}	callback    - Callback-function
	 */
	messageHandler(callback) {
		this.onMessage = callback;
	}

	channelSetMultiPerm(cid) {
		/*
		let properties = { cid };
		console.log("channeladdperm", properties);
		this.send("channeladdperm", properties);
		*/
	}

	sendMessage(clid, msg, scope) {
		this.cl.sendTextMessage(clid, scope, msg).catch(err => {
			console.error("CATCHED", err.message);
		});
	}

	send(cmd, options) {
		console.log(cmd, options);
		if (this.ready && this.cl) {
			this.cl.execute(cmd, options).catch(err => {
				console.error("CATCHED", err.message);
			});
		}
	}

	close() {
		this.enabled = false;
		if (ctx.cl) {
			ctx.cl.close();
		}
	}

	/**
	 * Connects to a Teamspeak 3 server
	 * @version 1.0
	 */
	connect() {
		this.cl = new TeamSpeak3(this.config.settings);

		this.cl.on("ready", () => {
			// Required that we register the bot to recieve private text messages
			Promise.all([
				// ts3.registerEvent("textchannel"),
				this.cl.registerEvent("textprivate"),
				this.cl.whoami()
			])
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

		//Error event gets fired when an Error during connecting or an Error during Processing of an Event happens
		this.cl.on("error", e => {
			console.error("Jarvis Error", e.message);
			this.close();
		});

		//Close event gets fired when the Connection to the TeamSpeak Server has been closed
		//the e variable is not always set¬
		this.cl.on("close", e => {
			this.close();
			console.error("Jarvis Connection has been closed!", e);
		});
	}
}

module.exports = Jarvis;
