from flask import *
import sqlite3
#from extensions import db
	
conn = sqlite3.connect('database.db', check_same_thread=False)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()
#cursor = db.cursor()


# Effects: Runs a MySQL query that returns all images in the database
def getImages():
	cursor.execute("SELECT * FROM images ORDER BY imgId DESC")
	results = cursor.fetchall()
	print "\n\nResults: ", results
	return results

# Effects: Runs a MySQL query that returns a specific image in the database
def getImageData(imgId):
	cursor.execute("SELECT * FROM images WHERE imgId=\'" + imgId + "\' LIMIT 1")
	results = cursor.fetchone()
	return results


# Effects: Runs a MySQL query that inserts a photo into the photo table
# returns true if successful
def insertImageToDB(format, imgId):
	cursor.execute("INSERT INTO images (format, imgId) VALUES (\'" \
		+ format + "\', \'" + imgId + "\')")
	conn.commit()
	if (cursor.fetchall()):
		return True
	else:
		return False






# Effects: Runs a MySQL query that returns albums associated with a given username
# If getThumbnail is true, the filename of the most recent uploaded picture in the 
# album will be added to the results
def getAlbums(username, getThumbnail):
	cursor.execute("SELECT * FROM album WHERE username=\'" + username + "\'")
	results = cursor.fetchall()

	if getThumbnail == True:
		for i in results:
			albumid = i['albumid']
			cursor.execute("SELECT filename, format FROM photo WHERE albumid="\
				 + str(albumid) + " ORDER BY picid DESC LIMIT 1")
			img = cursor.fetchone()
			if img:
				i['imgName'] = img['filename'] + "." + img['format']
			else: # no images in album, use placeholder
				i['imgName'] = "photo-album-icon.png"
	return results



# Effects: Runs a MySQL query that returns album associated with a given albumid
def getAlbum(albumid):
	cursor.execute("SELECT * FROM album WHERE albumid=" + albumid + " LIMIT 1")
	results = cursor.fetchone()
	return results







# Effects: Runs a MySQL query that deletes a photo in the photo table
# returns true if successful
def deletePhoto(picid):
	cursor.execute("DELETE FROM photo WHERE picid=" + picid)
	if (cursor.fetchall()):
		return True
	else:
		return False