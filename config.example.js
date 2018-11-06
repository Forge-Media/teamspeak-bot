module.exports = {
  settings: {
    host: "127.0.0.1",
    queryport: 10011,
    serverport: 9987,
    username: "username",
    password: "password",
    nickname: "Jarvis Bot",
    keepalive: true
  },
  plugins: {
    createClan: true,
    help: true,
    cid: true
  },
  messages:{
    unknown: "Unknown command, type [b]!help[/b] for more info",
    sanitation: "[b]Invalid entry, try again:[/b]",
    forbidden: "[b]Insufficient permissions[/b] :(",
    internal: "[b]Caught Internal Error:[/b] ",
    external: "[b]Caught External Error:[/b] ",
    terminate: "[b]Session ended![/b]",
    expired: "[b]Session expired![/b]"
  }
};
