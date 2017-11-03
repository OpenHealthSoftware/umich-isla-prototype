# Controller for help-info-settings
from flask import *
import json
from config import VERSION_FILE

docs = Blueprint('docs', __name__, template_folder='templates', static_folder='static')

@docs.route('/help', methods=['GET', 'POST'])
def main_route():
	gitTag = None
	with open(VERSION_FILE, 'r') as f:
		gitTag = f.readline()

	data = {
		'version' : gitTag
	}

	return render_template('docs.html', **data)