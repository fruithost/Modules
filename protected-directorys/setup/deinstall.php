<?php
	use fruithost\Database;
	
	foreach(new \DirectoryIterator('/etc/fruithost/config/apache2/vhosts/') AS $info) {
		if($info->isDot()) {
			continue;
		}

		if(preg_match('/\.protected\.conf$/', $info->getFilename())) {
			@unlink(sprintf('%s%s%s', $info->getPath(), DS, $info->getFilename()));
		}
	}
	
	print shell_exec('service apache2 reload');
	
	Database::query('DROP TABLE IF EXISTS `' . DATABASE_PREFIX . 'protected_directorys`;');
	Database::query('DROP TABLE IF EXISTS `' . DATABASE_PREFIX . 'protected_users`;');
?>