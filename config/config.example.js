module.exports = {
	// NOTE: Edit before starting Jarvis!
	settings: {
		protocol: "ssh", // Remove this line to connect via telnet (not recommended)
		host: "127.0.0.1", // The IP adress of your TeamSpeak server or (localhost)
		queryport: 10022, // The Server-Query port of your TeamSpeak server
		serverport: 9987, // The voice port of your TeamSpeak server
		username: "username", // Your Server-Query username (serveradmin not recommended)
		password: "password", // Your Server-Query password (serveradmin not recommended)
		nickname: "Jarvis Bot", // The nickname the bot will use on your TeamSpeak server
		channel: 1, // Default channel the bot will connect to
		keepalive: true, // Used to keep bot from disconnecting when idle
	},
	plugins: {
		createClan: true, // Allows the '!createClan' command
		purgeVerified: true, // Allows the '!purgeVerified' command. Requires Steam-TS Intergration to be enabled (https://github.com/Forge-Media/steam-ts)
		joinMe: true, // Allows the '!joinMe' command
		help: true, // Allows the '!help' command (recommended)
		cid: true, // Allows the '!cid' command (recommended)
		registerCSGO: true, // Allows the '!registerCSGO <Steam64id>|!deregisterCSGO|!statusCSGO' commands
		registerLOL: true, // Allows the '!registerLOL <Summoner Name> <Region> <Type> |!deregisterLOL|!statusLOL' commands
	},
	integrations: {
		slackHelper: {
			logsChannelID: "", // The channel-ID of a specific Slack channel for log messages to be sent to
			config: {
				token: "", // Your bot's Slack-app token, get here: https://api.slack.com/apps
				name: "JarvisBot", // The nickname the bot will use on you Slack
			},
		},
		steamTS: {
			config: {
				owners: [], // Server group IDs which can use this integration (used for !purgeVerified)
				group_id: 40, // Server group ID, used to compare against SteamTS's verified database
				database_file: "contrib/data/verified.json", // Directory of your SteamTS's verified database (consider using a Symbolic-Link)
			},
		},
		steamHelper: {
			config: {
				account_name: "", // Steam bot account user name
				password: "", // Steam bot account password
				auth_code: "", // Steam Guard Code. Leave empty on first launch to receive email, enter code and re-launch bot, THEN REMOVE CODE!!
			},
		},
		riotHelper: {
			config: {
				api_key: "", // Riot production/personal api key
				league_api_url: "api.riotgames.com/lol/league/v4", //  Riot summoner ranked API-Endpoint URI
				summoner_api_url: "api.riotgames.com/lol/summoner/v4/summoners", //  Riot summoner info API-Endpoint URI
			},
		},
	},
	// NOTE: Don't edit unless changing bot's language
	messages: {
		unknown: "Unknown command, type [b]!help[/b] for more info",
		sanitation: "[b]Invalid entry, try again:[/b]",
		forbidden: "[b]Insufficient permissions[/b] :(",
		internal: "[b]Caught Internal Error:[/b] ",
		external: "[b]Caught External Error:[/b] ",
		terminate: "[b]Session ended![/b]",
		expired: "[b]Session expired![/b]",
	},
};
