// channelid plugin for Jarvis

exports.onMessage = function(msg, jarvis) {
	const client = jarvis.client;
	const command = msg.toLowerCase();

	if (command == "!cid") {
		client.message("You are in channel ID: " + client.getCache().cid);
	}
};