<?php
	use fruithost\Storage\Database;
	
	if(!Database::tableExists(DATABASE_PREFIX . 'status')) {
		print('<br />Table <strong>status</strong> not exists!');
	}
?>