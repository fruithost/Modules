<?php
	use fruithost\Storage\Database;
	
	if(!Database::tableExists(DATABASE_PREFIX . 'mysql_databases')) {
		print('<br />Table <strong>mysql_databases</strong> not exists!');
	}
	
	if(!Database::tableExists(DATABASE_PREFIX . 'mysql_users')) {
		print('<br />Table <strong>mysql_users</strong> not exists!');
	}
	
	// Check GRANT Options to create new databases?
?>