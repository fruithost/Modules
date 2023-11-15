<?php
	use fruithost\Accounting\Auth;
	use fruithost\Localization\I18N;
?>
<div class="border rounded overflow-hidden mb-5">
	<table class="table table-borderless table-striped table-hover mb-0">
		<thead>
			<tr>
				<th class="bg-secondary-subtle" scope="col" colspan="2"><?php I18N::__('Name'); ?></th>
				<th class="bg-secondary-subtle" scope="col"><?php I18N::__('Type'); ?></th>
				<th class="bg-secondary-subtle" scope="col"><?php I18N::__('Action'); ?></th>
				<th class="bg-secondary-subtle" scope="col"><?php I18N::__('Configuration'); ?></th>
				<th class="bg-secondary-subtle" scope="col"><?php I18N::__('Status'); ?></th>
				<th class="bg-secondary-subtle" scope="col"><?php I18N::__('Actions'); ?></</th>
			</tr>
		</thead>
		<tbody>
			<?php
				foreach($this->cronjobs AS $cronjob) {
					$value	= NULL;
					$html	= NULL;
					
					switch($cronjob->command_type) {
						case 'PHP':
							$data	= json_decode($cronjob->command_value);
							$value	= $data;
							$html	= sprintf('<code>%1$s "%2$s"</code>', $data->script, $data->parameters);
						break;
						case 'URL':
							$value	= $cronjob->command_value;
							$html	= sprintf('<a href="%1$s" target="_blank">%1$s</a>', $cronjob->command_value);
						break;
					}
					?>
						<tr>
							<td scope="row" width="1px">
								<div class="form-check">
									<input class="form-check-input" type="checkbox" id="cronjob_<?php print $cronjob->id; ?>" name="cronjob[]" value="<?php print $cronjob->id; ?>" />
									<label class="form-check-label" for="cronjob_<?php print $cronjob->id; ?>"></label>
								</div>
							</td>
							<td><?php print (empty($cronjob->name) ? sprintf('<i>%s</i>', I18N::get('Not named')) : $cronjob->name); ?></td>
							<td><?php print $cronjob->command_type; ?></td>
							<td><?php print $html; ?></td>
							<td>
								<code><?php printf('%s %s %s %s %s', $cronjob->task_minute, $cronjob->task_hour, $cronjob->task_day, $cronjob->task_month, $cronjob->task_weekday); ?></code>
							</td>
							<td>
								<?php
									if($cronjob->time_running === null) {
										printf('<span class="text-warning">%s</span>', I18N::get('Never running'));
									} else {
										print '<span class="text-success">' . date(Auth::getSettings('TIME_FORMAT', NULL, 'd.m.Y - H:i'), strtotime($cronjob->time_running)) . '</span>';
									}
								?>
							</td>
							<td class="text-end">
								<button class="update btn btn-sm btn-info" type="button" data-bs-toggle="modal" data-bs-target="#change_cron" name="change_cron" id="change_cron_<?php print $cronjob->id; ?>" value='<?php print json_encode([
									'id'			=> $cronjob->id,
									'name'			=> $cronjob->name,
									'task_minute'	=> $cronjob->task_minute,
									'task_hour'		=> $cronjob->task_hour,
									'task_day'		=> $cronjob->task_day,
									'task_month'	=> $cronjob->task_month,
									'task_weekday'	=> $cronjob->task_weekday,
									'command_type'	=> $cronjob->command_type,
									'command_value'	=> $value
								]); ?>'><?php I18N::__('Edit'); ?></button>
								<button class="delete btn btn-sm btn-danger" type="submit" id="button" name="action" id="delete_<?php print $cronjob->id; ?>" value="delete"><?php I18N::__('Delete'); ?></button>
							</td>
						</tr>
					<?php
				}
			?>
		</tbody>
	</table>
</div>
<script type="text/javascript">
	(() => {
		window.addEventListener('DOMContentLoaded', () => {
			[].map.call(document.querySelectorAll('button[name="action"].delete'), function(button) {
				button.addEventListener('click', function(event) {
					event.target.parentNode.parentNode.querySelector('input[type="checkbox"][name="cronjob[]"]').checked = true;
				});
			});
			
			document.querySelector('#change_cron').addEventListener('show.bs.modal', function(event) {
				try {
					let data	= JSON.parse(event.relatedTarget.value);
					let target	= event.target;
					
					target.querySelector('input[name="cron_id"]').value	= data.id;
					target.querySelector('input[name="name"]').value	= data.name;
					target.querySelector('input[name="minute"]').value	= data.task_minute;
					target.querySelector('input[name="hour"]').value	= data.task_hour;
					target.querySelector('input[name="day"]').value		= data.task_day;
					target.querySelector('input[name="month"]').value	= data.task_month;
					target.querySelector('input[name="weekday"]').value	= data.task_weekday;
					
					switch(data.command_type) {
						case 'PHP':
							target.querySelector('input[name="type"][value="php"]').checked = true;
							target.querySelector('select[name="php"]').value				= data.command_value.script;
							target.querySelector('input[name="parameters"]').value			= data.command_value.parameters;
							
							target.querySelector('input[name="type"][value="php"]').dispatchEvent(new Event('change'));
						break;
						case 'URL':
							target.querySelector('input[name="type"][value="url"]').checked = true;
							target.querySelector('input[name="url"]').value					= data.command_value;
							
							target.querySelector('input[name="type"][value="url"]').dispatchEvent(new Event('change'));
						break;
					}
				} catch(e) {
					console.log('malformed:', e);
				}
			});
		});
	})();
</script>