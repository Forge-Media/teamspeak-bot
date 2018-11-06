/** 
 * Plugin used to return a message containing the 'cid' of the channel the invoker is in
 * @example !help
 * @module Plugin-help
 */

/**
 * This function is called whenever Jarvis recieves a private message
 * Returns a message containing the all available help commands, given by each plugin
 * @version 1.0
 * @memberof Plugin-help
 * @param	{String} msg - Message string sent to Jarvis
 * @param	{String} jarvis - Middleware Function: Provides access to certain Jarvis functions.
 */
exports.onMessage = function(msg, jarvis) {
  const client = jarvis.client;
  const command = msg.toLowerCase();

  if (command == '!help') {
    client.message("\n" + jarvis.help_message());
  }
}