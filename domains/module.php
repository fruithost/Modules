<?php
	use fruithost\ModuleInterface;
	use fruithost\Database;
	use fruithost\Auth;
	use fruithost\Button;
	use fruithost\Modal;
	
	class Domains extends ModuleInterface {
		private $domains = [];
		
		public function init() {
			$this->addModal((new Modal('create_domain', 'Create Domain', __DIR__ . '/views/create.php'))->addButton([
				(new Button())->setName('cancel')->setLabel('Cancel')->addClass('btn-outline-danger')->setDismissable(),
				(new Button())->setName('create')->setLabel('Create')->addClass('btn-outline-success')
			])->onSave([ $this, 'onSave' ]));
			
			$this->domains = Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'domains` WHERE `user_id`=:user AND `type`=\'DOMAIN\' ORDER BY `name` ASC', [
				'user'	=> Auth::getID()
			]);
		}
		
		public function load() {
			if(empty($this->domains)) {
				$this->addButton((new Button())->setName('create')->setLabel('Create')->addClass('btn-outline-success')->setModal('create_domain'));
			} else {
				$this->addButton([
					(new Button())->setName('create')->setLabel('Create New')->addClass('btn-outline-success')->setModal('create_domain'),
					(new Button())->setName('delete')->setLabel('Delete selected')->addClass('btn-outline-danger')
				]);				
			}
		}
		
		public function onPOST($data = []) {
			if(isset($data['action'])) {
				switch($data['action']) {
					case 'delete':
						if(!isset($data['domain'])) {
							$this->assign('error', 'Please select the Domains you want to delete!');
						} else {
							$deletion	= [];
							$stop		= false;
							foreach($data['domain'] AS $domain_id) {
								$domain = Database::single('SELECT * FROM `' . DATABASE_PREFIX . 'domains` WHERE `id`=:domain_id AND `user_id`=:user_id LIMIT 1', [
									'domain_id'		=> $domain_id,
									'user_id'		=> Auth::getID()
								]);
								
								if($domain !== false && $domain->id >= 1) {
									$deletion[$domain->id] = $domain->name;
								} else {
									$stop	= true;
									$unable = Database::exists('SELECT * FROM `' . DATABASE_PREFIX . 'domains` WHERE `id`=:domain_id LIMIT 1', [
										'domain_id'	=> $domain_id
									]);
									
									if(empty($unable)) {
										$this->assign('error', 'An unknown error has occurred. Please retry your action!');
									} else {
										$this->assign('error', sprintf('You have no permissions to delete the Domain <strong>%s</strong>!', $unable->name));
									}
									break;
								}
							}
							
							if(!$stop) {
								$domains = [];
								
								foreach($deletion AS $id => $domain) {
									$domains[] = $domain;
									fruithost\Database::update(DATABASE_PREFIX . 'domains', [ 'id', 'user_id' ], [
										'id'			=> $id,
										'user_id'		=> Auth::getID(),
										'time_deleted'	=> date('Y-m-d H:i:s', time())
									]);
								}
								
								$this->assign('success', sprintf('Following Domains will be deleted: <strong>%s</strong>!', implode(', ', $domains)));
								$this->domains = Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'domains` WHERE `user_id`=:user AND `type`=\'DOMAIN\' ORDER BY `name` ASC', [
									'user'	=> Auth::getID()
								]);
							}
						}
					break;
				}
			}
		}
		
		public function onSave($data = []) {
			if(!isset($data['domain']) || empty($data['domain'])) {
				return 'Please enter a domain name!';
			}
			
			// @ToDo validate Domain!!!
			$domain = Database::single('SELECT * FROM `' . DATABASE_PREFIX . 'domains` WHERE `name`=:name AND `user_id`=:user_id LIMIT 1', [
				'name'		=> $data['domain'],
				'user_id'	=> Auth::getID()
			]);
			
			if($domain !== false) {
				return 'Domain already exists.';
			}
			
			if(!isset($data['type']) || empty($data['type'])) {
				return 'Please select a valid home directory!';
			}
			
			$directory = '/';
			
			switch($data['type']) {
				case 'new':
					$directory = sprintf('/%s/', $data['domain']);
				break;
				case 'existing':
					if(!isset($data['directory']) || empty($data['directory'])) {
						return 'Please select an valid home directory!';
					}
					
					if(!file_exists(sprintf('%s%s/%s', HOST_PATH, Auth::getUsername(), $data['directory']))) {
						return 'Please select an existing home directory!';
					}
					
					$directory = sprintf('%s/', $data['directory']);
				break;
				default:
					return 'Please select an valid home directory!';
				break;
			}
			
			$id = Database::insert(DATABASE_PREFIX . 'domains', [
				'id'			=> null,
				'user_id'		=> Auth::getID(),
				'name'			=> $data['domain'],
				'directory'		=> $directory,
				'type'			=> 'DOMAIN',
				'active'		=> 'YES',
				'enabled'		=> 'YES',
				'time_created'	=> NULL,
				'time_deleted'	=> NULL
			]);
			
			return true;
		}
		
		public function content() {
			if(empty($this->domains)) {
				require_once('views/empty.php');
			} else {
				require_once('views/list.php');
			}
		}
	}
?>