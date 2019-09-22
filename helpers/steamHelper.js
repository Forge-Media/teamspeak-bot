/**
 * This is a thin wrapper around Node-Steam and Node-CSGO,
 * which connects to steam and acts as a bot.
 *
 * @version 1.0
 * @type {class}
 * @param {object} config - Config object passed from instantiation
 * @property {object} config - Contains config settings for your Steam Bot
 * @property {steam} Steam - Node-Steam Library
 * @property {csgo} csgo - Node-CSGO Library
 * @property {object} bot - Emulation of the Steam Client
 * @property {object} steamUser - The Bot's steam account
 * @property {object} steamFriends - Bot's friend list
 * @property {object} steamGC - Steam Game Coordinator object
 * @property {object} CSGOCli - CSGO Client object
 */

const async = require("async");

class steamHelper {
	constructor(config, botname, firebaseHelper, teamspeakHelper) {
		this.name = botname;
		this.config = config;
		this.jarvis = teamspeakHelper;
		this.db = firebaseHelper;
		this.Steam = require("steam");
		this.csgo = require("csgo");
		this.bot = new this.Steam.SteamClient();
		this.steamUser = new this.Steam.SteamUser(this.bot);
		this.steamFriends = new this.Steam.SteamFriends(this.bot);
		this.steamGC = new this.Steam.SteamGameCoordinator(this.bot, 730);
		this.CSGOCli = new this.csgo.CSGOClient(this.steamUser, this.steamGC, false);
		this.ready = false;
		this.crypto = require("crypto");
		this.fs = require("fs");
		this.path = require("path");
		this.sentryPath = this.path.join(__dirname, "../config/steamSentry");
		this.serversPath = this.path.join(__dirname, "../config/steamServers.json");
		this.init();
	}

	/**
	 * Used to intialise the steam bot, connect to steam and emulate the bot playing CSGO
	 * @version 1.0
	 * @memberof steamHelper
	 */
	init() {
		console.info(`${this.name}:`, `Loading Steam Intergration...`);

		const authenticationDetails = this.getAuthentication();

		if (!authenticationDetails) {
			console.info(`${this.name}: Steam Intergration Disabled`);
			return;
		}

		this.setServers();

		//Connect to Steam
		this.bot.connect();

		// Occurs when steam provides an updated sentry file, callback used to accept sentry file
		this.steamUser.on("updateMachineAuth", function(response, callback) {
			console.log(`Steam Event: Received updated sentry file.`);
			this.fs.writeFileSync("data/sentry", response.bytes);
			callback({ sha_file: this.MakeSha(response.bytes) });
		});

		this.bot
			.on("logOnResponse", response => {
				this.onSteamLogOn(response);
			})
			.on("sentry", sentry => {
				this.onSteamSentry(sentry);
			})
			.on("servers", servers => {
				this.onSteamServers(servers);
			})
			.on("connected", () => {
				this.onSteamConnected(authenticationDetails);
			})
			.on("error", err => {
				this.ready = false;
				console.error("CATCHED", err);
				this.bot.connect();
			});

		this.steamFriends.on("friend", (steam64id, relationshipStatus) => {
			//console.log(steam64id, relationshipStatus);
			this.onRelationshipChange(steam64id, relationshipStatus);
		});
	}

	/**
	 * Checks if there is an existing Steam-Server list (steamServers.json), and if not uses a precompiled list
	 * @version 1.0
	 * @memberof steamHelper
	 */
	setServers() {
		const serversList = JSON.parse(
			`[{"host":"162.254.195.47","port":27019},{"host":"162.254.195.47","port":27018},{"host":"162.254.195.46","port":27017},{"host":"162.254.195.44","port":27018},{"host":"162.254.195.45","port":27018},{"host":"162.254.195.44","port":27019},{"host":"162.254.195.45","port":27019},{"host":"162.254.195.44","port":27017},{"host":"162.254.195.46","port":27019},{"host":"162.254.195.45","port":27017},{"host":"162.254.195.46","port":27018},{"host":"162.254.195.47","port":27017},{"host":"162.254.193.47","port":27018},{"host":"162.254.193.6","port":27017},{"host":"162.254.193.46","port":27017},{"host":"162.254.193.7","port":27019},{"host":"162.254.193.6","port":27018},{"host":"162.254.193.6","port":27019},{"host":"162.254.193.47","port":27017},{"host":"162.254.193.46","port":27019},{"host":"162.254.193.7","port":27018},{"host":"162.254.193.47","port":27019},{"host":"162.254.193.7","port":27017},{"host":"162.254.193.46","port":27018},{"host":"155.133.254.132","port":27017},{"host":"155.133.254.132","port":27018},{"host":"205.196.6.75","port":27017},{"host":"155.133.254.133","port":27019},{"host":"155.133.254.133","port":27017},{"host":"155.133.254.133","port":27018},{"host":"155.133.254.132","port":27019},{"host":"205.196.6.67","port":27018},{"host":"205.196.6.67","port":27017},{"host":"205.196.6.75","port":27019},{"host":"205.196.6.67","port":27019},{"host":"205.196.6.75","port":27018},{"host":"162.254.192.108","port":27018},{"host":"162.254.192.100","port":27017},{"host":"162.254.192.101","port":27017},{"host":"162.254.192.108","port":27019},{"host":"162.254.192.109","port":27019},{"host":"162.254.192.100","port":27018},{"host":"162.254.192.108","port":27017},{"host":"162.254.192.101","port":27019},{"host":"162.254.192.109","port":27018},{"host":"162.254.192.101","port":27018},{"host":"162.254.192.109","port":27017},{"host":"162.254.192.100","port":27019},{"host":"162.254.196.68","port":27019},{"host":"162.254.196.83","port":27019},{"host":"162.254.196.68","port":27017},{"host":"162.254.196.67","port":27017},{"host":"162.254.196.67","port":27019},{"host":"162.254.196.83","port":27017},{"host":"162.254.196.84","port":27019},{"host":"162.254.196.84","port":27017},{"host":"162.254.196.83","port":27018},{"host":"162.254.196.68","port":27018},{"host":"162.254.196.84","port":27018},{"host":"162.254.196.67","port":27018},{"host":"155.133.248.53","port":27017},{"host":"155.133.248.50","port":27017},{"host":"155.133.248.51","port":27017},{"host":"155.133.248.52","port":27019},{"host":"155.133.248.53","port":27019},{"host":"155.133.248.52","port":27018},{"host":"155.133.248.52","port":27017},{"host":"155.133.248.51","port":27019},{"host":"155.133.248.53","port":27018},{"host":"155.133.248.50","port":27018},{"host":"155.133.248.51","port":27018},{"host":"155.133.248.50","port":27019},{"host":"155.133.246.69","port":27017},{"host":"155.133.246.68","port":27018},{"host":"155.133.246.68","port":27017},{"host":"155.133.246.69","port":27018},{"host":"155.133.246.68","port":27019},{"host":"155.133.246.69","port":27019},{"host":"162.254.197.42","port":27018},{"host":"146.66.152.10","port":27018}]`
		);

		// Try to use saved server list
		if (this.fs.existsSync(this.serversPath)) {
			let steamServers = null;

			try {
				console.info(`Using existing steamServers.json...`);
				steamServers = JSON.parse(this.fs.readFileSync(this.serversPath));
			} catch (e) {
				console.error(`Could not read steamServers.json. PLEASE DELETE IT!`);
				steamServers = serversList;
			}

			// Set Node-Steam servers
			console.info(`${this.name}: steamServers.json updated successfully`);
			this.Steam.servers = steamServers;
		} else {
			// If steamServers.json does not exist, Set Node-Steam servers to use pre-compiled list
			this.Steam.servers = serversList;
		}
	}

	/**
	 * Compiles the login details used to connect to Steam, checks if SteamGuard Auth is entered in config,
	 * Generates an encryption key file which is added to the login details
	 * @version 1.0
	 * @memberof steamHelper
	 * @returns {object} - loginDetails which are used to connect to Steam
	 */
	getAuthentication() {
		let loginDetails = this.config;

		// Check SteamLogin details exist
		if (loginDetails.account_name && loginDetails.password) {
			// Removes the auth-code item if empty
			if (loginDetails.authCode === "" || loginDetails.authCode === null) {
				delete loginDetails.authCode;
			}

			// Checks for existing sentry file and if it exists updates and uses it
			if (this.fs.existsSync(this.sentryPath)) {
				const sentry = this.fs.readFileSync(this.sentryPath);
				if (sentry.length) {
					console.info(`Using existing steamSentry file...`);
					loginDetails.sha_sentryfile = this.MakeSha(sentry);
				} else {
					console.info(`steamSentry file missing, generating one...`);
				}
			}

			// Debugging
			//console.log(loginDetails);

			return loginDetails;
		} else {
			return null;
		}
	}

	/**
	 * Encryption method, updates a passed hash-file
	 * @version 1.0
	 * @memberof steamHelper
	 * @returns {String} - 256 bit hash key
	 */
	MakeSha(bytes) {
		const hash = this.crypto.createHash("sha1");
		hash.update(bytes);
		return hash.digest();
	}

	/**
	 * Method called on steam login attempt
	 * @version 1.0
	 * @memberof steamHelper
	 * @param	{object} response - Data as an object passed from the even handler
	 */
	onSteamLogOn(response) {
		// Check if login attempt was successful
		if (response.eresult === this.Steam.EResult.OK) {
			console.info(`${this.name}: Steam connection is ready`);
		} else {
			console.error(`${this.name}: Steam failed to login!`);
			console.error("ERROR:", response);
			process.exit(1);
		}

		// Set steam status to: online
		this.steamFriends.setPersonaState(this.Steam.EPersonaState.Online);

		// Set steam profile name to something usefull
		this.steamFriends.setPersonaName("Forge Gaming Network");

		// Start CSGO interface
		console.info(`${this.name}: Loading CSGO interface...`);
		this.CSGOCli.launch();
		this.CSGOCli.on("ready", () => {
			this.ready = true;
			console.info(`${this.name}: CSGO connection is ready.`);
		});

		// Listen for interuption and set handler status to unready
		this.CSGOCli.on("unready", () => {
			this.ready = false;
			console.info(`${this.name}: CSGO connection unready.`);
		});

		/*
		 * Not strictly necessary, I think ¯\_(ツ)_/¯
		 */
		this.CSGOCli.on("unhandled", message => {
			console.error("Unhandled:", message);
		});
	}

	/**
	 * Method called when Steam sends an updated sentry file,
	 * then updates the sentry file
	 * @version 1.0
	 * @memberof steamHelper
	 * @param	{object} response - Data as an object passed from the even handler
	 */
	onSteamSentry(response) {
		this.fs.writeFileSync(sentryPath, response, err => {
			if (err) {
				console.error(`${this.name}: Could not save steamSentry file!`);
				console.error("ERROR:", err);
			}
			console.info(`${this.name}: Updated steamSentry file`);
		});
	}

	/**
	 * Method called when Steam sends an updated list of servers,
	 * updates the steamServers.json file with new list
	 * @version 1.0
	 * @memberof steamHelper
	 * @param	{object} response - Data as an object passed from the even handler
	 */
	onSteamServers(response) {
		this.fs.writeFile(this.serversPath, JSON.stringify(response, null, 2), err => {
			if (err) {
				console.error(`${this.name}: Could not save steamServers.json`);
				console.error("ERROR:", err);
			}
			console.info(`${this.name}: Updated steamServers.json`);
		});

		// Update the active server list
		this.Steam.servers = response;
	}

	/**
	 * Method called when Steam Client connects,
	 * User authenticationDetails are passed to log bot into Steam
	 * @version 1.0
	 * @memberof steamHelper
	 * @param	{object} response - Data as an object passed from the even handler
	 */
	onSteamConnected(response) {
		this.steamUser.logOn(response);
	}

	/**
	 * Method called when Steam Client connects,
	 * User authenticationDetails are passed to log bot into Steam
	 * @version 1.0
	 * @memberof steamHelper
	 * @param	{String} steam64id - The requester's steam64id
	 * @param	{ENUM} relationshipStatus - The event in friends list e.g '.RequestRecipient'
	 */
	onRelationshipChange(steam64id, relationshipStatus) {
		// console.log(`${this.name}: New relationship event from ${steam64id} (relationship=${relationshipStatus})`);

		//Null check
		if (steam64id === undefined || relationshipStatus === undefined) {
			return;
		}

		// New friend request
		if (relationshipStatus === this.Steam.EFriendRelationship.RequestRecipient) {
			console.log(`${this.name}: New relationship event from ${steam64id}, (status=${relationshipStatus})`);

			let getRankSgid = steamRank => {
				const rank_group_ids = [166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183];
				return rank_group_ids[steamRank - 1];
			};

			/*
			 * Get this user's Teamspeak uid from firestore-database, thus verifying the user is registered
			 * Retrieves the user on Teamspeak, allowing a message to be delivered
			 * Retrieves the user's CSGO rank and adds the corresponding Rank Icon Server Group.
			 */

			this.getRegisterdUser(steam64id)
				.then(async data => {
					if (data) {
						// Obtain Teamspeak 3 user via their uid
						const invoker = await this.jarvis.getClientByUID(data.ts_uid);
						// Obtain user's CSGO rank
						const rank = await this.getPlayerRank(steam64id);

						// Can't find user on Teamspeak
						if (!invoker) {
							throw new Error(`User ${data.ts_uid}, does not exist on Teamspeak Server!`);
						}

						// Can't find user's CSGO Rank
						if (!rank) {
							invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color], it appears we could not find your CSGO rank!`);
							throw new Error(`User: ${steam64id}, has no CSGO rank!`);
						}

						// User is unranked on CSGO presently
						if (rank.data[0] < 1) {
							invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color], it appears you are unranked on CSGO, we'll keep monitoring your account now for a change!`);
							throw new Error(`User: ${data.ts_nickname}, is unranked in CSGO!`);
						}

						// Found user on Teamspeak and their corresponding CSGO rank
						invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] we've added your [color=#0069ff][b]${data.data[1]}[/b][/color] rank!`);
						return invoker.addGroups(getRankSgid(rank.data[0]));
					} else throw new Error(`User: ${steam64id}, does not exist in database!`);
				})
				.catch(err => {
					console.error(`CATCHED: ${err}`);
				});
		}
	}

	/**
	 * Method called to retrieve a steam-user's CSGO Rank,
	 * Promisifiy event handler for promise based return
	 * @version 1.0
	 * @memberof steamHelper
	 * @returns {promise.<String>}
	 */
	async getPlayerRank(steam64id) {
		return await new Promise((resolve, reject) => {
			if (!isNaN(steam64id) && steam64id.length === 17) {
				// Event emitter which requests users profile
				this.CSGOCli.playerProfileRequest(this.CSGOCli.ToAccountID(steam64id));

				// Event handler
				this.CSGOCli.once("playerProfile", profile => {
					const ranking = profile.account_profiles[0].ranking;

					// Check profile exists and has a ranking
					if (profile !== null && ranking !== null) {
						const success = {
							message: "Success",
							data: [ranking.rank_id, this.CSGOCli.Rank.getString(ranking.rank_id)]
						};
						resolve(success);
					} else {
						const error = {
							message: `Failed to get user: ${steam64id} rank`,
							data: null
						};
						reject(error);
					}
				});
			} else {
				reject({ message: `${steam64id} is an invalid SteamID` });
			}
		});
	}

	/**
	 * Checks if a user with passed 'steam64id' exists in the firebase database already or not
	 *
	 * @version 1.0
	 * @memberof steamHelper
	 * @param	{String} steamid - The requester's steam64id
	 * @param	{Object} invoker - Teamspeak user who made request (may be null)
	 * @returns {Promise.<boolean>}
	 */
	isRegisteredBySteam(steamid, invoker) {
		// Check for existing users with same steamid as the invoker
		return this.db
			.collection("csgo-users")
			.doc(steamid)
			.get()
			.then(doc => {
				if (doc.exists) {
					console.info(`${invoker.nickname} used steamID belonging to someone else`);
					invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] looks like that steamID belongs to someone else!`);
					return true;
				} else {
					return false;
				}
			});
	}

	/**
	 * Checks if a user with passed 'ts_uid' exists in firebase database already or not
	 *
	 * @version 1.0
	 * @memberof steamHelper
	 * @param	{String} ts_uid - A Teamspeak 3 user's unique ID (Should be the invokers ID)
	 * @param	{Object} invoker - Teamspeak user who made request (may be null)
	 * @returns {Promise.<boolean>}
	 */
	isRegisteredByUid(ts_uid, invoker) {
		// Check for existing users with same ts_uid as the invoker
		return this.db
			.collection("csgo-users")
			.where("ts_uid", "==", ts_uid)
			.get()
			.then(snapshot => {
				if (snapshot.empty) {
					return false;
				} else {
					console.info(`${invoker.nickname} is already registered!`);
					invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] looks like you're already registered!`);
					return true;
				}
			});
	}

	/**
	 * Retrieve a registered user from the firebase database
	 *
	 * @version 1.0
	 * @memberof steamHelper
	 * @param	{String} steam64id - The requester's steam64id
	 * @returns {Promise.<>}
	 */
	getRegisterdUser(steamid) {
		return this.db
			.collection("csgo-users")
			.doc(steamid)
			.get()
			.then(doc => {
				if (doc.exists) {
					console.log(`${this.name}: found ${doc.data().ts_nickname} in the database!`);
					return doc.data();
				} else {
					console.log(`${this.name}: could not find ${steamid} in the database!`);
					return null;
				}
			});
	}

	/**
	 * Retrieve a registered user from the firebase database by Teamspeak UID
	 *
	 * @version 1.0
	 * @memberof steamHelper
	 * @param	{String} ts_uid - A Teamspeak 3 user's unique ID (Should be the invokers ID)
	 * @returns {Promise.<>}
	 */
	getRegisterdUserByUid(ts_uid) {
		return this.db
			.collection("csgo-users")
			.where("ts_uid", "==", ts_uid)
			.get()
			.then(snapshot => {
				if (snapshot.empty) {
					return null;
				} else {
					return snapshot.docs;
				}
			});
	}

	/**
	 * Retrieve all registered users from the firebase database
	 *
	 * @version 1.0
	 * @memberof steamHelper
	 * @returns {Promise.<>}
	 */
	getAllRegisterdUsers() {
		return this.db
			.collection("csgo-users")
			.get()
			.then(snapshot => {
				if (snapshot.empty) {
					// console.log("Database empty");
					return;
				} else {
					return snapshot.docs;
				}
			})
			.catch(err => {
				console.log("Error getting documents", err);
			});
	}

	/**
	 * Registers a new user into the firebase database
	 *
	 * @version 1.0
	 * @memberof steamHelper
	 * @param	{Object} client - A client object which follows the database collection schema
	 * @param	{Object} invoker - Teamspeak user who made request (may be null)
	 * @returns {Promise.<>}
	 */
	registerUser(client, invoker) {
		return this.db
			.collection("csgo-users")
			.doc(client.id)
			.set(client.data)
			.then(() => {
				console.log(`${client.data.ts_nickname} added to database`);
				invoker.message(`Hi, [color=#0069ff][b]${client.data.ts_nickname}[/b][/color] you are now registered!`);
				return true;
			});
	}

	/**
	 * Deregisters an existing user from the firebase database
	 *
	 * @version 1.0
	 * @memberof steamHelper
	 * @param	{String} steam64id - The requester's steam64id
	 * @param	{Object} invoker - Teamspeak user who made request
	 * @returns {Promise.<>}
	 */
	deregisterUser(steamid, invoker) {
		return this.db
			.collection("csgo-users")
			.doc(steamid)
			.delete()
			.then(() => {
				console.log(`${invoker.nickname} removed from database`);
				invoker.message(`Hi, [color=#0069ff][b]${invoker.nickname}[/b][/color] your SteamID: ${steamid} has been deregistered!`);
				return true;
			});
	}
}

module.exports = steamHelper;
