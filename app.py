from flask import Flask, render_template, session
import controllers
import config



# Initialize Flask app with the template folder address
app = Flask(__name__, template_folder='templates')


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


@app.route('/')
def main_route():
	user = '[ not logged in ]'
	if ('REMOTE_USER' in request.environ):
		user = request.environ['REMOTE_USER']
		return redirect(url_for('view.main_route')

# Listen on external IPs
# For us, listen to port 3000 so you can just run 'python app.py' to start the server
if __name__ == '__main__':
	# listen on external IPs
	#app.run(host=config.env['host'], port=config.env['port'], debug=True)
	app.run()
