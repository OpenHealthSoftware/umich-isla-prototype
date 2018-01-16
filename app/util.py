# useful global data

import config
from flask import request
import sqlFunctions as sql
import os
from os.path import isfile

def get_current_user():
	if config.USER is '':
		return request.environ['REMOTE_USER'] #valid with cosign login
	return config.USER


def getImagePath(imgId):
	"""
	Returns a tuple of (imgpath, gridpath)
	Returns false if no image is found with given id
	Returns None if file is not found #TODO: better / more descriptive returns
	"""
	image = sql.getImageData(imgId)

	if image is None:
		return False

	basePath = config.FILE_PATHS[image['category']]
		
	imgPath = os.path.join(basePath, imgId + '.' + image['format'])
	gridPath = os.path.join(basePath, config.GRID_PREFIX + imgId + '.PNG') # grid has to be .png. TODO

	if isfile(imgPath) == False:
		imgPath = None
	if isfile(gridPath) == False:
		gridPath = None
	
	return (imgPath, gridPath)
