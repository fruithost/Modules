<?php
	use fruithost\Database;
	
	Database::file(dirname(__FILE__) . '/sql/certificates.sql', function($error) {
		print_r($error);
	});
?>