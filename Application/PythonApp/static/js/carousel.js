function infScroll(direction)
{
	var NUM_DISPLAY_ITEMS = 5;
	var itemWidthPecentage = (100 / NUM_DISPLAY_ITEMS);
	var CAROUSEL_UL_LEFT = -1* itemWidthPecentage;
	var item_width = $('.carousel_ul li').outerWidth();
	var left_indent = 0;
	if (direction == "right")
		left_indent = 0;
	else left_indent = item_width * -2;

	$('.carousel_ul:not(:animated)').animate({'left' : left_indent},750, "swing", function(){         
		if (direction == "left")
			$('.carousel_ul li:last').after($('.carousel_ul li:first')); 
		else $('.carousel_ul li:first').before($('.carousel_ul li:last')); 

		$('.carousel_ul').css({'left' : CAROUSEL_UL_LEFT + '%'}); //reset
	});
}
$(document).ready(function() {
	//move he last list item before the first item
	$('.carousel_ul li:first').before($('.carousel_ul li:last')); 
	$('#right_scroll').click(function(){infScroll('right')});
	$('#left_scroll').click(function(){infScroll('left')});
});