<?php
	use fruithost\Accounting\Auth;
	use fruithost\Localization\I18N;
?>
<table class="table table-borderless table-striped table-hover">
	<thead>
		<tr>
			<th scope="col" colspan="2"><?php I18N::__('Name'); ?></th>
			<th scope="col"><?php I18N::__('Type'); ?></th>
			<th scope="col"><?php I18N::__('Action'); ?></th>
			<th scope="col"><?php I18N::__('Configuration'); ?></th>
			<th scope="col"><?php I18N::__('Status'); ?></th>
			<th scope="col"></th>
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
							<div class="custom-control custom-checkbox">
								<input class="custom-control-input" type="checkbox" id="cronjob_<?php print $cronjob->id; ?>" name="cronjob[]" value="<?php print $cronjob->id; ?>" />
								<label class="custom-control-label" for="cronjob_<?php print $cronjob->id; ?>"></label>
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
						<td class="text-right">
							<button class="update btn btn-sm btn-info" type="button" data-toggle="modal" data-target="#change_cron" name="change_cron" id="change_cron_<?php print $cronjob->id; ?>" value='<?php print json_encode([
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
<script type="text/javascript">
	_watcher_cronjobs = setInterval(function() {
		if(typeof(jQuery) !== 'undefined') {
			clearInterval(_watcher_cronjobs);
			
			(function($) {
				$('button[name="action"].delete').on('click', function(event) {
					$(event.target).parent().parent().find('input[type="checkbox"][name="cronjob[]"]').prop('checked', true);
				});
				
				$('#change_cron').on('show.bs.modal', function(event) {
					try {
						let data	= JSON.parse($(event.relatedTarget).val());
						let target	= $(event.target);
						
						$('input[name="type"]', target).prop('checked', false).trigger('change');
						$('input[name="cron_id"]', target).val(data.id);
						$('input[name="name"]', target).val(data.name);
						$('input[name="minute"]', target).val(data.task_minute);
						$('input[name="hour"]', target).val(data.task_hour);
						$('input[name="day"]', target).val(data.task_day);
						$('input[name="month"]', target).val(data.task_month);
						$('input[name="weekday"]', target).val(data.task_weekday);
						
						switch(data.command_type) {
							case 'PHP':
								$('input[name="type"][value="php"]', target).prop('checked', true).trigger('change');
								$('select[name="php"]', target).val(data.command_value.script);
								$('input[name="parameters"]', target).val(data.command_value.parameters);
							break;
							case 'URL':
								$('input[name="type"][value="url"]', target).prop('checked', true).trigger('change');
								$('input[name="url"]', target).val(data.command_value);
							break;
						}
					} catch(e) {
						console.log('malformed:', e);
					}
				});
			}(jQuery));
		}
	}, 500);
</script>