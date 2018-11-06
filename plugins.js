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

exports.startPlugins = function(helpers) {
	plugins.forEach(function(item) {
		if (typeof item.run == "function") {
			item.run(helpers);
		}
	});
};

exports.onMessage = function(msg, jarvis) {
	plugins.forEach(function(item) {
		if (typeof item.onMessage == "function") {
			item.onMessage(msg, jarvis);
		}
	});
};

exports.getHelpMessage = function() {
	let response = "[b]Jarvis Assistant Bot - Commands:[/b] \n";

	[].concat
		.apply(
			[],
			plugins
				.filter(function(item) {
					return typeof item.help != "undefined";
				})
				.map(function(item) {
					return item.help;
				})
		)
		.map(function(item) {
			response += "[b]" + item[0] + "[/b]  -  " + item[1] + "\n";
		});

	return response;
};
