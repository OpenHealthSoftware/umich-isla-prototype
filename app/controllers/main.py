from flask import *
import json
import gridProcessing
import sqlFunctions as sql
import config as C
import hashlib
import os

main = Blueprint('main', __name__)


@main.route('/', methods=['GET', 'POST'])
def main_route():

	data = {
		'version' : C.GIT_TAG
	}

	if 'username' not in session:
		return redirect(url_for('user.login_route'))

	currentImages = sql.getCurrentImages(session['username'])

	data['currentImages'] = currentImages

	return render_template('index.html', **data)


@main.route('/gallery', methods=['GET', 'POST'])
def gallery_route():
	if 'username' not in session:
		return redirect(url_for('user.login_route'))

	category = None

	if not request.form and not request.args:
		return redirect(url_for('gradeView.main_route'))

	if request.args and 'category' in request.args:
		category = request.args['category']

	images = []
	if category:
		images = sql.getImages(category=category)
	else:
		images = sql.getImages(category=C.imgCategories['patient'])

	imageGrades = {}
	currentImageGrades = {}
	isImageGraded = {}
	for i in images:
		imgId = i['imgId']
		finishedGrades = sql.getFinishedGrades(imgId)
		finishedGrades = [x['userId'] + ' - Session ' + str(x['sessionId']) + ' finished ' + x['timestamp'] for x in finishedGrades]
		currentGraders = sql.getGradeInfoForImage(imgId, excludeFinished=True)

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
		'category' : category
	}


	return render_template('gallery.html', **data)


