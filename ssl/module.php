<?php
	use fruithost\ModuleInterface;
	use fruithost\Database;
	use fruithost\Auth;
	use fruithost\Button;
	use fruithost\I18N;
	use fruithost\HookParameters;
	
	class SSL extends ModuleInterface {
		private $certificates = [];
		
		public function init() {
			
		}
		
		public function preLoad() {
			$this->certificates = Database::fetch('SELECT `' . DATABASE_PREFIX . 'certificates`.*, `' . DATABASE_PREFIX . 'domains`.`name` AS `name`, `' . DATABASE_PREFIX . 'domains`.`directory` AS `directory` FROM `' . DATABASE_PREFIX . 'certificates` INNER JOIN `' . DATABASE_PREFIX . 'domains` ON `' . DATABASE_PREFIX . 'certificates`.`domain`=`' . DATABASE_PREFIX . 'domains`.`id` AND `' . DATABASE_PREFIX . 'certificates`.`user_id`=`' . DATABASE_PREFIX . 'domains`.`user_id` AND `' . DATABASE_PREFIX . 'certificates`.`user_id`=:user_id', [
				'user_id'	=> Auth::getID()
			]);
			
			$this->addFilter('MODULE_DOMAIN_LIST_TABLE_NAME', function($html = [], $domain = null) {
				$crt	= $this->getCertByDomain($domain);
				$color	= 'danger';
				$text	= I18N::get('Add SSL-Certificate');
				
				/* Is already HTTPS set */
				if(isset($crt)) {
					if($crt->time_created !== NULL) {
						$color	= 'success';
						$text	= I18N::get('SSL-Certificate');
					} else {
						$color	= 'warning';
						$text	= I18N::get('SSL-Certificate is currently being integrated');
					}
				}
				
				$html[] = sprintf('<td width="1px"><a href="%2$s" data-content="<small>%1$s</small>" data-toggle="hover" class="text-%3$s small"><i class="material-icons">lock</span></a></td>', $text, $this->url('/module/ssl/' . ($domain == null ? '' : $domain->id)), $color);

				return $html;
			});
			
			$this->addFilter('MODULE_DOMAIN_LIST_NAME', function($data = [], $domain = null) {
				$crt = $this->getCertByDomain($domain);
				
				/* Is already HTTPS set */
				
				if(isset($crt)) {
					if($crt->time_created !== NULL) {
						$data['link'] = '<a href="https://%1$s/" target="_blank">%1$s</a></td>';
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
		
		public function load($submodule = null) {
			
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
				default:
					require_once('views/list.php');
				break;
			}
		}
	}
?>