<?php
	namespace Module\SSL;
	
	use fruithost\ModuleInterface;
	use fruithost\Database;
	use fruithost\Auth;
	use fruithost\Button;
	use fruithost\I18N;
	use fruithost\HookParameters;
	use fruithost\Session;
	use fruithost\Response;
	
	require_once(sprintf('%s/providers/Provider.interface.php', dirname(__FILE__)));
	
	class SSL extends ModuleInterface {
		private $certificates	= [];
		private $domain			= null;
		private $certificate	= null;
		private $providers		= [];
		
		public function init() {
			foreach([
				'LetsEncrypt',
				'SelfSigned',
				'Certificate'
			] AS $provider) {
				$old = get_declared_classes();
				require_once(sprintf('%s/providers/%s.class.php', dirname(__FILE__), $provider));
				$new = get_declared_classes();

				foreach(array_diff($new, $old) AS $class) {
					if(is_subclass_of($class, 'fruithost\\Module\\SSL\\Providers\\Provider', true)) {
						$reflect					= new \ReflectionClass($class);
						$instance					= $reflect->newInstance();
						$this->providers[$provider]	= $instance;
					}
				}
			}
		}
		
		public function preLoad() {
			$this->certificates = Database::fetch('SELECT `' . DATABASE_PREFIX . 'certificates`.*, `' . DATABASE_PREFIX . 'domains`.`name` AS `name`, `' . DATABASE_PREFIX . 'domains`.`directory` AS `directory` FROM `' . DATABASE_PREFIX . 'certificates` INNER JOIN `' . DATABASE_PREFIX . 'domains` ON `' . DATABASE_PREFIX . 'certificates`.`domain`=`' . DATABASE_PREFIX . 'domains`.`id` AND `' . DATABASE_PREFIX . 'certificates`.`user_id`=`' . DATABASE_PREFIX . 'domains`.`user_id` AND `' . DATABASE_PREFIX . 'certificates`.`user_id`=:user_id', [
				'user_id'	=> Auth::getID()
			]);
			
			$this->addFilter('MODULE_DOMAIN_LIST_TABLE_NAME', function($html = [], $domain = null) {
				$crt			= $this->getCertByDomain($domain);
				$color			= 'danger';
				$title			= I18N::get('Your website is not secure');
				$icon			= 'lock_open';
				$description 	= I18N::get('Data transferred between your visitors and website is unencrypted and may be intercepted.');
				
				/* Is already HTTPS set */
				if(isset($crt)) {
					if($crt->time_created !== NULL) {
						$color			= 'success';
						$icon			= 'lock';
						$title			= I18N::get('Connection is secure');
						$description 	= I18N::get('Data transferred between your visitors and website is encrypted.');
					} else {
						$color			= 'warning';
						$icon			= 'lock';
						$title			= I18N::get('Website will be set up');
						$description 	= I18N::get('Your website is still being set up for encryption.');
					}
					
					if($domain !== null && !file_exists(sprintf('/etc/fruithost/config/apache2/vhosts/20_%s.ssl.conf', $domain->name))) {
						$color			= 'warning';
						$icon			= 'lock';
						$title			= I18N::get('Website will be set up');
						$description 	= I18N::get('Your website is still being set up for encryption.');
					}
				}
				
				$popover	= sprintf(' data-content="%2$s" title="<small class=\'text-%3$s\'>%1$s</small>"', $title, $description, $color);
				$html[]		= sprintf('<td width="1px"><a href="%2$s" data-toggle="hover" class="text-%3$s small" %1$s><i class="material-icons">%4$s</span></a></td>', $popover, $this->url('/module/ssl/view/' . ($domain == null ? '' : $domain->id)), $color, $icon);

				return $html;
			});
			
			$this->addFilter('MODULE_DOMAIN_LIST_NAME', function($data = [], $domain = null) {
				$crt = $this->getCertByDomain($domain);
				
				/* Is already HTTPS set */
				
				if(isset($crt)) {
					if($crt->time_created !== NULL && $domain !== null && file_exists(sprintf('/etc/fruithost/config/apache2/vhosts/20_%s.ssl.conf', $domain->name))) {
						if($crt->enable_hsts == 'YES') {
							$data['link'] = '<a href="https://%1$s/" target="_blank">%1$s</a> <i class="badge badge-success align-text-bottom text-light">HSTS</i>';
						} else {
							$data['link'] = '<a href="https://%1$s/" target="_blank">%1$s</a>';
						}
					}
				}
				
				return $data;
			});
			
			
			$this->addFilter('MODULE_DOMAIN_LIST_STATUS', function($data = [], $domain = null) {
				$crt = $this->getCertByDomain($domain);
				
				/* Is already HTTPS set */
				if(isset($crt)) {
					if($crt->time_created === NULL) {
						$data = [
							'text'	=> I18N::get('Pending'),
							'html'	=> '<span class="text-warning">%s...</span>'
						];
					}
				}
				
				return $data;
			});
		}
		
		public function getCertByDomain($domain) {
			if(empty($domain)) {
				return null;
			}
			
			$entry = null;
			
			foreach($this->certificates AS $row) {
				if($row->domain == $domain->id) {
					$entry = $row;
					break;
				}
			}
			
			return $entry;
		}
		
		public function load($submodule = null, $id = null) {
			$this->certificate = Database::single('SELECT `' . DATABASE_PREFIX . 'certificates`.*, `' . DATABASE_PREFIX . 'domains`.`name` AS `name`, `' . DATABASE_PREFIX . 'domains`.`directory` AS `directory` FROM `' . DATABASE_PREFIX . 'certificates` INNER JOIN `' . DATABASE_PREFIX . 'domains` ON `' . DATABASE_PREFIX . 'certificates`.`domain`=`' . DATABASE_PREFIX . 'domains`.`id` AND `' . DATABASE_PREFIX . 'certificates`.`user_id`=`' . DATABASE_PREFIX . 'domains`.`user_id` AND `' . DATABASE_PREFIX . 'certificates`.`user_id`=:user_id AND `' . DATABASE_PREFIX . 'certificates`.`domain`=:domain_id LIMIT 1', [
				'user_id'	=> Auth::getID(),
				'domain_id' => $id
			]);
		
			$this->domain = Database::single('SELECT * FROM `' . DATABASE_PREFIX . 'domains` WHERE `user_id`=:user_id AND `id`=:domain_id LIMIT 1', [
				'user_id'	=> Auth::getID(),
				'domain_id' => $id
			]);
			
			$this->addFilter('SUBMODULE_NAME', function($text) {
				if(empty($this->domain)) {
					return I18N::get('Error');
				} else if(empty($this->certificate)) {
					return sprintf(I18N::get('Create for %s'), $this->domain->name);					
				} else {
					return sprintf(I18N::get('View Domain: %s'), $this->domain->name);
				}
				
				return $text;
			});
			
			switch($submodule) {
				case 'create':
					$this->certificate = Database::single('SELECT `' . DATABASE_PREFIX . 'certificates`.*, `' . DATABASE_PREFIX . 'domains`.`name` AS `name`, `' . DATABASE_PREFIX . 'domains`.`directory` AS `directory` FROM `' . DATABASE_PREFIX . 'certificates` INNER JOIN `' . DATABASE_PREFIX . 'domains` ON `' . DATABASE_PREFIX . 'certificates`.`domain`=`' . DATABASE_PREFIX . 'domains`.`id` AND `' . DATABASE_PREFIX . 'certificates`.`user_id`=`' . DATABASE_PREFIX . 'domains`.`user_id` AND `' . DATABASE_PREFIX . 'certificates`.`user_id`=:user_id AND `' . DATABASE_PREFIX . 'certificates`.`domain`=:domain_id LIMIT 1', [
						'user_id'	=> Auth::getID(),
						'domain_id' => $_GET['domain']
					]);
					
					$this->domain = Database::single('SELECT * FROM `' . DATABASE_PREFIX . 'domains` WHERE `user_id`=:user_id AND `id`=:domain_id LIMIT 1', [
						'user_id'	=> Auth::getID(),
						'domain_id' => $_GET['domain']
					]);
					
					
					if(empty($this->domain)) {
						Session::set('error', sprintf(I18N::get('You have no access to this domain!'), $this->domain->name));
						Response::redirect('/module/ssl/');
						exit();
					}
					
					if(!empty($this->certificate)) {
						Session::set('error', sprintf(I18N::get('A certificate will be currently created for the domain <strong>%s</strong>!'), $this->domain->name));
						Response::redirect('/module/ssl/');
						exit();
					}
					
					switch(strtoupper($id)) {
						case 'LETSENCRYPT':
							$id = Database::insert(DATABASE_PREFIX . 'certificates', [
								'id'			=> null,
								'user_id'		=> Auth::getID(),
								'domain'		=> $this->domain->id,
								'type'			=> 'LETSENCRYPT',
								'time_created'	=> NULL,
								'time_updated'	=> NULL,
								'days_expiring'	=> NULL,
								'force_https'	=> 'YES'
							]);
							
							Session::set('success', sprintf(I18N::get('The <strong>Let\'s Encrypt</strong> certificate for the domain <strong>%s</strong> will be created soon.'), $this->domain->name));
							Response::redirect('/module/ssl/');
							exit();
						break;
						/* @ToDo provide Form for Cert-Infos? */
						case 'SELFSIGNED':
							$id = Database::insert(DATABASE_PREFIX . 'certificates', [
								'id'			=> null,
								'user_id'		=> Auth::getID(),
								'domain'		=> $this->domain->id,
								'type'			=> 'SELFSIGNED',
								'time_created'	=> NULL,
								'time_updated'	=> NULL,
								'days_expiring'	=> NULL,
								'force_https'	=> 'YES'
							]);
							
							Session::set('success', sprintf(I18N::get('The <strong>Self-Signed</strong> certificate for the domain <strong>%s</strong> will be created soon.'), $this->domain->name));
							Response::redirect('/module/ssl/');
							exit();
						break;
					}
				break;	
			}
		}
		
		public function onPOST($data = []) {
			if(isset($_POST['action'])) {
				switch($_POST['action']) {
					case 'force_https':
						// @ToDo Check domain permissions
						if($data == 1) {
							$template->assign('error', I18N::get('You cant delete the certificate!'));
						} else {
							Database::update(DATABASE_PREFIX . 'certificates', 'id', [
								'id'			=> $this->certificate->id,
								'force_https'	=> ($_POST['value'] === 'true' ? 'YES' : 'NO'),
								'time_updated'	=> date('Y-m-d H:i:s', time())
							]);
							
							print $_POST['value'];
							exit();
						}
						
					break;
					case 'enable_hsts':
						// @ToDo Check domain permissions
						if($data == 1) {
							$template->assign('error', I18N::get('You cant delete the certificate!'));
						} else {
							Database::update(DATABASE_PREFIX . 'certificates', 'id', [
								'id'			=> $this->certificate->id,
								'enable_hsts'	=> ($_POST['value'] === 'true' ? 'YES' : 'NO'),
								'time_updated'	=> date('Y-m-d H:i:s', time())
							]);
							
							print $_POST['value'];
							exit();
						}
						
					break;
					case 'delete':
						// @ToDo Check domain permissions
						if($data == 1) {
							$template->assign('error', I18N::get('You cant delete the certificate!'));
						} else {
							Database::update(DATABASE_PREFIX . 'certificates', 'id', [
								'id'			=> $this->certificate->id,
								'type'			=> 'DELETED',
								'time_updated'	=> date('Y-m-d H:i:s', time())
							]);
							
							Session::set('success', sprintf(I18N::get('The certificate for the domain <strong>%s</strong> was successfully deleted.'), $this->domain->name));
							Response::redirect('/module/ssl/');
							exit();
						}
					break;
				}
			}
		}
		
		public function content($submodule = null) {
			if(!$this->getModules()->hasModule('domains')) {
				?>
					<div class="alert alert-danger mt-4" role="alert">
						<strong><?php I18N::__('Access denied!'); ?></strong>
						<p class="pb-0 mb-0"><?php I18N::__('You have no permissions for this page.'); ?></p>
					</div>
				<?php
				return;
			}
			
			switch($submodule) {
				case 'view':
					require_once('views/view.php');
				break;
				case 'create':
					require_once('views/create.php');
				break;
				default:
					require_once('views/list.php');
				break;
			}
		}
	}
?>