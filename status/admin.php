<?php
	use fruithost\Accounting\Auth;
	use fruithost\Localization\I18N;
?>
<div class="container">	
	<div class="form-group row">
		<label for="uptime_enabled" class="col-4 col-form-label col-form-label-sm"><?php I18N::__('Display Uptime'); ?></label>
		<div class="col-8 form-check">
			<input class="form-check-input" type="radio" name="UPTIME" id="uptime_enabled" value="true"<?php print ($module->getSettings('UPTIME', 'true') === 'true' ? ' CHECKED' : ''); ?> />
			<label class="form-check-label" for="iframe"><?php I18N::__('Enabled'); ?></label>
		</div>
		<div class="col-8 offset-4 form-check">
			<input class="form-check-input" type="radio" name="UPTIME" id="uptime_disabled" value="false"<?php print ($module->getSettings('UPTIME', 'true') === 'false' ? ' CHECKED' : ''); ?> />
			<label class="form-check-label" for="uptime_disabled"><?php I18N::__('Disabled'); ?></label>
		</div>
	</div>
	<div class="form-group row">
		<div class="col-4 col-form-label col-form-label-sm">
			<label for="uptime_enabled" class="col col-form-label col-form-label-sm p-0 m-0"><?php I18N::__('Services / Ports'); ?></label>
			<br /><button class="btn btn-success mt-3" name="add_service" type="button"><?php I18N::__('Add new Service'); ?></button>
		</div>
		<div class="col-8 form-check">
            <div class="border rounded overflow-hidden mb-5">
                <table class="table table-borderless table-striped table-hover mb-0">
                    <thead>
                        <tr>
                            <th scope="col"><?php I18N::__('Name'); ?></th>
                            <th scope="col"><?php I18N::__('Service'); ?></th>
                            <th scope="col"><?php I18N::__('Port'); ?></th>
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
                                            <button class="btn btn-outline-danger" name="delete_service" type="button"><?php I18N::__('Delete'); ?></button>
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
</div>
<div class="container pt-3 pb-2 mb-3 border-top">
    <div class="row">
        <div class="col text-end">
            <a class="btn btn-outline-danger mr-2" href="<?php print $this->url('/admin/modules' . (!empty($tab) ? '/' . $tab : '')); ?>"><?php I18N::__('Cancel'); ?></a>
            <button type="submit" name="action" value="settings" class="btn btn-outline-success"><?php I18N::__('Save'); ?></button>
        </div>
    </div>
</div>
<script type="text/javascript">
    (() => {
        function deleting(event) {
            let row     =  event.target.parentNode.parentNode;
            let del     = document.createElement('input');
            del.value   = 'true';
            del.type    = 'hidden';
            del.name    = 'service[' + row.dataset.index + '][delete]';
            row.parentNode.appendChild(del);
            row.classList.add('d-none');
        }
        
        [].map.call(document.querySelectorAll('button[name="delete_service"]'), function(element) {
            element.addEventListener('click', deleting);
        });

        document.querySelector('button[name="add_service"]').addEventListener('click', (event) => {
            let container	    = document.querySelector('tbody.services');
            let index		    = parseInt(container.dataset.length, 10) + 1;
            let row             = document.createElement('tr');
            row.dataset.index   = index;
            
            /* Service */
            let entry           = document.createElement('td');
            let input           = document.createElement('input');
            input.type          = 'text';
            input.name          = 'service[' + index + '][service]';
            input.placeholder   = '<?php I18N::__('Service'); ?>';
            input.classList.add('form-control');
            entry.appendChild(input);
            row.appendChild(entry);
            
            /* Name */
            entry               = document.createElement('td');
            input               = document.createElement('input');
            input.type          = 'text';
            input.name          = 'service[' + index + '][name]';
            input.placeholder   = '<?php I18N::__('Name'); ?>';
            input.classList.add('form-control');
            entry.appendChild(input);
            row.appendChild(entry);
            
            /* Port */
            entry               = document.createElement('td');
            input               = document.createElement('input');
            input.type          = 'number';
            input.min           = 0;
            input.max           = 65535;
            input.name          = 'service[' + index + '][port]';
            input.placeholder   = '<?php I18N::__('Port'); ?>';
            input.classList.add('form-control');
            entry.appendChild(input);
            row.appendChild(entry);
         
            /* Delete */
            entry               = document.createElement('td');
            let button          = document.createElement('button');
            button.type         = 'button';
            button.name         = 'delete_service';
            button.innerText    = '<?php I18N::__('Delete'); ?>';
            button.classList.add('btn');
            button.classList.add('btn-outline-danger');
            button.addEventListener('click', deleting);
            entry.appendChild(button);

            input               = document.createElement('input');
            input.type          = 'hidden';
            input.value         = 'new';
            input.name          = 'service[' + index + '][id]';
            row.appendChild(input);
            row.appendChild(entry);

            container.dataset.index = index;
            container.appendChild(row);
        });
    })();
</script>