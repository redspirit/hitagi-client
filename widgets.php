<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>widgets</title>
<script type="text/javascript" src="js/jquery.min.js"></script>
<style type="text/css">
*{
	padding:0;
	margin:0;
}
.widget{
	background-color:#FFF8C7;
	box-shadow: 2px 3px 3px 0 rgba(0, 0, 0, 0.21);
	font-family: Arial, Helvetica, sans-serif;
	font-size:14px;
}
.widget-capt{
	background-color:#F4EDBE;
}
.widget-close{
	position: absolute;
	right: 0;
	top: 0;
	color: red;
	cursor:pointer;
	padding:4px;
}

</style>
<script type="text/javascript">
(function($){
	jQuery.fn.widget = function(options){
	options = $.extend({
		content: '', 
		title: 'title',
		x: 100,
		y: 100,
		width: 260,
		height:0
	}, options);

	var make = function(){
		var sx=0,sy=0;
		var w = $(this);
		w.append('<div class="widget-capt"></div><div class="widget-close">X</div><div class="widget-cont"></div>');
		w.css({'position':'absolute', 'width':options.width+'px'}).
			offset({left:options.x, top:options.y});
		$('.widget-cont', this).html(options.content).css({'padding':'5px'});
		if(options.height!=0) $('.widget-cont', this).css('height', options.height+'px')

		$('.widget-close', this).click(function(){
			w.hide();
		});
		$('.widget-capt', this).mousedown(function(e){
			sx = e.pageX; 
			sy = e.pageY;
			return false;
		}).mouseup(function(){
			sx = 0;
			sy = 0;
		}).html(options.title).css({'padding':'4px', 'cursor':'move', 'font-weight':'bold'});
		
		$('html').mousemove(function(e){
			if(sx==0 && sy==0) return false;
			var dx = sx - e.pageX; 
			var dy = sy - e.pageY;
			var off = w.offset();
			w.offset({left:off.left-dx, top:off.top-dy});
			sx = e.pageX; 
			sy = e.pageY;
		});		
	};

	return this.each(make); 
  };
})(jQuery);
$(function(){
	
	var ww = $('.widget').widget({
		content:'hello world',
		title:'my widget',
		height:100
	});

	$('#btn').click(function(){
		ww.show();
	});
	
	
});
</script>
</head>
<body>
	
	<input type="button" name="?" id="btn" value="SHOW" />
	
	<div class="widget">
	</div>
	
</body>
</html>