<?php
	use fruithost\Auth;
?>
<table class="table table-sm table-striped table-hover">
	<tr>
		<th colspan="2">Username</th>
		<th>Password</th>
		<th>Directory</th>
		<th></th>
	</tr>
	<?php
		foreach($this->accounts AS $account) {
			?>
				<tr>
					<td scope="row" width="1px"><input type="checkbox" name="account[]" value="<?php print $account->id; ?>" /></td>
					<td><?php
						if(empty($account->username)) {
							print Auth::getUsername($account->user_id);
						} else {
							print Auth::getUsername($account->user_id); ?>_<?php print $account->username;
						}
					?></td>
					<td><?php print (empty($account->password) ? '<span class="text-warning">Pending...</span>' : sprintf('
					<div class="input-group input-group-sm w-50">
						<input type="password" class="form-control" value="%s" aria-label="Password" aria-describedby="inputGroup-sizing-sm">
						<div class="input-group-append">
							<button type="button" class="input-group-text" id="inputGroup-sizing-sm" name="password">Show</button>
						</div>
					</div>', $account->password)); ?></td>
					<td><?php
						$path = str_replace(HOST_PATH . Auth::getUsername($account->user_id), '', $account->path);
						
						if(empty($path)) {
							print '/ <i>(root)</i>';
						} else {
							print $path;
						}
					?></td>
					<td class="text-right">
						<button class="delete btn btn-sm btn-danger" type="submit" id="button" name="delete" id="delete_<?php print $account->id; ?>" value="<?php print $account->id; ?>">Delete</button>
					</td>
				</tr>
			<?php
		}
	?>
</table>
<script type="text/javascript">
	_watcher = setInterval(function() {
		if(typeof(jQuery) !== 'undefined') {
			clearInterval(_watcher);
			
			(function($) {
				$('button[name="password"]').on('click', function(event) {
					if($(this).text() === 'Show') {
						$(this).text('Hide');
						$(this).parent().parent().find('input[type="password"]').attr('type', 'text');
					} else {
						$(this).text('Show');
						$(this).parent().parent().find('input[type="text"]').attr('type', 'password');
					}
				});
			}(jQuery));
		}
	}, 500);
</script>