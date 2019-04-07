<?php
	use fruithost\ModuleInterface;
	
	class Database extends ModuleInterface {
		public function init() {
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
	}
?>