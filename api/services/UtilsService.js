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
    }
};