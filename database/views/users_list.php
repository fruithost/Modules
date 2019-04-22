<?php
	use fruithost\Auth;
?>
<table class="table table-sm table-striped table-hover">
	<tr>
		<th colspan="2">Username</th>
		<th>Password</th>
		<th>Database</th>
		<th>Status</th>
		<th></th>
	</tr>
	<?php
		foreach($this->users AS $user) {
			?>
				<tr>
					<td scope="row" width="1px"><input type="checkbox" name="user[]" value="<?php print $user->id; ?>" /></td>
					<td><?php print Auth::getUsername($user->user_id); ?>_<?php print $user->name; ?></td>
					<td><?php print (empty($user->password) ? '<span class="text-warning">Pending...</span>' : sprintf('
					<div class="input-group input-group-sm w-50">
						<input type="password" class="form-control" value="%s" aria-label="Password" aria-describedby="inputGroup-sizing-sm">
						<div class="input-group-append">
							<button type="button" class="input-group-text" id="inputGroup-sizing-sm" name="password">Show</button>
						</div>
					</div>', $user->password)); ?></td>
					<td><?php print Auth::getUsername($user->user_id) . '_' . $user->database; ?></td>
					<td>
						<?php
							if($user->time_created === null) {
								print '<span class="text-warning">Pending...</span>';
							} else if($user->time_created !== null) {
								if(fruithost\Database::count('SHOW DATABASES LIKE :name', [
									'name'	=> sprintf('%s_%s', Auth::getUsername($user->user_id), $user->name)
								]) === 0) {
									print '<span class="text-danger">Error</span>';
								} else {
									print '<span class="text-success">Live</span>';
								}
							}
						?>
					</td>
					<td class="text-right">
						<button class="delete btn btn-sm btn-danger" type="submit" id="button" name="delete" id="delete_<?php print $user->id; ?>" value="<?php print $user->id; ?>">Delete</button>
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