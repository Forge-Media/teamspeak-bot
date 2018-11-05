const Channel = require("./contrib/channel");
const config = require("../config");

exports.help = [
	["!createClan", "Initiate channel template creation for a clan"]
]

// Array of groups who can use this function
const owners = [14, 23];

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

exports.onMessage = function(msg, jarvis) {
	const message = msg.toLowerCase();
	let client = jarvis.client;
	
	// Is this client already creating channels
	if (typeof currentlyCreating[client.getCache().clid] === "undefined") {
		if (message == "!createclan") {
			// Check invoker has permissions
			if (!owners.some(r => jarvis.groups.indexOf(r) >= 0)) {
				client.message(config.messages.forbidden);
				return;
			}
			// Create
			// Clear array for new create
			channels = [];
			// Create session and store Teamspeak-Invoker-Object in new session, used for time-out message
			currentlyCreating[client.getCache().clid] = new creatingUser(client);
			client.message("Enter Clan Name: (Type '!stop' at any point to create the channels!)");
		}
	} else if (currentlyCreating[client.getCache().clid].processid == 1) {
		// Sanitise original message and retain capitalisation - returns an array[valid,message]
		let channelName = sanitation(msg);

		// Check for valid channel name
		if (!channelName[0]) {
			client.message(config.messages.sanitation);
			return;
		}
		// Check if another command was entered, rather than channel name
		if (channelName[1].charAt(0) == "!" && !(channelName[1].toLowerCase() == "!stop")) {
			client.message("[b]Command Entered[/b] - Please re-enter Channel " + channels.length + " Name:");
			return;
		}

		// RECURSIVE: Expect another channel unless message equals '!stop'
		if (channelName[1].toLowerCase() != "!stop") {
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

		constructChannels(jarvis)
			.then(res => {
				client.message(res);
				setChannelPermissions(jarvis)
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
				// CAUGHT: Internal error or parent channel failed
				console.error("CATCHED", err.message);
				client.message(config.messages.error + err.message);
				terminateSession(client);
			});
	}
};

/**
 * Clan Channel Constructor
 * Will attempt to create all channels present in the channel array
 *
 * If parent-channel .channelCreate() fails, the function will terminate passing error in Promise
 * If child-channel .channelCreate() fails, error is caught and next child will be attempted
 *
 * @returns {Promise.<object>}
 */
async function constructChannels(jarvis) {
	let result = "Channels created successfully, setting permissions...";
	// loop through channel array
	for (let c of channels) {
		// Parent Channel
		if (!c.parent) {
			await jarvis.channelCreate(c.name, c.properties).then(response => {
				c.cid = response._static.cid;
			});
			// Child Channels
		} else {
			// Set channel's parent id
			c.properties.cpid = c.parent.cid;
			await jarvis
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
 *
 * TeamSpeak3.channelSetPerms(5, [{ permsid: "i_channel_needed_modify_power", permvalue: 75 }])
 */
async function setChannelPermissions(jarvis) {
	// Result assumes success
	let result = "Permissions set successfully";
	// loop through channel array
	for (let c of channels) {
		// loop through channel's permissions object
		let permissions = [];
		for (let perm in c.permissions) {
			permissions.push({
				permsid: perm,
				permvalue: c.permissions[perm]
			});
		}
		// Set channel perms one-by-one
		await jarvis.channelSetPerms(c.cid, permissions).catch(err => {
			// CAUGHT: External error
			result = config.messages.extError + err.message;
			console.error("CATCHED", err.message, "ON", c.name);
		});
	}
	return result;
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

// Terminate User Session
function terminateSession(client) {
	delete currentlyCreating[client.getCache().clid];
	client.message(config.messages.terminate);
}

// Terminate users in the middle of a creation process when they have been inactive for a while.
exports.run = function() {
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
				invoker.message("[b]Your session has expired.[/b]");
				// Terminate the invoker's session
				delete currentlyCreating[invoker.getCache().clid];
			}
		}
	}
};
