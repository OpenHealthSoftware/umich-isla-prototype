
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
var normImg = $('#normalImg');
var mainCanv = document.getElementById('mainFA_canvas');
var normCanv = document.getElementById('norm_canvas');
var frX = 0, frY = 0;
var currentCell = 0;
var GRID_ROWS = 5;
var GRID_COLS = 5;

// COLORS

var PATIENT_SHADE_1 = '#F1C40F';
var PATIENT_SHADE_2 = '#F8E187';
var NORMAL_SHADE_1 = '#0E96F1';
var NORMAL_SHADE_2 = '#87CBF8';

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

		$('area').each(function(){
				var id = parseInt($(this).attr('id').split('_')[1]);
				$(this).click(function(){drawCellManager(id)});
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


// Changes area coordinates to match scaled grid / image
function remap()
{
	remapNormal();
	console.log("Remap called");
	var ar = $('area');
	var grid = document.getElementById('mainFA_image');
	var gridWidth = grid.width;
	var gridNatWidth = grid.naturalWidth;
	var ratio = gridWidth / gridNatWidth;

	xOffset = xOffsetPercent * mainImg.width();
	yOffset = yOffsetPercent * mainImg.height();
	
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


	// reset trace canvas size --- mOVE SOMEWHERE ELSE 
	$('.traceCanvas').each(function(){
		//if ($(this).width < mainImg.width()) // don't need to resize if canvas is bigger or equal
		$(this)[0].width = mainImg.width();
		$(this)[0].height = mainImg.height();
	});

}



document.getElementById('submitGrade').onclick = function()
{
	var t = new Date();
	endTime = t.getTime();
	var formEls = $('input[name=grade]:checked').val();
	var cellId = currentCell;
	var gradingTime = (endTime - startTime) / 1000;
	// Create data object
	var data = {
		"perfusion" : $('input[name=grade]:checked').val(),
		"cell" : cellId,
		"gradeTime": gradingTime
	};

	exportData[cellId] = data;
	++numCellsGraded;

	//unselect radio buttons
	$('input[name=grade]').each(function(){
		$(this)[0].checked = false;
	});
	

	nextCell();
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
		//highlightUngradedCells();
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
	// clear canvas
	$('.traceCanvas').each(function(){
		var c = $(this)[0].getContext('2d');
		c.clearRect(0,0, $(this)[0].width, $(this)[0].height);
	});

	var cells = $('area');
	// loop through all cells
	cells.each(function()
	{
		var cellId = $(this).attr('id');
		cellId = parseInt(cellId.split('_')[1]); //cell_XXX
		if (!exportData[cellId]) //cell hasn't' been graded
		{
			cellCoords = parseHTMLAreaCoords($(this).prop('id'));
			highlightCell(cellCoords, mainCanv, mainImg.width(), mainImg.height(), "red");
		}
	});
}



var settingsOpen = true;
var gradeViewDefaultWidth = $('#gradeView').width() / $('#gradeView').parent().width() * 100;
var settingsDefaultWidth = $('#settings').width() / $('#settings').parent().width() * 100;
// Effects: handles the transition between sliding between settings and cell grade divs
function toggleSettings()
{
	var s = $('#settings');
	var openWidth =  '49%';

	if (settingsOpen)
	{
		$('#settings').animate({width: settingsDefaultWidth + '%'});
		$('#gradeView').animate({width: gradeViewDefaultWidth + '%'}, 
			function(){ drawCellManager(currentCell); });
	}
	else 
	{
		$('#settings').animate({width: openWidth});
		$('#gradeView').animate({width: openWidth}, 
			function(){ drawCellManager(currentCell); });
	}
	settingsOpen = !settingsOpen;

}


function nextCell()
{
	if (currentCell + 1 <= $('area').length)
		currentCell++;
	else currentCell = 1;
	drawCellManager(currentCell);
}

var selectedNormId = '';
// Effects: Selects a normal image to be used for grading comparison
function normalSelect(id)
{
	var norm = $("#"+id).children().first();
	var normFullView = normImg;
	normFullView.attr('src', norm.attr('src'));
	var imgId = normFullView.attr('src').split('/').pop();
	imgId = imgId.split('.')[0];

	// AJAX call to get xyOffset for grid
	$.ajax({
			url: '/normalData',
			data: { 'picName' : imgId},
			type: 'POST',
			success: function(response) {
				$('#normalGrid').attr('src', response['gridSrc']);
				xNormOffsetPercent = response['x'];
				yNormOffsetPercent = response['y'];
				$('#normalGrid').show();
				$('#focusRing').hide();
				remapNormal();
				if (selectedNormId != '')
					$('#' + selectedNormId).removeClass("selected");

				$('#' + id).addClass("selected");
				selectedNormId = id;
				if (currentCell != 0)
					drawCellManager(currentCell);
			},
			error: function(error) {
				console.log(error);
			}
		});
}

var xNormOffsetPercent = 0, yNormOffsetPercent = 0;
var normCoords = [];

var quickView = false;
$('#quickViewBtn').unbind().click(function()
{
	var c = document.getElementById('cellViewCanvas');
	if (quickView == false)
	{
		$('area').each(function(){$(this).unbind()});
		$('area').each(function(){
			var id = parseInt($(this).attr('id').split('_')[1]);
			$(this).hover(function(){drawCellManager(id)});
		});
	}
	else {
		$('area').each(function(){$(this).unbind()});
			$('area').each(function(){
				var id = parseInt($(this).attr('id').split('_')[1]);
			$(this).click(function(){drawCellManager(id)});
		});
	}
	quickView = !quickView;
}
);


function remapNormal()
{
	var img = normImg;
	var grid = document.getElementById('normalImg');
	var gridWidth = grid.width;
	var gridNatWidth = grid.naturalWidth;
	var ratio = gridWidth / gridNatWidth;

	xOffset = xNormOffsetPercent * img.width();
	yOffset = yNormOffsetPercent * img.height();
	
	normCoords = [];
	for (var row in origCoords)
	{
		var newCoords = [];
		for (var i in origCoords[row])
		{
			var c = parseInt(origCoords[row][i]);
			if (i%2)
				newCoords.push(parseInt(c*ratio) + yOffset);
			else newCoords.push(parseInt(c*ratio) + xOffset);
		}
		normCoords.push(newCoords);
	}
}

// Effects: returns a float array of the coords stored in the area html tags
function parseHTMLAreaCoords(elId)
{
		var cell = document.getElementById(elId);
		var cellCoords = cellCoords = cell.getAttribute("coords");

		// Convert string to int array
		cellCoords = cellCoords.split(',');
		for (var i = 0; i < cellCoords.length; i++)
			cellCoords[i] = parseFloat(cellCoords[i]);

		return cellCoords;
}

var hasCellBeenDrawn = false; //prevents resizing error
// Effects: handles drawing the multiple respective cells for one single clicked cell
function drawCellManager(cellId)
{
	// Clear trace canvases
	$('.traceCanvas').each(function(){
		var c = $(this)[0].getContext('2d');
		c.clearRect(0,0, $(this)[0].width, $(this)[0].height);
	});

	var mainId = mainImg.prop('id');
	var normId = normImg.prop('id');

	var patientCanvas = document.getElementById('cellViewCanvas');
	var patientFlippedCanvas = document.getElementById('mainCellFlippedCanvas');
	var normalCanvas = document.getElementById('normalCellViewCanvas');
	var normalFlippedCanvas = document.getElementById('normalCellFlippedCanvas');


	// convert cellId to row col 
	var row = Math.floor(cellId / GRID_COLS);
	var col = cellId % GRID_COLS;
	var	mirrorRow = (GRID_ROWS -1) - row;
	if (col == 0)  // edge case
	{ 
		col = GRID_COLS;
		mirrorRow++;
	}
	var mirrorCell = 0;
	mirrorCell = mirrorRow * GRID_COLS + col;

	// coords
	var mainCoords = parseHTMLAreaCoords('cell_' + cellId);
	var mainCoordsFlipped = parseHTMLAreaCoords('cell_' + mirrorCell);
	var n = [], nF = [];	

	drawCell(cellId, patientCanvas, mainId, mainCoords, "patient");
	drawCell(mirrorCell, patientFlippedCanvas, mainId, mainCoordsFlipped, "patient", "flipped");
	if (selectedNormId != '')
	{
		for (var i in normCoords[cellId-1]) n.push(normCoords[cellId-1][i]); // Since slice seems to cause bugs
		for (var i in normCoords[mirrorCell-1]) nF.push(normCoords[mirrorCell-1][i]);
		drawCell(cellId, normalCanvas, normId, n, "normal");
		drawCell(mirrorCell, normalFlippedCanvas, normId, nF, "normal", "flipped");
	}

	// Highlighting
	highlightCell(mainCoords, mainCanv, mainImg.width(), mainImg.height(), PATIENT_SHADE_1);
	highlightCell(mainCoordsFlipped, mainCanv, mainImg.width(), mainImg.height(), PATIENT_SHADE_2);
	if (selectedNormId != '')
	{
		highlightCell(n, normCanv, normImg.width(), normImg.height(), NORMAL_SHADE_1);
		highlightCell(nF, normCanv, normImg.width(), normImg.height(), NORMAL_SHADE_2);
	}
	

	// Updates 
	console.log("Grading cell " + cellId);
	currentCell = cellId;
	hasCellBeenDrawn = true;

	document.getElementById('gradeCell').style.display = "block";	
}



// Requires: id of the cell to be drawn, the canvas to draw on, the source image id, the coordinates, and what type (normal or patient)
// Effects: draws the clicked cell to a canvas
function drawCell(cellId, canv, imgId, cellCoords, type)
{
	// for grading data
	if (type == "patient")
	{
		var date = new Date();
		startTime = date.getTime();
	}

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
	var ctx = canv.getContext("2d");
	var img = document.getElementById(imgId);
	// Set canvas dimensions
	ctx.canvas.width = $('.cellRow').width() * .47; //.47 = .cellContainer width
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

	ctx.drawImage(img, minX*diff, minY*diff, (cellWidth)*diff, (cellHeight)*diff, 0,0, canv.width, canv.height);
}

// Effects: Highlights the perimeter of the cell onto the passed canvas, with the canvas being the 
// same size as the passed jquery img
function highlightCell(inCoords, canv, width, height, color)
{
	var c = canv.getContext("2d");
	if (canv.width < 1)
	{ 
		canv.width = width;
		canv.height = height;
	}

	c.beginPath();
	for (var i = 0; i < inCoords.length; i += 2)
	{
		c.lineTo(inCoords[i], inCoords[i+1]);
	}
	c.closePath();
	c.strokeStyle = color;
	c.stroke();
}

var isControlBarOpen = true;
function toggleNormalsBar()
{
	var btnLabel = $('#toggleNormalsBtn').html();
	if (isControlBarOpen)
	{
		topBotScreenSplit.collapse(1);
		btnLabel = btnLabel.replace('Hide', 'Show');
	}
	else 
	{
		topBotScreenSplit.setSizes([75,25]);
		btnLabel = btnLabel.replace('Show', 'Hide');
	}

	$('#toggleNormalsBtn').html(btnLabel);
	isControlBarOpen = !isControlBarOpen;
}

var areGridsShowing = true;
function toggleGrids()
{
	var btnLabel = $('#toggleGridsBtn').html();	
	if (areGridsShowing)
		btnLabel = btnLabel.replace('Hide', 'Show');		
	else
		btnLabel = btnLabel.replace('Show', 'Hide');
	$('#toggleGridsBtn').html(btnLabel);

	$('.grid').toggle();
	areGridsShowing = !areGridsShowing;
}

// Effects: selects / shows the next normal
function nextNormal()
{
	if (selectedNormId == '')
	{
		normalSelect('control1');
		return;
	}
	// get current id num 
	var idNum = parseInt(selectedNormId.split('control')[1]);	
	idNum++;
	if (idNum < $('#controlImgCarouselUL li').length)
		normalSelect('control' + idNum);
	else normalSelect('control1');
}

var isGradeView = false;
// Effects: Transitions the interface to the grading view
function switchToGradeView()
{
	if (isGradeView == false)
	{
		// Make sure to have a normal selected
		if (selectedNormId == '')
			nextNormal();
		// Make sure a cell is selected
		if (currentCell == 0)
			nextCell();
		// resize views
		leftRightScreenSplit.setSizes([40,60]);
		//make sure control bar is collapsed
		if (isControlBarOpen)
			toggleNormalsBar();
	}
	else
	{
		leftRightScreenSplit.setSizes([65,35]);
		//make sure control bar gets opened
		if (isControlBarOpen == false)
			toggleNormalsBar();
	}

	// update data
	remap();
	drawCellManager(currentCell);
	isGradeView = !isGradeView;
}