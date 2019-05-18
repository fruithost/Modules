<?php
	use fruithost\Database;
	
	Database::query('DROP USER IF EXISTS pma@localhost;');
	Database::query('DROP DATABASE IF EXISTS `phpmyadmin`;');
?>