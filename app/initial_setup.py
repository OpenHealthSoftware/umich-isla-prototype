

import config as C
import grid
import subprocess as sp
import sqlFunctions

C.initFolders()


grid.generateGrid(40, 80, 9, outputFile='grid.svg')

sp.check_output(['inkscape', '-z', '--export-dpi', '300', '-e', C.FILE_PATHS['grid']['display'], 'grid.svg'])
sp.check_output(['convert',  C.FILE_PATHS['grid']['display'], '-alpha', 'remove', '-threshold', '99%', '-interpolate', 'nearest', '-set', 'colorspace', 'Gray', '-separate', '-average', C.FILE_PATHS['grid']['analysis']])


