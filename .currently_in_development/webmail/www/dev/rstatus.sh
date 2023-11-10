#!/bin/bash

echo "Going to check git status of all repos found in current working dir ": $PWD;


for dir in $(find . -name ".git")
do
    cd ${dir%/*} > /dev/null



    if [ $(git status | grep modified -c) -ne 0 ]
		then
			echo ${dir%/*}:
			git status  --porcelain
        fi
    cd -  > /dev/null
done