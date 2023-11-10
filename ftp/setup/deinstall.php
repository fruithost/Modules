<?php
	use fruithost\Storage\Database;
	
	Database::query('DROP TABLE IF EXISTS `' . DATABASE_PREFIX . 'ftp_user`;');
	Database::query('DROP TABLE IF EXISTS `' . DATABASE_PREFIX . 'ftp_quota_limits`;');
?>