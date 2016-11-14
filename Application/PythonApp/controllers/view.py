from flask import *
from imageProcessing import *
from sqlFunctions import *
from os import listdir
from os.path import isfile, join
from PIL import Image



view = Blueprint('view', __name__, template_folder='templates', static_folder="static")
GRID_PATH = './static/images/grid3Cent.png'
UPLOAD_PATH = './static/images/uploads/'

def getControlImages():
	return [f for f in listdir('./static/images/normals/') if isfile(join('./static/images/normals/', f))]

# Effects: forms list of data needs for a page
def getPageData(imgId):
	
	coords = processImageGrid(GRID_PATH)
	image = getImageData(imgId)
	controls = getControlImages()

	data = {
		"coords" : coords,
		"img" : image,
		"grid" : GRID_PATH,
		"controls" : controls,
		"numPrev" : 5, #number of control images to show at once
		"isGridded" : isfile(UPLOAD_PATH + 'gridded_' + imgId + '.' + image['format'])
	}
	return data

# Requires: FA image and grid images are their proper sizes
# Effects: puts the center of the grid on the specified location of the FA image
def createGriddedImage(originCoords, imgName):
	# Load images
	grid = Image.open(GRID_PATH, 'r')
	faImg = Image.open(UPLOAD_PATH + imgName, 'r')

	# Calculate where grid goes and paste
	grid_w, grid_h = grid.size
	offset = (originCoords[0] - (grid_w  / 2) , originCoords[1] - (grid_h  / 2))
	r, g, b, alpha = grid.split()
	faImg.paste(grid, offset, mask=alpha)

	imgName = "gridded_" + imgName
	faImg.save(UPLOAD_PATH + imgName)
	return UPLOAD_PATH + imgName


@view.route('/view', methods=['GET', 'POST'])
def main_route():

	if request.method == "GET":
		args = request.args
		imgId = args['p']
		data = getPageData(imgId)

	return render_template("view.html", **data)


@view.route('/viewPositioned', methods=['GET', 'POST'])
def positionGrid_route():
	imgName = request.form['picName']
	image = getImageData(imgName)
	originCoords = [request.form['x'], request.form['y']]
	originCoords = map(int, originCoords)
	newImgPath = createGriddedImage(originCoords, imgName + '.' + image['format'])
	return json.dumps({'newImgPath' : newImgPath})
