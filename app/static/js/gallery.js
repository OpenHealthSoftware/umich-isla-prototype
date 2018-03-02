$('.deleteImg').submit(function(){

    c = confirm('This will delete the image and related grading data from the server. Are you sure?');
    if (c === false)
        return false;

});