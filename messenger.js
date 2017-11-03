/**
 * messenger.js
 * 
 * Sends a random phrase to each user in the Users collection 
 * based on their message interval setting
 */

// Load environment variables if not running as production
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').load();
}

// First load dependencies
var Waterline = require('waterline');
var mongoDbAdapter = require('sails-mongo');
var moment = require('moment');

// Create a new Waterline instance
var waterline = new Waterline();

// Model definitions
var usersModel = require('./api/models/Users.js'),
	phrasesModel = require('./api/models/Phrases.js');

var usersCollection = Waterline.Collection.extend({
	identity: 'users',
	connection: 'default',
	attributes: usersModel.attributes
});

var phrasesCollection = Waterline.Collection.extend({
	identity: 'phrases',
	connection: 'default',
	attributes: phrasesModel.attributes
});

// Attach models to the running Waterline instance
waterline.loadCollection(usersCollection);
waterline.loadCollection(phrasesCollection);

// Configure and initialize the Waterline instance
var config = {
	adapters: {
		'sails-mongo': mongoDbAdapter
	},
	connections: {
		// Local
		default: {
			adapter: 'sails-mongo',
			host: 'localhost',
			port: 27017,
			// user: '',
			// password: '',
			database: 'better-self'
		},

		// Production
		// default: {
		// 	adapter: 'sails-mongo',
		// 	url: process.env.MONGODB_CONNECTION_STRING,
		// 	ssl: true
		// }
	}
};

var Users, Phrases;
waterline.initialize(config, function(error, waterlineInstance) {

	if (error) {
		console.error(error);
		return process.exit(1);
	}

	// Test out fully initialized models
	Users = waterlineInstance.collections.users;
	Phrases = waterlineInstance.collections.phrases;

	// Check UTC time to send messages based on users.messageFrequency
	var utcNow = moment().utc();
	
	switch (utcNow.hours()) {
		case 8:
			sendMessages({}); // Send to all users
			break;
		
		case 16:
			sendMessages({ messageFrequency: 2 }); // Send only to users who want to see messages twice a day
			break;
	
		default:
			process.exit();
			break;
	}
});


/**
 * Responsible for sending messages to users based on 
 * the supplied databaseQuery
 * 
 * @param {object} databaseQuery The query to perform when searching for users
 */
function sendMessages(databaseQuery) {

	Users.find(databaseQuery).exec(function(error, userList) {

		if (error) {
			console.error(error);
			return process.exit(1);
		}

		var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID,
			request = require('request'),
			async = require('async');
		
		var messageCount = 0;
		async.each(userList, function(user, callback) {

			Phrases.native(function(error, collection) {

				if (error) {
					callback(error);
				}

				collection.aggregate([
					{ $match: { user: new ObjectId(user.id) } },
					{ $sample: { size: 1 } }
				]).toArray(function(error, phrase) {
					
					if (error) {
						callback(error);
					}

					if (phrase.length > 0) {
						phrase = phrase[0];

						var options = {
							method: 'POST',
							url: process.env.TELEGRAM_HOST + '/sendMessage',
							headers: {
								'cache-control': 'no-cache',
								'content-type': 'application/json'
							},
							body: {
								chat_id: user.telegramChatId,
								text: '💡 *Time for some inspiration..* \n\n' + phrase.phrase,
								parse_mode: 'Markdown'
							},
							json: true
						};
				
						request(options, function(error, response, body) {
				
							if (error) {
								callback('Unable to send the message.');
							}
							
							messageCount++;
							
							callback();
						});
					} else {
						callback();
					}
				});
			});
		}, function(error) {

			if (error) {
				console.error(error);
				return process.exit(1);
			}

			// Log this run
			console.log('Sent messages to ' + messageCount + ' users.');

			return process.exit();
		});
	});
}