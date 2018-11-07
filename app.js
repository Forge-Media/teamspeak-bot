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
			this.ts = jarvis.ts;
			this.invoker = data.invoker;
			this.groups = data.invoker.getCache().client_servergroups;
			this.error_message = generic_helpers.error_message;
			this.help_message = generic_helpers.help_message;
		}()
	);
});
