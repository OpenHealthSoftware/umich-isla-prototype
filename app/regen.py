"""
umbrella module (for now) for regenerating/resetting data
"""


from controllers.uploads import createGriddedImage
import sqlFunctions as sql
import config as C

def regenGrids():
    """
    Requires database still has valid table.grid information
    Will recreate the grid images based on exisiting data
    """
    grids = sql.getGrids()

    for g in grids:
        createGriddedImage((g['xFovea'], g['yFovea']), (g['xDisc'], g['yDisc']), 
            g['imgId'], g['category'], insertToDB=False)

# regenGrids()

import shutil
import os
def reset():
    os.remove(C.DATABASE_PATH)
    shutil.rmtree(C.FILE_PATHS['patient'])
    os.makedirs(C.FILE_PATHS['patient'])
    shutil.rmtree(C.FILE_PATHS['control'])
    os.makedirs(C.FILE_PATHS['control'])
    shutil.rmtree(C.FILE_PATHS['thumbnails'])
    os.makedirs(C.FILE_PATHS['thumbnails'])

# reset()