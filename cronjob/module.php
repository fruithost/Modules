<?php
	use fruithost\ModuleInterface;
	use fruithost\Database;
	use fruithost\Auth;
	use fruithost\Button;
	use fruithost\Modal;
	
	class Cronjob extends ModuleInterface {
		private $cronjobs = [];
		
		public function init() {
			$this->addModal((new Modal('create_cron', 'Create Cronjob', __DIR__ . '/views/create.php'))->addButton([
				(new Button())->setName('cancel')->setLabel('Cancel')->addClass('btn-outline-danger')->setDismissable(),
				(new Button())->setName('create')->setLabel('Create')->addClass('btn-outline-success')
			])->onSave([ $this, 'onSave' ]));
			
			$this->cronjobs = Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'cronjobs` WHERE `user_id`=:user ORDER BY `id` ASC', [
				'user'	=> Auth::getID()
			]);
		}
		
		public function load() {
			if(empty($this->cronjobs)) {
				$this->addButton((new Button())->setName('create')->setLabel('Create')->addClass('btn-outline-success')->setModal('create_cron'));
			} else {
				$this->addButton([
					(new Button())->setName('create')->setLabel('Create New')->addClass('btn-outline-success')->setModal('create_cron'),
					(new Button())->setName('delete')->setLabel('Delete selected')->addClass('btn-outline-danger')
				]);				
			}
		}
		
		public function onSave($data = []) {
			if(!isset($data['minute']) || !($data['minute'] == '*' || ($data['minute'] >= 0 && $data['minute'] <= 59))) {
				return 'Please enter a valid minute!';
			}
			
			if(!isset($data['hour']) || !($data['hour'] == '*' || ($data['hour'] >= 0 && $data['hour'] <= 23))) {
				return 'Please enter a valid hour!';
			}
			
			if(!isset($data['day']) || !($data['day'] == '*' || ($data['day'] >= 1 && $data['day'] <= 31))) {
				return 'Please enter a valid day!';
			}
			
			if(!isset($data['month']) || !($data['month'] == '*' || ($data['month'] >= 1 && $data['month'] <= 12))) {
				return 'Please enter a valid month!';
			}
			
			if(!isset($data['weekday']) || !($data['weekday'] == '*' || ($data['weekday'] >= 0 && $data['weekday'] <= 6))) {
				return 'Please enter a valid weekday!';
			}
			
			switch($data['type']) {
				case 'php':
					if(!isset($data['php']) || !preg_match('/\.php$/', $data['php'])) {
						return 'Please enter a valid PHP script!';
					}
					
					$id = Database::insert(DATABASE_PREFIX . 'cronjobs', [
						'id'			=> null,
						'user_id'		=> Auth::getID(),
						'task_minute'	=> $data['minute'],
						'task_hour'		=> $data['hour'],
						'task_day'		=> $data['day'],
						'task_month'	=> $data['month'],
						'task_weekday'	=> $data['weekday'],
						'command_type'	=> 'PHP',
						'command_value'	=> json_encode([
							'script'		=> $data['php'],
							'parameters'	=> $data['parameters']
						]),
						'name'			=> (empty($data['name']) ? NULL : $data['name']),
						'time_created'	=> date('Y-m-d H:i:s', time()),
						'time_running'	=> NULL
					]);
					
					return true;
				break;
				case 'url':
					if(!isset($data['url']) || !preg_match('/^(http|https):\/\//Uis', $data['url'])) {
						return 'Please enter a valid URL!';
					}
					
					$id = Database::insert(DATABASE_PREFIX . 'cronjobs', [
						'id'			=> null,
						'user_id'		=> Auth::getID(),
						'task_minute'	=> $data['minute'],
						'task_hour'		=> $data['hour'],
						'task_day'		=> $data['day'],
						'task_month'	=> $data['month'],
						'task_weekday'	=> $data['weekday'],
						'command_type'	=> 'URL',
						'command_value'	=> $data['url'],
						'name'			=> (empty($data['name']) ? NULL : $data['name']),
						'time_created'	=> date('Y-m-d H:i:s', time()),
						'time_running'	=> NULL
					]);
					
					return true;
				break;
				default:
					return 'Please enter a valid action!';
				break;
			}
		}
		
		public function content() {
			if(empty($this->cronjobs)) {
				require_once('views/empty.php');
			} else {
				require_once('views/list.php');
			}
		}
	}
?>