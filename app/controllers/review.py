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
