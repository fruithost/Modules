<?php
	use fruithost\Modules\ModuleInterface;
	use fruithost\Storage\Database;
	use fruithost\Accounting\Auth;
	use fruithost\UI\Button;
	use fruithost\UI\Modal;
	use fruithost\Security\Encryption;
	use fruithost\Localization\I18N;
	
	class ProtectedDirectorys extends ModuleInterface {
		private $directorys	= [];
		private $directory	= [];
		private $users		= [];
		
		public function init() {}
		
		public function load() {
			if(isset($_GET['users'])) {
				$this->directory = Database::single('SELECT * FROM `' . DATABASE_PREFIX . 'protected_directorys` WHERE `user_id`=:user AND `id`=:id AND `time_deleted` IS NULL LIMIT 1', [
					'user'	=> Auth::getID(),
					'id'	=> (isset($_GET['users']) ? $_GET['users'] : NULL)
				]);
				
				$this->users = Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'protected_users` WHERE `directory`=:directory', [
					'directory'	=> $_GET['users']
				]);
				
				foreach($this->users AS $index => $user) {
					$this->users[$index]->password = Encryption::decrypt($user->password, ENCRYPTION_SALT);
				}
			}
			
			$this->addModal((new Modal('create_protected_directory', I18N::get('Create protected Directory'), __DIR__ . '/views/create.php'))->addButton([
				(new Button())->setName('cancel')->setLabel(I18N::get('Cancel'))->addClass('btn-outline-danger')->setDismissable(),
				(new Button())->setName('create')->setLabel(I18N::get('Create'))->addClass('btn-outline-success')
			])->onSave([ $this, 'onCreate' ]));
			
			$this->addModal((new Modal('change_protected_directory', I18N::get('Change protected Directory'), __DIR__ . '/views/change.php'))->addButton([
				(new Button())->setName('cancel')->setLabel(I18N::get('Cancel'))->addClass('btn-outline-danger')->setDismissable(),
				(new Button())->setName('update')->setLabel(I18N::get('Update'))->addClass('btn-outline-success')
			])->onSave([ $this, 'onChange' ]));
			
			$this->addModal((new Modal('create_protected_directory_user', I18N::get('Create User'), __DIR__ . '/views/create_user.php', [
				'directory'	=> $this->directory
			]))->addButton([
				(new Button())->setName('cancel')->setLabel(I18N::get('Cancel'))->addClass('btn-outline-danger')->setDismissable(),
				(new Button())->setName('update')->setLabel(I18N::get('Create'))->addClass('btn-outline-success')
			])->onSave([ $this, 'onCreateUser' ]));
			
			$this->addModal((new Modal('change_protected_directory_user', I18N::get('Change User'), __DIR__ . '/views/change_user.php'))->addButton([
				(new Button())->setName('cancel')->setLabel(I18N::get('Cancel'))->addClass('btn-outline-danger')->setDismissable(),
				(new Button())->setName('update')->setLabel(I18N::get('Update'))->addClass('btn-outline-success')
			])->onSave([ $this, 'onChangeUser' ]));
			
			$this->directorys = Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'protected_directorys` WHERE `user_id`=:user AND `time_deleted` IS NULL', [
				'user'	=> Auth::getID()
			]);
			
			if(isset($_GET['users'])) {
				if(empty($this->users)) {
					$this->addButton((new Button())->setName('create')->setLabel(I18N::get('Create'))->addClass('btn-outline-success')->setModal('create_protected_directory_user'));
				} else {
					$this->addButton([
						(new Button())->setName('create')->setLabel(I18N::get('Create New'))->addClass('btn-outline-success')->setModal('create_protected_directory_user'),
						(new Button())->setName('delete')->setLabel(I18N::get('Delete selected'))->addClass('btn-outline-danger')
					]);				
				}
			} else {
				if(empty($this->directorys)) {
					$this->addButton((new Button())->setName('create')->setLabel(I18N::get('Create'))->addClass('btn-outline-success')->setModal('create_protected_directory'));
				} else {
					$this->addButton([
						(new Button())->setName('create')->setLabel(I18N::get('Create New'))->addClass('btn-outline-success')->setModal('create_protected_directory'),
						(new Button())->setName('delete')->setLabel(I18N::get('Delete selected'))->addClass('btn-outline-danger')
					]);				
				}
			}
		}
		
		public function onPOST($data = []) {
			if(isset($data['action'])) {
				switch($data['action']) {
					case 'delete':
						if(isset($data['protected_directory_user'])) {
							$deletion	= [];
							$stop		= false;
							
							foreach($data['protected_directory_user'] AS $user_id) {
								if(Database::exists('SELECT * FROM `' . DATABASE_PREFIX . 'protected_users` WHERE `id`=:user_id LIMIT 1', [
									'user_id'		=> $user_id
								])) {
									$deletion[] = Database::single('SELECT * FROM `' . DATABASE_PREFIX . 'protected_users` WHERE `id`=:user_id LIMIT 1', [
										'user_id'	=> $user_id
									]);
								} else {
									$stop	= true;
									$unable = Database::single('SELECT * FROM `' . DATABASE_PREFIX . 'protected_users` WHERE `id`=:user_id LIMIT 1', [
										'user_id'	=> $user_id
									]);
									
									if(empty($unable)) {
										$this->assign('error', I18N::get('An unknown error has occurred. Please retry your action!'));
									} else {
										$this->assign('error', sprintf(I18N::get('You have no permissions to delete the User <strong>%s</strong>!'), $unable->username));
									}
									break;
								}
							}
							
							if(!$stop) {
								$users = [];
								
								foreach($deletion AS $user) {
									$users[] = $user->username;
									
									Database::delete(DATABASE_PREFIX . 'protected_users', [
										'id'			=> $user->id
									]);
								}
								
								$this->assign('success', sprintf(I18N::get('Following Users was deleted: <strong><br />- %s</strong>'), implode('<br />- ', $users)));
							}
							
							$this->users = Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'protected_users` WHERE `directory`=:directory', [
								'directory'	=> $_GET['users']
							]);
							
							foreach($this->users AS $index => $user) {
								$this->users[$index]->password = Encryption::decrypt($user->password, ENCRYPTION_SALT);
							}
						} else {
							if(!isset($data['protected_directory'])) {
								$this->assign('error', I18N::get('Please select an protected Directory you want to delete!'));
							} else {
								$deletion	= [];
								$stop		= false;
								
								foreach($data['protected_directory'] AS $directory_id) {
									if(Database::exists('SELECT * FROM `' . DATABASE_PREFIX . 'protected_directorys` WHERE `id`=:directory AND `user_id`=:user_id LIMIT 1', [
										'directory'		=> $directory_id,
										'user_id'		=> Auth::getID()
									])) {
										$deletion[] = Database::single('SELECT * FROM `' . DATABASE_PREFIX . 'protected_directorys` WHERE `id`=:directory LIMIT 1', [
											'directory'	=> $directory_id
										]);
									} else {
										$stop	= true;
										$unable = Database::exists('SELECT * FROM `' . DATABASE_PREFIX . 'protected_directorys` WHERE `id`=:directory LIMIT 1', [
											'directory'	=> $directory_id
										]);
										
										if(empty($unable)) {
											$this->assign('error', I18N::get('An unknown error has occurred. Please retry your action!'));
										} else {
											$this->assign('error', sprintf(I18N::get('You have no permissions to delete the directory <strong>%s_%s</strong>!'), $unable->path));
										}
										break;
									}
								}
								
								if(!$stop) {
									$directorys = [];
									
									foreach($deletion AS $directory) {
										$directorys[] = $directory->path;
										
										Database::update(DATABASE_PREFIX . 'protected_directorys', 'id', [
											'id'			=> $directory->id,
											'time_deleted'	=> date('Y-m-d H:i:s', time())
										]);
									}
									
									$this->assign('success', sprintf(I18N::get('Following protected directorys was deleted: <strong><br />- %s</strong>'), implode('<br />- ', $directorys)));
								}
								
								$this->directorys = Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'protected_directorys` WHERE `user_id`=:user AND `time_deleted` IS NULL', [
									'user'	=> Auth::getID()
								]);
							}
						}
					break;
				}
			}
		}
		
		public function onCreate($data = []) {			
			if(!isset($data['protected_directory_message']) || mb_strlen($data['protected_directory_message']) <= 0) {
				return I18N::get('Please enter a message as login information!');
			}
			
			if(!isset($data['protected_directory_path']) || mb_strlen($data['protected_directory_path']) <= 0) {
				return I18N::get('Please select an valid path!');
			}
			
			$path = sprintf('%s%s%s', HOST_PATH, Auth::getUsername(), $data['protected_directory_path']);
			
			if(!file_exists($path)) {
				return I18N::get('The selected path doesn\'t exists!');
			}
			
			$id = Database::insert(DATABASE_PREFIX . 'protected_directorys', [
				'id'			=> null,
				'user_id'		=> Auth::getID(),
				'path'			=> $data['protected_directory_path'],
				'message'		=> $data['protected_directory_message'],
				'time_created'	=> NULL,
				'time_deleted'	=> NULL
			]);
			
			return true;
		}
		
		public function onChange($data = []) {			
			if(!isset($data['protected_directory_id']) || mb_strlen($data['protected_directory_id']) <= 0) {
				return I18N::get('An error has occurred. Please reload the page and try again!');
			}
			
			if(!Database::exists('SELECT * FROM `' . DATABASE_PREFIX . 'protected_directorys` WHERE `id`=:id AND `user_id`=:user_id LIMIT 1', [
				'id'			=> $data['protected_directory_id'],
				'user_id'		=> Auth::getID()
			])) {
				return I18N::get('You have no permission to this entry!'); // @ToDo log bad value (because SQL- or XSS-Injection)?
			}
			
			if(!isset($data['protected_directory_message']) || mb_strlen($data['protected_directory_message']) <= 0) {
				return I18N::get('Please enter a message as login information!');
			}
			
			if(!isset($data['protected_directory_path']) || mb_strlen($data['protected_directory_path']) <= 0) {
				return I18N::get('Please select an valid path!');
			}
			
			$path = sprintf('%s%s%s', HOST_PATH, Auth::getUsername(), $data['protected_directory_path']);
			
			if(!file_exists($path)) {
				return I18N::get('The selected path doesn\'t exists!');
			}
			
			Database::update(DATABASE_PREFIX . 'protected_directorys', [ 'id', 'user_id' ], [
				'id'			=> $data['protected_directory_id'],
				'user_id'		=> Auth::getID(),
				'path'			=> $data['protected_directory_path'],
				'message'		=> $data['protected_directory_message'],
				'time_created'	=> NULL
			]);
			
			return true;
		}
		
		public function onCreateUser($data = []) {
			if(!isset($data['protected_directory_id']) || mb_strlen($data['protected_directory_id']) <= 0) {
				return I18N::get('An error has occurred. Please reload the page and try again!');
			}
			
			if(!Database::exists('SELECT * FROM `' . DATABASE_PREFIX . 'protected_directorys` WHERE `user_id`=:user AND `id`=:id AND `time_deleted` IS NULL LIMIT 1', [
				'user'	=> Auth::getID(),
				'id'	=> $data['protected_directory_id']
			])) {
				return I18N::get('You have no access to this protected Directory!');
			}
			
			if(!isset($data['protected_directory_username']) || mb_strlen($data['protected_directory_username']) <= 0) {
				return I18N::get('Please enter a username!');
			}
			
			if(!isset($data['protected_directory_password']) || mb_strlen($data['protected_directory_password']) <= 0) {
				return I18N::get('Please enter a password!');
			}
			
			$id = Database::insert(DATABASE_PREFIX . 'protected_users', [
				'id'			=> null,
				'directory'		=> $data['protected_directory_id'],
				'username'		=> $data['protected_directory_username'],
				'password'		=> Encryption::encrypt($data['protected_directory_password'], ENCRYPTION_SALT),
				'time_created'	=> date('Y-m-d H:i:s', time())
			]);
			
			return true;
		}
		
		public function onChangeUser($data = []) {
			if(!isset($data['protected_directory_id']) || mb_strlen($data['protected_directory_id']) <= 0) {
				return I18N::get('An error has occurred. Please reload the page and try again!');
			}
			
			if(!Database::exists('SELECT * FROM `' . DATABASE_PREFIX . 'protected_directorys` WHERE `user_id`=:user AND `id`=:id AND `time_deleted` IS NULL LIMIT 1', [
				'user'	=> Auth::getID(),
				'id'	=> $data['protected_directory_id']
			])) {
				return I18N::get('You have no access to this protected Directory!');
			}
			
			if(!isset($data['protected_directory_user_id']) || mb_strlen($data['protected_directory_user_id']) <= 0) {
				return I18N::get('An error has occurred. Please reload the page and try again!');
			}
			
			if(!Database::exists('SELECT * FROM `' . DATABASE_PREFIX . 'protected_users` WHERE `directory`=:directory AND `id`=:id LIMIT 1', [
				'directory'	=> $data['protected_directory_id'],
				'id'		=> $data['protected_directory_user_id']
			])) {
				return I18N::get('You have no access to this protected Directory!');
			}
			
			if(!isset($data['protected_directory_password']) || mb_strlen($data['protected_directory_password']) <= 0) {
				return I18N::get('Please enter a password!');
			}
			
			Database::update(DATABASE_PREFIX . 'protected_users', [ 'id', 'directory' ], [
				'id'			=> $data['protected_directory_user_id'],
				'directory'		=> $data['protected_directory_id'],
				'password'		=> Encryption::encrypt($data['protected_directory_password'], ENCRYPTION_SALT)
			]);
			
			return true;
		}
		
		public function content() {
			if(isset($_GET['users'])) {
				if(empty($this->users)) {
					require_once('views/empty_users.php');
				} else {
					require_once('views/list_users.php');
				}
			} else {
				if(empty($this->directorys)) {
					require_once('views/empty.php');
				} else {
					require_once('views/list.php');
				}
			}
		}
	}
?>