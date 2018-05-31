
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
		
		this.validCell = true;
		var c = this._ORIG_COORDS;
		if (c.length === 2 && c[0] === -1 && c[1] === -1)
			this.validCell = false; // invalid cell (off the image), but needed for cell ordering
	}
	
	
	onDraw(params, fn)
	{
		// fn is required to have 'cellInstance' as its last parameter

		params = params.concat([this]);
		this._drawFn = fn;
		this._drawFnArgs = params;

		// TODO: if onDraw never specified, use default draw function
	}


	getTopLeft(src)
	{
		// get the top left coordinate of a cell
		var c = this.coords;
		if (src === 'orig')
			c = this._ORIG_COORDS;

		var minX = c[0];
		var minY = c[1]
		for (var i = 0; i < c.length; i += 2)
		{
			if (c[i] < minX)
				minX = c[i];
			if (c[i+1] < minY)
				minY = c[i+1];
		}

		return [minX, minY];
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
			var offset = yOffset;
			if (c % 2)
				offset = xOffset;

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
		
		if (this.validCell === true)
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

	getCenter()
	{
		var sumX = 0;
		var sumY = 0;
		for (var i = 0; i <= this.coords.length-1; i+=2){
			sumX += this.coords[i];
			sumY += this.coords[i+1];
		}
		var n = this.coords.length / 2;
		return {x: sumX / n, y: sumY / n};
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
		this.numValidCells = 0;
		for(var c in coords)
		{
			var cell = new Cell(coords[c], c, false);
			this.cells.push(cell);
			if (cell.validCell === true)
				this.numValidCells += 1;
		}

		this.activeCell = parseInt(this.cells.length / 2);
		this.numCellsGraded = 0;
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
		{
			var newCell = this.activeCell + dir;
			while (this.cells[newCell].validCell === false)
				newCell = (parseInt(newCell) + dir) % this.cells.length;
			
			this.activeCell = newCell;
		}
		else
			this.activeCell = targetCell % this.cells.length;
	}



	highlightCell(cellId=this.activeCell, color='#fff', strokeWidth=2, clear=true)
	{
		var cell = this.cells[cellId];
		var canv = this.canvas[0];
		var c = canv.getContext('2d');
		if (clear === true)
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

	shadeCell(cellId=this.activeCell, color='#fff', clear=true)
	{
		var cell = this.cells[cellId];
		var canv = this.canvas[0];
		var c = canv.getContext('2d');
		if (clear === true)
			c.clearRect(0,0, canv.width, canv.height);

		c.beginPath();
		var coords = cell.getCoordinates();
		for (var i = 0; i < coords.length; i += 2)
			c.lineTo(coords[i], coords[i+1]);
		c.closePath();
		//c.lineWidth = strokeWidth;
		c.fillStyle = color;
		c.fill();
	}

	markCell(cellId, clear=false){
		var w = 8;
		var h = 8;
		var center = this.cells[cellId].getCenter();
		var canv = this.canvas[0];
		var c = canv.getContext('2d');
		if (clear === true)
			c.clearRect(0,0, canv.width, canv.height);

		c.fillStyle = '#4caf5080';
		c.fillRect(center.x - (w/2), center.y - (h/2), w, h);
	}

	identifyCell(cellId, clear=false){
		var center = this.cells[cellId].getCenter();
		var canv = this.canvas[0];
		var c = canv.getContext('2d');
		if (clear === true)
			c.clearRect(0,0, canv.width, canv.height);

		c.fillStyle = 'red';
		c.textAlign = 'center';
		c.font = "12px Arial";
		c.fillText(cellId,center.x, center.y);
	}

	identifyCells(){

		for (var i in this.cells){
			this.identifyCell(i);
		}
	}

	highlightGraded()
	{
		for (var i in this.cells)
		{
			if (this.cells[i].grades)
				this.markCell(i);
		}
	}
	
	highlightUngraded()
	{
		for (var i in this.cells)
		{
			if (!this.cells[i].grades)
				this.highlightCell(i, '#ff0000', 1, false);
		}
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
		{
			this.cells[i].grades = gradeData[i].grades;
			this.numCellsGraded += 1;
		}
	}
}
// export { RegionDivider, Cell };