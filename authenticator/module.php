<?php
	use fruithost\Accounting\Auth;
	use fruithost\Modules\ModuleInterface;
	use fruithost\Localization\I18N;
	use fruithost\Storage\Database;
	use fruithost\UI\Modal;
    use fruithost\Network\Response;
    use fruithost\Accounting\Session;
	use fruithost\UI\Button;
	
	require_once('Authenticator.class.php');
	
	class Theme extends ModuleInterface {
		protected $auth			= null;
		protected $modal		= null;
		protected $secret		= null;
		protected $identifier	= 'authenticator';
		
		public function init() : void {
			$this->auth		= new Authenticator();
			$device			= Database::single('SELECT * FROM `' . DATABASE_PREFIX . '2fa_devices` WHERE `user_id`=:user_id AND `time_revoked` IS NULL LIMIT 1', [
				'user_id'	=> Auth::getID()
			]);
			
			if($device !== false) {
				$this->secret		= $device->secret;
			} else {
				$this->secret		= $this->auth->createSecret();
				$id			= Database::insert(DATABASE_PREFIX . '2fa_devices', [
					'id'			=> null,
					'user_id'		=> Auth::getID(),
					'secret'		=> $this->secret,
					'time_created'	=> date('Y-m-d H:i:s', time()),
					'time_revoked'	=> NULL
				]);				
			}
			
			$this->addAction('SAVE_ACCOUNT_SETTINGS_SECURITY',	[ $this, 'save' ]);
			$this->addAction('2FA_LOGIN-' . $this->identifier,	[ $this, 'onLogin' ]);
	
			$this->modal = new Modal($this->identifier, I18N::get('Verify Authenticator'), __DIR__ . '/views/create.php');
			$this->modal->addButton([
				(new Button())->setName('cancel')->setLabel(I18N::get('Cancel'))->addClass('btn-outline-danger')->setDismissable(),
				(new Button())->setName('create')->setLabel(I18N::get('Check'))->addClass('btn-outline-success')
			]);
			$this->modal->onSave([ $this, 'onCheck' ]);
			$this->addModal($this->modal, true);
			
			$this->addFilter('2FA_METHODS', [ $this, 'create2FAType' ], 50, false);
		}
		
		public function create2FAType($methods) {
			$methods[] = (object) [
				'id'		=> $this->identifier,
				'name'		=> I18N::get('Authenticator'),
				'enabled'	=> true
			];
			
			return $methods;
		}
		
		public function save($data) : ?string {
			if(isset($data['2fa_enabled']) && $data['2fa_enabled'] && $data['2fa_type'] == $this->identifier) {
				$this->modal->show([
					'secret'	=> $this->secret,
					'qr_code'	=> $this->auth->getQRCodeGoogleUrl('fruithost', $this->secret),
					'code'		=> $this->auth->getCode($this->secret),
					'timer'		=> 2 * 30
				]);
			}
			
			return '{}';
		}
		
		public function onCheck($data = []) : ?string {
			if(!$this->auth->verifyCode($this->secret, $data['code'], 2)) {
				return I18N::get('The code you entered is invalid!');
			}
			
			return 'close';
		}
		
		public function onLogin($data) : void {
			$device			= Database::single('SELECT * FROM `' . DATABASE_PREFIX . '2fa_devices` WHERE `user_id`=:user_id AND `time_revoked` IS NULL LIMIT 1', [
				'user_id'	=> $data->user_id
			]);
			
			if($device !== false) {
				$this->secret		= $device->secret;
			}
			
			if(!$this->auth->verifyCode($this->secret, $data->code, 2)) {
				$data->template->assign('error', I18N::get('The code you entered is invalid!'));
			} else {
				$result = Database::single('SELECT * FROM `' . DATABASE_PREFIX . 'users` WHERE `id`=:user_id LIMIT 1', [
					'user_id'	=> $data->user_id
				]);
				
				Session::set('user_name',	$result->username);
				Session::set('user_id',		(int) $result->id);
				Response::redirect('/overview');
			}
		}
	}
?>