const Jarvis = require("./jarvis");
const config = require("./config");

let jarvis = new Jarvis(config, 292);

console.info("Loading plugins...");
let plugins = require("./plugins").init(config.plugins);

jarvis.messageHandler(function(data) {
	if (data.targetmode != 1) {
		return;
	}

	plugins.onMessage(
		String(data.msg),
		new function() {
			this.client = data.invoker;
			this.groups = data.invoker.getCache().client_servergroups;
			this.privateResponse = (msg) => {
				jarvis.sendMessage(this.client.getCache().clid, msg, 1);
			};
			this.createChannel = (name, properties) => {
				return jarvis.cl.channelCreate(name, properties);
			};
			this.setChannelPerm = (cid, perm, value, type) => {
				return jarvis.cl.channelSetPerm(cid, perm, value, type);
			};
		}()
	);
});

// Run plugins ervery 30 seconds
setInterval(function() {
	plugins.run(jarvis);
}, 30000);
