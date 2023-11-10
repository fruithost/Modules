<?php
	use fruithost\Storage\Database;
	
	try {
		$sql = file_get_contents(dirname(__FILE__) . '/sql/account.sql');
		$sql = str_replace([
			'[DATABASE_PREFIX]'
		], [
			DATABASE_PREFIX
		], $sql);
				
		print shell_exec('mysql -u root -p -e "' . $sql . '"');
	} catch(\Exception) {}
	
	Database::file(dirname(__FILE__) . '/sql/ftp_user.sql', function($error) {
		print_r($error);
	});
	
	Database::file(dirname(__FILE__) . '/sql/ftp_quota_limits.sql', function($error) {
		print_r($error);
	});
?>