# Do NOT commit this file to github
# Make a seperate one for your deployed environment

env = dict(
	host = '0.0.0.0',
	port = 3000,
	user = 'root', 
	password = 'root',
	db = '', 
)

sql = dict(
	host = 'localhost',
	user = 'root',
	password = '',
	db = 'kellogg',
)

# For file uploads
UPLOAD_FOLDER_P = './static/images/uploads/'
UPLOAD_FOLDER_NORM = './static/images/normals/'
ALLOWED_EXTENSIONS = set(['png', 'PNG', 'jpg', 'bmp', 'gif'])
GRID_PATH = './static/images/grid6.png'
C_GRID_PATH = './static/images/grid6.jpg' #for contout need nonalpha
GRID_PREFIX = "grid_" # prefix that grid images will begin with
