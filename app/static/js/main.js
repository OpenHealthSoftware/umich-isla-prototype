
// GLobals
exportData = {};
exportData['info'] = "Info: Grade information created from version " + VERSION;
// For exporting to csv, give the key names => column names
exportData[0] = { 
	perfusion : "Perfusion",
	cell : "Cell",
	gradeTime: "Grade Time (s)",
	normalImgCompared: "Normal Image used in comparsion",
	contrastVal : "Contrast percentage used",
	secondaryFeatures: "Secondary features"
};
libraryExamplesUsed = {};
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
var previousCell = 0;
var GRID_ROWS = 19;
var GRID_COLS = 35;
var selectedNormId = 'null';


// COLORS

var PATIENT_SHADE_1 = '#F1C40F';
var PATIENT_SHADE_2 = '#F8E187';
var NORMAL_SHADE_1 = '#0E96F1';
var NORMAL_SHADE_2 = '#87CBF8';

// Keys for listener
var KEYS = {
	one: 49,
	two: 50,
	three: 51,
	four: 52,
	left: 37,
	right: 39,
	shift: 16,
	spacebar: 32,
	enter: 13
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
	

	$('area').each(function(){
			var id = parseInt($(this).attr('id').split('_')[1]);
			$(this).mouseover(function(){drawCellManager(id); updateCellStats(id);});
			$(this).click(function(){toggleQuickView();});
	});

	// load normal image
	getNormal(1);

	// keyboard shortcutes
	$(window).keydown(keydownRouter);
}

// Effects: selects the radio button at index optionIndex and submits that as the grade
function enterGrade(optionIndex)
{
	var radioForm = $('input[name=grade]');
	if (optionIndex < 0 || optionIndex >= radioForm.length)
		return;
	radioForm[optionIndex].checked = true;
	selectPrimaryGradeOption($(radioForm[optionIndex]));
	//submitGrade();
}

function keydownRouter(e)
{
	switch (e.which) 
	{
		case KEYS.one:
			enterGrade(0);
			break;
		case KEYS.two:
			enterGrade(1);
			break;
		case KEYS.three:
			enterGrade(2);
			break;
		case KEYS.four:
			enterGrade(3);
			break;
		case KEYS.left:
			//cycleNormal(-1);
			nextCell(-1);
			break;
		case KEYS.right:
			//cycleNormal(1);
			nextCell(1);	
			break;
		case KEYS.enter:
			submitGrade();
			break;
		case KEYS.shift:
			break;
		case KEYS.spacebar:
			break;
	}
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
// $('input:radio[name=grade]').change(function(){
// 	setTimeout(function(){submitGrade()}, 200); //delay so the grader can see the selection for a bit
// })


$('.options-label').mouseup(function(){
	$(this).toggleClass('button-selected');
	$(this).parent().find('.check-select').toggleClass('checkbox-selected');
});
$('.checkbox').mouseup(function(){
	$(this).siblings('.options-label').toggleClass('button-selected');
	$(this).parent().find('.check-select').toggleClass('checkbox-selected');	
});
$('#gradeForm .button').mouseup(function(){

	$('#gradeForm .button-selected').removeClass('button-selected');
	$(this).addClass('button-selected');
})


// names of input that will be submitted for a grade
// recordedInput = [
// 	{
// 		"name": "grade",
// 		"optional" : false
// 	},
// 	{
// 		"name": "associatedFeature",
// 		"optional" : true
// 	}
// ];

// checks if a given input field was filled in / given input
// requires: jquery object of the input field
// assumes no initial values in html
function isInputFilled(el)
{
	var isFilled = true;
	var type = el.attr('type');

	switch(type){
		case 'radio':
		{	
			// see if others in group are checked
			if (!$('input[name=' + el.attr('name') + ']:checked').val())
				isFilled = false;
			break;
		}
		case 'text':
		case 'checkbox':
		case 'password':
		{
			if (el.is(":checked") === false || el.val() === "")
				isFilled = false;
		}
		// date, color, ...
	}

	return isFilled;
}

// requires: array of jquery objects
// effects: clears / deselects input
function resetInput(els)
{
	for (var i = 0; i < els.length; i++)
	{
		var el = els[i];
		var type = el.attr('type');
		if (type === "radio" || type === "checkbox")
			el[0].checked = false;
		else el.val("");
	}
	resetInputGUI();
}
function resetInputGUI()
{

	$('.checkbox-selected, .button-selected').removeClass('checkbox-selected button-selected');
}

function getSubmissionInput()
{
	// collect input
	var recordedInput = []
	$('.submit-input-container input').each(function(){ //TODO: cache
		recordedInput.push($(this));
	}); 
	return recordedInput;
}

function submitGrade()
{
	console.log("submitted grade for cell " + currentCell);

	// Check validity
	if (!isCellValid(currentCell))
		return;

	var t = new Date();
	endTime = t.getTime();
	var gradingTime = (endTime - startTime) / 1000;

	
	// collect input
	var recordedInput = getSubmissionInput();
	var inputValues = [];

	// check if input is optional or not, and get values
	for (var i = 0; i < recordedInput.length; i++)
	{
		var el = recordedInput[i];

		if (el.hasClass('optional-input') === false && isInputFilled(el) === false)
		{
			console.log("Required input not filled in");
			$('#notif').html("Required input not selected!");
			return {"error": "req input not filled in"};
		}
		
		else if (isInputFilled(el) === true)
		{
			// dont add unchecked radio values
			if (el.attr('type') === "radio" && el.is(":checked") === false)
				continue;
			else inputValues.push(el.val());
		}
	}

	
	
	var cellId = currentCell;

	var normalSrc = normImg.attr('src');
	var normalId = normalSrc.split('/').pop();
	if (selectedNormId === 'null')
		normalId = "Null";
	var contrast = $('#contrastSlider').slider("value");

	// Create data object
	var data = {
		perfusion : inputValues[0],
		cell : cellId,
		gradeTime: gradingTime,
		normalImgCompared: normalId,
	//	optionsCompared: libraryExamplesUsed, TODO exampleImgs[currentExampleImgIdx]
		contrastVal : contrast,
		secondaryFeatures: inputValues.slice(1).join('|')
	};

	if (!exportData[cellId])
		++numCellsGraded;
	exportData[cellId] = data;
	
	resetInput(recordedInput);
	
	// Save grades to server
	gradeExporter('autosave');
	console.log(data);
	if (numCellsGraded == numCells)
	{
		$('#continueFrameCont').show();
	}
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
	var cellsGraded = numCellsGraded + '/' + numCells;
	var finished = true;
	// Sends current grade data to server to be saved
	if (caller == 'autosave')
	{
		var imgId = gup('p');
		finished = false;
		$.ajax({
			url: '/saveGrading',
			data: {
				imgId: imgId, 
				gradeData: JSON.stringify(exportData), 
				gradeId: GRADE_ID,
				finished: finished, 
				cellsGraded: cellsGraded
			},
			type: 'POST',
			success:  function(resp)
			{
				var time = new Date(new Date().getTime()).toLocaleTimeString();
				var numCellsMessage = ' cells are graded.';
				if (numCellsGraded <= 1)
					numCellsMessage = ' cell is graded.';
				$('#notif').html('Autosaved ' + time + '. ' + numCellsGraded + numCellsMessage);
				GRADE_ID = resp['gradeId'];
			},
			error: function(err){console.log("Autosave error", err)},
		});
		return;
	}
	// Alert if not all cells are graded
	if (numCellsGraded < numCells)
	{	
		alert("Are you sure? Not all of the cells have been graded.");
		highlightUngradedCells();
		finished = false;
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
			data: {
				imgId: imgId, 
				gradeData: JSON.stringify(exportData), 
				gradeId: GRADE_ID,
				finished: finished, 
				cellsGraded: cellsGraded
			},
			type: 'POST',
			error: function(err){console.log("Autosave error", err)},
		});
	}
}

var areUngradedCellsHighlighted = false;
function highlightUngradedCells()
{
	if (areUngradedCellsHighlighted)
	{
		drawCellManager(currentCell);
		areUngradedCellsHighlighted = false;
		return;
	}
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
			highlightCell(cellCoords, mainCanv, mainImg.width(), mainImg.height(), "red", "",  1);
		}
	});
	areUngradedCellsHighlighted = true;
}

// requires jquery object for element to be selected
function selectPrimaryGradeOption(el)
{
	var label = $('label[for="' + el.attr('id') + '"]');
	label.first().trigger('mouseup');
	el.prop('checked', true);
}

function updateCellStats(cellId)
{
	resetInputGUI();

	var gradeStatus = "Ungraded:";
	var gradeValStr = "";

	$('#cellNumber').html(cellId + " / " + numCells);

	if (cellId in exportData && exportData[cellId].perfusion)
	{
		gradeStatus = "Graded:";

		var grades = exportData[cellId].secondaryFeatures.split('|');
		grades.unshift(exportData[cellId].perfusion); // add main grade to front
		gradeValStr = grades.join(', ');
	
		for (var i = 0; i < grades.length; i++)
		{
			$('input').each(function(){
				if ($(this).val() === grades[i])
				{
					selectPrimaryGradeOption($(this));
				}
			});
		}
	}
	else
		resetInput(getSubmissionInput());

	$('#gradeStatus').html(gradeStatus);
	$('#gradeData').html(gradeValStr);
}

function nextCell(itr)
{
	if (!itr)
		itr = 1;
	if (isCellValid(currentCell + itr))
		currentCell += itr;
	else currentCell = 1;
	//updateCellStats();
	drawCellManager(currentCell);
}

// show normal image only while button is held down
$('#showNormalBtn').mousedown(function(){
	$('#mainNormal').css('opacity', '1');
});
$('#showNormalBtn').mouseup(function(){
	$('#mainNormal').css('opacity', '0');
});


var normCoords = [];

var quickView = true;
function toggleQuickView()
{
	if (arguments.length == 1 && arguments[0] != previousCell) //So quickview isn't enabled when clicking on another cell'
		return;
	var c = document.getElementById('cellViewCanvas');
	if (quickView == false) // turn on quickview
	{
		$('area').each(function(){$(this).unbind()});
		$('area').each(function(){
			var id = parseInt($(this).attr('id').split('_')[1]);
			$(this).unbind('click');	
			$(this).mouseover(function(){drawCellManager(id); updateCellStats(id)});
			$(this).click(function(){toggleQuickView(); updateCellStats(id)});
		});
		// enable grid 
		if (areGridsShowing == false) toggleGrids();
	}
	else {
		$('area').each(function(){$(this).unbind()});
		$('area').each(function(){
			var id = parseInt($(this).attr('id').split('_')[1]);
			$(this).unbind('mouseover');
			$(this).click(function(){
				drawCellManager(id);
				updateCellStats(id);
				toggleQuickView(id);
			});
		});
	}
	quickView = !quickView;
}

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


	// // load previous grade if any
	// if (exportData[cellId])
	// 	$(':radio[value=' + exportData[cellId].perfusion + ']')[0].checked = true;
	// else //unselect radio buttons
	// 	$('input[name=grade]').each(function(){	$(this)[0].checked = false; });

	// Clear trace canvases
	$('.traceCanvas').each(function(){
		var c = $(this)[0].getContext('2d');
		c.clearRect(0,0, $(this)[0].width, $(this)[0].height);
	});

	var mainId = mainImg.prop('id');
	var normId = normImg.prop('id');

	var patientCanvas = document.getElementById('cellViewCanvas');
	// var patientFlippedCanvas = document.getElementById('mainCellFlippedCanvas');
	var normalCanvas = document.getElementById('normalCellViewCanvas');
	//var normalFlippedCanvas = document.getElementById('normalCellFlippedCanvas');


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
	//var mainCoordsFlipped = parseHTMLAreaCoords('cell_' + mirrorCell);
	var n = [], nF = [];	

	drawCell(cellId, patientCanvas, mainId, mainCoords, "patient");
	if (selectedNormId !== 'null')
	{
		for (var i in normCoords[cellId-1]) n.push(normCoords[cellId-1][i]); // Since slice seems to cause bugs
		drawCell(cellId, normalCanvas, normId, n, "normal");
	}

	// Highlighting
	highlightCell(mainCoords, mainCanv, mainImg.width(), mainImg.height(), PATIENT_SHADE_1);

	// Updates 
	console.log("Grading cell " + cellId);
	previousCell = currentCell;
	currentCell = cellId;
	hasCellBeenDrawn = true;

}

// Requires: ratio = { x: width, y: height}
// Effects: returns the dimensions of a ratio that can be fit inside a given size i.e. bounded by (maxWidth, maxHeight)
function scaleTo(ratio, maxWidth, maxHeight)
{
	var xToYratio = ratio.x / ratio.y;
	var yToXratio = ratio.y / ratio.x;
	var newDimensions = { x: 0, y: 0};
	var scaler = 1;

	if (xToYratio >= yToXratio)
	{
		scaler = maxWidth / ratio.x;
	} else {
		scaler = maxHeight / ratio.y;
	}
	newDimensions.x = ratio.x * scaler;
	newDimensions.y = ratio.y * scaler;
	return newDimensions;
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
	var dim = scaleTo({x:cellWidth, y:cellHeight}, $('#cellPreview').width(), $('#cellPreview').height());

	ctx.canvas.height = dim.y;
	ctx.canvas.width = dim.x;

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
function highlightCell(inCoords, canv, width, height, color, strokeStyle, inStrokeWidth)
{
	var strokeWidth = 3;
	if (arguments.length == 7 && arguments[6])
		strokeWidth = inStrokeWidth;
	
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
	if (isControlBarOpen)
		topBotScreenSplit.collapse(1);
	else 
		topBotScreenSplit.setSizes([75,25]);
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

// Requires: postive or negative value to step by
// Effects: selects / shows the next or previous normal
function cycleNormal(step)
{
	if (selectedNormId === 'null')
	{
		normalSelect('control1');
		return;
	}
	// get current id num 
	var idNum = parseInt(selectedNormId.split('control')[1]);	
	idNum += step;
	if (idNum > 0 && idNum <= $('#controlImgCarouselUL li').length)
		normalSelect('control' + idNum);
	else if (idNum == 0)
		normalSelect('control' + $('#controlImgCarouselUL li').length);
	else normalSelect('control1');
}

var isGradeView = false;
var controlBarHeight = $('#controlImgBar').height();
// Effects: Transitions the interface to the grading view
function switchToGradeView()
{
	if (isGradeView == false)
	{
		// Make sure to have a normal selected
		if (selectedNormId === 'null')
			cycleNormal(1);
		// Make sure a cell is selected
		if (currentCell == 0)
			nextCell();
		// resize views

		// Figure out what percentage width is required to display both images fully
		controlBarHeight = $('#controlImgBar').height(); // save user pref
		var maxH = ($('#fullView').height() + controlBarHeight) / 2;
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

		// Figure out what percentage width is required to one image fully
		var maxH = $('#fullView').height() - controlBarHeight;
		var ratio = mainImg.width() / mainImg.height();
		var width = ratio * maxH;
		var leftScreenPercent = (width / $('#topScreen').width()) * 100;
		var rightScreenPercent = 100 - leftScreenPercent;

		leftRightScreenSplit.setSizes([leftScreenPercent, rightScreenPercent]);
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


$('#exitFrame').click(function()
{
	$('#viewFrameCont').hide();
	$('#viewFrame').empty();
});

$('#exitContinueFrame').click(function()
{
	$('#continueFrameCont').hide();
});





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




function loadGrades()
{
	var ses = $('#loadGradeForm input[name=gradeSession]:checked').val();
	GRADE_ID = ses;

	if (GRADE_ID != -1) // load grade
	{
		$.ajax({
			url: '/loadGrade',
			data: { gradeId : GRADE_ID },
			type: 'POST',
			dataType: 'JSON',
			success:  function(resp)
			{
				console.log("LOAD GRADE RESP", resp);
				exportData = [];
				exportData = resp;
				numCellsGraded = Object.keys(exportData).length - 2; // minus info and col headers
				var lastCell = 1;
				for (var key in exportData)
				{
					if (exportData[key].cell > lastCell)
						lastCell = exportData[key].cell;
				}
				currentCell = lastCell;
				nextCell();
			
				//update version graded with? exportData[0][version]
			},
			error: function(err){console.log("Load grade error", err)},
		});
	}
	$('#form-popup').hide();
}




//$('.selectExampleBtn').click(function(){toggleExample($(this))});
var currentExampleName;
var currentExampleId;
function toggleExample(el,name)
{
	el = $(el);
	if (el.hasClass('selectedAssociatedFeature') === true)
		resetExampleButtons();
	
	// if not showing
	var associatedFeaturesDom = $('.asscFeatureEl');
	if (associatedFeaturesDom.is(':visible') === false)
	{
		// ajax request to get info
		api_getExample(name, function(){
			// show related elements after ajax is success
			associatedFeaturesDom.show();
			el.siblings('.asscFeatureEl2').css({'opacity': 1});
			el.addClass('selectedAssociatedFeature');
			el.children('p').html('X');
		});
	}
	else
	{
		associatedFeaturesDom.hide();
		resetExampleButtons();		
	}
}
function resetExampleButtons()
{
	$('.selectExampleBtn').each(function()
	{
			$(this).siblings('.asscFeatureEl2').css({'opacity': 0});
			$(this).removeClass('selectedAssociatedFeature');	
			$(this).children('p').html('?');	
	});
}

// libraryExamplesUsed = 
// {
// 	"name" : [
// 		{ "exampleImgId": x, "timeUsed": y},

// 	]
// }
var currentExampleImgIdx = 0;
var exampleImgs = [];
function api_getExample(name, successCallback)
{
	$.ajax({
			url: '/api/v1/library/example/' + encodeURIComponent(name),
			type: 'POST',
			dataType: 'json',
			success:  function(resp)
			{
				console.log(resp);
				var name = resp["name"];
				$('#associatedFeaturePreview').attr('src', resp['imgSrcs'][0]);
				//$('#asscFtName').html(name);
				$('#asscFtDesc').html(name + ': ' + resp['desc']);


				// start recording time looking at new example
				// var startTime = new Date();
				// stateTime = startTime.getTime();
				// libraryExamplesUsed[name].push(
				// 	{"exampleImgId": resp['optionExId'], "timeUsed": startTime}
				// );
				// // end time for old example
				// libraryExamplesUsed[currentExampleName].

				// update current values
				//currentExampleId = resp['optionExId'];
				exampleImgs = resp['imgSrcs'];
				currentExampleImgIdx = 0;
				currentExampleName = name;
				
				successCallback();
			},
			error: function(err){console.log("Fetch example error", err)},
		});
}

// Fix for JS not doing mod properly on negatives
Number.prototype.mod = function(n) {
	return ((this%n)+n)%n;
}

// gets the next or previous example in the library
function getExample(direction)
{
	currentExampleImgIdx = (currentExampleImgIdx + direction).mod(exampleImgs.length);
	$('#associatedFeaturePreview').attr('src', exampleImgs[currentExampleImgIdx]);
}

// Effects: Selects a normal image to be used for grading comparison
function getNormal(direction)
{
	$.ajax({
			url: '/api/v1/normal?id=' + selectedNormId + '&dir=' + String(direction),
			type: 'GET',
			dataType: 'json',
			success:  function(resp)
			{
				console.log(resp);
				selectedNormId = resp['id'];
				normImg.attr('src', resp['src']);
				
				//
				xNormOffsetPercent = resp['x'];
				yNormOffsetPercent = resp['y'];
				SCALE_GRID_RATIO_NORMAL = resp['scaleRatio']
				remapNormal();

				if (currentCell !== 0)
					drawCellManager(currentCell);
			},
			error: function(e){console.log(e);}
	});
}
var xNormOffsetPercent = 0, yNormOffsetPercent = 0;

// // Effects: Selects a normal image to be used for grading comparison
// function normalSelect(id)
// {
// 	var norm = $("#"+id + ' img').first();
// 	var normFullView = normImg;
// 	normFullView.attr('src', norm.attr('src'));
// 	var imgId = normFullView.attr('src').split('/').pop();
// 	imgId = imgId.split('.')[0];

// 	// AJAX call to get xyOffset for grid
// 	$.ajax({
// 			url: '/normalData',
// 			data: { 'picName' : imgId},
// 			type: 'POST',
// 			success: function(response) {
				
// 			},
// 			error: function(error) {
// 				console.log(error);
// 			}
// 		});
// }

