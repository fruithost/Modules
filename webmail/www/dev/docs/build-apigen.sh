#!/bin/bash

php apigen.phar generate -s ./../../modules/ -d ./../../docs/api --config ./../../apigen.neon

php update-apigen.php
