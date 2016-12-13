# Do NOT commit this file to github
# Make a seperate one for your deployed environment

env = dict(
	host = '0.0.0.0',
	port = 3000
)

# For file uploads
STATIC_PATH = '../public/static'
UPLOAD_FOLDER_P = STATIC_PATH + '/images/uploads/'
UPLOAD_FOLDER_NORM = STATIC_PATH +'/images/normals/'
ALLOWED_EXTENSIONS = set(['png', 'PNG', 'jpg', 'bmp', 'gif'])
#GRID_PATH = './static/images/grid6.png'
#C_GRID_PATH = './static/images/grid6.jpg' #for contout need nonalpha
GRID_PATH = STATIC_PATH + '/images/grid15x16.png'
C_GRID_PATH = STATIC_PATH + '/images/grid15x16.jpg' #for contout need nonalpha
GRID_PREFIX = "grid_" # prefix that grid images will begin with
GRADES_PATH = STATIC_PATH + '/grades/'