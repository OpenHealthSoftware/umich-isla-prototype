var uploadMainImg;
// Changes the custom file upload label to display the file name
function uploadFileLabeUpdater()
{

	var fileFieldLabelText = $('#fSpan').html();
	$('#fileField').change(function()
	{
		if ( $(this).prop('files').length > 0)
			$('#fSpan').html("File: " + $(this).prop('files')[0]['name']);
		else $('#fSpan').html(fileFieldLabelText);
	});

}

function getFileExtension(str)
{
	return str.split('.').pop();
}



$('document').ready(function(){

	if ($('#focusRing').length !== 0){
		$('#focusRing').draggable();
		updateFocusRing();
		handleRingResize();
		$('#submitPosition').click(function(){submitPositionClick();});
	}

	uploadFileLabeUpdater();


	$('form#uploadForm').submit(function(e){
		var formData = new FormData($(this)[0]);

		// check file
		var ext = getFileExtension($('#fileField').val());
		if (ext.toUpperCase() !== 'PNG')
		{
			alert('Image must be a .png file');
			e.preventDefault();
			return false;
		}
		
		$('#uploading').show();

	});

});

var frX = 0, frY = 0;
function updateFocusRing()
{
	var arr = [0, 0];
	arr.push($('#nImg').width() - $('#focusRing').width());
	arr.push($('#nImg').height() - $('#focusRing').height());
	console.log(arr);
	$('#focusRing').draggable({containment: arr,
		cursor: 'move',
		//cursorAt: { top: $('#focusRing').width(), left: $('#focusRing').width() /2},
		start: function(){ $('#instruct').hide();},
		stop: function(e, ui){
			frX = ui.position.left;
			frY = ui.position.top;
		},
	});
}

// Effects: resizes ring when down/up arrow keys are pressed
function handleRingResize()
{
	uploadMainImg = $('#nImg');
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
		var maxWidth = uploadMainImg.width();
		var maxHeight = uploadMainImg.height();
		if (width > maxWidth || width > maxHeight || width < 10) //square
			return;
		$('#focusRing').attr({'width' : width, 'height' : width});
		$('#svgCirc').attr({'cx':  cxy, 'cy': cxy, 'r': newR});
		$('#svgCenter').attr({'cx':  cxy, 'cy': cxy});


		updateFocusRing();
	});
}

var opticDiskSubmit = false, foveaSubmit = false;
// For storing optic disk submit data
var xOffsetPercent_up, yOffsetPercent_up, xGridOffset, yGridOffset;
function submitPositionClick()
{
		uploadMainImg = $('#nImg');
		var fr = $('#focusRing');
		// center of focus ring
		var x = frX + (fr.width() / 2);
		var y =  frY + (fr.width() / 2);

		// Figure out the natural values for operation on full size image
		var ringPosX = Math.floor(x * (uploadMainImg.get(0).naturalWidth / uploadMainImg.width()));
		var ringPosY = Math.floor(y * (uploadMainImg.get(0).naturalHeight / uploadMainImg.height()));
		
		var category = $('#category').val();

		if (opticDiskSubmit == false)
		{
			opticDiskSubmit = true;
			// Offset respective to current view scale
			var gridW = uploadMainImg.width();
			var gridH = uploadMainImg.height();
			// Find coordinates for top-left corner of grid
			x = x - (gridW  / 2);
			y = y - (gridH  / 2);
			xGridOffset = ringPosX;
			yGridOffset = ringPosY;

			// reset for fovea positioning
			var instructions = $('#instruct').html().replace('optic disk', 'fovea');
			var btnLabel = $('#submitPosition').html().replace('Optic Disk', 'Fovea');
			$('#instruct').html(instructions);
			$('#submitPosition').html(btnLabel);
			$('#instruct').show();
			fr.css({left:'25%', top:'25%'});
		}
		else if (foveaSubmit == false && opticDiskSubmit == true)
		{
			var fovX = ringPosX, fovY = ringPosY;
			xOffsetPercent_up = fovX / uploadMainImg.width();
			yOffsetPercent_up = fovY / uploadMainImg.height();
			
			$.ajax({
				url: '/uploads/position',
				data: { 
							'picName' : uploadMainImg.attr('alt'), 
							'foveaX' : fovX, 
							'foveaY' : fovY, 
							'xPerc' : xOffsetPercent_up, 
							'yPerc': yOffsetPercent_up, 
							'category': category, 
							'discX' : xGridOffset, 
							'discY' : yGridOffset
						},
				type: 'POST',
				success: function(response) {
					uncacheURL(uploadMainImg.attr('src'));
					$('#closeBtn').prop('disabled', false);
					$('#loading').hide();
					$('#continueOptions').show();
					//reset booleans incase user goes to upload more
					foveaSubmit = false;
					opticDiskSubmit = false;
				},
				error: function(error) {
					console.log(error);
				}
			});
			// show after ajax request
			$('#loading').show();
		}
}




function uncacheURL(url){
	// once the image is uploaded, the server modifies it, and the browser doens't
	// reflect the changes since the image gets cached
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.setRequestHeader("Cache-Control", "max-age=0");
	xhr.send();
}