#!/bin/bash

../vendor/bin/phpcs --standard=PHPCompatibility --extensions=php --report-full=./CS-report-modules.txt --runtime-set testVersion 5.4 -pvs ../modules/;
../vendor/bin/phpcs --standard=PHPCompatibility --extensions=php --report-full=./CS-report-system.txt --runtime-set testVersion 5.4 -pvs ../system/;

read -p "Exit: " response