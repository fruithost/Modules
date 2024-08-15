<?php
	use fruithost\Database;
	use fruithost\Encryption;
	
	class DatabaseDaemon {
		public function __construct() {
			$databases = $this->getDatabases('AND
										`' . DATABASE_PREFIX . 'mysql_databases`.`time_created` IS NULL
									AND
										`' . DATABASE_PREFIX . 'mysql_databases`.`time_deleted` IS NULL');
										
			foreach($databases AS $database) {
				$name = $database->username . '_' . $database->name;
				
				print 'Create Database ' . $name . PHP_EOL;
				
				Database::query('CREATE DATABASE IF NOT EXISTS `' . $name . '` DEFAULT CHARACTER SET \'utf8\' COLLATE \'utf8_general_ci\';');
				
				Database::update(DATABASE_PREFIX . 'mysql_databases', 'id', [
					'id'			=> $database->id,
					'time_created'	=> date('Y-m-d H:i:s', time()),
					'time_deleted'	=> NULL
				]);
			}
			
			$users = $this->getUsers('AND
										`' . DATABASE_PREFIX . 'mysql_users`.`time_created` IS NULL
									AND
										`' . DATABASE_PREFIX . 'mysql_users`.`time_deleted` IS NULL');
										
			foreach($users AS $user) {
				$name		= $user->username . '_' . $user->name;
				$password	= Encryption::decrypt($user->password, ENCRYPTION_SALT); //$this->createRandomPassword();
				$connection	= 'localhost';
				
				print 'Create User ' . $name . PHP_EOL;
				
				switch($user->connection) {
					case 'GLOBAL':
						$connection = '%';
					break;
					case 'LOCAL':
						$connection = 'localhost';
					break;
				}
				
				Database::query('CREATE USER IF NOT EXISTS :username@:connection', [
					'username'		=> $name,
					'connection'	=> $connection
				]);
				
				Database::query('GRANT USAGE ON *.* TO :username@:connection', [
					'username'		=> $name,
					'connection'	=> $connection
				]);
				
				Database::query('GRANT ALL PRIVILEGES ON `' . $user->username . '_' . $user->database . '`.* TO :username@:connection', [
					'username'		=> $name,
					'connection'	=> $connection
				]);
				
				Database::query('ALTER USER :username@:connection IDENTIFIED BY :password', [
					'username'		=> $name,
					'password'		=> $password,
					'connection'	=> $connection
				]);
				
				Database::query('FLUSH PRIVILEGES');
				
				Database::update(DATABASE_PREFIX . 'mysql_users', 'id', [
					'id'			=> $user->id,
					//'password'		=> $password,
					'time_created'	=> date('Y-m-d H:i:s', time()),
					'time_deleted'	=> NULL
				]);
			}
		}
		
		protected function getDatabases($sql = '') {
			return Database::fetch('SELECT
										`' . DATABASE_PREFIX . 'mysql_databases`.*,
										`' . DATABASE_PREFIX . 'users`.`username` AS `username`
									FROM
										`' . DATABASE_PREFIX . 'mysql_databases`,
										`' . DATABASE_PREFIX . 'users`
									WHERE
										`' . DATABASE_PREFIX . 'users`.`id`=`' . DATABASE_PREFIX . 'mysql_databases`.`user_id`
									' . $sql . '
									ORDER BY `' . DATABASE_PREFIX . 'mysql_databases`.`name` ASC', []);
		}
		
		protected function getUsers($sql = '') {
			return Database::fetch('SELECT
										`' . DATABASE_PREFIX . 'mysql_users`.*,
										`' . DATABASE_PREFIX . 'users`.`username` AS `username`,
										`' . DATABASE_PREFIX . 'mysql_databases`.`name` AS `database`
									FROM
										`' . DATABASE_PREFIX . 'mysql_users`,
										`' . DATABASE_PREFIX . 'mysql_databases`,
										`' . DATABASE_PREFIX . 'users`
									WHERE
										`' . DATABASE_PREFIX . 'users`.`id`=`' . DATABASE_PREFIX . 'mysql_users`.`user_id`
									AND
										`' . DATABASE_PREFIX . 'mysql_databases`.`id`=`' . DATABASE_PREFIX . 'mysql_users`.`database`
									' . $sql . '
									ORDER BY `' . DATABASE_PREFIX . 'mysql_users`.`name` ASC', []);
		}
		
		protected function createRandomPassword($length = 10) {
			$characters			= '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
			$charactersLength	= mb_strlen($characters);
			$randomString		= '';
			
			for($i = 0; $i < $length; $i++) {
				$randomString .= $characters[rand(0, $charactersLength - 1)];
			}
			
			return $randomString;
		}
	}
	
	new DatabaseDaemon();
?>