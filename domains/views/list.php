<?php
	use fruithost\Accounting\Auth;
	use fruithost\Localization\I18N;
	use fruithost\System\HookParameters;
	
	$size	= count($this->applyFilter('MODULE_DOMAIN_LIST_TABLE_NAME', new HookParameters([], null)));
?>
<table class="table table-borderless table-striped table-hover">
	<thead>
		<tr>
			<th scope="col" colspan="<?php print (2 + $size); ?>"><?php I18N::__('Domain name'); ?></th>
			<th scope="col"><?php I18N::__('Home directory'); ?></th>
			<th scope="col"><?php I18N::__('Status'); ?></th>
			<th scope="col" colspan="2"></th>
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
										<div class="custom-control custom-checkbox">
											<input class="custom-control-input" type="checkbox" id="domain_<?php print $domain->id; ?>" name="domain[]" value="<?php print $domain->id; ?>" />
											<label class="custom-control-label" for="domain_<?php print $domain->id; ?>"></label>
										</div>
									<?php
								}
							?>
						</td>
						<?php
							if(count($table) > 0) {
								foreach($table AS $html) {
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
						<td><?php print $this->applyFilter('MODULE_DOMAIN_LIST_DIRECTORY', $domain->directory); ?></td>
						<td>
							<?php
								$parameters = new HookParameters([
									'text'	=> I18N::get('Unknown Error'),
									'html'	=> '<span class="text-danger">%s</span>'
								], $domain);
								
								if($domain->time_deleted !== null) {
									$parameters = new HookParameters([
										'text'	=> I18N::get('Deleting'),
										'html'	=> '<span class="text-danger">%s...</span>'
									], $domain);
								} else if($domain->time_created === null) {
									$parameters = new HookParameters([
										'text'	=> I18N::get('Pending'),
										'html'	=> '<span class="text-warning">%s...</span>'
									], $domain);
								} else if($domain->time_created !== null) {
									if(!file_exists(sprintf('%s%s/%s', HOST_PATH, Auth::getUsername(), $domain->directory))) {
										$parameters = new HookParameters([
											'text'	=> I18N::get('Error'),
											'html'	=> '<span class="text-danger">%s</span>'
										], $domain);
									} else {
										$parameters = new HookParameters([
											'text'	=> I18N::get('Live'),
											'html'	=> '<span class="text-success">%s</span>'
										], $domain);
									}
								}
								
								
								$status = $this->applyFilter('MODULE_DOMAIN_LIST_STATUS', $parameters);
								
								printf($status['html'], $status['text']);
							?>
						</td>
						<td class="text-right">
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
<script type="text/javascript">
	_watcher_domain = setInterval(function() {
		if(typeof(jQuery) !== 'undefined') {
			clearInterval(_watcher_domain);
			
			(function($) {
				$('button[name="action"].delete').on('click', function(event) {
					$(event.target).parent().parent().find('input[type="checkbox"][name="domain[]"]').prop('checked', true);
				});
			}(jQuery));
		}
	}, 500);
</script>