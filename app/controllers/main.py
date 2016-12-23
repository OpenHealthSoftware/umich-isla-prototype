from flask import *
import json
import imageProcessing
from sqlFunctions import *
import config
import hashlib
import os

main = Blueprint('main', __name__)


@main.route('/', methods=['GET', 'POST'])
def main_route():
	type = ''
	form = ''

	if not request.form and not request.args:
		return redirect(url_for('view.main_route'))

	if request.method == 'POST' and request.form:
		form = request.form
		type = form['getContent']

	images = []
	if type:
		images = getImages(type)
	else:
		images = getImages('patient')

	imageGrades = {}
	for i in images:
		results = isImageGraded(i['imgId'])
		imageGrades[i['imgId']] = results
	
	print "\n\n\n\n", imageGrades, "\n\n\n"
	data = {
		"images" : images,
		"imageGrades": imageGrades,
		"type" : type
	}

	if form and form['getContent']:
		html = render_template("index.html", **data)
		return jsonify(html=html)
	else:
		return render_template("index.html", **data)