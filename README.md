![GitHub package.json version](https://img.shields.io/github/package-json/v/forge-media/teamspeak-bot.svg)
[![David Dependency Status](https://david-dm.org/Forge-Media/teamspeak-bot.svg)](https://david-dm.org/Forge-Media/teamspeak-bot)
[![Maintainability](https://api.codeclimate.com/v1/badges/0957f4a29edc878ec073/maintainability)](https://codeclimate.com/github/Forge-Media/teamspeak-bot/maintainability)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/forge-media/teamspeak-bot.svg)

# Jarvis Teamspeak-3 Bot

This project was made possible by [TS3-NodeJS-Library](https://github.com/Multivit4min/TS3-NodeJS-Library), special thanks to [Multivit4min](https://github.com/Multivit4min/)!

### Current Plugin Commands

- `!createClan` - Simplified mass-channel creation of Clan-Channels, sets permissions and properties of each channel and can creates a Clan-Group from template group.
- `!joinMe <userName>` - Requests another user to join your channel. Jarvis moves them if they accept. Permissions independent!
- `!purgeVerified` - Removes all users in a set Server Group which are not also lsited in a Verified Database File. Requires: ([steam-ts!](https://github.com/Forge-Media/steam-ts))
- `!cid` - Plugin used to return a message containing the 'cid' of the channel the client is in
- `!help` - Get help and command list

### Installation

---

First make sure that you actually have [Node.js](https://nodejs.org/en/) installed on your server. Then clone this GitHub repository to your machine:

```sh
$ mkdir jarvis-bot
$ git clone https://github.com/Forge-Media/teamspeak-bot.git jarvis-bot
$ cd jarvis-bot
```

Install the bot's dependencies via npm, using the following command:

```sh
$ npm install
```

After you have installed all the required dependencies via `npm install` it is required to edit:

- **config.js**
- **/plugins/PluginName.js** config settings

More documentation on that down below!

### Run Jarvis

---

#### Standard method

After having successfully edited the config the following command will launch the bot:

```sh
$ npm run jarvis
```

#### PM2 method

We recommend using [PM2](https://github.com/Unitech/pm2) to run the bot, PM2 is an excellent Production Runtime and Process Manager for Node.js applications. It allows you to keep applications alive forever, and more!

```sh
$ pm2 start app.js --name Jarvis
```

### Jarvis Configuration

---

Make sure you've renamed **config.example.js** to **config.js** before starting the bot, followed by adding your server query connection details, so that it can connect to your Teamspeak 3 server.

### Setup Plugins

---

**createClan**

Please make edit the following properties in **createClan.js** to match your Teamspeak 3 setup:

```javascript
const config = {
	owners: [14, 23], // Server group IDs allowed to use this plugin
	ssgid: 118, // Source ServerGroup ID for Clan-Group (requires: a template group setup in Teamspeak)
	sortID_start: 901, // Start value used to calculate clan ServerGroup 'i_group_sort_id' property
	sortID_inc: 100 // Increment value used for each letter of alphabet 'i_group_sort_id' property
};
```

---

**createClan Channel Template**

Only edit this file **plugins/contrib/channel.js** if you need to make changes to the channel-template the bot uses when creating channels. One such change may be the naming-scheme used for the parent channel, by changing: `"[cspacer123] ★ " + name + " ★"`

```javascript
this.name = parent == null ? "[cspacer123] ★ " + name + " ★" : name;
```

Other channel _properties_ and _permissions_ can be configured in this file!

### Development

---

Please do report the bugs you encounter!
If you'd like to improve this project feel free to start a pull request, it will be reviewed as fast as possible.

### Support

---

You can get support by either going to the [issues page](https://github.com/Forge-Media/teamspeak-bot/issues) or taking a look at the Jarvis documentation which explains how the bot's code works: [Jarvis Documentation](https://forge-media.github.io/teamspeak-bot/)

### By Jeremy Paton & Marc Berman

---

Copyright (c) Forge Gaming Network 2018

This work is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/)
