/** 
 * Plugin used to create a group of channels for a clan and sets the permissions and properties of each channel
 * @example !createClan
 * @module Plugin-createClan 
 */

const Channel = require("./contrib/channel");
const async = require("async");

exports.help = [["!createClan", "Initiate channel template creation for a clan"]];

/**
 * List of admin Group IDs who can use this plugin,
 * will be moved to a config file at a later time
 * @example owners = [1, 2];
 * @memberof Plugin-createClan
 */
const owners = [14, 23];

// Temporarily stores all channels needed to be created
let channels = [];

// Stores users in session as objects with an index equal to the clients clid
let currentlyCreating = {};

/**
 * Represents a user object which is making channels
 *
 * @version 1.0
 * @memberof Plugin-createClan
 * @type {Class}
 * @param {class} client - The Client which sent a textmessage
 * @property {integer} processid - Keeps track of stage at which user is at in clan channel creation
 * @property {class} client - The Client which sent a textmessage
 * @property {integer} jarvis - Numeric value corresponding to when the user's session started
 */
function creatingUser(client) {
	this.processid = 1;
	this.client = client;
	let currentDate = new Date();
	this.date = currentDate.getTime();
}

/**
 * This function is called whenever Jarvis recieves a private message
 * Will create a group of channels for a clan and sets the permissions and properties of each channel
 *
 * @version 1.0
 * @memberof Plugin-createClan
 * @param	{String} msg - Message string sent to Jarvis
 * @param	{String} jarvis - Middleware Function: Provides access to certain Jarvis functions.
 */
exports.onMessage = function(msg, jarvis) {
	const message = msg.toLowerCase();
	let client = jarvis.client;

	// Is this client already creating channels
	if (typeof currentlyCreating[client.getCache().clid] === "undefined") {
		if (message == "!createclan") {
			// Check invoker has permissions
			if (!owners.some(r => jarvis.groups.indexOf(r) >= 0)) {
				client.message(jarvis.error_message.forbidden);
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
			client.message(jarvis.error_message.sanitation);
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
						client.message(jarvis.error_message.external + err.message);
						terminateSession(client);
					});
			})
			.catch(err => {
				// CAUGHT: Internal error or parent channel failed
				console.error("CATCHED", err.message);
				client.message(jarvis.error_message.internal + err.message);
				terminateSession(client);
			});
	}
};

/**
 * Will attempt to create all channels present in the channel array
 *
 * @version 1.0
 * If parent-channel 'channelCreate()' fails, the function will terminate passing error in Promise
 * If child-channel 'channelCreate()' fails, error is caught and next child will be attempted
 *
 * @memberof Plugin-createClan
 * @async
 * @param	{Function} jarvis - Middleware Function: Provides access to Jarvis functions.
 * @returns {Promise.<String>}
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
					result = jarvis.error_message.external + err.message;
					console.error("CATCHED", err.message, "ON", c.name);
				});
		}
	}
	return result;
}

/**
 * Will attempt to set permissions for all channels present in 'channels' array
 * If 'channelSetPerm()' fails, error is caught and next permission will be attempted
 *
 * @version 1.0
 * @memberof Plugin-createClan
 * @async
 * @param	{Function} jarvis - Middleware Function: Provides access to Jarvis functions.
 * @returns {Promise.<String>}
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
			result = jarvis.error_message.external + err.message;
			console.error("CATCHED", err.message, "ON", c.name);
		});
	}
	return result;
}

/**
 * Checks for names which are too long and removes trailing or preceding spaces
 *
 * @version 1.0
 * @memberof Plugin-createClan
 * @param	{String} message - Any string
 * @returns {String} - A clean channel name
 */
function sanitation(message) {
	if (message.length > 20) {
		console.info("Channel name too long");
		return [false];
	} else {
		return [true, message.trim()];
	}
}

/**
 * Terminates user from currentlyCreating array, ending session
 *
 * @version 1.0
 * @memberof Plugin-createClan
 * @param	{class} client - The Client which sent a textmessage
 */
function terminateSession(client) {
	delete currentlyCreating[client.getCache().clid];
	client.message(jarvis.error_message.terminate);
}

/**
 * Active Worker: Which terminates users during creation process, if they've been inactive for a while.
 *
 * @version 1.0
 * @memberof Plugin-createClan
 * @param	{object} helpers - Generic helper object for error messages
 */
exports.run = helpers => {
	async.forever(function(next) {
		setTimeout(function() {
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
						invoker.message(helpers.error_message.expired);
						// Terminate the invoker's session
						delete currentlyCreating[invoker.getCache().clid];
					}
				}
			}
			next();
		}, 30000);
	});
};
