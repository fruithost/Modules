<?php
	use fruithost\Storage\Database;
	
	Database::query('DROP TABLE IF EXISTS `' . DATABASE_PREFIX . '2fa_devices`;');
?>