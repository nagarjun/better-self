/**
 * Runs.js
 *
 * @description 	Stores a log with meta data each time messenger.js runs
 * @docs        	http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

	attributes: {
		users: { type: 'array', defaultsTo: [] },
		failed: { type: 'array', defaultsTo: [] } // Logs user IDs who could not receive the message
	}
};

