from flask import Flask, render_template, session, request
import controllers
import config
import sys

STATIC_PATH = config.STATIC_PATH
TEMPLATES_PATH = config.TEMPLATES_PATH
# Initialize Flask app
#app = Flask(__name__, template_folder='templates', static_folder="static")
app = Flask(__name__, template_folder=TEMPLATES_PATH, static_folder=STATIC_PATH)


# Register the controllers
app.register_blueprint(controllers.main)
app.register_blueprint(controllers.view)
app.register_blueprint(controllers.uploads)
app.register_blueprint(controllers.his)

# Config
app.config['UPLOAD_FOLDER_P'] = config.UPLOAD_FOLDER_P
app.config['UPLOAD_FOLDER_NORM'] = config.UPLOAD_FOLDER_NORM
app.config['GRID_PREFIX'] = config.GRID_PREFIX
app.config['C_GRID_PATH'] = config.C_GRID_PATH
app.config['GRID_PATH'] = config.GRID_PATH

arg1 =''
if len(sys.argv) > 1:
	arg1 = sys.argv[1]

# Listen on external IPs
# For us, listen to port 3000 so you can just run 'python app.py' to start the server
if __name__ == '__main__':
	# listen on external IPs
	if arg1 == 'localMav':
		app.run(host=config.env['host'], port=config.env['port'], debug=True)
	else: 
		app.run()
