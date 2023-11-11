<?php
	use fruithost\Modules\ModuleInterface;
	use fruithost\Storage\Database;
	use fruithost\Accounting\Auth;
	use fruithost\Network\Request;
	use fruithost\UI\Button;
	use fruithost\Localization\I18N;
	
	class PHP extends ModuleInterface {
		private $domains	= NULL;
		private $domain		= NULL;
		private $ini		= [];
		private $defaults	= [];
		private $tabs		= [
			'extended'	=> 'Extended',
			'security'	=> 'Security',
			'error'		=> 'Error Handling',
			'display'	=> 'Display Configuration'
		];
		
		public function init() : void {
			if(Database::tableExists(DATABASE_PREFIX . 'domains')){
				$this->domains	= Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'domains` WHERE `user_id`=:user AND `time_deleted` IS NULL AND `type`=\'DOMAIN\' ORDER BY `name` ASC', [
					'user'	=> Auth::getID()
				]);
			}
			
			$file			= sprintf('%s%s/php.ini', HOST_PATH, Auth::getUsername());
			$this->defaults = json_decode(file_get_contents(sprintf('%s/data/config.json', dirname(__FILE__))));
			
			if(!empty($this->domains) && count($this->domains) > 0 && Request::has('domain')) {
				$this->domain	= Request::get('domain');
				$file			= sprintf('%s%s/%s/php.ini', HOST_PATH, Auth::getUsername(), $this->domain);
			}
			
			if(file_exists($file)) {
				$this->ini = parse_ini_file($file);
				
				if($this->ini === false) {
					$this->ini = [];
				}
			}
		}
		
		public function load($submodule = null) : void {			
			if($submodule == 'display') {
				$this->addButton((new Button())->setName('reload')->setLabel(I18N::get('Update'))->addClass('btn-outline-primary'), true);	
			} else {
				$this->addButton((new Button())->setName('save')->setLabel(I18N::get('Save'))->addClass('btn-outline-success'), true);
			}
			
			$this->addFilter('SUBMODULE_NAME', function($text) {
				if(isset($this->tabs[$text])) {
					return I18N::get($this->tabs[$text]);
				}
				
				return $text;
			});
		}
		
		public function onPOST($data = null) : void {
			if(isset($data['action']) && $data['action'] == 'save') {
				$variables	= [];
				$file		= sprintf('%s%s/php.ini', HOST_PATH, Auth::getUsername());
				
				if(!empty($this->domain)) {
					$file = sprintf('%s%s/%s/php.ini', HOST_PATH, Auth::getUsername(), $this->domain);
				}
				
				foreach($this->defaults AS $tabs => $sections) {
					foreach($sections AS $section => $entrys) {
						foreach($entrys AS $name => $entry) {
							if(isset($data['php'][$name])) {
									$value = $data['php'][$name];
									
									switch($entry->type) {
										case 'Boolean':
											$value = ($value == '1');
										break;
										case 'Text':
										case 'Integer':
										case 'List':
										case 'Flags':
											/* Do Nothing */
										break;
									}
									
								#if(!empty($data['php'][$name]) && $entry->default != $data['php'][$name]) {
									$variables[$name] = $value;
								#}
							}
						}
					}
				}
				
				// Change only php.ini when changed variables set
				if(count($variables) > 0) {
					$content	= '';
					
					// Get the Old php.ini
					if(file_exists($file)) {
						$this->ini	= parse_ini_file($file);
						
						if($this->ini !== false) {
							$variables = array_merge($this->ini, $variables);
						}
					}
					
					foreach($variables AS $name => $value) {
						if(empty(trim($value))) {
							continue;
						}
						
						if(is_bool($value)) {
							$content .= sprintf('%s = %s', $name, ($value ? 'On' : 'Off'));
						} else {
							$content .= sprintf('%s = %s', $name, $value);
						}
						
						$content .= PHP_EOL;
					}
					
					file_put_contents($file, $content);
					$this->ini	= $variables;
				}
			}
		}
		
		public function content($submodule = null) : void {
			if(!$this->getModules()->hasModule('domains')) {
				?>
					<div class="alert alert-danger mt-4" role="alert">
						<strong><?php I18N::__('Access denied!'); ?></strong>
						<p class="pb-0 mb-0"><?php I18N::__('You have no permissions for this page.'); ?></p>
					</div>
				<?php
				return;
			}
			
			if(empty($submodule)) {
				$submodule = array_keys($this->tabs)[0];
			}
			?>
				<ul class="nav nav-tabs mb-4">
					<?php
						foreach($this->tabs AS $name => $label) {
							?>
								<li class="nav-item">
									<a class="nav-link<?php print ($submodule === $name ? ' active' : ''); ?>" href="<?php print $this->url(sprintf('/module/php/%s%s', $name, (!empty($this->domain) ? '?domain=' . $this->domain : ''))); ?>"><?php I18N::__($label); ?></a>
								</li>
							<?php
						}
						
						if(!empty($this->domains) && count($this->domains) > 0) { 
							?>
								<li class="nav-item ml-auto">
									<div class="input-group input-group-sm">
										<div class="input-group-prepend">
											<span class="input-group-text" id="label"><?php I18N::__('For Domain'); ?>:</span>
										</div>
										<select name="domain" class="col form-control form-control-sm" aria-label="Domain" aria-describedby="label">
											<option value="ALL"><?php I18N::__('Global'); ?></option>
											<?php
												foreach($this->domains AS $domain) {
													printf('<option value="%1$s"%2$s>%1$s</option>', $domain->name, ($this->domain === $domain->name ? ' SELECTED' : ''));
												}
											?>
										</select>
									</div>
								</li>
							<?php
						}
					?>
				</ul>
				<form>
					<?php
						if(isset($_POST['action']) && $_POST['action'] == 'save') {
							?>
								<div class="alert alert-success mt-4" role="alert"><?php I18N::__('PHP.ini was successfully saved.'); ?></div>
							<?php
						}
						
						switch($submodule) {
							case 'display':
								require_once(sprintf('views/%s.php', $submodule));
							break;
							default:
								require_once('views/properties.php');
							break;
						}
					?>
				</form>
				<script type="text/javascript">
					_watcher = setInterval(function() {
						if(typeof(jQuery) !== 'undefined') {
							clearInterval(_watcher);
							
							(function($) {
								let url = '<?php print $this->url(sprintf('/module/php/%s', $submodule)); ?>';
								
								$('select[name="domain"]').on('change', function(event) {
									let value = $(this).val();
									
									if(value === 'ALL') {
										window.location.href = url;
									} else {
										window.location.href = url + '?domain=' + value;
									}
								});
							}(jQuery));
						}
					}, 500);
				</script>
			<?php
		}
	}
?>