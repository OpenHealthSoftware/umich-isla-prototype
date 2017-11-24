from flask import *
from imageProcessing import *
from sqlFunctions import *
from os import listdir
from os.path import isfile, join
from PIL import Image
import os
import config
import datetime
import util

gradeView = Blueprint('gradeView', __name__)
UPLOAD_PATH = config.UPLOAD_FOLDER_P
GRID_PREFIX = config.GRID_PREFIX
GRID_PATH = config.GRID_PATH
C_GRID_PATH = config.C_GRID_PATH
GRADES_PATH = config.GRADES_PATH
VERSION_FILE = config.VERSION_FILE

NUM_NORM_PREV = 5

# Effects: returns a list of control image src
def getControls(side):
	controls = getControlsFromDb(side)
	# create src url for controls
	controlsSrc = []
	for i in controls:
		temp = url_for('static', filename='images/normals/' + i['imgId'] + '.' + i['format'])
		controlsSrc.append(temp)
	return controlsSrc



	


# Requires: the imgId in the database
# Effects: forms list of data needs for a page
def getPageData(imgId):

	user = util.get_current_user()
	
	image = getImageData(imgId)
	if image is None:
		return False
	gridData = getGridData(imgId)
	gradeSession = getGradesFromUser(user, imgId)
	associatedFeatures = getOptions()

	data = {
		'img' : image,
		'grid' : GRID_PATH,
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

	#jsCoords = [ [int(i) for i in x.split(',')] for x in data['coords']]
	#print('\n\n\n', jsCoords, '\n\n\n')
	print(data['gridScaleRatio'])
	print(data['xOffset'], data['yOffset'])
	return render_template('gradeView.html', **data)





@gradeView.route('/getUser', methods=['GET', 'POST'])
def get_user_route():
	rForm = request.form
	if request.form['caller'] == 'exportGrade':
		user = util.get_current_user()
		return jsonify({'user': user})
	else: return jsonify({'user':'error'})













# # Requires: FA image and grid images are their proper sizes, name of picture in database,
# # img file format, and the percentage offsets created by the user positioning data
# # Effects: puts the center of the grid on the specified location of the FA image
# def createGriddedImage(originCoords, imgName, iFormat, xPerc, yPerc):
# 	# Load images
# 	grid = Image.open(GRID_PATH, 'r')
# 	faImg = Image.open(UPLOAD_PATH + imgName + iFormat, 'r')
# 	fa_w, fa_h = faImg.size

# 	# Calculate where grid goes and paste
# 	grid_w, grid_h = grid.size
# 	offset = (originCoords[0] - (grid_w  / 2) , originCoords[1] - (grid_h  / 2))
# 	rgba = grid.split()
# 	alpha = rgba[len(rgba)-1]

# 	croppedGrid = Image.new('RGBA', (fa_w, fa_h))
# 	croppedGrid.paste(grid, offset, mask=alpha)

# 	gridId = GRID_PREFIX + imgName + iFormat
# 	insertGridToDB(gridId, xPerc, yPerc, imgName)
# 	png_info = grid.info
# 	croppedGrid.save(UPLOAD_PATH + gridId, **png_info)
# 	return UPLOAD_PATH + gridId



# @view.route('/viewPositioned', methods=['GET', 'POST'])
# def positionGrid_route():
# 	rForm = request.form
# 	imgName = rForm['picName']
# 	image = getImageData(imgName)
# 	originCoords = [rForm['x'], rForm['y']]
# 	originCoords = map(int, originCoords)
# 	newImgPath = createGriddedImage(originCoords, imgName, '.' + image['format'], rForm['xPerc'], rForm['yPerc'])
# 	data = {'newImgPath' : newImgPath}
# 	return jsonify(**data)

