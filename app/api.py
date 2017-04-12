from flask import *
from sqlFunctions import *
from config import LIBRARY_PATH, STATIC_PATH
import os
import urllib

api = Blueprint('api', __name__)


@api.route('/api/v1/library/example/<name>', methods = ['POST'])
def libraryExample(name):
	name = urllib.unquote(name)
	if request.method == 'POST':
		examples = getOptionExamples(name)
		info = getOption(name)
		
		imgs = []
		for i in examples:
			path = os.path.join(LIBRARY_PATH, i['filename'] + '.' + i['format'])
			# TODO: url_for
			imgs.append(path)

		response = {
			"name" : name,
			"desc" : info['description'],
			"imgSrcs": imgs
		}

		return jsonify(response)
		# TODO: don't prepend file path, save data

# normal?id=
@api.route('/api/v1/normal', methods = ['GET'])
def normal_route():

	# grabs the next or prev normal image
	if request.method == 'GET':
		normId = request.args['id']
		direction = int(request.args['dir'])
		if direction != 1 or direction != -1:
			direction = 1

		imgList = getImages('normal')
		if not imgList:
			return jsonify({"error": "no normal images"})
		
		# find where the normal is in the list
		currentIndex = 0
		for i in range(len(imgList)):
			if imgList[i]['imgId'] == normId:
				currentIndex = i
				break

		# now can figure out which is the next or previous
		img = {}
		if normId == "null":
			img = imgList[0]
		else: # next or prev, direction == 1 or -1
			img = imgList[(currentIndex + direction) % len(imgList)]

		# get grid data
		qr = getGridData(img['imgId'])
		
		response = {
			'src' : url_for('static', filename='images/normals/' + img['imgId'] + '.' + img['format']),
			'id' : img['imgId'],
			'x' : qr['xOffsetPerc'], 
			'y' : qr['yOffsetPerc'],
			'scaleRatio': qr['scaleRatio']
		}

		return jsonify(response)

		