/**
 * Created by xxy on 15/6/17.
 */
var mongoose = require('mongoose');
var User = mongoose.model('User');
var crypto = require('./crypto');

module.exports = function() {
    var _res  = arguments[0];
    var _req  = arguments[1];

    this.register = function() {
        _res.render(VIEW + 'register.jade', {'signal' : 0});
        return;
    }

    this.create = function() {
        lib.httpParam.POST('user', function(value){
            username = value['user'];
            password = value['pass'];
            email = value['email'];

            //console.log(crypto.encrypt(password));
            if(username == '') {
                _res.render(VIEW + 'register.jade', {'signal' : 1});
                return;
            }
            if(password == '' || value['passRe'] == '') {
                _res.render(VIEW + 'register.jade', {'signal' : 2});
                return;
            }
            if(password != value['passRe']) {
                _res.render(VIEW + 'register.jade', {'signal' : 3});
                return;
            }

            User.findOne({ username: username }, function(err, thor) {
                /* MongDB Error */
                if (err) {
                    return console.error('save error: ', err);
                }

                console.log(thor);
                /* Already in database */
                if (thor != null) {
                    _res.render(VIEW + 'register.jade', {'signal' : 4});
                    return;
                }

                /* MongoDB Insert */
                var test = new User({
                    username: username,
                    password: crypto.encrypt(password),
                    email: email,
                    score: 0
                });

                test.save(function(err, test) {
                    if (err) return console.error('save error: ', err);

                    _res.render(VIEW + 'index.jade', {'enter' : 5});
                    return;
                });
            });

        });
    }
}