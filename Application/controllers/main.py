from flask import *
import json
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

	if request.method == 'POST' and request.form:
		q = request.form
		type = q['type']
		if type == 'normal':
			path = UPLOAD_FOLDER_NORM
		print "\n\n\nLOOKKKKKK", q['type'], "\n\n"

	images = []
	if type is not None:
		images = getImages(type)
	else:
		images = getImages('patient')

	# create all the src paths for images
	srcPath = []
	for x in images:
		p = url_for('static', filename=path + x['imgId'] + '.' + x['format'])
		srcPath.append(p)

	data = {
		"images" : images,
		"paths" : srcPath,
	}
	return jsonify(data=data)