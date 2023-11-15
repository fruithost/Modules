<?php
	namespace fruithost\Module\SSL\Providers;
	
	use fruithost\Localization\I18N;
    use fruithost\UI\Icon;
	
	class SelfSigned implements Provider  {
		public $name		= null;
		public $description	= null;
		
		public function __construct() {
			$this->name			= I18N::get('Self-Signed Certificate');
			$this->description	= I18N::get('Secure your site with a self-signed certificate: <ul><li>No trust from browsers</li><li>Own SSL informations</li><li>Connection is encrypted</li></ul>');
		}
		
		public function getKey() : string {
			return 'selfsigned';
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
			return 356;
		}
		
		public function renewUntil() : int | null {
			return null;
		}
		
		public function getIcon() : string | null {
			return Icon::render('self-signed', [
				'classes'		=> [ 'text-danger' ],
				'attributes'	=> [ 'style' => 'font-size: 28px' ]
			]);
		}
		
		public function execute($domain, $directory) {
			$path	= '/etc/fruithost/config/apache2/ssl/';
			$days	= 356;
			
			return sprintf('openssl req -x509 -sha256 -days %3$d -noenc -newkey rsa:2048 -subj "/CN=%2$s/O=fruithost/emailAddress=test@test.de" -keyout %1$s%2$s.key -out %1$s%2$s.cert', $path, $domain, $days);
		}
	}
?>