module.exports = {
  settings: {
    host: "127.0.0.1",
    queryport: 10011,
    serverport: 9987,
    username: "username",
    password: "password",
    nickname: "NodeJS Bot",
    keepalive: true
  },
  admins: {
    admins: [14,23]
  },
  messages:{
    help: "\r\n [b]Teamspeak 3 Channel Assistant Bot - Commands:[/b] \r\n !create   -   Initiate channel template creation \r\n !help   -   Fore more info",
    unknown: "\r\n Unknown command, type [b]!help[/b] for more info",
    sanitation: "[b]Channel name is invalid, try again:[/b]",
    forbidden: "\r\n Insufficient permissions :(",
    error: "\r\n [b]Caught Internal Error:[/b] ",
    terminate: "[b]Session ended![/b]"
  }
};
