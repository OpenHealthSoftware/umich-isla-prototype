# Do NOT commit this file to github
# Make a seperate one for your deployed environment
import sys
env = dict(
	host = '0.0.0.0',
	port = 3000
)

VERSION_FILE = './version.txt'

# For file uploads
STATIC_PATH = '../public/static'
TEMPLATES_PATH = '../public/templates'
if len(sys.argv) > 1 and sys.argv[1] == 'localMav':
	STATIC_PATH = './static'
	TEMPLATES_PATH = './templates'
UPLOAD_FOLDER_P = STATIC_PATH + '/images/uploads/'
UPLOAD_FOLDER_NORM = STATIC_PATH +'/images/normals/'
THUMBNAIL_PATH = STATIC_PATH + '/images/thumbnails/'
ALLOWED_EXTENSIONS = set(['png', 'PNG', 'jpg', 'bmp', 'gif'])
GRID_PATH = STATIC_PATH + '/images/grid15x16.png'
C_GRID_PATH = STATIC_PATH + '/images/grid15x16.jpg' #for contout need nonalpha
GRID_PREFIX = "grid_" # prefix that grid images will begin with
GRADES_PATH = STATIC_PATH + '/grades/'