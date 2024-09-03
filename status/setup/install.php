<?php
	use fruithost\Storage\Database;
	
	Database::file(dirname(__FILE__) . '/sql/status.sql', function($error) {
		print_r($error);
	});
?>