/**
 * Plugin used to create a group of channels for a clan and sets the permissions and properties of each channel
 * @example !createClan
 * @module Plugin-createClan
 */

const Channel = require("./contrib/channel");
const async = require("async");

exports.help = [["!createClan", "Initiate channel template creation for a clan"]];

/**
 * Plugin configuration settings, please change to match your server
 * @property {array} owners - The IDs of ServerGroups which can use this plugin
 * @property {number} ssgid - The source ServerGroup ID (template group you need to setup in Teamspeak)
 * @property {number} sortID_start - Value used to calculate the Clan's ServerGroup's 'i_group_sort_id' for alphabetical sorting.
 * @property {number} sortID_start - Value used for increment of 'i_group_sort_id' E.g. 0-9 = +901s, a = 1000s, b = 1100s, c = 1200, etc
 * @memberof Plugin-createClan
 */
const config = {
	owners: [14, 23],
	ssgid: 118,
	sortID_start: 901,
	sortID_inc: 100
};

// Stores users in session as objects with an index equal to the clients clid
let currentlyCreating = {};

/**
 * Represents a user object which is making channels
 *
 * @version 1.0
 * @memberof Plugin-createClan
 * @type {Class}
 * @param {class} client - The Client which sent a textmessage
 * @property {number} processid - Keeps track of stage at which user is at in clan channel creation
 * @property {class} client - The Client which sent a textmessage
 * @property {number} jarvis - Numeric value corresponding to when the user's session started
 */
function creatingUser(client) {
	this.processid = 1;
	this.client = client;
	this.channels = [];
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
	let client = jarvis.invoker;
	let clid = client.getCache().clid;

	// Is this client already creating channels
	if (typeof currentlyCreating[clid] === "undefined") {
		if (message == "!createclan") {
			// Check invoker has permissions
			if (!config.owners.some(r => jarvis.groups.indexOf(r) >= 0)) {
				client.message(jarvis.error_message.forbidden);
				return;
			}

			// Create session and store Teamspeak-Invoker-Object in new session, used for time-out message
			currentlyCreating[clid] = new creatingUser(client);
			client.message("Enter Clan Name: (Type '!stop' at any point to create the channels!)");
		}
	} else if (currentlyCreating[clid].processid == 1) {
		// Sanitise original message and retain capitalisation - returns an array[valid,message]
		let channelName = sanitation(msg);

		// Check for valid channel name
		if (!channelName[0]) {
			client.message(jarvis.error_message.sanitation);
			return;
		}

		// Check if another command was entered, rather than channel name
		if (channelName[1].charAt(0) == "!" && !(channelName[1].toLowerCase() == "!stop")) {
			client.message("[b]Command Entered[/b] - Please re-enter Channel " + currentlyCreating[clid].channels.length + " Name:");
			return;
		}

		// RECURSIVE: Expect another channel unless message equals '!stop'
		if (channelName[1].toLowerCase() != "!stop") {
			if (!Array.isArray(currentlyCreating[clid].channels) || !currentlyCreating[clid].channels.length) {
				// Parent channel
				currentlyCreating[clid].channels.push(new Channel(channelName[1], null));
				client.message("Enter Channel 1 Name:");
			} else {
				// Child channel
				currentlyCreating[clid].channels.push(new Channel(channelName[1], currentlyCreating[clid].channels[0]));
				client.message("Enter Channel " + currentlyCreating[clid].channels.length + " Name:");
			}
			// Return here insures plugin will request another channel when msg != stop
			return;
		}

		// Before trying to create channels check that there are channels to create
		if (!Array.isArray(currentlyCreating[clid].channels) || !currentlyCreating[clid].channels.length) {
			terminateSession(client, jarvis);
			return;
		}

		client.message("Constructing " + currentlyCreating[clid].channels.length + " channels...");

		constructChannels(jarvis)
			.then(res => {
				client.message(res);
				setChannelPermissions(jarvis)
					.then(res => {
						client.message(res);
						client.message("[b]Create Clan Group?[/b] (default = No) [!y/!n]");
						currentlyCreating[clid].processid = 2;
					})
					.catch(err => {
						// CAUGHT: Internal permission-set error
						console.error("CATCHED", err.message);
						client.message(jarvis.error_message.external + err.message);
						terminateSession(client, jarvis);
					});
			})
			.catch(err => {
				// CAUGHT: Internal error or parent channel failed
				console.error("CATCHED", err.message);
				client.message(jarvis.error_message.internal + err.message);
				terminateSession(client, jarvis);
			});
	} else if (currentlyCreating[clid].processid == 2) {
		if (message != "!y") {
			terminateSession(client, jarvis);
			return;
		}

		// CLAN GROUP CREATOR
		// Set client's session to clan group creation stage
		currentlyCreating[clid].processid = 3;
		client.message("Enter Clan Tag: (Between 2 & 4 characters!)");

		// Clan group creation
	} else if (currentlyCreating[clid].processid == 3) {
		if (msg.length > 5 || msg.length < 2) {
			client.message(jarvis.error_message.sanitation);
			return;
		}
		let clan_tag = msg.toUpperCase();
		jarvis.ts
			.serverGroupCopy(config.ssgid, 0, 1, clan_tag)
			.then(res => {
				let sort_id = getGroupSortID(clan_tag);
				jarvis.ts.serverGroupAddPerm(res.sgid, "i_group_sort_id", sort_id, true, 0, 0);
			})
			.then(() => {
				client.message("Clan group: " + clan_tag + " added successfully");
				terminateSession(client, jarvis);
			})
			.catch(err => {
				if (err.message != "database duplicate entry") {
					client.message(jarvis.error_message.external + err.message);
					console.error("CATCHED", err.message);
					terminateSession(client, jarvis);
				}
				client.message("[b]" + clan_tag + " already exists! Try another tag:[/b]");
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
	let cid = jarvis.invoker.getCache().clid;
	let result = "Channels created successfully, setting permissions...";
	// loop through channel array
	for (let c of currentlyCreating[cid].channels) {
		// Parent Channel
		if (!c.parent) {
			await jarvis.ts.channelCreate(c.name, c.properties).then(response => {
				c.cid = response._static.cid;
			});
			// Child Channels
		} else {
			// Set channel's parent id
			c.properties.cpid = c.parent.cid;
			await jarvis.ts
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
	let cid = jarvis.invoker.getCache().clid;
	// Result assumes success
	let result = "Permissions set successfully";
	// loop through channel array
	for (let c of currentlyCreating[cid].channels) {
		// loop through channel's permissions object
		let permissions = [];
		for (let perm in c.permissions) {
			permissions.push({
				permsid: perm,
				permvalue: c.permissions[perm]
			});
		}
		// Set channel perms one-by-one
		await jarvis.ts.channelSetPerms(c.cid, permissions).catch(err => {
			// CAUGHT: External error
			result = jarvis.error_message.external + err.message;
			console.error("CATCHED", err.message, "ON", c.name);
		});
	}
	return result;
}

/**
 * Calculates and returns ServerGroup's 'i_group_sort_id' value for alphabetical sorting.
 * Increments sortid based on clan tag, E.g. 0-9 = +901s, a = 1000s, b = 1100s, c = 1200, etc
 *
 * @version 1.0
 * @memberof Plugin-createClan
 * @param	{String} tag - String value containing a clan's tag name, e.g 'EPIC'
 * @returns {number} - Numerical value used for 'i_group_sort_id' (e.g 'EPIC' => 'E' => 5 * 100 => 901 + 500 => 1401)
 */
function getGroupSortID(tag) {
	let sortid = config.sortID_start;
	let c = tag.toLowerCase().charAt(0);
	const alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
	let index = alphabet.indexOf(c) + 1;
	return sortid + index * config.sortID_inc;
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
 * @param	{Function} jarvis - Middleware Function: Provides access to Jarvis functions.
 */
function terminateSession(client, jarvis) {
	let clid = client.getCache().clid;
	delete currentlyCreating[clid];
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
