const fs = require("fs");

function fetchPlugin(name) {
	let path = "./plugins/" + name;
	let plugin = require(path);
	console.info("Loaded:", name);
	return plugin;
}

let plugins = [];

exports.init = function(config_plugins) {
	if (typeof config_plugins == "object") {
		for (name in config_plugins) {
			let plugin_state = config_plugins[name];
			if (plugin_state === true) {
				plugins.push(fetchPlugin(name));
			}
		}
	}

	return exports;
};

exports.onMessage = function(msg, _jarvis) {
	plugins.forEach(function(item) {
		if (typeof item.onMessage == "function") {
			item.onMessage(msg, _jarvis);
		}
	});
};

exports.run = function(bot) {
	plugins.forEach(function(item) {
		if (typeof item.run == "function") {
			item.run(bot);
		}
	});
};
