<?php
	use fruithost\Auth;
?>
<table class="table table-borderless table-striped table-hover">
	<thead>
		<tr>
			<th scope="col" colspan="2">Path</th>
			<th scope="col">Status</th>
			<th scope="col"></th>
		</tr>
	</thead>
	<tbody>
		<?php
			foreach($this->directorys AS $directory) {
				?>
					<tr>
						<td scope="row" width="1px">
							<input type="checkbox" name="protected_directory[]" value="<?php print $directory->id; ?>" />
						</td>
						<td>
							<?php print $directory->path; ?>
						</td>
						<td>
							<?php
								if($directory->time_created === null) {
									print '<span class="text-warning">Pending...</span>';
								} else if($directory->time_created !== null) {
									if(!file_exists(sprintf('%s%s/%s', HOST_PATH, Auth::getUsername(), $directory->path))) {
										print '<span class="text-danger">Error</span>';
									} else {
										print '<span class="text-success">Live</span>';
									}
								}
							?>
						</td>
						<td class="text-right">
							<?php
								if($directory->time_created !== null && $directory->time_created !== null) {
									?>
										<button class="update btn btn-sm btn-info" type="button" data-toggle="modal" data-target="#change_protected_directory" name="change_protected_directory" id="change_directory_<?php print $directory->id; ?>" value='<?php print json_encode([
											'id'		=> $directory->id,
											'message'	=> $directory->message,
											'path'		=> $directory->path
										]); ?>'>Edit</button>
										<a href="<?php print $this->url('/module/protected-directorys?users=' . $directory->id); ?>" class="users btn btn-sm btn-info" name="users" id="users_<?php print $directory->id; ?>">Users</a>
									<?php
								}
							?>
							<button class="delete btn btn-sm btn-danger" type="submit" name="action" value="delete" id="delete_<?php print $directory->id; ?>">Delete</button>
						</td>
					</tr>
				<?php
			}
		?>
	</tbody>
</table>
<script type="text/javascript">
	_watcher_ftp = setInterval(function() {
		if(typeof(jQuery) !== 'undefined') {
			clearInterval(_watcher_ftp);
			
			(function($) {
				$('button[name="action"].delete').on('click', function(event) {
					$(event.target).parent().parent().find('input[type="checkbox"][name="protected_directory[]"]').prop('checked', true);
				});
				
				$('#change_protected_directory').on('show.bs.modal', function(event) {
					try {
						let data	= JSON.parse($(event.relatedTarget).val());
						let target	= $(event.target);
						
						$('input[name="protected_directory_id"]', target).val(data.id);
						$('input[name="protected_directory_message"]', target).val(data.message);
						$('select[name="protected_directory_path"]', target).val(data.path);
					} catch(e) {
						console.log('malformed:', e);
					}
				});
			}(jQuery));
		}
	}, 500);
</script>