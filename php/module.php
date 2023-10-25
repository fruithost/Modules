<?php
	use fruithost\ModuleInterface;
	use fruithost\Database;
	use fruithost\Auth;
	use fruithost\Request;
	
	class PHP extends ModuleInterface {
		private $domains	= NULL;
		private $domain		= NULL;
		private $tabs		= [
			'extended'	=> 'Extended',
			'security'	=> 'Security',
			'error'		=> 'Error Handling',
			'display'	=> 'Display Configuration'
		];
		
		public function init() {
			$this->domains	= Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'domains` WHERE `user_id`=:user AND `time_deleted` IS NULL AND `type`=\'DOMAIN\' ORDER BY `name` ASC', [
				'user'	=> Auth::getID()
			]);
			
			if(Request::has('domain')) {
				$this->domain = Request::get('domain');
			}
		}
		
		public function content($submodule = null) {
			if(empty($submodule)) {
				$submodule = array_keys($this->tabs)[0];
			} else if(!file_exists(sprintf('%s/views/%s.php', dirname(__FILE__), $submodule))) {
				$submodule = array_keys($this->tabs)[0];
			}
			?>
				<ul class="nav nav-tabs mb-4">
					<?php
						foreach($this->tabs AS $name => $label) {
							?>
								<li class="nav-item"><a class="nav-link<?php print ($submodule === $name ? ' active' : ''); ?>" href="<?php print $this->url(sprintf('/module/php/%s%s', $name, (!empty($this->domain) ? '?domain=' . $this->domain : ''))); ?>"><?php print $label; ?></a></li>
							<?php
						}
					?>
					<li class="nav-item ml-auto">
						<div class="input-group input-group-sm">
							<div class="input-group-prepend">
								<span class="input-group-text" id="label">For Domain:</span>
							</div>
							<select name="domain" class="col form-control form-control-sm" aria-label="Domain" aria-describedby="label">
								<option value="ALL">Global</option>
								<?php
									foreach($this->domains AS $domain) {
										printf('<option value="%1$s"%2$s>%1$s</option>', $domain->name, ($this->domain === $domain->name ? ' SELECTED' : ''));
									}
								?>
							</select>
						</div>
					</li>
				</ul>
				<form>
					<?php
						require_once(sprintf('views/%s.php', $submodule));
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