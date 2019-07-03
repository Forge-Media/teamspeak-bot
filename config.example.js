module.exports = {
	settings: {
		protocol: "ssh",
		host: "127.0.0.1",
		queryport: 10022,
		serverport: 9987,
		username: "username",
		password: "password",
		nickname: "Jarvis Bot",
		channel: 1,
		keepalive: true
	},
	plugins: {
		createClan: true,
		purgeVerified: true,
		joinMe: true,
		help: true,
		cid: true
	},
	integrations: {
		// Leave empty to disable
		slackBot: {
			logsChannelID: "",
			config: {
				token: "",
				name: "JarvisBot"
			}
		},
		steamTS: {
			config: {
				owners: [],
				group_id: 40,
				database_file: "contrib/data/verified.json"
			}
		}
	},
	messages: {
		unknown: "Unknown command, type [b]!help[/b] for more info",
		sanitation: "[b]Invalid entry, try again:[/b]",
		forbidden: "[b]Insufficient permissions[/b] :(",
		internal: "[b]Caught Internal Error:[/b] ",
		external: "[b]Caught External Error:[/b] ",
		terminate: "[b]Session ended![/b]",
		expired: "[b]Session expired![/b]"
	}
};
