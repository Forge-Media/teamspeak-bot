exports.onMessage = function(msg, jarvis) {
  const client = jarvis.client;
  const command = msg.toLowerCase();

  if (command == '!help') {
    client.message("\n" + jarvis.help_message());
  }
}