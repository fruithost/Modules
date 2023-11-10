<?php
	use fruithost\Modules\ModuleInterface;
	use fruithost\Storage\Database;
	use fruithost\Accounting\Auth;
	use fruithost\UI\Button;
	use fruithost\UI\Modal;
	use fruithost\Localization\I18N;
	
	class FTP extends ModuleInterface {
		private $accounts = [];
		
		public function init() {
			$this->accounts = Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'ftp_user` WHERE `user_id`=:user ORDER BY `username` ASC', [
				'user'	=> Auth::getID()
			]);
		}
		
		public function load() {
			$this->addModal((new Modal('create_account', I18N::get('Create FTP Account'), __DIR__ . '/views/create.php'))->addButton([
				(new Button())->setName('cancel')->setLabel('Cancel')->addClass('btn-outline-danger')->setDismissable(),
				(new Button())->setName('create')->setLabel('Create')->addClass('btn-outline-success')
			])->onSave([ $this, 'onCreate' ]));
			
			$this->addModal((new Modal('change_account', I18N::get('Change FTP Account'), __DIR__ . '/views/change.php'))->addButton([
				(new Button())->setName('cancel')->setLabel(I18N::get('Cancel'))->addClass('btn-outline-danger')->setDismissable(),
				(new Button())->setName('update')->setLabel(I18N::get('Update'))->addClass('btn-outline-success')
			])->onSave([ $this, 'onChange' ]));
			
			if(empty($this->accounts)) {
				$this->addButton((new Button())->setName('create')->setLabel(I18N::get('Create'))->addClass('btn-outline-success')->setModal('create_account'));
			} else {
				$this->addButton([
					(new Button())->setName('create')->setLabel(I18N::get('Create New'))->addClass('btn-outline-success')->setModal('create_account'),
					(new Button())->setName('delete')->setLabel(I18N::get('Delete selected'))->addClass('btn-outline-danger')
				]);				
			}
		}
		
		public function onPOST($data = []) {
			if(isset($data['action'])) {
				switch($data['action']) {
					case 'delete':
						if(!isset($data['account'])) {
							$this->assign('error', I18N::get('Please select the FTP account you want to delete!'));
						} else {
							$deletion	= [];
							$stop		= false;
							foreach($data['account'] AS $account_id) {
								if(Database::exists('SELECT * FROM `' . DATABASE_PREFIX . 'ftp_user` WHERE `id`=:account_id AND `user_id`=:user_id LIMIT 1', [
									'account_id'	=> $account_id,
									'user_id'		=> Auth::getID()
								])) {
									$user = Database::single('SELECT * FROM `' . DATABASE_PREFIX . 'ftp_user` WHERE `id`=:account_id LIMIT 1', [
										'account_id'	=> $account_id
									]);
									
									if(empty($user->username)) {
										$stop		= true;
										$this->assign('error', I18N::get('You can\'t delete your main account!'));
									} else {
										$deletion[] = $user;
									}
								} else {
									$stop	= true;
									$unable = Database::exists('SELECT * FROM `' . DATABASE_PREFIX . 'ftp_user` WHERE `id`=:account_id LIMIT 1', [
										'account_id'	=> $account_id
									]);
									
									if(empty($unable)) {
										$this->assign('error', I18N::get('An unknown error has occurred. Please retry your action!'));
									} else if(empty($unable->username)) {
										$this->assign('error', I18N::get('You can\'t delete your main account!'));
									} else {
										$this->assign('error', sprintf(I18N::get('You have no permissions to delete the account <strong>%s_%s</strong>!'), Auth::getUsername($unable->user_id), $unable->username));
									}
									break;
								}
							}
							
							if(!$stop) {
								$users = [];
								
								foreach($deletion AS $account) {
									$users[] = sprintf('%s_%s', Auth::getUsername(), $account->username);
									Database::delete(DATABASE_PREFIX . 'ftp_user', [
										'id'	=> $account->id
									]);
								}
								
								$this->assign('success', sprintf(I18N::get('Following users was deleted: <strong>%s</strong>!'), implode(', ', $users)));
								$this->accounts = Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'ftp_user` WHERE `user_id`=:user ORDER BY `username` ASC', [
									'user'	=> Auth::getID()
								]);
							}
						}
					break;
				}
			}
		}
		
		public function onChange($data = []) {
			if(empty($data['user_id']) || mb_strlen($data['user_id']) <= 0) {
				return I18N::get('An error has occurred. Please reload the page and try again!');
			}
			
			if(!Database::exists('SELECT * FROM `' . DATABASE_PREFIX . 'ftp_user` WHERE `id`=:id AND `user_id`=:user_id LIMIT 1', [
				'id'			=> $data['user_id'],
				'user_id'		=> Auth::getID()
			])) {
				return I18N::get('You have no permission to this FTP account!'); // @ToDo log bad value (because SQL- or XSS-Injection)?
			}
			
			if(empty($data['password']) || mb_strlen($data['password']) <= 0) {
				return I18N::get('Please enter a password for the selected ftp account!');
			}
			
			if(empty($data['path']) || mb_strlen($data['path']) <= 0) {
				return I18N::get('Please select an valid path for the account!');
			}
			
			$path = sprintf('%s%s%s', HOST_PATH, Auth::getUsername(), $data['path']);
			
			if(!file_exists($path)) {
				return I18N::get('The selected path doesn\'t exists!');
			}
			
			Database::update(DATABASE_PREFIX . 'ftp_user', [ 'id', 'user_id' ], [
				'id'			=> $data['user_id'],
				'user_id'		=> Auth::getID(),
				'password'		=> $data['password'],
				'path'			=> $path,
				'time_modified'	=> date('Y-m-d H:i:s', time())
			]);
			
			return true;
		}
		
		public function onCreate($data = []) {
			if(empty($data['username']) || mb_strlen($data['username']) <= 0) {
				return I18N::get('Please enter a username for your ftp account!');
			}
			
			if(empty($data['password']) || mb_strlen($data['password']) <= 0) {
				return I18N::get('Please enter a password for your ftp account!');
			}
			
			if(empty($data['path']) || mb_strlen($data['path']) <= 0) {
				return I18N::get('Please select an valid path for the account!');
			}
			
			$path = sprintf('%s%s%s', HOST_PATH, Auth::getUsername(), $data['path']);
			
			if(!file_exists($path)) {
				return I18N::get('The selected path doesn\'t exists!');
			}
			
			$id = Database::insert(DATABASE_PREFIX . 'ftp_user', [
				'id'			=> null,
				'user_id'		=> Auth::getID(),
				'username'		=> $data['username'],
				'password'		=> $data['password'],
				'path'			=> $path,
				'time_login'	=> NULL,
				'time_modified'	=> NULL,
				'time_created'	=> date('Y-m-d H:i:s', time()),
			]);
			
			return true;
		}
		
		public function content() {
			if(empty($this->accounts)) {
				require_once('views/empty.php');
			} else {
				require_once('views/list.php');
			}
		}
	}
?>