<?php
	use fruithost\Accounting\Auth;
	use fruithost\Localization\I18N;
?>
<table class="table table-borderless table-striped table-hover">
	<thead>
		<tr>
			<th scope="col" colspan="2"><?php I18N::__('Username'); ?></th>
			<th scope="col"><?php I18N::__('Password'); ?></th>
			<th scope="col"><?php I18N::__('Directory'); ?></th>
			<th scope="col"></th>
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
										<div class="custom-control custom-checkbox">
											<input class="custom-control-input" type="checkbox" id="account_<?php print $account->id; ?>" name="account[]" value="<?php print $account->id; ?>" />
											<label class="custom-control-label" for="account_<?php print $account->id; ?>"></label>
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
							<div class="input-group-append">
								<button type="button" class="input-group-text" id="password_viewer_%1$s" name="password">%4$s</button>
							</div>
						</div>', $account->user_id, $account->password, I18N::get('Password'), I18N::get('Show'))); ?></td>
						<td><?php
							$path = str_replace(HOST_PATH . Auth::getUsername($account->user_id), '', $account->path);
							
							if(empty($path)) {
								print '/ <i>(root)</i>';
							} else {
								print $path;
							}
						?></td>
						<td class="text-right">
							<button class="update btn btn-sm btn-info" type="button" data-toggle="modal" data-target="#change_account" name="change_account" id="account_<?php print $account->id; ?>" value='<?php print json_encode([
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
<script type="text/javascript">
	_watcher_ftp = setInterval(function() {
		if(typeof(jQuery) !== 'undefined') {
			clearInterval(_watcher_ftp);
			
			(function($) {
				$('button[name="action"].delete').on('click', function(event) {
					$(event.target).parent().parent().find('input[type="checkbox"][name="account[]"]').prop('checked', true);
				});
				
				$('button[name="password"]').on('click', function(event) {
					if($(this).text() === 'Show') {
						$(this).text('Hide');
						$(this).parent().parent().find('input[type="password"]').attr('type', 'text');
					} else {
						$(this).text('Show');
						$(this).parent().parent().find('input[type="text"]').attr('type', 'password');
					}
				});
				
				$('#change_account').on('show.bs.modal', function(event) {
					try {
						let data	= JSON.parse($(event.relatedTarget).val());
						let target	= $(event.target);
						
						
						$('input[name="username"]', target).val(data.username);
						$('input[name="user_id"]', target).val(data.id);
						$('select[name="path"]', target).val(data.path);
					} catch(e) {
						console.log('malformed:', e);
					}
				});
			}(jQuery));
		}
	}, 500);
</script>