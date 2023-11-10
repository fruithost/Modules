<?php
	use fruithost\ModuleInterface;
	
	class MailServer extends ModuleInterface {
		public function init() {
			$this->addFilter('MAIL_MANAGEMENT', function($entries) {
				return array_merge($entries, [
					(object) [
						'name'		=> 'Aliases',
						'icon'		=> '<i class="material-icons">alternate_email</i>',
						'order'		=> 2,
						'url'		=> '/module/mailserver/aliases',
						'active'	=> $this->getCore()->getRouter()->is('/module/mailserver/aliases')
					], (object) [
						'name'		=> 'Forwards',
						'icon'		=> '<i class="material-icons">reply</i>',
						'order'		=> 2,
						'url'		=> '/module/mailserver/forwards',
						'active'	=> $this->getCore()->getRouter()->is('/module/mailserver/forwards')
					]
				]);
			});
		}
	}
?>