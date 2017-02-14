import numpy as np
import cv2
import os




# Requires: path to the image to be processed
# Effects: finds contours of an image using OpenCV, returns list of coordinates
def processImageGrid(imgRelPath):
	imgPath = imgRelPath #os.path.dirname(os.path.abspath(__file__)) + '/' + imgRelPath
	print "\n\n", imgPath, "\n\n"
	im = cv2.imread(imgPath)
	imgray = cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
	ret,thresh = cv2.threshold(imgray,127,255,0)
	image, contours, hierarchy = cv2.findContours(thresh,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE)

	#cnt = contours[4]
	im = cv2.drawContours(im, contours, -1, (0,255,0), 3)

	coordList = getCoordinateStrings(contours)
	return coordList


# Requires: OpenCV contour object
# Effects: parses the contours object into an array of coordinate strings for each cell
def getCoordinateStrings(contours):
	coordList = list()
	cellCoordStr = ''

	# Loop through the nested arrays
	for cell in contours:
		for coordArray in cell:
			for coords in coordArray: # looks like [[x y]] ie coordArray[0] == [x y]
				strList = map(str, coords)
				cellCoordStr += ','.join(strList) + ","

		cellCoordStr = cellCoordStr[:-1] #remove last comma
		coordList.append(cellCoordStr)
		cellCoordStr = ''

	coordList.reverse()
	return coordList