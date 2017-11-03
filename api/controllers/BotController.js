/**
 * BotController
 *
 * @description     Server-side logic for interacting with users
 * @help            See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    /**
     * This method handles incoming messages from Telegram 
     * users and automatically routes it to other handler 
     * methods based on a number of parameters.
     * 
     * @param {object} req The request object
     * @param {object} res The response object
     * @author Nagarjun Palavalli <me@nagarjun.co>
     * 
     * @api 			{post} /telegram-webhook Telegram - Webhook
     * @apiVersion 		1.0.0
     * @apiName 		telegram-webhook
     * @apiGroup 		Bot
     * @apiDescription  Handles incoming messages from Telegram users and responds 
     *                  to the user based on the message content.
     *
     * @apiHeader       {string} Content-Type Must be 'application/json'
     */
    telegramWebhook: function(req, res) {

        // First validate the request body
        var params = req.body,
            Joi = require('joi');

        Joi.validate(params, {
            update_id: Joi.number().required(),
            message: Joi.object(),
            edited_message: Joi.object(),
            channel_post: Joi.object(),
            edited_channel_post: Joi.object(),
            inline_query: Joi.object(),
            chosen_inline_result: Joi.object(),
            callback_query: Joi.object(),
            shipping_query: Joi.object(),
            pre_checkout_query: Joi.object()
        }, function(error, value) {

            // Make sure the chat ID is avilable to send a response
            if (error) {
                sails.log(error);
                return res.end('Uh oh! I couldn\'t understand your message.');
            }

            if (params.hasOwnProperty('message')) {
                // Find or create the user
                Users.findOrCreate({
                    telegramId: params.message.from.id + '',
                    isTelegramBot: params.message.from.is_bot,
                    firstName: params.message.from.first_name
                }).exec(function(error, user) {

                    if (error) {
                        sails.log.error(error);
                        return res.serverError('Database error. Unable to fulfill your request.');
                    }
                    
                    // Update the Telegram Chat ID if it has changed, otherwise, continue
                    if (user.telegramChatId) { params.message.chat.id += ''; }
                    if (params.message.chat.id !== user.telegramChatId) {
                        user.telegramChatId = params.message.chat.id;
                        user.save(function(error) {

                            if (error) {
                                sails.log.error(error);
                                return res.serverError('Database error. Unable to fulfill your request.');
                            }

                            sails.controllers.bot.parseMessage(req, res, user);
                        });
                    } else {
                        sails.controllers.bot.parseMessage(req, res, user);
                    }
                });
            } else {
                return res.end('Hmm.. I\'m not sure what to do.');
            }
        });
    },


    /**
     * A private function that handles the parsing of new incoming messages 
     * from Telegram
     * 
     * @param {object} req The request object from telegramWebhook
     * @param {object} res The response object from telegramWebhook
     * @param {object} user The user object from the database
     * @author Nagarjun Palavalli <me@nagarjun.co>
     */
    parseMessage: function(req, res, user) {

        var message = req.body.message;

        // Check if the user is simply setting their message frequency
        var messageFrequencies = ['Twice a day', 'Once a day'];
        if (messageFrequencies.indexOf(message.text) > -1) {
            sails.controllers.bot.saveMessageFrequency(req, res, user);
        } else {
            // Perform an action based on the message text
            switch (message.text) {
                case '/start':
                    sails.controllers.telegram.sendMessage(req, res, {
                        chat_id: message.chat.id,
                        text: 'Hello there, ' + message.from.first_name + '! 👋 \n\nI\'ll periodically send you phrases that you find inspiring. To get started, simply send me a message and I\'ll save that as a phrase.'
                    });
                    break;
                
                case '/get':
                    sails.controllers.bot.getRandomPhrase(req, res, user);
                    break;
                
                case '/edit':
                    var editUrl = process.env.APPLICATION_URL + '/' + user.id + '/phrases';
                    sails.controllers.telegram.sendMessage(req, res, {
                        chat_id: message.chat.id,
                        text: 'View and manage your phrases here: [' + editUrl + '](' + editUrl + ')',
                        parse_mode: 'Markdown'
                    });
                    break;
                
                case '/settings':
                    sails.controllers.telegram.sendMessage(req, res, {
                        "chat_id": message.chat.id,
                        "text": "How often should I send you inspiring phrases from your list?",
                        "reply_markup": {
                            "keyboard": [
                                [ { "text": "Twice a day" } ],
                                [ { "text": "Once a day" } ]
                            ]
                        }
                    });
                    break;

                default:
                    sails.controllers.bot.savePhrase(req, res, user);
                    break;
            }
        }
    },


    /**
     * A private function that sends the user a random phrase from 
     * their list
     * 
     * @param {object} req The request object from telegramWebhook
     * @param {object} res The response object from telegramWebhook
     * @param {object} user The user object from the database
     * @author Nagarjun Palavalli <me@nagarjun.co>
     */
    getRandomPhrase: function(req, res, user) {

        var message = req.body.message;

        Phrases.find({ user: user.id }).exec(function(error, userPhrases) {

            if (error) {
                sails.log.error(error);
                return sails.controllers.telegram.sendMessage(req, res, {
                    chat_id: message.chat.id,
                    text: 'Uh oh! I couldn\'t access your phrases. Please try again later.'
                });
            }

            if (userPhrases.length < 1) {
                return sails.controllers.telegram.sendMessage(req, res, {
                    chat_id: message.chat.id,
                    text: 'Looks like you didn\'t save any phrases yet. Send me one now so I can save it. 🙂'
                });
            }

            return sails.controllers.telegram.sendMessage(req, res, {
                chat_id: message.chat.id,
                text: '💡 *Time for some inspiration..* \n\n' + userPhrases[UtilsService.getRandomInt(0, userPhrases.length)].phrase,
                parse_mode: 'Markdown'
            });
        });
    },


    /**
     * A private function to save the user's message frequency
     * 
     * @param {object} req The request object from telegramWebhook
     * @param {object} res The response object from telegramWebhook
     * @param {object} user The user object from the database
     * @author Nagarjun Palavalli <me@nagarjun.co>
     */
    saveMessageFrequency: function(req, res, user) {

        var message = req.body.message;

        user.messageFrequency = UtilsService.parseMessageFrequencyString(message.text);
        user.save(function(error) {

            if (error) {
                sails.log.error(error);
                return sails.controllers.telegram.sendMessage(req, res, {
                    chat_id: message.chat.id,
                    text: 'Uh oh! I couldn\'t update your message frequency. Please try again later.'
                });
            }

            return sails.controllers.telegram.sendMessage(req, res, {
                chat_id: message.chat.id,
                text: 'Ok, I\'ll send you an inspiring phrase ' + message.text.toLowerCase() + '.'
            });
        });
    },


    /**
     * A private function to save new phrases
     * 
     * @param {object} req The request object from telegramWebhook
     * @param {object} res The response object from telegramWebhook
     * @param {object} user The user object from the database
     * @author Nagarjun Palavalli <me@nagarjun.co>
     */
    savePhrase: function(req, res, user) {
        
        var message = req.body.message;

        // Generate a hash of the 
        var md5 = require('md5');
        var hash = md5(message.text);

        Phrases.findOne({
            user: user.id,
            hash: hash
        }).exec(function(error, existingPhrase) {

            if (error) {
                sails.log.error(error);
                return res.serverError('Database error. Unable to fulfill your request.');
            }

            if (existingPhrase) {
                return sails.controllers.telegram.sendMessage(req, res, {
                    chat_id: message.chat.id,
                    text: 'This phrase was already saved before. I\'ll be sure to remind you of it from time to time.'
                });
            } else {
                Phrases.create({
                    user: user.id,
                    phrase: message.text,
                    hash: hash
                }).exec(function(error, phrase) {

                    if (error) {
                        sails.log.error(error);
                        return res.serverError('Database error. Unable to fulfill your request.');
                    }

                    // Send the user a confirmation message
                    return sails.controllers.telegram.sendMessage(req, res, {
                        chat_id: message.chat.id,
                        text: 'Done! I saved the phrase and will remind you of it from time to time.'
                    });
                });
            }
        });
    }
};