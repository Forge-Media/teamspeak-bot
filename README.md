[![David Dependency Status](https://david-dm.org/Forge-Media/teamspeak-bot.svg)](https://david-dm.org/Forge-Media/teamspeak-bot)
[![Maintainability](https://api.codeclimate.com/v1/badges/0957f4a29edc878ec073/maintainability)](https://codeclimate.com/github/Forge-Media/teamspeak-bot/maintainability)
# Jarvis Teamspeak-3 Bot
This project was made possible by [TS3-NodeJS-Library](https://github.com/Multivit4min/TS3-NodeJS-Library), special thanks to [Multivit4min](https://github.com/Multivit4min/)!
### Current Plugin Commands
----
```
!createClan - Simplified mass-channel creation for a clan-channels, sets the permissions and properties of each channel it creates
!cid - Plugin used to return a message containing the 'cid' of the channel the client is in
!help - Get help and command list
```
### Installation
----
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
After you have installed all the required dependencies via *npm install* it is **required to edit:
- __config.js__
- Any __/plugins/PluginName.js__ files which have config settings. 

More documentation on that down below!

### Run Jarvis
----
#### Standard method
After having successfully edited the config the following command will launch the bot:
```sh
$ npm run jarvis
```
#### PM2 method
We recommend using [PM2](https://github.com/Unitech/pm2) to run the bot, PM2 is an excellent Production Runtime and Process Manager for Node.js applications. It allows you to keep applications alive forever, and more!

### Jarvis Configuration
----

Make sure you've renamed __config.example.js__ to __config.js__ before starting the bot, followed by adding your server query connection details, so that it can connect to your Teamspeak 3 server. 

### Setup Plugins
----
__createClan__
Please make sure to add Server Group ID numbers which allow users to use the `!createClan` command, in __createClan.js__ 
```javascript
const owners = [14, 23];
```
----
__createClan Channel Template__

Only edit this file __plugins/contrib/channel.js__ if you need to make changes to the channel-template the bot uses when creating channels. One such change may be the naming-scheme used for the parent channel, by changing: `"[cspacer123] ★ " + name + " ★"`
```javascript
this.name = parent == null ? "[cspacer123] ★ " + name + " ★" : name;
```
Other channel _properties_ and _permissions_ can be configured in this file!

### Development
----
Please do report the bugs you encounter!
If you'd like to improve this project feel free to start a pull request, it will be reviewed as fast as possible.

### Support
----
You can get support by either going to the [issues page](https://github.com/Forge-Media/teamspeak-bot/issues).


### By Jeremy Paton & Marc Berman
----
Copyright (c) Forge Gaming Network 2018

This work is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/)
