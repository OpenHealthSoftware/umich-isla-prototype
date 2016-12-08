from flask import *
import sqlite3
#from extensions import db
	
conn = sqlite3.connect('database.db', check_same_thread=False)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()
#cursor = db.cursor()



# Effects: Runs a MySQL query that returns all images in the database
def getImages(type):
	cursor.execute("SELECT * FROM images WHERE type=\'" + type + "\' ORDER BY imgId DESC")
	results = cursor.fetchall()
	print "\n\nResults: ", results
	return results


# Effects: Runs a MySQL query that returns a specific image in the database
def getImageData(imgId):
	cursor.execute("SELECT * FROM images WHERE imgId=\'" + imgId + "\' LIMIT 1")
	results = cursor.fetchone()
	return results

def getControls(eye):
	cursor.execute("SELECT * FROM images WHERE eye=? and type='normal'", (eye,) )
	results = cursor.fetchall()
	return results


def getGridData(imgId):
		cursor.execute("SELECT * FROM grids WHERE imgId=? LIMIT 1", (imgId,))
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



def insertGridToDB(gridId, xOffset, yOffset, imgId):
	cursor.execute("INSERT INTO grids (gridId, xOffset, yOffset, imgId) VALUES(?,?,?,?)",
				(gridId, xOffset, yOffset, imgId)
	)
	conn.commit()
	if (cursor.fetchall()):
		return True
	else:
		return False


def deleteEntry(table, primaryKey, primaryVal):
	cursor.execute("DELETE FROM " + table + " WHERE " + primaryKey + "=" + primaryVal);
	conn.commit()