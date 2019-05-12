<?php
	use fruithost\ModuleInterface;
	use fruithost\Auth;
	use fruithost\Modal;
	use fruithost\Button;
	
	class Database extends ModuleInterface {
		private $databases	= [];
		private $users		= [];
		
		public function init() {
			$this->databases = fruithost\Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'mysql_databases` WHERE `user_id`=:user ORDER BY `name` ASC', [
				'user'	=> Auth::getID()
			]);
			
			$this->users = fruithost\Database::fetch('SELECT
				`' . DATABASE_PREFIX . 'mysql_users`.*,
				`' . DATABASE_PREFIX . 'mysql_databases`.`name` AS `database`
			FROM
				`' . DATABASE_PREFIX . 'mysql_users`,
				`' . DATABASE_PREFIX . 'mysql_databases`
			WHERE
				`' . DATABASE_PREFIX . 'mysql_users`.`user_id`=:user
			AND
				`' . DATABASE_PREFIX . 'mysql_databases`.`id`=`fh_mysql_users`.`database`
			ORDER BY
				`' . DATABASE_PREFIX . 'mysql_users`.`name`
			ASC', [
				'user'	=> Auth::getID()
			]);
			
			$this->addModal((new Modal('create_databases', 'Create Database', __DIR__ . '/views/database_create.php'))->addButton([
				(new Button())->setName('cancel')->setLabel('Cancel')->addClass('btn-outline-danger')->setDismissable(),
				(new Button())->setName('create')->setLabel('Create')->addClass('btn-outline-success')
			])->onSave([ $this, 'onSaveDatabase' ]));
			
			$this->addModal((new Modal('create_users', 'Create User', __DIR__ . '/views/user_create.php', [
				'databases'	=> $this->databases
			]))->addButton([
				(new Button())->setName('cancel')->setLabel('Cancel')->addClass('btn-outline-danger')->setDismissable(),
				(new Button())->setName('create')->setLabel('Create')->addClass('btn-outline-success')
			])->onSave([ $this, 'onSaveUser' ]));
			
			$this->addFilter('DATABASE_MANAGEMENT', function($entries) {
				$entries[] = (object) [
					'name'		=> 'Users',
					'icon'		=> '<i class="material-icons">group</i>',
					'order'		=> 2,
					'url'		=> '/module/database/users',
					'active'	=> $this->getCore()->getRouter()->is('/module/database/users')
				];
				
				return $entries;
			});
		}
		
		public function load($submodule = null) {
			if(empty($submodule)) {
				$submodule = 'databases';
			}
			
			if(empty($this->domains)) {
				$this->addButton((new Button())->setName('create')->setLabel('Create')->addClass('btn-outline-success')->setModal('create_' . $submodule));
			} else {
				$this->addButton([
					(new Button())->setName('create')->setLabel('Create New')->addClass('btn-outline-success')->setModal('create_' . $submodule),
					(new Button())->setName('delete')->setLabel('Delete selected')->addClass('btn-outline-danger')
				]);				
			}
		}
		
		public function onSaveUser($data) {
			if(empty($data['username']) || mb_strlen($data['username']) <= 0) {
				return 'Please enter a username for your database account!';
			}
			
			if(empty($data['database']) || mb_strlen($data['database']) <= 0) {
				return 'Please select an existing database!';
			}
			
			$connection	= NULL;
			
			switch($data['connection']) {
				case '%':
					$connection = 'GLOBAL';
				break;
				case 'localhost':
					$connection = 'LOCAL';
				break;
				default:
					return 'Please select an valid connection type!';
				break;
			}
			
			$id = fruithost\Database::insert(DATABASE_PREFIX . 'mysql_users', [
				'id'			=> null,
				'user_id'		=> Auth::getID(),
				'database'		=> $data['database'],
				'connection'	=> $connection,
				'name'			=> $data['username'],
				'time_created'	=> NULL,
				'time_deleted'	=> NULL
			]);
			
			return true;
		}
		
		public function onSaveDatabase($data) {
			if(empty($data['name']) || mb_strlen($data['name']) <= 0) {
				return 'Please enter a name for your database!';
			}
			
			$name = sprintf('%s_%s', Auth::getUsername(), $data['name']);
			
			$id = fruithost\Database::insert(DATABASE_PREFIX . 'mysql_databases', [
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