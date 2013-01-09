<?php
	
/*
	Тут собирается файл chatcore.js с шаблонами
*/	
	
	$cont = file_get_contents('js/chatcore.js');
	$tpl = 'var templates = {';
	
	foreach(array_diff(scandir('templates'), array('.', '..')) as $file) { 
		if(stristr($file, '.html')){
			$fc = file_get_contents('templates/'.$file);
			$fc = str_replace(array("\r", "\n"), '', $fc); //гасим переносы строк
			$name = substr($file, 0, -5);
			$tpl .= "$name: '$fc', ";
		}
	} 
	$tpl = substr($tpl, 0, -2);
	$tpl .= '}';
	
	header('Content-type: text/javascript');
	echo $cont.$tpl;
	
?>

