<?php
	use fruithost\Accounting\Auth;
	use fruithost\Localization\I18N;
	use fruithost\System\HookParameters;
	
	$table	= $this->applyFilter('MODULE_DOMAIN_LIST_TABLE_NAME', new HookParameters([], null));
	$size	= 0;
	
	if(count($table) > 0) {
		foreach($table AS $html) {
			if(empty(trim($html))) {
				continue;
			}
			
			++$size;
		}
	}
?>
<div class="border rounded overflow-hidden mb-5">
	<table class="table table-borderless table-striped table-hover mb-0">
		<thead>
			<tr>
				<th class="bg-secondary-subtle" scope="col" colspan="<?php print (3 + $size); ?>"><?php I18N::__('Domain name'); ?></th>
				<th class="bg-secondary-subtle" scope="col"><?php I18N::__('Home directory'); ?></th>
				<th class="bg-secondary-subtle" scope="col"><?php I18N::__('Actions'); ?></th>
			</tr>
		</thead>
		<tbody>
			<?php
				foreach($this->domains AS $domain) {
					$table = $this->applyFilter('MODULE_DOMAIN_LIST_TABLE_NAME', new HookParameters([], $domain));
					?>
						<tr>
							<td scope="row" width="1px">
								<?php
									if($domain->time_deleted === null) {
										?>
											<div class="form-check">
												<input class="form-check-input" type="checkbox" id="domain_<?php print $domain->id; ?>" name="domain[]" value="<?php print $domain->id; ?>" />
												<label class="form-check-label" for="domain_<?php print $domain->id; ?>"></label>
											</div>
										<?php
									}
								?>
							</td>
							<td width="1px">
								<?php
									$parameters = new HookParameters([
										'text'	=> I18N::get('Unknown Error'),
										'html'	=> '<span class="badge text-bg-danger" data-bs-toggle="hover" data-bs-title="%s">&nbsp;</span>'
									], $domain);
									
									if($domain->time_deleted !== null) {
										$parameters = new HookParameters([
											'text'	=> I18N::get('Deleting'),
											'html'	=> '<span class="badge text-bg-danger" data-bs-toggle="hover" data-bs-title="%s">&nbsp;</span>'
										], $domain);
									} else if($domain->time_created === null) {
										$parameters = new HookParameters([
											'text'	=> I18N::get('Pending'),
											'html'	=> '<span class="badge text-bg-warning" data-bs-toggle="hover" data-bs-title="%s">&nbsp;</span>'
										], $domain);
									} else if($domain->time_created !== null) {
										if(!file_exists(sprintf('%s%s/%s', HOST_PATH, Auth::getUsername(), $domain->directory))) {
											$parameters = new HookParameters([
												'text'	=> I18N::get('Error'),
												'html'	=> '<span class="badge text-bg-danger" data-bs-toggle="hover" data-bs-title="%s">&nbsp;</span>'
											], $domain);
										} else {
											$parameters = new HookParameters([
												'text'	=> I18N::get('Live'),
												'html'	=> '<span class="badge text-bg-success" data-bs-toggle="hover" data-bs-title="%s">&nbsp;</span>'
											], $domain);
										}
									}
									
									
									$status = $this->applyFilter('MODULE_DOMAIN_LIST_STATUS', $parameters);
									
									printf($status['html'], $status['text']);
								?>
							</td>
							<?php
								if(count($table) > 0) {
									foreach($table AS $html) {
										if(empty(trim($html))) {
											continue;
										}
										
										print $html;
									}
								}
							?>
							<td>
								<?php
									$name = $this->applyFilter('MODULE_DOMAIN_LIST_NAME', new HookParameters([
										'name'	=> $domain->name,
										'link'	=> '<a href="http://%1$s/" target="_blank">%1$s</a></td>'
									], $domain));
									
									printf($name['link'], $name['name']);
								?>
							</div>						
							<td>
								<?php
									print $this->applyFilter('MODULE_DOMAIN_LIST_DIRECTORY', $domain->directory);
								?>
							</td>
							<td class="text-end">
								<?php
									if($domain->time_created !== null && $domain->time_created !== null) {
										/*?>
											<button class="logfiles btn btn-sm btn-info" type="submit" id="button" name="logfiles" id="logfiles_<?php print $domain->id; ?>" value="<?php print $domain->id; ?>">Logfile</button>
										<?php*/
									}
									
									if($domain->time_deleted === null) {
										?>
											<button class="delete btn btn-sm btn-danger" type="submit" name="action" value="delete" id="delete_<?php print $domain->id; ?>" value="<?php print $domain->id; ?>"><?php I18N::__('Delete'); ?></button>
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
		[].map.call(document.querySelectorAll('button[name="action"].delete'), function(element) {
			element.addEventListener('click', function(event) {
				event.target.parentNode.parentNode.querySelector('input[type="checkbox"][name="domain[]"]').checked = true;
			});
		});
	})();
</script>