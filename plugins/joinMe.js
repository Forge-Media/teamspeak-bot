/**
 * Plugin used to ask a target user if they want to join the invoker user's channel
 * @example !joinMe
 * @module Plugin-joinMe
 */

const async = require("async");

exports.help = [["!joinMe <userName> <userName2>...", "Requests another user to join your channel. Jarvis moves them if they accept."]];

/**
 * Plugin configuration settings, please change to match your server
 * @version 1.0
 * @property {array} owners - The IDs of ServerGroups which can use this plugin
 * @memberof Plugin-createClan
 */
const config = {
	owners: [40, 13, 23, 14]
};

// Stores targetUser in an objects with an property equal to the targets clid
let currentlyMoving = {};

/**
 * Represents a user object which is making channels
 *
 * @version 1.0
 * @memberof Plugin-createClan
 * @type {object}
 * @param {object} invoker - The Teamspeak Client object who sent the request
 * @param {object} target - The Teamspeak Client object who is the target of the request
 * @property {object} invoker - The Teamspeak Client object who sent the request
 * @property {object} target - The Teamspeak Client object who is the target of the request
 * @property {number} date - Numeric value corresponding to when the user's session started
 */
function targetUser(invoker, target) {
	this.target = target;
	this.invoker = invoker;
	let currentDate = new Date();
	this.date = currentDate.getTime();
}

/**
 * This function is called whenever Jarvis recieves a private message
 * Will ask target-user(s) if they want to join the invoker user's channel
 * @version 1.0
 * @memberof Plugin-joinMe
 * @param	{String} msg - Message string sent to Jarvis
 * @param	{String} jarvis - Middleware Function: Provides access to certain Jarvis functions.
 */
exports.onMessage = function(msg, jarvis) {
	const items = msg.split(" <");
	const command = items.shift();
	const invoker = jarvis.invoker;
	
	const invoker_name = invoker.getPropertyByName('client_nickname');

	// Check if invoker has been requested already!
	if (typeof currentlyMoving[invoker.getPropertyByName('clid')] != "undefined") {
    
		if (command.slice(0, 2) == "!y") {
      // Move the target
			jarvis.ts.clientMove(invoker.getPropertyByName('clid'), currentlyMoving[invoker.getPropertyByName('clid')].invoker.getPropertyByName('cid')).catch(e => {
				console.error("CATCHED", e.message);
			});
			terminateSession(invoker, jarvis);
		} else {
      // Don't move the target and notify the requestor
			let requestor = currentlyMoving[invoker.getPropertyByName('clid')].invoker;
			let target_name = invoker.getPropertyByName('client_nickname');
			requestor.message("Yo, [color=#0069ff][b]" + target_name + "[/b][/color] does not want to move to your channel!");
			terminateSession(invoker, jarvis);
		}
	}

	// Check for the plugin's command
	if (command.toLowerCase() != "!joinme") {
		return;
	}

	// Check user has permissions to use plugin
	if (!config.owners.some(r => jarvis.groups.indexOf(r) >= 0)) {
		invoker.message(jarvis.error_message.forbidden);
		return;
	}

	// Check user entered target-user(s)
	if (items === undefined || items.length == 0) {
		invoker.message("[b]No user names entered![/b] - Type '!joinMe <userName>'");
		return;
	}

	// Construct target user name array
	const targets = items.map(p => {
		return p.substring(0, p.length - 1);
	});

  // Check user is not moving self
	if (selfMoveCheck(targets, invoker_name)) {
		invoker.message("[b]Joining on yourself is not possible![/b]");
		return;
	}

  // Execute the request for each target user who was found to be valid
	Promise.all([getTargetsArray(targets, jarvis, invoker), jarvis.ts.getChannelByID(invoker.getPropertyByName('cid'))])
		.then(res => {
			if (res[0] === undefined || res[0].length == 0) {
				console.log("No Valid Clients To Move");
				return;
      }
      
      // Get the name of the channel the user is asked to move to
			let target_channel_name = res[1].getPropertyByName('channel_name');
      
      // Request each user
			res[0].forEach(target => {
				let target_clid = target.getPropertyByName('clid');
				currentlyMoving[target_clid] = new targetUser(invoker, target);
				target.message("\n Would you like to join [color=#0069ff][b]" + invoker_name + "[/b][/color] in Channel: " + target_channel_name + "? \n Type !yes to move, or !no to remain");
			});
      // Notify requestor of success
			invoker.message("[b]Request sent to " + res[0].length + " clients![/b]");
		})
		.catch(err => {
			console.error("CATCHED", err.message);
		});
};

/**
 * Gets the teamspeak 3 client objects from their respective client nickname and returns a Promise containing <TeamSpeakClient>
 * Also checks: if target is online, if target is already in channel, target already requested
 * @version 1.0
 * @memberof Plugin-joinMe
 * @async
 * @param	{array} targets - Array of target user Teamspeak 3 nicknames
 * @param	{Function} jarvis - Middleware Function: Provides access to Jarvis functions.
 * @param	{Object} invoker - The Teamspeak Client object which amde the request
 * @returns {Promise.<TeamSpeakClient>}
 */
async function getTargetsArray(targets, jarvis, invoker) {
	let target_clients = [];
	for (let name of targets) {
		let t_client = await jarvis.ts.getClientByName(name);
		if (typeof t_client == "undefined") {
			invoker.message("[color=#0069ff][b]" + name + "[/b][/color] is offline or unkown");
		} else if (t_client.getPropertyByName('cid') == invoker.getPropertyByName('cid')) {
			invoker.message("[color=#0069ff][b]" + name + "[/b][/color] is already here!");
    } else if (typeof currentlyMoving[t_client.getPropertyByName('clid')] != "undefined") {
      invoker.message("[color=#0069ff][b]" + name + "[/b][/color] already requested, please wait up to 2min before requesting again!");
    } else {
			target_clients.push(t_client);
		}
	}
	return target_clients;
}

/**
 * Checks requestor is not try to join their own channel
 *
 * @version 1.0
 * @memberof Plugin-joinMe
 * @param	{array} targets - Array of target user Teamspeak 3 nicknames
 * @param	{String} invoker_name - String containing the requestor's Teamspeak nickname
 */
function selfMoveCheck(targets, invoker_name) {
	let flag = false;
	targets.forEach(v => {
		if (v == invoker_name) {
			flag = true;
		}
	});
	return flag;
}

/**
 * Terminates target user from currentlyMoving array, ending request session
 *
 * @version 1.0
 * @memberof Plugin-createClan
 * @param	{object} client - The Target Client who is waiting to be moved
 * @param	{Function} jarvis - Middleware Function: Provides access to Jarvis functions.
 */
function terminateSession(client, jarvis) {
	let clid = client.getPropertyByName('clid');
	delete currentlyMoving[clid];
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
			const maxTime = 120000;
			const currentDate = new Date();
			let currentTime = currentDate.getTime();
			for (let i in currentlyMoving) {
				if (currentlyMoving.hasOwnProperty(i)) {
					// Terminate sessions longer than maxTime
					if (currentTime - currentlyMoving[i].date > maxTime) {
						// Get the Teamspeak-Invoker-Object
						let target = currentlyMoving[i].target;
						// Notify the invoker
						target.message(helpers.error_message.expired);
						// Terminate the invoker's session
						delete currentlyMoving[target.getPropertyByName('clid')];
					}
				}
			}
			next();
		}, 30000);
	});
};
