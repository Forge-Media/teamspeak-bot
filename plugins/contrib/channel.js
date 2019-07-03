// Channel Template Class
class Channel {
	constructor(name, parent) {
		this.cid = null;
		this.properties = this.setProperties();
		this.permissions = this.setPermissions();
		if (!parent) {
			this.makeParent();
			this.name = `[cspacer123] ★ ${name} ★`;
		} else {
			this.parent = parent;
			this.name = name;
		}
	}
	
	setProperties() {
		return {
			channel_codec: 4,
			channel_codec_quality: 10,
			// Channel flags are boolean, but represented by 0 = false and 1 = true
			channel_flag_default: 0,
			channel_flag_password: 0,
			channel_flag_permanent: 1,
			channel_flag_semi_permanent: 0,
			channel_flag_maxclients_unlimited: 1,
			channel_flag_maxfamilyclients_unlimited: 1,
			channel_maxclients: -1,
			channel_maxfamilyclients: -1,
			channel_needed_talk_power: 0,
			channel_topic: "",
			channel_cpid: 0
		};
	}

	setPermissions() {
		return {
			i_channel_needed_modify_power: 70,
			i_channel_needed_delete_power: 70,
			i_channel_needed_join_power: 35,
			i_channel_needed_permission_modify_power: 70
		};
	}

	makeParent() {
		this.properties.channel_codec_quality = 0;
		// Make sure no user can enter channel
		this.properties.channel_flag_maxfamilyclients_unlimited = 0; 
		this.properties.channel_flag_maxclients_unlimited = 0;
		this.properties.channel_maxfamilyclients = 0;
		this.properties.channel_maxclients = 0;
		this.permissions.i_channel_needed_delete_power = 75;
		this.permissions.i_channel_needed_modify_power = 75;
		this.permissions.i_channel_needed_join_power = 75;
		this.permissions.i_channel_needed_permission_modify_power = 75;
	}
}

module.exports = Channel;
