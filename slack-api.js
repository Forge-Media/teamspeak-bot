/**
 * An attempt to extend slackbots Bot class.
 * As the existing class lacks new slack api end points.
 * Wish me luck
 * @module Bot Extends Bot Plugin-slackBot
 */

const Bot = require("slackbots");

class slackBot extends Bot {
	constructor(params) {
		super(params);
	}

	/**
	 * Get conversation list
	 * @property {object} params - Object containing parameters such as types: public_channel
	 * @returns {vow.Promise}
	 */
	getConversations(params) {
		return this._api("conversations.list", params);
	}
}

module.exports = slackBot;
