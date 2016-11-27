from flask import *
import imageProcessing
from sqlFunctions import *
import config
import hashlib
import os

main = Blueprint('main', __name__, template_folder='templates', static_folder="static")

UPLOAD_FOLDER_P = 'images/uploads/'
UPLOAD_FOLDER_NORM = 'images/normals/'


@main.route('/', methods=['GET', 'POST'])
def main_route():
	path = UPLOAD_FOLDER_P
	type = ''

	if request.method == 'GET' and request.args:
		q = request.args
		type = q['type']
		if type == 'normal':
			path = UPLOAD_FOLDER_NORM

	images = []
	if not type:
		images = getImages('patient')
	else:
		images = getImages(type)
	data = {
		"images" : images,
		"imgPath" : path,
		"type" : type
	}
	return render_template("index.html", **data)