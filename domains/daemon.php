<?php
	use fruithost\Database;
	
	class DomainsDaemon {
		public function __construct() {
			$domains = $this->getDomains('AND
										`fh_domains`.`time_created` IS NULL
									AND
										`fh_domains`.`time_deleted` IS NULL');
			
			foreach($domains AS $domain) {
				print 'Create VHost for ' . $domain->name . PHP_EOL;
				$path = $this->createPath($domain->username, $domain->directory);
				
				$this->createDocumentRoot($domain, $path);
				$this->createVirtualHost($domain, $path);
				$this->updateDomain($domain);
			}
			
			$this->reloadApache();
		}
		
		protected function createPath($username, $directory) {
			$logs = sprintf('%s%s/%s/', HOST_PATH, $username, 'logs');
			$path = sprintf('%s%s/%s/', HOST_PATH, $username, $directory);
			
			if(!file_exists($logs)) {
				mkdir($logs);
			}
			
			if(!file_exists($path)) {
				mkdir($path);
			}
			
			return str_replace('//', '/', $path);
		}
		
		protected function getDomains($sql = '') {
			return Database::fetch('SELECT
										`fh_domains`.*,
										`fh_users`.`username` AS `username`
									FROM
										`fh_domains`,
										`fh_users`
									WHERE
										`fh_users`.`id`=`fh_domains`.`user_id`
									' . $sql . '
									AND
										`fh_domains`.`type`=\'DOMAIN\'
									ORDER BY `fh_domains`.`name` ASC', []);
		}
		
		protected function createVirtualHost($domain, $path) {
			$config = '# Generated by fruithost' . PHP_EOL;
			$config .= '<VirtualHost *:80>' . PHP_EOL;
			$config .= TAB . sprintf('ServerAdmin abuse@%s', $domain->name) . PHP_EOL;
			$config .= TAB . sprintf('DocumentRoot "%s"', $path) . PHP_EOL;
			$config .= TAB . sprintf('ServerName %s', $domain->name) . PHP_EOL;
			
			$logs = sprintf('%s%s/%s/', HOST_PATH, $domain->username, 'logs');
			$config .= TAB . sprintf('ErrorLog %s%s_error.log', $logs, $domain->name) . PHP_EOL;
			$config .= TAB . sprintf('CustomLog %s%s_access.log combined', $logs, $domain->name) . PHP_EOL;
				
			$config .= PHP_EOL;
			
			foreach([
				100, 101,
				400, 401, 403, 404, 405, 408, 410, 411, 412, 413, 414, 415,
				500, 501, 502, 503, 504, 505, 506
			] AS $code) {
				$config .= TAB . sprintf('Alias /errors/%1$s.html /etc/fruithost/placeholder/errors/%1$s.html', $code) . PHP_EOL;
			}
			
			$config .= PHP_EOL;
			$config .= TAB . sprintf('<Directory %s>', $path) . PHP_EOL;
			$config .= TAB . TAB . 'Options +FollowSymLinks -Indexes' . PHP_EOL;
			$config .= TAB . TAB . 'AllowOverride All' . PHP_EOL;
			$config .= TAB . TAB . 'Require all granted' . PHP_EOL;
			$config .= TAB . '</Directory>' . PHP_EOL;
			
			$config .= PHP_EOL;
			$config .= TAB .  '<Files ~ "(^\.|php\.ini$)">' . PHP_EOL;
			$config .= TAB . TAB . 'Require all denied' . PHP_EOL;
			$config .= TAB . '</Files>' . PHP_EOL;
			
			$config .= '</VirtualHost>' . PHP_EOL;
			
			file_put_contents(sprintf('/etc/fruithost/config/apache2/vhosts/%s.conf', $domain->name), $config);
		}
		
		protected function createDocumentRoot($domain, $path) {
			$template = sprintf('%s%s%s/domains', PATH, DS, 'modules');
			
			file_put_contents(sprintf('%sindex.html', $path), str_replace([
				'$DOMAIN'
			], [
				$domain->name
			], file_get_contents($template . '/vhost/index.html')));
		}
		
		protected function updateDomain($domain) {
			Database::update('fh_domains', 'id', [
				'id'			=> $domain->id,
				'time_created'	=> date('Y-m-d H:i:s', time()),
				'time_deleted'	=> NULL
			]);
		}
		
		protected function reloadApache() {
			print shell_exec('service apache2 reload');
		}
	}
	
	new DomainsDaemon();
?>