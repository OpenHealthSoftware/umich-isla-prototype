print = console.log;
var GRADE_SESSIONS;

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




function init(){
    for (var s in GRADE_SESSIONS){

        var btn = $('<button>', {class: 'download', id: s});
        btn.html('Download ' + GRADE_SESSIONS[s].globals.imgId);
        btn.on('click', function(){
            download($(this).attr('id'));
        });
        $('#holder').append(btn);
    }
}


function download(session){
    print('Downloading session' + session.toString());
    exportData = GRADE_SESSIONS[session];

    csvs = generateCSV(exportData)

    var link = document.createElement("a");
    var encodedURI = encodeURI(csvs);
    link.setAttribute("href", "data:application/octet-stream," + encodedURI);

    var grader = exportData.globals.grader;
    var imgId = exportData.globals.imgId;
    var date = new Date().toISOString();
    link.setAttribute("download", date + '_' + grader + '_' + imgId +".csv");

    link.click();
}

function generateCSV(gradeData)
{
	// imguuid, cellid, grade1, grade2,...graden, meta1, meta2,...metan
	// option to remove grade_data.global values in export
	
	// first get all the possible headers
	var headers = {};
	var allGrades = gradeData.grades;
	for (var i in allGrades)
	{
		grade_i = allGrades[i].grades;
		for (var valueIdx in grade_i)
			headers[grade_i[valueIdx].headerName] = null;
	}
	headers['Feature - Artifact'] = null;
	headers['Feature - Capillary dilatation'] = null;
	headers['Feature - Capillary loss'] = null;
	headers['Feature - IRMA'] = null;
	headers['Feature - Leakage'] = null;
	headers['Feature - Microaneurysms'] = null;
	headers['Feature - Narrowing'] = null;
	headers['Feature - New vessel'] = null;
	headers['Feature - Not sure'] = null;
	headers['Feature - Pruning'] = null;
	headers['Feature - Vessel staining'] = null;

	var csvStr = '';
	var gridCellGrades = gradeData.grades;
	for (var cell in allGrades)
	{
		cellGrades = gridCellGrades[cell].grades;
		cellMeta = gridCellGrades[cell].meta;

		var row = [];

		row.push(gradeData.globals.imgId);
		row.push(cell);

		Object.keys(headers).sort().forEach(function(key, x){

			var found = false;
			for (var j in cellGrades)
			{
				if (key == cellGrades[j].headerName)
				{
					row.push(cellGrades[j].value.replace(',', ';'));
					found = true;
					break;
				}
			}
			if (!found)
				row.push('');
		});

		// add meta
		Object.keys(cellMeta).sort().forEach(function(key, x){
			row.push(cellMeta[key].toString().replace(',', ';'));		
		});

		var rowStr = row.join(',') + '\n';
		csvStr += rowStr;
	}
	csvStr = 'ImgId,CellId,' + Object.keys(headers).sort().join(',') + ',' + 
		Object.keys(cellMeta).sort().join(',') + '\n' + csvStr;

	// TODO: GRADE_DATA.globals values
	return csvStr;
}

