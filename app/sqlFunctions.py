from flask import *
import sqlite3
import config as C
from os.path import isfile
#from extensions import db

DATABASE_PATH = 'database.db'

def dict_factory(cursor, row):
	d = {}
	for idx, col in enumerate(cursor.description):
		d[col[0]] = row[idx]
	return d


def initDatabase():
	import subprocess as sp
	print('No database found at:', DATABASE_PATH)
	print('Running database creation commands\n\n')
	sqlite = 'sqlite3'
	with open('sql/databasecreate.sql', 'r') as f:
		sp.call([sqlite, DATABASE_PATH], stdin=f)
	with open('sql/datastarter.sql', 'r') as f:
		sp.call([sqlite, DATABASE_PATH], stdin=f)
	

if isfile(DATABASE_PATH) == False:
	initDatabase()


conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
conn.row_factory = dict_factory
cursor = conn.cursor()
conn.execute('PRAGMA foreign_keys = ON')
#cursor = db.cursor()

# gets the options for checkboxes
def getOptions():
	cursor.execute('SELECT * FROM optionType')
	return cursor.fetchall()

def getOption(name):
	cursor.execute('SELECT * FROM optionType WHERE name=? LIMIT 1', (name,))
	return cursor.fetchone()

def getOptionExamples(optionType):
	cursor.execute('SELECT * FROM optionExamples WHERE type=?', (optionType,))
	return cursor.fetchall()

# Effects: Runs a MySQL query that returns all images in the database
def getImages(**kwargs):
	selector = ''
	if len(kwargs) > 0:
		selector += 'WHERE '
		params = ['{}=?'.format(p) for p in kwargs.keys()]
		params = ' AND '.join(params) # only ands for now :(
		selector += params
	args = tuple(kwargs.values())
	order = 'uploadDate DESC'
	if C.STUDY_MODE is True:
		order = 'RANDOM()'
	cursor.execute('SELECT * FROM images ' + selector + ' ORDER BY ' + order, args)
	results = cursor.fetchall()
	return results

def getGrids():
	selector = ''
	cursor.execute('SELECT grids.*, images.category FROM grids INNER JOIN images on grids.imgId = images.imgId')
	results = cursor.fetchall()
	return results

# Effects: Runs a MySQL query that returns a specific image in the database
def getImageData(imgId):
	cursor.execute('SELECT * FROM images WHERE imgId=? LIMIT 1', (imgId,))
	results = cursor.fetchone()
	return results

def getControlsFromDb(side):
	cursor.execute('SELECT * FROM images WHERE side=? and category=?', (side, C.imgCategories['control']) )
	results = cursor.fetchall()
	return results


def getGridData(imgId):
		cursor.execute('SELECT * FROM grids WHERE imgId=? LIMIT 1', (imgId,))
		results = cursor.fetchone()
		return results

# TODO: TODO: TODO:
# FIX/CLEAN ALL THIS

# Sqlite bools are stored as 1 = True, 0 = False
def getAllGradesFromUser(userId, imgId):
	cursor.execute('SELECT * FROM gradeFiles WHERE userId=? AND imgId=? ORDER BY gradeId ASC', 
		(userId, imgId))
	results = cursor.fetchall()
	return results

def getUnfinishedGradesFromUser(userId, imgId):
	optional = ' AND finishedGrading=0'
	cursor.execute('SELECT * FROM gradeFiles WHERE userId=? AND imgId=? AND finishedGrading=0 ORDER BY gradeId ASC', 
		(userId, imgId))
	results = cursor.fetchall()
	return results

def getCurrentImages(userId):
	# get all the images that a user is currently grading
	#cursor.execute('SELECT DISTINCT * FROM gradeFiles WHERE userId=? AND finishedGrading=0', (userId,))
	q = 'SELECT gradeFiles.*, images.* FROM gradeFiles INNER JOIN images on gradeFiles.imgId=images.imgId WHERE userId=? AND finishedGrading=0 GROUP BY images.imgId'
	cursor.execute(q, (userId,))
	return cursor.fetchall()

def getGradesFromId(gradeId):
	cursor.execute('SELECT * FROM gradeFiles where gradeId=? LIMIT 1', (gradeId,))
	results = cursor.fetchone()
	return results

def getGradeInfo(imgId, user, sid):
	cursor.execute('SELECT * FROM gradeFiles where imgId=? AND userId=? AND sessionId=? LIMIT 1', (imgId, user, sid))
	results = cursor.fetchone()
	return results

def dictionaryToQuery(**kwargs):
	
	# Creates data for sqlite query from a dictionary (kwargs)
	# returns
	# searchConditions: a list formatted for sqlite escaping. ie. [imgId=?, sessionId=?]
	# searchVals = a list of values that corresponds to the placeholders in the query string
	searchConditions = []
	searchVals = []
	for key in kwargs:
		value = kwargs[key]
		if isinstance(value, list):
			for el in value:
				searchConditions.append(str(key) + '=?')
				searchVals.append(el)
		else:
			searchConditions.append(str(key) + '=?')
			searchVals.append(value)

	return searchConditions, searchVals
			

def getGradeInfoAnd(selectCols=['*'], **kwargs):
	# allows for a chained AND query into gradeFiles table
	# selectCols = list of columns to select
	query = 'SELECT ' + ','.join(selectCols) + ' FROM gradeFiles'
	searchConditions, values = dictionaryToQuery(**kwargs)
	searchConditions = ' AND '.join(searchConditions)
	if len(values) > 0:
		query += ' WHERE ' + searchConditions

	print('sql.getGradeInfoAnd:', kwargs, query, values)
	
	cursor.execute(query, tuple(values))
	return cursor.fetchall()


def getGradeInfoForImage(imgId, excludeFinished=None):
	optional = ''
	if excludeFinished == True:
		optional = ' AND finishedGrading!=1 '
	cursor.execute('SELECT * FROM gradeFiles where imgId=?' + optional, (imgId,))
	results = cursor.fetchall()
	return results

def getGradeFilesFromImgId(imgId):
	cursor.execute('SELECT gradeFile FROM gradeFiles where imgId=?', (imgId,))
	results = cursor.fetchall()
	return results

def getFinishedGrades(imgId):
	cursor.execute('SELECT * FROM gradeFiles where imgId=? AND finishedGrading=1', (imgId,))
	#cursor.execute('SELECT * FROM gradeFiles where imgId=? GROUP BY userId', (imgId,))
	results = cursor.fetchall()
	return results

# Sqlite bools are stored as 1 = True, 0 = False
# returns the unique graders who have started grading an image, but have not finished
def getCurrentGraders(imgId):
	cursor.execute('SELECT userId FROM gradeFiles where imgId=? and finishedGrading=0 GROUP BY userId', (imgId,))
	results = cursor.fetchall()
	userList = [i['userId'] for i in results]
	return userList

# Effects: Runs a MySQL query that inserts a photo into the photo table
# returns true if successful
def insertImageToDB(inFormat, imgId, refName, side, comments, category):
	cursor.execute('INSERT INTO images (format, imgId, referenceName, side, comments, category)' + 
		'VALUES (?,?,?,?,?,?)', (inFormat, imgId, refName, side, comments, category) )
	conn.commit()
	if (cursor.fetchall()):
		return True
	else:
		return False



def insertGridToDB(gridId, xOffset, yOffset, imgId, scaleRatio, xDisc, yDisc, xFovea, yFovea):
	cursor.execute('INSERT INTO grids (gridId, xOffset, yOffset, imgId, scaleRatio, xDisc, \
				yDisc, xFovea, yFovea) VALUES(?,?,?,?,?,?,?,?,?)', 
				(gridId, xOffset, yOffset, imgId, scaleRatio, xDisc, yDisc, xFovea, yFovea)
	)
	conn.commit()
	if (cursor.fetchall()):
		return True
	else:
		return False


def insertGradeToDB(gradeFile, userId, imgId, cellsG, finished, session):
	cursor.execute('INSERT OR REPLACE INTO gradeFiles (gradeFile, userId, imgId, cellsGraded, ' +
			'finishedGrading, sessionId) VALUES (?,?,?,?,?,?)', (gradeFile, userId, imgId, cellsG, finished, session)
	)
	conn.commit()
	return cursor.lastrowid


def deleteEntry(table, primaryKey, primaryVal):
	cursor.execute('DELETE FROM ' + table + ' WHERE ' + primaryKey + '="' + primaryVal + '"')
	conn.commit()


def updateGradeInDB(gradeId, cellsGraded, finished):
	cursor.execute('UPDATE gradeFiles SET cellsGraded=?, finishedGrading=? WHERE gradeId=?', 
			(cellsGraded, finished, gradeId))
	conn.commit()
	
