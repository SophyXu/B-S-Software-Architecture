/**
 * Created by xxy on 15/6/17.
 */
var crypto = require('crypto');

module.exports = {
    encrypt : function(plain) {
        return crypto.createHash('md5').update(plain).digest('Hex');
    }
};