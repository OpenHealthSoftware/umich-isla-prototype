from flask import *
import sqlite3
#from extensions import db
	
conn = sqlite3.connect('database.db', check_same_thread=False)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()
conn.execute("PRAGMA foreign_keys = ON")
#cursor = db.cursor()



# Effects: Runs a MySQL query that returns all images in the database
def getImages(type):
	cursor.execute("SELECT * FROM images WHERE type=\'" + type + "\' ORDER BY imgId DESC")
	results = cursor.fetchall()
	return results


# Effects: Runs a MySQL query that returns a specific image in the database
def getImageData(imgId):
	cursor.execute("SELECT * FROM images WHERE imgId=\'" + imgId + "\' LIMIT 1")
	results = cursor.fetchone()
	return results

def getControlsFromDb(eye):
	cursor.execute("SELECT * FROM images WHERE eye=? and type='normal'", (eye,) )
	results = cursor.fetchall()
	return results


def getGridData(imgId):
		cursor.execute("SELECT * FROM grids WHERE imgId=? LIMIT 1", (imgId,))
		results = cursor.fetchone()
		return results

def getGradesFromUser(userId, imgId):
	cursor.execute("SELECT * FROM grades WHERE userId=? AND imgId=? ORDER BY gradeId ASC", 
		(userId, imgId))
	results = cursor.fetchall()
	return results

def getGradesFromId(gradeId):
	cursor.execute("SELECT * FROM grades where gradeId=? LIMIT 1", (gradeId,))
	results = cursor.fetchone()
	return results

# Effects: Runs a MySQL query that inserts a photo into the photo table
# returns true if successful
def insertImageToDB(inFormat, imgId, refName, eye, comments, type):
	cursor.execute("INSERT INTO images (format, imgId, referenceName, eye, comments, type)" + 
		"VALUES (?,?,?,?,?,?)", (inFormat, imgId, refName, eye, comments, type) )
	conn.commit()
	if (cursor.fetchall()):
		return True
	else:
		return False



def insertGridToDB(gridId, xOffsetPerc, yOffsetPerc, imgId, scaleRatio, xDisc, yDisc, xFovea, yFovea):
	cursor.execute("INSERT INTO grids (gridId, xOffsetPerc, yOffsetPerc, imgId, scaleRatio, xDisc, \
				yDisc, xFovea, yFovea) VALUES(?,?,?,?,?,?,?,?,?)", 
				(gridId, xOffsetPerc, yOffsetPerc, imgId, scaleRatio, xDisc, yDisc, xFovea, yFovea)
	)
	conn.commit()
	if (cursor.fetchall()):
		return True
	else:
		return False


def insertGradeToDB(gradeFile, userId, imgId, cellsG, finished, session):
	cursor.execute("INSERT OR REPLACE INTO grades (gradeFile, userId, imgId, cellsGraded, " +
			"finishedGrading, sessionId) VALUES (?,?,?,?,?,?)", (gradeFile, userId, imgId, cellsG, finished, session)
	)
	conn.commit()
	return cursor.lastrowid


def deleteEntry(table, primaryKey, primaryVal):
	cursor.execute("DELETE FROM " + table + " WHERE " + primaryKey + "=" + primaryVal);
	conn.commit()


def updateGradeInDB(gradeId, cellsGraded, finished):
	cursor.execute("UPDATE grades SET cellsGraded=?, finishedGrading=? WHERE gradeId=?", 
			(cellsGraded, finished, gradeId))
	conn.commit()
	