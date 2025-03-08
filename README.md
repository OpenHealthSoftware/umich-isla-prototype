This repository contains the application from the paper **Grid-based Software for Quantification of Diabetic Retinal Nonperfusion on Ultra-widefield Fluorescein Angiography**.

The application was designed for methodically labeling subdivisions (or cells) of an image. This is called 'grading' an image. Images can be uploaded to the application, and split by a previously defined grid (b/w image). While grading an image, you can also see the cells of any control images uploaded for comparison.

Data collected from grading can then be downloaded into a CSV file for analysis.

# Overview
Descriptions of the main pages on the application.

**localhost:5000/index** - This is the landing page of the app. Users can see images they haven't finished grading, as well as tips on how to grade.

**localhost:5000/gallery** - Users can view all the images on the web application. Each image shows if it has been graded, and by who.

**localhost:5000/grade** - This is where users will grade a given image.

**localhost:5000/upload** - This is how users add new images to the application for grading, or they can add control images. Users enter in some basic information about the image, and then they mark the fovea and optic disk positions so that the grid can be properly placed on the image. After this is done, the image is ready to be graded.

# Development
To run this project, you should be familiar with making a basic Flask web application.

Specific technologies stack: Flask, SQL, Javascript / jQuery, HTML, and CSS

## Setup

Prereqs: inkscape, python3, sqlite3

Run the following commands
```console
$ cd app
$ virtualenv -p python3 venv
$ source venv/bin/activate
$ pip install -r pipreqs.txt
$ python initial_setup.py
$ sqlite3 database.db < sql/databasecreate.sql
$ sqlite3 database.db < sql/databasestarter.sql
$ mkdir -p uploads/patient/
$ mkdir uploads/thumbnails/
```

## Running

```console
$ cd app
$ python app.py -d
```

## Saving / Resetting
If a round of grading has been finished, or you just want to reset the server, you should backup the following:
```
app/database.db
app/uploads/*
```
And that should be it. Then you can delete those files and run inital_setup.py to reset.

## Grid

There are 2 grid files that are created when running initial_setup.py. The existing `grid.svg`, which is a vector format, is used so the grid can be exported to any resolution needed. From which we get:
- `static/images/grid.png` that is overlayed during grading on the web app.
- `static/images/grid.jpg` that is black and white, which is required for OpenCV to do contour analysis to trace the cells of the grid.

## Database
This app uses sqlite3 for its database, which is stored as just one file `app/database.db`. The schema and starter data are under `app/sql/`.

## Grades
All the data a grader enters for a session is saved as a json file on the server under `app/uploads/grades/`. These are kept track of in the database, so each file corresponds to a given grading session.
