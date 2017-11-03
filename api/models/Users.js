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
        firstName: { type: 'string', required: true },
        messageFrequency: { type: 'number', defaultsTo: 2 }
    },


    beforeUpdate: function(values, next) {

        // Set messageFrequency based on the supplied human-friendly value
        if (values.hasOwnProperty('messageFrequency')) {
            switch (values.messageFrequency) {
                case 'Twice a day':
                    values.messageFrequency = 2;
                    break;
                
                case 'Once a day':
                    values.messageFrequency = 1;
                    break;
            
                default:
                    break;
            }

            cb();
        } else {
            cb();
        }
    }
};