#!/bin/bash

stash ()
{
#	git stash
#	git checkout -b NewEventsModule
#	git stash apply
#	git commit -a -m "$3"

	git checkout master

	loginWithPassword=$1":"$2"@github.com"
	loginWithAt=$1"@"
	emptyString=""
	guthubString="github.com"

	url="$(git config --get remote.origin.url)"
	url="${url/$loginWithAt/$emptyString}"
	resultUrl="${url/$guthubString/$loginWithPassword}"

#	git push --repo $resultUrl
} 

read -p "GitHub Login: " login
read -p "GitHub Password: " password
read -p "Commit message: " commit

clear

cd ../modules

for dir in $(find . -name ".git")
do
    cd ${dir%/*} > /dev/null
    
	echo ${dir%/*}

	stash $login $password "$commit"

	echo "";

    cd -  > /dev/null
done