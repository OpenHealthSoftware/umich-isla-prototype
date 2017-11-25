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
		for (var c in this.cells)
			this.cells[c].makeHTML(containerDiv, order, JSON.parse(JSON.stringify(template)));

		this.html = containerDiv;

		this.makeCanvas();
	}


	makeCanvas()
	{
		if (arguments.length !== 0)
			return;
			// TODO: support custom
		
		var canvas = $('<canvas/>', {class: 'traceCanvas', id: 'mainFA_canvas'});
		canvas[0].width = this.img.width;
		canvas[0].height = this.img.height;
		this.canvas = canvas;
		$('#wrap-mainImg').append(canvas);
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
}

// ########################################





function init()
{
	gridder = new RegionDivider(MAIN_IMAGE, GRID_CELL_COORDS);
	var htmlTemplate = { elType: '<area>', id: 'cell_?', shape: 'poly', coords: null};

	gridder.makeHTML($('#gridMap'), 'append', htmlTemplate);

	gridder.onDrawCell([CELL_CANVAS, MAIN_IMAGE], function(outCanvas, img, cellInstance){
		var t = cellInstance;
		console.log('Drawing cell:', t.id);		

		var ctx = outCanvas.getContext('2d');

		var minX = t.getOrigMaxMin().min.x;
		var minY = t.getOrigMaxMin().min.y;
		var cellWidth = t.getOrigDimensions().x;
		var cellHeight = t.getOrigDimensions().y;	
		var coordsToCanvasRatio = ctx.canvas.width / cellWidth;

		var coords = t.getOriginalCoords();

		//console.log(img, coords[0], coords[1], cellWidth, cellHeight, 0,0, outCanvas.width, outCanvas.height);

		ctx.drawImage(img, coords[0], coords[1], cellWidth, cellHeight, 0,0, outCanvas.width, outCanvas.height);

	});

	gridder.cellHandler('click', function(e){
		var t = e.data.cellInstance;
		t.draw();
		var gridClicked = new CustomEvent('gridClicked', {detail: {id: t.id}});
		window.dispatchEvent(gridClicked);
	});

	

	window.addEventListener('gridClicked', function(e){
		gridder.activeCell = e.detail.id;
		gridder.highlightCell(e.detail.id, '#F1C40F', 3);
	});

	gridder.updateHTML();
	
	window.onresize = function(){ resize(); };


	
	gridder.cellHandler('dblclick', function(e){

		if (quickView === false)
		{
			gridder.cellHandler('mouseover', function(e){
				gridder.highlightCell(e.data.cellInstance.id);
				e.data.cellInstance.draw();
			});
		}
		else
			gridder.unbindHandler('mouseover');

		quickView = !quickView;
		console.log('Quickview', quickView);
		
	});

}

var quickView = false;
var GRID_CELL_COORDS;
var MAIN_IMAGE;
var CELL_CANVAS;
var gridder;
var WRAP_CELLCANVAS;

$('document').ready(function(){

	$.ajax({
		url: '/api/v1/image',
		data: { 
			id: gup('p'),
			selection: ['coordinates']
		},
		type: 'GET',
		success: function(response) {
			GRID_CELL_COORDS = response.coordinates;
			init();
		},
		error: function(error) {
			console.log(error);
		}
	});

	CELL_CANVAS = document.getElementById('cellViewCanvas');
	MAIN_IMAGE = document.getElementById('mainFA_image');
	WRAP_CELLCANVAS = $('#wrap-cellCanvas');

	var ctx = CELL_CANVAS.getContext('2d');
	ctx.canvas.height = WRAP_CELLCANVAS.width();
	ctx.canvas.width = WRAP_CELLCANVAS.height();
});


function resize()
{
	gridder.resize();
	
	CELL_CANVAS.width = WRAP_CELLCANVAS.width();
	CELL_CANVAS.height = WRAP_CELLCANVAS.height();

	gridder.getActiveCell().draw();
}