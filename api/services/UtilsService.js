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
     * Converts strings like '4 AM' etc. to a numeric hour value (24 hour format) to 
     * store in the database
     * 
     * @param {string} displayHour A value from "12 AM" to "11 PM"
     * @author Nagarjun Palavalli <me@nagarjun.co>
     */
    parseMessageFrequencyString: function(displayHour) {

        var parsedHour = 0; // Always start with 12 AM

        if (displayHour === '12 PM') {
            return 12;
        }

        if (displayHour !== '12 AM') {
            var deconstructedTime = displayHour.split(' ');
            
            parsedHour = parseInt(deconstructedTime[0]);
            if (deconstructedTime[1] === 'PM') {
                parsedHour += 12;
            }
        }
        
        return parsedHour;
    },


    /**
     * Takes an array of hours like [4, 12] and returns a human-friendly 
     * string like '4 PM, 12 PM'.
     * 
     * @param {array} hoursArray An array of hours from 0 to 23
     * @author Nagarjun Palavalli <me@nagarjun.co>
     */
    humanFriendlyHours: function(hoursArray) {

        var friendlyStrings = [];
        for (var i = 0; i < hoursArray.length; i++) {
            var hour = hoursArray[i];
            
            if (hour === 0) {
                friendlyStrings.push('12 AM');
            } else if (hour === 12) {
                friendlyStrings.push('12 PM');
            } else if ((hour > 0) && (hour < 12)) {
                friendlyStrings.push(hour + ' AM');
            } else {
                friendlyStrings.push(hour - 12 + ' PM');
            }
        }

        return friendlyStrings.join(', ');
    }
};