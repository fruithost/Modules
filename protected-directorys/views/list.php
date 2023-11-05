<?php
	use fruithost\Auth;
	use fruithost\I18N;
?>
<table class="table table-borderless table-striped table-hover">
	<thead>
		<tr>
			<th scope="col" colspan="2"><?php I18N::__('Path'); ?></th>
			<th scope="col"><?php I18N::__('Status'); ?></th>
			<th scope="col"></th>
		</tr>
	</thead>
	<tbody>
		<?php
			foreach($this->directorys AS $directory) {
				?>
					<tr>
						<td scope="row" width="1px">
							<div class="custom-control custom-checkbox">
								<input class="custom-control-input" type="checkbox" id="protected_directory_<?php print $directory->id; ?>" name="protected_directory[]" value="<?php print $directory->id; ?>" />
								<label class="custom-control-label" for="protected_directory_<?php print $directory->id; ?>"></label>
							</div>
						</td>
						<td>
							<?php print $directory->path; ?>
						</td>
						<td>
							<?php
								if($directory->time_created === null) {
									printf('<span class="text-warning">%s...</span>', I18N::get('Pending'));
								} else if($directory->time_created !== null) {
									if(!file_exists(sprintf('%s%s/%s', HOST_PATH, Auth::getUsername(), $directory->path))) {
										printf('<span class="text-danger">%s</span>', I18N::get('Error'));
									} else {
										printf('<span class="text-success">%s</span>', I18N::get('Live'));
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
										]); ?>'><?php I18N::__('Edit'); ?></button>
										<a href="<?php print $this->url('/module/protected-directorys?users=' . $directory->id); ?>" class="users btn btn-sm btn-info" name="users" id="users_<?php print $directory->id; ?>"><?php I18N::__('Users'); ?></a>
									<?php
								}
							?>
							<button class="delete btn btn-sm btn-danger" type="submit" name="action" value="delete" id="delete_<?php print $directory->id; ?>"><?php I18N::__('Delete'); ?></button>
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