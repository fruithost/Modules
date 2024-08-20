<?php
	use fruithost\Modules\ModuleInterface;
	use fruithost\Storage\Database;
	use fruithost\Storage\DatabaseFactory;
	use fruithost\Accounting\Auth;
	use fruithost\Network\Response;
	use fruithost\Accounting\Session;
	use fruithost\UI\Icon;
	use fruithost\Localization\I18N;
	
	class PHPMyAdmin extends ModuleInterface {
		private $connection	= null;
		private $users		= [];
		
		public function init() : void {
			$this->users		= Database::fetch('SELECT
				`' . DATABASE_PREFIX . 'mysql_users`.*,
				`' . DATABASE_PREFIX . 'mysql_databases`.`name` AS `database`
			FROM
				`' . DATABASE_PREFIX . 'mysql_users`,
				`' . DATABASE_PREFIX . 'mysql_databases`
			WHERE
				`' . DATABASE_PREFIX . 'mysql_users`.`user_id`=:user
			AND
				`' . DATABASE_PREFIX . 'mysql_databases`.`id`=`' . DATABASE_PREFIX . 'mysql_users`.`database`
			ORDER BY
				`' . DATABASE_PREFIX . 'mysql_users`.`name`
			ASC', [
				'user'	=> Auth::getID()
			]);
			
			if(Auth::isLoggedIn()) {
				if($this->getSettings('LOGIN', 'USER') === 'USER') {
					$user = Database::single('SELECT `password` FROM `' . DATABASE_PREFIX . 'users` WHERE `id`=:id LIMIT 1', [
						'id'	=> Auth::getID()
					]);
					
					$_SESSION['PMA_single_signon_user']			= Auth::getUsername();
					$_SESSION['PMA_single_signon_password']		= $user->password;
					$_SESSION['PMA_single_signon_host']			= DATABASE_HOSTNAME;
					$_SESSION['PMA_single_signon_port']			= DATABASE_PORT;
					
					Session::set('PMA_DESTINATION', 'localhost');
				} else {
					$_SESSION['PMA_single_signon_user']			= NULL;
					$_SESSION['PMA_single_signon_password']		= NULL;
					Session::remove('PMA_DESTINATION');
				}
			}
			
			if($this->getSettings('VIEW', 'IFRAME') !== 'IFRAME' && $this->getSettings('LOGIN', 'USER') === 'USER') {
				$this->addFilter('URL_' . $this->getInstance()->getInfo()->getName(), function($url) {
					return $this->url('/app/phpmyadmin/www/');
				});
				
				$this->addFilter('TARGET_' . $this->getInstance()->getInfo()->getName(), function($url) {
					return '_blank';
				});
			}
		}
		
		public function load() : void {
			if(isset($_GET['error'])) {
				switch($_GET['error']) {
					case 'auth':
						$this->assign('error', 'There was a problem with the user\'s authentication. Please retry the login!');
					break;
				}
			}
		}
		
		public function onSettings($data = []) : void {
			if(isset($data['VIEW'])) {
				if(in_array($data['VIEW'], [
					'IFRAME',
					'EXTERNAL'
				])) {
					$this->setSettings('VIEW', $data['VIEW']);
				}
			}
			
			if(isset($data['LOGIN'])) {
				if(in_array($data['LOGIN'], [
					'USER',
					'SELECTION'
				])) {
					$this->setSettings('LOGIN', $data['LOGIN']);
				}
			}
			
			$this->getTemplate()->assign('success', 'Settings was successfully saved!');
		}
		
		public function frame() : mixed {
			try {
				if(Database::count('SHOW GRANTS FOR :username@:connection;', [
					'username'		=> $_SESSION['PMA_single_signon_user'],
					'connection'	=> Session::get('PMA_DESTINATION')
				]) <= 0) {
					return null;
				}
				
				if($this->getSettings('VIEW', 'IFRAME') === 'IFRAME') {
					return $this->url('/app/phpmyadmin/www/');
				}
			} catch(\PDOException $e) {
				return null;
			}
			
			return false;
		}
		
		public function onPOST($data = []) : void {
			if($this->getSettings('LOGIN', 'USER') === 'SELECTION') {
				$found = NULL;
			
				if(empty($data['user'])) {
					$this->assign('error', 'Please select an valid MySQL User!');
					return;
				}
				
				foreach($this->users AS $user) {
					if($data['user'] === $user->id) {
						$found = $user;
						break;
					}
				}
				
				if(empty($found)) {
					$this->assign('error', 'Please select an valid MySQL User!');
					return;
				}
				
				$_SESSION['PMA_single_signon_user']			= sprintf('%s_%s', Auth::getUsername(), $found->name);
				$_SESSION['PMA_single_signon_password']		= $found->password;
				$_SESSION['PMA_single_signon_host']			= DATABASE_HOSTNAME;
				$_SESSION['PMA_single_signon_port']			= DATABASE_PORT;
				
				switch($found->connection) {
					case 'LOCAL':
						Session::set('PMA_DESTINATION', 'localhost');
					break;
					case 'GLOBAL':
						Session::set('PMA_DESTINATION', '%');
					break;
					default:
						Session::remove('PMA_DESTINATION');
					break;
				}
				
				if(isset($_GET['error'])) {
					Response::redirect($this->url('/app/phpmyadmin/www'));
				}
			}
		}
		
		public function content() : void {
			$empty = true;
			try {
				$empty = (Database::count('SHOW GRANTS FOR :username@:connection;', [
					'username'		=> $_SESSION['PMA_single_signon_user'],
					'connection'	=> Session::get('PMA_DESTINATION')
				]) <= 0);
			} catch(\PDOException $e) {
				
			}
			
			if($this->getSettings('LOGIN', 'USER') === 'SELECTION') {
				?>
					<div class="container">
						<div class="col-6 offset-3">
							<div class="form-group row">
								<div class="col-12">
									Please select a MySQL user you would like to log in with:
								</div>
							</div>
							<div class="form-group row">
								<label for="user" class="col-4 col-form-label col-form-label-sm">Username:</label>
								<div class="col-8 form-check">
									<select class="form-control" id="user" name="user">
										<?php
											foreach($this->users AS $user) {
												$connection = '';
												
												switch($user->connection) {
													case 'LOCAL':
														$connection = 'localhost';
													break;
													case 'GLOBAL':
														$connection = '%';
													break;
												}
												
												printf('<option value="%d">%s_%s@%s</option>', $user->id, Auth::getUsername(), $user->name, $connection);
											}
										?>
									</select>
								</div>
							</div>
							<div class="form-group row">
								<div class="offset-4 col-8 form-check">
									<button name="login" class="btn btn-primary">Login</button>
								</div>
							</div>
						</div>
					</div>
				<?php
				if(isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST' && $this->getSettings('VIEW', 'IFRAME') !== 'IFRAME') {
					if(!isset($_GET['error'])) {
						?>
							<script type="text/javascript">
								window.onload = function onLoad() {
									window.open('<?php print $this->url('/app/phpmyadmin/www'); ?>', '_blank');
								};
							</script>
						<?php
					}
				}
			} else if($empty) {
				?>
					<div class="jumbotron text-center bg-transparent text-muted">
						<?php Icon::show('smiley-bad'); ?>
						<h2><?php I18N::__('No Databases available!'); ?></h2>
						<p class="lead"><?php I18N::__('You need a database, if you wan\'t to use PHPMyAdmin!'); ?></p>
						<button type="button" name="create" data-bs-toggle="modal" data-bs-target="#create_databases" class="btn btn-lg btn-primary mt-4"><?php I18N::__('Create new Database'); ?></button>
					</div>
				<?php
			}
		}
	}
?>