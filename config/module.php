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
		private $type	= null;
		private $content	= null;
		private $current	= null;
		private $path	= CONFIG_PATH;
		private $list	= [];
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
				'php.ini',
				'global.conf'   => 'properties',
                'panel.conf'    => 'properties'
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
			
			$this->addButton([
                (new Button())->setName('save')->setLabel(I18N::get('Save'))->addClass('btn-outline-success'),
                (new Button())->setName('reload')->setLabel(I18N::get('Reload'))->addClass('btn-outline-primary')
            ]);
			
			if(empty($submodule)) {
				$submodule = array_keys($this->tabs)[0];
			}
   
			$this->list      = null;
			
			if(!empty($this->files[$submodule])) {
				$this->list = $this->files[$submodule];
			}
			
			if(isset($_GET['file'])) {
				$this->file = $_GET['file'];
			} else {
				$this->file = $this->list[0];
			}
			
			
			if(array_key_exists($this->file, $this->list) || in_array($this->file, $this->list)) {
				$this->current    = sprintf('%s%s/%s', CONFIG_PATH, $submodule, $this->file);
				
				if(!file_exists($this->current)) {
					$this->current    = sprintf('%s%s', CONFIG_PATH, $this->file);
				}
				
				if(file_exists($this->current)) {
					$this->content = file_get_contents($this->current);
				} else {
					$this->content = false;
				}
			} else {
				$this->content = false;
			}
			
			if(array_key_exists($this->file, $this->list)) {
				$this->type = $this->list[$this->file];
			} else {
                switch(pathinfo($this->current, PATHINFO_EXTENSION)) {
                    case "json":
                        $this->type = "json";
                    break;
                    case "conf":
                        $this->type = "config";
                    break;
                    case "ini":
                    case "cnf":
                        $this->type = "properties";
                        break;
                    default:
                        $this->type = "javascript";
                    break;
                }
			}
		}
		
		public function onPost($data = []) : void {			
            if(isset($data['action']) && $data['action'] == 'save') {
                $this->content = $data['content'];
                
	            if(!file_exists($this->current)) {
                    $this->assign('error', sprintf(I18N::get('The file %s not exists!'), $this->current));
                    return;
	            }
             
	            if(!is_writable($this->current)) {
                    $this->assign('error', sprintf(I18N::get('The file %s can\'t be written!'), $this->current));
                    return;
	            }
                
                // @ToDo Check Filelist, otherwitse File-Injection can be used!
	            if(file_put_contents($this->current, $this->content)) {
		            $this->assign('success', sprintf(I18N::get('The file %s was saved.'), $this->current));
                    return;
	            }
             
	            $this->assign('error', sprintf(I18N::get('The file %s can\'t be saved!'), $this->current));
            }
		}

		public function content($submodule = null) : void {
			if(empty($submodule)) {
				$submodule = array_keys($this->tabs)[0];
			}
            
            $this->assign('content', $this->content);
            $this->assign('type', $this->type);
			
			foreach($this->getTemplate()->getAssigns() AS $name => $value) {
                if($name === 'submodule') {
                    continue;
                }
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
						
						if(!empty($this->list)) {
							?>
								<li class="nav-item m-auto"></li>
								<li class="nav-item">
									<div class="input-group input-group-sm">
										<span class="input-group-text" id="label"><?php I18N::__('File'); ?>:</span>
										<select name="file" class="col form-select form-control-sm" aria-label="File" aria-describedby="label">
											<?php
												foreach($this->list AS $index => $file) {
                                                    if(!is_numeric($index)) {
	                                                    $file = $index;
                                                    }
                                                    
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