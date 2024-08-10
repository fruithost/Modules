<?php
	use fruithost\Storage\Database;
	
	if(!Database::tableExists(DATABASE_PREFIX . 'domains')) {
		print('Table <strong>domains</strong> not exists!');
	}
?>