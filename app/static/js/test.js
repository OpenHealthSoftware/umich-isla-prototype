var print = console.log;

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


class Cell
{
	constructor(coordinates, id, classifiers)
	{
		this.id = id;

		this.classifiers = classifiers;
		this.activeClassifiers = {};
		this.coords = coordinates;
		this._ORIG_COORDS = coordinates.slice(); //clone. maybe uneccessary
		this.active = false;
		this.canvas = null;
	}
	
	
	onDraw(params, fn)
	{
		// fn is required to have 'cellInstance' as its last parameter

		params = params.concat([this]);
		this._drawFn = fn;
		this._drawFnArgs = params;

		// TODO: if onDraw never specified, use default draw function
	}


	triggerClick(){ this.jq.trigger('click'); }


	draw(){ this._drawFn(...this._drawFnArgs); }


	getClassifiers(){
		// classifiers are the set of possible classifiers
		return this.classifiers;
	}


	getActiveClassifiers()
	{
		// activate classifiers are elements of the set classifiers, that have been defined
		return this.activeClassifiers;
	}


	setActiveClassifiers(input)
	{
		for (i in input)
		{
			if (this.classifiers.indexOf(i) === -1)
				return 'classifier ' + i + ' does not exist';
			else
				this.activeClassifiers[i] = input[i];
		}
	}

	
	calculateCoordinates(coords, scaler, xOffset, yOffset, orderOfOp)
	{
		var x = [];
		for (var c in coords)
		{
			// a cells coordinates are defined as [x1,y1, x2,y2...]			
			var offset = xOffset;
			if (c % 2)
				offset = yOffset;

			var newVal;
			if (orderOfOp === 'multiply')
				newVal = coords[c]*scaler + offset;
			else
				newVal = (coords[c] + offset) * scaler;

			x.push(newVal);
		}
		return x;
	}


	setCoordinates(scaler, xOffset, yOffset, orderOfOp)
	{
		this.coords = this.calculateCoordinates(this.coords, scaler, xOffset, yOffset, orderOfOp);
	}


	// sets this.coords to the original passed in coordinates
	resetCoordinates()
	{
		var c = [];

		for (var i in this._ORIG_COORDS)
			c.push(this._ORIG_COORDS[i]);
		this.coords = c;
	}

	
	// TODO: remove code dupe
	_getMaxMin(coords)
	{
		// Find greatest x and y for cell
		var maxX = 0, maxY = 0;
		var minX = coords[0];
		var minY = coords[1];

		for (var i = 0; i < coords.length; i+=2)
		{
			if (coords[i] > maxX)
				maxX = coords[i];
			if (coords[i] < minX)
				minX = coords[i];
		
			if (coords[i+1] > maxY)
				maxY = coords[i+1];
			if (coords[i+1] < minY)
				minY = coords[i+1];
		}
		return { min: {x: minX, y: minY}, max: {x: maxX, y: maxY}};
	}
	
    
    getMaxMin()
	{
		if (this.maxmin)
			return this.maxmin;
		this.maxmin = this._getMaxMin(this.coords);
		return this.maxmin;
	}


	getOrigMaxMin()
	{
		if (this.origMaxMin)
			return this.origMaxMin;
		this.origMaxMin = this._getMaxMin(this._ORIG_COORDS);
		return this.origMaxMin;
	}


	getCoordinates(){ return this.coords; }


	getOriginalCoords(){ return this._ORIG_COORDS.slice(); }

	
	_getDimensions(maxmin)
	{
		var x = maxmin.min.x;
		var y = maxmin.min.y;
		var maxX = maxmin.max.x;
		var maxY = maxmin.max.y;

		var cellHeight = (maxY > y) ? maxY - y : y - maxY;
		var cellWidth = (maxX > x) ? maxX - x : x - maxX;
		return {x: cellWidth, y: cellHeight};
	}
	

    getOrigDimensions()
	{
		return this._getDimensions(this.getOrigMaxMin());
	}


	getDimensions()
	{
		return this._getDimensions(this.getMaxMin());
	}


	makeHTML(containerDiv, order, template)
	{
		// htmlTemplate = { id: 'cell_?', shape: 'poly', coords: null}
		// htmlTemplate = $('<area id="cell_{{loop.index}}" shape="poly" coords="{{i}}" )
        // classifiers = ['name/id', 'name2', ...]

		var elType = template.elType;
		delete template.elType;

		for (var x in template)
		{
			if (template[x] === null)
				template[x] = this.coords.join(',');
			template[x] = template[x].replace('?', this.id);
		}
		this.jq = $(elType, template);
		this.jq.attr('coords', this.coords.join(','));

		if (order === 'append')
			containerDiv.append(this.jq);
		else if (order === 'prepend')
			containerDiv.prepend(this.jq);

	}

	updateHTML()
	{
		this.jq.attr('coords', this.coords.join(','));	
	}
}



class RegionDivider
{
	constructor(img, coords)
	{

		this.img = img;
		// coords is a 2d vector
		// [ cell0coords[x1,y10,x10,y10, x10, y1], cell1coords[] ]
		this.cells = [];
		for(var c in coords)
			this.cells.push(new Cell(coords[c], c, false))

		this.activeCell = parseInt(this.cells.length / 2);
	}


	// adds the grid/cell html to the page
	makeHTML(containerDiv, order, template)
	{
		// containerDiv = where the map div and canvas div will be placed

		var mapName = containerDiv.attr('id') + '_gridMap';
		var mapDiv = $('<map>', {id: mapName, name: mapName});
		for (var c in this.cells)
			this.cells[c].makeHTML(mapDiv, order, JSON.parse(JSON.stringify(template)));

		containerDiv.append(mapDiv);
		this.mainJq = containerDiv;
		this.mapJq = mapDiv;

		this.makeCanvas();
	}


	makeCanvas()
	{
		// creates the canvas that covers the whole image
		if (arguments.length !== 0)
			return;
			// TODO: support custom
		
		var canvas = $('<canvas/>', {class: 'traceCanvas', id: this.mainJq.attr('id') + '_canvas'});
		canvas[0].width = this.img.width;
		canvas[0].height = this.img.height;
		this.canvas = canvas;
		this.mainJq.append(canvas);
		this.canvasJq = canvas;
	}


	updateHTML()
	{
		for (var i in this.cells)
		{
			var cell = this.cells[i];
			var scaleRatio = this.img.width / this.img.naturalWidth;
			cell.resetCoordinates();
			cell.setCoordinates(scaleRatio, 0, 0, 'multiply');
			cell.updateHTML();
		}
	}


	getCell(cellIdOrCoord){ return this.cells[id]; }


	getCells(){return 0;}


	onDrawCell(params, fn)
	{
		for (var i in this.cells)
			this.cells[i].onDraw(params, fn);
	}


	onClickCell(params, fn)
	{
		for (var i in this.cells)
			this.cells[i].onClick(params, fn)
	}


	getActiveCell()
	{
		return this.cells[this.activeCell];
		// TODO: option for ref or val
	}

	activateCell(targetCell)
	{
		var dir;
		if (targetCell === 'prev')
			dir = -1;
		else if (targetCell === 'next')
			dir = 1;

		if (dir)
			this.activeCell = (parseInt(this.activeCell) + dir) % this.cells.length;
		else
			this.activeCell = targetCell % this.cells.length;
	}


	highlightCell(cellId=this.activeCell, color='#fff', strokeWidth=2)
	{
		var cell = this.cells[cellId];
		var canv = this.canvas[0];
		var c = canv.getContext('2d');
		c.clearRect(0,0, canv.width, canv.height);

		c.beginPath();
		var coords = cell.getCoordinates();
		for (var i = 0; i < coords.length; i += 2)
			c.lineTo(coords[i], coords[i+1]);
		c.closePath();
		c.lineWidth = strokeWidth;
		c.strokeStyle = color;
		c.stroke();
	}


	resize()
	{
		if (!this.canvas)
			return;
		this.canvas[0].height = this.img.height;
		this.canvas[0].width = this.img.width;
		this.updateHTML();
		this.highlightCell();
	}


	cellHandler(eventName, fn)
	{
		for (var i in this.cells)
		{
			var cell = this.cells[i];
			cell.jq.on(eventName, {cellInstance: cell}, fn);
		}
	}

	unbindHandler(eventName)
	{
		for (var i in this.cells)
			this.cells[i].jq.unbind(eventName);
	}

	loadCellGrades(gradeData)
	{
		// loads grades from GRADE_DATA into respective cells
		for (var i in gradeData)
			this.cells[i].grades = gradeData[i].grades;
	}
}

// ########################################

// TODO: should this be a default draw function?
function defaulDraw(outCanvas, img, cellInstance){
	var t = cellInstance;
	print('Drawing cell:', t.id);		

	var ctx = outCanvas.getContext('2d');

	var minX = t.getOrigMaxMin().min.x;
	var minY = t.getOrigMaxMin().min.y;
	var cellWidth = t.getOrigDimensions().x;
	var cellHeight = t.getOrigDimensions().y;

	var coords = t.getOriginalCoords();

	//print(img, coords[0], coords[1], cellWidth, cellHeight, 0,0, outCanvas.width, outCanvas.height);

	ctx.drawImage(img, coords[0], coords[1], cellWidth, cellHeight, 0,0, outCanvas.width, outCanvas.height);
}



function init()
{
	gridder = new RegionDivider(MAIN_IMAGE, GRID_CELL_COORDS);
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

	gridder.getActiveCell().triggerClick();

	// TODO: use promises instead cause this is hard to follow
	$('#loadGradeBtn')[0].disabled = false;
	$('#loadGradeBtn').click(function(){
		loadPreviousGrades();
	});

	// TODO: select and grade multiple cells at once
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
		patientInfo: [],
		imgId: IMG_ID,
		totalCells: 0
	}
};
var GRADE_CELL_TIMESTART;
var GRADE_CELL_TIMEEND;
var SELECTED_INPUT_CLASSES = 'checkbox-selected button-selected';
var CONTROL_IMGS = [];
var CURRENT_CONTROL;
var CURRENT_CONTROL_IDX = 0;
var CONTROL_CANVAS;



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

	
});


function resize()
{
	// TODO: condense
	gridder.resize();
	controlGridder.resize();
	
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
}


function gotoCell(targetCell)
{
	gridder.activateCell(targetCell);
	gridder.getActiveCell().triggerClick();
}


// GRADING ############################################

submitGradeBtn = $('#submitGrade')
submitGradeBtn.click(function()
{
	var metaData = getMetaData();
	
	// check for required inputs
	var reqRadioSelector = 'input[class=input-required]:radio';
	var reqCheckSelector = 'input[class=input-required]:checkbox';
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
		var g = { 
			inputId: input.id, 
			value: input.value,
			headerName: input.getAttribute('data-grade-header')
		};
		cellGrades.push(g);
	}

	var activeCell = gridder.getActiveCell();
	activeCell.grades = cellGrades;

	GRADE_DATA.grades[activeCell.id] = {
		grades: cellGrades,
		meta: metaData
	};

	sendGradesToServer();

	gotoCell('next');
});


function getMetaData()
{
	GRADE_CELL_TIMEEND = new Date().getTime();
	var gradingTime = (GRADE_CELL_TIMEEND - GRADE_CELL_TIMESTART) / 1000; // unit=seconds

	var d = {
		comparisonImg: COMP_IMG.attr('src'),
		brightness:  100,// TODO: $('#brightness-slider').slider('value'),
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
	GRADE_DATA.globals.sessionId = ses;

	if (ses != -1) // load grade
	{
		$.ajax({
			url: '/api/v1/grading/load',
			data: { sessionId : ses, imgId: IMG_ID },
			type: 'GET',
			dataType: 'JSON',
			success:  function(resp)
			{
				print('LOAD GRADE RESP', resp);

				GRADE_DATA.grades = resp.grades;
				GRADE_DATA.globals.grader = resp.globals.grader;
				gridder.loadCellGrades(GRADE_DATA.grades);
			},
			error: function(err){ print('Load grade error', err); },
		});
	}
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
		for (var j in allGrades[i].grades)
			headers[allGrades[i].grades[j].headerName] = null;
	}

	var csvStr = '';
	var gridCellGrades = GRADE_DATA.grades;
	for (var cell in allGrades)
	{
		cellGrades = gridCellGrades[cell].grades;
		cellMeta = gridCellGrades[cell].meta;

		var row = [];

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
	csvStr = Object.keys(headers).sort().join(',') + ',' + 
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
// brightness
// cell info
// invert
//



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

	$.ajax({
		url: '/api/v1/image',
		data: {
			id: CURRENT_CONTROL.imgId,
			selection: ['coordinates'],
		},
		type: 'GET',
		success: function(response) {
			CONTROL_CELL_COORDS = response.coordinates;
			$('#controlImg').attr('src', CURRENT_CONTROL.src);
			// will fire load event
		},
		error: function(error) {
			print(error);
		}
	});

	//$('#controlCellViewCanvas').css('opacity', 0);

}



// Keyboard shortcuts #####################################


// Menu tools #############################################
// show/hide grid
// show control
// toggle grade indicator