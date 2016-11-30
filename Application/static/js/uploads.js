
// Changes the custom file upload label to display the file name
function uploadFileLabeUpdater()
{
	$('document').ready()
	{
		var fileFieldLabelText = $('#fileFieldLabel').html();
		$('#fileField').change(function()
		{
			if ( $(this).prop('files').length > 0)
				$('#fileFieldLabel').html(fileFieldLabelText + $(this).prop('files')[0]['name']);
			else $('#fileFieldLabel').html(fileFieldLabelText);
		});
	}
}

function handleUploadSubmit()
{
	$('form#uploadForm').submit(function(e){
		var formData = new FormData($(this)[0]);

		$.ajax({
			url: "uploads",
			data: formData,
			dataType: 'json',
			type: 'POST',
			async: false,
			success: function(response) {
				constructView(response, 'uploadSubmit');
			},
			error: function(error) {
				console.log(error);
			},
			cache: false,
       		contentType: false,
       		processData: false
		});
		e.preventDefault();
		return false;
	});
}
	
	
var frX = 0, frY = 0;
function updateFocusRing()
{
	var arr = [0, 0];
	arr.push($('#normalPrev').width() - $('#focusRing').width());
	arr.push($('#normalPrev').height() - $('#focusRing').height());
	console.log(arr);
	$('#focusRingCont').draggable({containment: arr,
		cursor: 'move',
		//cursorAt: { top: $('#focusRing').width(), left: $('#focusRing').width() /2},
		stop: function(e, ui){
			frX = ui.position.left;
			frY = ui.position.top;
		},
		start: function(event, ui){
			$(this).draggable('instance').offset.click = {
				left: Math.floor(ui.helper.width() / 2),
				top: Math.floor(ui.helper.height() / 2)
			};
		} 
	});
}

// Effects: resizes ring when down/up arrow keys are pressed
function handleRingResize()
{
	$(window).keydown(function(e){
		var deltaR = 0;
		if (e.which == 38)
			deltaR = 5;
		else if (e.which == 40)
			deltaR = -5;
		else return;

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
}


function submitPositionClick()
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

		var type = $('#type').val();

		$.ajax({
			url: '/uploads/position',
			data: { 'picName' : mainImg.attr('alt'), 'x' : xGridOffset, 'y' : yGridOffset, 
				'xPerc' : xOffsetPercent, 'yPerc': yOffsetPercent, 'type': type},
			type: 'POST',
			success: function(response) {
				console.log("SUCCESSSSS", response);
				$('#loading').hide();
				//Continue uploading, grade uploaded image?
				$('#continueOptions').show();
				//$('#viewFrame').empty();	
			},
			error: function(error) {
				console.log(error);
			}
		});
		// show after ajax request
		$('#loading').show();
}


