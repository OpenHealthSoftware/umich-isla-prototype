import {RegionDivider, Cell} from './Grid.js';
print = console.log;
var GRADE_SESSIONS;
var GRID_CELL_COORDS;
var MAIN_IMAGE;
var CELL_CANVAS;
var WRAP_CELLCANVAS;
var WRAP_CONTROLCANVAS;
var gridder;





function init()
{
	gridder = new RegionDivider(MAIN_IMAGE, GRID_CELL_COORDS);
	var htmlTemplate = { elType: '<area>', id: 'cell_?', shape: 'poly', coords: null};

	gridder.makeHTML($('#wrap-mainImg'), 'append', htmlTemplate);

	

	gridder.updateHTML();
	
	// window.onresize = function(){ resize(); };
	
	
	
	drawHeatmap();
	
}




$('document').ready(function(){
	CELL_CANVAS = document.getElementById('cellViewCanvas');
	MAIN_IMAGE = document.getElementById('mainFA_image');

	WRAP_CELLCANVAS = $('#wrap-cellCanvas');
	WRAP_CONTROLCANVAS = $('#wrapControlComparisons .maintain-ratio-full');


	// 1. load all the finished grades
	$.ajax({
		url: '/api/v1/grading/load',
		data: { 
			finishedGrading: 1
		},
		type: 'GET',
		success: function(response) {
			print('Load grades:', response);
			GRADE_SESSIONS = response;
			createGraderList(GRADE_SESSIONS);
			
			// 2. then load the grid coordinates
			$.ajax({
				url: '/api/v1/grading/loadGrid',
				type: 'GET',
				success: function(response) {
					print('Loaded grid coords');
					GRID_CELL_COORDS = response;
					// 3. then init
					init();
				},
				error: function(error) {
					print(error);
				}
			});

	
		},
		error: function(error) {
			print(error);
		}
	});


	$('input').change(function()
	{
		var selectedGrade = $('input[name=grade]:checked').val();
		var selectedGrader = $('input[name=grader]:checked').val();
		drawHeatmap(selectedGrader, selectedGrade);
	});
	
});


function drawHeatmap(grader='all', gradedValue='all'){
	var numImgs = Object.keys(GRADE_SESSIONS).length;
	var numGraders = $('input[name=grader]').length - 1;
	var percent = 1.0 / (numImgs * numGraders);

	// clear canvas
	gridder.shadeCell(0, 'rgba(0,0,0,0)', true);

	var drawnCells = 0;
	var totalCells = 0;
	for (var s in GRADE_SESSIONS){

		if (GRADE_SESSIONS[s].globals['grader'] !== grader && grader !== 'all')
			continue;

		for (var i in GRADE_SESSIONS[s].grades)
        {
			var grade = GRADE_SESSIONS[s].grades[i].grades;
			if (grade[0]['value'] === gradedValue || gradedValue === 'all'){
				var colr = 'rgba(255,0,0,' + percent.toString() + ')';
				gridder.shadeCell(i, colr, false);
				drawnCells += 1;
			}
			totalCells += 1;
		}
    }
}



function createGraderList(gradeSessions){
	var graderIds = {};
	for (var s in gradeSessions){
		graderIds[GRADE_SESSIONS[s].globals['grader']] = 0;
	}
	
	for (var g in graderIds){
		var html = $('<input type="radio" name="grader" value="'+ g +'">' );
		$('#wrap-graderList').append(html);
		$('#wrap-graderList').append(g);
		$('#wrap-graderList').append("<br>");
	}
	
}