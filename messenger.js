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
	phrasesModel = require('./api/models/Phrases.js'),
	runsModel = require('./api/models/Runs.js');

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

var runsCollection = Waterline.Collection.extend({
	identity: 'runs',
	connection: 'default',
	attributes: runsModel.attributes
});

// Attach models to the running Waterline instance
waterline.loadCollection(usersCollection);
waterline.loadCollection(phrasesCollection);
waterline.loadCollection(runsCollection);

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
	},
	defaults: {
		migrate: 'alter'
	}
};

var Users, Phrases, Runs;
waterline.initialize(config, function(error, waterlineInstance) {

	if (error) {
		console.error(error);
		return process.exit(1);
	}

	// Test out fully initialized models
	Users = waterlineInstance.collections.users;
	Phrases = waterlineInstance.collections.phrases;
	Runs = waterlineInstance.collections.runs;

	// Send messages to users
	sendMessages();
});


/**
 * Responsible for sending messages to users based on 
 * the UTC time
 */
function sendMessages() {

	var utcNow = moment().utc();

	Users.find({
		chatDeleted: false,
		messageFrequency: utcNow.hours()
	}).exec(function(error, userList) {

		if (error) {
			console.error(error);
			return process.exit(1);
		}

		var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID,
			request = require('request'),
			async = require('async');
		
		var recipients = [],
			failedRecipients = [];
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
								text: '💡 \n\n' + phrase.phrase,
								parse_mode: 'Markdown'
							},
							json: true
						};
				
						request(options, function(error, response, body) {
				
							if (error) {
								callback('Unable to send the message.');
							}
							
							if ((!body.ok) && (body.error_code === 403)) {
								// User blocked the app
								Users.update({ id: user.id }, { chatDeleted: true }).exec(function(error) {

									if (error) {
										console.warn('APPALERT: Unable to block user with ID: ' + user.id);
									}
									
									failedRecipients.push(user.id);

									callback();
								});
							} else if (!body.ok) {
								// Something happened, move onto next user
								console.warn('APPALERT: Unable to send a message to user with ID: ' + user.id);
								failedRecipients.push(user.id);
								callback();
							} else {
								recipients.push(user.id);
								callback();
							}
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
			Runs.create({
				users: recipients,
				failed: failedRecipients
			}).exec(function(error, run) {

				if (error) {
					console.error(error);
				}

				return process.exit();
			});
		});
	});
}