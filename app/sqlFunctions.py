from flask import *
import sqlite3
#from extensions import db

def dict_factory(cursor, row):
	d = {}
	for idx, col in enumerate(cursor.description):
		d[col[0]] = row[idx]
	return d
	
conn = sqlite3.connect('database.db', check_same_thread=False)
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
def getImages(type):
	cursor.execute('SELECT * FROM images WHERE type=? ORDER BY uploadDate DESC', (type,))
	results = cursor.fetchall()
	return results


# Effects: Runs a MySQL query that returns a specific image in the database
def getImageData(imgId):
	cursor.execute('SELECT * FROM images WHERE imgId=? LIMIT 1', (imgId,))
	results = cursor.fetchone()
	return results

def getControlsFromDb(side):
	cursor.execute('SELECT * FROM images WHERE side=? and type="normal"', (side,) )
	results = cursor.fetchall()
	return results


def getGridData(imgId):
		cursor.execute('SELECT * FROM grids WHERE imgId=? LIMIT 1', (imgId,))
		results = cursor.fetchone()
		return results

def getGradesFromUser(userId, imgId):
	cursor.execute('SELECT * FROM grades WHERE userId=? AND imgId=? AND finishedGrading="false" ORDER BY gradeId ASC', 
		(userId, imgId))
	results = cursor.fetchall()
	return results

def getGradesFromId(gradeId):
	cursor.execute('SELECT * FROM grades where gradeId=? LIMIT 1', (gradeId,))
	results = cursor.fetchone()
	return results

def getGradeFilesFromImgId(imgId):
	cursor.execute('SELECT gradeFile FROM grades where imgId=?', (imgId,))
	results = cursor.fetchall()
	return results

def getFinishedGrades(imgId):
	cursor.execute('SELECT * FROM grades where imgId=? AND finishedGrading="true"', (imgId,))
	#cursor.execute('SELECT * FROM grades where imgId=? GROUP BY userId', (imgId,))
	results = cursor.fetchall()
	return results


# returns the unique graders who have started grading an image, but have not finished
def getCurrentGraders(imgId):
	cursor.execute('SELECT userId FROM grades where imgId=? and finishedGrading="false" GROUP BY userId', (imgId,))
	results = cursor.fetchall()
	userList = [i['userId'] for i in results]
	return userList

# Effects: Runs a MySQL query that inserts a photo into the photo table
# returns true if successful
def insertImageToDB(inFormat, imgId, refName, side, comments, type):
	cursor.execute('INSERT INTO images (format, imgId, referenceName, side, comments, type)' + 
		'VALUES (?,?,?,?,?,?)', (inFormat, imgId, refName, side, comments, type) )
	conn.commit()
	if (cursor.fetchall()):
		return True
	else:
		return False



def insertGridToDB(gridId, xOffsetPerc, yOffsetPerc, imgId, scaleRatio, xDisc, yDisc, xFovea, yFovea):
	cursor.execute('INSERT INTO grids (gridId, xOffsetPerc, yOffsetPerc, imgId, scaleRatio, xDisc, \
				yDisc, xFovea, yFovea) VALUES(?,?,?,?,?,?,?,?,?)', 
				(gridId, xOffsetPerc, yOffsetPerc, imgId, scaleRatio, xDisc, yDisc, xFovea, yFovea)
	)
	conn.commit()
	if (cursor.fetchall()):
		return True
	else:
		return False


def insertGradeToDB(gradeFile, userId, imgId, cellsG, finished, session):
	cursor.execute('INSERT OR REPLACE INTO grades (gradeFile, userId, imgId, cellsGraded, ' +
			'finishedGrading, sessionId) VALUES (?,?,?,?,?,?)', (gradeFile, userId, imgId, cellsG, finished, session)
	)
	conn.commit()
	return cursor.lastrowid


def deleteEntry(table, primaryKey, primaryVal):
	cursor.execute('DELETE FROM ' + table + ' WHERE ' + primaryKey + '="' + primaryVal + '"')
	conn.commit()


def updateGradeInDB(gradeId, cellsGraded, finished):
	cursor.execute('UPDATE grades SET cellsGraded=?, finishedGrading=? WHERE gradeId=?', 
			(cellsGraded, finished, gradeId))
	conn.commit()
	
