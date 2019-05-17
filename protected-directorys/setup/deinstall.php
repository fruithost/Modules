<?php
	use fruithost\Database;
	
	Database::query('DROP TABLE IF EXISTS `' . DATABASE_PREFIX . 'protected_directorys`;');
	Database::query('DROP TABLE IF EXISTS `' . DATABASE_PREFIX . 'protected_users`;');
?>