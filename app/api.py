from flask import *
import sqlFunctions as sql
import os
import urllib
import util
import config as conf
import datetime
import imageProcessing

api = Blueprint('api', __name__)

urlPrefix = '/api/v1/'

@api.route(urlPrefix + 'library/example/<name>', methods = ['POST'])
def library_example(name):
	name = urllib.unquote(name)
	if request.method == 'POST':
		examples = sql.getOptionExamples(name)
		info = sql.getOption(name)
		
		imgs = []
		for i in examples:
			path = os.path.join(conf.FILE_PATHS['library'], i['filename'] + '.' + i['format'])
			# TODO: url_for
			imgs.append(path)

		response = {
			'name' : name,
			'desc' : info['description'],
			'imgSrcs': imgs
		}

		return jsonify(response)
		# TODO: don't prepend file path, save data

# control?id=
@api.route(urlPrefix + 'control', methods = ['GET'])
def control_route():

	# grabs the next or prev control image
	if request.method == 'GET':
		normId = request.args['id']
		direction = int(request.args['dir'])
		if direction != 1 or direction != -1:
			direction = 1

		kwargs = {'category': conf.imgCategories['control']}
		if 'side' in request.args:
			kwargs = {'side': request.args['side']}

		imgList = sql.getImages(**kwargs)
		if not imgList:
			return jsonify({'error': 'no control images'})
		
		# find where the control is in the list
		currentIndex = 0
		for i in range(len(imgList)):
			if imgList[i]['imgId'] == normId:
				currentIndex = i
				break

		# now can figure out which is the next or previous
		img = {}
		if normId == 'null':
			img = imgList[0]
		else: # next or prev, direction == 1 or -1
			img = imgList[(currentIndex + direction) % len(imgList)]

		# get grid data
		qr = sql.getGridData(img['imgId'])

		src = os.path.join(conf.FILE_PATHS['control'], img['imgId'] + '.' + img['format'])
		
		response = {
			'src' : url_for('content', filename=src),
			'id' : img['imgId'],
			'x' : qr['xOffsetPerc'], 
			'y' : qr['yOffsetPerc'],
			'scaleRatio': qr['scaleRatio']
		}

		return jsonify(response)




def image_info_helper(imgId, request):
	
	
	# TODO: this isn't correct for some reason
	if not request.args.getlist('selection[]'):
		selection = ['imgData', 'gridData', 'gradeData']
	else: 
		selection = request.args.getlist('selection[]')

	response = {}

	if 'imgData' in selection:
		response['imgData'] = sql.getImageData(imgId)
	if 'gridData' in selection:
		response['gridData'] = sql.getGridData(imgId)
	if 'gradeData' in selection:
		response['gradeData'] = sql.getGradesFromId(imgId)
	if 'coordinates' in selection:
		response['coordinates'] = calculateCoordinates(imgId)
	return response



@api.route(urlPrefix + 'image', methods = ['GET'])
def image_info():
	"""
	If no selection array specified, get all data
	Selection: imgData, gridData, gradeData
	"""

	if request.method != 'GET':
		return jsonify({ 'error': 'invalid request type' })
	
	response = []
	
	
	if 'id' not in request.args:
		filters = {}
		if 'side' in request.args:
			filters['side'] = request.args['side']
		if 'category' in request.args:
			filters['category'] = request.args['category']

		imgs = sql.getImages(**filters)
		for i in imgs:
			response.append(image_info_helper(i['imgId'], request))
	else:
		response = image_info_helper(request.args['id'], request)

	# add urls for images
	for x in response:
		if 'imgData' in x:
			img = x['imgData']
			src = os.path.join(conf.FILE_PATHS[img['category']], img['imgId'] + '.' + img['format'])
			img['src'] = url_for('content', filename=src)

	return jsonify(response)
	# TODO: don't prepend file path, save data






@api.route(urlPrefix + 'grading/save', methods=['POST'])
def save_grade():
	user = util.get_current_user()
	date = datetime.datetime.today().strftime('%Y-%m-%d')

	data = request.get_json()

	totalCells = data['globals']['totalCells']
	sessionId = data['globals']['sessionId']
	imgId = data['globals']['imgId']
	gradeData = data['grades']
	cellsGraded = len(gradeData)

	finishedGrading = False
	if cellsGraded == totalCells:
		finishedGrading = True
	
	storedGrades = sql.getGradeInfo(imgId, user, sessionId)
	filenameTemp = '{}_uuid-{}_user-{}_session-{}.json'

	if not storedGrades: # sessionId inits to -1 for first request of new session
		sessionId = len(sql.getGradesFromUser(user, imgId)) + 1
		gradeFilename = filenameTemp.format(date, imgId, user, sessionId)		
		gradeId = sql.insertGradeToDB(gradeFilename, user, imgId, cellsGraded, finishedGrading, sessionId)
	else:
		sessionId = storedGrades['sessionId']
		sql.updateGradeInDB(storedGrades['gradeId'], cellsGraded, finishedGrading)

	
	gradeFilename = filenameTemp.format(date, imgId, user, sessionId)

	with open(os.path.join(conf.FILE_PATHS['grades'], gradeFilename), 'w') as f:
		f.write(json.dumps(data))
	return jsonify({'sessionId': sessionId, 'user': user})
	# TODO: ^^^ unneccesary response data after first request


@api.route(urlPrefix + 'grading/load', methods=['GET'])
def load_grade_route():
	user = util.get_current_user()
	rargs = request.args
	if 'sessionId' not in rargs:
		return jsonify({'error': 'session id not given'})
	if 'imgId' not in rargs:
		return jsonify({'error': 'image id not given'})
		

	gradeRow = sql.getGradeInfo(rargs['imgId'], user, rargs['sessionId'])
	filepath = os.path.join(conf.FILE_PATHS['grades'], gradeRow['gradeFile'])

	if os.path.isfile(filepath) == False:
		return jsonify({'error': 'Grade file not found - ' + filepath})

	gradeJSON = json.load(open(filepath, 'r'))
	return jsonify(gradeJSON)



# calculates coordinates for the grid position on a given image
def calculateCoordinates(imgId):

	# TODO: cut out cells not on image

	startCoords = imageProcessing.processImageGrid(conf.FILE_PATHS['grid']['analysis'])
	translated = []
	gridData = sql.getGridData(imgId)
	xOff = gridData['xOffset']
	yOff = gridData['yOffset']
	ratio = gridData['scaleRatio']

	for cell in startCoords:
		tc = []
		for i in range(0, len(cell), 2):
			x = cell[i] * ratio + xOff
			y = cell[i+1] * ratio + yOff
			tc.append(round(x, 3))
			tc.append(round(y, 3))
		translated.append(tc)

	return translated