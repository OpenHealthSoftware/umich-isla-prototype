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

	var numSessions = Object.keys(GRADE_SESSIONS).length;
	var imgIds = {};
	var graders = {};
	for (var s in GRADE_SESSIONS){
		var info = GRADE_SESSIONS[s]['globals'];
		imgIds[info['imgId']] = 0;
		graders[info['grader']] = 0;
	}
	var numImgs = Object.keys(imgIds).length;
	var numGraders = Object.keys(graders).length;
	
	$('#breakdown').html('{0} total images. {1} grade sessions among {2} graders'.format(numImgs, numSessions, numGraders));

	drawHeatmap();
}

String.prototype.format = function() {
	a = this;
	for (k in arguments) {
		a = a.replace("{" + k + "}", arguments[k])
	}
	return a
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
	var totalGradeSessions = numImgs * numGraders;
	var scale = $('input[name=scale]:checked').val();
	countsPerCell = {};

	for (var s in GRADE_SESSIONS){

		if (GRADE_SESSIONS[s].globals['grader'] === grader || grader === 'all')
		{
			for (var i in GRADE_SESSIONS[s].grades)
			{
				var grade = GRADE_SESSIONS[s].grades[i].grades;
				if (grade[0]['value'] === gradedValue || gradedValue === 'all'){
					if (!(i in countsPerCell))
						countsPerCell[i] = 0;
					countsPerCell[i] = countsPerCell[i] + 1;
				}
			}
		}
	}
	var maxCount = 0;
	for (var i  in countsPerCell)
	{
		if (countsPerCell[i] > maxCount)
			maxCount = countsPerCell[i];
	}
	var percent = 0;
	if (scale === 'global')
		percent = 1.0 / totalGradeSessions;
	else
		percent = 1.0 / maxCount;


	// clear canvas
	gridder.shadeCell(0, 'rgba(0,0,0,0)', true);

	var drawnCells = 0;
	for (var i in countsPerCell){
		var alpha = percent * countsPerCell[i];
		var colr = 'rgba(255,0,0,' + alpha.toString() + ')';
		gridder.shadeCell(i, colr, false);
		drawnCells += countsPerCell[i];
	}

	var legendMax = 0
	if (scale === 'global')
		legendMax = totalGradeSessions;
	else
		legendMax = maxCount;

	$('#info').html('Cells drawn: ' + drawnCells.toString());

	$('#canvasLegend canvas').each(function(){
		var canv = $(this)[0];
		var ctx = canv.getContext('2d');
		ctx.clearRect(0,0, canv.width, canv.height);
		ctx.beginPath();
		ctx.fillStyle = '#fff';
		ctx.fillRect(0,0,canv.width, canv.height);


		percent = parseFloat($(this).attr('data-percent'));
		$(this).next('span').html(percent * legendMax);
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