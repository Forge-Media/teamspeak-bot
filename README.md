# Jarvis Teamspeak-3 Bot

![GitHub package.json version](https://img.shields.io/github/package-json/v/forge-media/teamspeak-bot.svg)
[![David Dependency Status](https://david-dm.org/Forge-Media/teamspeak-bot.svg)](https://david-dm.org/Forge-Media/teamspeak-bot)
[![Maintainability](https://api.codeclimate.com/v1/badges/0957f4a29edc878ec073/maintainability)](https://codeclimate.com/github/Forge-Media/teamspeak-bot/maintainability)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/forge-media/teamspeak-bot.svg)

This project was made possible by [TS3-NodeJS-Library](https://github.com/Multivit4min/TS3-NodeJS-Library), special thanks to [Multivit4min](https://github.com/Multivit4min/)!

## Included Plugin Commands

- `!createClan` - Simplified mass-channel creation of Clan-Channels, sets permissions and properties of each channel and can creates a Clan-Group from template group.
- `!joinMe <userName>` - Requests another user to join your channel. Jarvis moves them if they accept. Permissions independent!
- `!purgeVerified` - Removes all users in a set Server Group which are not also lsited in a Verified Database File. **Requires: [steam-ts!](https://github.com/Forge-Media/steam-ts)**
- `!cid` - Plugin used to return a message containing the 'cid' of the channel the client is in
- `!help` - Get help and command list

## Install

Make sure you have [Node.js](https://nodejs.org/en/) installed. Clone this GitHub repository to your environment:

```sh
$ mkdir jarvis-bot
$ git clone https://github.com/Forge-Media/teamspeak-bot.git jarvis-bot
$ cd jarvis-bot
```

Install the bot via npm:

```sh
$ npm install
```

Edit the following configuration files:

- **config.js**
- **/plugins/PluginName.js** config settings

More documentation on this below!

## Run Jarvis

#### Standard method

After edited all config settings, run the following command to launch the bot:

```sh
$ npm run jarvis
```

#### PM2 method

I recommend using [PM2](https://github.com/Unitech/pm2) to run the bot, PM2 is an excellent Production Runtime and Process Manager for Node.js applications. It allows you to keep applications alive forever:

```sh
$ pm2 start app.js --name Jarvis
```

## Jarvis Configuration

Make sure you've renamed **config.example.js** to **config.js** before starting the bot, followed by adding your server query connection details, so that it can connect to your Teamspeak 3 server.

## Setup Plugins

#### The following plugin's require configuration to be used, see these links to the wiki for help:

- `!createClan` - How to setup the !createClan plugin?
- `!joinMe <userName>` - How to setup the !joinMe plugin?
- `!purgeVerified` - How to setup the !purgeVerified plugin? **Requires: [steam-ts!](https://github.com/Forge-Media/steam-ts)**


## Development

Please report any bugs you encounter!
If you'd like to improve this project feel free to start a pull request, it will be reviewed as fast as possible.

## Support

You can get support by either going to the [issues page](https://github.com/Forge-Media/teamspeak-bot/issues) or taking a look at the Jarvis documentation which explains how the bot's code works: [Jarvis Documentation](https://forge-media.github.io/teamspeak-bot/)

## Change Logs

[Please see releases](https://github.com/Forge-Media/teamspeak-bot/releases)

## Authors

- Jeremy Paton (Development and Documentation)
- Marc Berman (Assistance and testing)

Copyright (c) Forge Gaming Network 2018

This work is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/)
