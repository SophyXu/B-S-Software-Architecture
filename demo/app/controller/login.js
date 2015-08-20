/**
 * Created by xxy on 15/6/17.
 */
var mongoose = require('mongoose');
var User = mongoose.model('User');
var crypto = require('./crypto');
var email;

module.exports = function(){
	var current = 'red';
	var _res  = arguments[0];
	var _req  = arguments[1];

	this.checkSession = function(model){
		if(model == 'login'){
			return true;
		}else if(sessionLib.username && sessionLib.username != '') {
			return true;
		}
		return false;
	}

	this.login = function(){
		var room = lib.config.get(CONF + 'room.json', '');
		lib.httpParam.POST('username', function(value){
			var username = value['username'];
			var password = value['password'];

			if(username == '') {
				_res.render(VIEW + 'index.jade', {'enter' : 0});
				return;
			}
			if(password == '') {
				_res.render(VIEW + 'index.jade', {'enter' : 1});
				return;
			}
            //console.log('username: ', username);
			//console.log('password', crypto.encrypt(password));

			User.findOne({ username: username }, function(err, thor) {
				if (err) {
					return console.error(err);
				}
				if(thor == null) {
					_res.render(VIEW + 'index.jade', {'enter' : 2});
					return;
				}
				if(thor.password != crypto.encrypt(password)) {
					_res.render(VIEW + 'index.jade', {'enter' : 3});
					return;
				} else {
					//console.log('Login success.');
					//console.log(thor.email);
					email = thor.email;

					sessionLib.username = value['username'];
					_res.render(VIEW + 'main.jade', {'user' : username, 'rooms' : room});
					var time = 0;
				}
			});
		});
		return;
	}

	this.modify = function() {
		_res.render(VIEW + 'modify.jade', {'user' : sessionLib.username, 'signal' : 0});
		return;
	}

	this.change = function() {
		lib.httpParam.POST('passO', function(value){
			console.log(sessionLib.username);
			User.findOne({ username:sessionLib.username }, function(err, thor) {
				if (err) {
					return console.error(err);
				}
				if(thor.password != crypto.encrypt(value['passO'])) {
					_res.render(VIEW + 'modify.jade', {'user' : sessionLib.username, 'signal' : 1});
					return;
				} else {
					if(value['passM'] != value['passReM']) {
						_res.render(VIEW + 'modify.jade', {'user' : sessionLib.username, 'signal' : 2});
						return;
					}
					var newPassword = crypto.encrypt(value['passM']);
					User.findOneAndUpdate({username:sessionLib.username},{password:newPassword},{},function(err,user){
						_res.render(VIEW + 'modify.jade', {'user' : sessionLib.username, 'signal' : 3});
					});
				}
			});
		});
	}

	this.rank = function() {
		_res.render(VIEW + 'rank.jade', {'user' : sessionLib.username});
	}

	this.room = function() {
		var room = lib.config.get(CONF + 'room.json', '');
		_res.render(VIEW + 'main.jade', {'user' : sessionLib.username, 'rooms' : room});
		return;
	}

	this.info = function() {
		User.findOne({ username: sessionLib.username }, function(err, thor) {
			/* MongDB Error */
			if (err) {
				return console.error('Info  error: ', err);
			}

			_res.render(VIEW + 'info.jade', {'user' : sessionLib.username, 'email' : thor['email'], 'score': thor['score']});
			return;
		});
	}

	this.enterRoom = function(){
		var roomId = lib.httpParam.GET('room_id');

		if(!onlineList[roomId]){
			onlineList[roomId] = [];
		}

		if(!onlineList[roomId]['type']){
			onlineList[roomId]['type'] = {};
		}

		var time = 0;
		io.sockets.on('connection', function (socket){
			var  username = sessionLib.username;
			if(!username){
				return;
			}
			if(!onlineList[roomId][username] ){
				onlineList[roomId][username] = socket;
			}
			var refresh_online = function(){
				var n = [];
				var athlete = '';
				for (var i in onlineList[roomId]){
					if(i != 'type'){
						n.push(i);
					}
				}
				switch(n.length){
					case 1 : athlete = 'red';
						break;
					case 2 : athlete = 'black';
						break;
					default : athlete = 'visitor';
						break;
				}
				if(n.length > 1){
					publicMsg(roomId, 'start', {'msg':'start game'})
				}
				//console.log(athlete);
				onlineList[roomId]['type'][username] = athlete;
				onlineList[roomId][username] = socket;
				socket.emit('type', {'type' : athlete});
			}
			//确保每次发送一个socket消息
			if(time > 0){
				return;
			}

			refresh_online();

			socket.on('msg', function(data){
				data['ret'] = 0;
				data['next'] = current == 'red' ? 'black' : 'red';
				current = data['next'];
				publicMsg(roomId, 'msg', data)
			});

			socket.on('disconnect', function(){
				delete onlineList[roomId][username];
				delete onlineList[roomId]['type'][username];
				publicMsg(roomId, 'game_over', {'msg':'The player has left the room.'});
				refresh_online();
			});

			socket.on('score', function(){

			});
			time++;
		});
		var readPath = VIEW +lib.url.parse('index.html').pathname;
		var indexPage = lib.fs.readFileSync(readPath);
		_res.writeHead(200, { 'Content-Type': 'text/html' });
		_res.end(indexPage);
	}

	function publicMsg(roomId, type, msg){
		for (var i in onlineList[roomId]){
			if(i != 'type'){
				onlineList[roomId][i].emit(type, msg);
			}
		}
	}
}