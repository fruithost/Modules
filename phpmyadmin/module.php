<?php
	use fruithost\ModuleInterface;
	use fruithost\Database;
	use fruithost\Auth;
	
	class PHPMyAdmin extends ModuleInterface {
		public function init() {
			if(Auth::isLoggedIn()) {
				$user = Database::single('SELECT `password` FROM `fh_users` WHERE `id`=:id LIMIT 1', [
					'id'	=> Auth::getID()
				]);
				
				$_SESSION['PMA_single_signon_user']		= Auth::getUsername();
				$_SESSION['PMA_single_signon_password']	= $user->password;
				$_SESSION['PMA_single_signon_host']		= DATABASE_HOSTNAME;
				$_SESSION['PMA_single_signon_port']		= DATABASE_PORT;
			}
		}
		
		public function frame() {
			if(Database::count('SHOW GRANTS FOR :username@:connection;', [
				'username'		=> Auth::getUsername(),
				'connection'	=> 'localhost'
			]) <= 0) {
				return null;
			}
			
			return $this->url('/module/phpmyadmin/www/');
		}
		
		public function content() {
			?>
				<div class="jumbotron text-center bg-transparent text-muted">
					<i class="material-icons">sentiment_very_dissatisfied</i>
					<h2>No Databases available!</h2>
					<div class="alert alert-danger d-inline-block mt-4" role="alert">
						You need a database, if you wan't to use PHPMyAdmin!
					</div>
				</div>
			<?php
		}
	}
?>