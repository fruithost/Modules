<?php
	use fruithost\Storage\Database;
	
	if(!Database::tableExists(DATABASE_PREFIX . 'ftp_user')) {
		print('<br />Table <strong>ftp_user</strong> not exists!');
	}
	
	if(!Database::tableExists(DATABASE_PREFIX . 'ftp_quota_limits')) {
		print('<br />Table <strong>ftp_quota_limits</strong> not exists!');
	}
?>