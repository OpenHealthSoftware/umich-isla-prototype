

$.ajax({
    url: '/api/v1/grading/',
    data: { 
        id: IMG_ID,
        selection: ['coordinates']
    },
    type: 'GET',
    success: function(response) {
        print('Init image resp:', response);
        GRID_CELL_COORDS = response.coordinates;
        GRADE_DATA.globals.totalCells = GRID_CELL_COORDS.length;
        init();
    },
    error: function(error) {
        print(error);
    }
});


