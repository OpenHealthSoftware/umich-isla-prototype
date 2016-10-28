// GLobals
exportData = [];
// For exporting to csv, give the key names => column names
exportData.push(
	{ 
		"perfusion" : "perfusion",
		"cell" : "cell",
		"gradeTime" : "gradeTime"
	}
);

startTime = 0;
endTime = 0;

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
	var height = 0;
	var width = 0;
	for (var i = 0; i < cellCoords.length; i+=2)
	{
		if (cellCoords[i] > width)
			width = cellCoords[i];
	
		if (cellCoords[i+1] > height)
			height = cellCoords[i+1];
	}
	// Get rectangular cell dimensions
	var cellHeight = (height > cellCoords[1]) ? height - cellCoords[1] : cellCoords[1] - height;
	var cellWidth = (width > cellCoords[0]) ? width - cellCoords[0] : cellCoords[0] - width;

	// Draw cell onto canvas
	var c = document.getElementById("myCanvas");
	var ctx = c.getContext("2d");
	var img = document.getElementById("main");
	// Set canvas dimensions
	ctx.canvas.width = document.getElementById('cellExpanded').offsetWidth;
	var ratio = cellHeight / cellWidth;
	ctx.canvas.height = ctx.canvas.width * ratio;
	//Since canvas is pulling image data as native size use difference
	var diff = img.naturalWidth / img.width;

	ctx.drawImage(img, cellCoords[0]*diff, cellCoords[1]*diff, (cellWidth)*diff, (cellHeight)*diff, 0,0, c.width, c.height);

	// Display grading box
	// Display reference images
	// Display mirrored cell (highlight on image and give options for next cell incases mirrored cell isn't correct)
	document.getElementById('gradeCell').style.display = "block";
	$('#inputCell').val(id);
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
	exportData.push(data);
};

// Effects: turns multidim array into csv string
function exportDataToCSV(data)
{
	csvStr = '';
	for (var row = 0; row < data.length; ++row)
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

	var data = exportDataToCSV(exportData);
	alert(data);
	var encodedURI = encodeURI(data);
	var link = document.createElement("a");
	link.setAttribute("href", "data:application/octet-stream," + encodedURI);
	link.setAttribute("download", "my_data.csv");
	alert(encodedURI);
	document.body.appendChild(link); // Required for FF

	link.click(); // This will download the data file
	
});