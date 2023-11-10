<?php
	use fruithost\Storage\Database;
	
	Database::file(dirname(__FILE__) . '/sql/cronjobs.sql', function($error) {
		print_r($error);
	});
?>