<?php
	use fruithost\Storage\Database;
	
	Database::file(dirname(__FILE__) . '/sql/2fa.sql', function($error) {
		print_r($error);
	});
?>