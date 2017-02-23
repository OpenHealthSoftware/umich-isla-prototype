from flask import *
from sqlFunctions import *
from config import LIBRARY_PATH
import os

api = Blueprint('api', __name__)


@api.route('/api/v1/library/example/<name>', methods = ['POST'])
def albumGet(name):
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
		