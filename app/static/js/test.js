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
	constructor(coordinates, id, htmlTemplate, classifiers)
	{
		// htmlTemplate = { id: 'cell_?', shape: 'poly', coords: null}
		// htmlTemplate = $('<area id="cell_{{loop.index}}" shape="poly" coords="{{i}}" )
        // classifiers = ['name/id', 'name2', ...]

		var elType = htmlTemplate.elType;
		delete htmlTemplate.elType;

		for (var x in htmlTemplate)
		{
			if (htmlTemplate[x] === null)
				htmlTemplate[x] = coordinates.join(',');
			htmlTemplate[x] = htmlTemplate[x].replace('?', id);
		}
		
		this.id = id;
		this.html = $(elType, htmlTemplate);

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

		params.push(this);
		this._drawFn = fn;
		this._drawFnArgs = params;
	}

	onClick(params, fn)
	{
		// params = {hello:13, goodbye: {ob}, more: 'string'}
		// fn must take in event
		// function fn(event) { event.data.hello; }
		// this cell instance will be added to params
		this.html.unbind('click');

		params['cellInstance'] = this;
		this.html.click(params, fn);
	}

	triggerClick()
	{
		this.html.trigger('click');
	}

	draw()
	{
		this._drawFn(...this._drawFnArgs);
	}

	getClassifiers(){
		// classifiers are the set of possible classifiers
		return this.classifiers;
	}

	getActiveClassifiers(){
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

		for (i in this._ORIG_COORDS)
			c.push(this._ORIG_COORDS[i]);
		this.coords = c;
	}

	
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

	getCoordinates()
	{
		return this.coords;
	}

	
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

	makeHTML(containerDiv, order)
	{
		this.html.attr('coords', this.coords.join(','));
		if (order === 'append')
			containerDiv.append(this.html);
		else if (order === 'prepend')
			containerDiv.prepend(this.html);

	}

	getOriginalCoords()
	{
		return this._ORIG_COORDS.slice();
	}
}



// cell.draw() setup cell, have region divider duplicate
// divider = new RegionDivider(coords, new Cell())

var htmlTemplate = { elType: '<area>', id: 'cell_?', shape: 'poly', coords: null};
var grid = [];
var GRID_CELL_COORDS;
var MAIN_IMAGE;
var CELL_CANVAS;

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

	var ctx = CELL_CANVAS.getContext('2d');
	ctx.canvas.height = 200;
	ctx.canvas.width = 200;
});




function init()
{
	
	for (var c in GRID_CELL_COORDS)
	{
		var cell = new Cell(GRID_CELL_COORDS[c], c, JSON.parse(JSON.stringify(htmlTemplate)), false);
   
		var scaleRatio = MAIN_IMAGE.width / MAIN_IMAGE.naturalWidth;
		cell.setCoordinates(scaleRatio, 0, 0, 'multiply');


		cell.makeHTML($('#gridMap'), 'append');
		

		cell.onDraw([CELL_CANVAS, MAIN_IMAGE], function(outCanvas, img, cellInstance){
			var t = cellInstance;

			var ctx = outCanvas.getContext('2d');
		
			var minX = t.getOrigMaxMin().min.x;
			var minY = t.getOrigMaxMin().min.y;
			var cellWidth = t.getOrigDimensions().x;
			var cellHeight = t.getOrigDimensions().y;	
			var coordsToCanvasRatio = ctx.canvas.width / cellWidth;

			var coords = t.getOriginalCoords();
			console.log('Drawing cell:', t.id);
	
			// Clip canvas to to cell
			// ctx.moveTo(coords[0], coords[1]);
			// ctx.beginPath();
			// for (var i = 0; i < coords.length; i += 2)
			//     ctx.lineTo(coords[i], coords[i+1]);
			// ctx.closePath();
			//ctx.clip();
		
			console.log(img, coords[0], coords[1], cellWidth, cellHeight, 0,0, outCanvas.width, outCanvas.height);
		
			ctx.drawImage(img, coords[0], coords[1], cellWidth, cellHeight, 0,0, outCanvas.width, outCanvas.height);
			
		});


		cell.onClick({testing: 952}, function(e){ 
			console.log(e.data.cellInstance, e.data.testing);
			var t = e.data.cellInstance;
			t.draw();
		});

		grid.push(cell);
	}
	
}