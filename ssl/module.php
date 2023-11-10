<?php
	namespace Module\SSL;
	
	use fruithost\Modules\ModuleInterface;
	use fruithost\Storage\Database;
	use fruithost\Accounting\Auth;
	use fruithost\UI\Button;
	use fruithost\Localization\I18N;
	use fruithost\System\HookParameters;
	use fruithost\Accounting\Session;
	use fruithost\Network\Response;
	
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

							Session::set('success', sprintf(I18N::get('We are installing your new <strong>Let\'s Encrypt</strong> certificate for <strong>%s</strong> and automatically redirecting traffic to your site over a secure HTTPS connection. You should see this reflected on your website <strong>within 15 minutes</strong>.'), $this->domain->name));
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
							
							Session::set('success', sprintf(I18N::get('We are installing your new <strong>Self-Signed</strong> certificate for <strong>%s</strong> and automatically redirecting traffic to your site over a secure HTTPS connection. You should see this reflected on your website <strong>within 15 minutes</strong>.'), $this->domain->name));
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
					case 'create':
						// @ToDo Check domain permissions
						if($data == 1) {
							$template->assign('error', I18N::get('You cant delete the certificate!'));
						} else if(isset($_POST['import'])) {
							if(!Session::has('import')) {
								$this->assign('errors', I18N::get('An error has occurred. Please repeat the action!'));
							} else {
								$import = Session::get('import');
								
								if(!empty($import['cert']) && !empty($import['key'])) {
									file_put_contents(sprintf('/etc/fruithost/config/apache2/ssl/%s.cert', $this->domain->name), $import['cert']);
									file_put_contents(sprintf('/etc/fruithost/config/apache2/ssl/%s.key', $this->domain->name), $import['key']);
									
									if(!empty($import['root'])) {
										file_put_contents(sprintf('/etc/fruithost/config/apache2/ssl/%s.root', $this->domain->name), $import['root']);
									}
									
									$id = Database::insert(DATABASE_PREFIX . 'certificates', [
										'id'			=> null,
										'user_id'		=> Auth::getID(),
										'domain'		=> $this->domain->id,
										'type'			=> 'CERTIFICATE',
										'time_created'	=> NULL,
										'time_updated'	=> NULL,
										'days_expiring'	=> $import['expiring'],
										'force_https'	=> 'YES'
									]);
									
									Session::remove('import');
									Session::set('success', sprintf(I18N::get('The secure certificate for <strong>%s</strong> has been reconfigured! Note that these changes can take <strong>up to 15 minutes</strong> to be pushed out to the server.'), $this->domain->name));
									Response::redirect('/module/ssl/');
									exit();
								} else {
									$this->assign('errors', I18N::get('An error has occurred. Please repeat the action!'));
								}
							}
						} else {
							$key	= isset($_POST['key']) ? $_POST['key'] : null;
							$cert	= isset($_POST['cert']) ? $_POST['cert'] : null;
							$root	= isset($_POST['root']) ? $_POST['root'] : null;
							
							if(empty($cert)) {
								$this->assign('errors', I18N::get('Please insert a certificate, the entry must not be empty!'));
							} else if(empty($key)) {
								$this->assign('errors', I18N::get('Please insert a private key, the entry must not be empty!'));
							} else {
								try {
									$cert_details	= openssl_x509_parse($cert, false);
									
									if(!empty($root)) {
										$root_details	= openssl_x509_parse($root, false);
									}
									
									/* @ToDo intensive check (domain name and other) */
									$from	= new \DateTime(date_create_from_format('ymdHise', $cert_details['validTo'])->format('c'));
									$to		= new \DateTime(date_create_from_format('ymdHise', $cert_details['validFrom'])->format('c'));

									if($cert_details == false) {
										$this->assign('errors', I18N::get('The specified certificate is not valid:<br/>' . openssl_error_string()));
									} else {
										Session::set('import', [
											'key'		=> $key,
											'cert'		=> $cert,
											'root'		=> $root,
											'expiring'	=> $to->diff($from)->format('%r%a')
										]);
										
										$this->assign('cert_details', $cert_details);
										
										if(!empty($root_details)) {
											$this->assign('root_details', $root_details);
										}
										
										$this->assign('confirmate', true);
									}
								} catch(\Exception $e) {
									$this->assign('errors', $e->getMessage());
								}
							}
							
							$this->assign('key',		$key);
							$this->assign('cert',		$cert);
							$this->assign('root',		$root);
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
			
			if(Database::count('SELECT * FROM `' . DATABASE_PREFIX . 'domains` WHERE `user_id`=:user AND `type`=\'DOMAIN\' AND `time_deleted` IS NULL ORDER BY `name` ASC', [
				'user'	=> Auth::getID()
			]) == 0) {
				require_once('views/no_domains.php');
				return;
			}
			
			foreach($this->getTemplate()->getAssigns() AS $name => $value) {
				${$name} = $value;
			}
			
			switch($submodule) {
				case 'view':
					require_once(sprintf('%s/views/view.php', dirname(__FILE__)));
				break;
				case 'create':
					require_once(sprintf('%s/views/create.php', dirname(__FILE__)));
				break;
				default:
					require_once(sprintf('%s/views/list.php', dirname(__FILE__)));
				break;
			}
		}
	}
?>