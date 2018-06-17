# ISLA Flask App
This is where the contents for the web application are stored


# Developing
## Setup

Prereqs: inkscape, python3, sqlite3

Run the following commands
```
virtualenv -p python3 venv
source venv/bin/activate
pip install -r pipreqs.txt
python initial_setup.py
```
## Running tests
## Contributing
The master branch is for live deployment on the server. Do not merge code here unless it works. Development should be done on the 'dev' branch / branches off of 'dev'.


# Grid
## Formats
There are 3 grid files that are created when running initial_setup.py. The first is a SVG file, which is a vector format, so the svg grid can be exported to any resolution needed. Then a .png file is created that is overlayed during grading on the web app. Finally, there is a .jpg version that is black and white, which is required for OpenCV to do contour analysis on the image AKA trace the cells.

# Database
This app uses sqlite3 for its database, which is stored as just one file 'app/database.db'. The schema and starter data are under 'app/sql/'.

# Grades
All the data a grader enters for a session is saved as a json file on the server under app/uploads/grades/. These are kept track of in the database, so each file corresponds to a given grading session.

# Server
**Email help@eecs.umich.edu for access, or any questions.**
The server is running Ubuntu 16.04 for an OS. 

Server: Apache, Phussion Passenger
Cosign: for umich user authentication (weblogin)

## Quickstart
To update the web app on the server
Ssh to server
```
cd /w/app
git pull
git describe > version.txt
../conf/reload.sh
```

## Python3
To make sure the server uses python3, make python3 first in the PATH for python, or update the apache config file as shown [here](https://www.phusionpassenger.com/library/config/apache/reference/#passengerpython)
In our case, edit '/etc/apache2/sites-available/maverick-ssl.conf'

Virtualenv is a pain to set up with passenger, so if python3 is not the default python, then you will need to make sure the necessary packages are installed on the system under python3.
```
pip3 install -r pipreqs.txt
```

## Additional info
Here is some information from emails when the server was set up
```
See http://maverick.eecs.umich.edu/supersecret for a demonstration of
weblogin. You can set cosign to either not require a login, or to require a
login for certain directories (using a .htaccess file and the
<Location></Location> tags). You can also set it to either restrict to a
certain group of people or to just require a valid login. I'd be more than
happy to give you more information about your options with Cosign if you'd
like them.

...

The web files live at /w. It's currently owned by you and a group I created
called maverick-g. The file permissions should be set up such that every
new file

The flask app lives at /w/app. The the that passenger needs for your app to
run is a passenger_wsgi.py which defines a callable application object.
Static files live at /w/public. Anything that is static that apache finds
is routed first. This also includes directory indexes, so, if you have
/w/public/some-path/index.html, and a route in your app called
"/some-path", Apache will always show index.html first.

Theres some simple config stuff that lives at /w/conf. There is
/w/conf/apache.conf, which is a file that is included by the virtual host
that runs maverick.eecs. I elected to do it that way because that was (as
far as I was able to tell) to get Apache to behave nicely in terms of
authentication for webapp routes* (i.e. routes that are served by passenger
and don't correspond to static, concrete files). The only thing that should
go in there are <Location> blocks. I've specified one there for you. The
groups file is at /w/conf/acl.group; the syntax is pretty easy to figure
out. You can create as many groups as you want.

The alternative to the above authentication scheme would be checking the
authentication in your webapp which would definitely provide for finer
control but might also be prone to other issues.

*You can specify per directory .htaccess files, but you can't include
<Location> blocks in them, so, if you wanted to do just the .htaccess
route, you would have to make a directory tree in /w/public that
corresponds to your routes that only have .htaccess files in them, which
didn't seem ideal. That kind of set up can be seen in how
/w/public/supersecret is setup (with /w/public/supersecret/.htaccess).
```


# Versioning

# Authors

# License

# Resources

# Acknowledgements

# Support
