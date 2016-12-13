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
	form = ''

	if not request.form and not request.args:
		return redirect(url_for('view.main_route'))

	if request.method == 'POST' and request.form:
		form = request.form
		type = form['getContent']
		if type == 'normal':
			path = UPLOAD_FOLDER_NORM

	images = []
	if type:
		images = getImages(type)
	else:
		images = getImages('patient')

	data = {
		"images" : images,
		"imgPath" : path,
		"type" : type
	}
	if form and form['getContent']:
		html = render_template("index.html", **data)
		return jsonify(html=html)
	else:
		return render_template("index.html", **data)