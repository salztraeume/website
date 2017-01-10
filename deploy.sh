#! /bin/bash

# old deploy strategy via Travis CI and FTP upload
# npm run deploy

git remote add prod dokku@awspace.de:sas-website
git push prod master