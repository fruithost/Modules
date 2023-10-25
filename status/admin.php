<?php
	use fruithost\Auth;
?>
<div class="container">	
	<div class="form-group row">
		<label for="uptime_enabled" class="col-4 col-form-label col-form-label-sm">Display Uptime</label>
		<div class="col-8 form-check">
			<input class="form-check-input" type="radio" name="UPTIME" id="uptime_enabled" value="true"<?php print ($module->getSettings('UPTIME', 'true') === 'true' ? ' CHECKED' : ''); ?> />
			<label class="form-check-label" for="iframe">Enabled</label>
		</div>
		<div class="col-8 offset-4 form-check">
			<input class="form-check-input" type="radio" name="UPTIME" id="uptime_disabled" value="false"<?php print ($module->getSettings('UPTIME', 'true') === 'false' ? ' CHECKED' : ''); ?> />
			<label class="form-check-label" for="uptime_disabled">Disabled</label>
		</div>
	</div>
	<div class="form-group row">
		<div class="col-4 col-form-label col-form-label-sm">
			<label for="uptime_enabled" class="col col-form-label col-form-label-sm p-0 m-0">Services / Ports</label>
			<button class="btn btn-success mt-3" name="add_service" type="button">Add new Service</button>
		</div>
		<div class="col-8 form-check">
			<table class="table table-borderless table-striped table-hover mt-4 mb-4">
				<thead>
					<tr>
						<th scope="col">Name</th>
						<th scope="col">Service</th>
						<th scope="col">Port</th>
						<th scope="col"></th>
					</tr>
				</thead>
				<tbody class="services" data-length="<?php print count($module->getInstance()->getServices()); ?>">
					<?php
						foreach($module->getInstance()->getServices() AS $index => $service) {
							?>
								<tr data-index="<?php print $index; ?>">
									<td>
										<input type="text" name="service[<?php print $index; ?>][service]" class="form-control" placeholder="Service" value="<?php print $service->service; ?>" />
									</td>
									<td>
										<input type="text" name="service[<?php print $index; ?>][name]" class="form-control" placeholder="Name" value="<?php print $service->name; ?>" />
									</td>
									<td>
										<input type="number" min="0" max="65535" name="service[<?php print $index; ?>][port]" placeholder="Port" class="form-control" value="<?php print $service->port; ?>" />
									</td>
									<td>
										<input type="hidden" name="service[<?php print $index; ?>][id]" value="<?php print $service->id; ?>" />
										<button class="btn btn-danger" name="delete_service" type="button">Delete</button>
									</td>
								</tr>
							<?php
						}
					?>
				</tbody>
			</table>
		</div>
	</div>
	
</div>
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-top">
	<div class="container">
		<div class="row text-center">
			<a href="<?php print $this->url('/admin/modules' . (!empty($tab) ? '/' . $tab : '')); ?>" class="btn d-inline-block btn-outline-danger mr-2">Cancel</a>
			<button type="submit" name="action" value="settings" class="btn d-inline-block btn-outline-success">Save</button>				
		</div>
	</div>
</div>
<script type="text/javascript">
	_watcher_cronadmin = setInterval(function() {
		if(typeof(jQuery) !== 'undefined') {
			clearInterval(_watcher_cronadmin);
			
			(function($) {
				$('button[name="delete_service"]').on('click', function(event) {
					let row = $(event.target).parent().parent();
					$(event.target).parent().append('<input type="hidden" name="service[' + row.data('index') + '][delete]" value="true" />');
					row.hide();
				});
				
				$('button[name="add_service"]').on('click', function(event) {
					let container	= $('tbody.services');
					let index		= parseInt(container.data('index'), 10) + 1;
					let html		= '<tr data-index="' + index + '">' +
										'<td>' +
											'<input type="text" name="service[' + index + '][service]" class="form-control" placeholder="Service" />' +
										'</td>' +
										'<td>' +
											'<input type="text" name="service[' + index + '][name]" class="form-control" placeholder="Name" />' +
										'</td>' +
										'<td>' +
											'<input type="number" min="0" max="65535" name="service[' + index + '][port]" placeholder="Port" class="form-control" />' +
										'</td>' +
										'<td>' +
											'<input type="hidden" name="service[' + index + '][id]" value="new" />' +
											'<button class="btn btn-danger" name="delete_service" type="button">Delete</button>' +
										'</td>' +
									'</tr>';
					
					container.append(html);
					container.data('index', index);
				});
			}(jQuery));
		}
	}, 500);
</script>