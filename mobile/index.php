<!DOCTYPE html>
<html>
<head>
<title>Мобильный чат</title>
<meta charset="utf-8" />
<meta name="viewport" content="initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=yes" />
<link rel="stylesheet" type="text/css" href="mstyle.css" />
<script src="http://127.0.0.1:8080/socket.io/socket.io.js"></script>	
<script type="text/javascript" src="../js/hitagi.js?<?php echo time(); ?>"></script>
<script type="text/javascript" src="mobcore.js?<?php echo time(); ?>"></script>
<script type="text/javascript" src="http://userapi.com/js/api/openapi.js?1"></script>
<script type="text/javascript">
	var serverUrl = '127.0.0.1';
	var currentRoom = 'public';
	var VKAPIID = 1992142;
</script>	
</head>
<body>
<div id="login">
	<p class="ulogo">Хитаги Чат</p>
	<div><img src="logo.png" alt="logo" /></div>
	<div id="logform">
		<span>Логин:</span><br /><input type="text" id="logintext" /><br />
		<span>Пароль:</span><br /><input type="password" id="passtext" />
		<div id="loginfo"></div>
		<input type="button" id="logBtn" value="Войти" />
	</div>
	
	<div align="center">
		<div id="vk_auth"></div>
	</div>
	
	<p style="margin:10px 0;">Мобильный чат сайта <a target="_blank" href="http://aniavatars.com">Aniavatars.com</a></p>
</div>
<div id="chat">
	<div class="menu">
		<input type="button" class="menuBtn" id="tologin" value="Выход" />
		<input type="button" class="menuBtn" id="tostatus" value="Статус" />
		<input type="button" class="menuBtn" id="tousers" value="Юзеры" />		
	</div>
	<div id="pane"></div>
	<div id="sending">
		<input type="text" id="message" placeholder="Введите сообщение" />
	</div>
</div>
<div id="status">
	<div class="menu">
		<input type="button" class="menuBtn" id="tochat2" value="Вернуться" />	
	</div>
	/ ЕЩЕ НЕ СДЕЛАНО.. ик.. /
</div>
<div id="users">
	<div class="menu">
		<input type="button" class="menuBtn" id="tochat" value="Вернуться" />	
	</div>
	<div id="userslist"> 
	</div>
</div>
</body>
</html>