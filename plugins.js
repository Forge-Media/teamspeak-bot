/**
 * A collection of utility functions which load all <pluginName>.js files exported functions,
 * as well as managing initialisation (init) and active-plugin-worker scripts (run),
 * finally provides a route to core plugin functions such as (onMessage).
 */

const fs = require("fs");

function fetchPlugin(name) {
	let path = "./plugins/" + name;
	let plugin = require(path);
	console.info("Loaded:", name);
	return plugin;
}

// Stores each plugin's exported modules (array/function)
let pluginsArray = [];

exports.init = config_plugins => {
	if (typeof config_plugins == "object") {
		for (name in config_plugins) {
			// Checks that plugin is enabled in config (true)
			if (config_plugins[name]) {
				pluginsArray.push(fetchPlugin(name));
			}
		}
	}
	// Returns all export functions in plugins.js

	return exports;
};

exports.startPlugins = (helpers, jarvis) => {
	pluginsArray.forEach(item => {
		if (typeof item.run == "function") {
			item.run(helpers, jarvis);
		}
	});
};

exports.onMessage = (msg, jarvis) => {
	pluginsArray.forEach(item => {
		if (typeof item.onMessage == "function") {
			item.onMessage(msg, jarvis);
		}
	});
};

exports.getHelpMessage = () => {
	let response = "[b]Jarvis Assistant Bot - Commands:[/b] \n";

	[].concat
		.apply(
			[],
			pluginsArray
				.filter(item => {
					return typeof item.help != "undefined";
				})
				.map(item => {
					return item.help;
				})
		)
		.map(item => {
			response += `[b]${item[0]}[/b] - ${item[1]}\n`;
		});

	return response;
};
