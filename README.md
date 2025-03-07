This repository contains the application from the paper Grid-based Software for Quantification of Diabetic Retinal Nonperfusion on Ultra-widefield Fluorescein Angiography.

*Developer specific information on how to run this app can be found in [app/README.md](app/README.md)*

The application was designed for methodically labeling subdivisions (or cells) of an image. We would call this 'grading' and image. Images can be uploaded to the application, and split by a previously defined grid (b/w image). While grading an image, you can also see the cells of any control images uploaded for comparison.

Data collected from grading can then be downloaded into a CSV file for analysis.

# Preview
Descriptions of the main pages on the application.
## localhost:5000/index
This is the landing page of the app. Users can see images they haven't finished grading, as well as tips on how to grade.
## localhost:5000/gallery
Users can view all the images on the web application. Each image shows if it has been graded, and by who.
## localhost:5000/grade
This is where users will grade a given image.
## localhost:5000/upload
This is how users add new images to the application for grading, or they can add control images. Users enter in some basic information about the image, and then they mark the fovea and optic disk positions so that the grid can be properly placed on the image. After this is done, the image is ready to be graded.
