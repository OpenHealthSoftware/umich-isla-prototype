from flask import *
import json
import gridProcessing
import sqlFunctions as sql
import config as C
import hashlib
import os
import util

user = Blueprint('user', __name__)


@user.route('/account', methods=['GET', 'POST'])
def main_route():
    
	return 'hello ' + session['username']


@user.route('/login')
def login_route():
    if 'REMOTE_USER' in request.environ: # TODO: make sure they actually signed in with cosign
        session['username'] = request.environ['REMOTE_USER']
    elif C.DEV_USER:
        session['username'] = C.DEV_USER
    else:
        return 'You do not have access'

    return redirect(url_for('main.main_route'))

@user.route('/logout')
def logout_route():
    cosignUrl = 'https://weblogin.umich.edu/cgi-bin/logout'
    session.pop('username')
    return redirect(cosignUrl)


# give warning when opening same image in multiple tabs