/**
 * Phrases.js
 *
 * @description   Represents phrases stored by users
 * @docs          http://sailsjs.org/documentation/concepts/models-and-orm/models
 * @author Nagarjun Palavalli <me@nagarjun.co>
 */

module.exports = {

	attributes: {
		user: { model: 'users' },
		phrase: { type: 'string', required: true },
		hash: { type: 'string' }
	}
};

