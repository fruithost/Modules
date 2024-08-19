<?php
	use fruithost\Modules\ModuleInterface;
	use fruithost\UI\Button;
	use fruithost\UI\Icon;
	use fruithost\Localization\I18N;
	use fruithost\Accounting\Auth;
	
	class Config extends ModuleInterface {
		public function load($submodule = null) : void {
			$this->addFilter('MODULES_PAGE_CLASSES', function($classes) {
				$classes[] = 'left';

				return $classes;
			});
		}


		public function content() : void {
			foreach($this->getTemplate()->getAssigns() AS $name => $value) {
				${$name} = $value;
			}

			require_once('views/display.php');
		}
	}
?>