from flask import *
import json
import gridProcessing
import sqlFunctions as sql
import config as C
import hashlib
import os
import util

review = Blueprint('review', __name__)


@review.route('/review', methods=['GET', 'POST'])
def main_route():
	return "hello " + util.get_current_user()

@review.route('/testUsers', methods=['GET', 'POST'])
def test():


	print(request.environ['REMOTE_USER'])

	data = {}
	if request.method == 'POST':
		print('Mdda-', request.form['refName'], util.get_current_user(),)
		data['thing'] = '-'.join([request.form['refName'], util.get_current_user(), request.environ['REMOTE_USER']])

	return render_template('userTest.html', **data)