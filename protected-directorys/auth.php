<?php
	if(!defined('PATH')) {
		define('PATH', sprintf('%s/', dirname(dirname(dirname(__FILE__)))));
	}
	
	if(is_readable(PATH . '/panel/.security.php')) {
		require(PATH . '/panel/.security.php');
	} else if(is_readable(PATH . '/.security.php')) {
		require(PATH . '/.security.php');
	}
	
	if(is_readable(PATH . '/panel/.config.php')) {
		require(PATH . '/panel/.config.php');
	} else if(is_readable(PATH . '/.config.php')) {
		require(PATH . '/.config.php');
	}
	
	require_once(PATH . '/panel/classes/Database.class.php');
	require_once(PATH . '/panel/classes/DatabaseFactory.class.php');
	require_once(PATH . '/panel/classes/Encryption.class.php');

	use fruithost\Encryption;
	use fruithost\Database;
	
	define('TAB', "\t");
	define('BS', '\\');
	define('DS', DIRECTORY_SEPARATOR);
	
	$script		= $argv[0];
	$directory	= $argv[1];
	$handle		= fopen("php://stdin","r");
	
	print 'Welcome to Protected Directorys!' . PHP_EOL;
	
	print 'Username: ';
	$username	= trim(fgets($handle));
	
	print 'Password: ';
	$password 	= trim(fgets($handle));
	
	$result		= Database::single('SELECT * FROM `' . DATABASE_PREFIX . 'protected_users` WHERE `username`=:username AND `password`=:password and `id`=:directory LIMIT 1', [
		'username'	=> $username,
		'password'	=> Encryption::encrypt($password, ENCRYPTION_SALT),
		'directory'	=> $directory
	]);
	
	if(empty($username) || empty($password) || empty($directory)) {
		print 'Empty Username or Directory.' . PHP_EOL;
		exit(1);
	}
	
	if(!empty($result)) {
		print 'Bad User.' . PHP_EOL;
		exit(0);
	}
	
	if(!empty($result) && $result->username == $username) {
		print 'OK' . PHP_EOL;
		exit(0);
	}
	
	print 'Unknown Error.' . PHP_EOL;
	exit(1);
?>