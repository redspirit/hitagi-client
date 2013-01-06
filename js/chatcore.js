var states = [], statesT = [], privas = [], privasT = [], umItems = [];
var blockOverlay = true, clickOnProf = 0;
var soundEnable, notifEnable, playSound, imaga, blockHide = true;
var imageReader = new FileReader();
var user, rooms = {}, vkmid, vkrealname, vkurl, curColor, isFocus=true;
var isNotif, curState, reciveMessCount = 30;
var mhist = {cur:'', old:''}, correctLatMess = false;


/********** START APPLICATION ************/
soundManager.onready(initSounds);

function start(){
	VK.init({apiId: VKAPIID});
	createElements();
	bindings();
	initToolButtons();
	if(!ch.connect()){
		showForm(tpl('conerror'), 'Ошибочка');
	}	
};

function createElements(){
	// создаем меню со статусами
	for (var i = 0; i < statesT.length; ++i){
		$('#tmenu').append(tpl('statusitem', {s1:states[i], s2:statesT[i], n:i}));
	}
	
	$('#widget-help').widget({
		hideCloseBtn:true,
		title:'Правила чата',
		x:$('#cont').width()-370,
		y:119,
		id:'help',
		content:tpl('rules')
	});
	$('#widget-radio').widget({
		hideCloseBtn:false,
		title:'Аниме радио',
		x:$('#cont').width()-570,
		y:119,
		id:'radio',
		content:tpl('radiocode')
	});	
	
}

function initSounds(){
	// инициализируем звуки
	soundManager.createSound({
		id: 'message',
		url: 'sounds/in.mp3',
		autoLoad: true, autoPlay: false, volume: 80
	});	
	soundManager.createSound({
		id: 'notif',
		url: 'sounds/out.mp3',
		autoLoad: false, autoPlay: false, volume: 70
	});
	soundManager.createSound({
		id: 'foryou',
		url: 'sounds/foryou.mp3',
		autoLoad: false, autoPlay: false, volume: 60
	});
	soundManager.createSound({
		id: 'discon',
		url: 'sounds/discon.mp3',
		autoLoad: false, autoPlay: false, volume: 80
	});

	playSound = function(s){
		if(soundEnable) soundManager.play(s);
	}
	
	start();
}	$('#colorsBtn').ColorPicker({
		color: '#'+curColor,
		onChange: function (hsb, hex, rgb) {
			cookie("colors", hex, {expires: 99});
			curColor = hex;
		}
	});	

function initToolButtons(){
	isNotif = window.webkitNotifications ? true : false;
	if(cookie("sounds")=='off'){
		soundEnable = false;
		$('#soundBtn').css('backgroundImage','url(img/soundoff.png)');
	} else {
		soundEnable = true;
		$('#soundBtn').css('backgroundImage','url(img/soundon.png)');
	}
	if(cookie("notifs")=='off'){
		notifEnable = false;
		$('#notifBtn').css('backgroundImage','url(img/notifoff.png)');
	} else {
		notifEnable = true;
		$('#notifBtn').css('backgroundImage','url(img/notifon.png)');
	}	
}

function bindings(){
	$('#logout_btn').click(clickLogout);
	$('#profile_btn').click(clickProfile);
	$('#setava').click(clickSetava);
	$('#uploadImage').click(clickUploadimage);
	$('#statusBtn').click(clickStatusbtn);
	$('#moderBtn').click(clickModerBut);
	$('#stateBtn').click(clickStatebtn)
	$('#tmenu').click(clickStatebtn2).mouseleave(clickStatebtn2);
	$('#soundBtn').click(clickSoundbtn);
	$('#notifBtn').click(clickNotifbtn);
	$('#smileBtn').click(mouseSmile1)
	$('#smileblock').mouseleave(mouseSmile2);	
	$('#overlay').click(hideForm);
	$('#send').click(clickSendmess);
	$('#messageinput').keydown(keyInputmess);
	$('#privatemes').click(clickPrivatemes);
	$('.stateitem').click(clickStateitem);
	$('.smiletabs').click(function(){return false});
	$('.smiletabs div').click(clickSmiletab);
	$(window).focus(function(){
		isFocus = true;
		$('#messageinput').focus();
	}).blur(function(){
		isFocus = false;
	});	
	for(var i in smiles[1]){
		$('#smWrap').append('<img num="'+smiles[1][i]+'" src="img/smiles/'+smiles[1][i]+'.gif" alt="" />');
	}	
}


/********** SERVER CALLBACKS ************/

ch.response.onConnect = function(){
	if(ch.autoLogin()){
		//hideForm()
	} else {
		showAuthWindow();
	}
}
ch.response.onDisconnect = function(){
	blockOverlay = true;
	showForm(tpl('discon'), 'Дисконнект!');
	playSound('discon');
}
ch.response.onLogin = function(err,u){
	if(!err){
		user = u;
		curColor = u.textcolor;
		
	$('#colorsBtn').ColorPicker({
		color: '#'+curColor,
		onChange: function (hsb, hex, rgb) {
			cookie("colors", hex, {expires: 99});
			curColor = hex;
		}
	});			
		
		helloStr(u.nick);
		blockOverlay = false;
		hideForm();
		ch.joinRoom(currentRoom, reciveMessCount);
		//ch.setCurrentRoom(currentRoom);		
	} else if(err=='blocked'){
		$('.roster-pane').html('');
		$('#mp1').html(tpl('blockmes', {mess:u}));		
	} else {
		if(u=='alreadyauth') alert('Под этой учетной записью уже авторизованы');
		if(u=='wrongauth'){
			alert('Неверный логин или пароль');
			showAuthWindow();
		}
		if(u=='wronghash'){
			showAuthWindow();
		}
	}
}
ch.response.onLogout = function(err, data){
	showAuthWindow();
	blockOverlay = true;
}
ch.response.onJoinRoom = function(err, d, d2){
	if(!err){
		clearUsers();
		fillUsers(d.users);
		showToolsButtons(d.commonPriv);
		addTopic(d.topic);
		$('#tabcaption').html(d.caption);
		rooms = ch.getRooms();
	} else if(err=='banned'){
		$('.roster-pane').html('');
		$('#mp1').html(tpl('banmes', {time:Math.ceil(d/60), reason:''}));	
	} else {
		showNotificator('Ошибка захода в комнату: '+d, 2000);
	}
}
ch.response.onRegisterVK = function(err, data){
	if(!err){
		alert(tpl('vrnotif'));
		showAuthWindow();
	} else {
		if(vkmid){
			showAuthWindow();
			if(data=='wrongauth') $('#reglink').trigger('click');
		} else {
			alert(data);
		}
	}
}
ch.response.onChat = function(err, d){
	if(!err){
		addMessage(d);
	} else {
		showNotificator('Ошибка отправки сообщения: '+d, 2000);;
	}
}
ch.response.onChatCorrect = function(err, d){
	if(!err){
		$('#'+d.mid+' span:eq(1)').html(stripBB(d.newtext));
	} else {
		showNotificator('Ошибка исправления сообщения: '+d, 2000);;
	}
}
ch.response.onSetTopic = function(err, d){
	if(!err){
		addTopic(d.topic, d.room);
		hideForm();
	} else {
		showNotificator('Ошибка установки топика: '+d, 2000);;
	}
}
ch.response.onUserJoined = function(err, d){
		//var room = pr.room;
		if($('.roster-pane table[user='+d.user+']').length!=0) return false; // лучше это сделать в фреймворке
		addUser(d.user, d.info);
		addNotif('<b>'+d.info.nick+'</b> зашел в комнату', '#0F9B14');
}
ch.response.onUserLeaved = function(err, d){
	addNotif('<b>'+d.nick+'</b> покинул комнату', '#E70343');
	delUser(d.user);
}
ch.response.onGetProfile = function(err, d){
	if(!err){
		if(clickOnProf==1)
			showMyProfileWindow(d.userdata, d.visible);
		else
			showUserProfileWindow(d.userdata);
	} else {
		if(d=='notallowed'){
			showNotificator('Этот пользователь скрыл свой профиль', 2000)
		} else showNotificator('Ошибка получения профиля: '+d, 2000);
	}
}
ch.response.onSetProfile = function(err, d){
	if(!err){
		hideForm();
	} else {
		showNotificator('Ошибка установки профиля: '+d, 2000);
	}
}
ch.response.onSetAvatar = function(err, d){
	if(!err){
		if(d.user == user.login) $('#newavaimg').attr('src', d.url);
		$('.roster-pane table[user='+d.user+'] .profava').attr('src', d.url);
		hideForm();
		addNotif('<b>'+d.nick+'</b> обновил аватарку', '#0F419B');
	} else {
		showNotificator('Ошибка установки аватара: '+d, 2000);;
	}
}
ch.response.onEraseMessage = function(err, d){
	$('#'+d.mid).html('<span class="deletedmes">[ Сообщение удалено ]</span>');
}
ch.response.onSetStatus = function(err, d){
	if(!err){
		$('.roster-pane table[user='+d.user+'] .ustatus').text(d.text);
		addNotif('<b>'+d.nick+'</b> изменил статусный текст на: <b>' + d.text + '</b>', '#0F419B');
		hideForm();
	} else {
		showNotificator('Ошибка установки статуса: '+d, 2000);;
	}
}
ch.response.onSetState = function(err, d){
	if(!err){
		$('.roster-pane table[user='+d.user+'] .stateSign').attr('src', 'img/'+states[d.val]);
		$('.roster-pane table[user='+d.user+'] .statetxt').html(statesT[d.val]);		
		if(d.user == user.login)$('#stateBtn').css('backgroundImage', 'url(img/'+states[d.val]+')');
		addNotif('<b>'+d.nick+'</b> изменил статус на: <b>' + statesT[d.val] + '</b>', '#0F419B');
	} else {
		showNotificator('Ошибка установки состояния: '+d, 2000);;
	}
}
ch.response.onSaveRating = function(err, d){
	if(!err){
		showNotificator('Ваш голос учтен!', 3000);
	} else {
		if(d == 'alreadyvoted'){
			showNotificator('Вы уже проголосовали за эту картинку', 3000);
		} else if(d == 'isowner'){
			showNotificator('Нельзя голосовать за свою картинку', 3000);
		} else {
			alert(d);
		}
	}
}
ch.response.onKick = function(err, d){
	if(!err){
		if(d.isMe){
			$('.roster-pane').html('');
			$('#mp1').html(tpl('kickmes'));	
		} else {
			addNotif('<b>'+d.nick+'</b> был выпнут из комнаты', '#0F419B');
			delUser(d.user);
		}
	} else {
		showNotificator('Ошибка при попытке кикнуть: '+d, 2000);;
	}
}
ch.response.onSetBan = function(err, d){
	if(!err){
		if(d.isMe){
			$('.roster-pane').html('');
			$('#mp1').html(tpl('banmes', {time:d.time, reason:d.reason}));
		} else {
			addNotif('<b>'+d.nick+'</b> забанен на <b>'+d.time+' минут</b> по причине: '+d.reason, 'red');
			delUser(d.user);
		}
	} else {
		showNotificator('Ошибка при попытке кикнуть: '+d, 2000);;
	}
}



/********** LIVE CLICKS ************/

$('.iClose').live('click', function(){
	$(this).parents('span').html('<span class="deletedmes">Картинка скрыта</span>');
});
$('.iLike').live('click', function(){
	var mid = $(this).parents('dd').attr('id');
	ch.saveRating(mid, 1)
});
$('.iDislike').live('click', function(){
	var mid = $(this).parents('dd').attr('id');
	ch.saveRating(mid, -1)
});
$('dd').live('mouseover', function(){
	$(this).children().children('.eras').show();
}).live('mouseout', function(){
	$(this).children().children('.eras').hide();	
});
$('span.eras').live('click', function(){
	var mid = $(this).parents('dd').attr('id');
	ch.eraseMessage(mid);
});
$('.imgcont').live('mouseenter', function(){
	$(this).children('.imgpanel').show().animate({'top':"-32px"}, 150);
}).live('mouseleave', function(){
	$(this).children('.imgpanel').animate({'top':"0px"}, 150);
});
$('.usmenu').live('click', function(){
	var pr = $(this).attr('priv');
	var rms = ch.getRooms();
	$('.umenucont').remove();
	var grid = privGrid(pr, rms[currentRoom].users[user.login].commonPriv); //1
	var form = $('<div class="umenucont"></div>');
	form.hide();
	for(var i=0; i<grid.length; i++){
		form.append('<div act="'+grid[i]+'">'+umItems[grid[i]]+'</div>');
	}
	if(grid.length==0) form.append('<div>Нет действий</div>');
	form.children().click(function(){
		$(this).parent().hide();
		uMenuAction($(this).attr('act')*1, $(this).parent().parent().parent().attr('user'));
	});
	
	$(this).parent().parent().after(form);
	form.fadeIn(200);
});
$('.umenucont').live('mouseleave', function(){
	$(this).hide();
});
$('dd span.label').live('click', function(){
	if(user.nick!=$(this).text()){
		$('#messageinput').val($('#messageinput').val()+$(this).text()+': ').focus();
	}
});
$('#smWrap img').live('click', function(){
	$('#messageinput').val($('#messageinput').val()+' *smile'+$(this).attr('num')+'* ').focus();
});
$('.profava').live('click', function(){
	var nn = $(this).attr('nn');
	if(user.nick != nn){
		$('#messageinput').val($('#messageinput').val()+nn+': ').focus();
	}
});

	
/********** INTERFACE EVENTS ************/

function clickLogout(){
	ch.logOut();
	return false;
}
function clickProfile(){
	clickOnProf = 1;
	ch.getProfile(user.login);
	return false;	
}
function clickSetava(){
	var form = tpl('setava', {src:user.avasrc});
	showForm(form, 'Установка аватарки');
	var ifile = document.getElementById('inputfile');
	ifile.onchange = function(){
		$('#avalabel').html('Загружается...');
		uplAvatar(this.files[0]);
	}
	return false;
}
function clickUploadimage(){
	var ifile = document.getElementById('uplFile');
	$(ifile).trigger('click');
	ifile.onchange = function(){
		showNotificator('Загрузка картинки начата', 2000);
		uplImage(this.files[0]);
	}

}
function mouseSmile1(){
	$('#smileblock').show();
}
function mouseSmile2(){
	$('#smileblock').hide();
}
function clickSmiletab(){
	var tab = $(this).attr('tab')*1;
	var sm = smiles[tab];
	$('#smWrap').html('');
	for(var i in sm){
		$('#smWrap').append('<img num="'+sm[i]+'" src="img/smiles/'+sm[i]+'.gif" alt="" />');
	}
}
function clickStatusbtn(){
	showForm(tpl('status'), 'Мой статусный текст');
	$('#status_but').click(function(){
		ch.setStatus($('#newstatustext').val());
	});	
}
function clickModerBut(){
	var m = $('#modmenu');
	if(m.css('display')=='none'){
		if(blockHide) m.show();
		blockHide = true;
	} else {	
		m.hide();
	}
	if(m.html()==''){
		m.append(tpl('modmenu'));
		m.show();
		$('.moditem').click(function(){
			var v = $(this).attr('val')*1;
			m.hide();
			blockHide = false;
			showModerWindow(v);
		});
	}

}
function topicChange(){
	var form = tpl('topic', {txt:rooms[currentRoom].topic});
	showForm(form, 'Изменить топик');
	$('#topic_but').click(function(){
		ch.setTopic($('#topictext').val(), currentRoom);
	});
}
function clickStatebtn(){
	$('#tmenu').show();
}
function clickStatebtn2(){
	$('#tmenu').hide();
}
function clickStateitem(){
	var v = $(this).attr('val') * 1;
	if(curState!=v){
		curState = v;
		ch.setState(curState);
	}
}
function clickSendmess(){
	var t = $('#messageinput').val();
	if($.trim(t) == '') return false;
	mhist.old = t;
	ch.chat(t, currentRoom, curColor, correctLatMess);
	$('#messageinput').val('').css('backgroundColor','white');
	$('#miw').css('backgroundColor','white');
	correctLatMess = false;
}
function keyInputmess(event){
	if(event.keyCode==13){ // enter
		clickSendmess();
		return false;
	}
	if(event.keyCode==38){ // up
		mhist.cur = $('#messageinput').val(); 
		$('#messageinput').val(mhist.old).css('backgroundColor','#FCDEDC');
		$('#miw').css('backgroundColor','#FCDEDC');
		correctLatMess = true;
		return false;
	}
	if(event.keyCode==40){ // down
		$('#messageinput').val(mhist.cur).css('backgroundColor','white');
		$('#miw').css('backgroundColor','white');
		correctLatMess = false;
		return false;
	}	
}
function clickSoundbtn(){
	if(soundEnable){
		soundEnable = false;
		$(this).css('backgroundImage','url(img/soundoff.png)');
		cookie("sounds", 'off',{ expires: 99});
	} else {
		soundEnable = true;
		$(this).css('backgroundImage','url(img/soundon.png)');
		cookie("sounds", 'on', { expires: 99});
	}
}
function clickNotifbtn(){
	if(isNotif){
		if (window.webkitNotifications.checkPermission()!=0){
			window.webkitNotifications.requestPermission();
			return false;
		}
		if(notifEnable){
			notifEnable = false;
			$(this).css('backgroundImage','url(img/notifoff.png)');
			cookie("notifs", 'off',{ expires: 99});
		} else {
			notifEnable = true;
			$(this).css('backgroundImage','url(img/notifon.png)');
			cookie("notifs", 'on', { expires: 99});
		}
	} else {
		showForm(tpl('nonotif'), 'Уведомления');
	}
		
}
function nickClick(){
	var cluser = $(this).parents('.user').attr('user');
	clickOnProf = 2;
	ch.getProfile(cluser);
}
function clickPrivatemes(){
	alert('Личные сообщения пока не работают');
	return false;
}


/********** MENU ACTIONS ************/
function showModerWindow(v){
	if(v==1){
		var form = '/* функционал не реализован */';
		showForm(form, 'Список забаненых');
	}
	if(v==2){
		var form = '/* функционал не реализован */';
		showForm(form, 'Зарегистрировать юзера');	
	}
	if(v==3){
		// сменить топик комнаты
		topicChange();
	}	
}

function uMenuAction(val, user){
	if(val==1){ //сделать админом сервера
		alert('Функционал не реализован');
		//socket.json.send({'type':'globprivilege', 'priv':1, 'user':user});
	}
	if(val==2){ //сделать обычным юзером сервера
		alert('Функционал не реализован');
		//socket.json.send({'type':'globprivilege', 'priv':2, 'user':user});
	}
	if(val==3){ // сделать модером комнаты
		alert('Функционал не реализован');
	}
	if(val==4){ // расжаловать модера
		alert('Функционал не реализован');
	}
	if(val==5){ // Забанить
		showForm(tpl('ban'), 'Забанить ' + user);
		$('#banBtn').click(function(){
			ch.setBan($('#bantime').val(), $('#banreason').val(), user, currentRoom);
			hideForm();
		});
	}
	if(val==6){ // Кикнуть
		ch.kick(user, currentRoom);
	}
	if(val==7){ // Лишить голоса
		alert('Функционал не реализован'); return false;
		showForm(tpl('novoice'), 'Лишить голоса ' + user);
		$('#voicereason').focus();
		$('#voiBtn').click(function(){
			hideForm();
			//socket.json.send({'type':'voiceoff', 'time':$('#voicetime').val(), 'reason':$('#voicereason').val(), 'user':user});
		});	
	}
	if(val==8){ // Вернуть голос
		alert('Функционал не реализован');
		//socket.json.send({'type':'voiceon', 'user':user});
	}	
}


/********** ADDITION FUNCTIONS ************/

function tpl(tname, variables){
	template = templates[tname];
	return template.replace(RegExp('\{(.*?)\}','g'),function(a,b){	
		return isset(variables[b]) ? variables[b] : '';
	});
}
function showForm(s,capt, top){
	if(!isset(top)) top='200px';
	$('#alert').html('<h1>'+capt+'</h1> '+s).css('top', top).show();
	$('#overlay').show();
}
function hideForm(){
	if(blockOverlay) return false;
	$('#alert').hide();
	$('#overlay').hide();
}
function uplAvatar(file){
	if (!file.type.match(/image.*/)) return true;
	imageReader.onload = (function(aFile){
		return function(e){
			imaga = document.createElement('img');
			imaga.src = e.target.result;
			imaga.onload = function(){
				ch.setAvatar(imaga.src);
			}
		}
	})(file);
	imageReader.readAsDataURL(file);
}
function uplImage(file){
	if (!file.type.match(/image.*/)) { return true };
	imageReader.onload = (function(aFile){
		return function(e){
			imaga = document.createElement('img');
			imaga.src = e.target.result;
			imaga.onload = function(){
				ch.uploadImage(imaga.src);
			}
		}
	})(file);
	imageReader.readAsDataURL(file);
}
function helloStr(nick){
	$('#hello').html(tpl('hello', {n:nick}));
}
function showUserProfileWindow(udat){
	showForm(tpl('userprof'), 'Профиль '+udat['nickname']);
	var selector;
	for(var us in udat){
		selector = '#vw_'+us;
		if(selector == '#vw_gender') udat[us] = gender[udat[us]];
		$(selector).html(urlReplace(udat[us]));
	}
}

function showMyProfileWindow(udat, vis){
	showForm(tpl('myprof'), 'Мой профиль', '100px');
	for(var us in udat){
		$('#pr_'+us).val(udat[us]);
	}
	if(isset(udat['birthday'])){
		$('#pr_birthday').val(date('m/d/Y', udat['birthday']));
	}
	$('#pr_vis').val(vis);
	$('#pr_birthday').simpleDatepicker({chosendate:'01/01/1995', startdate:'01/01/1970', enddate:'01/01/2005'});
	$('#prof_save').click(function(){
		var dat = {};
		if($('#pr_gender').val()!='') dat['gender'] = $('#pr_gender').val();
		if($('#pr_birthday').val()!='') dat['birthday'] = parseDT($('#pr_birthday').val());
		if($('#pr_realname').val()!='') dat['realname'] = $('#pr_realname').val();
		if($('#pr_country').val()!='') dat['country'] = $('#pr_country').val();
		if($('#pr_email').val()!='') dat['email'] = $('#pr_email').val();
		if($('#pr_homepage').val()!='') dat['homepage'] = $('#pr_homepage').val();
		if($('#pr_phone').val()!='') dat['phone'] = $('#pr_phone').val();
		if($('#pr_icq').val()!='') dat['icq'] = $('#pr_icq').val();
		if($('#pr_skype').val()!='') dat['skype'] = $('#pr_skype').val();
		if($('#pr_twitter').val()!='') dat['twitter'] = $('#pr_twitter').val();
		if($('#pr_facebook').val()!='') dat['facebook'] = $('#pr_facebook').val();
		if($('#pr_vk').val()!='') dat['vk'] = $('#pr_vk').val();
		ch.setProfile(user.login, dat, $('#pr_vis').val());
	});
}
function addMessage(m){
	if(!isset(m.mid)) m.mid = '';
	if(m.text=='' || !isset(m.text)) return false;
	if(!isset(m.date)) m.date = time();
	m = messageAfterProc(m);
	if(m.isBot){
		var mObj = $('<dt></dt><dd class="bot">'+m.text+'</dd>');
	} else {
		m.text = '<span style="color:#'+m.color+'">'+m.text+'</span>'
		var mObj = $('<dt>'+date('H:i',m.date)+'</dt><dd id="'+m.mid+'"><span class="label">'+m.nick+'</span>'+m.text+'</dd>');
	}
	$('#mp1').append(mObj);
	toBottom();
	$("img.inlinepic", mObj).bindImageLoad(function () {
		$(this).parent().parent().height( $(this).height() );
		toBottom();
	});
	
}
function addNotif(mes, color){
	$('#mp1').append('<dt>'+date('H:i',time())+'</dt><dd class="notif" style="color:'+color+'">'+mes+'</dd>');
	playSound('notif');
	toBottom();
}
function addTopic(mes, room){
	$('#mp1').append('<dt></dt><dd class="topic">*** '+mes+' ***</dd>');
	$('#topicplace span').html(mes);
	toBottom();
}
function showNotificator(mes, time){
	$('#notificat').html(mes).fadeIn();
	setTimeout(function(){
		$('#notificat').fadeOut();
	}, time);
}
function toBottom(){
	document.getElementById('mess1').scrollTop = document.getElementById('mess1').scrollHeight;
}
function getUserItemHTML(name, nick, avaurl, status, priv, state){
	return tpl('useritem', {name:name, url:avaurl, pt:privasT[priv], p:privas[priv], priv:priv, n:nick, st:status, states:states[state], statest:statesT[state]});
}
function addUser(name, uobj){
	$('.roster-pane').append(getUserItemHTML(name, uobj['nick'], uobj['avaurl'], uobj['statustext'], uobj['commonPriv'], uobj['state']));
	$('.roster-pane table[user='+name+']').slideDown();
	$('div.profnick').click(nickClick);
}
function delUser(name){
	//delete rooms[currentRoom]['users'][name];
	$('.roster-pane table[user='+name+']').slideUp(function(){$(this).remove()});
}
function clearUsers(){
	$('.roster-pane').html('');
	$('#mp1').html('');	
}
function fillUsers(usr){
	for(var key in usr){
		$('.roster-pane').append(getUserItemHTML(key, usr[key]['nick'], usr[key]['avaurl'], usr[key]['statustext'], usr[key]['commonPriv'], usr[key]['state']));
	}
	$('div.profnick').click(nickClick);
	$('.user[user='+user.login+'] .usmenu').hide();
}
function showToolsButtons(priv){
	if(priv==1 || priv==2 || priv==3){
		$('#moderBtn').show();
	} else {
		$('#moderBtn').hide();	
	}
}
function showDesktopNotif(capt, mes){
	if(isNotif && notifEnable && !isFocus && webkitNotifications.checkPermission()==0){
		var nn = webkitNotifications.createNotification('img/notificon.png', capt, strip_tags(stripBB(mes)).substring(0,200));
		nn.show();
		nn.onclick = function(){
			this.cancel();
			$('#messageinput').focus();
		}
		var notif_timer = setTimeout(function(){
			nn.cancel();
		}, 5000); 
	}	
}
function privGrid(a,b){
	if(a==2 && b==1) return [1,4,5,6,7];
	if(a==3 && b==1) return [1,5,6,7];
	if(a==4 && b==1) return [1,3,5,6,7];
	if(a==5 && b==1) return [5,6,8];
	if(a==2 && b==2) return [4,5,6,7];
	if(a==4 && b==2) return [5,6,7];
	if(a==5 && b==2) return [5,6,8];
	if(a==2 && b==3) return [4,5,6,7];
	if(a==4 && b==3) return [3,5,6,7];
	if(a==5 && b==3) return [5,6,8];
	return [];
}

/********** AUTHENTICATION AND REGISTRATION ************/

function showAuthWindow(){
	showForm(tpl('auth'), 'Авторизация');
	$('#auth_but').click(function(){
		ch.login($('#auth_login').val(), $('#auth_pass').val());
	});
	$('#reglink').click(function(){
		showRegWindow();
		return false;
	});
	VK.Widgets.Auth("vk_auth", {width: "200px", onAuth: VKauthProc});	
}
function showRegWindow(){
	showForm(tpl('register'), 'Регистрация');
	$('#reg_but').click(function(){
		ch.registerVK($('#reg_login').val(), $('#reg_nick').val(), vkmid, vkrealname, vkurl);
	});
	$('#regbacklink').click(function(){
		showAuthWindow();
		return false;
	});
	$('#getregvk').click(function(){
		VK.Auth.login(authInfoReg);
		return false;
	});
}
function authInfoReg(response){
	if(response.session){
		var loguser = response.session.user;
		$('#reg_login').val(loguser.domain);
		$('#reg_nick').removeAttr('readonly').val(loguser.nickname);
		vkmid = loguser.id;
		vkurl = loguser.href;
		vkrealname = loguser.first_name + ' ' + loguser.last_name;
		$('#reg_but').show();
	} else {
		alert('Не получилось авторизоваться под ВК');
	}
}
function VKauthProc(data){
	if(!data) return false;
	ch.login(data.uid, data.hash, true);
}

/********** MESSAGE AFTER RECIVE ************/

function messageAfterProc(s){

	if(!s.isBot){

	var uplRegexp = /^uploadimage\|([a-z0-9:.\/]+)\|([a-z0-9:.\/]+)$/i;
	
	if(uplRegexp.test(s.text)){
		s.text.replace(uplRegexp, function(a,b,c){
			s.text = tpl('image', {url1:c, url2:b});
		});
	} else {
		s.text = s.text.replace(RegExp('(https?://)([-a-zA-Zа-яА-Я0-9@:;%!_\+.,~#?&//=]+)', 'gi'),function(link){
			var m=link.match(RegExp('(http://(www.)?youtube.com/)|(\.(jpg|jpeg|gif|png)$)', 'i'));
			if(!m){
				return '<a href="'+link+'" target="_blank">'+link+'</a>';
			} else if(m[1]){
				var yt = link.match(/v=([a-zA-Z0-9_-]+)/);
				return '<iframe width="560" height="315" src="http://www.youtube.com/embed/'+yt[1]+'" frameborder="0" allowfullscreen></iframe><a class="close_video" href="#">[X]</a>';
			} else if(m[3]){
				return tpl('image', {url1:link, url2:link});
			}
		});
	}
	
	}
	/* nl2br */
	s.text = s.text.replace(/([^>])\n/g, '$1<br />');
	
	// обращение по нику
	if(!s.fromHistory){
		if(s.text.match(user.nick+':')){
			s.text = '<b>' + s.text + '</b>';
			playSound('foryou');
			showDesktopNotif('Обращение от '+s.nick, s.text);
		} else {
			if(s.user!=user.login){
				playSound('message');
				showDesktopNotif('Чат: '+s.nick, s.text);
			}	
		}
	}
	
	// удалялка сообщений для админа
	if(user.privilege == 0 || user.privilege == 1){
		s.text += ' <span class="eras">x</span>';
	}	
	
	// смайлы
	s.text = s.text.replace(/\*smile(\d+)\*/gm, function(a,b){
		return '<img src="img/smiles/'+b+'.gif" alt="" />';
	})
	
	
	s.text = BBproc(s.text);
	
	return s;
}

/********** TEMPLATES ************/
var templates = {
	setava: '<div><img id="newavaimg" src="{src}" alt="" /></div><div><input type="file" name="files" id="inputfile" /></div><div id="avalabel">Выберите файл с картинкой. GIF анимироваться не будет</div>',
	status: '<div><input type="text" id="newstatustext" style="width:400px;" value="" /></div><input type="button" id="status_but" class="btn" value="Изменить" />',
	modmenu: '<div class="moditem" val="1">Список забаненых</div><div class="moditem" val="2">Зарегать юзера</div><div class="moditem" val="3">Топик комнаты</div>',
	topic: '<div><textarea style="width:300px; height:80px;" id="topictext">{txt}</textarea></div><input type="button" id="topic_but" class="btn" value="Изменить" />',
	auth: '<div>Логин: <input type="text" id="auth_login" /></div><div>Пароль: <input type="password" id="auth_pass" /></div><div><input type="button" id="auth_but" class="btn" value="Войти" /></div><div align="center"><div id="vk_auth"></div></div><a id="reglink" href="#">Регистрация</a>',
	register: '<p>Для регистрации нажмите ссылку получения данных из ВК, после этого по желанию можете измениить свой ник и нажмите кнопку "Зарегистрировать" <br /> <a target="_blank" href="http://redspirit.ru/any/kak-registrirovatsya-v-chate-aniavatars-com-s-uchetkoj-vk-dlya-osobo-odarennyx.html">Видео инструкция</a></p><div><a href="#" style="color:red" id="getregvk">> Получить данные из ВКонтакте <</a></div><div>Логин: <input readonly type="text" id="reg_login" /></div><div>Ник: <input readonly type="text" id="reg_nick" /></div><div><input type="button" id="reg_but" style="display:none" class="btn" value="Зарегистрировать" /></div><a id="regbacklink" href="#">Вернуться к авторизации</a>',
	hello: 'Привет, <b>{n}</b>',
	conerror: 'Невозможно подключиться к серверу. Что-то где-то не работает',
	discon: 'Произошел обрыв связи и чат отключился. Это может быть связано с плохом интерент соединением или временными неполадками на линиях связи до сервера. Возможно также, что отключился сам чат-сервер, в этом случае администрация скоро его запустит и все заработает. <br /><br /> Попробуйте заново открыть окно чата сейчас или через некоторое время.',
	statusitem: '<div class="titem stateitem" style="background-image:url(img/{s1})" val="{n}">{s2}</div>',
	userprof: '<table id="proftabl"><tr><tr><td class="r">Реальное имя:</td><td id="vw_realname"></td></tr><tr><td class="r">Пол:</td><td id="vw_gender"></td></tr><tr><td class="r">День рождения:</td><td id="vw_birthday"></td></tr><tr><td class="r">Страна:</td><td id="vw_country"></td></tr><tr><td class="r">E-mail:</td><td id="vw_email"></td></tr><tr><td class="r">Блог / страничка:</td><td id="vw_homepage"></td></tr><tr><td class="r">Телефон:</td><td id="vw_phone"></td></tr><tr><td class="r">ICQ:</td><td id="vw_icq"></td></tr><tr><td class="r">Skype:</td><td id="vw_skype"></td></tr><tr><td class="r">Twitter:</td><td id="vw_twitter"></td></tr><tr><td class="r">Facebook:</td><td id="vw_facebook"></td></tr><tr><td class="r">ВКонтакте:</td><td id="vw_vk"></td></tr></table>',
	myprof: '<table id="proftabl"><tr><tr><td>Реальное имя:</td><td><input type="text" id="pr_realname" /></td></tr><td>Пол:</td><td><select id="pr_gender"><option value="0">Не указан</option><option value="1">Мальчик</option><option value="2">Девочка</option></select></td></tr><tr> <td>День рождения:</td> <td><input type="text" id="pr_birthday" /></td></tr><tr> <td>Страна:</td> <td><input type="text" id="pr_country" /></td></tr><tr> <td>E-mail:</td> <td><input type="text" id="pr_email" /></td></tr><tr> <td>Блог / страничка:</td> <td><input type="text" id="pr_homepage" /></td></tr><tr> <td>Телефон:</td> <td><input type="text" id="pr_phone" /></td></tr><tr> <td>ICQ:</td> <td><input type="text" id="pr_icq" /></td></tr><tr> <td>Skype:</td> <td><input type="text" id="pr_skype" /></td></tr><tr> <td>Twitter:</td> <td><input type="text" id="pr_twitter" /></td></tr><tr> <td>Facebook:</td> <td><input type="text" id="pr_facebook" /></td></tr><tr> <td>ВКонтакте:</td> <td><input type="text" id="pr_vk" /></td></tr><tr><td>Видимость профиля:</td> <td><select id="pr_vis"><option value="0">Видно всем</option><option value="1">Только зарегистрированным</option><option value="2">Скрыто</option></select></td></tr></table><div align="center"><input type="button" class="btn" id="prof_save" value="Сохранить" /></div>',
	ban: '<p>Причина бана: <select id="banreason"><option value="Мат или ругательство в сообщении">Мат или ругательство в сообщении</option><option value="Мат в картинке или видео">Мат в картинке или видео</option><option value="Ссылка на ресурс с нецензурным содержанием">Ссылка на ресурс с нецензурным содержанием</option><option value="Порно или хентай">Порно или хентай</option><option value="Контент с насилием, расчлененкой или гуро">Контент с насилием, расчлененкой или гуро</option>	<option value="Оскорбление пользователя">Оскорбление пользователя</option><option value="Некорректное поведение">Некорректное поведение</option></select></p><p>Время бана: <select id="bantime"><option value="15">15 минут</option><option value="30">30 минут</option><option value="60">1 час</option><option value="180">3 часа</option><option value="360">6 часов</option><option value="720">12 часов</option><option value="1440">1 день</option><option value="4320">3 дня</option><option value="10080">1 неделя</option><option value="40320">1 месяц</option><option value="0">Навсегда</option></select></p><div><input type="button" class="btn" id="banBtn" value="Забанить!" /></div>',
	novoice: '<p>Причина: <input type="text" id="voicereason" style="width:300px" /></p><p>Время без голоса: <select id="voicetime"><option value="15">15 минут</option><option value="30">30 минут</option><option value="60">1 час</option><option value="180">3 часа</option><option value="360">6 часов</option><option value="720">12 часов</option><option value="1440">1 день</option><option value="4320">3 дня</option><option value="10080">1 неделя</option><option value="40320">1 месяц</option><option value="0">Навсегда</option></select></p><div><input type="button" class="btn" id="voiBtn" value="Перекрыть кислород!" /></div>',
	kickmes: '<div style="text-align:center;margin:20px 100px"><img src="img/kick.jpg" alt="" /><p>Уважаемый пользователь, Вас выпнули (кикнули) из этой комнаты. Это сделал модератор у которого, скорее всего, были для этого веские причины.</p><p><b>НАПОМИНАЕМ ВАМ о <a target="_blank" href="http://anime-storage.ru/index.php?topic=544.0">ПРАВИЛАХ</a> чата!</b></p><p>Если Ваше отношение к чату и его пользователям не изменится в лучшую сторону, то дело может дойти акта банного изгнания.</p></div>',
	banmes: '<div style="text-align:center;margin:20px 100px"><img src="img/banned.jpg" alt="" /> <p><b>Вы забанены в этой комнате на {time} мин. {reason}</b></p><p>Вы себя вели настолько неуважительно к чату и его пользователям, что теперь читаете эти строки без права зайти в комнату еще {time} мин. Какого хрена? Будет время - <a target="_blank" href="http://anime-storage.ru/index.php?topic=544.0">почитайте правила</a>, они очень простые и основаны на самом обычном взаимном уважении между людьми. Если вы принципиально считаете себя выше всех, то лучше сюда не возвращаться.</p></div>',
	blockmes: '<div style="text-align:center;margin:20px 100px"><img src="img/blocked.jpg" alt="" /> <p><b>Вы заблокированы, причина блокировки: "{mess}"</b></p></div>',
	useritem: '<table user="{name}" class="user"><tr><td rowspan="2" scope="col" class="cc1"><img class="profava" src="{url}" alt="" nn={n} /></td><td scope="col" style="padding-top:6px"><img class="stateSign" src="img/{states}" alt="" /> <div class="statetxt">{statest}</div></td></tr><tr><td class="cc2"><img class="upriv" title="{pt}" src="img/{p}" alt="" /> <div class="usmenu" priv="{priv}"></div></td></tr><tr><td colspan="2" class="cc3"><div class="profnick" title="Юзер: {name}">{n}</div><div class="ustatus">{st}</div></td></tr></table>',
	image: '<div class="imgcont"><a target="_blank" href="{url2}"><img class="inlinepic" src="{url1}" alt="" /></a><div class="imgpanel"><img title="Мне не нравится" class="imgcontol iDislike" src="img/dislikeimg.png" alt="" /><img title="Закрыть картинку" class="imgcontol iClose" src="img/closeimg.png" alt="" /><img title="Мне нравится" class="imgcontol iLike" src="img/likeimg.png" alt="" /></div></div>',
	vrnotif: 'Регистрация прошла успешно, теперь просто залогинтесь через ВК',
	simpimage: '<a target="_blank" href="{url2}"><img class="inlinepic" src="{url1}" alt="" /></a>',
	nonotif: 'Ваш браузер не поддерживает всплывающие уведомления! Используйте <a target="_blank" href="http://www.google.com/intl/ru/chrome/browser/">Google Chrome</a> - только он умеет создавать уведомления',
	radiocode:'	<object width="100" height="70" id="raa"><param name="allowScriptAccess" value="sameDomain" /><param name="movie" value="/lib/radio/raa.swf" /><param name="flashvars" value="playlist=/lib/radio/playlist.mpl&auto_run=false&anti_cache=false" /><param name="loop" value="false" /><param name="menu" value="false" /><param name="quality" value="high" /><embed src="/lib/radio/raa.swf" flashvars="playlist=/lib/radio/playlist.mpl&auto_run=false&anti_cache=false" loop="false" menu="false" quality="high" bgcolor="#ffffff" width="100" height="70" name="raa" allowScriptAccess="sameDomain" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" /></object>',
	rules: '<a href="http://anime-storage.ru/index.php?topic=544.0" target="_blank"><img src="img/rules.png" alt="" /></a>'
}

var smiles = {
	1:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104],
	5:[501,502,503,504,505,506,507,508,509,510,511,512,513,514,515,516,517,518,519,520,521,522,523,524,525,526,527,528,529,530,531,532,534,535,536,537,538],
	3:[601,602,603,604,605,606,607,608,609,610,611,612,613,614,615,616,617,618,619,620,621,622,623,624,625,626,627,628,629,630,631,632,633,634],
	4:[700,701,702,703,704,705,706,707,708,709,710,711,712,713,714,715,716,717,718,719,720,721,722,723,724,725,726,727,728,729,730,731,732,733,734,735,736,737,738,739,740,741,742,743,744,745,746,747,748,749,750,751,752,753,754,755,756,757,758,759,760,761,762,763,764,765,766,767,768,769,780,781,782,783,784,785,786,787,788,789,790,791,792,793],
	2:[800,801,802,803,804,805,806,807,808,809,810,811,812,813,814,815,816,817,818,819,820,821,822,823,824,825,826,827,828,829,830,831,832,833,834,836,837,838,839,840,841,843,844,845,846,847,848,849,851,852,853,854,855,856,857,858,859,860,861,862,863,864,865,866,867,868,869,870,871,872,873,874,875,876,877,878,879,880,881,882,883,884,885,886,887,888,889,890,891,892,893,894,895,896,897,898,899,900,901,902,903,904,905,906,907,908,909,910,911,912,913,914,915,916,917,918,919,920,921,922,923,924,925,926,927,928,929,930,931,932,933,934,935,936,937,938,939,940,941,943,944,945,946,947,948,949,950,951,952,953,954,955,956,957,958,959,960,961,962,963,964,965,966,967,968,969,970,971,972,973,974,975,976,977,978,979,980,981,982,983,984,985,986,987,988,989,990,991,992,993,994,995,996,997,998,999],
	6:[201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,256,257,258,259,260,261,262,263,264,265,266,267,268,269,273],
	7:[300,301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323]
}

states[0] = 'online.png'; 		statesT[0] = 'Онлайн'; 
states[1] = 'away.png'; 		statesT[1] = 'Отошел'; 
states[2] = 'busy.png'; 		statesT[2] = 'Занят'; 
states[3] = 'stop.png'; 		statesT[3] = 'Отсутствую'; 
states[4] = 'work.png'; 		statesT[4] = 'Работаю'; 
states[5] = 'learning.png'; 	statesT[5] = 'Учусь'; 
states[6] = 'game.png'; 		statesT[6] = 'Играю'; 
states[7] = 'music.png';		statesT[7] = 'Слушаю музыку';
states[8] = 'films.png';		statesT[8] = 'Смотрю фильм';
states[9] = 'food.png'; 		statesT[9] = 'Кушаю'; 
states[10] = 'coffee.png';		statesT[10] = 'Чай / кофе';
states[11] = 'home.png';		statesT[11] = 'Дела по дому';
states[12] = 'read.png';		statesT[12] = 'Читаю';
states[13] = 'sleep.png';		statesT[13] = 'Сплю';

privas[1] = 'admin.png'; 		privasT[1] = 'Админ'; 
privas[2] = 'moder.png'; 		privasT[2] = 'Модератор';
privas[3] = 'owner.png'; 		privasT[3] = 'Хозяин комнаты'; 
privas[4] = 'user.png'; 		privasT[4] = 'Пользователь'; 
privas[5] = 'novoice.png';		privasT[5] = 'Без голоса';

umItems[1] = 'Сделать админом';
umItems[2] = 'Разжаловать админа';
umItems[3] = 'Сделать модератором';
umItems[4] = 'Разжаловать модера';
umItems[5] = 'Забанить';
umItems[6] = 'Кикнуть';
umItems[7] = 'Лишить голоса';
umItems[8] = 'Вернуть голос';

var gender = {0: 'Не указано', 1: 'Мальчик', 2: 'Девочка'}