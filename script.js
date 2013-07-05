$(document).ready(function(){

//*************
// FUNCTIONS

/*logit*/ var logit = function(x){$('body').append('<div id=logit style="background:#000;position:fixed;bottom:0;right:0;color:#fff;padding:5px;font-family:arial;font-size:9px;z-index:9999"></div>');$('#logit').append(x+'<br>');};

;(function(){
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
								   || window[vendors[x]+'CancelRequestAnimationFrame'];
	}
 
	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); },
			  timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
 
	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());


;(function(){
	var resizeToFit = function(x, crop) {
		var	parentWidth = x.parent().width(),
			parentHeight = x.parent().height(),
			x_width_perc = x.width() / parentWidth,
			x_height_perc = x.height() / parentHeight;
		if (x_width_perc > x_height_perc) {
			if (crop === 'yes') {
				x.width(x.width() / x_height_perc);
				x.height(parentHeight);
				x.css({'left': -(x.width() - parentWidth) / 2, 'top': 0});
			} else {
				x.height(x.height() / x_width_perc);
				x.width(parentWidth);
				x.css({'top': (parentHeight - x.height()) / 2, 'left': 0});
			}
		} else {
			if (crop === 'yes') {
				x.height(x.height() / x_width_perc);
				x.width(parentWidth);
				x.css({'top': -(x.height() - parentHeight) / 2, 'left': 0});
			} else {
				x.width(x.width() / x_height_perc);
				x.height(parentHeight);
				x.css({'left': (parentWidth - x.width()) / 2, 'top': 0});
			}
		}
	}
	
	//*************
	// GLOBAL VARS
	var $key = $('.key'),
		$keyInner = $('.key-inner'),
		$row1 = $('.row1'),
		$row2 = $('.row2'),
		$row3 = $('.row3'),
		$row4 = $('.row4'),
		$shiftKeys = $('.k16'),
		$k16left = $('#k16left'),
		$k16right = $('#k16right'),
		$view = $('#view'),
		$arena = $('#arena'),
		keyX = 0,
		keyY = 0,
		keyXPrev = 0,
		keyYPrev = 0,
		swipePointSize = 10,
		canvasTimer,
		gameTimer,
		gameState = 'loading', // loading, menu, gameRunning, gamePaused, gameOver
		gravity = 1,
		swipePointCount = 1,
		fps = 60,
		swipePointSoundAlternate = 0
		;
	
	//*************
	// AUDIO SETUP
	//var context = initializeNewWebAudioContext();
	//context.loadSound('FlameMagic.ogg', 'swipe');
	
	
	//*************
	// RENDER KEYBOARD
	var renderKeyboard = function(){
		var row1KeyWidth = Math.floor($(window).width() / $row1.length),
			row2KeyWidth = Math.floor($(window).width() / $row2.length),
			row3KeyWidth = Math.floor($(window).width() / $row3.length),
			row4KeyWidth = Math.floor($(window).width() / $row4.length),
			row1KeyWidthRemainder = $(window).width() - ($row1.length * row1KeyWidth),
			row2KeyWidthRemainder = $(window).width() - ($row2.length * row2KeyWidth),
			row3KeyWidthRemainder = $(window).width() - ($row3.length * row3KeyWidth),
			row4KeyWidthRemainder = $(window).width() - ($row4.length * row4KeyWidth),
			keyHeight = Math.floor($(window).height() / 4);
		//$keyInner.css({'height': keyHeight, 'line-height': keyHeight + 'px'});
		$keyInner.css({'height': keyHeight});
		$row1.css({'width': row1KeyWidth});
		$row2.css({'width': row2KeyWidth});
		$row3.css({'width': row3KeyWidth});
		$row4.css({'width': row4KeyWidth});
		$('.row1:last').css({'width': row1KeyWidth + row1KeyWidthRemainder});
		$('.row2:last').css({'width': row2KeyWidth + row2KeyWidthRemainder});
		$('.row3:last').css({'width': row3KeyWidth + row3KeyWidthRemainder});
		$('.row4:last').css({'width': row4KeyWidth + row4KeyWidthRemainder});
	};renderKeyboard();
	
	//$keyInner.empty();
	
	var renderCanvas = function(){
		$view.css({'width': $(window).width(), 'height': $(window).height()});
		$arena.css({'width': $(window).width(), 'height': $(window).height()});
		resizeToFit($('#arena').find('img'), 'yes');
	};renderCanvas();
	
	//*************
	var activeArr = [];
	
	//*************
	// KEYBOARD SWIPE
	$(document).keydown(function(e){
		e.preventDefault();
		var keyCode = e.keyCode,
			keyTimer;
		
		if (keyCode !== 16) {
			var $thisKey = $('#k' + keyCode);
			$thisKey.stop();
			$thisKey.css({'opacity': 1});
			keyTimer = setTimeout(function() {
				$('#k' + keyCode).css({'opacity': 0});
			}, 125);
			keyX = $thisKey.offset().left + ($thisKey.width() / 2);
			keyY = $thisKey.offset().top + ($thisKey.height() / 2);
		} else {
			if (keyXPrev !== 0) {
				if (keyXPrev < $(window).width() / 2) {
					$k16left.stop();
					$k16left.css({'opacity': 1});
					keyTimer = setTimeout(function() {
						$k16left.css({'opacity': 0});
					}, 125);
					keyX = $k16left.offset().left + ($k16left.width() / 2);
					keyY = $k16left.offset().top + ($k16left.height() / 2);
				} else {
					$k16right.stop();
					$k16right.css({'opacity': 1});
					keyTimer = setTimeout(function() {
						$k16right.css({'opacity': 0});
					}, 125);
					keyX = $k16right.offset().left + ($k16right.width() / 2);
					keyY = $k16right.offset().top + ($k16right.height() / 2);
				}
			}
		}
		if (keyXPrev === 0) {
			keyXPrev = keyX;
			keyYPrev = keyY;
		}
		if ((keyX !== keyXPrev || keyY !== keyYPrev)/* && Math.abs(keyX - keyXPrev) < 300 && Math.abs(keyY - keyYPrev) < 300*/) {
			var swipePoint1 = new Point2D(keyXPrev, keyYPrev);
			var swipePoint2 = new Point2D(keyX, keyY);
			for (i = 0; i < activeArr.length; i++) {
				var objectLeft = activeArr[i].offset().left,
					objectTop = activeArr[i].offset().top,
					objectRight = activeArr[i].offset().left + activeArr[i].width(),
					objectBottom = activeArr[i].offset().top + activeArr[i].height(),
					objectPointTopLeft = new Point2D(objectLeft, objectTop),
					objectPointBottomRight = new Point2D(objectRight, objectBottom),
					objectPointTopRight = new Point2D(objectRight, objectTop),
					objectPointBottomLeft = new Point2D(objectLeft, objectBottom),
					objectHitTop = Intersection.intersectLineLine(swipePoint1, swipePoint2, objectPointTopLeft, objectPointTopRight),
					objectHitLeft = Intersection.intersectLineLine(swipePoint1, swipePoint2, objectPointTopLeft, objectPointBottomLeft),
					objectHitRight = Intersection.intersectLineLine(swipePoint1, swipePoint2, objectPointTopRight, objectPointBottomRight),
					objectHitBottom = Intersection.intersectLineLine(swipePoint1, swipePoint2, objectPointBottomLeft, objectPointBottomRight)
					;
				if ((objectHitTop.status === 'Intersection' || objectHitLeft.status === 'Intersection' || objectHitRight.status === 'Intersection' || objectHitBottom.status === 'Intersection') && activeArr[i].css('opacity') === '1') {
					var thisDiv = activeArr[i];
					thisDiv.css({'background-color': '#fff', 'opacity': .9});
					thisDiv.animate({'background-color': '#00f'}, {'duration': 300, 'queue': false, 'complete': function(){
						$(this).css({'height': Math.random() * 150 + 150, 'width': Math.random() * 150 + 150});
						$(this).css({'background-color': 'rgba(255,0,0,.2)', 'opacity': 1, 'border': '2px solid red', 'top': Math.random() * ($(window).height() - $(this).height()), 'left': Math.random() * ($(window).width() - $(this).width())});
					}});
				}
			}
			
			//var n1 = Math.floor(Math.abs(keyX - keyXPrev) / swipePointSize / 1.5),
			//	n2 = Math.floor(Math.abs(keyY - keyYPrev) / swipePointSize / 1.5),
			var n1 = Math.floor(Math.abs(keyX - keyXPrev) / swipePointSize / 2),
				n2 = Math.floor(Math.abs(keyY - keyYPrev) / swipePointSize / 2),
				numSwipePoints = n1 > n2 ? n1 : n2,
				numSwipePoints = numSwipePoints < 4 ? numSwipePoints : 4,
				stepX = (keyX - keyXPrev) / numSwipePoints,
				stepY = (keyY - keyYPrev) / numSwipePoints;
			//logit($('.swipePoint').length);
			if ($('.swipePoint').length > 150){
				$('.swipePoint').remove();
			}
			for (i = 0; i < numSwipePoints; i++) {
				$view.append('<div id=swipePoint' + swipePointCount + ' class=swipePoint></div>');
				var $thisSwipePoint = $('#swipePoint' + swipePointCount);
				var swipePointRandomSize = Math.random() * 30 + 5;
				$thisSwipePoint.css({'top': Math.round(keyYPrev + (stepY * (i))) - (Math.random() * 30), 'left': Math.round(keyXPrev + (stepX * (i))) - (Math.random() * 40), 'width': swipePointRandomSize + Math.abs(stepX) * 3, 'height': swipePointRandomSize + Math.abs(stepY) * 3});
				$thisSwipePoint.animate({'background-color': '#a00'}, {'duration': 250, 'queue': false, 'complete': function(){
					var $that = $(this);
					$that.css({'background-color': '#800', 'left': $that.offset().left + (Math.random() * 50 - 25), 'top': $that.offset().top - (Math.random() * 100), 'width': $that.width() / 2, 'height': $that.height() / 2});
					$that.animate({'opacity': 1}, {'duration': 70, 'queue': false, 'complete': function(){
						var $that = $(this);
						$that.css({'background-color': '#200', 'left': $that.offset().left + (Math.random() * 50 - 25), 'top': $that.offset().top - (Math.random() * 100), 'width': $that.width() / 2, 'height': $that.height() / 2});
						$that.animate({'opacity': 1}, {'duration': 70, 'queue': false, 'complete': function(){
							var $that = $(this);
							$that.remove();
						}});
	
					}});
				}});
				swipePointCount = swipePointCount + 1 < 1000 ? swipePointCount + 1 : 1;
			}
			keyXPrev = keyX;
			keyYPrev = keyY;
			
			if (swipePointSoundAlternate === 0) {
				//context.playSound('swipe');
				swipePointSoundAlternate = 1;
			} else {
				swipePointSoundAlternate = 0;
			}
		}
		clearTimeout(canvasTimer);
		canvasTimer = setTimeout(function() {
			keyXPrev = 0;
			keyYPrev = 0;
			swipePointSoundAlternate = 0;
		}, 100);
	});
	
	//*************
	// WINDOW BIND
	$(window).bind('resize', function(){
		renderKeyboard();
		renderCanvas();
	});
	
	
	
	
	
	
	
	
	
	
	$('#instruction').css({'top': $(window).height()/2 - 30});
	logit('~');

}());




});