<?php
	use fruithost\Storage\Database;
	
	Database::query('DROP TABLE IF EXISTS `' . DATABASE_PREFIX . 'faq_categories`;');
	Database::query('DROP TABLE IF EXISTS `' . DATABASE_PREFIX . 'faq_entries`;');
?>