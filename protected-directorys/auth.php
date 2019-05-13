<?php
	if(!defined('PATH')) {
		define('PATH', sprintf('%s/', dirname(dirname(dirname(__FILE__)))));
	}
	
	require_once(PATH . '/panel/.security.php');
	require_once(PATH . '/panel/config.php');
	require_once(PATH . '/panel/classes/Database.class.php');
	require_once(PATH . '/panel/classes/DatabaseFactory.class.php');

	use fruithost\Database;
	
	define('TAB', "\t");
	define('BS', '\\');
	define('DS', DIRECTORY_SEPARATOR);
	
	$script		= $argv[0];
	$directory	= $argv[1];
	$username	= trim(fgets(STDIN));
	$password	= trim(fgets(STDIN));
	$result		= Database::single('SELECT * FROM `' . DATABASE_PREFIX . 'protected_users` WHERE `username`=:username AND `password`=:password and `id`=:directory LIMIT 1', [
		'username'	=> $username,
		'password'	=> $password,
		'directory'	=> $directory
	]);
	
	if(empty($username) || empty($password) || empty($directory)) {
		exit(1);
	}
	
	if(!empty($result) && $result->username == $username) {
		exit(0);
	}
	
	exit(1);
?>