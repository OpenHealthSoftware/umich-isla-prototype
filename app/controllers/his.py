# Controller for help-info-settings
from flask import *
import json
from config import VERSION_FILE

his = Blueprint('his', __name__, template_folder='templates', static_folder="static")

@his.route('/help', methods=['GET', 'POST'])
def his_route():
	gitTag = open(VERSION_FILE, 'r').readline()
	data = {
		"version" : gitTag
	}

	html = render_template("help-info-settings.html", **data)
	return jsonify(html=html)