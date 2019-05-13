<?php
	use fruithost\Database;
	
	class CronjobDaemon {
		public function __construct() {
			$cronjobs = Database::fetch('SELECT `' . DATABASE_PREFIX . 'cronjobs`.*, `' . DATABASE_PREFIX . 'users`.`username` FROM `' . DATABASE_PREFIX . 'cronjobs`, `' . DATABASE_PREFIX . 'users` WHERE `' . DATABASE_PREFIX . 'users`.`id`=`' . DATABASE_PREFIX . 'cronjobs`.`user_id`', []);
			
			foreach($cronjobs AS $cronjob) {
				print TAB . (empty($cronjob->name) ? 'Unnamed' : $cronjob->name) . ' Cron (from ' . $cronjob->username . ')' . PHP_EOL;
				
				if($this->parse(sprintf('%s %s %s %s %s', $cronjob->task_minute, $cronjob->task_hour, $cronjob->task_day, $cronjob->task_month, $cronjob->task_weekday))) {
					$this->execute($cronjob);
				}
			}
		}
		
		protected function parse($crontab = '* * * * *') {
			$time		= explode(' ', date('i G j n w', time()));
			$crontab	= explode(' ', $crontab);
			
			foreach($crontab AS $index => &$value) {
				$time[$index]	= preg_replace('/^0+(?=\d)/', '', $time[$index]);
				$value			= explode(',', $value);
				
				foreach($value AS &$part) {
					$part = preg_replace([
						'/^\*$/',
						'/^\d+$/',
						'/^(\d+)\-(\d+)$/',
						'/^\*\/(\d+)$/'
					], [
						'true',
						$time[$index] . '===\0',
						'(\1<=' . $time[$index] . ' && ' . $time[$index] . '<=\2)',
						$time[$index] . '%\1===0'
					], $part);
				}
				
				$value = '(' . implode(' || ', $value) . ')';
			}
			
			return eval(sprintf('return %s;', implode(' && ', $crontab)));
		}
		
		protected function execute($cronjob) {
			$result = NULL;
			
			switch($cronjob->command_type) {
				case 'URL':
					$result = file_get_contents($cronjob->command_value);
				break;
				case 'PHP':
					$data	= json_decode($cronjob->command_value);
					$result	= shell_exec(sprintf('sudo -u www-data php -f %1$s %2$s', sprintf('%s%s%s', HOST_PATH, $cronjob->username, $data->script), $data->parameters));
				break;
				default:
					$result = 'Unknown Cronjob Type!';
				break;
			}
			
			#print_r($result);
			
			Database::update(DATABASE_PREFIX . 'cronjobs', 'id', [
				'id'			=> $cronjob->id,
				'time_running'	=> date('Y-m-d H:i:s', time())
			]);
		}
	}
	
	new CronjobDaemon();
?>