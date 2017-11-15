

class Image4
{
	//
	this.region;


	updateSource(){}


}

class EyeImage
{
	// inherit from image
	constructor()
	{
		this.side = 'right';
		this.id = '';
		this.region = RegionDivider('grid_adsfasd.png');

	}
}



// class Grade/parameters
// {
// 	// array of classifiers
// 	constructor(classifiers)
// 	{
// 		this.classifiers;
// 	}
// 	save(){}
// }

class Classifier
{
	// A possible classifers for a given cell/image (grades option)
	constructor()
	{
		this.name = 'perfusion'
		this.value = 'nonperfused'
	}

	// if div, then onchange listener then
	get value(){
		return this.value;
	}
}




primaryImage = Image('url')
divider = RegionDivider('url or coordinates most likely') // url to image, or form image from coordinates?
interactiveImage = InteractiveImage(primaryImage, divider);
interactiveImage.cellClassifiers(availableGradeOptions);

interactiveImage.onCellClick(
	function(){
		cell.draw(targetCanvas);
		divider.highlightCell(cell);
	}
);

// on submit grade
c = interactiveImage.activeCell();
c.save(selectedClassifiers);


// click on a cell
// select grade options
v = grades.getInputs()
c = grid.activeCell()
// save to cell
c.setActiveClassifiers(v)


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
		
		this.html = $(elType, htmlTemplate);

		this.classifiers = classifiers;
		this.activeClassifiers = {};
		this.coords = coordinates;
		this.origCoords = coordinates.slice(); //clone. maybe uneccessary
		this.active = false;
	}
	
	makeHTML(containerDiv, order)
	{
		if (order === 'append')
			containerDiv.append(this.html);
		else if (order === 'prepend')
			containerDiv.prepend(this.html);
	}

	draw(fn, canvas)
	{

		this.canvas = canvas; // cache canvas so user def func doesn't have to lookup everytime
		this._drawFn = fn;
		
	}

	onClick(fn)
	{
		this.html.unbind('click');
		// user defined function that has access to Cell.this
		var a = this;
		this.html.click(function(){fn(a); this.active = true; });
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
		for (c in this.coords)
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

	getMaxMin()
	{
		if (this.maxmin)
			return this.maxmin;
		this.maxmin = _getMaxMin(this.coords);
		return this.maxmin;
	}
	getOrigMaxMin()
	{
		if (this.origMaxMin)
			return this.origMaxMin;
		this.origMaxMin = _getMaxMin(this.origCoords);
		return this.origMaxMin;
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

	getCoordinates()
	{
		return this.coords;
	}

	getOrigDimensions()
	{
		return _getDimensions(this.getOrigMaxMin());
	}
	getDimensions()
	{
		return _getDimensions(this.getMaxMin());
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

}

class RegionDivider
{
	constructor(coords, cellTemplate, canvas)
	{
		// coords is a 2d vector
		// [ cell0coords[x1,y10,x10,y10, x10, y1], cell1coords[] ]
		for(c in coords)
			cells.push(Cell(coords[c], c, cellHtmlTemplate, classsifiers))
			
		this.canvas = canvas;
	}

	// adds the grid/cell html to the page
	makeHTML(containerDiv, order)
	{
		// containerDiv = $('#gridMap')
		var dividerDiv = $('<div>');
		for (c in this.cells)
			this.cells[c].makeHTML(dividerDiv, order);
		
		if (order === 'append')
			containerDiv.append(dividerDiv);
		else
			containerDiv.prepend(dividerDiv);

		this.html = dividerDiv;

		// make canvases
	}
	
	updateCoordinates(scaler, xOffset, yOffset)
	{
		// permanetly alters cell coordinate state
		var newCoords = [];
		for (cellIdx in this.coords)
		{
			var cell = this.coords[cellIdx];
			cell.setCoordinates(scaler, xOffset, yOffset);
			newCoords.push(cell.getCoordinates());
		}
		this.coords = newCoords;
	}

	setPosition(xOffset, yOffset)
	{
		setCoordinates(1, xOffset, yOffset);
	}

	setScale(scaler)
	{
		setCoordinates(scaler, 0, 0);
	}

	updateHTML(top, left, scale)
	{
		// change the html cell coordinates
	}

	getCell(cellIdOrCoord)
	{
		return this.cells[id];
	}

	getCells()

	
	onCellClick(fn)
	{
		// applies a user defined function to all Cell's .onClick
		for (c in this.cells)
			this.cells[c].onClick(fn);
	}

	onClick(fn)
	{
		// user defined function that has access to Cell.this		
		this.html.unbind('click');
		var a = this;
		this.html.click(function(){fn(a);})
	}





	draw(fn, canvas)
	{
		if (arguments.length === 2)
		{
			this.canvas = canvas; // cache canvas so user def func doesn't have to lookup everytime
			this._drawFn = fn;
			return;
		}

		// user defined function for defining draw
		fn(this); // hopefully doesnt cause recursive stack overflow
	}

	redraw()
	{
		draw(this._drawFn);
	}

	activeCell()
	{
		// returns the currently active (clicked) cell
		for (c in this.cells)
		{
			//if (this.cells[c].active === true && this.lastActive !=
		}
	}
}






htmTemplate = { elType: '<area>', id: 'cell_?', shape: 'poly', coords: null};
// cell.draw() setup cell, have region divider duplicate
// divider = new RegionDivider(coords, new Cell())


var cell = new Cell(false, false, htmlTemplate, classifiers);
var outCanvas = document.getElementById('#cellPreviewCanvas');
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
	var coords = t.calculateCoordinates(minX*-1, minY*-1, coordsToCanvasRatio, 'subtract');
	
	
	// Clip canvas to to cell
	ctx.moveTo(coords[0], coords[1]);
	ctx.beginPath();
	for (var i = 0; i < coords.length; i += 2)
		ctx.lineTo(coords[i], coords[i+1]);
	ctx.closePath();
	ctx.clip();

	// only need to do ^^ once? do the mapping from origCoords to cellCanvas. no cause cellCanvas changes sizes.
	ctx.drawImage(img, minX, minY, cellWidth, cellHeight, 0,0, t.canvas.width, t.canvas.height);

}, outCanvas);


cell.onClick(function(t){
	t.redraw();
});


// then divider creates all the real cells
grid = new RegionDivider(coords, cell, dividerCanvas);

// TODO: how to tell when cell was clicked, maybe just on grid.click()
grid.onCellClick(function(t){
	var activeCell; // get the active cell somehow
	// highlight it on this.canvas; t.redraw();
	var activeClassifiers = activeCell.getActiveClassifiers();
	// clear input / load input
	loadPreviousGrades(activeClassifiers);
});




$('input').onsubmit(function(){
	var selectedInput = grades.getInputs(); // whatever options have a value
	var c = grid.getActiveCell();
	c.setActiveClassifiers(selectedInput);
});

window.resize(function()
{
	grid.updateCoordinates();
	grid.updateHTML();
	grid.redraw();
	//grid.activeCell().redraw();
})