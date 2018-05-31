var print = console.log;
// import {RegionDivider, Cell} from './Grid.js';


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

// Keys for listener
var KEYS = {
	one: 49,
	two: 50,
	three: 51,
	four: 52,
	left: 37,
	up: 38,
	right: 39,
	down: 40,
	shift: 16,
	spacebar: 32,
	enter: 13,
	tilde: 192
}

function keydownRouter(e)
{
	switch (e.which) 
	{
		case KEYS.one:
			selectPrimaryGrade(0);
			break;
		case KEYS.two:
			selectPrimaryGrade(1);
			break;
		case KEYS.three:
			selectPrimaryGrade(2);
			break;
		case KEYS.four:
			selectPrimaryGrade(3);
			break;
		case KEYS.left:
			gotoCell('prev');
			break;
		case KEYS.right:
			gotoCell('next');
			break;
		case KEYS.up:
			getNextControl(1);
			break;
		case KEYS.down:
			getNextControl(-1);
			break;
		case KEYS.enter:
			submitGrade();
			break;
		case KEYS.shift:
			break;
		case KEYS.tilde:
			cycleHypoPerfusion();
			break;
		case KEYS.tab:
			break;
	}
}

// Effects: selects the radio button at index optionIndex and submits that as the grade
function selectPrimaryGrade(optionIndex)
{
	var radioForm = $('input[name=grade]');
	if (optionIndex < 0 || optionIndex >= radioForm.length)
		return;
	radioForm[optionIndex].click();
}


function cycleHypoPerfusion(){
	if ($('#hypoperfused-grade-options').is(':visible') === false)
		return;
	
	var radioGroup = $('input[type=radio][name=hypo-grade]');
	var btnToCheck = null;
	var nextOne = false;

	radioGroup = radioGroup.toArray();
	var currentIdx = 0;
	for (var i = 0; i < radioGroup.length; i++){
		if (radioGroup[i].checked === true)
			currentIdx = i;
	}

	var newIdx = (currentIdx + 1) % radioGroup.length;
	$('input[type=radio][name=hypo-grade]').blur();
	radioGroup[newIdx].checked = true;
}






// ########################################

// TODO: should this be a default draw function?
function defaulDraw(outCanvas, img, cellInstance){
	var t = cellInstance;
	print('Drawing cell:', t.id);		

	var ctx = outCanvas.getContext('2d');
	
	ctx.clearRect(0, 0, outCanvas.width, outCanvas.height);

	var minX = t.getOrigMaxMin().min.x;
	var minY = t.getOrigMaxMin().min.y;
	var cellWidth = t.getOrigDimensions().x;
	var cellHeight = t.getOrigDimensions().y;

	var coords = t.getOriginalCoords();

		var coordsToCanvasRatio = ctx.canvas.width / cellWidth;	
		ctx.save();
		//make a clipping path that is the shape of the cell and fits in the canvas
		ctx.moveTo(coords[0]* coordsToCanvasRatio, coords[1]* coordsToCanvasRatio);
		ctx.beginPath();
		for (var i = 0; i < coords.length; i += 2)
		{
			var x = (coords[i]-minX) * coordsToCanvasRatio;
			var  y = (coords[i+1]-minY) * coordsToCanvasRatio;
			ctx.lineTo(x, y);
		}
		ctx.closePath();
		ctx.clip();

	var topleft = t.getTopLeft('orig');
	ctx.drawImage(img, topleft[0], topleft[1], cellWidth, cellHeight, 0,0, outCanvas.width, outCanvas.height);
	ctx.restore(); // reset the clip, ctx.resetClip()
}



function init()
{
	gridder = new RegionDivider(MAIN_IMAGE, GRID_CELL_COORDS);
	GRADE_DATA.globals.totalValidCells = gridder.numValidCells;
	var htmlTemplate = { elType: '<area>', id: 'cell_?', shape: 'poly', coords: null};

	gridder.makeHTML($('#wrap-mainImg'), 'append', htmlTemplate);

	gridder.onDrawCell([CELL_CANVAS, MAIN_IMAGE], function(outCanvas, img, cellInstance){
		defaulDraw(outCanvas, img, cellInstance);
	});

	gridder.cellHandler('click', function(e){
		var t = e.data.cellInstance;
		focusCell(t);
		var gridClicked = new CustomEvent('gridClicked', {detail: {id: t.id}});
		window.dispatchEvent(gridClicked);
		GRADE_CELL_TIMESTART = new Date().getTime();
	});

	
	window.addEventListener('gridClicked', function(e){
		gridder.activeCell = parseInt(e.detail.id);
		gridder.highlightCell(e.detail.id, '#F1C40F', 3);
		if (controlGridder && controlGridder.cells)
		{
			controlGridder.activeCell = parseInt(e.detail.id);
			controlGridder.getActiveCell().draw();
			// TODO: move to more appropriate place, if one
		}
	});

	gridder.updateHTML();
	
	window.onresize = function(){ resize(); };
	
	gridder.cellHandler('dblclick', function(e){

		if (quickView === false)
		{
			gridder.cellHandler('mouseover', function(e){
				focusCell(e.data.cellInstance);
				gridder.highlightCell(e.data.cellInstance.id);
			});
		}
		else
			gridder.unbindHandler('mouseover');

		quickView = !quickView;
		print('Quickview', quickView);
		
	});

	// for (var i in gridder.cells.length)
	// {
		
	// 	var nullGrade = 
	// 		{
	// 		"grades":[{"inputId":"gradeNA","value":"NA","headerName":"Perfusion Value"}],
	// 		"meta":{"comparisonImg":"","brightness":100,"time":0}
	// 		};
	// 	grider.cells[i].grades = nullGrade;
	// 	GRADE_DATA.grades[i] = nullGrade;
	// }

	gridder.getActiveCell().triggerClick();

	// TODO: use promises instead cause this is hard to follow
	if ($('#loadGradeBtn').length > 0)
	{
		$('#loadGradeBtn')[0].disabled = false;
		$('#loadGradeBtn').click(function(){
			if ($("#loadGradeForm input[type=radio]:checked").length > 0) {
				loadPreviousGrades();
				// allow access to interface
				$('.lock').removeClass('lock');
			}
		});
	}
	// TODO: select and grade multiple cells at once

	$('#highlight').click(function(){
		gridder.highlightUngraded();
	});
}



var IMG_ID = gup('p');
var quickView = false;
var GRID_CELL_COORDS;
var MAIN_IMAGE;
var COMP_IMG;
var CELL_CANVAS;
var gridder;
var controlGridder;
var WRAP_CELLCANVAS;
var GRADE_DATA = {
	grades: {},
	globals: {
		grader: '',
		sessionId: -1,
		gradeId: -1,
		patientInfo: [],
		imgId: IMG_ID,
		totalCells: 0,
		totalValidCells: 0
	}
};
var GRADE_CELL_TIMESTART;
var GRADE_CELL_TIMEEND;
var SELECTED_INPUT_CLASSES = 'checkbox-selected button-selected';
var CONTROL_IMGS = [];
var CURRENT_CONTROL;
var CURRENT_CONTROL_IDX = 0;
var CONTROL_CANVAS;
var BRIGHT_SLIDE;


$('document').ready(function(){
	CELL_CANVAS = document.getElementById('cellViewCanvas');
	CONTROL_CANVAS = document.getElementById('controlCellViewCanvas');
	MAIN_IMAGE = document.getElementById('mainFA_image');

	WRAP_CELLCANVAS = $('#wrap-cellCanvas');
	WRAP_CONTROLCANVAS = $('#wrapControlComparisons .maintain-ratio-full');

	$.ajax({
		url: '/api/v1/image',
		data: { 
			id: IMG_ID,
			selection: ['coordinates']
		},
		type: 'GET',
		success: function(response) {
			print('Init image resp:', response);
			GRID_CELL_COORDS = response.coordinates;
			GRADE_DATA.globals.totalCells = GRID_CELL_COORDS.length;
			init();
		},
		error: function(error) {
			print(error);
		}
	});

	

	var ctx = CELL_CANVAS.getContext('2d');
	ctx.canvas.height = WRAP_CELLCANVAS.width();
	ctx.canvas.width = WRAP_CELLCANVAS.height();

	var ctx2 = CONTROL_CANVAS.getContext('2d');
	ctx2.canvas.height = WRAP_CONTROLCANVAS.width();
	ctx2.canvas.width = WRAP_CONTROLCANVAS.height();

	COMP_IMG = $('#controlImg');

	getControlIds(MAIN_IMAGE.getAttribute('data-eye-side'));

	$('#controlImg').on('load', function(){
		var img = document.getElementById('controlImg');
		controlGridder = new RegionDivider(img, CONTROL_CELL_COORDS);
	
		controlGridder.onDrawCell([CONTROL_CANVAS, img], function(outCanvas, img, cellInstance){
			defaulDraw(outCanvas, img, cellInstance);
		});
	
		controlGridder.activeCell = gridder.activeCell;
		controlGridder.getActiveCell().draw();
	});

	BRIGHT_SLIDE = $('#brightness-slider');
	initSliders();

	// keyboard shortcutes
	$(window).keydown(keydownRouter);
	
});


function resize()
{
	// TODO: condense
	gridder.resize();
	//controlGridder.resize();
	
	CELL_CANVAS.width = WRAP_CELLCANVAS.width();
	CELL_CANVAS.height = WRAP_CELLCANVAS.height();
	CONTROL_CANVAS.width = WRAP_CONTROLCANVAS.width();
	CONTROL_CANVAS.height = WRAP_CONTROLCANVAS.height();
	gridder.getActiveCell().draw();
	controlGridder.getActiveCell().draw();
}


function focusCell(cell)
{
	cell.draw();
	resetGrades();
	updateGrades(cell.grades);
	$('#cellNumber').html(cell.id);
}


function gotoCell(targetCell)
{
	gridder.activateCell(targetCell);
	gridder.getActiveCell().triggerClick();
}


// GRADING ############################################
var testing = null;
$('input[name=grade]').on('click', function(){
	if ($(this).attr('id') === 'gradeHypoPerf')
	{
		$('#hypoperfused-grade-options').show();
	}
	else{
		$('#hypoperfused-grade-options').hide();
	}
});

$('.flex-radio-row label').each(function(){

	$(this).on('dblclick', function(){
		submitGrade();
	});

});

function submitGrade()
{
	var metaData = getMetaData();
	
	// check for required inputs
	var reqRadioSelector = 'input[class=input-required]:radio';
	var reqCheckSelector = 'input[class=input-required]:checkbox';
	
	// TODO: fix quick hack
	if ($('input[name=hypo-grade]:checked').val() == undefined && $('#gradeHypoPerf').prop('checked') === true)
	{
		print('Required input not filled');
		$('#notif').html('Required input not selected!');
		return -1;
	}
	// TODO: check other input types
	if ($(reqRadioSelector).length !== 0 && $(reqRadioSelector + ':checked').length === 0)
	{
		print('Required input not filled');
		$('#notif').html('Required input not selected!');
		return -1;
	}
	if ($(reqCheckSelector).length !== 0 && $(reqCheckSelector + ':checked').length === 0)
	{
		print('Required input not filled');
		$('#notif').html('Required input not selected!');
		return -1;
	}
	// TODO: ^^^^ condense

	var baseSelector = '.submit-input-container input[type=';
	var radioIns = 'radio]:checked';
	var chkIn = 'checkbox]:checked';
	// TODO: other inputs
	var recordedInputs = $(baseSelector + radioIns + ', ' + baseSelector + chkIn);
	var cellGrades = []

	for (var i = 0; i < recordedInputs.length; i++)
	{
		var input = recordedInputs[i];
		var finalValue = input.value;

		// quick hack for adding hypo-perfused percentages ########################################################
		if (input.id === 'gradeHypoPerf')
		{
			finalValue = $('input[name=hypo-grade]:checked').val();
		}

		var g = { 
			inputId: input.id, 
			value: finalValue,
			headerName: input.getAttribute('data-grade-header')
		};
		cellGrades.push(g);
	}

	var activeCell = gridder.getActiveCell();
	activeCell.grades = cellGrades;
	if (!activeCell.grades)
		gridder.numCellsGraded += 1;

	GRADE_DATA.grades[activeCell.id] = {
		grades: cellGrades,
		meta: metaData
	};

	sendGradesToServer();

	if (gridder.numCellsGraded === gridder.numValidCells)
	{
		alert('Grading completed. Click the "Export grade" button in the upper right of the interface');
		return;
	}

	gotoCell('next');


	// TODO: move
	gridder.highlightGraded();
	$('#cellNumber').html(gridder.activeCell.toString());
	$('#numGraded').html(gridder.numCellsGraded.toString() + '/' + gridder.numValidCells.toString());
}
submitGradeBtn = $('#submitGrade');
submitGradeBtn.click(function(){submitGrade()});


function getMetaData()
{
	GRADE_CELL_TIMEEND = new Date().getTime();
	var gradingTime = (GRADE_CELL_TIMEEND - GRADE_CELL_TIMESTART) / 1000; // unit=seconds
	var controlSrc = COMP_IMG.attr('src');
	controlSrc = controlSrc.split('/');
	controlSrc = controlSrc[controlSrc.length - 1];

	var d = {
		comparisonImg: controlSrc,
		brightness:  BRIGHT_SLIDE.slider('value'),
		time: gradingTime
	}
	return d;
}


function updateGrades(gradeData)
{
	// updates the grading gui

	if (!gradeData)
		return;

	for (var i in gradeData)
	{
		var g = gradeData[i];
		var jqObj = $('#' + g.inputId);
		// TODO: handle any unhandled input types
		if (jqObj[0].type === 'radio' || jqObj[0].type === 'checkbox')
			jqObj.prop('checked', true);
		else
			jqObj.attr('value', g.value);

		updateGradesCSS(jqObj);
	}
}


function resetGrades()
{
	var inputs = $('.submit-input-container input');
	$('input[name=hypo-grade]').prop('checked', false);
	$('#hypoperfused-grade-options').hide();
	// TODO: duplicated code

	inputs.each(function()
	{
		if ($(this)[0].type === 'radio' || $(this)[0].type === 'checkbox')
			$(this).prop('checked', false);
		else
			$(this).val('');
	});
	$('.checkbox-selected, .button-selected').removeClass(SELECTED_INPUT_CLASSES);
}


$('.submit-input-container input').change(function()
{
	updateGradesCSS($(this));
});


function updateGradesCSS(inputEl)
{
	var elSelectors = inputEl.attr('data-tostyle');

	// special case for radio groups, clear styling
	if (inputEl[0].type === 'radio')
	{
		var name = inputEl[0].name;
		var radioGroup = $('input[type=radio][name=' + name + ']');
		radioGroup.each(function(){
			var elSelectors = $(this).attr('data-tostyle');
			$(elSelectors).removeClass(SELECTED_INPUT_CLASSES);
		});
	}

	if (!elSelectors)
		return;

	elSelectors = elSelectors.split(',');
	
	for (i in elSelectors)
	{
		var s = elSelectors[i];
		var el = $(s);
		if (el)
		{
			// [class$=-selected]
			var classy;
			// TODO: change to custom html attr
			if (el.hasClass('selectable-checkbox'))
				classy = 'checkbox-selected';
			else if (el.hasClass('selectable-button'))
				classy = 'button-selected';

			if (classy) // how classy?
				el.toggleClass(classy);
		}
	}
}


// load grades from server
function loadPreviousGrades()
{
	var ses = $('#loadGradeForm input[name=gradeSession]:checked').val();
	var gradeUUID = $('#loadGradeForm input[name=gradeSession]:checked').attr('data-grade-uuid');
	GRADE_DATA.globals.sessionId = ses;
	GRADE_DATA.globals.gradeId = gradeUUID;

	if (ses != -1) // load grade
	{
		$.ajax({
			url: '/api/v1/grading/load',
			data: { sessionId : ses, imgId: IMG_ID, currentUser: true},
			type: 'GET',
			dataType: 'JSON',
			success:  function(resp)
			{
				print('LOAD GRADE RESP', resp);
				
				GRADE_DATA.grades = resp[gradeUUID].grades;
				GRADE_DATA.globals.grader = resp[gradeUUID].globals.grader;
				gridder.loadCellGrades(GRADE_DATA.grades);
			},
			error: function(err){ print('Load grade error', err); },
		});
	}
	// else
	// {
	// 	// init all cells to ungradable
	// 	for (var i in GRADE_DATA.globals.totalCells){
	// 		GRADE_DATA
	// 	}
	// }
	$('#form-popup').hide();
}


// saves grades to server
function sendGradesToServer()
{
	$.ajax({
		url: '/api/v1/grading/save',
		data: JSON.stringify(GRADE_DATA),
		type: 'POST',
		contentType: 'application/json',
		dataType: 'JSON',
		success: function(resp){

			GRADE_DATA.globals.sessionId = resp.sessionId;
			GRADE_DATA.globals.grader = resp.user;
			var time = new Date(new Date().getTime()).toLocaleTimeString();
			$('#notif').html('Autosaved ' + time + '.');			
		},
		error: function(err){
			print('Server save error', err);
		}
	});
}


// Generates the csv string
function generateCSV()
{
	// imguuid, cellid, grade1, grade2,...graden, meta1, meta2,...metan
	// option to remove grade_data.global values in export
	
	// first get all the possible headers
	var headers = {};
	var allGrades = GRADE_DATA.grades;
	for (var i in allGrades)
	{
		grade_i = allGrades[i].grades;
		for (var valueIdx in grade_i)
			headers[grade_i[valueIdx].headerName] = null;
	}
	headers['Feature - Artifact'] = null;
	headers['Feature - Capillary dilatation'] = null;
	headers['Feature - Capillary loss'] = null;
	headers['Feature - IRMA'] = null;
	headers['Feature - Leakage'] = null;
	headers['Feature - Microaneurysms'] = null;
	headers['Feature - Narrowing'] = null;
	headers['Feature - New vessel'] = null;
	headers['Feature - Not sure'] = null;
	headers['Feature - Pruning'] = null;
	headers['Feature - Vessel staining'] = null;

	var csvStr = '';
	var gridCellGrades = GRADE_DATA.grades;
	for (var cell in allGrades)
	{
		cellGrades = gridCellGrades[cell].grades;
		cellMeta = gridCellGrades[cell].meta;

		var row = [];

		row.push(GRADE_DATA.globals.imgId);
		row.push(cell);

		Object.keys(headers).sort().forEach(function(key, x){

			var found = false;
			for (var j in cellGrades)
			{
				if (key == cellGrades[j].headerName)
				{
					row.push(cellGrades[j].value.replace(',', ';'));
					found = true;
					break;
				}
			}
			if (!found)
				row.push('');
		});

		// add meta
		Object.keys(getMetaData()).sort().forEach(function(key, x){
			row.push(cellMeta[key].toString().replace(',', ';'));		
		});

		var rowStr = row.join(',') + '\n';
		csvStr += rowStr;
	}
	csvStr = 'ImgId,CellId,' + Object.keys(headers).sort().join(',') + ',' + 
		Object.keys(getMetaData()).sort().join(',') + '\n' + csvStr;

	// TODO: GRADE_DATA.globals values
	return csvStr;
}


$('#export').click(function(){
	exportCSV();
});


function exportCSV()
{
	var csvStr = generateCSV();
	var encodedURI = encodeURI(csvStr);
	var date = new Date().toISOString(); // TODO: might need to get rid of : for windows
	var link = document.createElement('a');
	link.setAttribute('href', 'data:application/octet-stream,' + encodedURI);

	var grader = GRADE_DATA.globals.grader;
	var imgId = GRADE_DATA.globals.imgId;
	link.setAttribute('download', date + '_' + grader + '_' + imgId + '.csv');
	document.body.appendChild(link); // Required for FF

	link.click(); // This will download the data file
}

// indicator that cell is graded



// Cell Controller ########################################
// cell info
// invert

function initSliders()
{
	BRIGHT_SLIDE = $('#brightness-slider');
	BRIGHT_SLIDE.slider({max: 250, min: 100, value: 100, range: 'min'});
	// add styling now because these aren't made until line above
	BRIGHT_SLIDE.children().first().addClass('slideBG');
	BRIGHT_SLIDE.children().first().next().addClass('slideHandle');
	BRIGHT_SLIDE.slider({slide: function(event, ui){changeFilter(event, ui, 'brightness')}});
}
function changeFilter(event, ui, f)
{
	$('#' + f + '-value').html(ui.value);
	$('.cellCanvas').css('filter', f + '(' + ui.value + '%)');
}



// Control comparison #####################################

function getControlIds(eyeSide)
{
	$.ajax({
		url: '/api/v1/image',
		data: {
			selection: ['imgData'],
			side: eyeSide,
			category: 'control'
		},
		type: 'GET',
		success: function(response) {
			print('Get controls list', response);
			// turn into an array for easier indexing in getNextControl
			
			for (var key in response)
				CONTROL_IMGS.push(response[key].imgData);
			getNextControl(1);
		},
		error: function(error) {
			print(error);
		}
	});
}


// Effects: Selects a control image to be used for grading comparison
function getNextControl(direction) //, side
{
	if (CONTROL_IMGS.length == 0)
	{
		// TODO: gui message
		print('No control images available');
		return;
	}

	CURRENT_CONTROL_IDX = (CURRENT_CONTROL_IDX + direction) % CONTROL_IMGS.length;
	CURRENT_CONTROL = CONTROL_IMGS[CURRENT_CONTROL_IDX];
	$('#controlCellStatus').css('opacity', 1);	

	$.ajax({
		url: '/api/v1/image',
		data: {
			id: CURRENT_CONTROL.imgId,
			selection: ['coordinates'],
		},
		type: 'GET',
		success: function(response) {
			CONTROL_CELL_COORDS = response.coordinates;
			print(decodeURIComponent(CURRENT_CONTROL.src));
			$('#controlImg').attr('src', decodeURIComponent(CURRENT_CONTROL.src));
			$('#controlCellStatus').css('opacity', 0);
			// will fire load event
		},
		error: function(error) {
			print(error);
		}
	});

}



// Keyboard shortcuts #####################################


// Menu tools #############################################
// show/hide grid


// show control image only while button is held down
$('#showControlBtn').mousedown(function(){
	$('#mainControl').css('opacity', '1');
});
$('#showControlBtn').mouseup(function(){
	$('#mainControl').css('opacity', '0');
});

// toggle grade indicator
$('#toggleGridsBtn').click(function(){
	toggleGrids();
});
function toggleGrids(){
	$('#grid').toggle();
}