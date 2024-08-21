<?php
	use fruithost\Modules\ModuleInterface;
	use fruithost\UI\Button;
	use fruithost\UI\Icon;
	use fruithost\Localization\I18N;
	use fruithost\Accounting\Auth;
	
	class Properties extends ModuleInterface {
		private $tabs		= [
			'config'	=> 'Config',
			'system'	=> 'System'
		];

		public function load($submodule = null) : void {
			$this->addFilter('SUBMODULE_NAME', function($text) {
				if(isset($this->tabs[$text])) {
					return I18N::get($this->tabs[$text]);
				}
				
				return $text;
			});
			
			switch($submodule) {
				case 'system':
					$this->assign('constants', [
						'config' => [
							'DATABASE_HOSTNAME'		=> DATABASE_HOSTNAME,
							'DATABASE_USERNAME'		=> DATABASE_USERNAME,
							'DATABASE_PASSWORD'		=> (defined('DEMO') && DEMO ? '[** PROTECTED **]' : DATABASE_PASSWORD),
							'DATABASE_NAME'			=> DATABASE_NAME,
							'DATABASE_PREFIX'		=> DATABASE_PREFIX,
							'HOST_PATH'				=> HOST_PATH,
							'CONFIG_PATH'			=> CONFIG_PATH,
							'LOG_PATH'				=> LOG_PATH,
							'DEBUG'					=> DEBUG,
							'DEMO'					=> DEMO,
							'UPDATE_ENDPOINT'		=> UPDATE_ENDPOINT
						],
						'mail' => [
							'MAIL_EXTERNAL'			=> MAIL_EXTERNAL,
							'MAIL_HOSTNAME'			=> MAIL_HOSTNAME,
							'MAIL_PORT'				=> MAIL_PORT,
							'MAIL_USERNAME'			=> MAIL_USERNAME,
							'MAIL_PASSWORD'			=> (defined('DEMO') && DEMO ? '[** PROTECTED **]' : MAIL_PASSWORD),
						],
						'salt' => [
							'MYSQL_PASSWORTD_SALT'	=> (defined('DEMO') && DEMO ? '[** PROTECTED **]' : MYSQL_PASSWORTD_SALT),
							'RESET_PASSWORD_SALT'	=> (defined('DEMO') && DEMO ? '[** PROTECTED **]' : RESET_PASSWORD_SALT),
							'ENCRYPTION_SALT'		=> (defined('DEMO') && DEMO ? '[** PROTECTED **]' : ENCRYPTION_SALT),
						],
						'other' => [
							'TAB'	=> TAB,
							'BS'	=> BS,
							'DS'	=> DS,
							'PATH'	=> PATH
						]
					]);
				break;
				default:
					$this->assign('properties', $this->getCore()->getSettings());
				break;
			}
		}

		public function content($submodule = null) : void {
			foreach($this->getTemplate()->getAssigns() AS $name => $value) {
				${$name} = $value;
			}

			if(empty($submodule)) {
				$submodule = array_keys($this->tabs)[0];
			}
			?>
				<ul class="nav nav-tabs mb-4">
					<?php
						foreach($this->tabs AS $name => $label) {
							?>
								<li class="nav-item">
									<a class="nav-link<?php print ($submodule === $name ? ' active' : ''); ?>" href="<?php print $this->url(sprintf('/module/properties/%s', $name)); ?>"><?php I18N::__($label); ?></a>
								</li>
							<?php
						}
					?>
				</ul>
				<form>
					<?php
						switch($submodule) {
							case 'system':
								$this->display(sprintf('%s/views/%s.php', dirname(__FILE__), $submodule));
							break;
							default:
								$this->display(sprintf('%s/views/config.php', dirname(__FILE__)));
							break;
						}
					?>
				</form>
			<?php
		}
	}
?>