/**
 * Plugin used to remove any user in a Server Group which is not also in a Verified Database File
 * @example !purgeVerified
 * @module Plugin-purgeVerified
 */

fs = require("fs");
path = require("path");

exports.help = [["!purgeVerified", "Remove invalid users in the Verified Server Group"]];

/**
 * Plugin configuration settings, please change to match your server
 * @version 1.0
 * @property {array} owners - The IDs of ServerGroups which can use this plugin
 * @property {number} group_id - The ID of ServerGroup to be purged
 * @property {String} database_file - Path to the Verified Database File
 * @memberof Plugin-purgeVerified
 */
const config = {
	owners: [14],
	group_id: 40,
	database_file: "contrib/verified.json"
};

let verified_db_file = null;
let verified_group;
let verified_db_array;

/**
 * This function is called whenever Jarvis recieves a private message
 * Will create a group of channels for a clan and sets the permissions and properties of each channel
 *
 * @version 1.0
 * @memberof Plugin-purgeVerified
 * @param	{String} msg - Message string sent to Jarvis
 * @param	{String} jarvis - Middleware Function: Provides access to certain Jarvis functions.
 */

exports.onMessage = function(msg, jarvis) {
	const message = msg.toLowerCase();
	const invoker = jarvis.invoker;

	if (message == "!purgeverified") {
		if (!config.owners.some(r => jarvis.groups.indexOf(r) >= 0)) {
			invoker.message(jarvis.error_message.forbidden);
			return;
		}

		// Check database file exists
		if (!fs.existsSync(path.join(__dirname, config.database_file))) {
			console.error(`${config.database_file} not found`);
			invoker.message(`${jarvis.error_message.internal} Verified Database File Missing!`);
			return;
		}

		// Read database file
		fs.readFile(path.join(__dirname, config.database_file), function read(err, data) {
			if (err) {
				console.error("CATCHED", err);
			} else {
				// Check database file is not empty
				if (data === undefined || data.length == 0) {
					console.error("CATCHED", "verified.json empty");
					return;
				}

				// Parse JSON verfied file
				verified_db_file = JSON.parse(data);
				verified_db_array = verified_db_file["users"];

				// Get all teamspeak clients in server group
				jarvis.ts
					.serverGroupClientList(config.group_id)
					.then(res => {
						verified_group = res;
						invoker.message(`[b]Purge Started on Server Group: (${config.group_id})[/b] \n This may take a while!`);
						// Run purge function
						purgeVerified(invoker, jarvis);
					})
					.catch(err => {
						console.error("CATCHED", err.message);
					});
			}
		});
	}
};

/**
 * This function will attempt to remove any user in a Server Group which is not also in a Verified Database File
 *
 * @version 1.0
 * @memberof Plugin-purgeVerified
 * @param	{String} jarvis - Middleware Function: Provides access to certain Jarvis functions.
 * @param	{Object} invoker - The Teamspeak Client object which made the request
 */
function purgeVerified(invoker, jarvis) {
	let counter = 0;
	// Loop through all users in the Verified Server Group
	verified_group.forEach(element => {
		// Store Teamspeak Client details
		let found = false;
		let sg_user_db_id = element.cldbid.toString();
		let sg_user_id = element.client_unique_identifier;
		let sg_user_name = element.client_nickname;
		// Loop through the Verfied Users Database
		for (let i = 0; i < verified_db_array.length; i++) {
			let db_user_id = verified_db_array[i].teamspeakid;
			if (sg_user_id === db_user_id) {
				found = true;
				return;
			}
		}
    // User was not found in the Verified Users Database, thus they are invalid and are removed from the server group
		if (!found) {
			counter++;
			console.info(`Purging: ${sg_user_name}`);
			jarvis.ts.serverGroupDelClient(sg_user_db_id, config.group_id).catch(err => {
				console.error("CATCHED", err.message);
			});
		}
  });
  
  // Send invoker information about The Purge!!
	invoker.message(`${verified_group.length} total verified users on Teamspeak!`);
	invoker.message(`${verified_db_array.length} total verified users in database!`);
	if (counter > 0) {
		invoker.message(`[b]FINISHED[/b]: ${counter} users purged from server group!`);
	} else {
    invoker.message(`[b]FINISHED[/b]: No invalid users found!`);
	}
}
