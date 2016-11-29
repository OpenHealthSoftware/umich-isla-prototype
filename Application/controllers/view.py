from flask import *
from imageProcessing import *
from sqlFunctions import *
from os import listdir
from os.path import isfile, join
from PIL import Image
import os


view = Blueprint('view', __name__, template_folder='templates', static_folder="static")
GRID_PATH = './static/images/grid6.png'
C_GRID_PATH = './static/images/grid6.jpg' #for contout need nonalpha
UPLOAD_PATH = './static/images/uploads/'
GRID_PREFIX = "grid_" # prefix that grid images will begin with

def getControlImages():
	files = [f for f in listdir('./static/images/normals/') 
		if isfile(join('./static/images/normals/', f)) and not os.path.basename(f).startswith(GRID_PREFIX)]
	return files

# Requires: the imgId in the database
# Effects: forms list of data needs for a page
def getPageData(imgId, ):
	
	coords = processImageGrid(C_GRID_PATH)
	image = getImageData(imgId)
	controls = getControlImages()
	gridData = getGridData(imgId)

	data = {
		"coords" : coords,
		"img" : image,
		"grid" : GRID_PATH,
		"controls" : controls,
		"numPrev" : 5, #number of control images to show at once
		"isGridded" : isfile(UPLOAD_PATH + 'grid_' + imgId + '.' + image['format']),
		"xOffset" : 0,
		"yOffset" : 0
	}
	if gridData:
		data['xOffset'] = gridData['xOffset']
		data['yOffset'] = gridData['yOffset']

	return data



@view.route('/view', methods=['GET', 'POST'])
def main_route():
	gradeView = True
	data = {}

	if request.method == "GET" and request.args:
		args = request.args
		imgId = args['p']
		data = getPageData(imgId)

	#if len(data) == 0:
	#	data['upload'] = True
	#	print "MADE IT"

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
	data = {'gridSrc' : gridSrc, 'x' : qr['xOffset'], 'y' : qr['yOffset']}
	return jsonify(**data)