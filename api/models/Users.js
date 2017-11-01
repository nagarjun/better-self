/**
 * Users.js
 *
 * @description 	Represents a single Telegram user
 * @docs        	http://sailsjs.org/documentation/concepts/models-and-orm/models
 * @author 			Nagarjun Palavalli <me@nagarjun.co>
 */
module.exports = {

    attributes: {
        // Telegram
        telegramId: { type: 'string', unique: true, required: true },
        isTelegramBot: { type: 'boolean', defaultsTo: false },
        telegramChatId: { type: 'string', defaultsTo: null },

        // User
        firstName: { type: 'string', required: true }
    }
};