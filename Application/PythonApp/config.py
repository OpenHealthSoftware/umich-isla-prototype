# Do NOT commit this file to github
# Make a seperate one for your deployed environment

env = dict(
	host = '0.0.0.0',
	port = 3000,
	user = 'root', 
	password = 'root',
	db = '', 
)

sql = dict(
	host = 'localhost',
	user = 'root',
	password = '',
	db = 'kellogg',
)

# For file uploads
UPLOAD_FOLDER = './static/images/uploads'
ALLOWED_EXTENSIONS = set(['png', 'PNG','jpg', 'bmp', 'gif'])
