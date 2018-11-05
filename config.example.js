module.exports = {
  settings: {
    host: "127.0.0.1",
    queryport: 10011,
    serverport: 9987,
    username: "username",
    password: "password",
    nickname: "Jarvis Dev Bot",
    keepalive: true
  },
  admins: {
    admins: []
  },
  plugins: {
    createClan: true,
    help: false,
    cid: true
  },
  messages:{
    help: "\r\n [b]Teamspeak 3 Channel Assistant Bot - Commands:[/b] \r\n !create   -   Initiate channel template creation \r\n !help   -   Fore more info",
    unknown: "Unknown command, type [b]!help[/b] for more info",
    sanitation: "[b]Channel name is invalid, try again:[/b]",
    forbidden: "Insufficient permissions :(",
    error: "[b]Caught Internal Error:[/b] ",
    extError: "[b]Caught External Error:[/b] ",
    terminate: "[b]Session ended![/b]"
  }
};
