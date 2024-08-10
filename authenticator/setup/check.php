<?php
	use fruithost\Storage\Database;
	
	if(!Database::tableExists(DATABASE_PREFIX . '2fa_devices')) {
		print('Table <strong>2fa_devices</strong> not exists!');
	}
?>