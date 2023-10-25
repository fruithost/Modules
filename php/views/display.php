<?php
	$path	= '/var/fruithost/users/admin/domain1.omen/';
	$tmp	= '.~fh.tmp.info.php';
	file_put_contents(sprintf('%s%s', $path, $tmp), '<?php phpinfo(); ?>');
	$result = shell_exec('DOCUMENT_ROOT=$1 \\' . PHP_EOL . 'SCRIPT_FILENAME=' . sprintf('%s%s', $path, $tmp) . ' \\' . PHP_EOL . 'REQUEST_METHOD=GET \\' . PHP_EOL . 'cgi-fcgi -bind -connect "/run/php/php8.2-fpm.sock" 2>&1');
	@unlink(sprintf('%s%s', $path, $tmp));
	preg_match_all('/^.*<body>(.*)<\/body>.*$/s', $result, $matches);
	
	print $matches[1][0];
?>