from flask import *
from imageProcessing import *
from sqlFunctions import *
from config import *
import hashlib
import os
from os import listdir
from os.path import isfile, join
from PIL import Image


uploads = Blueprint('uploads', __name__, template_folder='templates', static_folder="static")


# Effects: returns a extension name if it is valid
def getExtension(filename):
	ext = filename.rsplit('.', 1)[1]
	if ext in ALLOWED_EXTENSIONS:
		return ext
	else:
		return ''



# Effects: returns filename in the format [username]_[albumname]_[md5(prevString)]
def generateFilename(filename):
	f = hashlib.md5(filename).hexdigest()
	return f



# Requires: request object, type of img upload (patient or normal)
# Effects: Uploads valid file to server and updates database
def uploadImg(request, type):
	form = request.form
	upFolder = ''
	# type
	if type == "normal":
		upFolder = 'UPLOAD_FOLDER_NORM'
		table = "normals"
	elif type == 'patient':
		 upFolder = 'UPLOAD_FOLDER_P'
		 table = "images"

	# check if the post request has the file part
	if 'img' not in request.files:
		flash('No file part')
		print "failed: ", request.files
		return redirect(request.url)
	file = request.files['img']

	fileExt = getExtension(file.filename)

	if file and fileExt: # If file and extension aren't null
		filename = generateFilename(file.filename)
		refName = form['refName']
		eye = form['eye']
		comments = form['comments']
		# save to database
		insertImageToDB(table, fileExt, filename, refName, eye, comments)
		# save to server
		file.save(os.path.join(current_app.config.get(upFolder), filename + '.' + fileExt))
	return filename + '.' + fileExt




@uploads.route('/uploads', methods=['GET', 'POST'])
def upload_route():
	images = []
	isUploaded = False
	type = ''
	folderPath = ''
	imgFilename = ''

	if request.method == 'GET':
		if request.args:
			type = request.args['type']
	# Add or delete album
	if request.method == 'POST':
		form = request.form
		operation = form['op']
		type = form['type']
		
		if operation == 'add':
			imgFilename = uploadImg(request, type)
			isUploaded = True
		elif operation == 'delete':
			deleteImg()

		if type == "normal":
			folderPath = UPLOAD_FOLDER_NORM
			images = getImages("normals")
		elif type == "patient":
			folderPath = UPLOAD_FOLDER_P
			images = getImages("images")

	data = {
		
		"images" : images,
		"type" : type,
		"uploaded" : isUploaded,
		"edit" : False,
		"typePath" : folderPath,
		"normalImgSrc" : UPLOAD_FOLDER_NORM + imgFilename,
		"normalId" : imgFilename.rsplit('.', 1)[0]
	}
	return render_template("uploads.html", **data)


# Requires: FA image and grid images are their proper sizes, name of picture in database,
# img file format, and the percentage offsets created by the user positioning data
# Effects: puts the center of the grid on the specified location of the FA image
def createGriddedImage(originCoords, imgName, iFormat, xPerc, yPerc):
	# Load images
	grid = Image.open(GRID_PATH, 'r')
	faImg = Image.open(UPLOAD_FOLDER_NORM + imgName + iFormat, 'r')
	fa_w, fa_h = faImg.size

	# Calculate where grid goes and paste
	grid_w, grid_h = grid.size
	offset = (originCoords[0] - (grid_w  / 2) , originCoords[1] - (grid_h  / 2))
	rgba = grid.split()
	alpha = rgba[len(rgba)-1]

	croppedGrid = Image.new('RGBA', (fa_w, fa_h))
	croppedGrid.paste(grid, offset, mask=alpha)

	gridId = GRID_PREFIX + imgName + iFormat
	insertGridToDB(gridId, xPerc, yPerc, imgName)
	png_info = grid.info
	croppedGrid.save(UPLOAD_FOLDER_NORM + gridId, **png_info)
	return UPLOAD_FOLDER_NORM + gridId


@uploads.route('/uploads/position', methods=['GET', 'POST'])
def upload_position_route():
	rForm = request.form
	imgName = rForm['picName']
	image = getNormalData(imgName)
	originCoords = [rForm['x'], rForm['y']]
	originCoords = map(int, originCoords)
	print "\n\n\n"
	print image['format']
	print rForm['xPerc']
	print rForm['yPerc']
	print rForm
	print "\n\n\n"
	newImgPath = createGriddedImage(originCoords, imgName, '.' + image['format'], rForm['xPerc'], rForm['yPerc'])
	url = "/uploads"
	data = {'goto' : url}
	return jsonify(**data)

