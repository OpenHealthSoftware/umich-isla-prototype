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

$('document').ready()
{
	numCells = $('area').length;

	// Store the original coordinates
	$('area').each(function(){
		var coords = $(this).attr('coords');
		coords = coords.split(','); // turn into array
		for (var i in coords)
			coords[i] = parseInt(coords[i]);
		origCoords.push(coords);
	});

	remap();
}

window.onresize = function(){remap();};

var lastGridRatio = 0;
// Changes area coordinates to match scaled grid
function remap()
{
	var ar = $('area');
	var grid = document.getElementById('grid');
	var gridWidth = grid.width;
	var gridNatWidth = grid.naturalWidth;

	
	if (gridWidth / gridNatWidth != lastGridRatio)
	{
		var ratio = gridWidth / gridNatWidth;
		var row = 0;
		ar.each(function()
		{
			var newCoords = [];
			// update origCoords 
			for (var i in origCoords[row])
			{
				var c = parseInt(origCoords[row][i]);
				newCoords.push(parseInt(c*ratio));
			}

			// reset
			$(this).attr('coords', newCoords.toString());
			row++;
		});
		lastGridRatio = ratio;
	}
}

function cellClick(id)
{
	console.log("Grading cell " + id);
	var date = new Date();
	startTime = date.getTime();
	//Get cell coordinates for repainting section of image
	var cell = document.getElementById("cell"+id);
	var cellCoords = cell.getAttribute("coords");

	// Convert string to int array
	cellCoords = cellCoords.split(',');
	for (var i = 0; i < cellCoords.length; i++)
		cellCoords[i] = parseInt(cellCoords[i]);


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
	var c = document.getElementById("cellViewCanvas");
	var ctx = c.getContext("2d");
	var img = document.getElementById("main");
	// Set canvas dimensions
	ctx.canvas.width = document.getElementById('cellExpanded').offsetWidth;
	var ratio = cellHeight / cellWidth;
	ctx.canvas.height = ctx.canvas.width * ratio;
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

	ctx.drawImage(img, minX*diff, minY*diff, (cellWidth)*diff, (cellHeight)*diff, 0,0, c.width, c.height);

	// Display grading box
	// Display reference images
	// Display mirrored cell (highlight on image and give options for next cell incases mirrored cell isn't correct)
	document.getElementById('gradeCell').style.display = "block";
	$('#inputCell').val(id);

	var c = document.getElementById("gridCanvas").getContext("2d");
	c.clearRect(cellCoords[0], cellCoords[1], cellWidth, cellHeight);
}

document.getElementById('submitGrade').onclick = function()
{
	var t = new Date();
	endTime = t.getTime();
	var formEls = $('input[name=grade]:checked').val();
	var cellId = $('#inputCell').val();
	var gradingTime = (endTime - startTime) / 1000;
	// Create data object
	var data = {
		"perfusion" : $('input[name=grade]:checked').val(),
		"cell" : cellId,
		"gradeTime": gradingTime
	};
	//exportData.push(data);
	exportData[cellId] = data;
	++numCellsGraded;

	//unselect radio buttons
	$('input[name=grade]')[0].checked = false;
	$('input[name=grade]')[1].checked = false;
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
		highlightUngradedCells();
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
	var cells = $('area');
	var c = document.getElementById("gridCanvas").getContext("2d");
	document.getElementById("gridCanvas").width = $('#grid').width();
	document.getElementById("gridCanvas").height = $('#grid').height();

	// loop through all cells
	cells.each(function()
	{
		var cellNumber = $(this).attr('id');
		cellNumber = cellNumber.substr(4, cellNumber.length - 1); // [cell]xxx
		cellNumber = parseInt(cellNumber);

		// trace
		if (!exportData[cellNumber])
		{
			//alert("cell " + cellNumber + " is ungraded");
			

			var cellCoords = $(this).attr('coords').split(',');
			c.beginPath();
			var xDiff = cellCoords[0] - (cellCoords[0] * .9);
			xDiff *= 1.5;
			var yDiff = cellCoords[1] - (cellCoords[1] * .9);
			yDiff *= 1.5;
			for (var i = 0; i < cellCoords.length; i += 2)
			{
				c.lineTo(cellCoords[i] * .9 + xDiff, cellCoords[i+1] * .9 + yDiff);
			}
			c.strokeStyle = 'red';
			c.stroke();
			c.closePath();
		}
	});
}