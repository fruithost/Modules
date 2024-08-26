<?php
	use fruithost\Modules\ModuleInterface;
	use fruithost\UI\Button;
	use fruithost\UI\Icon;
	use fruithost\Localization\I18N;
	use fruithost\Accounting\Auth;
	
	class FileManager extends ModuleInterface {
		private string $type = 'list';
		private array $files = [];

		public function load($submodule = null) : void {
			$this->addFilter('MODULES_PAGE_CLASSES', function($classes) {
				$classes[] = 'left';

				return $classes;
			});

			$this->addButton([
				(new Button())->setName('list')->setLabel(Icon::render('list'))->addClass('btn-outline-light'),
				(new Button())->setName('grid')->setLabel(Icon::render('grid'))->addClass('btn-outline-light')
			]);

			$this->addButton((new Button())->setName('reload')->setLabel(I18N::get('Update'))->addClass('btn-outline-primary'));

			$this->files = $this->getFiles(sprintf('%s%s/', HOST_PATH, Auth::getUsername()));

			$this->assign('root', sprintf('%s%s/', HOST_PATH, Auth::getUsername()));
			$this->assign('type', $this->type);
			$this->assign('files', $this->files);
		}

		public function onPOST($data = []) : void {
			if(isset($_POST['action'])) {
				switch($_POST['action']) {
					case 'list':
						$this->type = 'list';
					break;
					case 'grid':
						$this->type = 'grid';
					break;
				}
			}

			$this->assign('type', $this->type);
		}

		public function content() : void {
			foreach($this->getTemplate()->getAssigns() AS $name => $value) {
				${$name} = $value;
			}

			require_once('views/display.php');
		}
		
		function getFiles(string $dir) : array {
			$result	= [];
			$ffs	= scandir($dir);
			
			foreach($ffs AS $ff){
				if($ff != '.' && $ff != '..') {
					$path		= $dir . DS . $ff;
					
					$defaults	= [
						'name'			=> $ff,
						'path'			=> $dir,
						'permissions'	=> substr(sprintf('%o', fileperms($path)), -4),
						'user'			=> posix_getpwuid(fileowner($path)),
						'group'			=> posix_getpwuid(filegroup($path)),
						'time'			=> [
							'modified'	=> filemtime($path),
							'changed'	=> filectime($path),
							'accessed'	=> fileatime($path)
						]
					];
						
					/* is a Folder */
					if(is_dir($path)) {
						$result[]	= [
							'type'		=> 'directory',
							...$defaults,
							'children'	=> $this->getFiles($path)
						];
						
					/* is a File */
					} else {
						$result[] = [
							'type'	=> 'file',
							'size'	=> filesize($path),
							...$defaults,
							...pathinfo($ff)
						];
					}
				}    
			}
			
			return $result;
		}
	}
?>