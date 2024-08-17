<?php
	use fruithost\Accounting\Auth;
	use fruithost\Localization\I18N;
	use fruithost\UI\Icon;
?>
<table class="table table-borderless table-striped table-hover">
	<thead>
		<tr>
			<th colspan="2"><?php I18N::__('Username'); ?></th>
			<th><?php I18N::__('Password'); ?></th>
			<th><?php I18N::__('Database'); ?></th>
			<th><?php I18N::__('Status'); ?></th>
			<th></th>
		</tr>
	</thead>
	<tbody>
		<?php
			foreach($this->users AS $user) {
				?>
					<tr>
						<td scope="row" width="1px">
							<div class="form-check">
								<input class="form-check-input" type="checkbox" id="user_<?php print $user->id; ?>" name="user[]" value="<?php print $user->id; ?>" />
								<label class="form-check-label" for="user_<?php print $user->id; ?>"></label>
							</div>
						</td>
						<td><?php print Auth::getUsername($user->user_id); ?>_<?php print $user->name; ?></td>
						<td><?php print (empty($user->password) ? sprintf('<span class="text-warning">%s...</span>', I18N::get('Pending')) : sprintf('
													<div class="input-group input-group-sm w-50">
														<input type="password" autocomplete="false" class="form-control" value="%2$s" aria-label="%3$s" aria-describedby="password_viewer_%1$s" />
														<button type="button" class="input-group-text" id="password_viewer_%1$s" data-show="%5$s" data-hide="%6$s" name="password">%4$s</button>
													</div>', $user->user_id, $user->password, I18N::get('Password'), Icon::render('show'), htmlspecialchars(Icon::render('show')), htmlspecialchars(Icon::render('hide')))); ?></td>
						
						<td><?php print Auth::getUsername($user->user_id) . '_' . $user->database; ?></td>
						<td>
							<?php
								if($user->time_created === null) {
									printf('<span class="text-warning">%s...</span>', I18N::get('Pending'));
								} else if($user->time_created !== null) {
									// @ToDo Deamon with root access: Check status!
									/*if(fruithost\Storage\Database::count('SHOW DATABASES WHERE `Database`=:name', [
										'name'	=> sprintf('%s_%s', Auth::getUsername($user->user_id), $user->database)
									]) === 0) {
										printf('<span class="text-danger">%s</span>', I18N::get('Error'));
									} else {*/
									
									printf('<span class="text-success">%s</span>', I18N::get('Live'));
								}
							?>
						</td>
						<td class="text-right">
							<button class="delete btn btn-sm btn-danger" type="submit" name="action" value="delete" id="delete_<?php print $user->id; ?>" value="<?php print $user->id; ?>"><?php I18N::__('Delete'); ?></button>
						</td>
					</tr>
				<?php
			}
		?>
	</tbody>
</table>
<script type="text/javascript">
	(() => {
		window.addEventListener('DOMContentLoaded', () => {
			[].map.call(document.querySelectorAll('button[name="action"].delete'), function(element) {
				element.addEventListener('click', function(event) {
					event.target.parentNode.parentNode.querySelector('input[type="checkbox"][name="account[]"]').checked = true;
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
		});
	})();
</script>