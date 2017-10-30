/**
 * TelegramController
 *
 * @description     Server-side logic to interact with Telegram
 * @help            See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    /**
     * Sends a message to a specific Telegram chat based 
     * on the supplied message parameters
     * 
     * @param {object} req The request object
     * @param {object} res The response object
     * @param {object} message The Telegram message object
     * @see https://core.telegram.org/bots/api#sendmessage
     * @author Nagarjun Palavalli <me@nagarjun.co>
     */
    sendMessage: function(req, res, message) {

        var request = require("request");

        var options = {
            method: 'POST',
            url: process.env.TELEGRAM_HOST + '/sendMessage',
            headers: {
                'cache-control': 'no-cache',
                'content-type': 'application/json'
            },
            body: message,
            json: true
        };

        request(options, function(error, response, body) {

            if (error) {
                sails.log.error(error);
                return res.end('Unable to send the message.');
            }

            // Message sent to Telegram
            return res.end('Message sent!');
        });
    }
};