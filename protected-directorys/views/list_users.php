<?php
	use fruithost\Accounting\Auth;
	use fruithost\Localization\I18N;
	use fruithost\UI\Icon;
?>
<div class="border rounded overflow-hidden mb-5">
	<table class="table table-borderless table-striped table-hover mb-0">
		<thead>
			<tr>
				<th class="bg-secondary-subtle" scope="col" colspan="2"><?php I18N::__('Username'); ?></th>
				<th class="bg-secondary-subtle" scope="col"><?php I18N::__('Password'); ?></th>
				<th class="bg-secondary-subtle" scope="col"><?php I18N::__('Actions'); ?></th>
			</tr>
		</thead>
		<tbody>
			<?php
				foreach($this->users AS $user) {
					?>
						<tr>
							<td scope="row" width="1px">
								<div class="form-check">
									<input class="form-check-input" type="checkbox" id="protected_directory_user_<?php print $user->id; ?>" name="protected_directory_user[]" value="<?php print $user->id; ?>" />
									<label class="form-check-label" for="protected_directory_user_<?php print $user->id; ?>"></label>
								</div>
							</td>
							<td>
								<?php print $user->username; ?>
							</td>
							<td><?php print (empty($user->password) ? sprintf('<span class="text-warning">%s...</span>', I18N::get('Pending')) : sprintf('
								<div class="input-group input-group-sm w-50">
									<input type="password" autocomplete="false" class="form-control" value="%2$s" aria-label="%3$s" aria-describedby="password_viewer_%1$s" />
									<button type="button" class="input-group-text" id="password_viewer_%1$s" data-show="%5$s" data-hide="%6$s" name="password">%4$s</button>
								</div>', $user->id, $user->password, I18N::get('Password'), Icon::render('show'), htmlspecialchars(Icon::render('show')), htmlspecialchars(Icon::render('hide')))); ?></td>
							<td class="text-end">
								<button class="update btn btn-sm btn-info" type="button" data-bs-toggle="modal" data-bs-target="#change_protected_directory_user" name="change_protected_directory_user" id="change_directory_user_<?php print $user->id; ?>" value='<?php print json_encode([
									'id'			=> $user->id,
									'username'		=> $user->username,
									'path'			=> $this->directory->path,
									'directory'		=> $this->directory->id
								]); ?>'><?php I18N::__('Edit'); ?></button>
								<button class="delete btn btn-sm btn-danger" type="submit" name="action" value="delete" id="delete_<?php print $user->id; ?>"><?php I18N::__('Delete'); ?></button>
							</td>
						</tr>
					<?php
				}
			?>
		</tbody>
	</table>
</table>
<script type="text/javascript">
	(() => {
		window.addEventListener('DOMContentLoaded', () => {
			[].map.call(document.querySelectorAll('button[name="action"].delete'), function(element) {
				element.addEventListener('click', function(event) {
					event.target.parentNode.parentNode.querySelector('input[type="checkbox"][name="protected_directory_user[]"]').checked = true;
				});
			});
			
			[].map.call(document.querySelectorAll('button[name="password"]'), function(button) {
				button.addEventListener('click', function(event) {
					let destination = this.parentNode.parentNode.querySelector('input[type]');
					let target		= event.target;
					
					if(target.tagName !== 'BUTTON') {
						target = target.parentNode;
					}
					
					if(destination.getAttribute('type') === 'password') {
						this.innerHTML = target.dataset.hide;
						destination.setAttribute('type', 'text');
					} else {
						this.innerHTML = target.dataset.show;
						destination.setAttribute('type', 'password');
					}
				});
			});
			
			document.querySelector('#change_protected_directory_user').addEventListener('show.bs.modal', function(event) {
				try {
					let target	= event.target;
					let data	= JSON.parse(event.relatedTarget.value);
					
					target.querySelector('input[name="protected_directory_user_id"]').value		= data.id;
					target.querySelector('input[name="protected_directory_id"]').value			= data.directory;
					target.querySelector('input[name="protected_directory_username"]').value	= data.username;
					target.querySelector('input[name="protected_directory_path"]').value		= data.path;
				} catch(e) {
					console.log('malformed:', e);
				}
			});
		});
	})();
</script>