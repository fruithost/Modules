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
				<th class="bg-secondary-subtle" scope="col"><?php I18N::__('Directory'); ?></th>
				<th class="bg-secondary-subtle" scope="col"><?php I18N::__('Actions'); ?></th>
			</tr>
		</thead>
		<tbody>
			<?php
				foreach($this->accounts AS $account) {
					?>
						<tr>
							<td scope="row" width="1px">
								<?php
									if(!empty($account->username)) {
										?>
											<div class="form-check">
												<input class="form-check-input" type="checkbox" id="account_<?php print $account->id; ?>" name="account[]" value="<?php print $account->id; ?>" />
												<label class="form-check-label" for="account_<?php print $account->id; ?>"></label>
											</div>
										<?php
									}
								?>
							</td>
							<td><?php
								if(empty($account->username)) {
									print Auth::getUsername($account->user_id);
								} else {
									print Auth::getUsername($account->user_id); ?>_<?php print $account->username;
								}
							?></td>
							<td><?php print (empty($account->password) ? sprintf('<span class="text-warning">%s...</span>', I18N::get('Pending')) : sprintf('
													<div class="input-group input-group-sm w-50">
														<input type="password" autocomplete="false" class="form-control" value="%2$s" aria-label="%3$s" aria-describedby="password_viewer_%1$s" />
														<button type="button" class="input-group-text" id="password_viewer_%1$s" data-show="%5$s" data-hide="%6$s" name="password">%4$s</button>
													</div>', $account->user_id, $account->password, I18N::get('Password'), Icon::render('show'), htmlspecialchars(Icon::render('show')), htmlspecialchars(Icon::render('hide')))); ?></td>
							<td><?php
								$path = str_replace(HOST_PATH . Auth::getUsername($account->user_id), '', $account->path);
								
								if(empty($path)) {
									print '/ <i>(root)</i>';
								} else {
									print $path;
								}
							?></td>
							<td class="text-end">
								<button class="update btn btn-sm btn-info" type="button" data-bs-toggle="modal" data-bs-target="#change_account" name="change_account" id="account_<?php print $account->id; ?>" value='<?php print json_encode([
									'id'		=> $account->id,
									'username'	=> (empty($account->username) ? Auth::getUsername($account->user_id) : sprintf('%s_%s', Auth::getUsername($account->user_id), $account->username)),
									'path'		=> (empty($path) ? '/' : $path)
								]); ?>'><?php I18N::__('Edit'); ?></button>
								<?php
									if(!empty($account->username)) {
										?>
											<button class="delete btn btn-sm btn-danger" type="submit" name="action" value="delete" id="delete_<?php print $account->id; ?>" value="<?php print $account->id; ?>"><?php I18N::__('Delete'); ?></button>
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
</div>
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
			
			document.querySelector('#change_account').addEventListener('show.bs.modal', function(event) {
				try {
					let target	= event.target;
					let data	= JSON.parse(event.relatedTarget.value);
					
					
					target.querySelector('input[name="username"]').value	= data.username;
					target.querySelector('input[name="user_id"]').value		= data.id;
					target.querySelector('select[name="path"]').value		= data.path;
				} catch(e) {
					console.log('malformed:', e);
				}
			});
		});
	})();
</script>