import argparse
import os

# Create and handle command line arguments
parser = argparse.ArgumentParser(description='Kellogg Eye Web App')
parser.add_argument('-d', '--development', 
					action='store_true', # act like a flag
                    help='a flag for indicating the app will run for local development')
parser.add_argument('-u', default='devUser', type=str,
                    help='uniqname for the session (who you are signed in as)')
args = parser.parse_args()

# If app is run with development, fake a logged in user
DEV_USER = None
if args.development and args.u:
    DEV_USER = args.u


env = dict(
	host = '0.0.0.0',
	port = 5000
)

VERSION_FILE = './version.txt'
DATABASE_PATH = 'database.db'

# For file uploads
imgCategories = {
    'patient': 'patient',
    'control': 'control'
}
STATIC_PATH = 'static'
UPLOAD_PATH = 'uploads'

FILE_PATHS = {
    'patient': os.path.join(UPLOAD_PATH, imgCategories['patient']),
    'thumbnails': os.path.join(UPLOAD_PATH, 'thumbnails'),
    'control': os.path.join(UPLOAD_PATH, imgCategories['control']),
    'library': os.path.join(STATIC_PATH, 'images', 'library'),
    'grid': {
        'display': os.path.join(STATIC_PATH, 'images', 'grid.png'),
        'analysis': os.path.join(STATIC_PATH, 'images', 'grid.jpg') 
    },
    'grades': os.path.join(UPLOAD_PATH, 'grades')
}

ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'bmp', 'gif'])
GRID_PREFIX = 'grid_' # prefix that grid images will begin with
GRID_FORMAT = '.png'