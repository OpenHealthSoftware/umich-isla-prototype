import numpy as np
import cv2
import os
import grid
import config as C



# Requires: path to the image to be processed
# Effects: finds contours of an image using OpenCV, returns list of coordinates
def processImageGrid(imgRelPath):
	imgPath = imgRelPath #os.path.dirname(os.path.abspath(__file__)) + '/' + imgRelPath
	im = cv2.imread(imgPath)
	imgray = cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
	ret,thresh = cv2.threshold(imgray,127,255,0)
	image, contours, hierarchy = cv2.findContours(thresh,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE)

	#cnt = contours[4]
	im = cv2.drawContours(im, contours, -1, (0,255,0), 3)

	return getCoordinateList(contours)


# Requires: OpenCV contour object
# Effects: parses the contours object into an 2d list of x,y coordinates
# eg: [	cell1[x1,y1,x2,y2,...], cell2[], ]
def getCoordinateList(contours):
	coordList = []
	# Loop through the nested arrays
	for npCell in contours:
		cellCoords = []
		for coord in npCell:
			
			cellCoords += coord[0].tolist()

		coordList.append(cellCoords)

	coordList.reverse()
	return coordList



# TODO:
# store coords to var or file

# import subprocess as sp
# grid.generateGrid(40, 80, 9, outputFile='grid.svg')
# sp.check_output(['inkscape', '-z', '--export-dpi', '300', '-e', C.FILE_PATHS['grid']['display'], 'grid.svg'])
# sp.check_output(['convert',  C.FILE_PATHS['grid']['display'], '-alpha', 'remove', '-threshold', '99%', '-interpolate', 'nearest', '-set', 'colorspace', 'Gray', '-separate', '-average', C.FILE_PATHS['grid']['analysis']])
