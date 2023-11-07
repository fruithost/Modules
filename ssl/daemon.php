<?php
	use fruithost\Database;
	
	class SSLDaemon {
		public function __construct() {
			
			$this->reloadApache();
		}
		
		protected function reloadApache() {
			print shell_exec('service apache2 reload');
		}
	}
	
	new SSLDaemon();
?>