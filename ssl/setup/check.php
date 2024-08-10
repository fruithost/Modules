<?php
	use fruithost\Storage\Database;
	
	if(!Database::tableExists(DATABASE_PREFIX . 'certificates')) {
		print('Table <strong>certificates</strong> not exists!');
	}
?>