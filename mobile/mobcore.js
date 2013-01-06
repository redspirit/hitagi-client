var states = [], statesT = [], privas = [], privasT = [];

window.onload = function(e){
	var login;
	var pass;
		
	var gi = function(p){
		return document.getElementById(p)
	}

	var ch = hitagiCreate(serverUrl, 8080);

	ch.connect();
	VK.init({apiId: VKAPIID});
	VK.Widgets.Auth("vk_auth", {width: "200px", onAuth: function(data){
		if(!data) return false;
		ch.login(data.uid, data.hash, true, true);
	}});
	
	ch.response.onConnect = function(){
		ch.autoLogin(true);
	}
	ch.response.onLogin = function(err){
		if(!err){
			ch.joinRoom(currentRoom);
			gi('chat').style.display = 'block';
			gi('login').style.display = 'none';				
		} else {
			gi('loginfo').innerHTML = err;
		}
	}
	ch.response.onJoinRoom = function(err,d){
		var u = d.users;
		for(var k in u){
			gi('userslist').innerHTML += getUserItemHTML(k, u[k]['nick'], u[k]['avaurl'], u[k]['statustext'], u[k]['commonPriv'], u[k]['state']);
		}
	}	
	ch.response.onChat = function(err,d){
		addMessage(d['text'], d['nick'], d['date'])
	};


	gi('message').onkeypress = function(e){
		if(e.which==13) { sendmess(); return false; }
	}

	ch.response.onUserJoined = function(err, d){
		gi('userslist').innerHTML += getUserItemHTML(d.user, d.info['nick'], d.info['avaurl'], d.info['statustext'], d.info['commonPriv'], d.info['state']);
		addNotif('<b>'+d.info.nick+'</b> зашел в комнату', '#0F9B14');
	}	
	ch.response.onUserLeaved = function(err, d){
		addNotif('<b>'+d.nick+'</b> покинул комнату', '#E70343');
		var elem = document.querySelector('#userslist table[user='+d.user+']');
		elem.parentNode.removeChild(elem);
	}	
	
	function sendmess(){
		var m = gi('message').value;
		ch.chat(m, 'public');
		gi('message').value = '';
	};
	function addNotif(mes, color){
		gi('pane').innerHTML += '<div class="notif" style="color:'+color+'">'+date('H:i',time())+' | '+mes+'</div>';
	}	
	
	
	function addMessage(mes, nick, time){
		mes = beforeShow(mes);
		gi('pane').innerHTML += '<div class="mes"><span class="time">'+date('H:i',time)+'</span> <b>'+nick+'</b>: '+mes+'</div>';
	}
	
	gi('logBtn').onclick = function(){
		login = gi('logintext').value;
		pass = gi('passtext').value;
		ch.login(login, pass, false, true);
	}
	
	gi('tousers').onclick = function(e){
		gi('chat').style.display = 'none';
		gi('users').style.display = 'block';
	}
	gi('tochat').onclick = function(e){
		gi('chat').style.display = 'block';
		gi('users').style.display = 'none';
	}
	gi('tochat2').onclick = function(e){
		gi('chat').style.display = 'block';
		gi('status').style.display = 'none';
	}
	gi('tologin').onclick = function(e){
		ch.logOut();
		gi('login').style.display = 'block';
		gi('chat').style.display = 'none';
		gi('loginfo').innerHTML = '';
	}	
	gi('tostatus').onclick = function(e){
		gi('status').style.display = 'block';
		gi('chat').style.display = 'none';
	}		
}
function getUserItemHTML(name, nick, avaurl, status, priv, state){
	return tpl('user', {name:name, url:avaurl, pt:privasT[priv], p:privas[priv], priv:priv, n:nick, st:status, states:states[state], statest:statesT[state]});
}
function tpl(tname, variables){
	template = templates[tname];
	return template.replace(RegExp('\{(.*?)\}','g'),function(a,b){	
		return isset(variables[b]) ? variables[b] : '';
	});
}
function beforeShow(m){

	var uplRegexp = /^uploadimage\|([a-z0-9:.\/]+)\|([a-z0-9:.\/]+)$/i;
	if(uplRegexp.test(m)){
		m = m.replace(uplRegexp, '<a target="_blank" href="$2">Загруженная картинка</a>');
	} else {
		m = m.replace(new RegExp('(((f|ht){1}tp://)[-a-zA-Z0-9@:%_\+.~#?&//=]+)', 'gi'), '<a target="_blank" href="$1">$1</a>');
	}

	m = BBproc(m);

	// смайлы
	m = m.replace(/\*smile(\d+)\*/gm, '<img class="sml" src="/chat/img/smiles/$1.gif" alt="" />');	
	return m;
}

var templates = {
	user: '<table style="usinfo" user="{name}" width="100%"><tr><td class="avr"><img src="{url}" alt="" /></td><td><p><img class="upriv" title="{pt}" src="/chat/img/{p}" alt="" /> <b>{n}</b></p><p><img src="/chat/img/{states}" alt="" /> {statest}</p><p>{st}</p></td></tr></table>'
}

states[0] = 'online.png'; 		statesT[0] = 'Онлайн'; 
states[1] = 'away.png'; 		statesT[1] = 'Отошел'; 
states[2] = 'busy.png'; 		statesT[2] = 'Занят'; 
states[3] = 'stop.png'; 		statesT[3] = 'Отсутствую'; 
states[4] = 'work.png'; 		statesT[4] = 'Работаю'; 
states[5] = 'learning.png'; 	statesT[5] = 'Учусь'; 
states[6] = 'game.png'; 		statesT[6] = 'Играю'; 
states[7] = 'eat.png'; 			statesT[7] = 'Кушаю'; 
states[8] = 'sleep.png';		statesT[8] = 'Сплю';

privas[1] = 'admin.png'; 		privasT[1] = 'Админ'; 
privas[2] = 'moder.png'; 		privasT[2] = 'Модератор';
privas[3] = 'owner.png'; 		privasT[3] = 'Хозяин комнаты'; 
privas[4] = 'user.png'; 		privasT[4] = 'Пользователь'; 
privas[5] = 'novoice.png';		privasT[5] = 'Без голоса';

function date(c,l){var e,a,b=/\\?([a-z])/gi,g,h=function(a,b){return(a+="").length<b?Array(++b-a.length).join("0")+a:a},p="Sun Mon Tues Wednes Thurs Fri Satur January February March April May June July August September October November December".split(" ");g=function(b,k){return a[b]?a[b]():k};a={d:function(){return h(a.j(),2)},D:function(){return a.l().slice(0,3)},j:function(){return e.getDate()},l:function(){return p[a.w()]+"day"},N:function(){return a.w()||7},S:function(){var b=a.j();return 4<
b&&21>b?"th":{1:"st",2:"nd",3:"rd"}[b%10]||"th"},w:function(){return e.getDay()},z:function(){var b=new Date(a.Y(),a.n()-1,a.j()),k=new Date(a.Y(),0,1);return Math.round((b-k)/864E5)+1},W:function(){var b=new Date(a.Y(),a.n()-1,a.j()-a.N()+3),k=new Date(b.getFullYear(),0,4);return h(1+Math.round((b-k)/864E5/7),2)},F:function(){return p[6+a.n()]},m:function(){return h(a.n(),2)},M:function(){return a.F().slice(0,3)},n:function(){return e.getMonth()+1},t:function(){return(new Date(a.Y(),a.n(),0)).getDate()},
L:function(){return 1===(new Date(a.Y(),1,29)).getMonth()|0},o:function(){var b=a.n(),k=a.W();return a.Y()+(12===b&&9>k?-1:1===b&&9<k)},Y:function(){return e.getFullYear()},y:function(){return(a.Y()+"").slice(-2)},a:function(){return 11<e.getHours()?"pm":"am"},A:function(){return a.a().toUpperCase()},B:function(){var a=3600*e.getUTCHours(),b=60*e.getUTCMinutes(),c=e.getUTCSeconds();return h(Math.floor((a+b+c+3600)/86.4)%1E3,3)},g:function(){return a.G()%12||12},G:function(){return e.getHours()},h:function(){return h(a.g(),
2)},H:function(){return h(a.G(),2)},i:function(){return h(e.getMinutes(),2)},s:function(){return h(e.getSeconds(),2)},u:function(){return h(1E3*e.getMilliseconds(),6)},e:function(){throw"Not supported (see source code of date() for timezone on how to add support)";},I:function(){var b=new Date(a.Y(),0),c=Date.UTC(a.Y(),0),e=new Date(a.Y(),6),d=Date.UTC(a.Y(),6);return 0+(b-c!==e-d)},O:function(){var a=e.getTimezoneOffset(),b=Math.abs(a);return(0<a?"-":"+")+h(100*Math.floor(b/60)+b%60,4)},P:function(){var b=
a.O();return b.substr(0,3)+":"+b.substr(3,2)},T:function(){return"UTC"},Z:function(){return 60*-e.getTimezoneOffset()},c:function(){return"Y-m-d\\Th:i:sP".replace(b,g)},r:function(){return"D, d M Y H:i:s O".replace(b,g)},U:function(){return e.getTime()/1E3|0}};this.date=function(a,c){e="undefined"===typeof c?new Date:c instanceof Date?new Date(c):new Date(1E3*c);return a.replace(b,g)};return this.date(c,l)}
function BBproc(a){a=a.replace(/\[b\](.*?)\[\/b\]/gi,function(a,b){return"<b>"+b+"</b>"});a=a.replace(/\[i\](.*?)\[\/i\]/gi,function(a,b){return"<i>"+b+"</i>"});a=a.replace(/\[u\](.*?)\[\/u\]/gi,function(a,b){return'<span style="text-decoration: underline;">'+b+"</span>"});a=a.replace(/\[s\](.*?)\[\/s\]/gi,function(a,b){return"<del>"+b+"</del>"});a=a.replace(/\[size=([^\]]+)\](.+?)\[\/size\]/ig,function(a,b,c){40<1*b&&(b=40);5>1*b&&(b=5);return'<span style="font-size:'+b+'px">'+c+"</span>"});a=a.replace(/\[cc=([^\]]+)\](.+?)\[\/cc\]/ig,function(a,b,c){ return'<span style="color:'+b+'">'+c+"</span>"}); return a.replace(/\[color=([^\]]+)\](.+?)\[\/color\]/ig,function(a,b,c){return'<span style="color:'+b+'">'+c+"</span>"})};
var time = function(){return parseInt(new Date().getTime()/1000)};