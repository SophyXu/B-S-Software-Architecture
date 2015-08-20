/**
 * Created by xxy on 15/6/18.
 */
var mongoose = require('mongoose');

/* Connect Mongodb */
var db = mongoose.connection;

db.on('error', console.error);
db.once('open', function() {
    var userSchema = new mongoose.Schema({
        username: String,
        password: String,
        email: String,
        score: Number
    });

    var User = mongoose.model('User', userSchema);

    console.log('MongoDB Open')
});

mongoose.connect('mongodb://localhost/test');