<?php
	use fruithost\Accounting\Auth;
	use fruithost\Localization\I18N;
?>
<div class="border rounded overflow-hidden mb-5">
	<table class="table table-borderless table-striped table-hover mb-0">
		<thead>
			<tr>
				<th class="bg-secondary-subtle" scope="col" colspan="2"><?php I18N::__('Database name'); ?></th>
				<th class="bg-secondary-subtle" scope="col"><?php I18N::__('Status'); ?></th>
				<th class="bg-secondary-subtle" scope="col"><?php I18N::__('Actions'); ?></th>
			</tr>
		</thead>
		<tbody>
			<?php
				foreach($this->databases AS $database) {
					?>
						<tr>
							<td scope="row" width="1px">
								<div class="form-check">
									<input class="form-check-input" type="checkbox" id="database_<?php print $database->id; ?>" name="database[]" value="<?php print $database->id; ?>" />
									<label class="form-check-label" for="database_<?php print $database->id; ?>"></label>
								</div>
							</td>
							<td><?php print Auth::getUsername($database->user_id); ?>_<?php print $database->name; ?></td>
							<td>
								<?php
									if($database->time_created === null) {
										printf('<span class="text-warning">%s...</span>', I18N::get('Pending'));
									} else if($database->time_created !== null) {
										// @ToDo Deamon with root access: Check status!
										/*if(fruithost\Storage\Database::count('SHOW DATABASES LIKE :name', [
											'name'	=> sprintf('%s_%s', Auth::getUsername($database->user_id), $database->name)
										]) === 0) {
											printf('<span class="text-danger">%s</span>', I18N::get('Error'));
										} else {*/
										
										printf('<span class="text-success">%s</span>', I18N::get('Live'));
									}
								?>
							</td>
							<td width="1px">
								<button class="delete btn btn-sm btn-danger" type="submit" id="button" name="delete" id="delete_<?php print $database->id; ?>" value="<?php print $database->id; ?>"><?php I18N::__('Delete'); ?></button>
							</td>
						</tr>
					<?php
				}
			?>
		</tbody>
	</table>
</div>