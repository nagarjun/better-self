/**
 * UtilsService.js
 *
 * @description 	Utility methods
 * @author 			Nagarjun Palavalli <me@nagarjun.co>
 */
module.exports = {

    /**
     * Returns a random int from the specified min and max. The 
     * maximum is exclusive and the minimum is inclusive.
     * 
     * @param {integer} min The minimum value
     * @param {integer} max The maximum value
     * @author Nagarjun Palavalli <me@nagarjun.co>
     */
    getRandomInt: function(min, max) {

        min = Math.ceil(min);
        max = Math.floor(max);
        
        return Math.floor(Math.random() * (max - min)) + min;
    },


    /**
     * Converts strings like 'Twice a day' etc. to 
     * a numeric value to store in the database
     * 
     * @param {string} frequency The message frequency string from the request
     * @author Nagarjun Palavalli <me@nagarjun.co>
     */
    parseMessageFrequencyString: function(frequency) {

        var parsedFrequency = null;
        
        switch (frequency) {
            case 'Twice a day':
                parsedFrequency = '2';
                break;
            
            case 'Once a day':
                parsedFrequency = '1';
                break;
        
            default:
                break;
        }

        return parsedFrequency;
    }
};