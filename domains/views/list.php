<?php
	use fruithost\Auth;
?>
<table class="table table-sm table-striped table-hover">
	<tr>
		<th colspan="2">Domain name</th>
		<th>Home directory</th>
		<th>Status</th>
		<th></th>
		<th></th>
	</tr>
	<?php
		foreach($this->domains AS $domain) {
			?>
				<tr>
					<td scope="row" width="1px"><input type="checkbox" name="domain[]" value="<?php print $domain->id; ?>" /></td>
					<td><a href="http://<?php print $domain->name; ?>/" target="_blank"><?php print $domain->name; ?></a></td>
					<td><?php print $domain->directory; ?></td>
					<td>
						<?php
							if($domain->time_created === null) {
								print '<span class="text-warning">Pending...</span>';
							} else if($domain->time_created !== null) {
								if(!file_exists(sprintf('%s%s/%s', HOST_PATH, Auth::getUsername(), $domain->directory))) {
									print '<span class="text-danger">Error</span>';
								} else {
									print '<span class="text-success">Live</span>';
								}
							}
						?>
					</td>
					<td class="text-right">
						<?php
							if($domain->time_created !== null && $domain->time_created !== null) {
								?>
									<button class="logfiles btn btn-sm btn-info" type="submit" id="button" name="logfiles" id="logfiles_<?php print $domain->id; ?>" value="<?php print $domain->id; ?>">Logfile</button>
									<button class="disable btn btn-sm btn-secondary" type="submit" id="button" name="disable" id="disable_<?php print $domain->id; ?>" value="<?php print $domain->id; ?>">Disable</button>
								<?php
							}
						?>
						<button class="delete btn btn-sm btn-danger" type="submit" id="button" name="delete" id="delete_<?php print $domain->id; ?>" value="<?php print $domain->id; ?>">Delete</button>
					</td>
				</tr>
			<?php
		}
	?>
</table>