
# 1 get headers from sql features table
# globals: imgid, referencename, grader
# meta

from collections import OrderedDict
import sqlFunctions as sql
import config as conf
import uuid
import os
import json
import csv

def getGradeJson(fileId):
	filepath = os.path.join(conf.FILE_PATHS['grades'], fileId)
	
	if os.path.isfile(filepath) == False:
		return {'error': 'Grade file not found - ' + filepath}

	return json.load(open(filepath, 'r'))
	

def addConstantFields(dict, gradeJson):
	dict['imgId'] = gradeJson['globals']['imgId']
	if 'referenceName' in gradeJson['globals']:
		dict['referenceName'] = gradeJson['globals']['referenceName']
	else:
		dict['referenceName'] = sql.getImageData(dict['imgId'])['referenceName']
	dict['grader'] = gradeJson['globals']['grader']
	dict['sessionId'] = gradeJson['globals']['sessionId']

def createTableData(fileId):
	"""
	Creates the a list of dictionaries that can create a csv file
	"""
	features = sql.getOptions()
	
	gradeJson = getGradeJson(fileId)

	rowTemplate = OrderedDict()


	addConstantFields(rowTemplate, gradeJson)

	for f in features:
		rowTemplate[f['name']] = ''

	table = []
	metaHeaders = []

	for cellId in gradeJson['grades']:

		row = rowTemplate.copy()
		cellGrade = gradeJson['grades'][cellId]
		
		for grade in cellGrade['grades']:
			row[grade['headerName']] = grade['value']
		
		for x in cellGrade['meta']:
			row[x] = cellGrade['meta'][x]

		table.append(row)
		
	headers = table[0].keys()

	return headers, table


def generateMasterCSV():
	"""
	Creates a csv file that contains all finished grading data
	"""

	gradeFiles = sql.getGradeInfoAnd(selectCols=['gradeFile'], finishedGrading=1)
	table = []
	for g in gradeFiles:

		headers, tempTable = createTableData(g['gradeFile'])
		table += tempTable

	filename = [table[0]['imgId'], table[0]['grader'], str(uuid.uuid4())[:13]]
	filename = '_'.join(filename) + '.csv'
	filepath = os.path.join(conf.FILE_PATHS['grades'], filename) 

	with open(filepath, 'w') as f:
		dictWriter = csv.DictWriter(f, headers)
		dictWriter.writeheader()
		dictWriter.writerows(table)

	return filepath



if __name__ == '__main__':
	generateMasterCSV()
