<?php
	use fruithost\Modules\ModuleInterface;
	use fruithost\Storage\Database;
	
	class FAQ extends ModuleInterface {
		private $categories = [];
		
		public function init() : void {
			$this->categories = Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'faq_categories`');
			
			foreach($this->categories AS $index => $category) {
				if(isset($_POST['query']) && !empty($_POST['query'])) {
					$this->categories[$index]->entries = Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'faq_entries` WHERE `category`=:category AND (`question` LIKE :query OR `answer` LIKE :query)', [
						'category'	=> $category->id,
						'query'		=> sprintf('%%%s%%', $_POST['query'])
					]);
				} else {
					$this->categories[$index]->entries = Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'faq_entries` WHERE `category`=:category', [
						'category' => $category->id
					]);
				}
				
				if(empty($this->categories[$index]->entries)) {
					unset($this->categories[$index]);
				}
			}
		}
		
		public function content() : void {
			require_once('views/header.php');
			require_once('views/results.php');
		}
	}
?>