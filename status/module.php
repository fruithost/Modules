<?php
	use fruithost\Modules\ModuleInterface;
	use fruithost\Storage\Database;
	use fruithost\Accounting\Auth;
	use fruithost\Localization\I18N;
	use fruithost\UI\Button;
	use fruithost\UI\Modal;
	use fruithost\UI\Icon;
	
	class Status extends ModuleInterface {
		private $services = NULL;
		
		public function init() : void {
			$this->services = Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'status`', []);
		}
		
		public function getServices() : array {
			return $this->services;
		}
		public function getAvailableServices() : string {
            $online = 0;
            $offline = 0;
            
            foreach($this->services AS $service) {
                switch($service->status) {
	                case 'ONLINE':
                        ++$online;
                        break;
                    case 'OFFLINE':
                        ++$offline;
                        break;
                }
            }
            
			return sprintf('<span class="text-success">%d</span> / <span class="text-danger">%d</span> / %d', $online, $offline, count($this->services));
		}
		
		public function onSettings($data = []) : void {
			if(isset($data['UPTIME'])) {
				if(in_array($data['UPTIME'], [
					'true',
					'false'
				])) {
					$this->setSettings('UPTIME', $data['UPTIME']);
				}
			}
			
			if(isset($data['service'])) {
				foreach($data['service'] AS $entry) {
					if($entry['id'] === 'new') {
						Database::insert(DATABASE_PREFIX . 'status', [
							'id'		=> NULL,
							'service'	=> $entry['service'],
							'name'		=> $entry['name'],
							'port'		=> $entry['port'],
							'status'	=> 'OFFLINE',
							'time'		=> NULL
						]);
					} else {
						if(isset($entry['delete'])) {
							Database::delete(DATABASE_PREFIX . 'status', [
								'id'		=> $entry['id']
							]);
						} else {
							Database::update(DATABASE_PREFIX . 'status', 'id', [
								'id'		=> $entry['id'],
								'service'	=> $entry['service'],
								'name'		=> $entry['name'],
								'port'		=> $entry['port']
							]);
						}
					}
				}
			}
			
			$this->services = Database::fetch('SELECT * FROM `' . DATABASE_PREFIX . 'status`', []);
			$this->getTemplate()->assign('success', 'Settings was successfully saved!');
		}
		
		public function content($submodule = null) : void {
            ?>
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-xl-4 col-md-6 col-sm-6">
                            <div class="card text-break">
                                <div class="card-header d-flex flex-row p-0">
				                    <?php
					                    Icon::show('bookmark-star', [
						                    'classes'    => [
							                    'align-self-start',
							                    'flex-shrink-1',
							                    'bg-dark',
							                    'rounded',
							                    'text-light',
							                    'p-2',
							                    'm-2'
						                    ],
						                    'attributes' => [ 'style' => 'font-size: 30px' ]
					                    ]);
				                    ?>
                                    <span class="align-self-start flex-fill p-0 ml-2 mt-1">
                                        <small><?php I18N::__('Services'); ?></small>
                                        <h4 class="p-0 m-o"><?php print $this->getAvailableServices(); ?></h4>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <?php
                            if($this->getSettings('UPTIME', 'true') === 'true') {
                                ?>
                                    <div class="col-xl-4 col-md-6 col-sm-6">
                                        <div class="card text-break">
                                            <div class="card-header d-flex flex-row p-0">
                                                <?php
                                                    Icon::show('uptime', [
                                                        'classes'    => [
                                                            'align-self-start',
                                                            'flex-shrink-1',
                                                            'bg-dark',
                                                            'rounded',
                                                            'text-light',
                                                            'p-2',
                                                            'm-2'
                                                        ],
                                                        'attributes' => [ 'style' => 'font-size: 30px' ]
                                                    ]);
                                                ?>
                                                <span class="align-self-start flex-fill p-0 ml-2 mt-1">
                                                    <small><?php I18N::__('Uptime'); ?></small>
                                                    <h4 class="p-0 m-o"><?php print $this->getUptime(); ?></h4>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                <?php
                            }
                        ?>
                    </div>
                    <div class="row border rounded overflow-hidden mb-5 mt-5">
                        <table class="table table-borderless table-striped table-hover m-0 p-0">
                            <thead>
                                <tr>
                                    <th class="bg-secondary-subtle" scope="col"><?php I18N::__('Service'); ?></th>
                                    <th class="bg-secondary-subtle" scope="col"><?php I18N::__('Status'); ?></th>
                                    <th class="bg-secondary-subtle" scope="col"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                    foreach($this->services AS $service) {
                                        ?>
                                            <tr>
                                                <td><?php print $service->name; ?></td>
                                                <td><?php print $this->getStatus($service->status, true)?></td>
                                                <td><small>Port <?php print $service->port; ?> is <?php print $this->getStatus($service->status)?>.</small></td>
                                            </tr>
                                        <?php
                                    }
                                ?>
                            </tbody>
                        </table>
                    </div>
                </div>
			<?php
		}
		
		public function getUptime() {
			$uptime		= trim(shell_exec('cat /proc/uptime'));
			$uptime		= explode(' ', $uptime);
			$uptime		= $uptime[0];
			$day		= 86400;
			$days		= floor($uptime / $day);
			$utdelta	= $uptime - ($days * $day);
			$hour		= 3600;
			$hours		= floor($utdelta / $hour);
			$utdelta	-=$hours * $hour;
			$minute		= 60;
			$minutes	= floor($utdelta / $minute);
			$output		= '';
			
			if($days != 1) {
				$output .= $days . ' days';
			} else {
				$output .= $days . ' day';				
			}
			
			$output .= ', ';
			
			if($hours != 1) {
				$output .= $hours . ' hours';
			} else {
				$output .= $hours . ' hour';				
			}
			
			$output .= ', ';
			
			if($minutes != 1) {
				$output .= $minutes . ' minutes';
			} else {
				$output .= $minutes . ' minute';				
			}
			
			return $output;
		}
		
		public function getStatus($status, $beautify = false) {
			switch($status) {
				case 'ONLINE':
					if($beautify) {
						return sprintf('<span class="text-success">%s</span>', I18N::get('Online'));
					}
					
					return 'opened';
				break;
				case 'OFFLINE':
					if($beautify) {
						return sprintf('<span class="text-danger">%s</span>', I18N::get('Offline'));
					}
					
					return 'closed';
				break;
			}
		}
	}
?>