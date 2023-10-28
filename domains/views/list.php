<?php
	use fruithost\Auth;
?>
<table class="table table-borderless table-striped table-hover">
	<thead>
		<tr>
			<th scope="col" colspan="2">Domain name</th>
			<th scope="col">Home directory</th>
			<th scope="col">Status</th>
			<th scope="col" colspan="2"></th>
		</tr>
	</thead>
	<tbody>
		<?php
			foreach($this->domains AS $domain) {
				?>
					<tr>
						<td scope="row" width="1px">
							<?php
								if($domain->time_deleted === null) {
									?>
										<input type="checkbox" name="domain[]" value="<?php print $domain->id; ?>" />
									<?php
								}
							?>
						</td>
						<td><a href="http://<?php print $domain->name; ?>/" target="_blank"><?php print $domain->name; ?></a></td>
						<td><?php print $domain->directory; ?></td>
						<td>
							<?php
								if($domain->time_deleted !== null) {
									print '<span class="text-danger">Deleting...</span>';									
								} else if($domain->time_created === null) {
									print '<span class="text-warning">Pending...</span>';
								} else if($domain->time_created !== null) {
									if(!file_exists(sprintf('%s%s/%s', HOST_PATH, Auth::getUsername(), $domain->directory))) {
										print '<span class="text-danger">Error</span>';
									} else {
										print '<span class="text-success">Live</span>';
									}
								}
							?>
						</td>
						<td class="text-right">
							<?php
								if($domain->time_created !== null && $domain->time_created !== null) {
									/*?>
										<button class="logfiles btn btn-sm btn-info" type="submit" id="button" name="logfiles" id="logfiles_<?php print $domain->id; ?>" value="<?php print $domain->id; ?>">Logfile</button>
									<?php*/
								}
								
								if($domain->time_deleted === null) {
									?>
										<button class="delete btn btn-sm btn-danger" type="submit" name="action" value="delete" id="delete_<?php print $domain->id; ?>" value="<?php print $domain->id; ?>">Delete</button>
									<?php
								}
							?>
						</td>
					</tr>
				<?php
			}
		?>
	</tbody>
</table>
<script type="text/javascript">
	_watcher_domain = setInterval(function() {
		if(typeof(jQuery) !== 'undefined') {
			clearInterval(_watcher_domain);
			
			(function($) {
				$('button[name="action"].delete').on('click', function(event) {
					$(event.target).parent().parent().find('input[type="checkbox"][name="domain[]"]').prop('checked', true);
				});
			}(jQuery));
		}
	}, 500);
</script>