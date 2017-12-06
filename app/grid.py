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



def generateCellPoints(cellsPerRing, radius, deltaRadius):
	"""
	Generates the coordinates on the perimeter of a ring that
	which are the ending point of where the ring is divided

	eg. two coordinate pairs from here defined the the outer arc of 1 cell
	"""
	r = radius
	ringCoords = []
	
	for i in range(1, len(cellsPerRing)):
	
		divisions = cellsPerRing[i] - cellsPerRing[i-1]

		coords = []

		angle = 0
		divisionAngle = 360 / divisions
		while angle <= 360:
			angle += divisionAngle 
			theta = math.radians(angle)
			y = r * math.sin(theta)
			x = r * math.cos(theta)
			coords.append({ 'x': x, 'y': y, 'angle': theta, 'radius': r})

		ringCoords.append(coords)
		r += deltaRadius

	return ringCoords



def _calculateConcentricPath(innerCircleCoords, outerCircleCoords, translateX, translateY):
	"""
	Creates an svg path that divides two concentric rings
	i.e. makes cells for two concentric circles
	i.e. draw divider lines from ring i-1 perimeter to ring i perimeter
	"""

	path = ''

	for j in range(0, len(outerCircleCoords)):

		currentAngle = outerCircleCoords[j]['angle']
		innerCircleRadius = innerCircleCoords[0]['radius']
		innerCircleY = innerCircleRadius * math.sin(currentAngle)
		innerCircleX = innerCircleRadius * math.cos(currentAngle)
		
		# draw to coord of new ring
		path += 'M' + str(innerCircleX + translateX) + ',' + str(innerCircleY + translateY) + ' '
		path += 'L' + str(outerCircleCoords[j]['x'] + translateX) + ',' + str(outerCircleCoords[j]['y'] + translateY) + ' '

	return path



def generateGridSvg(ringCoords):

	"""
	Generates the svg code based on ringCoords, where ringCoords is
	ringsCoords[
		[{'x': x, 'y': y, 'angle': ang, 'radius', r}, ..., {}], #ring 1
		[.....],
		...,
		[...] # ring N	
	]
	ordering of ringCoords matters. [r1, r2, r3...rN]
	"""

	svg_code = []
	largestRadius = ringCoords[len(ringCoords)-1][0]['radius']
	t_svg_circle = """<circle id="{}" r="{}" cx="{}" cy="{}" stroke-width="3" fill="none" stroke="#000"></circle>"""
	t_svg_path = """<path id="{}" d="{}" stroke="red" stroke-width="1"></path>"""
	cx = largestRadius
	cy = largestRadius

	# add first circle
	firstRadius = ringCoords[0][0]['radius']
	svg_code.append(t_svg_circle.format('ring_1', firstRadius, largestRadius, largestRadius))

	for i in range(1, len(ringCoords)):

		coords = ringCoords[i]

		# draw divider lines from ring i-1 perimeter to ring i perimeter
		path = _calculateConcentricPath(ringCoords[i-1], coords, cx, cy)

		radius = coords[0]['radius']
		svg_circle = t_svg_circle.format('ring_' + str(i), radius, cx, cy)
		svg_path = t_svg_path.format('ring_' + str(i) + '_path', path)

		svg_code.append(svg_circle)
		svg_code.append(svg_path)

	return svg_code


def generateGrid(radius, deltaRadius, numberOfRings, outputFile=None):

	"""
	Required
		radius: starting radius
		deltaRadius: increase in radius value for each ring
		numberOfRings: number of donuts formed, or can think of number of rows in a standard grid
		
	Optional
		outputFile: where to write the svg code. overwrites existing file

	Returns
		the svg code for the grid
	"""

	cellsPerRing = generateCellCount(numberOfRings - 1, 4)
	ringCoords = generateCellPoints(cellsPerRing, radius, deltaRadius)
	svg_code = generateGridSvg(ringCoords)

	largestRadius = ringCoords[len(ringCoords)-1][0]['radius']

	innerCode = '\n'.join(svg_code)
	svg = """
	<svg width="{}" height="{}">
		{}
	</svg>
	"""
	
	full_svg = svg.format(largestRadius*2, largestRadius*2, innerCode)

	if outputFile:
		with open(outputFile, 'w') as f:
			f.write(full_svg)
	return full_svg


# Ex: generateGrid(25, 50, 9, outputFile='test2.html')