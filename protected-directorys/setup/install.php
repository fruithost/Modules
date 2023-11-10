<?php
	use fruithost\Storage\Database;
	
	Database::file(dirname(__FILE__) . '/sql/protected_directorys.sql', function($error) {
		print_r($error);
	});
	
	Database::file(dirname(__FILE__) . '/sql/protected_users.sql', function($error) {
		print_r($error);
	});
?>