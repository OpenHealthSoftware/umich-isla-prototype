from flask import *
from gridProcessing import *
from sqlFunctions import *
import hashlib
import os
from os import listdir
from os.path import isfile, join
from PIL import Image
import config as C
import math
import uuid
import util

uploads = Blueprint('uploads', __name__)


THUMBNAIL_PATH = C.FILE_PATHS['thumbnails']


# Effects: returns a extension name if it is valid
def getExtension(filename):
	ext = filename.rsplit('.', 1)[1]
	if ext.lower() in C.ALLOWED_EXTENSIONS:
		return ext
	else:
		return ''



# Effects: returns filename in the format [username]_[albumname]_[md5(prevString)]
#TODO: doesnt do effects above?
def generateFilename(filename):
	return str(uuid.uuid4())

# TODO: move more appropriate
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
	
# Requires: request object, type of img upload (patient or normal)
# Effects: Uploads valid file to server and updates database
def uploadImg(request, category):
	form = request.form
	upFolder = ''
	# type
	if category == C.imgCategories['control']:
		upFolder = C.FILE_PATHS['control']
	elif category == C.imgCategories['patient']:
		 upFolder = C.FILE_PATHS['patient']

	# check if the post request has the file part
	if 'img' not in request.files:
		flash('No file part')
		print('failed: ', request.files)
		return redirect(request.url)
	fileObj = request.files['img']
	
	fileExt = getExtension(fileObj.filename)

	if fileObj and fileExt: # If file and extension aren't null
		filename = generateFilename(fileObj.filename)

		side = form['side']
		refName = ''
		comments = ''

		if form['refName']:		
			refName = form['refName']
		if form['comments']:
			comments = form['comments']
		


		# save to database
		insertImageToDB(fileExt, filename, refName, side, comments, category)
		# save to server
		filepath = os.path.join(upFolder, filename + '.' + fileExt)
		fileObj.save(filepath)
		
		# make thumbnail
		thumb = Image.open(os.path.join(upFolder, filename + '.' + fileExt))
		thumb.thumbnail((500,500), Image.ANTIALIAS)
		thumb.save(os.path.join(THUMBNAIL_PATH, filename + '.' + fileExt))
		print('Successful image upload:', filename, category)
	return filepath, filename


def deleteImg(imgId):

	paths = getFilePathsForImage(imgId)
	deleteEntry('grids', 'imgId', imgId) #TODO: cascade doesnt seem to be working properly
	deleteEntry('gradeFiles', 'imgId', imgId)
	deleteEntry('images', 'imgId', imgId)

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



@uploads.route('/uploads', methods=['GET', 'POST'])
def main_route():


	isUploaded = False
	category = ''
	folderPath = ''
	imgPath = ''
	imgId = ''
	form = None
	
	if request.method == 'GET':
		if request.args:
			category = request.args['category']
	# Add or delete album
	if request.method == 'POST':
		form = request.form
		
		if request.files:
			operation = form['op']
			category = form['category']
			if operation == 'add':
				isUploaded = True
				try:
					imgPath, imgId = uploadImg(request, category)
				except IOError as e:
					isUploaded = False
					print(e)
					print('Error uploading file of category', category)

				if category == C.imgCategories['patient']:
					folderPath = C.FILE_PATHS['patient']
				elif category == C.imgCategories['control']:
					folderPath = C.FILE_PATHS['control']
		elif 'op' in form and form['op'] == 'delete':
			deleteImg(form['imgId'])
			return redirect(url_for('gradeView.main_route'))
			


	data = {
		'category' : category,
		'uploaded' : isUploaded,
		'imgSrc' : imgPath,
		'imgId' : imgId
	}


	return render_template('uploads.html', **data)


# Requires: PIL image, two coordinates
# Effects: calculates angle between vectors, rotates image around orginCoords
# returns rotated image
# fovea coords should be close to center (optos images are centered on fovea)
def rotateImage(img, foveaCoords, discCoords):
	# get angle between vectors
	# rotate image -angle
	print(foveaCoords, discCoords)
	angle = math.atan2(discCoords[1] - foveaCoords[1], discCoords[0] - foveaCoords[0])
	degr = math.degrees(angle)
	if discCoords[0] < foveaCoords[0]:
		degr += 180
	# since PIL.Image.rotate will rotate around center of image,
	# we need to put our rotation origin point at the center of the image,
	# rotate, then crop the image back to normal size

	imgW, imgH = img.size
	pixFromCenterX = int(foveaCoords[0] - (imgW / 2))
	pixFromCenterY = int(foveaCoords[1] - (imgH / 2))
	paddedImgWidth = abs(pixFromCenterX) + imgW
	paddedImgHeight = abs(pixFromCenterY) + imgH

	pasteX = 0
	pasteY = 0
	if pixFromCenterX < 0:
		pasteX += abs(pixFromCenterX)
	if pixFromCenterY < 0:
		pasteY += abs(pixFromCenterY)

	rgba = img.split()
	padImg = Image.new('RGB', (paddedImgWidth, paddedImgHeight))
	padImg.paste(img, (pasteX, pasteY))

	padImg = padImg.rotate(degr)

	finalImg = padImg.crop((pasteX, pasteY, imgW+pasteX, imgH+pasteY))
	return finalImg, degr


# Requires: FA image and grid images are their proper sizes, name of picture in database,
# img file format, and the percentage offsets created by the user positioning data
# Effects: puts the center of the grid on the specified location of the FA image, and scales grid
# according to opticDisk <--> fovea position
def createGriddedImage(foveaCoords, discCoords, imgId, category, insertToDB=True):

	# Determine save path
	if category == C.imgCategories['control']:
		uploadPath = C.FILE_PATHS['control']
	else:
		uploadPath = C.FILE_PATHS['patient']

	filepath = util.getImagePath(imgId)[0]
	faImg = Image.open(filepath)
	fa_w, fa_h = faImg.size
	grid = Image.open(C.FILE_PATHS['grid']['display'], 'r')

	# Scale grid
	# currently arbitrary, but works relative to all uploads
	foveaToDisk = 4.0 #mm
	eyeWidth = 24.0 #mm, typical eye diameter
	percentDist = (foveaToDisk / eyeWidth) * .57

	distance = abs(foveaCoords[0] - discCoords[0])
	gridWidth = distance / percentDist
	gridHeight = (gridWidth / grid.size[0]) * grid.size[1]
	gridHeight = int(gridHeight)
	gridWidth = int(gridWidth)
	scaleRatio = gridWidth / float(grid.size[0])

	grid = grid.resize((gridWidth, gridHeight), Image.ANTIALIAS)
	
	
	# Calculate where grid goes and paste
	offset = (int(foveaCoords[0] - (gridWidth / 2)), int(foveaCoords[1] - (gridHeight  / 2)))
	# ^^ offsetting the scaled grid, so using gridWidth and gridHeight
	rgba = grid.split()
	alpha = rgba[len(rgba)-1]

	croppedGrid = Image.new('RGBA', (fa_w, fa_h))
	croppedGrid.paste(grid, offset, mask=alpha)

	gridId = C.GRID_PREFIX + imgId + C.GRID_FORMAT
	if insertToDB == True:
		insertGridToDB(gridId, offset[0], offset[1], imgId, scaleRatio, discCoords[0], 
			discCoords[1], foveaCoords[0], foveaCoords[1])
	png_info = grid.info
	croppedGrid.save(os.path.join(uploadPath, gridId), **png_info)

	print('Success processing image and grid:', gridId, 'scaleRatio=', scaleRatio)

	# save version of grid for OpenCV contours
	#contourGrid = Image.new('RGB', faImg.size, (255,255,255))
	#contourGrid.paste(grid, offset, grid)
	#contourGrid = contourGrid.convert('L') # convert to grayscale
	#contourGrid = contourGrid.point(lambda x: 0 if x<200 else 255, '1') #convert to black and white
	#contourGrid.save(C_GRID_PATH, 'JPEG')
	return os.path.join(uploadPath, gridId)


@uploads.route('/uploads/position', methods=['GET', 'POST'])
def upload_position_route():
	rForm = request.form
	imgId = rForm['picName']
	image = getImageData(imgId)
	foveaCoords = [rForm['foveaX'], rForm['foveaY']]
	foveaCoords = list(map(int, foveaCoords))
	discCoords = list(map(int, [rForm['discX'], rForm['discY']]))

	#TODO: reduce database calls / img opens

	filepath = util.getImagePath(imgId)[0]
	faImg = Image.open(filepath)
	faImg, degrees = rotateImage(faImg, foveaCoords, discCoords)
	faImg.save(filepath)

	newImgPath = createGriddedImage(foveaCoords, discCoords, imgId, rForm['category'])

	return jsonify({'success': 'sucess'})

