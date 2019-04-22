<?php
	use fruithost\Database;
	
	class StatusDaemon {
		public function __construct() {
			$services = $this->getServices();
			
			foreach($services AS $service) {
				$status = $this->checkPort($service->port);
				
				print TAB . 'Checking ' . $service->name . ': ' . TAB . ($status ? "\033[0;32mOnline\033[0m" : "\033[31;31mOFFLINE\033[0m") . ' (' . $service->service . ')' . PHP_EOL;
				
				try {
					Database::update('fh_status', 'id', [
						'id'		=> $service->id,
						'time'		=> date('Y-m-d H:i:s', time()),
						'status'	=> ($status ? 'ONLINE' : 'OFFLINE')
					]);
				} catch(\Exception $e) {}
			}
			
			// @ToDo notify when services down?
		}
		
		protected function getServices($sql = '') {
			return Database::fetch('SELECT * FROM `fh_status`', []);;
		}
		
		private function checkPort($port) {
			$socket = @fsockopen('127.0.0.1', $port, $errno, $errstr, 10);
			
			if($socket !== false) {
				fclose($socket);
				return true;
			}
			
			return false; 
		}
	}
	
	new StatusDaemon();
?>