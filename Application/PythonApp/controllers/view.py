from flask import *
from flask_mysqldb import MySQL
import MySQLdb
from extensions import db
from imageProcessing import *
from sqlFunctions import *

view = Blueprint('view', __name__, template_folder='templates', static_folder="static")
GRID_PATH = './static/images/grid.png'



# Effects: forms list of data needs for a page
def getPageData(imgId):
	
	coords = processImageGrid(GRID_PATH)
	image = getImageData(imgId)
	print coords
	data = {
		"coords" : coords,
		"img" : image,
		"grid" : GRID_PATH
	}
	return data


@view.route('/view', methods=['GET', 'POST'])
def main_route():

	if request.method == "GET":
		args = request.args
		imgId = args['p']
		data = getPageData(imgId)

	return render_template("view.html", **data)