<?php
	use fruithost\ModuleInterface;
	use fruithost\Database;
	use fruithost\Auth;
	use fruithost\Button;
	use fruithost\Modal;
	
	class Status extends ModuleInterface {
		private $services = NULL;
		
		public function init() {
			$this->services = Database::fetch('SELECT * FROM `fh_status`', []);
		}
		
		public function content() {
			?>
			<h4>Checking status of server</h4>
			<table class="table table-sm table-striped table-hover mt-4">
				<tr>
					<th>Service</th>
					<th>Status</th>
					<th></th>
				</tr>
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
			</table>
			
			<h4>Servcer Uptime</h4>
			<p>Since <?php print $this->getUptime(); ?></p>
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
						return '<span class="text-success">Online</span>';
					}
					
					return 'opened';
				break;
				case 'OFFLINE':
					if($beautify) {
						return '<span class="text-danger">Offline</span>';
					}
					
					return 'closed';
				break;
			}
		}
	}
?>