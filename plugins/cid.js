// channelid plugin for Jarvis

exports.onMessage = function(msg, _jarvis) {
	if (msg == "!cid") {
		_jarvis.privateResponse("You are in channel ID: "+_jarvis.client.getCache().cid);
	}
};