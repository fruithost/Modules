<?php
	use fruithost\Database;
	
	Database::query('DROP TABLE IF EXISTS `' . DATABASE_PREFIX . 'mysql_databases`;');
	Database::query('DROP TABLE IF EXISTS `' . DATABASE_PREFIX . 'mysql_users`;');
?>