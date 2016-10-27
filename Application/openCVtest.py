#!/usr/bin/python2
import numpy as np
import cv2

im = cv2.imread('fullgrid2.png')
imgray = cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
ret,thresh = cv2.threshold(imgray,127,255,0)
image, contours, hierarchy = cv2.findContours(thresh,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE)

cnt = contours[4]
im = cv2.drawContours(im, contours, -1, (0,255,0), 3)
coordList = list()

# Effects: parses the contours object into an array of coordinate strings for each cell
def getCoordinateString():
	cellCoordStr = ''
	for cell in contours:
		#print "\n\nNew:"
		for coordArray in cell:
			for coords in coordArray: # looks like [[x y]] ie coordArray[0] == [x y]
				strList = map(str, coords)
				cellCoordStr += ','.join(strList) + ","

		cellCoordStr = cellCoordStr[:-1] #remove last comma
		coordList.append(cellCoordStr)
		cellCoordStr = ''

getCoordinateString()
coordList.reverse()


#cv2.imshow("hello", im)

#while True:
#	key = cv2.waitKey(1)
#	if key == 27: break