const fs = require("fs");

function fetchPlugin(name) {
	let path = "./plugins/" + name;
	let plugin = require(path);
	console.info("Loaded:", name);
	return plugin;
}

let plugins = [];

exports.init = config_plugins => {
	if (typeof config_plugins == "object") {
		for (name in config_plugins) {
			if (config_plugins[name]) {
				plugins.push(fetchPlugin(name));
			}
		}
	}
	return exports;
};

exports.startPlugins = helpers => {
	plugins.forEach(item => {
		if (typeof item.run == "function") {
			item.run(helpers);
		}
	});
};

exports.onMessage = (msg, jarvis) => {
	plugins.forEach(item => {
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
			plugins
				.filter(item => {
					return typeof item.help != "undefined";
				})
				.map(item => {
					return item.help;
				})
		)
		.map(item => {
			response += "[b]" + item[0] + "[/b]  -  " + item[1] + "\n";
		});

	return response;
};
