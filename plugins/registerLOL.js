/**
 * Plugin used to register your League account in order receive your League Rank as an icon
 * @example !registerLOL
 * @module Plugin-registerLOL
 */

const async = require("async");

exports.help = [
	["!registerLOL <summoner name> <region e.g. EUW> <type e.g. Solo or Flex>", "Register your League account to receive your LOL Rank as an icon"],
	["!deregisterLOL", "Deregister your League account and remove your rank icon"],
	["!statusLOL", "Check your registration status and LOL rank status"],
];

/**
 * Plugin configuration settings, please change to match your server
 * CHANGE THESE SETTINGS!
 *
 * @version 1.0
 * @property {array} owners - The IDs of ServerGroups which can use this plugin
 * @property {array} rank_group_ids - The IDs of the ServerGroups which the bot will assign corresponing with the (n) LOL ranks
 * @property {number} update_rank_interval - How often to automatically update ranks in millseconds (2 hours - 7200000ms)
 * @memberof Plugin-registerLOL
 */
const config = {
	owners: [40],
	regionList: ["BR1", "EUN1", "EUW1", "JP1", "KR", "LA1", "LA2", "NA1", "OC1", "RU", "TR1"],
	rank_group_ids: [204, 203, 202, 201, 200, 199, 198, 197, 196],
	ranks: ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"],
	update_rank_interval: 7200000,
};

/**
 * This function is called whenever Jarvis recieves a private message
 * Will ask target-user(s) if they want to register their steam ID
 * @version 1.0
 * @memberof Plugin-registerLOL
 * @param	{String} msg - Message string sent to Jarvis
 * @param	{String} jarvis - Middleware Function: Provides access to certain Jarvis functions.
 */
exports.onMessage = async (msg, jarvis) => {
	const items = msg.split(" <");
	const command = items.shift();
	const invoker = jarvis.invoker;

	// Register new user
	if (command.toLowerCase() === "!registerlol") {
		// Check user has permissions to use plugin
		if (!config.owners.some((r) => jarvis.groups.indexOf(r) >= 0)) {
			invoker.message(`${jarvis.error_message.forbidden}\n Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] please [b]Verify[/b] to use this command!`);
			return;
		}

		// Check user entered valid parameters
		if (items === undefined || items.length === 0) {
			invoker.message("[b]No summoner name entered![/b] - Type '!registerLOL <summoner name> <region e.g. EUW> <type e.g. Solo/Flex>'");
			return;
		}

		// Construct query parameters array
		// Params[0] = Summoner Name | Params[1] = Region | Params[2] = Ranked Type
		const params = items.map((p) => {
			return p.substring(0, p.length - 1);
		});

		// VALID RANKED QUEUE TYPE CHECK
		if (params[2].toUpperCase() !== "FLEX" && params[2].toUpperCase() !== "SOLO") {
			invoker.message("[b]Invalid type entered![/b] - Valid types: Solo or Flex");
			return;
		}

		// VALID REGION CHECK
		if (params[1] !== undefined && params[1].length >= 2 && params[1].length <= 3) {
			// Check for edge case server names
			if (params[1].toUpperCase() !== "KR" && params[1].toUpperCase() !== "RU") {
				// Add stupid server name (id) to region, i.e: EUW1 or NA1
				params[1] = params[1] + "1";
			}
			// Check server name exists
			if (!config.regionList.includes(params[1].toUpperCase())) {
				invoker.message("[b]Invalid region entered![/b] - Valid regions: BR, EUN, EUW, JP, KR, LA, LA, NA, OC, RU, TR");
				return;
			}
		} else {
			invoker.message("[b]Invalid region entered![/b] - Valid regions: BR, EUN, EUW, JP, KR, LA, LA, NA, OC, RU, TR");
			return;
		}

		// VALID SUMMONER NAME CHECK
		if (params[0] === undefined || params[0].length <= 2 || params[0].length >= 17) {
			invoker.message("[b]Invalid summoner name entered![/b] - Type '!registerLOL <summoner name> <region e.g. EUW> <type e.g. Solo/Flex>'");
			return;
		}

		try {
			// Check the summoner exists
			let summoner = await jarvis.riot.getSummoner(null, params[0], params[1]);
			if (!summoner) {
				invoker.message(`[b]Summoner name does exist on the ${params[1]} server![/b]`);
				return;
			}

			let clientScheme = {
				id: summoner.id,
				data: {
					riot_account_id: summoner.accountId,
					summoner_name: summoner.name,
					summoner_region: params[1],
					ranked_type: params[2].toUpperCase(),
					ts_nickname: invoker.nickname,
					ts_uid: invoker.uniqueIdentifier,
				},
			};

			// Check user is not already registered
			if (await jarvis.riot.isRegisteredByUid(invoker.uniqueIdentifier)) {
				console.info(`${invoker.nickname} is already registered! by UID`);
				invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] looks like you're already registered!`);
				return; // Is regsitered already
			} else if (await jarvis.riot.isRegisteredBySummonerName(summoner.name)) {
				console.info(`${invoker.nickname} is already registered! by Name`);
				invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] looks like [color=#0069ff][b]${summoner.name}[/b][/color] is already registered!`);
				return; // Summoner name already registered
			}
			// Check user was registered sucesfully
			let register = await jarvis.riot.registerUser(clientScheme);
			if (register) {
				invoker.message(`Sorry something went wront, please try again later!`);
				throw new Error(register);
			}

			// Get summoner leagues object
			let summonerLeagues = await jarvis.riot.getSummonerLeagues(summoner.id, params[1]);

			// Check for unranked summoner
			if (summonerLeagues.length === 0) {
				invoker.message(
					`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] looks like you're unranked in: [b]${clientScheme.data.ranked_type}[/b], we'll monitor your rank and add it when you rank up!`
				);
				return;
			}
			// Get summoner tier for respective queue type
			let summonerTier = getSummonerTier(summonerLeagues, clientScheme.data.ranked_type);

			if (!summonerTier) {
				invoker.message(
					`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] looks like you're unranked in: [b]${clientScheme.data.ranked_type}[/b], we'll monitor your rank and add it when you rank up!`
				);
			} else {
				invoker.message(
					`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] we've added your [color=#0069ff][b]${summonerTier.tier}[/b][/color] in [color=#0069ff][b]${clientScheme.data.ranked_type}[/b][/color] rank!`
				);

				// 0 = Iron | 1 = Bronze | 2 = Silver | 3 = Gold | 4 = Platinum | 5 = Master | 6 = Grandmaster | 6 = Challenger
				invoker.addGroups(config.rank_group_ids[config.ranks.indexOf(summonerTier.tier.toUpperCase())]);
			}
		} catch (e) {
			console.error(`CATCHED: ${e.message}`);
		}
	} else if (command.toLowerCase() === "!deregisterlol") {
		// Check user has permissions to use plugin
		if (!config.owners.some((r) => jarvis.groups.indexOf(r) >= 0)) {
			invoker.message(`${jarvis.error_message.forbidden}\n Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] please [b]Verify[/b] to use this command!`);
			return;
		}

		// Check the deregistering user is registered, and retrieve their Summoner ID from the firestore database
		try {
			let summoner = await jarvis.riot.getRegisterdUserByUid(invoker.uniqueIdentifier);
			if (!summoner) {
				invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] looks like you're not currently registered!`);
				return;
			}
			// Deregistering user, using their Summoner ID
			let deregister = await jarvis.riot.deregisterUser(summoner.id);
			if (deregister) {
				invoker.message(`Sorry something went wront, please try again later!`);
				throw new Error(deregister);
			}

			console.log(`${invoker.nickname} removed from database`);
			invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] your League ID: [color=#0069ff][b]${summoner.id}[/b][/color] has been deregistered!`);

			// Remove users Teamspeak server group
			const existingRank = config.rank_group_ids.filter((element) => invoker.servergroups.includes(element));
			if (existingRank.length > 0) {
				invoker.delGroups(existingRank);
			}
		} catch (e) {
			console.error(`CATCHED: ${e.message}`);
		}
	} else if (command.toLowerCase() === "!statuslol") {
		// Check user has permissions to use plugin
		if (!config.owners.some((r) => jarvis.groups.indexOf(r) >= 0)) {
			invoker.message(`${jarvis.error_message.forbidden}\n Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] please [b]Verify[/b] to use this command!`);
			return;
		}
		try {
			// Get the user's Summoner ID by their Teamspeak UID
			let summoner = await jarvis.riot.getRegisterdUserByUid(invoker.uniqueIdentifier);
			if (!summoner) {
				invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] looks like you're not currently registered!`);
				return;
			}

			invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] you're registered with League ID: [color=#0069ff][b]${summoner.id}[/b][/color]. Updating your rank...`);

			// Get the user's Summoner Leagues object from the Riot-API
			let summonerLeagues = await jarvis.riot.getSummonerLeagues(summoner.id, summoner.data().summoner_region);

			// -1 = Unraked | 0 = Iron | 1 = Bronze | 2 = Silver | 3 = Gold | 4 = Platinum | 5 = Master | 6 = Grandmaster | 6 = Challenger
			let newRankIndex = getSummonerTierIndex(summonerLeagues, summoner.data().ranked_type);

			updateUsersTeamspeakGroups(invoker, newRankIndex, true);
		} catch (e) {
			console.error(`CATCHED: ${e.message}`);
		}
	}
};

/**
 * Updates the invoker's Teamspeak LoL Server Groups
 *
 * @version 1.0
 *
 * @memberof Plugin-registerLOL
 * @param	{Object} invoker - Teamspeak user who made request
 * @param	{Number} newRankIndex - Invoker's updated LOL rank (-1 = Unranked)
 * @param	{Boolean} notify - Flag weather to notify the invoker of their status
 */
function updateUsersTeamspeakGroups(invoker, newRankIndex, notify) {
	// Make sure existing rank is instantiated as an array, to avoid undefined when no existing server group is found!
	let existingTier = [];
	try {
		// Get all the user's existing LOL Teamseak Server Group IDs (Could be multiple, but should not be)
		existingTier = config.rank_group_ids.filter((element) => invoker.servergroups.includes(element));

		// User was unranked and remains unranked
		if (existingTier.length === 0 && newRankIndex === -1) {
			if (notify) {
				invoker.message(`You're still [color=#0069ff][b]Unranked[/b][/color]!`);
			}
			return;
		}

		// Check user is still ranked
		if (newRankIndex >= 0) {
			// Convert the updated LOL tier to corresponding Teamseak Server Group ID
			const rankSgid = config.rank_group_ids[newRankIndex];
			// Check user has gained/lost a rank by checking if existing Teamspeak server groups contains the updated rank

			if (!existingTier.includes(rankSgid)) {
				// If user has an existing rank, remove all old ranks
				if (existingTier.length > 0) {
					invoker.delGroups(existingTier);
				}

				// Add new League Tier
				invoker.addGroups(rankSgid);
				invoker.message(`Your updated LoL rank is: [color=#0069ff][b]${config.ranks[newRankIndex]}[/b][/color], any previouse LoL ranks have been removed!`);

				// Debugging
				console.log(Date(), "=>", invoker.nickname, "=>", "rank changed to", "=>", config.ranks[newRankIndex]);
			} else {
				if (notify) {
					invoker.message(`No rank update required!`);
				}
			}
			// User has become unranked, remove existing Teamseak Server Group ID
		} else if (newRankIndex === -1) {
			// Remove old rank
			invoker.delGroups(existingTier);
			invoker.message(`You've become [color=#0069ff][b]Unranked[/b][/color], any previouse LoL ranks have been removed!`);
		}
	} catch (e) {
		console.error(`CATCHED: ${e.message}`);
	}
}

/**
 * Converts a summoners rank to an index
 * -1 = Unraked | 0 = Iron | 1 = Bronze | 2 = Silver | 3 = Gold | 4 = Platinum | 5 = Master | 6 = Grandmaster | 6 = Challenger
 *
 * @version 1.0
 *
 * @memberof Plugin-registerLOL
 * @param	{Object} summonerLeagues - A summoners league object
 * @returns {Number} - Converted summoner rank to index value
 */
function getSummonerTierIndex(summonerLeagues, type) {
	// Get the user's current LOL rank from the Riot API
	let summonerTier = getSummonerTier(summonerLeagues, type);
	// -1 = Unraked | 0 = Iron | 1 = Bronze | 2 = Silver | 3 = Gold | 4 = Platinum | 5 = Master | 6 = Grandmaster | 6 = Challenger
	if (!summonerTier) {
		return -1;
	} else {
		return config.ranks.indexOf(summonerTier.tier.toUpperCase());
	}
}

/**
 * Returns the summoners tier for their respective queue
 *
 * @version 1.0
 *
 * @memberof Plugin-registerLOL
 * @param	{Array} leagues - Invoker's updated LOL rank (0 = Unranked)
 * @param	{String} type - Summoner's selected queue type
 * @returns {Promise.<data>} - data contains the formated summoner league object for their respective queue (returns Null for unranked)
 */
function getSummonerTier(leagues, type) {
	let summonerTier = null;

	if (leagues && leagues.length >= 1) {
		// Check summoner has rank in selected rank type
		leagues.forEach((league) => {
			if (league.queueType.includes(type)) {
				summonerTier = {
					tier: league.tier,
					rank: league.rank,
				};
			}
		});
		return summonerTier;
	} else {
		return summonerTier;
	}
}

/**
 * Updates the all registered users's LoL rank
 *
 * @version 1.0
 *
 * @memberof Plugin-registerLOL
 * @param	{object} jarvis - Middleware Function: Provides access to certain Jarvis functions.
 */
async function updateAllUsers(jarvis) {
	try {
		// Get all registered members in the League Firebase database
		const members = await jarvis.riot.getAllRegisterdUsers();

		if (!members) {
			return;
		}

		// Iterate through all registered members
		for (const member of members) {
			try {
				const client = await jarvis.ts.getClientByUID(member.data().ts_uid);

				// Client may be offline, therefore only process online clients
				// TODO: Find way to process offline users
				if (client) {
					const summonerLeagues = await jarvis.riot.getSummonerLeagues(member.id, member.data().summoner_region);

					// -1 = Unraked | 0 = Iron | 1 = Bronze | 2 = Silver | 3 = Gold | 4 = Platinum | 5 = Master | 6 = Grandmaster | 6 = Challenger
					const newRankIndex = getSummonerTierIndex(summonerLeagues, member.data().ranked_type);
					updateUsersTeamspeakGroups(client, newRankIndex, false);
				}
			} catch (e) {
				console.error(`CATCHED: ${e.message}`);
			}
		}
	} catch (e) {
		console.error(`CATCHED: ${e.message}`);
	}
}

/**
 * Active Worker: Which iterates through all registered users and updates their Teamspeak CSGO Server Group Rank
 *
 * @version 1.0
 * @memberof Plugin-registerLOL
 * @param	{object} jarvis - Middleware Function: Provides access to certain Jarvis functions.
 *
 */
exports.run = (helpers, jarvis) => {
	async.forever((next) => {
		setTimeout(() => {
			updateAllUsers(jarvis);
			next();
		}, config.update_rank_interval);
	});
};
