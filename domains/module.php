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
				(new Button())->setName('create')->setLabel('Create')->addClass('btn-outline-primary')
			]));
			
			$this->domains = Database::fetch('SELECT * FROM `fh_domains` WHERE `user_id`=:user AND `time_deleted` IS NULL AND `type`=\'DOMAIN\' ORDER BY `name` ASC', [
				'user'	=> Auth::getID()
			]);
			
			if(empty($this->domains)) {
				$this->addButton((new Button())->setName('create')->setLabel('Create')->addClass('btn-outline-secondary')->setModal('create_domain'));
			} else {
				$this->addButton([
					(new Button())->setName('create')->setLabel('Create')->addClass('btn-outline-secondary')->setModal('create_domain'),
					(new Button())->setName('delete')->setLabel('Delete')->addClass('btn-outline-danger')
				]);				
			}
			
			$this->assign('ip_address', '127.0.0.1');
			#$this->addButton((new Button())->setName('save')->setLabel('Save')->addClass('btn-outline-primary'));
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