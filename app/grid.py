from math import sqrt, pi
import math

"""
Module for generating an equal area polar grid
"""

def generateCellCount(N, p):

	"""
	Makes a list of counts for total number of cells in the grid at each ring level, i.e. cellsPerRing[i]
	based on:
	https://www.sciencedirect.com/science/article/pii/S0925772112000296
	"""

	#a = pi / p
	cellsPerRing = [0, 1]
	for i in range(2, N+2):
		n_i = sqrt(cellsPerRing[i-1])
		cellsSq = p + n_i**2 + 2 * n_i * sqrt(p)
		cellsPerRing.append(int(cellsSq))

	return cellsPerRing


def polarToCartesian(centerX, centerY, radius, angleInDegrees):
	angleInRadians = math.radians(angleInDegrees)

	return {
		'x': centerX + (radius * math.cos(angleInRadians)),
		'y': centerY + (radius * math.sin(angleInRadians))
	}


def describeArc(x, y, radius, startAngle, endAngle):
	"""
	thanks to Ahtenus - https://stackoverflow.com/a/24569190
	"""
	start = polarToCartesian(x, y, radius, endAngle)
	end = polarToCartesian(x, y, radius, startAngle)

	arcSweep = None
	if endAngle - startAngle <= 180:
		arcSweep = 0
	else:
		arcSweep = 1
	
	d = [
		'M', start['x'], start['y'],
		'A', radius, radius, 0, arcSweep, 0, end['x'], end['y']
	]
	d = [str(i) for i in d]
	
	return {
		'start': str(start['x']) + ',' + str(start['y']),
		'end': str(end['x']) + ',' + str(end['y']),
		'str': ' '.join(d)
	}


def genSlicePath(cx, cy, innerRadius, outerRadius, startAngle, endAngle):
	"""
	Creates the path for a chunk of a tube/ring.
	returns the d attribute for a svg path
	"""
	path = ""
	innerArc = describeArc(cx, cy, innerRadius, startAngle, endAngle)
	outerArc = describeArc(cx, cy, outerRadius, startAngle, endAngle)


	path += innerArc['str']
	# cursor is now at innerArc['end']
	path += ' L ' + outerArc['end'] # outarc.end.x,outarc.end.y
	path += ' ' + outerArc['str']
	path += ' M ' + outerArc['start']
	path += ' L ' + innerArc['start']

	return path



def generateRing(cx, cy, r1, r2, numCells):
	"""
	Creates all the svg paths needs to define the cells in two concentric circles
	returns list of svg paths
	"""

	t_svg_path = """<path d="{}" stroke="green" stroke-width="3" stroke-linecap="square" fill="none"></path>"""
	
	paths = []

	sliceAngle = 360 / numCells
	startAngle = 0
	while startAngle < 360:

		endAngle = startAngle + sliceAngle
		if endAngle >= 360:
			endAngle = 0

		d = genSlicePath(cx, cy, r1, r2, startAngle, endAngle)
		p = t_svg_path.format(d)
		startAngle += sliceAngle
		paths.append(p)

	return paths




def generateGrid(startRadius, deltaRadius, numberOfRings, outputFile=None):


	totalCellsAtRing = generateCellCount(numberOfRings-1,4)

	allPaths = ""
	deltaR = deltaRadius
	x = numberOfRings * deltaR + startRadius
	y = x

	for i in range(1, len(totalCellsAtRing)-1):
		r1 = startRadius + (i-1) * deltaR
		r2 = startRadius + (i) * deltaR

		if r1 == 0 or r2 == 0:
			continue

		numCells = totalCellsAtRing[i+1] - totalCellsAtRing[i]
		pathList =  generateRing(x,y,r1,r2,numCells)
		allPaths += '\n'.join(pathList)

	svg = """
	<svg width="{}" height="{}">
		{}
	</svg>
	"""
	width = numberOfRings * deltaR * 2 + startRadius * 2
	full_svg = svg.format(width, width, allPaths)

	if outputFile:
		with open(outputFile, 'w') as f:
			f.write(full_svg)
	return full_svg


if __name__ == '__main__':
	# run example
	generateGrid(40,80,3, outputFile='grid.svg')
