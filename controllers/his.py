# Controller for help-info-settings
from flask import *
import json

his = Blueprint('his', __name__, template_folder='templates', static_folder="static")

@his.route('/', methods=['GET', 'POST'])
def his_route():
	return render_template("help-info-settings.html")