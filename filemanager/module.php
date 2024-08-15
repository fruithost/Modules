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

		protected function getFiles(string $dir_path) : array {
			$rdi = new \RecursiveDirectoryIterator($dir_path, RecursiveDirectoryIterator::SKIP_DOTS);
			$rii = new \RecursiveIteratorIterator($rdi, RecursiveIteratorIterator::SELF_FIRST);
			$tree = [];

			foreach($rii AS $splFileInfo) {
				$file_name = $splFileInfo->getFilename();

				if($splFileInfo->isDir()) {
					$path =  [
						$file_name => []
					];
				} else {
					$path = [ pathinfo($file_name) ];
				}

				$path['DEP']= $rii->getDepth();

				for($depth = $rii->getDepth() - 1; $depth >= 0; --$depth) {
					$path = [
						$rii->getSubIterator($depth)->current()->getFilename() => $path
					];
				}

				$tree = [...$tree, ...$path];
			}

			return $tree;
		}
	}
?>