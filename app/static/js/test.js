
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
		this.origCoords = coordinates.slice(); //clone. maybe uneccessary
		this.active = false;
		this.canvas = null;
	}
	
	

	draw(fn, canvas)
	{
        if (arguments.length === 2)
		{
			this.canvas = canvas; // cache canvas so user def func doesn't have to lookup everytime
            this._drawFn = fn;
            return;
		}
		console.log('Draw id', this.id);
		
		// user defined function for defining draw
		fn(this); // hopefully doesnt cause recursive stack overflow
		
	}

	onClick(fn)
	{
		this.html.unbind('click');
		// user defined function that has access to Cell.this
		var a = this;
		console.log('Onclick id', this.id);
		this.html.click(function(){fn(a); console.log('what', a.id);this.active = true; });
	}

	triggerClick()
	{
		this.html.trigger('click');
	}

	redraw()
	{
		this._drawFn(this);
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
	
	calculateCoordinates(scaler, xOffset, yOffset, orderOfOp)
	{
		var x = [];
		for (var c in this.coords)
		{
			// a cells coordinates are defined as [x1,y1, x2,y2...]			
			var offset = xOffset;
			if (c % 2)
				offset = yOffset;

			var newVal;
			if (orderOfOp === 'multiply')
				newVal = this.coords[c]*scaler + offset;
			else
				newVal = (this.coords[c] + offset) * scaler;

			x.push(newVal);
		}
		return x;
	}

	setCoordinates(scaler, xOffset, yOffset, orderOfOp)
	{
		this.coords = this.calculateCoordinates(scaler, xOffset, yOffset, orderOfOp);
	}

	// sets this.coords to the original passed in coordinates
	resetCoordinates()
	{
		var c = [];

		for (i in this.origCoords)
			c.push(this.origCoords[i]);
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
		this.origMaxMin = this._getMaxMin(this.origCoords);
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

		var outCanvas = document.getElementById('cellViewCanvas');

		var t = this;
		this.html.click(function(){
			var img = document.getElementById('mainFA_image');
			var ctx = outCanvas.getContext('2d');
		
			var minX = t.getOrigMaxMin().min.x;
			var minY = t.getOrigMaxMin().min.y;
			var cellWidth = t.getOrigDimensions().x;
			var cellHeight = t.getOrigDimensions().y;	
			var coordsToCanvasRatio = ctx.canvas.width / cellWidth;

			var coords = t.origCoords;
			console.log('Drawing cell:', t.id, coords);
	
			// Clip canvas to to cell
			// ctx.moveTo(coords[0], coords[1]);
			// ctx.beginPath();
			// for (var i = 0; i < coords.length; i += 2)
			//     ctx.lineTo(coords[i], coords[i+1]);
			// ctx.closePath();
			//ctx.clip();
		
			console.log(img, coords[0], coords[1], cellWidth, cellHeight, 0,0, outCanvas.width, outCanvas.height);
			// only need to do ^^ once? do the mapping from origCoords to cellCanvas. no cause cellCanvas changes sizes.
			ctx.drawImage(img, coords[0], coords[1], cellWidth, cellHeight, 0,0, outCanvas.width, outCanvas.height);
		})
	}
}



// cell.draw() setup cell, have region divider duplicate
// divider = new RegionDivider(coords, new Cell())

var origCoords = [[0, 0, 0, 5, 5, 5, 5, 0], [7, 0, 4004, 0], [4006, 0, 4006, 5, 4011, 5, 4011, 0], [0, 7, 0, 4004], [4011, 7, 4011, 4001], [12, 11, 11, 12, 11, 440, 12, 441, 11, 442, 11, 444, 444, 444, 444, 11, 442, 11, 441, 12, 440, 11], [456, 11, 456, 444, 889, 444, 889, 15, 888, 14, 889, 13, 889, 12, 888, 11], [901, 11, 900, 12, 900, 13, 901, 14, 900, 15, 900, 441, 901, 442, 900, 443, 900, 444, 1333, 444, 1333, 12, 1332, 11], [1345, 11, 1345, 444, 1777, 444, 1777, 11], [1790, 11, 1789, 12, 1789, 444, 2222, 444, 2222, 12, 2221, 11], [2234, 11, 2234, 444, 2666, 444, 2666, 11], [2679, 11, 2678, 12, 2678, 444, 3111, 444, 3110, 443, 3111, 442, 3111, 14, 3110, 13, 3111,12, 3110, 11], [3123, 11, 3122, 12, 3122, 14, 3123, 15, 3122, 16, 3122, 441, 3123, 442, 3123, 443, 3122, 444, 3555, 444, 3555, 12, 3554, 11], [3567, 11, 3567, 444, 3999, 444, 4000, 443, 4000, 442, 3999, 441, 4000, 440, 4000, 13, 3999, 12, 3999, 11], [11, 456, 11, 888, 12, 889, 13, 889, 14, 888, 15, 889, 444, 889, 444, 456], [456, 456, 456, 889, 888, 889, 889, 888, 889, 456], [900, 456, 900, 888, 901, 889, 1331, 889, 1332, 888, 1333, 888, 1333, 456], [1345, 456, 1345, 889, 1346, 888, 1347, 888, 1348, 889, 1349, 889, 1350, 888, 1351, 889, 1777, 889, 1777, 456], [1789, 456, 1789, 888, 1790, 889, 2221, 889, 2222, 888, 2222, 456], [2234, 456, 2234, 889, 2235, 888, 2236, 889, 2237, 888, 2238, 889, 2664, 889, 2665, 888, 2666, 889, 2666, 456], [2678, 456, 2678, 888, 2679, 889, 3107, 889, 3108, 888, 3109, 889, 3110, 889, 3111, 888, 3111, 456], [3122, 456, 3122, 888, 3123, 889, 3124, 889, 3125, 888, 3126, 889, 3553, 889, 3554, 888, 3555, 889, 3555, 456], [3567, 456, 3567, 888, 3568, 889, 3999, 889, 4000, 888, 4000, 456], [12, 900, 11, 901, 11, 1332, 12, 1333, 444, 1333, 444, 900, 443, 900, 442, 901, 441, 900, 15, 900, 14, 901, 13, 900], [456, 900, 456, 1333, 888, 1333, 888, 1332, 889, 1331, 889, 901, 888, 900], [901, 900, 900, 901, 900, 1330, 901, 1331, 901, 1333, 1333, 1333, 1333, 901, 1331, 901, 1330, 900], [1345, 900, 1345, 1333, 1777, 1333, 1777, 900, 1350, 900, 1349, 901, 1348, 900, 1347, 900, 1346, 901], [1791, 900, 1790, 901, 1789, 901, 1789, 1333, 2222, 1333, 2222, 901, 2221, 901, 2220, 900, 2218, 900, 2217, 901, 2216, 900], [2234, 900, 2234, 1333, 2666, 1333, 2666, 900, 2665, 901, 2664, 900], [2680, 900, 2679, 901, 2678, 901, 2678, 1333, 3110, 1333, 3111, 1332, 3111, 903, 3110, 902, 3111, 901, 3110, 900], [3123, 900, 3122, 901, 3122, 1332, 3123, 1333, 3555, 1333, 3555, 900, 3128, 900,3127, 901, 3124, 901], [3567, 900, 3567, 1333, 3999, 1333, 4000, 1332, 4000, 1330, 3999, 1329, 4000, 1328, 4000, 902, 3999, 901, 3999, 900], [11, 1345, 11, 1777, 444, 1777, 444, 1345], [456, 1345, 456, 1777, 889, 1777, 889, 1351, 888, 1350, 889, 1349, 889, 1348, 888, 1347, 888, 1346, 889, 1345], [900, 1345, 901, 1346, 900, 1347, 900, 1348, 901, 1349, 900, 1350, 900, 1777, 1333, 1777, 1333, 1345], [1345, 1345, 1345, 1777, 1777, 1777, 1777, 1345], [1789, 1345, 1789, 1777, 2222, 1777, 2222, 1345], [2234, 1345, 2234, 1777, 2666, 1777, 2666, 1345], [2678, 1345, 2678, 1777, 3111, 1777, 3110, 1776, 3111, 1775, 3111, 1347, 3110, 1346, 3111, 1345], [3123, 1345, 3122, 1346, 3122, 1348, 3123, 1349, 3122, 1350, 3122, 1777, 3555, 1777, 3555, 1345], [3567, 1345, 3567, 1777, 3999, 1777, 4000, 1776, 4000, 1348, 3999, 1347, 4000,1346, 3999, 1345], [12, 1789, 11, 1790, 11, 2221, 12, 2222, 444, 2222, 444, 1789], [456, 1789, 456, 2222, 888, 2222, 889, 2221, 889, 1790, 888, 1789], [901, 1789, 901, 1790, 900, 1791, 900, 2216, 901, 2217, 900, 2218, 900, 2220, 901, 2221, 901, 2222, 1333, 2222, 1333, 1789], [1345, 1789, 1345, 2222, 1777, 2222, 1777, 1789], [1789, 1789, 1789, 2222, 2222, 2222, 2222, 1789], [2234, 1789, 2234, 2222, 2666, 2222, 2666, 1789], [2678, 1789, 2678, 2222, 3110, 2222, 3110, 2221, 3111, 2220, 3111, 1791, 3110, 1790, 3110, 1789], [3123, 1789, 3122, 1790, 3122, 2216, 3123, 2217, 3122, 2218, 3122, 2221, 3123, 2222, 3555, 2222, 3555, 1789], [3567, 1789, 3567, 2222, 3999, 2222, 4000, 2221, 4000, 1790, 3999, 1789], [11, 2234, 11, 2666, 444, 2666, 444, 2234], [456, 2234, 456, 2666, 889, 2666, 888, 2665, 889, 2664, 889, 2238, 888, 2237, 889, 2236, 888, 2235, 889, 2234], [900, 2234, 900, 2664, 901, 2665, 900, 2666, 1333, 2666, 1333, 2234], [1345, 2234, 1345, 2666, 1777, 2666, 1777, 2234], [1789, 2234, 1789, 2666, 2222, 2666, 2222, 2234], [2234, 2234, 2234, 2666, 2666, 2666, 2666, 2234], [2678, 2234, 2678, 2666, 3111, 2666, 3110, 2665, 3111, 2664, 3111, 2238, 3110, 2237, 3111, 2236, 3110, 2235, 3111, 2234], [3122, 2234, 3122, 2665, 3123, 2666, 3555, 2666, 3555, 2234], [3567, 2234, 3567, 2666, 3999, 2666, 4000, 2665, 4000, 2235, 3999, 2234], [12, 2678, 11, 2679, 11, 3110, 12, 3111, 13, 3110, 14, 3111, 442, 3111, 443, 3110, 444, 3111, 444, 2678], [456, 2678, 456, 3111, 888, 3111, 889, 3110, 889, 3109, 888, 3108, 889, 3107, 889, 2679, 888, 2678], [901, 2678, 901, 2679, 900, 2680, 900, 3110, 901, 3111, 902, 3110, 903, 3111, 1332, 3111, 1333, 3110, 1333, 2678], [1345, 2678, 1345, 3111, 1346, 3110, 1347, 3111, 1775, 3111, 1776, 3110, 1777, 3111, 1777, 2678], [1789, 2678, 1789, 3110, 1790, 3110, 1791, 3111, 2220, 3111, 2221, 3110, 2222, 3110, 2222, 2678], [2234, 2678, 2234, 3111, 2235, 3110, 2236, 3111, 2237, 3110, 2238, 3111, 2664, 3111, 2665, 3110, 2666, 3111, 2666, 2678], [2678, 2678, 2678, 3110, 2679, 3111, 3108, 3111, 3109, 3110, 3110, 3111, 3111, 3110, 3110, 3109, 3111, 3108, 3111, 2679, 3110, 2678], [3123, 2678, 3122, 2679, 3122, 3110, 3123, 3111, 3124, 3110, 3125, 3111, 3553, 3111, 3554, 3110, 3555, 3111, 3555, 2678], [3567, 2678, 3567, 3111, 3999, 3111, 3999, 3110, 4000, 3109, 4000, 3106, 3999, 3105, 4000, 3104, 4000, 2679, 3999, 2678], [12, 3122, 11, 3123, 11, 3554, 12, 3555, 444, 3555, 444, 3122, 443, 3123, 442, 3123, 441, 3122, 16, 3122, 15, 3123, 14, 3122], [456, 3122, 456, 3555, 889, 3555, 888, 3554, 889, 3553, 889, 3126, 888, 3125, 889, 3124, 889, 3123, 888, 3122], [901, 3122, 900, 3123, 901, 3124, 901, 3127, 900, 3128, 900, 3555, 1333, 3555, 1333, 3123, 1332, 3122], [1346, 3122, 1345, 3123, 1345, 3555, 1777, 3555, 1777, 3122, 1350, 3122, 1349, 3123, 1348, 3122], [1790, 3122, 1789, 3123, 1789, 3555, 2222, 3555, 2222, 3123, 2221, 3122, 2218, 3122, 2217, 3123, 2216, 3122], [2234, 3122, 2234, 3555, 2666, 3555, 2666, 3123, 2665, 3122], [2679, 3122, 2678, 3123, 2678, 3555, 3111, 3555, 3110, 3554, 3111, 3553, 3111, 3125, 3110, 3124, 3111, 3123, 3110, 3122], [3123, 3122, 3122, 3123, 3122, 3553, 3123, 3554, 3122, 3555, 3555, 3555, 3555, 3122, 3554, 3123, 3553, 3122], [3568, 3122, 3567, 3123, 3567, 3555, 3999, 3555, 4000, 3554, 4000, 3124, 3999, 3123, 3999, 3122], [11, 3567, 11, 3999, 12, 3999, 13, 4000, 440, 4000, 441, 3999, 442, 4000, 443, 4000, 444, 3999, 444, 3567], [456, 3567, 456, 4000, 888, 4000, 889, 3999, 889, 3568, 888, 3567], [900, 3567, 900, 3999, 901, 3999, 902, 4000, 1328, 4000, 1329, 3999, 1330, 4000, 1332, 4000, 1333, 3999, 1333, 3567], [1345, 3567, 1345, 3999, 1346, 4000, 1347, 3999, 1348, 4000, 1776, 4000, 1777, 3999, 1777, 3567], [1789, 3567, 1789, 3999, 1790, 4000, 2221, 4000, 2222, 3999, 2222, 3567], [2234, 3567, 2234, 3999, 2235, 4000, 2665, 4000, 2666, 3999, 2666, 3567], [2678, 3567, 2678, 3999, 2679, 4000, 3104, 4000, 3105, 3999, 3106, 4000, 3109, 4000, 3110, 3999, 3111, 3999, 3111, 3567], [3123, 3567, 3122, 3568, 3122, 3999, 3123, 3999, 3124, 4000, 3554, 4000, 3555, 3999, 3555, 3567], [3567, 3567, 3567, 3999, 3568, 4000, 3999, 4000, 4000, 3999, 4000, 3568, 3999, 3567], [4011, 4003, 4011, 4005, 4010, 4006, 4006, 4006, 4006, 4010, 4005, 4011, 4003, 4011, 4011, 4011], [0, 4006, 0, 4011, 5, 4011, 5, 4006], [7, 4011, 4001, 4011]]


var htmlTemplate = { elType: '<area>', id: 'cell_?', shape: 'poly', coords: null};
var grid = [];
$('document').ready(function(){
var outCanvas = document.getElementById('cellViewCanvas');
	
for (var c in origCoords)
{
    var cell = new Cell(origCoords[c], c, JSON.parse(JSON.stringify(htmlTemplate)), false);

    var img = document.getElementById('mainFA_image');    
	var scaleRatio = img.width / img.naturalWidth;
	scaleRatio = scaleRatio * 0.7428105241688762;
	cell.setCoordinates(scaleRatio, 0, 0, 'multiply');
	console.log(cell.coords);
	cell.canvas = outCanvas;
    cell.makeHTML($('#gridMap'), 'append');
	

    cell.draw(function(t){
        // draw cell on the previewCell canvas (outCanvas)
        // get image data from img.src.patientimg
        var img = document.getElementById('mainFA_image');
        var ctx = t.canvas.getContext('2d');
    
        //Since canvas is pulling image data as native size, we want to use the original coordinates, instead of the t.coords that is scaled to the current screen/div size
    
        // make the mapping from orig cell coordinates to canvas coordinates
        var minX = t.getOrigMaxMin().min.x;
        var minY = t.getOrigMaxMin().min.y;
        var cellWidth = t.getOrigDimensions().x;
        var cellHeight = t.getOrigDimensions().y;	
        var coordsToCanvasRatio = ctx.canvas.width / cellWidth;
        //console.log('precoords', t.coords, coordsToCanvasRatio, cellWidth, ctx.canvas.width);
		//var coords = t.calculateCoordinates(100, minY, coordsToCanvasRatio, 'subtract');
		var coords = t.origCoords;
        console.log('Drawing cell:', t.id, coords);

        // Clip canvas to to cell
        // ctx.moveTo(coords[0], coords[1]);
        // ctx.beginPath();
        // for (var i = 0; i < coords.length; i += 2)
        //     ctx.lineTo(coords[i], coords[i+1]);
        // ctx.closePath();
        //ctx.clip();
    
        console.log(img, coords[0], coords[1], cellWidth, cellHeight, 0,0, t.canvas.width, t.canvas.height);
        // only need to do ^^ once? do the mapping from origCoords to cellCanvas. no cause cellCanvas changes sizes.
        ctx.drawImage(img, coords[0], coords[1], cellWidth, cellHeight, 0,0, t.canvas.width, t.canvas.height);


        // to get area maps in right place:
        // take orig coords
        // scale down to scaled grid natural size (grid scale ratio)
        // scale down to div size
        // offset by percentage offset

        // to get cell from orig image:
        // find cell in orig coords (should work by cell id)
        // take orig cell coords
        // scale down to scaled grid natural size
        // offset by percentage
    }, outCanvas);

    // cell.onClick(function(t){
	// 	t.redraw();
	// 	console.log('onclick body id:', t.id)
	// });
	


    grid.push(cell);
}

var ctx = outCanvas.getContext('2d');
ctx.canvas.height = 200;
ctx.canvas.width = 200;

});




