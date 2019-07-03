/**
 * Plugin used to return a message containing the 'cid' of the channel the invoker is in
 * @example !cid
 * @module Plugin-cid
 */

exports.help = [["!cid", "Get Channel ID of your current channel"]];

/**
 * This function is called whenever Jarvis recieves a private message,
 * Returns a message containing the 'cid' of the channel the invoker is in
 *
 * @version 1.0
 * @memberof Plugin-cid
 * @param	{String} msg - Message string sent to Jarvis
 * @param	{String} jarvis - Middleware Function: Provides access to certain Jarvis functions.
 */
exports.onMessage = function(msg, jarvis) {
	const client = jarvis.invoker;
	const command = msg.toLowerCase();

	if (command == "!cid") {
		client.message("You are in channel ID: " + client.getPropertyByName("cid"));
	}
};
