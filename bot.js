/*
    * Teamspeak 3 NodeJS® Bot for creating template channels
 *
 * Description: Provides a 'cli-like' service through Teamspeak's chat
 *              to easily create groups of channels with similar settings.
 *              Requires config.js and template.js
 *
 * © Jeremy Paton (2018)
 */

const TeamSpeak3 = require("ts3-nodejs-library");
const config = require("./config");
const owners = config.admins.admins;

// Store the bot
let theBot;
// Store users in session
let currentlyCreating = {};
// User object
function creatingUser() {
	this.processid = 1;
	this.clid = false;
	var currentDate = new Date();
	this.date = currentDate.getTime();
}

// Creates a new Connection to a TeamSpeak Server
let ts3 = new TeamSpeak3(config.settings);

function templateChannels(invoker) {
	invoker.message("Clan Name:");
}

ts3.on("textmessage", data => {
	// Messgage is private only
	if (data.targetmode == 1) {
		// Stop the bot responding to its own replies, causing an infinite loop (0_o)
		if (data.invoker.getCache().client_unique_identifier != theBot.client_unique_identifier) {
			
			// Get the invoker as an object
			const client = data.invoker;
			// var nick = data.invoker.getCache().client_nickname;
			const groups = data.invoker.getCache().client_servergroups;
			// Check invoker has permissions
			if (owners.some(r => groups.indexOf(r) >= 0)) {
				
				//console.log(" Recieved message from: '" + nick + ": '" + data.msg + "'");
				// Is this client already creating channels
				if (typeof currentlyCreating[client.getCache().clid] === "undefined") {
					
					//client.message(" Hello");
					const msg = data.msg.toLowerCase();
					// Is message a command
					if (msg.charAt(0) == "!") {
						// Help
						if (msg == "!help") {
							client.message(config.messages.help);
							// Create
						} else if (msg == "!create") {
							currentlyCreating[client.getCache().clid] = new creatingUser();
							client.message("Enter Clan Name:");
							// Unknown
						} else {
							client.message(config.messages.unknown);
						}
					}
				// User is currently making parent channel
				} else if (currentlyCreating[client.getCache().clid].processid == 1) {
					let parent = data.msg;
				}
			} else {
				client.message(config.messages.forbidden);
			}
		}
	}
});

ts3.on("ready", () => {
	// Required that we register the bot to recieve private text messages
	Promise.all([
		// ts3.registerEvent("textchannel"),
		ts3.registerEvent("textprivate"),
		ts3.whoami()
	])
		.then(res => {
			console.log("Subscribed to Private Text Messages");
			theBot = res[1];
		})
		.catch(e => {
			console.log("CATCHED", e.message);
		});
});

//Error event gets fired when an Error during connecting or an Error during Processing of an Event happens
ts3.on("error", e => {
	console.log("Error", e.message);
});

//Close event gets fired when the Connection to the TeamSpeak Server has been closed
//the e variable is not always set¬
ts3.on("close", e => {
	console.log("Connection has been closed!", e);
});
