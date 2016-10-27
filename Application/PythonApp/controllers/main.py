from flask import *
from flask_mysqldb import MySQL
import MySQLdb
from extensions import db
import imageProcessing
from sqlFunctions import *
import config
import hashlib
import os

main = Blueprint('main', __name__, template_folder='templates', static_folder="static")


# Effects: returns a extension name if it is valid
def getExtension(filename):
	ext = filename.rsplit('.', 1)[1]
	if ext in config.ALLOWED_EXTENSIONS:
		return ext
	else:
		return ''



# Effects: returns filename in the format [username]_[albumname]_[md5(prevString)]
def generateFilename(filename):
	f = hashlib.md5(filename).hexdigest()
	return f



# Requires: request object
# Effects: Uploads valid file to server and updates database
def uploadPic(request):
	# check if the post request has the file part
	if 'img' not in request.files:
		flash('No file part')
		print "failed: ", request.files
		return redirect(request.url)
	file = request.files['img']
	
	fileExt = getExtension(file.filename)

	if file and fileExt: # If file and extension aren't null
		filename = generateFilename(file.filename)
		print "Filename: ", filename
		file.save(os.path.join(current_app.config.get('UPLOAD_FOLDER'), filename + '.' + fileExt))
		insertImageToDB(fileExt, filename)
	return



@main.route('/', methods=['GET', 'POST'])
def main_route():

	# Add or delete album
	if request.method == 'POST':
		data = request.form
		operation = data['op']
		
		if operation == 'add':
			uploadPic(request)

	data = {
		"images" : getImages()
	}
	return render_template("index.html", **data)