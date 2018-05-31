from flask import *
import json
import gridProcessing
import sqlFunctions as sql
import config as C
import hashlib
import os
import util
import gradeData

review = Blueprint('review', __name__)


@review.route('/review', methods=['GET', 'POST'])
def main_route():
	if 'username' not in session:
		return redirect(url_for('user.login_route'))


	data = {
		'imgSrc': url_for('content', filename=C.FILE_PATHS['grid']['analysis']),
		'gridSrc': ''
	}

	return render_template('review.html', **data)


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

	if 'master' in request.args:
		filepath = gradeData.generateMasterCSV()
		return send_file(filename_or_fp=filepath, as_attachment=True, attachment_filename=filepath.split('/')[-1])

	# api, on front end: get all grade files that are finished
	return render_template('download.html')