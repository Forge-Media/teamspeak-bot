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

		if (msg == "!help") {
			// Help
			client.message(config.messages.help);
		} else if (msg == "!create") {
			// Create
			// Clear array for new create
			channels = [];
			// Create session and store Teamspeak-Invoker-Object in new session, used for time-out message
			currentlyCreating[client.getCache().clid] = new creatingUser(client);
			client.message("Enter Clan Name: (Type '!stop' at any point to create the channels!)");
		} else {
			// Unknown
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

		constructChannels()
			.then(res => {
				client.message(res);
				setChannelPerms()
					.then(res => {
						client.message(res);
						// On sucess terminate the invokers session
						terminateSession(client);
					})
					.catch(err => {
						// CAUGHT: Internal permission-set error
						console.error("CATCHED", err.message);
						client.message(config.messages.error + err.message);
						terminateSession(client);
					});
			})
			.catch(err => {
				// CAUGHT: External parent or Internal Channel-creation error
				console.error("CATCHED", err.message);
				client.message(config.messages.error + err.message);
				terminateSession(client);
			});
	}
});

/**
 * Clan Channel Constructor
 * Will attempt to create all channels present in the channel array
 *
 * If parent-channel .channelCreate() fails, the function will terminate passing error in Promise
 * If child-channel .channelCreate() fails, error is caught and next child will be attempted
 *
 * @returns {Promise.<object>}
 */
async function constructChannels() {
	let result = "Channels created successfully, setting permissions...";
	// loop through channel array
	for (let c of channels) {
		// Parent Channel
		if (!c.parent) {
			let parent = await ts3.channelCreate(c.name, c.properties);
			c.cid = parent._static.cid;
			// Child Channels
		} else {
			// Set channel's parent id
			c.properties.cpid = c.parent.cid;
			await ts3
				.channelCreate(c.name, c.properties)
				.then(response => {
					// Store created channels ID for permissions
					c.cid = response._static.cid;
				})
				.catch(err => {
					// CAUGHT: External error
					result = config.messages.extError + err.message;
					console.error("CATCHED", err.message, "ON", c.name);
				});
		}
	}
	return result;
}

/**
 * Set Channel Permission
 * Will attempt to set permissions for all channels present in the channel array
 *
 * If .channelSetPerm() fails, error is caught and next permission will be attempted
 *
 * @returns {Promise.<object>}
 */
async function setChannelPerms() {
	// Result assumes success
	let result = "Permissions set successfully";
	// loop through channel array
	for (let c of channels) {
		// loop through channel's permissions object
		for (let perm in c.permissions) {
			// Set channel perms one-by-one
			await ts3.channelSetPerm(c.cid, perm, c.permissions[perm], true).catch(err => {
				// CAUGHT: External error
				result = config.messages.extError + err.message;
				console.error("CATCHED", err.message, "ON", c.name);
			});
		}
	}
	return result;
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
		console.info("Channel name too long");
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
			console.info("Subscribed to Private Text Messages");
			theBot = res[1];
			//test();
		})
		.catch(e => {
			console.error("CATCHED", e.message);
		});
});

//Error event gets fired when an Error during connecting or an Error during Processing of an Event happens
ts3.on("error", e => {
	console.error("Error", e.message);
});

//Close event gets fired when the Connection to the TeamSpeak Server has been closed
//the e variable is not always set¬
ts3.on("close", e => {
	console.error("Connection has been closed!", e);
});
