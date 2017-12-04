from flask import Flask, render_template, session, request, send_from_directory
import controllers
import config
import sys
import os
import api
from PIL import Image

STATIC_PATH = config.STATIC_PATH
# Initialize Flask app
#app = Flask(__name__, template_folder='templates', static_folder='static')
app = Flask(__name__, template_folder='templates', static_folder=STATIC_PATH)


# Register the controllers
app.register_blueprint(controllers.main)
app.register_blueprint(controllers.gradeView)
app.register_blueprint(controllers.uploads)
app.register_blueprint(controllers.docs)
#app.register_blueprint(controllers.account)
app.register_blueprint(api.api)


# Custom static data
@app.route('/content/<path:filename>')
def content(filename):
	return send_from_directory(app.root_path, filename)



# Use when running locally so you generates thumbnails for images only uploaded to server
def updateThumbnails():
	files = os.listdir(config.UPLOAD_FOLDER_NORM)
	for image in files:
		path = os.path.join(config.UPLOAD_FOLDER_NORM, image)
		i = Image.open(path)
		i.thumbnail((500,500), Image.ANTIALIAS)
		i.save(os.path.join(config.THUMBNAIL_PATH, image))


# Listen on external IPs
# For us, listen to port 3000 so you can just run 'python app.py' to start the server
if __name__ == '__main__':
	# listen on external IPs
	if len(sys.argv) > 1: # only arguments will be pased to development
		app.run(host=config.env['host'], port=config.env['port'], debug=True)
	else:
		app.run()

