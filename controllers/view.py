from flask import *
from imageProcessing import *
from sqlFunctions import *
from os import listdir
from os.path import isfile, join
from PIL import Image
import os
import config
import datetime

view = Blueprint('view', __name__, template_folder='templates', static_folder="static")
UPLOAD_PATH = config.UPLOAD_FOLDER_P
GRID_PREFIX = config.GRID_PREFIX
GRID_PATH = config.GRID_PATH
C_GRID_PATH = config.C_GRID_PATH
GRADES_PATH = config.GRADES_PATH

# Requires: the imgId in the database
# Effects: forms list of data needs for a page
def getPageData(imgId):
	
	coords = processImageGrid(C_GRID_PATH)
	image = getImageData(imgId)
	controls = getControls(image['eye'])
	gridData = getGridData(imgId)


	# create src url for controls
	controlsSrc = []
	for i in controls:
		temp = url_for('static', filename='images/normals/' + i['imgId'] + '.' + i['format'])
		controlsSrc.append(temp)

	data = {
		"coords" : coords,
		"img" : image,
		"grid" : GRID_PATH,
		"controls" : controlsSrc,
		"numPrev" : 5, #number of control images to show at once
		"isGridded" : isfile(UPLOAD_PATH + 'grid_' + imgId + '.' + image['format']),
		"xOffset" : gridData['xOffset'],
		"yOffset" : gridData['yOffset'],
		"gridScaleRatio": gridData['scaleRatio']
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
			"controls" : '',
			"numPrev" : 5, #number of control images to show at once
			"xOffset" : 0,
			"yOffset" : 0,
			"gridScaleRatio" : 1
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
	data = {'gridSrc' : gridSrc, 'x' : qr['xOffset'], 'y' : qr['yOffset'], 'scaleRatio': qr['scaleRatio']}
	return jsonify(**data)


@view.route('/getUser', methods=['GET', 'POST'])
def get_user_route():
	rForm = request.form
	user = '[ not logged in ]'
	if 'REMOTE_USER' in request.environ:
		user = request.environ['REMOTE_USER']
		if rForm['caller'] == 'exportGrade':
			return jsonify({"user":user})
	else: return jsonify({})


# Assumes a grader won't grade the same image twice in one day. If they do, the previous will be overwritten
@view.route('/saveGrading', methods=['GET', 'POST'])
def save_grade_route():
	
    # if 'REMOTE_USER' in request.environ:
	if True:
		user = 'mav' #request.environ['REMOTE_USER']
		imgId = request.form['imgId']
		gradeData = request.form['gradeData']
		date = datetime.datetime.today().strftime('%Y-%m-%d')
		gradeFilename = date + '_' + user + '_' + imgId + ".txt"
		insertGradeToDB(gradeFilename, user, imgId)
		gradeFile = open(GRADES_PATH + gradeFilename, 'w')
		gradeFile.write(gradeData)
		gradeFile.close()
		return ('', 204)
	return ('Not logged in', 401)