from flask import *
import json
import imageProcessing
from sqlFunctions import *
import config
import hashlib
import os

# responsible for all user / account settings and management

account = Blueprint('account', __name__)


@account.route('/login', methods=['GET', 'POST'])
def login_route():
	
	
	print "\n\n\n\n", imageGrades, "\n\n\n"
	data = {
		"images" : images,
		"imageGrades": imageGrades,
		"type" : type
	}

	if form and form['getContent']:
		html = render_template("index.html", **data)
		return jsonify(html=html)
	else:
		return render_template("index.html", **data)


@account.route('/user', methods=['GET'])
def user_route():
	a = 0