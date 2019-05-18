<?php
	use fruithost\Auth;
	use fruithost\ModuleInterface;
	
	class Theme extends ModuleInterface {
		public function init() {
			$this->addFilter('theme_name', function($name) {
				if(Auth::isLoggedIn()) {
					return Auth::getSettings('THEME', NULL, $name);
				}
				
				return $name;
			});
			
			$this->addAction('ACCOUNT_SETTINGS_GLOBAL', [ $this, 'html' ]);
			$this->addAction('SAVE_ACCOUNT_SETTINGS_GLOBAL', [ $this, 'save' ]);
		}
		
		public function onSettings($data = []) {
			if(isset($data['themes'])) {
				$selected = [];
				
				foreach($this->getThemes(NULL, true) AS $theme) {
					if(in_array($theme, $data['themes'])) {
						$selected[] = $theme;
					}
				}
				
				$this->setSettings('THEMES', json_encode($selected));
			} else {
				$this->setSettings('THEMES', json_encode([]));
			}
			
			$this->getTemplate()->assign('success', 'Settings was successfully saved!');
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
		
		public function getThemes($selections = NULL, $raw = false) {
			$themes = [];
			
			foreach(new \DirectoryIterator($this->getPath()) AS $info) {
				if($info->isDot()) {
					continue;
				}

				$path		= sprintf('%s%s%s', $this->getPath(), DS, $info->getFilename());
				$selected	= false;
				
				if(!empty($selections)) {
					if(is_array($selections)) {
						$selected = in_array(basename($path), $selections);
					} else {
						$selected = ($selections === basename($path));
					}
				}
				
				if($raw) {
					$themes[] = basename($path);
				} else {
					$themes[] = [
						'name'	 	=> basename($path),
						'path'		=> $path,
						'selected'	=> $selected
					];
				}
			}

			return $themes;
		}
		
		public function html() {
			$available = json_decode($this->getSettings('THEMES', json_encode([])));
			?>
			<hr class="mb-4" />
			<div class="form-group row">
				<label for="theme" class="col-sm-2 col-form-label">Theme:</label>
				<div class="col-sm-10">
					<select name="theme" id="theme" class="form-control">
						<option value="-">Default</option>
						<?php
							foreach($this->getThemes(Auth::getSettings('THEME', NULL, NULL)) AS $theme) {
								$show = false;
								
								if(!empty($available)) {
									if(is_array($available)) {
										$show = in_array($theme['name'], $available);
									} else {
										$show = ($available === $theme['name']);
									}
								}
								
								if($show) {
									printf('<option value="%1$s"%2$s>%1$s</option>', $theme['name'], ($theme['selected'] ? ' SELECTED' : ''));
								}
							}
						?>
					</select>
				</div>
			</div>
			<?php
		}
	}
?>