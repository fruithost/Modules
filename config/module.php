<?php
	use fruithost\Modules\ModuleInterface;
	use fruithost\UI\Button;
	use fruithost\UI\Icon;
	use fruithost\Localization\I18N;
	use fruithost\Accounting\Auth;
	
	class Config extends ModuleInterface {
		private $tabs		= [
			'apache2'		=> 'Apache2',
			'ftp'	    	=> 'ProFTP',
			'mysql'		    => 'MySQL',
			'php'			=> 'PHP',
			'timezones'		=> 'Timezones',
		];
		
		private $file	= null;
		private $path	= CONFIG_PATH;
		private $files	= [
			'apache2'		=> [
				'global.conf',
				'panel.conf',
				'vhosts/user.conf'
			],
			'ftp'		=>  [
				'proftpd.conf',
				'modules.conf',
				'sql.conf'
			],
			'mysql'		=>  [
				'global.cnf'
			],
			'php'			=>  [
				'php.ini'
			],
			'timezones'		=>  [
				'timezones.json'
			],
		];
		
		public function load($submodule = null) : void {
			$this->addFilter('SUBMODULE_NAME', function($text) {
				if(isset($this->tabs[$text])) {
					return I18N::get($this->tabs[$text]);
				}
				
				return $text;
			});
			
			$this->addButton((new Button())->setName('reload')->setLabel(I18N::get('Update'))->addClass('btn-outline-primary'));
		}


		public function content($submodule = null) : void {
			if(empty($submodule)) {
				$submodule = array_keys($this->tabs)[0];
			}
			
			$content    = null;
			$files      = null;
			
			if(!empty($this->files[$submodule])) {
				$files = $this->files[$submodule];
			}
			
            if(isset($_GET['file'])) {
	            $this->file = $_GET['file'];
            } else {
	            $this->file = $files[0];
            }
			
            if(in_array($this->file, $files)) {
                $path    = sprintf('%s%s/%s', CONFIG_PATH, $submodule, $this->file);
	            
	            if(!file_exists($path)) {
		            $path    = sprintf('%s%s', CONFIG_PATH, $this->file);
	            }
                
                if(file_exists($path)) {
                    $content = file_get_contents($path);
                } else {
                    $content = false;
                }
            } else {
                $content = false;
            }
            
            $this->assign('content', $content);
			
			foreach($this->getTemplate()->getAssigns() AS $name => $value) {
				${$name} = $value;
			}
			?>
				<ul class="nav nav-tabs mb-4">
					<?php
						foreach($this->tabs AS $name => $label) {
							?>
								<li class="nav-item">
									<a class="nav-link<?php print ($submodule === $name ? ' active' : ''); ?>" href="<?php print $this->url(sprintf('/module/config/%s', $name)); ?>"><?php I18N::__($label); ?></a>
								</li>
							<?php
						}
						
						if(!empty($files)) {
							?>
								<li class="nav-item m-auto"></li>
								<li class="nav-item">
									<div class="input-group input-group-sm">
										<span class="input-group-text" id="label"><?php I18N::__('File'); ?>:</span>
										<select name="file" class="col form-select form-control-sm" aria-label="File" aria-describedby="label">
											<?php
												foreach($files AS $file) {
													printf('<option value="%1$s"%2$s>%1$s</option>', $file, ($file === $this->file ? ' SELECTED' : ''));
												}
											?>
										</select>
									</div>
								</li>
							<?php
						}
					?>
				</ul>
			<?php

			require_once('views/display.php');
		}
	}
?>