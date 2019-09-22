class firebaseHelper {
	constructor(botName) {
		this.botName = botName;
		this.firebase = require("firebase-admin");
		this.serviceAccount = require("../config/serviceAccountKey.json");
		this.firebase.initializeApp({
			credential: this.firebase.credential.cert(this.serviceAccount)
		});
		this.db = this.firebase.firestore();
		this.availableCollections();
	}

	availableCollections() {
		this.db.listCollections().then(collections => {
			console.info(`${this.botName}:`, "Accessing Firebase Database...");
			for (let collection of collections) {
				console.info(`Found collection: ${collection.id}`);
			}
		});
	}
}

module.exports = firebaseHelper;
