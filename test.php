<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>123</title>
	<script type="text/javascript" src="js/jquery.min.js"></script>
</head>
<body>
	
<script type="text/javascript">
$(function(){
	
});
</script>
<?php
	
for($i = 201; $i<=273; $i++){
	echo $i.',';
}	
	
	
?>
	
<form method="post" action="http://127.0.0.1:8081/api/login?foo=val">
    <input type="text" name="pass" title="123\n456\n789">
    <input type="text" name="command">
    <input type="submit" value="Submit">
</form>	
	
</body>
</html>