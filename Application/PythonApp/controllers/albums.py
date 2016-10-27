from flask import *
from sqlFunctions import *

albums = Blueprint('gridProcessing', __name__, template_folder='templates')

# Requires: Boolean for whether the page is in edit mode or not
# Effects: Returns dictionary of variables for displaying albums page
def getAlbumOptions(editMode):

	album = None
	username = session['username']

	if username is not None:
		albums = getAlbums(username, True)

	options = {
		"edit": editMode,
		"user": username,
		"albums": albums,
	}
	return options



@albums.route('/albums/edit', methods=['GET', 'POST'])
def albums_edit_route():
	if 'username' not in session:
		return redirect(url_for('main.main_route'))

	albums = None
	username = None
	
	username = session['username']
	if username is not None:
		albums = getAlbums(username, True)

	# Add or delete album
	if request.method == 'POST':
		data = request.form
		operation = data['op']
		
		if operation == 'delete':
			albumid = data['albumid']
			# Photos need to be deleted first because of foreign keys
			cursor.execute("DELETE FROM photo WHERE albumid=" + albumid)
			cursor.execute("DELETE FROM album WHERE albumid=" + albumid)
			# Delete files on server -----------------------------------------------------------

		elif operation == 'add':
			title = data['albumTitle']
			insertQuery = "INSERT INTO album (username, title) VALUES(\'" + session['username'] + "\',\'" + title + "\')"
			cursor.execute(insertQuery)

		#return redirect(url_for('.edit'))
		options =getAlbumOptions(True)
		return render_template("albums.html", **options)

	options =getAlbumOptions(True)
	return render_template("albums.html", **options)



@albums.route('/albums')
def albums_route():
	if 'username' not in session:
		return redirect(url_for('main.main_route'))
	options = getAlbumOptions(False)
	return render_template("albums.html", **options)