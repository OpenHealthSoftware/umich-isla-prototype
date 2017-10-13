import argparse


# Create and handle command line arguments
parser = argparse.ArgumentParser(description='Kellogg Eye Web App')
parser.add_argument('-d', '--development', 
					action="store_true", # act like a flag
                    help='a flag for indicating the app will run for local development')
parser.add_argument('-u', default='devUser', type=str,
                    help='uniqname for the session (who you are signed in as)')
args = parser.parse_args()

# If app is run with development, fake a logged in user
USER = ''
if args.development and args.u:
    USER = args.u


env = dict(
	host = '0.0.0.0',
	port = 5000
)

VERSION_FILE = './version.txt'

# For file uploads
STATIC_PATH = 'static'
F_UPLOAD_FOLDER_P = STATIC_PATH + '/images/uploads/'
F_UPLOAD_FOLDER_NORM = STATIC_PATH +'/images/normals/'
F_THUMBNAIL_PATH = STATIC_PATH + '/images/thumbnails/'
LIBRARY_PATH = STATIC_PATH + '/images/library/'
UPLOAD_FOLDER_P = 'images/uploads/' # from static
UPLOAD_FOLDER_NORM = 'images/normals/' # from static
THUMBNAIL_PATH = 'images/thumbnails/' # from static
ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'bmp', 'gif'])
GRID_PATH = STATIC_PATH + '/images/grid.png'
C_GRID_PATH = STATIC_PATH + '/images/grid.jpg' #for contout need nonalpha
GRID_PREFIX = "grid_" # prefix that grid images will begin with
GRADES_PATH = STATIC_PATH + '/grades/'
