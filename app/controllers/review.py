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
	if 'username' not in session:
		return redirect(url_for('user.login_route'))

	return 'hello'


@review.route('/overview', methods=['GET', 'POST'])
def overview_route():
	if 'username' not in session:
		return redirect(url_for('user.login_route'))

	# api, on front end: get all grade files that are finished

	return render_template('overview.html')


@review.route('/downloadFinished', methods=['GET', 'POST'])
def download_route():
	if 'username' not in session:
		return redirect(url_for('user.login_route'))

	# api, on front end: get all grade files that are finished

	return render_template('download.html')