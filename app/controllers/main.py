from flask import *
import json
import imageProcessing
from sqlFunctions import *
import config
import hashlib
import os

main = Blueprint('main', __name__)


@main.route('/', methods=['GET', 'POST'])
def main_route():
	uploadType = None

	if not request.form and not request.args:
		return redirect(url_for('gradeView.main_route'))

	if request.args and 'gallery' in request.args:
		uploadType = request.args['gallery']

	images = []
	if uploadType:
		images = getImages(uploadType)
	else:
		images = getImages('patient')

	imageGrades = {}
	currentImageGrades = {}
	isImageGraded = {}
	for i in images:
		imgId = i['imgId']
		finishedGrades = getFinishedGrades(imgId)
		finishedGrades = [x['userId'] + ' - finished ' + x['timestamp'] for x in finishedGrades]
		currentGraders = getCurrentGraders(imgId)

		currentImageGrades[imgId] = currentGraders
		imageGrades[imgId] = finishedGrades
		if currentGraders or finishedGrades:
			isImageGraded[imgId] = True
	
	#print '\n\n\n\n', imageGrades, '\n\n\n'
	data = {
		'images' : images,
		'isImageGraded': isImageGraded,
		'finishedGraders': imageGrades,
		'currentGraders': currentImageGrades,
		'type' : uploadType
	}


	return render_template('index.html', **data)