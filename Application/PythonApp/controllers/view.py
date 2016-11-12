from flask import *
from imageProcessing import *
from sqlFunctions import *
from os import listdir
from os.path import isfile, join




view = Blueprint('view', __name__, template_folder='templates', static_folder="static")
GRID_PATH = './static/images/grid3.png'

def getImageControls():
	return [f for f in listdir('./static/images/normals/') if isfile(join('./static/images/normals/', f))]

# Effects: forms list of data needs for a page
def getPageData(imgId):
	
	coords = processImageGrid(GRID_PATH)
	image = getImageData(imgId)
	controls = getImageControls()
	
	data = {
		"coords" : coords,
		"img" : image,
		"grid" : GRID_PATH,
		"controls" : controls,
		"numPrev" : 5 #number of control images to show at once
	}
	return data


@view.route('/view', methods=['GET', 'POST'])
def main_route():

	if request.method == "GET":
		args = request.args
		imgId = args['p']
		data = getPageData(imgId)

	return render_template("view.html", **data)