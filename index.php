<?php
	include('config.php');
	setcookie("chat", 'chat', time()+(3600*24*366), '/');
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Аниме чат Hitagi</title>
	<link rel="stylesheet" type="text/css" href="css/mark.css?<?= time() ?>" />
	<link rel="stylesheet" media="screen" type="text/css" href="js/colorpicker/css/colorpicker.css" />
<!--	<script src="http://<?= $serverip ?>:8080/socket.io/socket.io.js"></script> -->
	<script type="text/javascript" src="js/socket.io.js"></script>
	<script type="text/javascript" src="js/jquery.min.js"></script>
	<script type="text/javascript" src="js/hitagi.js"></script>
	<script type="text/javascript" src="js/tools.js"></script>
	<script type="text/javascript" src="http://userapi.com/js/api/openapi.js?1"></script>
	
<script type="text/javascript">
	var serverIp = '<?= $serverip; ?>';
	var VKAPIID = <?= $VKAPIID; ?>;
	var currentRoom = 'public';
	soundManager.url = '/hitagi-client/sounds/soundmanager2.swf';
	var ch = hitagiCreate(serverIp, 8080);

</script>	
<script type="text/javascript" src="jscore.php?1"></script>
</head>
<body>
<div id="head">
	<div id="logo">
		<h1><a target="_blank" href="http://aniavatars.com/">Аниме аватарки</a></h1>
  	</div>
	<div id="usefullinks">
		<ul>
			<li><a target="_blank" href="https://github.com/redspirit/hitagi-client/wiki/%D0%98%D1%81%D1%82%D0%BE%D1%80%D0%B8%D1%8F-%D0%B8%D0%B7%D0%BC%D0%B5%D0%BD%D0%B5%D0%BD%D0%B8%D0%B9">Лог изменений</a></li>
			<li><a target="_blank" href="http://hitagi.reformal.ru/">Предложения и пожелания</a></li>
			<li><a target="_blank" href="https://github.com/redspirit/hitagi-client">Репозиторий</a></li>
		</ul>
	</div>
	<div id="auth">
	<p id="hello">Незалогинен</p>
	<table width="100%">
	  <tr>
		<td><a id="privatemes" href="#">Личные сообщения</a></td>
		<td><a href="#" id="profile_btn">Профиль</a></td>
	  </tr>
	  <tr>
		<td><a href="#" id="setava">Сменить аватарку</a></td>
		<td><a href="#" id="logout_btn">Выйти</a></td>
	  </tr>
	</table>
	</div>	
</div>
<div id="cont">
	<div id="chat-pane">
		<ul id="chat-tabs">
			<li><a href="#" id="tabcaption" class="label">some_text</a></li>
		</ul>
		<ul id="chat-toolbar">
			<li id="smileBtn">

			</li>
			<li id="statusBtn" title="Изменить статусный текст"></li>
			<li id="colorsBtn" title="Цвет сообщения"></li>
			<li id="soundBtn" title="Включить / выключить звук"></li>
			<li id="notifBtn" title="Включить / выключить оповещения"></li>
			<li id="toolBtn" title="Настройки"></li>			
			<li id="moderBtn"></li>
			
		</ul>
		<div id="chat-rooms" class="rooms">
			<div class="room-pane">
				<div class="roster-pane"></div>
				<div class="message-pane-wrapper" id="mess1">
					<dl class="message-pane" id="mp1"></dl>
				</div>
				<div class="message-form-wrapper"></div>
				<form method="post" class="message-form">
					<input type="text" name="message" id="messageinput" class="field" autocomplete="off"/>
					<input type="button" class="btn" id="send" value="Отправить"/>
					<div id="uploadImage" title="Загрузить картинку"></div>
				</form>
			</div>
		</div>
	</div>
</div>

<div id="smileblock">
<table width="100%">
  <tr>
	<td class="smiletabs">
		<div tab="1">1</div>
		<div tab="2">2</div>
		<div tab="3">3</div>
		<div tab="4">4</div>
		<div tab="5">5</div>
		<div tab="6">6</div>
		<div tab="7">7</div>
	</td>
	<td id="smCont"><div id="smWrap"></div></td>
  </tr>
</table>
</div>

<!-- <div id="widget-radio"></div> -->
<div id="widget-help"></div>


<div id="tmenu"></div>
<div id="modmenu"></div>
<div id="notificat" style="display:none"></div>
<div id="alert" style="display:none"></div>
<div id="overlay" style="display:none"></div>
<input style="position:absolute; top:-10px; left:0; width:1px; height:1px; " type="file" id="uplFile" />
</body>
</html>