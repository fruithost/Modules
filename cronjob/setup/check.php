<?php
	use fruithost\Storage\Database;
	
	if(!Database::tableExists(DATABASE_PREFIX . 'cronjobs')) {
		print('Table <strong>cronjobs</strong> not exists!');
	}
?>