<?php
	namespace fruithost\Module\SSL\Providers;
	
	use \fruithost\I18N;
	
	class SelfSigned implements Provider  {
		public $name		= null;
		public $description	= null;
		
		public function __construct() {
			$this->name			= I18N::get('Self-Signed Certificate');
			$this->description	= I18N::get('Secure your site with a self-signed certificate: <ul><li>No trust from browsers</li><li>Own SSL informations</li><li>Connection is encrypted</li></ul>');
		}
		
		public function getName() : string {
			return $this->name;
		}
		
		public function getDescription() : string {
			return $this->description;
		}
		
		public function isFree() : bool {
			return true;
		}
		
		public function renewPeriod() : int | null {
			return null;
		}
		
		public function renewUntil() : int | null {
			return null;
		}
		
		public function getIcon() : string | null {
			return '<i class="material-icons text-danger" style="font-size: 42px">gesture</i>';
		}
	}
?>