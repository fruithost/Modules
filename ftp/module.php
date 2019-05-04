<?php
	use fruithost\ModuleInterface;
	use fruithost\Database;
	use fruithost\Auth;
	use fruithost\Button;
	use fruithost\Modal;
	
	class FTP extends ModuleInterface {
		private $accounts = [];
		
		public function init() {
			$this->addModal((new Modal('create_account', 'Create FTP Account', __DIR__ . '/views/create.php'))->addButton([
				(new Button())->setName('cancel')->setLabel('Cancel')->addClass('btn-outline-danger')->setDismissable(),
				(new Button())->setName('create')->setLabel('Create')->addClass('btn-outline-success')
			])->onSave([ $this, 'onSave' ]));
			
			$this->accounts = Database::fetch('SELECT * FROM `fh_ftp_user` WHERE `user_id`=:user ORDER BY `username` ASC', [
				'user'	=> Auth::getID()
			]);
		}
		
		public function load() {
			if(empty($this->accounts)) {
				$this->addButton((new Button())->setName('create')->setLabel('Create')->addClass('btn-outline-success')->setModal('create_account'));
			} else {
				$this->addButton([
					(new Button())->setName('create')->setLabel('Create New')->addClass('btn-outline-success')->setModal('create_account'),
					(new Button())->setName('delete')->setLabel('Delete selected')->addClass('btn-outline-danger')
				]);				
			}
		}
		
		public function onSave($data = []) {
			if(empty($data['username']) || mb_strlen($data['username']) <= 0) {
				return 'Please enter a username for your ftp account!';
			}
			
			if(empty($data['password']) || mb_strlen($data['password']) <= 0) {
				return 'Please enter a password for your ftp account!';
			}
			
			if(empty($data['path']) || mb_strlen($data['path']) <= 0) {
				return 'Please select an valid path for the account!';
			}
			
			$path = sprintf('%s%s%s', HOST_PATH, Auth::getUsername(), $data['path']);
			
			if(!file_exists($path)) {
				return 'The selected path doesn\'t exists!';
			}
			
			$id = fruithost\Database::insert('fh_ftp_user', [
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