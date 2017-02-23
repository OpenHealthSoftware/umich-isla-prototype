import os
from sqlFunctions import *
STATIC_PATH = 'static'
F_UPLOAD_FOLDER_P = STATIC_PATH + '/images/uploads/'

def deleteImage(imgId):
    deleteEntry('images', 'imgId', imgId)
    img = os.path.join(F_UPLOAD_FOLDER_P, imgId + '.png')
    grid = os.path.join(F_UPLOAD_FOLDER_P, 'grid_' + imgId + '.png')
    os.remove(img)
    os.remove(grid)

deleteImage('338f9025532ec005bca0eb8c208246d6')