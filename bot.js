/*
    * Teamspeak 3 NodeJS® Bot for creating template channels
 *
 * Description: Provides a 'cli-like' service through Teamspeak's chat
 *              to easily create groups of channels with similar settings.
 *              Requires config.js and channel.js
 *
 * © Jeremy Paton (2018)
 */

const TeamSpeak3 = require("ts3-nodejs-library");
const config = require("./config");
const Channel = require("./channel.js");
const owners = config.admins.admins;

// Store the bot
let theBot;
// Array of Channel objects
let channels = [];
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
	if (data.targetmode != 1) {
		return;
	}
	// Stop the bot responding to its own replies, causing an infinite loop (0_o)
	if (data.invoker.getCache().client_unique_identifier == theBot.client_unique_identifier) {
		return;
	}
	// Get the invoker as an object
	const client = data.invoker;
	// Get the invoker's groups
	const groups = data.invoker.getCache().client_servergroups;
	// Get the message
	const msg = data.msg.toLowerCase();

	// Check invoker has permissions
	if (!owners.some(r => groups.indexOf(r) >= 0)) {
		client.message(config.messages.forbidden);
		return;
	}

	// Is this client already creating channels
	if (typeof currentlyCreating[client.getCache().clid] === "undefined") {
		// Is message a command
		if (msg.charAt(0) != "!") {
			return;
		}

		// Help
		if (msg == "!help") {
			client.message(config.messages.help);
			// Create
		} else if (msg == "!create") {
			// Clear array for new create
			channels = [];
			currentlyCreating[client.getCache().clid] = new creatingUser();
			client.message("Enter Clan Name: ([i]type '!stop' to stop creating channels![/i])");
			// Unknown
		} else {
			client.message(config.messages.unknown);
		}

		// User is currently creating a channel
	} else if (currentlyCreating[client.getCache().clid].processid == 1) {
		// Sanitise original message and retain capitalisation
		let channelName = sanitation(data.msg);
		// Channel name is OK
		if (channelName[0]) {
			// Stop creating channels
			if (channelName[1] == "!stop") {
				client.message("\r\n Constructing " + channels.length + " channels...");

				// Construct channels
				constructChannels()
					.then(res => {
						// console.log(res);
						if (res) {
							client.message("\r\n Channels created succesffully");
						}
						// Set channel permissions
						setChannelPerms()
							.then(res => {
								if (res) {
									client.message("\r\n Channel permissions set");
									
									// Maybe change this to sessionTerminate function?
									delete currentlyCreating[client.getCache().clid];
									client.message("\r\n [b]Session ended![/b]");
								}
							})
							.catch(err => {
								// Maybe have session terminate function and call it here (for errors)?
								console.log("CATCHED", err.message);
								client.message(config.messages.error + err.message);
							});
					})
					.catch(err => {
						// Maybe have session terminate function and call it here (for errors)?
						console.log("CATCHED", err.message);
						client.message(config.messages.error + err.message);
					});

			} else {
				// Parent channel
				if (!Array.isArray(channels) || !channels.length) {
					channels.push(new Channel(channelName[1], null));
					client.message("Enter Channel 1 Name:");
					// Child channel
				} else {
					channels.push(new Channel(channelName[1], channels[0]));
					client.message("Enter Channel " + channels.length + " Name:");
				}
			}
		} else {
			client.message(config.messages.sanitation);
		}
	}
});

// Create Channels
async function constructChannels() {
	let response;
	for (let i in channels) {
		//channels.forEach( async c => {
		// Parent Channel
		if (i == 0) {
			response = await ts3.channelCreate(channels[i].name, channels[i].properties);
			channels[i].cid = response._static.cid;
			// Child Channels
		} else {
			// Set channel's parent id
			channels[i].properties.cpid = channels[i].parent.cid;
			response = await ts3.channelCreate(channels[i].name, channels[i].properties);
			channels[i].cid = response._static.cid;
		}
		// console.log(response);
	}
	return true;
}

// Set Channel Permissions
async function setChannelPerms() {
	let respons;
	// loop through channel array
	for (let i in channels) {
		// loop through channel[i]'s permissions
		for (let perm in channels[i].permissions) {
			// Set channel perms one-by-one
			respons = await ts3.channelSetPerm(channels[i].cid, perm, channels[i].permissions[perm], true);
		}
	}
	return true;
}

function sanitation(message) {
	if (message.length > 20) {
		console.log("Channel name too long");
		return [false];
	} else {
		return [true, message.trim()];
	}
}

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
