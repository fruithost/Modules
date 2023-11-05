<?php
	use fruithost\Database;
	
	Database::file(dirname(__FILE__) . '/sql/faq_categories.sql', function($error) {
		print_r($error);
	});
	
	Database::file(dirname(__FILE__) . '/sql/faq_entries.sql', function($error) {
		print_r($error);
	});
	
	Database::file(dirname(__FILE__) . '/sql/faq_data.sql', function($error) {
		print_r($error);
	});
?>