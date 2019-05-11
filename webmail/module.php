<?php		
	class Webmail extends fruithost\ModuleInterface {
		public function frame() {
			$username	= null;
			$password	= null;
			
			if(!empty($username) && !empty($password)) {
				return $this->url('/app/webmail/www?postlogin&Email=' . urlencode($username) . '&Password=' . urlencode($password));
			}
			
			return $this->url('/app/webmail/www');
		}
	}
?>