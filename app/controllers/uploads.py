from flask import *
from imageProcessing import *
from sqlFunctions import *
import hashlib
import os
from os import listdir
from os.path import isfile, join
from PIL import Image
import config

uploads = Blueprint('uploads', __name__)

UPLOAD_FOLDER_P = config.UPLOAD_FOLDER_P
UPLOAD_FOLDER_NORM = config.UPLOAD_FOLDER_NORM
F_UPLOAD_FOLDER_P = config.F_UPLOAD_FOLDER_P
F_UPLOAD_FOLDER_NORM = config.F_UPLOAD_FOLDER_NORM
THUMBNAIL_PATH = config.F_THUMBNAIL_PATH
GRID_PATH = config.GRID_PATH
C_GRID_PATH = config.C_GRID_PATH
GRID_PREFIX = config.GRID_PREFIX


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



# Requires: request object, type of img upload (patient or normal)
# Effects: Uploads valid file to server and updates database
def uploadImg(request, type):
	form = request.form
	upFolder = ''
	# type
	if type == "normal":
		upFolder = F_UPLOAD_FOLDER_NORM
	elif type == 'patient':
		 upFolder = F_UPLOAD_FOLDER_P

	# check if the post request has the file part
	if 'img' not in request.files:
		flash('No file part')
		print "failed: ", request.files
		return redirect(request.url)
	file = request.files['img']
	
	fileExt = getExtension(file.filename)

	if file and fileExt: # If file and extension aren't null
		filename = generateFilename(file.filename)

		side = form['side']
		refName = ''
		comments = ''

		if form['refName']:		
			refName = form['refName']
		if form['comments']:
			comments = form['comments']
		


		# save to database
		insertImageToDB(fileExt, filename, refName, side, comments, type)
		# save to server
		file.save(os.path.join(upFolder, filename + '.' + fileExt))
		
		#
		thumb = Image.open(os.path.join(upFolder, filename + '.' + fileExt))
		thumb.thumbnail((500,500), Image.ANTIALIAS)
		thumb.save(os.path.join(THUMBNAIL_PATH, filename + '.' + fileExt))
		
	return filename + '.' + fileExt




@uploads.route('/uploads', methods=['GET', 'POST'])
def upload_route():
	isUploaded = False
	type = ''
	folderPath = ''
	imgFilename = ''
	form = ''

	if request.method == 'GET':
		if request.args:
			type = request.args['type']
	# Add or delete album
	if request.method == 'POST':
		form = request.form

		if request.files:
			operation = form['op']
			type = form['type']
			if operation == 'add':
				imgFilename = uploadImg(request, type)
				isUploaded = True
				if type == 'patient':
					folderPath = UPLOAD_FOLDER_P
				elif type == 'normal':
					folderPath = UPLOAD_FOLDER_NORM
			elif operation == 'delete':
				deleteImg()


	data = {
		"type" : type,
		"uploaded" : isUploaded,
		"typePath" : folderPath,
		"imgSrc" : folderPath + imgFilename,
		"imgId" : imgFilename.rsplit('.', 1)[0]
	}


	html = render_template("uploads.html", **data)
	return jsonify(html=html)


# Requires: FA image and grid images are their proper sizes, name of picture in database,
# img file format, and the percentage offsets created by the user positioning data
# Effects: puts the center of the grid on the specified location of the FA image, and scales grid
# according to opticDisk <--> fovea position
def createGriddedImage(originCoords, foveaCoords, imgName, iFormat, xPerc, yPerc, type):

	# Load images
	if type == "normal":
		uploadPath = F_UPLOAD_FOLDER_NORM
	else:
		uploadPath = F_UPLOAD_FOLDER_P

	grid = Image.open(GRID_PATH, 'r')
	faImg = Image.open(uploadPath + imgName + iFormat, 'r')
	fa_w, fa_h = faImg.size

	# Scale grid
	# currently arbitrary, but works relative to all uploads
	foveaToDisk = 4.0 #mm
	eyeWidth = 24.0 #mm, typical eye diameter
	percentDist = (foveaToDisk / eyeWidth) * .35
	# distance = fov - disk = 16% of grid
	distance = abs(originCoords[0] - foveaCoords[0])
	gridWidth = distance / percentDist
	gridHeight = (gridWidth / grid.size[0]) * grid.size[1]
	gridHeight = int(gridHeight)
	gridWidth = int(gridWidth)
	scaleRatio = gridWidth / float(grid.size[0])
	grid = grid.resize((gridWidth, gridHeight), Image.ANTIALIAS)

	

	# Calculate where grid goes and paste
	grid_w, grid_h = grid.size
	offset = (originCoords[0] - (grid_w  / 2), originCoords[1] - (grid_h  / 2))
	rgba = grid.split()
	alpha = rgba[len(rgba)-1]

	croppedGrid = Image.new('RGBA', (fa_w, fa_h))
	croppedGrid.paste(grid, offset, mask=alpha)

	gridId = GRID_PREFIX + imgName + iFormat
	xPerc = offset[0] / float(fa_w)
	yPerc = offset[1] / float(fa_h)
	insertGridToDB(gridId, xPerc, yPerc, imgName, scaleRatio, originCoords[0], originCoords[1], 
		foveaCoords[0], foveaCoords[1])
	png_info = grid.info
	croppedGrid.save(uploadPath + gridId, **png_info)


	# save version of grid for OpenCV contours
	#contourGrid = Image.new('RGB', faImg.size, (255,255,255))
	#contourGrid.paste(grid, offset, grid)
	#contourGrid = contourGrid.convert('L') # convert to grayscale
	#contourGrid = contourGrid.point(lambda x: 0 if x<200 else 255, '1') #convert to black and white
	#contourGrid.save(C_GRID_PATH, "JPEG")
	return uploadPath + gridId


@uploads.route('/uploads/position', methods=['GET', 'POST'])
def upload_position_route():
	rForm = request.form
	imgName = rForm['picName']
	image = getImageData(imgName)
	originCoords = [rForm['x'], rForm['y']]
	originCoords = map(int, originCoords)
	foveaCoords = map(int, [rForm['foveaX'], rForm['foveaY']])

	newImgPath = createGriddedImage(originCoords, foveaCoords, imgName, '.' + image['format'], 
		rForm['xPerc'], rForm['yPerc'], rForm['type'])
	url = url_for('uploads.upload_route')
	data = {'goto' : url}
	return jsonify(**data)

