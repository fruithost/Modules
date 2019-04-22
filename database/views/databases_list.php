<?php
	use fruithost\Auth;
?>
<table class="table table-sm table-striped table-hover">
	<tr>
		<th colspan="2">Database name</th>
		<th>Status</th>
		<th></th>
	</tr>
	<?php
		foreach($this->databases AS $database) {
			?>
				<tr>
					<td scope="row" width="1px"><input type="checkbox" name="database[]" value="<?php print $database->id; ?>" /></td>
					<td><?php print Auth::getUsername($database->user_id); ?>_<?php print $database->name; ?></td>
					<td>
						<?php
							if($database->time_created === null) {
								print '<span class="text-warning">Pending...</span>';
							} else if($database->time_created !== null) {
								if(fruithost\Database::count('SHOW DATABASES LIKE :name', [
									'name'	=> sprintf('%s_%s', Auth::getUsername($database->user_id), $database->name)
								]) === 0) {
									print '<span class="text-danger">Error</span>';
								} else {
									print '<span class="text-success">Live</span>';
								}
							}
						?>
					</td>
					<td class="text-right">
						<button class="delete btn btn-sm btn-danger" type="submit" id="button" name="delete" id="delete_<?php print $database->id; ?>" value="<?php print $database->id; ?>">Delete</button>
					</td>
				</tr>
			<?php
		}
	?>
</table>