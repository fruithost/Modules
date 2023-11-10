#!/bin/bash
read -p "Product version: " sVersion

if [ "$sVersion" != "" ]; then
	cd ../
	# now=$(date +"%Y-%m-%d")

	echo $sVersion > VERSION

	#empty data folder
	#zip -r aurora-cloud.zip data modules static system vendor ".htaccess" dav.php common.php index.php LICENSE favicon.ico robots.txt -x ./data/**\*

	#data/settings only
	zip -r package-$sVersion.zip data/settings/modules modules static system vendor  ".htaccess" dav.php common.php index.php LICENSE VERSION README.md favicon.ico robots.txt composer.json modules.json gulpfile.js pre-config.json -x **/*.bak

	cd ./dev
fi