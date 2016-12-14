
// GLobals
exportData = {};
// For exporting to csv, give the key names => column names
exportData[0] = { 
		"perfusion" : "Perfusion",
		"cell" : "Cell",
		"gradeTime" : "Grade Time (s)",
		"normalImgCompared": "Normal Image used in comparsion",
		"contrastVal" : "Contrast percentage used"
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
var currentCell = 0;
var GRID_ROWS = 16;
var GRID_COLS = 15;

// COLORS

var PATIENT_SHADE_1 = '#F1C40F';
var PATIENT_SHADE_2 = '#F8E187';
var NORMAL_SHADE_1 = '#0E96F1';
var NORMAL_SHADE_2 = '#87CBF8';



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
	ratio = ratio * SCALE_GRID_RATIO;

	xOffset = xOffsetPercent * mainImg.width();
	yOffset = yOffsetPercent * mainImg.height();
	
	var row = 0;
	ar.each(function()
	{
		var newCoords = [];
		// calculate new coords
		for (var i in origCoords[row])
		{
			var c = origCoords[row][i];
			if (i%2)
				newCoords.push(c*ratio + yOffset);
			else newCoords.push(c*ratio + xOffset);
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

function isCellValid(cellId)
{
	if (cellId > $('area').length || cellId < 1)
	{
		console.log('Cell' + cellId + " is not valid");
		return false;
	}
	return true;
}

// Effects: creates associative array with graded cell data and adds it exportData
document.getElementById('submitGrade').onclick = function()
{
	// Check validity
	if (!isCellValid(currentCell))
		return;
	var formEls = $('input[name=grade]:checked').val();
	if (!formEls) // no grade was selected
		return;
	
	var t = new Date();
	endTime = t.getTime();
	var cellId = currentCell;
	var gradingTime = (endTime - startTime) / 1000;
	var normalSrc = normImg.attr('src');
	var normalId = normalSrc.split('/').pop();
	if (selectedNormId == '')
		normalId = "Null";
	var contrast = $('#contrastSlider').slider("value");

	// Create data object
	var data = {
		"perfusion" : $('input[name=grade]:checked').val(),
		"cell" : cellId,
		"gradeTime": gradingTime,
		"normalImgCompared": normalId,
		"contrastVal" : contrast
	};

	exportData[cellId] = data;
	++numCellsGraded;

	//unselect radio buttons
	$('input[name=grade]').each(function(){
		$(this)[0].checked = false;
	});
	
	// Save grades to server
	gradeExporter('autosave');
	
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
	gradeExporter('clickedExport');
});
// Effects: Saves graded cells to CSV file. Depending on caller parameter, user warnings might not display
function gradeExporter(caller)
{
	// Sends current grade data to server to be saved
	if (caller == 'autosave')
	{
		var imgId = gup('p');
		$.ajax({
			url: '/saveGrading',
			data: {'imgId': imgId, 'gradeData' :JSON.stringify(exportData)},
			type: 'POST',
			error: function(err){console.log("Autosave error", err)},
		});
		return;
	}
	// Alert if not all cells are graded
	if (numCellsGraded < numCells)
	{	
		alert("Are you sure? Not all of the cells have been graded.");
		//highlightUngradedCells();
	}

	var data = exportDataToCSV(exportData);
	var encodedURI = encodeURI(data);
	var link = document.createElement("a");
	link.setAttribute("href", "data:application/octet-stream," + encodedURI);
	var date = new Date().toISOString(); // might need to get rid of : for windows

	// get graderId
	var graderId = "none";
	$.ajax({
		url: '/getUser',
		data: {'caller': 'exportGrade'},
		type: 'POST',
		success: function(resp) {
			graderId = resp['user'];
		},
		error: function(err){console.log("get user error", err)},
		async: false
	});
	link.setAttribute("download", date + "_" + graderId + "_" + gup('p') +".csv");
	document.body.appendChild(link); // Required for FF

	link.click(); // This will download the data file

	if (caller == 'clickedExport') // final save to server
	{
		var imgId = gup('p');
		$.ajax({
			url: '/saveGrading',
			data: {'imgId': imgId, 'gradeData' :JSON.stringify(exportData)},
			type: 'POST',
			error: function(err){console.log("Autosave error", err)},
		});
	}
}

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



var settingsOpen = false;
var gradeViewDefaultWidth = Math.ceil($('#gradeView').width() / $('#gradeView').parent().width() * 100);
var settingsDefaultWidth = Math.ceil($('#settings').width() / $('#settings').parent().width() * 100);
// Effects: handles the transition between sliding between settings and cell grade divs
function toggleSettings()
{
	var s = $('#settings');
	var openWidth =  '45%';

	if (settingsOpen)
	{
		s.animate({width: settingsDefaultWidth + '%'});
		$('#gradeView').animate({width: gradeViewDefaultWidth + '%'}, 
			function(){ drawCellManager(currentCell); });
		$('#right').hide(); //switch arrow direction
		$('#left').show();
	}
	else 
	{
		s.animate({width: openWidth});
		$('#gradeView').animate({width: openWidth}, 
			function(){ drawCellManager(currentCell); });
		$('#right').show();
		$('#left').hide();
	}
	settingsOpen = !settingsOpen;

}


function nextCell()
{
	if (isCellValid(currentCell + 1))
		currentCell++;
	else currentCell = 1;
	drawCellManager(currentCell);
}

var selectedNormId = '';
// Effects: Selects a normal image to be used for grading comparison
function normalSelect(id)
{
	var norm = $("#"+id + ' img').first();
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
				SCALE_GRID_RATIO_NORMAL = response['scaleRatio']
				$('#normalGrid').show();
				remapNormal();

				// Styling
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
	ratio = ratio * SCALE_GRID_RATIO_NORMAL;

	xOffset = xNormOffsetPercent * img.width();
	yOffset = yNormOffsetPercent * img.height();
	
	normCoords = [];
	for (var row in origCoords)
	{
		var newCoords = [];
		for (var i in origCoords[row])
		{
			var c = origCoords[row][i];
			if (i%2)
				newCoords.push(c*ratio + yOffset);
			else newCoords.push(c*ratio + xOffset);
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
	// make sure cellId is valid
	if (isCellValid(cellId) == false)
		return;

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
	highlightCell(mainCoordsFlipped, mainCanv, mainImg.width(), mainImg.height(), PATIENT_SHADE_2, "flippedCells");
	if (selectedNormId != '')
	{
		highlightCell(n, normCanv, normImg.width(), normImg.height(), NORMAL_SHADE_1);
		highlightCell(nF, normCanv, normImg.width(), normImg.height(), NORMAL_SHADE_2, "flippedCells");
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
	ctx.canvas.width = $('#gradeView').width() * .47; //.47 = .cellContainer width
	var ratio = cellHeight / cellWidth;
	ctx.canvas.height = ctx.canvas.width * ratio;

	// account for cells that are too high
	var maxHeight = $('#rightScreen').height();
		maxHeight -= parseFloat($('#gradeView').css('padding-top')) * 2;
		maxHeight -= $('#gradeButtons').outerHeight();
		maxHeight -= $('.cellLabel').outerHeight() * 2;
		maxHeight -= parseInt($('.cellCanvas').css('padding')) * 4;
		maxHeight /= 2;
		maxHeight -= 12; //magic
	while (ctx.canvas.height > maxHeight)
	{
		ctx.canvas.width -= 2;
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
function highlightCell(inCoords, canv, width, height, color, strokeStyle)
{
	var strokeWidth = 3;
	var c = canv.getContext("2d");
	if (canv.width < 1)
	{ 
		canv.width = width;
		canv.height = height;
	}

	if (strokeStyle == "flippedCells")
		c.setLineDash([5,3]);
	else
		c.setLineDash([]);
	c.beginPath();
	for (var i = 0; i < inCoords.length; i += 2)
	{
		c.lineTo(inCoords[i], inCoords[i+1]);
	}
	c.closePath();
	c.lineWidth = strokeWidth;
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
	remap();
	drawCellManager(currentCell); //resize
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
	if (idNum <= $('#controlImgCarouselUL li').length)
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

		// Figure out what percentage width is required to display both images fully
		var maxH = ($('#fullView').height() + $('#controlImgBar').height()) / 2;
		maxH -= $('.imgLabel').height();
		var ratio = mainImg.width() / mainImg.height();
		var width = ratio * maxH;
		var leftScreenPercent = (width / $('#topScreen').width()) * 100;
		var rightScreenPercent = 100 - leftScreenPercent;
		
		leftRightScreenSplit.setSizes([leftScreenPercent,rightScreenPercent]);
		//make sure control bar is collapsed
		if (isControlBarOpen)
			toggleNormalsBar();
		$('#gradeViewSwitchBtn').html("Switch to Full View");		
	}
	else
	{
		leftRightScreenSplit.setSizes([65,35]);
		//make sure control bar gets opened
		if (isControlBarOpen == false)
			toggleNormalsBar();
		$('#gradeViewSwitchBtn').html("Switch to Grade View");
	}

	// update data
	remap();
	drawCellManager(currentCell);
	isGradeView = !isGradeView;
}

// Effects: displays an iframe with the target src
function router(target)
{
	console.log(target);
	var url = '';
	var targetFunc;
	var data;

	$('#viewFrame').empty();	

	if (target == 'normal' || target == 'patient')
		url = url_view;
	else if (target == 'upload' || target == 'uploadSubmit')
		url = url_upload;
	else if (target == 'his')
		url = url_his;
		
	$.ajax({
			url: url,
			data: { 'getContent' : target,  uploadForm: data},
			dataType: 'json',
			type: 'POST',
			success: function(response) {
				console.log(response);
				constructView(response, target);
			},
			error: function(error) {
				console.log(error);
			}
		});
}

$('#exitFrame').click(function()
{
	$('#viewFrameCont').hide();
	$('#viewFrame').empty();
});

// Effects: handles appending new html to the document
function constructView(data, type)
{
	$('#viewFrame').empty();
	source = $(data['html']).find('#content').html();
	var v = $('#viewFrame');
	v.append(source);
	$('#viewFrameCont').css({ top : '10%', left : '10%', width:'80%',height: '80%'});	
	$("#viewFrameCont").show();

	// add necessary stuff
	if (type == 'upload')
		uploadListeners();
	else if (type == 'uploadSubmit')
		gridPositionListeners();
}

// Effects: javascript needed once the upload view is created
function uploadListeners()
{
	uploadFileLabeUpdater();
	handleUploadSubmit();
}


function gridPositionListeners()
{
	// resize view window
	$('#viewFrameCont').animate({ top : '2%', left : '2%', width:'96%',height: '96%'});
	$('#focusRing').draggable();
	updateFocusRing();
	handleRingResize();
	$('#submitPosition').click(function(){submitPositionClick();});
}



// Controls contrast of cells
$('#contrastSlider').slider({max: 200, min: 100, value: 100, range: "min"});
$('#contrastSlider').children().first().attr('id', 'cSlideBG');
$('#contrastSlider').children().first().next().attr('id', 'cSlideHandle');
var ctSlide = $('#contrastSlider');
ctSlide.slider({slide: function(event, ui){changeContrast(event,ui)}});
function changeContrast(event, ui)
{
	$('#contrastOutputPercent').html(ui.value);
	$('.cellCanvas').css('filter', 'contrast(' + ui.value + '%)');
}


// User hide main img labels
$('.imgLabel').click(function(){
	$('.imgLabel p').toggle();
});