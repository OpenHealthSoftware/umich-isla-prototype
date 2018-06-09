# useful global data

import config
from flask import request
import sqlFunctions as sql
import os
from os.path import isfile


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
	gridPath = os.path.join(basePath, config.GRID_PREFIX + imgId + config.GRID_FORMAT)

	if isfile(imgPath) == False:
		imgPath = None
	if isfile(gridPath) == False:
		gridPath = None
	
	return (imgPath, gridPath)


# Effects: returns the related file paths for a given image id
def getFilePathsForImage(imgId):
	paths = {}
	imgData = getImageData(imgId)
	baseImgFilename = imgId + '.' + imgData['format']
	if imgData['category'] == C.imgCategories['control']:
		paths['img'] = os.path.join(C.FILE_PATHS['control'], baseImgFilename)
	elif imgData['category'] == C.imgCategories['patient']:
		paths['img'] = os.path.join(C.FILE_PATHS['patient'], baseImgFilename)
		paths['grid'] = os.path.join(C.FILE_PATHS['patient'], C.GRID_PREFIX + baseImgFilename)
		gradeFiles = getGradeFilesFromImgId(imgId) #sql returns list of tuples
		grades = [os.path.join(C.FILE_PATHS['grades'], i[0]) for i in gradeFiles]
		paths['grades'] = grades
	paths['thumbnail'] = os.path.join(THUMBNAIL_PATH, baseImgFilename)
	return paths


def deleteImg(imgId):

	paths = getFilePathsForImage(imgId)
	sql.deleteEntry('grids', 'imgId', imgId) #TODO: cascade doesnt seem to be working properly
	sql.deleteEntry('gradeFiles', 'imgId', imgId)
	sql.deleteEntry('images', 'imgId', imgId)

	for pathType in paths:
		entry = paths[pathType]
		if isinstance(entry, list):
			for i in entry:
				try:
					os.remove(i)
				except:
					print('Couldn\'t delete file', i)
		else:
			try:
				os.remove(entry)
			except:
				print('Couldn\'t delete file', entry)
	return 0