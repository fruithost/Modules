#!/bin/bash
push () 
{
	#prepare tags
	loginWithPassword=$1":"$2"@github.com"
	loginWithAt=$1"@"
	emptyString=""
	guthubString="github.com"

	url="$(git config --get remote.origin.url)"
	url="${url/$loginWithAt/$emptyString}"
	resultUrl="${url/$guthubString/$loginWithPassword}"
	
	#pull
	# git pull
	
	#add tag
	# if [[ "$3" != "" ]]; then
		# git tag -a "$3" -m ""
	# fi

	#push changes
	git push --repo $resultUrl
}

if [ "$1" == "" ]; then
	read -p "Command: " command
fi

echo "$@"
if [[ "$@" == "git push" ]]; then
	read -p "GitHub Login: " login
	read -p "GitHub Password: " password
fi

cd ../modules

for dir in $(find . -name ".git")
do
    cd ${dir%/*} > /dev/null
	echo ${dir%/*}

	if [ "$1" == "" ]; then
		$command
	else
		if [[ $login != "" ]]; then
			push $login $password
		else
			"$@"
		fi
	fi

	echo "";
    cd -  > /dev/null
done


