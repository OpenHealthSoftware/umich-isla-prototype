from flask import *
from gridProcessing import *
from sqlFunctions import *
from os import listdir
from PIL import Image
import os
import config as C
import datetime
import util

gradeView = Blueprint('gradeView', __name__)
VERSION_FILE = C.VERSION_FILE

NUM_NORM_PREV = 5


	

# Requires: the imgId in the database
# Effects: forms list of data needs for a page
def getPageData(imgId):

	user = session['username']
	
	image = getImageData(imgId)
	if image is None:
		return False
	gridData = getGridData(imgId)
	gradeSession = getUnfinishedGradesFromUser(user, imgId)
	associatedFeatures = getOptions()

	imgSrc, gridSrc = util.getImagePath(imgId)
	
	data = {
		'img' : image,
		'imgSrc': url_for('content', filename=imgSrc),
		'gridSrc': url_for('content', filename=gridSrc),
		'numPrev' : NUM_NORM_PREV, #number of control images to show at once
		'xOffset' : gridData['xOffset'],
		'yOffset' : gridData['yOffset'],
		'gridScaleRatio': gridData['scaleRatio'], 
		'gitVersion' :  open(VERSION_FILE, 'r').readline().replace('\n', ''),
		'gradeSessions': gradeSession,
		'associatedFeatures': associatedFeatures
	}

	return data



@gradeView.route('/grade', methods=['GET', 'POST'])
def main_route():

	gradeView = True
	data = {}

	if request.method == 'GET' and request.args:
		args = request.args
		imgId = args['p']
		print('\nLoading view for', imgId, '\n')
		data = getPageData(imgId)


	if not request.args or data == False: #data == false means no imgid found in db
		data = {
			'coords' : [],
			'img' : {'imgId' : '', 'format' : ''},
			'grid' : '',
			'numPrev' : NUM_NORM_PREV, #number of control images to show at once
			'xOffset' : 0,
			'yOffset' : 0,
			'gridScaleRatio' : 1,
		}
		return render_template('gradeView.html', **data)


	return render_template('gradeView.html', **data)





@gradeView.route('/getUser', methods=['GET', 'POST'])
def get_user_route():
	rForm = request.form
	if request.form['caller'] == 'exportGrade':
		user = session['username']
		return jsonify({'user': user})
	else: return jsonify({'user':'error'})
