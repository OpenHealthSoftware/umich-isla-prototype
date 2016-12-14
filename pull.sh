#!/bin/sh
# Commands for pulling from git to server

git pull
mv .htaccess ../public
rsync -au static ../public
rsync -au templates ../public
git describe > version.txt
../conf/reload.sh