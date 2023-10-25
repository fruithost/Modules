<?php
	use fruithost\Database;
	
	Database::file(dirname(__FILE__) . '/sql/ftp_user.sql', function($error) {
		print_r($error);
	});
	
	Database::file(dirname(__FILE__) . '/sql/ftp_quota_limits.sql', function($error) {
		print_r($error);
	});
?>