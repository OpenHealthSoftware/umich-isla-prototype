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
app.register_blueprint(controllers.review)
app.register_blueprint(controllers.user)
app.register_blueprint(api.api)

app.secret_key = 'temporary'

# Custom static data
@app.route('/content/<path:filename>')
def content(filename):
	return send_from_directory(app.root_path, filename)



# Use when running locally so you generates thumbnails for images only uploaded to server
def updateThumbnails():
	files = os.listdir(config.FILE_PATHS['patient'])
	files = [os.path.join(config.FILE_PATHS['patient'], f) for f in files]
	files2 = os.listdir(config.FILE_PATHS['control'])
	files2 = [os.path.join(config.FILE_PATHS['control'], f) for f in files2]
	files = files + files2
	for path in files:
		i = Image.open(path)
		i.thumbnail((500,500), Image.ANTIALIAS)
		i.save(os.path.join(config.FILE_PATHS['thumbnails'], os.path.basename(path)))


# Listen on external IPs
# For us, listen to port 3000 so you can just run 'python app.py' to start the server
if __name__ == '__main__':
	# listen on external IPs
	if len(sys.argv) > 1: # only arguments will be pased to development
		app.run(host=config.env['host'], port=config.env['port'], debug=True)
	else:
		app.run()

