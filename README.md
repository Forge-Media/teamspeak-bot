# Jarvis Teamspeak-3 Bot

![GitHub package.json version](https://img.shields.io/github/package-json/v/forge-media/teamspeak-bot.svg)
![Libraries.io dependency status for GitHub repo](https://img.shields.io/librariesio/github/Forge-Media/teamspeak-bot)
[![Maintainability](https://api.codeclimate.com/v1/badges/0957f4a29edc878ec073/maintainability)](https://codeclimate.com/github/Forge-Media/teamspeak-bot/maintainability)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/forge-media/teamspeak-bot.svg)

This project was made possible by [TS3-NodeJS-Library](https://github.com/Multivit4min/TS3-NodeJS-Library), special thanks to [Multivit4min](https://github.com/Multivit4min/)!

## Included Plugin Commands

- `!registerCSGO <Steam64id>`|`!deregisterCSGO`|`!statusCSGO` - Registers a user's Steam ID to obtain their CSGO Rank as a server group. Can check status and deregister.
- `!createClan` - A simplified CLI-style mass-channel creator for the creation of clan channels and an associative server group. Sets permissions and properties of each channel automatically.
- `!joinMe <userName>` - Requests another user to join your channel, independent of a user's permissions. Client moved if they accept.
- `!purgeVerified` - Used to remove all users in a set Server Group which are not listed in [Steam-TS's](https://github.com/Forge-Media/steam-ts) Verified Database File.
- `!cid` - Returns a message containing the channel ID of the channel the client is in.
- `!help` - Provides bot help and available command list

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

## Jarvis Configuration

Make sure you've renamed **config.example.js** to **config.js** before starting the bot, followed by adding your server query connection details, so that it can connect to your Teamspeak 3 server.

Edit the following configuration files:

- **config.js**
- **/plugins/PluginName.js** config settings

More documentation on setting up plugins below!

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

## Setup Plugins

#### The following plugin's require configuration to be used, see these links to the wiki for help:

- `!createClan` - [How to setup the !createClan plugin?](https://github.com/Forge-Media/teamspeak-bot/wiki/Plugin-Configuration#createclan)
- `!joinMe <userName>` - [How to setup the !joinMe plugin?]()
- `!purgeVerified` - [How to setup the !purgeVerified plugin?](https://github.com/Forge-Media/teamspeak-bot/wiki/Plugin-Configuration#purgeverified) **Requires: [steam-ts!](https://github.com/Forge-Media/steam-ts)**

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

This work is licensed under a [Mozilla Public License 2.0](https://github.com/Forge-Media/teamspeak-bot/blob/master/LICENSE)
