<?php
	use fruithost\ModuleInterface;
	use fruithost\Database;
	use fruithost\Auth;
	use fruithost\Request;
	use fruithost\Button;
	use fruithost\I18N;
	
	class PHP extends ModuleInterface {
		private $domains	= NULL;
		private $domain		= NULL;
		private $defaults	= [];
		private $tabs		= [
			'extended'	=> 'Extended',
			'security'	=> 'Security',
			'error'		=> 'Error Handling',
			'display'	=> 'Display Configuration'
		];
		
		public function init() {
			if(Database::tableExists(DATABASE_PREFIX . 'domains')){
				$this->domains	= Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'domains` WHERE `user_id`=:user AND `time_deleted` IS NULL AND `type`=\'DOMAIN\' ORDER BY `name` ASC', [
					'user'	=> Auth::getID()
				]);
			}
			
			$this->defaults = json_decode(file_get_contents(sprintf('%s/data/config.json', dirname(__FILE__))));
			
			if(!empty($this->domains) && count($this->domains) > 0 && Request::has('domain')) {
				$this->domain = Request::get('domain');
			}
		}
		
		public function load($submodule = null) {			
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