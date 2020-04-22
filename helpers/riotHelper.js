/**
 * This is a thin wrapper around the Riot Games API,
 * which provides request methods and error handling
 *
 * @version 1.0
 * @type {class}
 * @param {string} botname - Name of the bot (used for logging)
 * @property {object} config - Contains config settings for your Steam Bot
 */

const fetch = require("node-fetch");

const regionList = ["BR1", "EUN1", "EUW1", "JP1", "KR", "LA1", "LA2", "NA1", "OC1", "RU", "TR1"];

class riotHelper {
	constructor(config, botname, firebaseHelper) {
		this.name = botname;
		this.config = config;
		this.db = firebaseHelper;
		this.fetchHeader = {};
		this.init();
	}

	async init() {
		if (this.config.api_key) {
			this.fetchHeader = {
				"X-Riot-Token": this.config.api_key,
			};
		} else {
			console.error(`${this.name}:`, "Riot-Games API Key missing!");
		}

		// Check connection to Riot API
		try {
			let summoner = await this.getSummoner("mjtaMqZSF8v4caeFb7f53_fMnbTy3iq53e4TSrw-rp-J5w", "", "euw1");
			if (summoner.name) {
				console.info(`${this.name}:`, "Riot-API connection is Ready");
			}
		} catch (e) {
			console.error(e);
			process.exit(1);
		}

		/* Debug
		try {
			let summoner = await this.getSummonerLeagues("ZnlpTbytD21veWXhwNmW8sK9rfzelicK36z8SBBGSew1kVg", "euw1");
			console.log(summoner);
		} catch (e) {
			console.error(e);
		}
		*/
	}

	/**
	 * Returns a summoner object which contains the summoners name, account ID, level and more
	 *
	 * @version 1.0
	 *
	 * @memberof riotHelper
	 * @param	{String} id - (Optional) Summoner's encrypted account ID
	 * @param	{String} name - Summoner's name
	 * @param	{String} region - Summoner's region for api url
	 * @returns {Promise.<data>} - data contains summoner as an object
	 */
	async getSummoner(id, name, region) {
		if (!name && !id) {
			return new Error("No Summoner Name or ID provided");
		}

		if (!region) {
			return new Error("No region provided, try e.g. [EUW1, EUN1, NA1, JP1]");
		}

		if (!regionList.includes(region.toUpperCase())) {
			return new Error("Invalid region");
		}

		let URL = null;

		// Set correct url, based on getByName or getByID
		if (name && !id) {
			let summonerName = this.formateSummonerName(name);
			URL = `https://${region.toLowerCase()}.${this.config.summoner_api_url}/by-name/${summonerName}`;
		} else if (id) {
			URL = `https://${region.toLowerCase()}.${this.config.summoner_api_url}/by-account/${id}`;
		}

		// console.log(URL);

		// Fetch API response, check for errors and return the summoner as a object
		try {
			let response = await fetch(URL, { method: "GET", headers: this.fetchHeader });
			response = this.checkStatus(response);
			return await response.json();
		} catch (e) {
			if (e.name === "AbortError") {
				console.error("request was aborted");
				return null;
			} else {
				console.error(`Error Type: ${e.type}`);
				console.error(`Error message: ${e.message}`);
				return null;
			}
		}
	}

	/**
	 * Returns a summoner's [solo/duo queue rank / flex queue rank] as an array of objects
	 *
	 * @version 1.0
	 *
	 * @memberof riotHelper
	 * @param	{String} id - Summoner's encrypted account ID
	 * @param	{String} region - Summoner's region for api url
	 * @returns {Promise.<data>} - data contains summoner rank(s) as an object
	 */
	async getSummonerLeagues(id, region) {
		if (!id && !region) {
			return new Error("No Summoner ID or region");
		}

		if (!regionList.includes(region.toUpperCase())) {
			return new Error("Invalid region");
		}

		const URL = `https://${region}.${this.config.league_api_url}/entries/by-summoner/${id}`;

		try {
			let response = await fetch(URL, { method: "GET", headers: this.fetchHeader });
			response = this.checkStatus(response);
			return await response.json();
		} catch (e) {
			if (e.name === "AbortError") {
				console.error("request was aborted");
				return null;
			} else {
				console.error(`Error Type: ${e.type}`);
				console.error(`Error message: ${e.message}`);
				return null;
			}
		}
	}

	/**
	 * Checks if a user with passed 'summoner name' exists in the firebase database already or not
	 *
	 * @version 1.0
	 * @memberof riotHelper
	 * @param	{String} name - Summoner name
	 * @param	{Object} invoker - (Optional) Teamspeak user who made request
	 * @returns {Promise.<boolean>}
	 */
	async isRegisteredBySummonerName(summonerName) {
		// Summoner name comes in pre-formated, from getSummoner()
		// let summonerName = this.formateSummonerName(name);
		let userRef = this.db.collection("riot-users").where("summoner_name", "==", summonerName);
		try {
			let getDoc = await userRef.get();
			if (getDoc.empty) {
				return false; // Not registered
			} else {
				return true; // Is registered
			}
		} catch (e) {
			console.error("Error checking for database entry: ", e.message);
		}
	}

	/**
	 * Checks if a user with passed 'ts_uid' exists in firebase database already or not
	 *
	 * @version 1.0
	 * @memberof riotHelper
	 * @param	{String} ts_uid - A Teamspeak 3 user's unique ID (Should be the invokers ID)
	 * @param	{Object} invoker - (Optional) Teamspeak user who made request
	 * @returns {Promise.<boolean>}
	 */
	async isRegisteredByUid(ts_uid) {
		let userRef = this.db.collection("riot-users").where("ts_uid", "==", ts_uid);
		try {
			let getDoc = await userRef.get();
			if (getDoc.empty) {
				return false; // Not Registered
			} else {
				return true; // Is registered
			}
		} catch (e) {
			console.error("Error checking for database entry: ", e.message);
		}
	}

	/**
	 * Retrieve a registered user from the firebase database by Teamspeak UID
	 *
	 * @version 1.0
	 * @memberof riotHelper
	 * @param	{String} ts_uid - A Teamspeak 3 user's unique ID (Should be the invokers ID)
	 * @returns {Promise.<data>}
	 */
	async getRegisterdUserByUid(ts_uid) {
		let userRef = this.db.collection("riot-users").where("ts_uid", "==", ts_uid);
		try {
			let getDoc = await userRef.get();
			if (getDoc.empty) {
				return null;
			} else {
				return getDoc.docs[0];
			}
		} catch (e) {
			console.error("Error getting database entry: ", e.message);
		}
	}

	/**
	 * Retrieve all registered users from the firebase database
	 *
	 * @version 1.0
	 * @memberof riotHelper
	 * @returns {Promise.<data>}
	 */
	async getAllRegisterdUsers() {
		let dbRef = this.db.collection("riot-users");

		try {
			let getDb = await dbRef.get();
			if (getDb.empty) {
				console.log("Database empty!");
				return null;
			} else {
				return getDb.docs;
			}
		} catch (e) {
			console.log("Error getting database entries: ", e.message);
		}
	}

	/**
	 * Registers a new user into the firebase database
	 *
	 * @version 1.0
	 * @memberof riotHelper
	 * @param	{Object} client - A client object which follows the database collection schema
	 * @returns {Promise.<>}
	 */
	async registerUser(client) {
		let refData = this.db.collection("riot-users").doc(client.id);
		try {
			await refData.set(client.data);
		} catch (e) {
			return e.message;
		}
	}

	/**
	 * Deregisters an existing user from the firebase database
	 *
	 * @version 1.0
	 * @memberof riotHelper
	 * @param	{String} id - Summoner's encrypted account ID
	 * @returns {Promise.<boolean>}
	 */
	async deregisterUser(id) {
		let userRef = this.db.collection("riot-users").doc(id);
		try {
			await userRef.delete();
		} catch (e) {
			return e.message;
		}
	}

	/**
	 * Checks the status of an http API request response, returns the response if 200 OK, else throws a details error message
	 *
	 * @version 1.0
	 *
	 * @memberof riotHelper
	 * @param	{Object} res - API response prior to json(ifiying)
	 * @returns {Object} - response if 200 OK
	 */
	checkStatus(res) {
		if (res.ok) {
			if (res.status >= 200 && res.status < 300) {
				return res;
			} else {
				throw new fetch.FetchError(res.statusText, res.status);
			}
		} else {
			throw new fetch.FetchError(res.statusText, res.status);
		}
	}

	/**
	 * Formats summoner name to lowercase and removes all spaces
	 *
	 * @version 1.0
	 *
	 * @memberof riotHelper
	 * @param	{String} name - Summoner name
	 * @returns {String} - Formated Summoner name
	 */
	formateSummonerName(name) {
		let formatedName = name.toLowerCase();
		formatedName = formatedName.trim();
		return formatedName.replace(/\s/g, "");
	}
}

module.exports = riotHelper;
