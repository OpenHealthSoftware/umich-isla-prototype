
// GLobals
exportData = {};
// For exporting to csv, give the key names => column names
exportData[0] = { 
		"perfusion" : "perfusion",
		"cell" : "cell",
		"gradeTime" : "gradeTime"
	};
startTime = 0;
endTime = 0;
numCellsGraded = 0;
numCells = 0;
var origCoords = [];
var xOffset = 0;
var yOffset = 0;
var mainImg = $('#mainFA_image');
var frX = 0, frY = 0;
var currentCell = 0;

// Effects: updates the containment bounds and cursor origin for focusring
function updateFocusRing()
{
	var arr = [0, 0];
	arr.push($('#fullView').width() - $('#focusRing').width());
	arr.push($('#fullView').height() - $('#focusRing').height());

	$('#focusRing').draggable({containment: arr,
		cursor: 'move',
		cursorAt: { top: $('#focusRing').width(), left: $('#focusRing').width() /2},
		stop: function(e, ui){
			frX = ui.position.left;
			frY = ui.position.top;
		}
	});
}

$('document').ready()
{
	// Get the html mapped grid
	numCells = $('area').length;
	// Store the original coordinates
	$('area').each(function(){
		var coords = $(this).attr('coords');
		coords = coords.split(','); // turn into array
		for (var i in coords)
			coords[i] = parseInt(coords[i]);
		origCoords.push(coords);
	});
	
	// Make user center grid
	//$('#fullView').height(mainImg.height()); 

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
	$('#submitPosition').click(function()
	{
		var fr = $('#focusRing');
		// center of focus ring
		var x = frX + (fr.width() / 2);
		var y =  frY + (fr.width() / 2);
		frY = y;
		frX = x;

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
			url: '/viewPositioned',
			data: { 'picName' : gup("p"), 'x' : xGridOffset, 'y' : yGridOffset, 'xPerc' : xOffsetPercent, 'yPerc': yOffsetPercent},
			type: 'POST',
			success: function(response) {
				console.log(response);

				// Convert to percentage
				x = (x / mainImg.width()) * 100;
				y = (y / mainImg.height()) * 100;

				document.getElementById('grid').src = response['newImgPath'];
				$('#grid').show();
				$('#focusRing').hide();
				$(this).hide();
				remap();
			},
			error: function(error) {
				console.log(error);
			}
		});
		
	});

}


window.onresize = function(){remap();};

// function for getting URL parameters
function gup(name) {
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(window.location.href);
	if(results == null)
		return null;
	else
		return unescape(results[1]);
}

var lastGridRatio = 0;
// Changes area coordinates to match scaled grid / image
function remap()
{
	console.log("Remap called");
	var ar = $('area');
	var grid = document.getElementById('mainFA_image');
	var gridWidth = grid.width;
	var gridNatWidth = grid.naturalWidth;
	var ratio = gridWidth / gridNatWidth;

	xOffset = xOffsetPercent * mainImg.width();
	yOffset = yOffsetPercent * mainImg.height();
	
	//if (gridWidth / gridNatWidth != lastGridRatio)
	{
		
		var row = 0;
		ar.each(function()
		{
			var newCoords = [];
			// calculate new coords
			for (var i in origCoords[row])
			{
				var c = parseInt(origCoords[row][i]);
				if (i%2)
					newCoords.push(parseInt(c*ratio) + yOffset);
				else newCoords.push(parseInt(c*ratio) + xOffset);
			}

			// reset html
			$(this).attr('coords', newCoords.toString());
			row++;
		});
		lastGridRatio = ratio;
	}

}

// Effects: draws the clicked cell to a canvas
function cellClick(id)
{
	console.log("Grading cell " + id);
	var date = new Date();
	startTime = date.getTime();
	//Get cell coordinates for repainting section of image
	var cell = document.getElementById("cell"+id);
	var cellCoords = cell.getAttribute("coords");

	// Convert string to int array
	cellCoords = cellCoords.split(',');
	for (var i = 0; i < cellCoords.length; i++)
		cellCoords[i] = parseInt(cellCoords[i]);


	// Find greatest x and y for cell
	var maxY = 0;
	var maxX = 0;
	var minY = cellCoords[1];
	var minX = cellCoords[0];
	for (var i = 0; i < cellCoords.length; i+=2)
	{
		if (cellCoords[i] > maxX)
			maxX = cellCoords[i];
		if (cellCoords[i] < minX)
			minX = cellCoords[i];
	
		if (cellCoords[i+1] > maxY)
			maxY = cellCoords[i+1];
		if (cellCoords[i+1] < minY)
			minY = cellCoords[i+1];
	}
	// Get rectangular cell dimensions
	var cellHeight = (maxY > minY) ? maxY - minY : minY - maxY;
	var cellWidth = (maxX > minX) ? maxX - minX : minX - maxX;

	// Draw cell onto canvas
	var c = document.getElementById("cellViewCanvas");
	var ctx = c.getContext("2d");
	var img = document.getElementById("mainFA_image");
	// Set canvas dimensions
	ctx.canvas.width = document.getElementById('cellExpanded').offsetWidth;
	var ratio = cellHeight / cellWidth;
	ctx.canvas.height = ctx.canvas.width * ratio;
	// account for cells that are too high
	var canvasAllocatedHeight = $('#gradeCell').height() 
		- ($('#gradeForm').outerHeight() + $('#submitGrade').outerHeight());
	while (ctx.canvas.height > canvasAllocatedHeight)
	{
		ctx.canvas.width -= 10;
		ctx.canvas.height = ctx.canvas.width * ratio;
	}
	//Since canvas is pulling image data as native size use difference
	var diff = img.naturalWidth / img.width;

	//Clip to cell
	ctx.moveTo(cellCoords[0], cellCoords[1]);
	ctx.beginPath();
	var coordsToCanvasRatio = ctx.canvas.width / cellWidth;
	for (var i = 0; i < cellCoords.length; i += 2)
	{
		var x = (cellCoords[i]-minX)*coordsToCanvasRatio;
		var  y = (cellCoords[i+1]-minY)*coordsToCanvasRatio;
		ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.clip();

	ctx.drawImage(img, minX*diff, minY*diff, (cellWidth)*diff, (cellHeight)*diff, 0,0, c.width, c.height);

	// Display grading box
	// Display reference images
	// Display mirrored cell (highlight on image and give options for next cell incases mirrored cell isn't correct)
	document.getElementById('gradeCell').style.display = "block";
	$('#inputCell').val(id);

	//var c = document.getElementById("gridCanvas").getContext("2d");
	//c.clearRect(cellCoords[0], cellCoords[1], cellWidth, cellHeight);
	currentCell = id;
}

document.getElementById('submitGrade').onclick = function()
{
	var t = new Date();
	endTime = t.getTime();
	var formEls = $('input[name=grade]:checked').val();
	var cellId = $('#inputCell').val();
	var gradingTime = (endTime - startTime) / 1000;
	// Create data object
	var data = {
		"perfusion" : $('input[name=grade]:checked').val(),
		"cell" : cellId,
		"gradeTime": gradingTime
	};
	//exportData.push(data);
	exportData[cellId] = data;
	++numCellsGraded;

	//unselect radio buttons
	$('input[name=grade]')[0].checked = false;
	$('input[name=grade]')[1].checked = false;
};

// Effects: turns multidim array into csv string
function exportDataToCSV(data)
{
	csvStr = '';
	for (row in data)
	{
		var rowStr = '';
		for (var col in data[row])
			rowStr += data[row][col] + ', ';
		csvStr += rowStr.slice(0,-2) + '\n';
	}
	return csvStr;
}

// Saves graded data to file
$('#export').click(function()
{
	// Alert if not all cells are graded
	if (numCellsGraded < numCells)
	{	
		alert("Arer you sure? Not all of the cells have been graded.");
		highlightUngradedCells();
	}

	var data = exportDataToCSV(exportData);
	var encodedURI = encodeURI(data);
	var link = document.createElement("a");
	link.setAttribute("href", "data:application/octet-stream," + encodedURI);
	link.setAttribute("download", "my_data.csv");
	document.body.appendChild(link); // Required for FF

	link.click(); // This will download the data file
	
});

function highlightUngradedCells()
{
	var cells = $('area');
	var c = document.getElementById("gridCanvas").getContext("2d");
	document.getElementById("gridCanvas").width = $('#grid').width();
	document.getElementById("gridCanvas").height = $('#grid').height();

	// loop through all cells
	cells.each(function()
	{
		var cellNumber = $(this).attr('id');
		cellNumber = cellNumber.substr(4, cellNumber.length - 1); // [cell]xxx
		cellNumber = parseInt(cellNumber);

		// trace
		if (!exportData[cellNumber])
		{
			//alert("cell " + cellNumber + " is ungraded");
			

			var cellCoords = $(this).attr('coords').split(',');
			c.beginPath();
			var xDiff = cellCoords[0] - (cellCoords[0] * .9);
			xDiff *= 1.5;
			var yDiff = cellCoords[1] - (cellCoords[1] * .9);
			yDiff *= 1.5;
			for (var i = 0; i < cellCoords.length; i += 2)
			{
				c.lineTo(cellCoords[i] * .9 + xDiff, cellCoords[i+1] * .9 + yDiff);
			}
			c.strokeStyle = 'red';
			c.stroke();
			c.closePath();
		}
	});
}



// Effects: handles the transition between settings and cell grade divs
var settingsOpen = true;
function toggleSettings()
{
	var s = $('#settings');
	var openWidth =  '50%';

	if (settingsOpen)
		$('#settings').animate({width: '10%'});
	else $('#settings').animate({width: openWidth});
	settingsOpen = !settingsOpen;
}


function nextCell()
{
	currentCell++;
	cellClick(currentCell);
}