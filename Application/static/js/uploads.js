	function updateFocusRing()
	{
		var arr = [0, 0];
		arr.push($('#normalPrev').width() - $('#focusRing').width());
		arr.push($('#normalPrev').height() - $('#focusRing').height());
		console.log(arr);
		$('#focusRing').draggable({containment: arr,
			cursor: 'move',
			cursorAt: { top: $('#focusRing').width(), left: $('#focusRing').width() /2},
			stop: function(e, ui){
				frX = ui.position.left;
				frY = ui.position.top;
			}
		});
	}
    $(window).keydown(function(e){
		var deltaR = 0;
		if (e.which == 38)
			deltaR = 5;
		else if (e.which == 40)
			deltaR = -5;

		var svX = parseInt($('#focusRing').attr('width'));
		var svY = parseInt($('#focusRing').attr('height'));
		var cx = parseInt($('#svgCirc').attr('cx'));
		var cy = parseInt($('#svgCirc').attr('cy'));
		var r = parseInt($('#svgCirc').attr('r'));
		var strokeWidth = parseInt($('#svgCirc').attr('stroke-width'));

		var newR = deltaR + r;
		var cxy =  newR + (strokeWidth / 2);
		var width = cxy * 2;

		// Check bounds
		var maxWidth = mainImg.width();
		var maxHeight = mainImg.height();
		if (width > maxWidth || width > maxHeight || width < 10) //square
			return;
		$('#focusRing').attr({'width' : width, 'height' : width});
		$('#svgCirc').attr({'cx':  cxy, 'cy': cxy, 'r': newR});
		$('#svgCenter').attr({'cx':  cxy, 'cy': cxy});


		updateFocusRing();
	});
	$('document').ready()
    {
		$('#focusRing').draggable();
		updateFocusRing();
		$('#submitPosition').click(function()
		{
			var fr = $('#focusRing');
			var mainImg = $('#nImg');
			// center of focus ring
			var x = frX + (fr.width() / 2);
			var y =  frY + (fr.width() / 2);

			// Figure out the natural values for operation on full size image
			xGridOffset = Math.floor(x * (mainImg.get(0).naturalWidth / mainImg.width()));
			yGridOffset = Math.floor(y * (mainImg.get(0).naturalHeight / mainImg.height()));
		
			// Offset respective to current view scale
			var gridW = mainImg.width();
			var gridH = mainImg.height();
			// Find coordinates for top-left corner of grid
			x = x - (gridW  / 2);
			y = y - (gridH  / 2);
			xOffsetPercent = x / mainImg.width();
			yOffsetPercent = y / mainImg.height();

			$.ajax({
				url: '/uploads/position',
				data: { 'picName' : mainImg.attr('alt'), 'x' : xGridOffset, 'y' : yGridOffset, 
                    'xPerc' : xOffsetPercent, 'yPerc': yOffsetPercent},
				type: 'POST',
				success: function(response) {
					document.location.href = response['goto'];
				},
				error: function(error) {
                    console.log(error);
				}
			});
			
		});
	}