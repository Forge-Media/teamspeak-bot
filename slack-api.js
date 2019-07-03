const Bot = require("slackbots");

/**
 * This is a thin wrapper around slackbots,
 * which extends the functionality with updated Slack API end-points
 * @version 1.1
 * @property {object} params - Contains config settings for your slack bot API
 */
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
