print = console.log;
var CELL_IDX = {}; // cellId : { img1_ses1: {}, img2_ses2: {}, ...}
var CELL_IDX2 = {}; // cellId : {'perfusion val': [{global + meta}], perfuionVal2: []}
var GRADE_SESSIONS;
var GRADE_IDX = {}; //'Perfusion Value | X': [ {cellId: , brightness: 100,}, ...]

$.ajax({
	url: '/api/v1/grading/load',
	data: { 
		finishedGrading: 1
	},
	type: 'GET',
	success: function(response) {
		print('Load grades:', response);
		GRADE_SESSIONS = response;
		init();
	},
	error: function(error) {
		print(error);
	}
});
 
var totalValidCells = 0, totalCells  = 0;

function init(){
	
	
	generateCellIdx();
	
	generateGradeIndex();

	var tmp_perfusionVals = Object.keys(GRADE_IDX);
	perfusionVals = [];
	for (i in tmp_perfusionVals){
		perfusionVals.push(tmp_perfusionVals[i].split(' - ')[1]);
	}

	generateCellIdx2(perfusionVals);

	for (var category in GRADE_IDX){
		print(category, GRADE_IDX[category].length / totalValidCells);
	}
}




function generateGradeIndex(){
	

	for (var s in GRADE_SESSIONS){
		var grades = GRADE_SESSIONS[s].grades;
		totalCells += GRADE_SESSIONS[s].globals.totalCells;
		totalValidCells += GRADE_SESSIONS[s].globals.totalValidCells;

		for (var cellNumber in grades){
			var cellGrades = grades[cellNumber].grades;
			
			for (var i in cellGrades){
				
				var data = grades[cellNumber].meta;
				Object.assign(data, GRADE_SESSIONS[s].globals);
				Object.assign(data, {cellId: cellNumber});
				var key = cellGrades[i].headerName + ' | ' + cellGrades[i].value;

				if (key in GRADE_IDX)
					GRADE_IDX[key].push(data);
				else
					GRADE_IDX[key] = [data];
			}

		}
	}

	print(GRADE_IDX);

}
// avg grade time


function generateCellIdx(){

	for (var i in GRADE_SESSIONS){
		var grades = GRADE_SESSIONS[i].grades;
		for (var cell in grades){
			var cellInfo = grades[cell];
			var id = GRADE_SESSIONS[i].globals['imgId'] + '_' + GRADE_SESSIONS[i].globals['sessionId'];

			if (cell in CELL_IDX){
				CELL_IDX[cell][id] = cellInfo;
			}
			else{
				CELL_IDX[cell] = { [id]: cellInfo};
			}
			
		}
	}
	
}

function generateCellIdx2(perfusionOptions){
// cellId : {'perfusion val': [{global + meta}], perfuionVal2: []}
	
	for (var i in GRADE_SESSIONS){
		var grades = GRADE_SESSIONS[i].grades;
		for (var cellId in grades){
			var cellInfo = grades[cellId];
			var id = GRADE_SESSIONS[i].globals['imgId'] + '_' + GRADE_SESSIONS[i].globals['sessionId'];

			if (cellId in CELL_IDX){
				CELL_IDX[cellId][id] = cellInfo;
			}
			else {
				CELL_IDX[cellId] = { [id]: cellInfo};
			}
			
		}
	}
}


/*

var ctx = document.getElementById("myChart").getContext('2d');
var myChart = new Chart(ctx, {
	type: 'bar',
	data: {
		labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
		datasets: [{
			label: '# of Votes',
			data: [12, 19, 3, 5, 2, 3],
			backgroundColor: [
				'rgba(255, 99, 132, 0.2)',
				'rgba(54, 162, 235, 0.2)',
				'rgba(255, 206, 86, 0.2)',
				'rgba(75, 192, 192, 0.2)',
				'rgba(153, 102, 255, 0.2)',
				'rgba(255, 159, 64, 0.2)'
			],
			borderColor: [
				'rgba(255,99,132,1)',
				'rgba(54, 162, 235, 1)',
				'rgba(255, 206, 86, 1)',
				'rgba(75, 192, 192, 1)',
				'rgba(153, 102, 255, 1)',
				'rgba(255, 159, 64, 1)'
			],
			borderWidth: 1
		}]
	},
	options: {
		scales: {
			yAxes: [{
				ticks: {
					beginAtZero:true
				}
			}]
		}
	}
});
*/