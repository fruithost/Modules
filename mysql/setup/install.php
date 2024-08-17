<?php
	use fruithost\Storage\Database;
	
	Database::file(dirname(__FILE__) . '/sql/mysql_databases.sql', function($error) {
		print_r($error);
	});
	
	Database::file(dirname(__FILE__) . '/sql/mysql_users.sql', function($error) {
		print_r($error);
	});
?>