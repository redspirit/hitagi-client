/*
	Hitagi Server protocol framework v1.0 dev / 01.11.2012
	Author: Tayanchin Alexey
	Homepage: http://redspirit.ru
*/

function hitagiCreate(serverIp, serverPort){
	var socket, isFirstConn = true;
	var cookTime = 90; // login cookie = 90 days
	var cookName = 'chatauth';
	var chat = {};
	var ways;
	var user = {'online':false};
	var rooms = {};
	
	chat.response = {};
	
	chat.connect = function(){
		// connect to server
		if(typeof(io)=='undefined'){
			return false;
		}
		socket = io.connect('http://'+serverIp+':'+serverPort);
		socket.on('connect', function(){
			if(isFirstConn){
				socket.on('message', onRecive);
				socket.on('disconnect', onDisconnect);
				isFirstConn = false;
			}
			chat.response.onConnect();
		});
		return true;
	}
	
	chat.disconnect = function(){
		socket.disconnect();
	}
	
	function onRecive(data){
		var tp = data.type;
		//console.log(data);
		if(typeof(ways[tp])=='function') ways[tp](data);
	}
	
	function onDisconnect(){
		//socket = {}; // hard destroy socket
		chat.response.onDisconnect();
	}
	
	function sendJSON(tp, data){
		data.type = tp;
		socket.json.send(data);
	}
	
	chat.getUserInfo = function(){
		return user;
	}
	chat.setCurrentRoom = function(r){
		rooms.current = r;
		return true;
	}
	chat.getCurrentRoom = function(){
		return rooms.current;
	}
	chat.getRooms = function(){
		return rooms;
	}	
	
	
	function gnick(name){
		return rooms[rooms.current]['users'][name]['nick'];
	}
	function sendResponse(event, err, data){
		if(typeof(chat.response[event])=='function') chat.response[event](err,data);
	}
	function getCommonPriv(rp, gp){
		var p = 4;
		if(rp==2) p = 2;
		if(rp==1) p = 3;
		if(rp==3) p = 5;
		if(gp<=1) p = 1;
		return p;
	}
	
	
	/********     RESPONSE     ********/
	
	ways = {
		'auth':function(pr){
			if(pr.status=='ok'){
				user.online = true;
				user.privilege = pr.privilege;
				user.nick = pr.nickname;
				user.login = pr.login;
				user.avasrc = pr.url;
				user.textcolor = pr.textcolor,
				user.statustext = pr.statustext;	
				user.type = 'normal';
				sendResponse('onLogin', false, user);
				cookie(cookName, "norm;"+user.login+";"+user.pass, {expires:cookTime});
			} else {
				user.online = false;
				if(pr.reason=='userblocked'){
					sendResponse('onLogin', 'blocked', pr.message);
				} else {
					sendResponse('onLogin', true, pr.reason);
				}
			}
		},
		'vkauth':function(pr){
			if(pr.status=='ok'){
				user.online = true;
				user.privilege = pr.privilege;
				user.nick = pr.nickname;
				user.login = pr.login;
				user.avasrc = pr.url;
				user.textcolor = pr.textcolor,
				user.statustext = pr.statustext;				
				user.type = 'vk';				
				sendResponse('onLogin', false, user);
				cookie(cookName, "vk;"+user.vkuid+";"+user.vkhash, {expires:cookTime});	
			} else {
				user.online = false;
				if(pr.reason=='userblocked'){
					sendResponse('onLogin', 'blocked', pr.message);
				} else {
					sendResponse('onLogin', true, pr.reason);
				}
			}
		},
		'joinroom':function(pr){
			if(pr.status=='ok'){
	
				for(var us in pr.users){
					pr.users[us].commonPriv = getCommonPriv(pr.users[us].roomPriv, pr.users[us].globPriv);
				}
			
				var roomInfo = {
					name:pr.name,
					users:pr.users,
				//	messages:pr.messages,
					caption: pr.caption,
					topic: pr.topic,
					commonPriv: pr.users[user.login].commonPriv,
					roomPriv: pr.users[user.login].roomPriv,
					globPriv: pr.users[user.login].globPriv					
				};
				rooms[pr.name] = {
					caption: pr.caption,
					topic: pr.topic,
					users: pr.users
				}
				
				sendResponse('onJoinRoom', false, roomInfo);
				for(var i = 0; i < pr.messages.length; i++){
					sendResponse('onChat', false, {
						mid: pr.messages[i]['id'],
						nick: pr.messages[i]['n'],
						text: pr.messages[i]['t'],
						user: pr.messages[i]['u'],
						date: pr.messages[i]['d'],
						color: pr.messages[i]['c'],						
						fromHistory: true
					});
				}
			} else if(pr.status=='banned'){
				sendResponse('onJoinRoom', 'banned', pr.expires);			
			} else {
				sendResponse('onJoinRoom', true, pr.reason);
			}
		},
		'userjoined':function(pr){
			pr.data.commonPriv = getCommonPriv(pr.data.roomPriv, pr.data.globPriv);
			rooms[rooms.current]['users'][pr.name] = pr.data;
			sendResponse('onUserJoined', false, {room:pr.room, user:pr.name, info:pr.data});			
		},
		'userleaved':function(pr){
			sendResponse('onUserLeaved', false, {room:pr.room, user:pr.name, nick:gnick(pr.name)});			
			delete rooms[rooms.current]['users'][pr.name];
		},		
		'chat':function(pr){
			if(!isset(pr.status)){
				var isbot = isset(pr.isbot) ? true : false;
				
				if(!isbot) if(!isset(pr.n)) pr.n = gnick(pr.u); else pr.n = '';
				var message = {
					mid: pr.id,
					nick: pr.n,
					text: pr.t,
					user: pr.u,
					color: pr.c,
					isBot: isbot,
					fromHistory: false
				};
				sendResponse('onChat', false, message);
			} else {
				sendResponse('onChat', true, pr.reason);
			}
		},
		'chatcorrect':function(pr){
			if(pr.status=='ok'){
				var nm = {
					'newtext':pr.newtext,
					'mid':pr.mid
				};
				sendResponse('onChatCorrect', false, nm);
			} else {
				sendResponse('onChatCorrect', true, pr.reason);
			}
		},		
		'logout':function(pr){
			if(pr.status=='ok'){
				user = {online:false};
				cookie(cookName, '');
				sendResponse('onLogout', false);
			} else {
				sendResponse('onLogout', true, pr.reason);
			}
		},		
		'register':function(pr){
			if(pr.status=='ok'){
				sendResponse('onRegister', false);
			} else {
				sendResponse('onRegister', true, pr.reason);
			}
		},	
		'vkreg':function(pr){
			if(pr.status=='ok'){
				sendResponse('onRegisterVK', false);
			} else {
				sendResponse('onRegisterVK', true, pr.reason);
			}
		},	
		'setstatus':function(pr){
			if(pr.status=='ok'){
				sendResponse('onSetStatus', false, {user: pr.user, text: pr.text, nick:gnick(pr.user)});
			} else {
				sendResponse('onSetStatus', true, pr.reason);
			}
		},
		'setstate':function(pr){
			if(pr.status=='ok'){
				sendResponse('onSetState', false, {user: pr.user, val: pr.val, nick:gnick(pr.user)});
			} else {
				sendResponse('onSetState', true, pr.reason);
			}
		},
		'settopic':function(pr){
			if(pr.status=='ok'){
				sendResponse('onSetTopic', false, {topic: pr.topic, room: pr.room});
			} else {
				sendResponse('onSetTopic', true, pr.reason);
			}
		},
		'setprofile':function(pr){
			if(pr.status=='ok'){
				sendResponse('onSetProfile', false);
			} else {
				sendResponse('onSetProfile', true, pr.reason);
			}
		},
		'getprofile':function(pr){
			if(pr.status=='ok'){
				sendResponse('onGetProfile', false, {user:pr.user, priv:pr.privilege, visible: pr.visible, userdata: pr.userdata});
			} else {
				sendResponse('onGetProfile', true, pr.reason);
			}
		},		
		'banon':function(pr){
			if(pr.status=='ok'){
				var isMe = (pr.user == user.login);
				sendResponse('onSetBan', false, {user: pr.user, isMe:isMe, nick:gnick(pr.user), reason:pr.reason, time:pr.time});
				delete rooms[rooms.current]['users'][pr.user];
			} else {
				sendResponse('onSetBan', true, pr.reason);
			}
		},			
		'kick':function(pr){
			if(pr.status=='ok'){
				var isMe = (pr.user == user.login);
				sendResponse('onKick', false, {user: pr.user, isMe:isMe, nick:gnick(pr.user)});
				delete rooms[rooms.current]['users'][pr.user];
			} else {
				sendResponse('onKick', true, pr.reason);
			}
		},		
		'voiceoff':function(pr){ //********** NO COMPLETE
			if(pr.status=='ok'){
				sendResponse('onVoiceOff', false);
			} else {
				sendResponse('onVoiceOff', true, pr.reason);
			}
		},			
		'voiceon':function(pr){ //********** NO COMPLETE
			if(pr.status=='ok'){
				sendResponse('onVoiceOn', false);
			} else {
				sendResponse('onVoiceOn', true, pr.reason);
			}
		},
		'saverating':function(pr){
			if(pr.status=='ok'){
				sendResponse('onSaveRating', false);
			} else {
				sendResponse('onSaveRating', true, pr.reason);
			}
		},
		'erasemessage':function(pr){
			if(pr.status=='ok'){
				sendResponse('onEraseMessage', false, {mid: pr.mid});
			} else {
				sendResponse('onEraseMessage', true, pr.reason);
			}
		},
		'setavatar':function(pr){
			if(pr.status=='ok'){
				sendResponse('onSetAvatar', false, {user: pr.user, url: pr.url, nick:gnick(pr.user)});
			} else {
				sendResponse('onSetAvatar', true, pr.reason);
			}
		},
		'uploadimage':function(pr){
			if(pr.status=='ok'){
				var urlThumb = isset(pr.urlThumb) ? pr.urlThumb : pr.urlImage;
				sendResponse('onUploadImage', false, {user: pr.user, urlImage: pr.urlImage, urlThumb: pr.urlThumb});
				sendJSON('chat', {'room':rooms.current, 'text':'uploadimage|'+pr.urlImage+'|'+urlThumb});
			} else {
				sendResponse('onUploadImage', true, pr.reason);
			}
		},
		'leaveroom':function(pr){
			console.log(pr);
		}	
	}

	/********     COMANDS     ********/
	
	chat.login = function(name, pass, isVK, isMobile){
		if(!isset(isMobile)) isMobile = false;
		if(!isset(isVK)) isVK = false;
		if(isVK){
			sendJSON('vkauth', {'uid':name, 'hash':pass, 'mobile':isMobile, 'client':navigator.userAgent});
			user.vkuid = name;
			user.vkhash = pass;		
		} else {
			user.pass = md5(pass);
			sendJSON('auth', {'mode':'user', 'login':name, 'pass':user.pass, 'mobile':isMobile, 'client':navigator.userAgent});		
		}
		return true;
	}
	chat.autoLogin = function(isMobile){
		if(!isset(isMobile)) isMobile = false;
		var coo = cookie(cookName);
		if(!coo) return false;
		var cha = coo.split(';');
		if(cha[0]=='vk'){
			sendJSON('vkauth', {'uid':cha[1]*1, 'hash':cha[2], 'mobile':isMobile, 'client':navigator.userAgent});
			user.vkuid = cha[1]*1;
			user.vkhash = cha[2];
			return true;
		} else if(cha[0]=='norm') {
			sendJSON('auth', {'mode':'user', 'login':cha[1], 'pass':cha[2], 'mobile':isMobile, 'client':navigator.userAgent});
			user.pass = cha[2];
			return true;
		} else {
			return false;
		}
	}
	chat.logOut = function(){
		sendJSON('logout', {});
		return true;
	}
	chat.register = function(name, nick, pass){
		sendJSON('register', {'login':name,'nickname':nick,'pass':md5(pass)});
		return true;
	}
	chat.registerVK = function(name, nick, mid, rn, url){
		sendJSON('vkreg', {'login':name, 'nickname':nick, 'mid':mid, 'realname':rn, 'url':url});
		return true;
	}	
	chat.joinRoom = function(roomName, count){
		rooms.current = roomName;
		sendJSON('joinroom', {'room':roomName, 'count':count});
		return true;
	}	
	chat.chat = function(message, room, color, correctLatMess){
		if(!isset(correctLatMess)) correctLatMess = false;
		rooms.current = room;
		if(correctLatMess){
			sendJSON('chatcorrect', {'text':message});
		} else {
			sendJSON('chat', {'room':room, 'text':message, 'cl':color});
		}
		return true;
	}	
	chat.setStatus = function(text){
		sendJSON('setstatus', {'text':text});
		return true;
	}
	chat.setState = function(v){
		sendJSON('setstate', {'val':v*1});
		return true;
	}	
	chat.setTopic = function(topic, room){
		rooms.current = room;
		sendJSON('settopic', {'room':room, 'topic':topic});
		return true;
	}
	chat.setProfile = function(user, data, vis){
		sendJSON('setprofile', {'user':user, 'userdata':data, 'visible':vis});
		return true;
	}
	chat.getProfile = function(user){
		sendJSON('getprofile', {'user':user});
		return true;
	}	
	chat.setBan = function(time, reason, user, room){
		// time in minutes
		sendJSON('banon', {'time':time, 'reason':reason, 'user':user, 'room':room});
		return true;
	}	
	chat.kick = function(user, room){
		sendJSON('kick', {'user':user, 'room':room});
		return true;
	}		
	chat.voiceOff = function(time, reason, user, room){
		// time in minutes
		sendJSON('voiceoff', {'time':time, 'reason':reason, 'user':user, 'room':room});
		return true;
	}
	chat.voiceOn = function(user, room){
		sendJSON('voiceon', {'user':user, 'room':room});
		return true;
	}
	chat.saveRating = function(m,v){
		sendJSON('saverating', {'mid':m, 'val':v});
		return true;
	}
	chat.eraseMessage = function(m){
		sendJSON('erasemessage', {'mid':m});
		return true;
	}
	chat.setAvatar = function(file){
		// file is src data of image element
		sendJSON('setavatar', {'file':file});
		return true;
	}	
	chat.uploadImage = function(file){
		// file is src data of image element
		sendJSON('uploadimage', {'file':file});
		return true;
	}	
	
	
	
	// return object
	return chat;
}

// Any Functions
function md5(f){x=str2blks_MD5(f);a=1732584193;b=-271733879;c=-1732584194;d=271733878;for(i=0;i<x.length;i+=16)olda=a,oldb=b,oldc=c,oldd=d,a=ff(a,b,c,d,x[i+0],7,-680876936),d=ff(d,a,b,c,x[i+1],12,-389564586),c=ff(c,d,a,b,x[i+2],17,606105819),b=ff(b,c,d,a,x[i+3],22,-1044525330),a=ff(a,b,c,d,x[i+4],7,-176418897),d=ff(d,a,b,c,x[i+5],12,1200080426),c=ff(c,d,a,b,x[i+6],17,-1473231341),b=ff(b,c,d,a,x[i+7],22,-45705983),a=ff(a,b,c,d,x[i+8],7,1770035416),d=ff(d,a,b,c,x[i+9],12,-1958414417),c=ff(c,d,a,
b,x[i+10],17,-42063),b=ff(b,c,d,a,x[i+11],22,-1990404162),a=ff(a,b,c,d,x[i+12],7,1804603682),d=ff(d,a,b,c,x[i+13],12,-40341101),c=ff(c,d,a,b,x[i+14],17,-1502002290),b=ff(b,c,d,a,x[i+15],22,1236535329),a=gg(a,b,c,d,x[i+1],5,-165796510),d=gg(d,a,b,c,x[i+6],9,-1069501632),c=gg(c,d,a,b,x[i+11],14,643717713),b=gg(b,c,d,a,x[i+0],20,-373897302),a=gg(a,b,c,d,x[i+5],5,-701558691),d=gg(d,a,b,c,x[i+10],9,38016083),c=gg(c,d,a,b,x[i+15],14,-660478335),b=gg(b,c,d,a,x[i+4],20,-405537848),a=gg(a,b,c,d,x[i+9],5,568446438),
d=gg(d,a,b,c,x[i+14],9,-1019803690),c=gg(c,d,a,b,x[i+3],14,-187363961),b=gg(b,c,d,a,x[i+8],20,1163531501),a=gg(a,b,c,d,x[i+13],5,-1444681467),d=gg(d,a,b,c,x[i+2],9,-51403784),c=gg(c,d,a,b,x[i+7],14,1735328473),b=gg(b,c,d,a,x[i+12],20,-1926607734),a=hh(a,b,c,d,x[i+5],4,-378558),d=hh(d,a,b,c,x[i+8],11,-2022574463),c=hh(c,d,a,b,x[i+11],16,1839030562),b=hh(b,c,d,a,x[i+14],23,-35309556),a=hh(a,b,c,d,x[i+1],4,-1530992060),d=hh(d,a,b,c,x[i+4],11,1272893353),c=hh(c,d,a,b,x[i+7],16,-155497632),b=hh(b,c,d,
a,x[i+10],23,-1094730640),a=hh(a,b,c,d,x[i+13],4,681279174),d=hh(d,a,b,c,x[i+0],11,-358537222),c=hh(c,d,a,b,x[i+3],16,-722521979),b=hh(b,c,d,a,x[i+6],23,76029189),a=hh(a,b,c,d,x[i+9],4,-640364487),d=hh(d,a,b,c,x[i+12],11,-421815835),c=hh(c,d,a,b,x[i+15],16,530742520),b=hh(b,c,d,a,x[i+2],23,-995338651),a=ii(a,b,c,d,x[i+0],6,-198630844),d=ii(d,a,b,c,x[i+7],10,1126891415),c=ii(c,d,a,b,x[i+14],15,-1416354905),b=ii(b,c,d,a,x[i+5],21,-57434055),a=ii(a,b,c,d,x[i+12],6,1700485571),d=ii(d,a,b,c,x[i+3],10,
-1894986606),c=ii(c,d,a,b,x[i+10],15,-1051523),b=ii(b,c,d,a,x[i+1],21,-2054922799),a=ii(a,b,c,d,x[i+8],6,1873313359),d=ii(d,a,b,c,x[i+15],10,-30611744),c=ii(c,d,a,b,x[i+6],15,-1560198380),b=ii(b,c,d,a,x[i+13],21,1309151649),a=ii(a,b,c,d,x[i+4],6,-145523070),d=ii(d,a,b,c,x[i+11],10,-1120210379),c=ii(c,d,a,b,x[i+2],15,718787259),b=ii(b,c,d,a,x[i+9],21,-343485551),a=add(a,olda),b=add(b,oldb),c=add(c,oldc),d=add(d,oldd);return rhex(a)+rhex(b)+rhex(c)+rhex(d)};
function str2blks_MD5(f){nblk=(f.length+8>>6)+1;blks=Array(16*nblk);for(i=0;i<16*nblk;i++)blks[i]=0;for(i=0;i<f.length;i++)blks[i>>2]|=f.charCodeAt(i)<<8*(i%4);blks[i>>2]|=128<<8*(i%4);blks[16*nblk-2]=8*f.length;return blks}function add(f,k){var h=(f&65535)+(k&65535);return(f>>16)+(k>>16)+(h>>16)<<16|h&65535}function rol(f,k){return f<<k|f>>>32-k}function cmn(f,k,h,e,g,l){return add(rol(add(add(k,f),add(e,l)),g),h)}function ff(f,k,h,e,g,l,m){return cmn(k&h|~k&e,f,k,g,l,m)}
function gg(f,k,h,e,g,l,m){return cmn(k&e|h&~e,f,k,g,l,m)}function hh(f,k,h,e,g,l,m){return cmn(k^h^e,f,k,g,l,m)}function ii(f,k,h,e,g,l,m){return cmn(h^(k|~e),f,k,g,l,m)}var hex_chr="0123456789abcdef";function rhex(f){str="";for(j=0;3>=j;j++)str+=hex_chr.charAt(f>>8*j+4&15)+hex_chr.charAt(f>>8*j&15);return str}
var isset = function(vr){return typeof(vr)!=='undefined'};
var cookie=function(d,c,a){if("undefined"!=typeof c){a=a||{};null===c&&(c="",a.expires=-1);var b="";if(a.expires&&("number"==typeof a.expires||a.expires.toUTCString))"number"==typeof a.expires?(b=new Date,b.setTime(b.getTime()+864E5*a.expires)):b=a.expires,b="; expires="+b.toUTCString();var e=a.path?"; path="+a.path:"",f=a.domain?"; domain="+a.domain:"",a=a.secure?"; secure":"";document.cookie=[d,"=",encodeURIComponent(c),b,e,f,a].join("")}else{c=null;if(document.cookie&&""!=document.cookie){a=document.cookie.split(";");
for(b=0;b<a.length;b++)if(e=trim(a[b]),e.substring(0,d.length+1)==d+"="){c=decodeURIComponent(e.substring(d.length+1));break}}return c}};
function trim(b,a){return ltrim(rtrim(b,a),a)}function ltrim(b,a){return b.replace(RegExp("^["+(a||"\\s")+"]+","g"),"")}function rtrim(b,a){return b.replace(RegExp("["+(a||"\\s")+"]+$","g"),"")};