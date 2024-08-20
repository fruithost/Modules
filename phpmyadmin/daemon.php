<?php
	use fruithost\Storage\Database;
	use fruithost\Accounting\Auth;
	
	class PHPMyAdminDaemon {
		public function __construct() {
			$users		= Database::fetch('SELECT `username`, `password` FROM `' . DATABASE_PREFIX . 'users`', []);
			$databases	= Database::fetch('SHOW DATABASES');
			
			foreach($users AS $user) {
				$permissions = [];
				
				foreach($databases AS $database) {
					if(preg_match('/^' . $user->username . '_/', $database->Database)) {
						$permissions[] = $database->Database;
					}						
				}
				
				if(!empty($permissions)) {
					$this->createPermissions($user, $permissions);
				}
			}
		}
		
		protected function createPermissions($user, $permissions) {
			$connection = 'localhost';
			
			Database::query('CREATE USER IF NOT EXISTS :username@:connection', [
				'username'		=> $user->username,
				'connection'	=> $connection
			]);
			
			Database::query('GRANT USAGE ON *.* TO :username@:connection', [
				'username'		=> $user->username,
				'connection'	=> $connection
			]);
			
			foreach($permissions AS $database) {
				Database::query('GRANT ALL PRIVILEGES ON `' . $database . '`.* TO :username@:connection', [
					'username'		=> $user->username,
					'connection'	=> $connection
				]);
			}
			
			Database::query('ALTER USER :username@:connection IDENTIFIED BY :password', [
				'username'		=> $user->username,
				'password'		=> $user->password,
				'connection'	=> $connection
			]);
			
			Database::query('FLUSH PRIVILEGES');
		}
	}
	
	new PHPMyAdminDaemon();
?>