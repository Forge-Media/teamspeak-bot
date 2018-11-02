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
function creatingUser(invoker) {
	this.processid = 1;
	this.client = invoker;
	let currentDate = new Date();
	this.date = currentDate.getTime();
}

// Creates a new Connection to a TeamSpeak Server
let ts3 = new TeamSpeak3(config.settings);

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
			// Create session and store Teamspeak-Invoker-Object in new session, used for time-out message
			currentlyCreating[client.getCache().clid] = new creatingUser(client);
			client.message("Enter Clan Name: (type '!stop' to stop creating channels!)");

			// Unknown
		} else {
			client.message(config.messages.unknown);
		}

		// User is currently creating a channel
	} else if (currentlyCreating[client.getCache().clid].processid == 1) {
		// Sanitise original message and retain capitalisation - returns an array[valid,message]
		let channelName = sanitation(data.msg);

		// Check for valid channel name
		if (!channelName[0]) {
			client.message(config.messages.sanitation);
			return;
		}

		// RECURSIVE: Expect another channel unless message equals '!stop'
		if (channelName[1] != "!stop") {
			if (!Array.isArray(channels) || !channels.length) {
				// Parent channel
				channels.push(new Channel(channelName[1], null));
				client.message("Enter Channel 1 Name:");
			} else {
				// Child channel
				channels.push(new Channel(channelName[1], channels[0]));
				client.message("Enter Channel " + channels.length + " Name:");
			}
			return;
		}

		client.message("Constructing " + channels.length + " channels...");
		// Construct channels
		constructChannels()
			.then(res => {
				// console.log(res);
				if (res) {
					client.message("Channels created succesffully, setting permissions...");
				}
				// Set channel permissions
				setChannelPerms()
					.then(res => {
						// console.log(res);
						if (res) {
							client.message("Channel permissions set");
							// End session
							terminateSession(client);
						}
					})
					.catch(err => {
						// Channel set permission error
						console.log("CATCHED", err.message);
						client.message(config.messages.error + err.message);
						terminateSession(client);
					});
			})
			.catch(err => {
				// Channel creation error
				console.log("CATCHED", err.message);
				client.message(config.messages.error + err.message);
				terminateSession(client);
			});
	}
});

// Create Channels
async function constructChannels() {
	let response;
	// loop through channel array
	for (let c of channels) {
		// Parent Channel
		if (!c.parent) {
			response = await ts3.channelCreate(c.name, c.properties);
			c.cid = response._static.cid;
			// Child Channels
		} else {
			// Set channel's parent id
			c.properties.cpid = c.parent.cid;
			response = await ts3.channelCreate(c.name, c.properties);
			c.cid = response._static.cid;
		}
		// console.log(response);
	}
	return true;
}

// Set Channel Permissions
async function setChannelPerms() {
	let respons;
	// loop through channel array
	for (let c of channels) {
		// loop through channel's permissions object
		for (let perm in c.permissions) {
			// Set channel perms one-by-one
			respons = await ts3.channelSetPerm(c.cid, perm, c.permissions[perm], true);
		}
	}
	return true;
}

// Terminate User Session
function terminateSession(client) {
	// Delete user from session array
	delete currentlyCreating[client.getCache().clid];
	client.message(config.messages.terminate);
}

// Sanitise channel name
function sanitation(message) {
	if (message.length > 20) {
		console.log("Channel name too long");
		return [false];
	} else {
		return [true, message.trim()];
	}
}

// Terminate users in the middle of a creation process when they have been inactive for a while.
// Checks for inactive users every 30 seconds
setInterval(function() {
	// Max user session time in millseconds (3min)
	const maxTime = 180000;
	const currentDate = new Date();
	let currentTime = currentDate.getTime();
	for (let i in currentlyCreating) {
		if (currentlyCreating.hasOwnProperty(i)) {
			// Terminate sessions longer than maxTime
			if (currentTime - currentlyCreating[i].date > maxTime) {
				// Get the Teamspeak-Invoker-Object
				let invoker = currentlyCreating[i].client;
				// Notify the invoker
				invoker.message("Your session has expired.");
				// Terminate the invoker's session
				terminateSession(invoker);
			}
		}
	}
}, 30000);

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
