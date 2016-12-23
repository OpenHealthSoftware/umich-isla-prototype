from flask import *
from imageProcessing import *
from sqlFunctions import *
from os import listdir
from os.path import isfile, join
from PIL import Image
import os
import config
import datetime

view = Blueprint('view', __name__)
UPLOAD_PATH = config.UPLOAD_FOLDER_P
GRID_PREFIX = config.GRID_PREFIX
GRID_PATH = config.GRID_PATH
C_GRID_PATH = config.C_GRID_PATH
GRADES_PATH = config.GRADES_PATH
VERSION_FILE = config.VERSION_FILE

USER = 'nullUser'
if request.environ['REMOTE_USER']:
	USER = request.environ['REMOTE_USER']
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
	
	coords = processImageGrid(C_GRID_PATH)
	image = getImageData(imgId)
	controls = getControls(image['side'])
	gridData = getGridData(imgId)
	gradeSession = getGradesFromUser(USER, imgId)

	data = {
		"coords" : coords,
		"img" : image,
		"grid" : GRID_PATH,
		"controls" : controls,
		"numPrev" : NUM_NORM_PREV, #number of control images to show at once
		"xOffset" : gridData['xOffsetPerc'],
		"yOffset" : gridData['yOffsetPerc'],
		"gridScaleRatio": gridData['scaleRatio'], 
		"gitVersion" :  open(VERSION_FILE, 'r').readline().replace('\n', ''),
		"gradeSessions": gradeSession
	}

	return data



@view.route('/view', methods=['GET', 'POST'])
def main_route():
	gradeView = True
	data = {}

	if request.method == "GET" and request.args:
		args = request.args
		imgId = args['p']
		data = getPageData(imgId)


	if not request.args:
		data = {
			"coords" : [],
			"img" : {'imgId' : '', 'format' : ''},
			"grid" : '',
			"controls" : getControls('left') + getControls('right'),
			"numPrev" : NUM_NORM_PREV, #number of control images to show at once
			"xOffset" : 0,
			"yOffset" : 0,
			"gridScaleRatio" : 1,
		}
		return render_template("view.html", **data)

	return render_template("view.html", **data)



# Requires: FA image and grid images are their proper sizes, name of picture in database,
# img file format, and the percentage offsets created by the user positioning data
# Effects: puts the center of the grid on the specified location of the FA image
def createGriddedImage(originCoords, imgName, iFormat, xPerc, yPerc):
	# Load images
	grid = Image.open(GRID_PATH, 'r')
	faImg = Image.open(UPLOAD_PATH + imgName + iFormat, 'r')
	fa_w, fa_h = faImg.size

	# Calculate where grid goes and paste
	grid_w, grid_h = grid.size
	offset = (originCoords[0] - (grid_w  / 2) , originCoords[1] - (grid_h  / 2))
	rgba = grid.split()
	alpha = rgba[len(rgba)-1]

	croppedGrid = Image.new('RGBA', (fa_w, fa_h))
	croppedGrid.paste(grid, offset, mask=alpha)

	gridId = GRID_PREFIX + imgName + iFormat
	insertGridToDB(gridId, xPerc, yPerc, imgName)
	png_info = grid.info
	croppedGrid.save(UPLOAD_PATH + gridId, **png_info)
	return UPLOAD_PATH + gridId



@view.route('/viewPositioned', methods=['GET', 'POST'])
def positionGrid_route():
	rForm = request.form
	imgName = rForm['picName']
	image = getImageData(imgName)
	originCoords = [rForm['x'], rForm['y']]
	originCoords = map(int, originCoords)
	newImgPath = createGriddedImage(originCoords, imgName, '.' + image['format'], rForm['xPerc'], rForm['yPerc'])
	data = {'newImgPath' : newImgPath}
	return jsonify(**data)


@view.route('/normalData', methods=['GET', 'POST'])
def normal_data_route():
	rForm = request.form
	imgName = rForm['picName']
	qr = getGridData(imgName)
	gridSrc = url_for('static', filename='images/normals/' + qr['gridId']) #gridID has file format
	data = {'gridSrc' : gridSrc, 'x' : qr['xOffsetPerc'], 'y' : qr['yOffsetPerc'], 'scaleRatio': qr['scaleRatio']}
	return jsonify(**data)


@view.route('/getUser', methods=['GET', 'POST'])
def get_user_route():
	rForm = request.form
	if request.form['caller'] == 'exportGrade':
		return jsonify({"user": USER})
	else: return jsonify({"user":"error"})

@view.route('/saveGrading', methods=['GET', 'POST'])
def save_grade_route():
	imgId = request.form['imgId']
	gradeData = request.form['gradeData']
	gradeId = request.form['gradeId']
	print "\n\n\n\n", gradeId, "\n\n\n"
	finished = request.form['finished']
	cellsGraded = request.form['cellsGraded']
	date = datetime.datetime.today().strftime('%Y-%m-%d')

	inDatabase = getGradesFromId(gradeId)
	session = ''
	if not inDatabase:
		session = len(getGradesFromUser(USER, imgId)) + 1
		gradeFilename = date + '_' + USER + '_' + imgId + '_' + str(session) + '.json'
		gradeId = insertGradeToDB(gradeFilename, USER, imgId, cellsGraded, finished, session)
	else: 
		session = inDatabase['sessionId']
		updateGradeInDB(gradeId, cellsGraded, finished)

	gradeFilename = date + '_' + USER + '_' + imgId + '_' + str(session) + '.json'
	gradeFile = open(GRADES_PATH + gradeFilename, 'w')
	gradeFile.write(gradeData)
	gradeFile.close()
	return jsonify({'gradeId': gradeId})


@view.route('/loadGrade', methods=['GET', 'POST'])
def load_grade_route():
	gradeRow = getGradesFromId(request.form['gradeId'])
	gradeJSON = open(GRADES_PATH + gradeRow['gradeFile'], 'r').read()
	return gradeJSON
