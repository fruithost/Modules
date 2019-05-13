<?php
	use fruithost\Auth;
	use fruithost\ModuleInterface;
	
	class Theme extends ModuleInterface {
		public function init() {
			$this->addFilter('theme_name', function($name) {
				if(Auth::isLoggedIn()) {
					return Auth::getSettings('THEME', NULL, $name);
				}
				
				return $name; // @ToDo global theme
			});
			
			$this->addAction('ACCOUNT_SETTINGS_GLOBAL', [ $this, 'html' ]);
			$this->addAction('SAVE_ACCOUNT_SETTINGS_GLOBAL', [ $this, 'save' ]);
		}
		
		public function getPath() {
			return sprintf('%s%s%s', dirname(PATH), DS, 'themes');
		}
		
		public function save($data) {
			if(empty($data['theme']) || $data['theme'] === '-') {
				Auth::setSettings('THEME', NULL, NULL);
				Auth::removeSettings('THEME', NULL);
			} else {
				Auth::setSettings('THEME', NULL, $data['theme']);
			}
		}
		
		public function html() {
			?>
			<hr class="mb-4" />
			<div class="form-group row">
				<label for="theme" class="col-sm-2 col-form-label">Theme:</label>
				<div class="col-sm-10">
					<select name="theme" id="theme" class="form-control">
						<option value="-">Default</option>
						<?php
							foreach(new \DirectoryIterator($this->getPath()) AS $info) {
								if($info->isDot()) {
									continue;
								}

								$path	= sprintf('%s%s%s', $this->getPath(), DS, $info->getFilename());
								printf('<option value="%1$s"%2$s>%1$s</option>', basename($path), (Auth::getSettings('THEME', NULL, NULL) === basename($path) ? ' SELECTED' : ''));
							}
						?>
					</select>
				</div>
			</div>
			<?php
		}
	}
?>