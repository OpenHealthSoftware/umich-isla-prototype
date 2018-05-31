// import {RegionDivider, Cell} from './Grid.js';
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
	window.onresize = function(){ resize(); };

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


	// $('input').change(function(){
	// 	drawHeatmap();
	// });

});



function drawHeatmap(grader=$('input[name=grader]:checked').val(), gradedValue=$('input[name=grade]:checked').val()){
	var numImgs = Object.keys(GRADE_SESSIONS).length;
	var numGraders = $('input[name=grader]').length - 1;
	var percent = 1.0 / (numImgs * numGraders);

	// clear canvas
	gridder.shadeCell(0, 'rgba(0,0,0,0)', true);

	var drawnCells = 0;
	var totalCells = 0;
	for (var s in GRADE_SESSIONS){

		if (GRADE_SESSIONS[s].globals['grader'] === grader || grader === 'all')
		{

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

	$('#info').html('Cells drawn: ' + drawnCells.toString() + '/' + totalCells.toString());

	$('#canvasLegend canvas').each(function(){
		var canv = $(this)[0];
		var ctx = canv.getContext('2d');
		ctx.clearRect(0,0, canv.width, canv.height);
		ctx.beginPath();
		ctx.fillStyle = '#fff';
		ctx.fillRect(0,0,canv.width, canv.height);


		percent = parseFloat($(this).attr('data-percent'));
		var count = percent * totalCells;
		$(this).next('span').html(count);
		ctx.beginPath();
		ctx.fillStyle = 'rgba(255,0,0,' + percent.toString() + ')';
		ctx.fillRect(5,5,canv.width-10,canv.height-10);
		
	});
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
	
	$('input').change(function(){
		drawHeatmap();
	});
}



function resize()
{
	gridder.resize();
	drawHeatmap();
}