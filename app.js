const Jarvis = require("./jarvis");
const config = require("./config");

let jarvis = new Jarvis(config, 292);

console.info("Loading plugins...");
let plugins = require("./plugins").init(config.plugins);


// Object containing essential functions and messages which plugins can access
let generic_helpers = {
	help_message: function() {
		return plugins.getHelpMessage();
	},
	error_message: config.messages
};

plugins.startPlugins(generic_helpers);

jarvis.messageHandler(function(data) {
	if (data.targetmode != 1) {
		return;
	}
	plugins.onMessage(
		String(data.msg),
		new function() {
			this.client = data.invoker;
			this.groups = data.invoker.getCache().client_servergroups;
			this.channelCreate = (name, properties) => {
				return jarvis.cl.channelCreate(name, properties);
			};
			this.channelSetPerms = (cid, permissions) => {
				return jarvis.cl.channelSetPerms(cid, permissions);
			};
			this.error_message = generic_helpers.error_message;
			this.help_message = generic_helpers.help_message;
		}()
	);
});
