To run this project, you should be familiar with making a basic Flask web application.

Specific technologies stack: Flask, SQL, Javascript / jQuery, HTML, and CSS

## Setup

Prereqs: inkscape, python3, sqlite3

Run the following commands
```
virtualenv -p python3 venv
source venv/bin/activate
pip install -r pipreqs.txt
python initial_setup.py
sqlite3 database.db < sql/databasecreate.sql
sqlite3 database.db < sql/databasestarter.sql
mkdir -p uploads/patient/
mkdir uploads/thumbnails/
```

## Running

```
python app.py -d
```

## Saving / Resetting
If a round of grading has been finished, or you just want to reset the server, you should backup the following:
```
app/database.db
app/uploads/*
```
And that should be it. Then you can delete those files and run inital_setup.py to reset.

# Grid

There are 2 grid files that are created when running initial_setup.py. The existing `grid.svg`, which is a vector format, is used so the grid can be exported to any resolution needed. From which we get:
- `static/images/grid.png` that is overlayed during grading on the web app.
- `static/images/grid.jpg` that is black and white, which is required for OpenCV to do contour analysis to trace the cells of the grid.

# Database
This app uses sqlite3 for its database, which is stored as just one file 'app/database.db'. The schema and starter data are under 'app/sql/'.

# Grades
All the data a grader enters for a session is saved as a json file on the server under app/uploads/grades/. These are kept track of in the database, so each file corresponds to a given grading session.

