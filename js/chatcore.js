var states = [], statesT = [], privas = [], privasS = [], privasT = [], umItems = [];
var blockOverlay = true, clickOnProf = 0, autoScroll = true;
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
	
	$('.message-pane').jScrollPane();
	
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
	$('#stateBtn').live('click', clickStatebtn);
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
	$('#mess1').scroll(function(){ // block auto scrolling
		if(this.offsetHeight+this.scrollTop >= this.scrollHeight) autoScroll = true; else autoScroll = false;
	});	
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
        $('.roster-pane table[user='+d.user+'] .statetxt').html(d.text);
		addNotif('<b>'+d.nick+'</b> изменил статусный текст на: <b>' + d.text + '</b>', '#0F419B');
		hideForm();
	} else {
		showNotificator('Ошибка установки статуса: '+d, 2000);;
	}
}
ch.response.onSetState = function(err, d){
	if(!err){
		$('.roster-pane table[user='+d.user+'] .stateSign').attr('src', 'img/'+states[d.val]);
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
$('.close-form img').live('click', function(){
	hideForm();
});
$('input[fastaction]').live('keydown', function(e){
	if(e.keyCode==13){
		var elemId = $(this).attr('fastaction');
		$('#'+elemId).trigger('click');
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
    var offset = $('#stateBtn').offset(),
        offset_top = offset.top + 20,
        targetOffset = $('#tmenu').offset();

    if (offset_top != targetOffset.top) {
        $('#tmenu').css({top: offset_top, left: offset.left - 20});
    }

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
	$('#alert').html('<div class="close-form"><img title="Закрыть" src="img/close-form.png" alt="" /></div><h1>'+capt+'</h1> '+s).css('top', top).show();
	$('#overlay').show();
}
function hideForm(){
	if(blockOverlay) return false;
	$('#alert').hide();
	$('#overlay').hide();
	$('#messageinput').focus();
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
	var pan = document.getElementById('mess1');
	if(autoScroll) pan.scrollTop = pan.scrollHeight;
}
function getUserItemHTML(name, nick, avaurl, status, priv, state){
    var usericon = '', stateBtn = '';

    if ('' != privas[priv]) {
        usericon = '<img class="usericon" src="img/' + privas[priv] +'" alt="' + privasS[priv] + '" title="' + privasS[priv] + '" />';
    }

    if (user.login == name) {
        stateBtn = 'id="stateBtn"';
    }

	return tpl('useritem', {name:name, url:avaurl, pt:privasT[priv], p:privasS[priv], priv:priv, n:nick, st:status, states:states[state], statest:statesT[state], usericon: usericon, stateBtn: stateBtn});
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
		s.text = s.text.replace(RegExp('(https?://)([-a-zA-Zа-яА-Я0-9@:;%!_\+.,~#?&//=/(/)]+)', 'gi'),function(link){
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

var smiles = {
	1:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124],
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

privas[1] = 'admin.png'; 		privasS[1] = 'admin';       privasT[1] = 'Админ';
privas[2] = 'moder.png'; 		privasS[2] = 'moder';       privasT[2] = 'Модератор';
privas[3] = 'owner.png'; 		privasS[3] = 'owner';       privasT[3] = 'Хозяин комнаты';
privas[4] = ''; 	            privasS[4] = '';            privasT[4] = 'Пользователь';
privas[5] = 'novoice.png';		privasS[5] = 'novoice';     privasT[5] = 'Без голоса';

umItems[1] = 'Сделать админом';
umItems[2] = 'Разжаловать админа';
umItems[3] = 'Сделать модератором';
umItems[4] = 'Разжаловать модера';
umItems[5] = 'Забанить';
umItems[6] = 'Кикнуть';
umItems[7] = 'Лишить голоса';
umItems[8] = 'Вернуть голос';

var gender = {0: 'Не указано', 1: 'Мальчик', 2: 'Девочка'}

