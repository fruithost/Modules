<?php
	use fruithost\Accounting\Auth;
	use fruithost\Localization\I18N;
?>
<div class="border rounded overflow-hidden mb-5">
	<table class="table table-borderless table-striped table-hover mb-0">
		<thead>
			<tr>
				<th class="bg-secondary-subtle" scope="col" colspan="2"><?php I18N::__('Path'); ?></th>
				<th class="bg-secondary-subtle" scope="col"><?php I18N::__('Status'); ?></th>
				<th class="bg-secondary-subtle" scope="col"><?php I18N::__('Actions'); ?></th>
			</tr>
		</thead>
		<tbody>
			<?php
				foreach($this->directorys AS $directory) {
					?>
						<tr>
							<td scope="row" width="1px">
								<div class="form-check">
									<input class="form-check-input" type="checkbox" id="protected_directory_<?php print $directory->id; ?>" name="protected_directory[]" value="<?php print $directory->id; ?>" />
									<label class="form-check-label" for="protected_directory_<?php print $directory->id; ?>"></label>
								</div>
							</td>
							<td>
								<?php
									print $this->applyFilter('MODULE_PROTECTED_DIRECTORY_LIST_PATH', $directory->path);
								?>
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
							<td class="text-end">
								<?php
									if($directory->time_created !== null && $directory->time_created !== null) {
										?>
											<button class="update btn btn-sm btn-success" type="button" data-bs-toggle="modal" data-bs-target="#change_protected_directory" name="change_protected_directory" id="change_directory_<?php print $directory->id; ?>" value='<?php print json_encode([
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
</div>
<script type="text/javascript">
	(() => {
		window.addEventListener('DOMContentLoaded', () => {
			[].map.call(document.querySelectorAll('button[name="action"].delete'), function(button) {
				button.addEventListener('click', function(event) {
					event.target.parentNode.parentNode.querySelector('input[type="checkbox"][name="protected_directory[]"]').checked = true;
				});
			});
			
			document.querySelector('#change_protected_directory').addEventListener('show.bs.modal', function(event) {
				try {
					let data	= JSON.parse(event.relatedTarget.value);
					let target	= event.target;
					
					target.querySelector('input[name="protected_directory_id"]').value 		= data.id;
					target.querySelector('input[name="protected_directory_message"]').value = data.message;
					target.querySelector('select[name="protected_directory_path"]').value 	= data.path;
					target.querySelector('select[name="protected_directory_path"]').dispatchEvent(new Event('change'));
				} catch(e) {
					console.log('malformed:', e);
				}
			});
		});
	})();
</script>