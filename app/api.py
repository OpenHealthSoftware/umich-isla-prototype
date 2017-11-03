from flask import *
import sqlFunctions as sql
import os
import urllib
import util
import config as conf
import datetime

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
			path = os.path.join(conf.LIBRARY_PATH, i['filename'] + '.' + i['format'])
			# TODO: url_for
			imgs.append(path)

		response = {
			'name' : name,
			'desc' : info['description'],
			'imgSrcs': imgs
		}

		return jsonify(response)
		# TODO: don't prepend file path, save data

# normal?id=
@api.route(urlPrefix + 'normal', methods = ['GET'])
def normal_route():

	# grabs the next or prev normal image
	if request.method == 'GET':
		normId = request.args['id']
		direction = int(request.args['dir'])
		if direction != 1 or direction != -1:
			direction = 1

		kwargs = {}
		if 'side' in request.args:
			kwargs = {'side': request.args['side']}

		imgList = sql.getImages('normal', **kwargs)
		if not imgList:
			return jsonify({'error': 'no normal images'})
		
		# find where the normal is in the list
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
		
		response = {
			'src' : url_for('static', filename='images/normals/' + img['imgId'] + '.' + img['format']),
			'id' : img['imgId'],
			'x' : qr['xOffsetPerc'], 
			'y' : qr['yOffsetPerc'],
			'scaleRatio': qr['scaleRatio']
		}

		return jsonify(response)

		


@api.route(urlPrefix + 'image', methods = ['GET'])
def image_info():
	"""
	If no selection array specified, get all data
	Selection: imgData, gridData, gradeData
	"""

	if request.method != 'GET':
		return jsonify({ 'error': 'invalid request type' })
	elif 'id' not in request.args:
		return jsonify({'error': 'id must be specified'})


	response = {}
	imgId = request.args['id']
	
	# TODO: this isn't correct for some reason
	if not request.args.getlist('selection'):
		selection = ['imgData', 'gridData', 'gradeData']
	else: selection = request.args.getlist('selection')


	if 'imgData' in selection:
		response['imgData'] = sql.getImageData(imgId)
	if 'gridData' in selection:
		response['gridData'] = sql.getGridData(imgId)
	if 'gradeData' in selection:
		response['gradeData'] = sql.getGradesFromId(imgId)

	return jsonify(response)
	# TODO: don't prepend file path, save data






@api.route(urlPrefix + 'grading/save', methods=['POST'])
def save_grade():
	user = util.get_current_user()

	imgId = request.form['imgId']
	gradeData = request.form['gradeData']
	gradeId = request.form['gradeId']
	finished = request.form['finished']
	cellsGraded = request.form['cellsGraded']
	date = datetime.datetime.today().strftime('%Y-%m-%d')
	print('\nGradeId:', gradeId, user, finished, date)

	inDatabase = sql.getGradesFromId(gradeId)
	session = ''
	if not inDatabase:
		session = len(sql.getGradesFromUser(user, imgId)) + 1
		gradeFilename = date + '_' + user + '_' + imgId + '_' + str(session) + '.json'
		gradeId = sql.insertGradeToDB(gradeFilename, user, imgId, cellsGraded, finished, session)
	else: 
		session = inDatabase['sessionId']
		sql.updateGradeInDB(gradeId, cellsGraded, finished)

	fnameTemp = '{}_{}_{}_{}.json'
	gradeFilename = fnameTemp.format(date, user, imgId, session)
	with open(conf.GRADES_PATH + gradeFilename, 'w') as f:
		f.write(gradeData)
	return jsonify({'gradeId': gradeId})


@api.route(urlPrefix + 'grading/load', methods=['GET'])
def load_grade_route():
	if 'gradeId' not in request.args:
		return jsonify({'error': 'grade id not given'})

	gradeRow = sql.getGradesFromId(request.args['gradeId'])
	gradeJSON = open(conf.GRADES_PATH + gradeRow['gradeFile'], 'r').read()
	return gradeJSON