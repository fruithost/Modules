<?php
	use fruithost\Modules\ModuleInterface;
	use fruithost\Accounting\Auth;
	use fruithost\UI\Button;
	use fruithost\UI\Icon;
	use fruithost\UI\Modal;
	use fruithost\Network\Response;
	use fruithost\Security\Encryption;
	use fruithost\Localization\I18N;
	
	class Database extends ModuleInterface {
		private $databases	= [];
		private $users		= [];
		
		public function init() : void {
			$this->databases = fruithost\Storage\Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'mysql_databases` WHERE `user_id`=:user ORDER BY `name` ASC', [
				'user'	=> Auth::getID()
			]);
			
			$this->addModal((new Modal('create_databases', I18N::get('Create Database'), __DIR__ . '/views/database_create.php'))->addButton([
				(new Button())->setName('cancel')->setLabel(I18N::get('Cancel'))->addClass('btn-outline-danger')->setDismissable(),
				(new Button())->setName('create')->setLabel(I18N::get('Create'))->addClass('btn-outline-success')
			])->onSave([ $this, 'onSaveDatabase' ]));
			
			$this->addModal((new Modal('create_users', I18N::get('Create user'), __DIR__ . '/views/user_create.php', [
				'databases'	=> $this->databases
			]))->addButton([
				(new Button())->setName('cancel')->setLabel(I18N::get('Cancel'))->addClass('btn-outline-danger')->setDismissable(),
				(new Button())->setName('create')->setLabel(I18N::get('Create'))->addClass('btn-outline-success')
			])->onSave([ $this, 'onSaveUser' ]));
			
			$this->users = fruithost\Storage\Database::fetch('SELECT
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
			
			foreach($this->users AS $index => $user) {
				$this->users[$index]->password = Encryption::decrypt($user->password, ENCRYPTION_SALT);
			}
			
			$this->addFilter('DATABASE_MANAGEMENT', function($entries) {
				$entries[] = (object) [
					'name'		=> I18N::get('Databases'),
					'icon'		=> Icon::render('database'),
					'order'		=> 1,
					'url'		=> '/module/mysql/databases',
					'active'	=> $this->getCore()->getRouter()->is('/module/mysql/databases')
				];
				
				$entries[] = (object) [
					'name'		=> I18N::get('Users'),
					'icon'		=> Icon::render('users'),
					'order'		=> 2,
					'url'		=> '/module/mysql/users',
					'active'	=> $this->getCore()->getRouter()->is('/module/mysql/users')
				];
				
				return $entries;
			});
		}
		
		public function load($submodule = null) : void {
			if(empty($submodule)) {
				$submodule = 'databases';
				Response::redirect('/module/mysql/' . $submodule);
				return;
			}
			
			switch($submodule) {
				case 'databases':
					$this->addFilter('SUBMODULE_NAME', function($title) {
						return I18N::get('Databases');
					});
					
					if(empty($this->databases)) {
						$this->addButton((new Button())->setName('create')->setLabel(I18N::get('Create'))->addClass('btn-outline-success')->setModal('create_' . $submodule));
					} else {
						$this->addButton([
							(new Button())->setName('create')->setLabel(I18N::get('Create new'))->addClass('btn-outline-success')->setModal('create_' . $submodule),
							(new Button())->setName('delete')->setLabel(I18N::get('Delete selected'))->addClass('btn-outline-danger')
						]);				
					}
				break;
				case 'users':
					$this->addFilter('SUBMODULE_NAME', function($title) {
						return I18N::get('Users');
					});
					
					if(empty($this->users)) {
						$this->addButton((new Button())->setName('create')->setLabel(I18N::get('Create'))->addClass('btn-outline-success')->setModal('create_' . $submodule));
					} else {
						$this->addButton([
							(new Button())->setName('create')->setLabel(I18N::get('Create new'))->addClass('btn-outline-success')->setModal('create_' . $submodule),
							(new Button())->setName('delete')->setLabel(I18N::get('Delete selected'))->addClass('btn-outline-danger')
						]);				
					}
				break;
			}
		}
		
		public function onSaveUser($data) {
			if(!isset($data['mysql_user_username']) || mb_strlen($data['mysql_user_username']) <= 0) {
				return I18N::get('Please enter a username for your database account!');
			}
			
			if(!isset($data['mysql_user_password']) || mb_strlen($data['mysql_user_password']) <= 0) {
				return I18N::get('Please enter a username for your database account!');
			}
			
			if(!isset($data['mysql_user_database']) || mb_strlen($data['mysql_user_database']) <= 0) {
				return I18N::get('Please select an existing database!');
			}
			
			$connection	= NULL;
			
			switch($data['mysql_user_connection']) {
				case '%':
					$connection = 'GLOBAL';
				break;
				case 'localhost':
					$connection = 'LOCAL';
				break;
				default:
					return I18N::get('Please select an valid connection type!');
				break;
			}
			
			$id = fruithost\Storage\Database::insert(DATABASE_PREFIX . 'mysql_users', [
				'id'			=> null,
				'user_id'		=> Auth::getID(),
				'database'		=> $data['mysql_user_database'],
				'connection'	=> $connection,
				'name'			=> $data['mysql_user_username'],
				'password'		=> Encryption::encrypt($data['mysql_user_password'], ENCRYPTION_SALT),
				'time_created'	=> NULL,
				'time_deleted'	=> NULL
			]);
			
			return true;
		}
		
		public function onSaveDatabase($data) {
			if(!isset($data['name']) || mb_strlen($data['name']) <= 0) {
				return I18N::get('Please enter a name for your database!');
			}
			
			$name = sprintf('%s_%s', Auth::getUsername(), $data['name']);
			
			$id = fruithost\Storage\Database::insert(DATABASE_PREFIX . 'mysql_databases', [
				'id'			=> null,
				'user_id'		=> Auth::getID(),
				'name'			=> $data['name'],
				'time_created'	=> NULL,
				'time_deleted'	=> NULL
			]);
			
			return true;
		}
		
		public function content($submodule = null) {
			switch($submodule) {
				case 'users':
					if(empty($this->users)) {
						require_once('views/users_empty.php');
					} else {
						require_once('views/users_list.php');
					}
				break;
				default:
					if(empty($this->databases)) {
						require_once('views/databases_empty.php');
					} else {
						require_once('views/databases_list.php');
					}
				break;
			}
		}
	}
?>