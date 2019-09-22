/**
 * Plugin used to register your steam account in order revcieve your CSGO Rank as an icon
 * @example !registerCSGO
 * @module Plugin-registerCSGO
 */

const async = require("async");

exports.help = [
	["!registerCSGO <steam64ID number>", "Register your steam account to receive your CSGO Rank as an icon"],
	["!deregisterCSGO", "Deregister your steam account and remove your rank icon"],
	["!statusCSGO", "Check your SteamID and CSGO rank status"]
];

/**
 * Plugin configuration settings, please change to match your server
 * CHANGE THESE SETTINGS!
 *
 * @version 1.0
 * @property {array} owners - The IDs of ServerGroups which can use this plugin
 * @property {array} rank_group_ids - The IDs of the ServerGroups which the bot will assign corresponing with the 18 CSGO ranks
 * @memberof Plugin-registerCSGO
 */
const config = {
	owners: [40],
	rank_group_ids: [166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183],
	bot_steam_profile: "https://steamcommunity.com/profiles/76561198308070847/"
};

/**
 * This function is called whenever Jarvis recieves a private message
 * Will ask target-user(s) if they want to register their steam ID
 * @version 1.0
 * @memberof Plugin-registerCSGO
 * @param	{String} msg - Message string sent to Jarvis
 * @param	{String} jarvis - Middleware Function: Provides access to certain Jarvis functions.
 */
exports.onMessage = function(msg, jarvis) {
	const items = msg.split(" <");
	const command = items.shift();
	const invoker = jarvis.invoker;

	// Register new user
	if (command.toLowerCase() === "!registercsgo") {
		// Check user has permissions to use plugin
		if (!config.owners.some(r => jarvis.groups.indexOf(r) >= 0)) {
			invoker.message(`${jarvis.error_message.forbidden}\n Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] please [b]Verify[/b] to use this command!`);
			return;
		}

		// Check user entered a steamid
		if (items === undefined || items.length === 0 || items.length > 1) {
			invoker.message("[b]No steam ID entered![/b] - Type '!registerCSGO <steam64ID number>'");
			return;
		}

		const steamid = items.map(p => {
			return p.substring(0, p.length - 1);
		});

		// Check user entered a valid steamid
		if (steamid === undefined || steamid[0].length !== 17 || isNaN(steamid[0])) {
			invoker.message("[b]Invalid steam ID entered![/b] - Type '!registerCSGO <steam64ID number>'");
			return;
		}

		// Check user is not already registered by Teamspeak UID
		jarvis.steam
			.isRegisteredByUid(invoker.uniqueIdentifier, invoker)
			.then(data => {
				if (!data) {
					// Check user is not already registered by Steam ID
					return jarvis.steam.isRegisteredBySteam(steamid[0], invoker);
				} else {
					return true;
				}
			})
			.then(data => {
				if (!data) {
					// Construct user-object to pass to database, only 'data' is passed as an object.
					let clientScheme = {
						id: steamid[0],
						data: {
							ts_nickname: invoker.nickname,
							ts_uid: invoker.uniqueIdentifier
						}
					};
					// Register new user
					return jarvis.steam.registerUser(clientScheme, invoker);
				}
			})
			.then(data => {
				if (data) {
					jarvis.steam
						.getPlayerRank(steamid[0])
						.then(data => {
							if (data.data[0] > 0) {
								const steamRank = data.data[0];
								const rankSgid = config.rank_group_ids[steamRank - 1];
								invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] we've added your [color=#0069ff][b]${data.data[1]}[/b][/color] rank!`);
								return invoker.addGroups(rankSgid);
							} else {
								invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] looks like you're unranked, we'll monitor your rank and add it when you rank up!`);
							}
						})
						.catch(err => {
							invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] looks like we're not friends on Steam, please add me: ${config.bot_steam_profile}`);
							console.error(`CATCHED: ${err.message}`);
						});
				}
			})
			.catch(err => {
				console.error(`CATCHED: ${err}`);
			});

		//Deregister User's CSGO
	} else if (command.toLowerCase() === "!deregistercsgo") {
		// Check user has permissions to use plugin
		if (!config.owners.some(r => jarvis.groups.indexOf(r) >= 0)) {
			invoker.message(`${jarvis.error_message.forbidden}\n Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] please [b]Verify[/b] to use this command!`);
			return;
		}
		// Check the deregistering user is registered, and retrieve their SteamID from the firestore database
		jarvis.steam
			.getRegisterdUserByUid(invoker.uniqueIdentifier)
			.then(data => {
				if (data) {
					return jarvis.steam.deregisterUser(data[0].id, invoker);
				} else {
					invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] looks like you're not currently registered!`);
				}
			})
			.then(data => {
				if (data) {
					const existingRank = config.rank_group_ids.filter(element => invoker.servergroups.includes(element));
					if (existingRank.length > 0) {
						return invoker.delGroups(existingRank);
					}
				}
			})
			.catch(err => {
				console.error(`CATCHED: ${err.message}`);
			});

		// Status of user's CSGO rank
	} else if (command.toLowerCase() === "!statuscsgo") {
		// Check user has permissions to use plugin
		if (!config.owners.some(r => jarvis.groups.indexOf(r) >= 0)) {
			invoker.message(`${jarvis.error_message.forbidden}\n Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] please [b]Verify[/b] to use this command!`);
			return;
		}

		// Get the user's SteamID by their Teamspeak UID
		jarvis.steam
			.getRegisterdUserByUid(invoker.uniqueIdentifier)
			.then(user => {
				if (user) {
					// Get the user's current CSGO rank
					invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] you're registered with SteamID: ${user[0].id}. Updating your rank...`);
					return jarvis.steam.getPlayerRank(user[0].id);
				} else {
					invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] looks like you're not currently registered!`);
					return null;
				}
			})
			.then(rank => {
				if (rank) {
					// Update the user's Teamspeak CSGO server groups
					return Promise.all([updateUsersTeamspeakGroups(invoker, rank.data[0]), rank.data[1]]);
				}
			})
			.then(newRank => {
				if (!newRank) {
					return;
				}
				console.log(newRank);
				// User rank changed succefully
				if (newRank[0]) {
					invoker.message(`Your updated CSGO rank is: [color=#0069ff][b]${newRank[1]}[/b][/color], any previouse CSGO ranks have been removed!`);
					// No rank change required
				} else {
					invoker.message(`No change to your existing rank: [color=#0069ff][b]${newRank[1]}[/b][/color], was required!`);
				}
			})
			.catch(err => {
				invoker.message(`${jarvis.error_message.internal} ${err.message}`);
				console.error(`CATCHED: ${err}`);
			});
	}
};

/**
 * Updates the invoker's Teamspeak CSGO Server Groups
 *
 * @version 1.0
 *
 * @memberof Plugin-registerCSGO
 * @param	{Object} invoker - Teamspeak user who made request
 * @param	{Number} newCSGORank - Invoker's current CSGO rank (0 = Unranked)
 * @returns {Promise.<data>} - data contains the updated CSGO Server Group ID or 0 for deranked user
 */
async function updateUsersTeamspeakGroups(invoker, newCSGORank) {
	// Make sure existing rank is instantiated as an array, to avoid undefined when no existing server group is found!
	let existingRank = [];

	// Get all the user's existing CSGO Teamseak Server Group IDs (Could be multiple, but should not be)
	existingRank = config.rank_group_ids.filter(element => invoker.servergroups.includes(element));

	return await new Promise((resolve, reject) => {
		// User was unranked and remains unranked
		if (existingRank.length === 0 && newCSGORank === 0) {
			resolve(null);
		}

		// Check user is still ranked
		if (newCSGORank > 0) {
			// Convert the updated CSGO rank to corresponding Teamseak Server Group ID
			const rankSgid = config.rank_group_ids[newCSGORank - 1];

			// Check users has gained/lost a rank by checking if existing Teamspeak ranks contains the updated rank
			if (!existingRank.includes(rankSgid)) {
				// If user has an existing rank, remove all old ranks
				if (existingRank.length > 0) {
					invoker.delGroups(existingRank).catch(err => {
						reject(err.message);
					});
				}
				// Add new rank
				invoker
					.addGroups(rankSgid)
					.then(() => {
						resolve(rankSgid);
					})
					.catch(err => {
						reject(err.message);
					});
			} else {
				resolve(null);
			}
			// User has become unranked, remove existing Teamseak Server Group ID
		} else if (newCSGORank === 0) {
			// Remove old rank
			invoker
				.delGroups(existingRank)
				.then(() => {
					resolve("Unranked");
				})
				.catch(err => {
					reject(err.message);
				});
		}
	});
}

/**
 * Active Worker: Which iterates through all registered users and updates their Teamspeak CSGO Server Group Rank
 *
 * @version 1.0
 * @memberof Plugin-registerCSGO
 * @param	{object} helpers - Generic helper object for error messages
 * @param	{object} jarvis - Middleware Function: Provides access to certain Jarvis functions.
 *
 */
exports.run = (helpers, jarvis) => {
	async.forever(function(next) {
		setTimeout(function() {
			jarvis.steam
				.getAllRegisterdUsers()
				.then(snapshot => {
					if (snapshot) {
						return snapshot;
					}
				})
				.then(async snapshot => {
					// Check there are users to iterate through
					if (!snapshot) {
						return;
					}
					// Iterate through all registered users
					for (const doc of snapshot) {
						const client = await jarvis.ts.getClientByUID(doc.data().ts_uid);
						const newCSGORank = await jarvis.steam.getPlayerRank(doc.id);

						// Client may be offline, thus ignore them
						// TODO: Find way to process offline users
						if (client) {
							// Debugging
							// console.log(client.nickname, "=>", doc.id, "=>", newCSGORank.data[1]);

							// Update the user's Teamspeak Server Groups as necessary
							updateUsersTeamspeakGroups(client, newCSGORank.data[0])
								.then(Response => {
									if (Response) {
										//console.log(newCSGORank);
										client.message(`Your CSGO rank has been updated to: [color=#0069ff][b]${newCSGORank.data[1]}[/b][/color], any previous CSGO ranks have been removed!`);
									}
								})
								.catch(err => {
									console.error(`CATCHED: ${err.message}`);
								});
						}
					}
				})
				.catch(err => {
					console.error(`CATCHED: ${err.message}`);
				});
			next();
			// How often to update ranks in millseconds (2 hours - 7200000ms)
		}, 15000);
	});
};
