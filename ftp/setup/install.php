<?php
	use fruithost\Database;
	
	Database::file(dirname(__FILE__) . '/sql/ftp_users.sql', function($error) {
		print_r($error);
	});
?>