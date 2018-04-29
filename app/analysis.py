import csv



def processGrades(rawFilepath):
	"""
	given a raw webapp csv, makes a csv file that is comparable to Optos method results
	"""

	# 1. open csv file
	csvReader = csv.DictReader(open(rawFilepath, 'r'), delimiter=',')

	# 2. remove unnecesary data
	processedFilePath = './processed.csv'
	relevantHeaders = ['imgId', 'grader', 'Perfusion Value'] # referenceName 
	dictWriter = csv.DictWriter(open(processedFilePath, 'w'), relevantHeaders)
	for row in csvReader:
		values = {k:v for k, v in row.items() if k in relevantHeaders}
		# 3. TODO: map names
		dictWriter.writerow(values)

	

# 5. TODO compare, do all stats stuff


if __name__ == '__main__':
	processGrades('test.csv')
