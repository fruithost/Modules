<?php
	use fruithost\Auth;
?>
<table class="table table-borderless table-striped table-hover">
	<thead>
		<tr>
			<th scope="col" colspan="2">Name</th>
			<th scope="col">Type</th>
			<th scope="col">Action</th>
			<th scope="col">Configuration</th>
			<th scope="col">Status</th>
			<th scope="col"></th>
		</tr>
	</thead>
	<tbody>
		<?php
			foreach($this->cronjobs AS $cronjob) {
				?>
					<tr>
						<td scope="row" width="1px"><input type="checkbox" name="cronjob[]" value="<?php print $cronjob->id; ?>" /></td>
						<td><?php print (empty($cronjob->name) ? '<i>Not named</i>' : $cronjob->name); ?></td>
						<td><?php print $cronjob->command_type; ?></td>
						<td><?php
							switch($cronjob->command_type) {
								case 'PHP':
									$data = json_decode($cronjob->command_value);
									
									printf('<code>%1$s "%2$s"</code>', $data->script, $data->parameters);
								break;
								case 'URL':
									printf('<a href="%1$s" target="_blank">%1$s</a>', $cronjob->command_value);
								break;
							}
						?></td>
						<td>
							<code><?php printf('%s %s %s %s %s', $cronjob->task_minute, $cronjob->task_hour, $cronjob->task_day, $cronjob->task_month, $cronjob->task_weekday); ?></code>
						</td>
						<td>
							<?php
								if($cronjob->time_running === null) {
									print '<span class="text-warning">Never running</span>';
								} else {
									print '<span class="text-success">' . date(Auth::getSettings('TIME_FORMAT', NULL, 'd.m.Y - H:i'), strtotime($cronjob->time_running)) . '</span>';
								}
							?>
						</td>
						<td class="text-right">
							<button class="delete btn btn-sm btn-danger" type="submit" id="button" name="delete" id="delete_<?php print $cronjob->id; ?>" value="<?php print $cronjob->id; ?>">Delete</button>
						</td>
					</tr>
				<?php
			}
		?>
	</tbody>
</table>