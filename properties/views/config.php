<?php
	use fruithost\Localization\I18N;
	use fruithost\UI\Icon;
?>
<div class="border rounded overflow-hidden mb-5">
    <table class="table table-borderless table-striped table-hover mb-0">
        <thead>
        <tr>
            <!--<th class="bg-secondary-subtle" scope="col"><?php I18N::__('ID'); ?></th>-->
            <th class="bg-secondary-subtle" scope="col"><?php I18N::__('Name'); ?></th>
            <th class="bg-secondary-subtle" scope="col"><?php I18N::__('Value'); ?></th>
            <!--<th class="bg-secondary-subtle" scope="col"><?php I18N::__('Actions'); ?></th>-->
        </tr>
        </thead>
        <tbody>
            <?php
                foreach($properties AS $entry) {
					?>
                        <tr>
							<!--<td scope="row" width="1px">
                                <div class="input-group input-group-sm check-group mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="property_<?php print $entry->id; ?>" name="property[]" value="<?php print $entry->id; ?>" />
                                        <label class="form-check-label" for="property_<?php print $entry->id; ?>"></label>
                                    </div>
                                    <small class="input-group-text" style="font-size: 12px; padding: 2px 5px;">#<?php print $entry->id; ?></small>
                                </div>
                            </td>-->
                            <td>
                                <input type="text" class="form-control" value="<?php print $entry->key; ?>" />
                            </td>
                            <td>
                                <?php
									if(defined('DEMO') && DEMO && $entry->key == 'UPDATE_LICENSE') {
										?>
											<div class="alert alert-warning m-0 p-1" role="alert">
												<?php
													Icon::show('warning');
												?> <strong><?php I18N::__('Warning'); ?></strong>
												<div>
													<?php I18N::__('This value is not visible in the demo version.'); ?>
												</div>
											</div>
										<?php
									} else if(is_bool($entry->value)) {
										?>
                                            <select class="form-control">
                                                <option value="true"<?php print ($entry->value ? ' SELECTED' : ''); ?>>true</option>
                                                <option value="false"<?php print (!$entry->value ? ' SELECTED' : ''); ?>>false</option>
                                            </select>
										<?php
									} else {
                                        ?>
                                            <input class="form-control" value="<?php print $entry->value; ?>" />
                                        <?php
									}
                                ?>
                            </td>
                            <!--<td width="1px">
                                <div class="btn-group" role="group">
                                    <?php
                                       printf('<button name="action" value="deletes" data-confirm="%s" class="btn btn-danger deletes">%s</button>', I18N::get('Do you really wan\'t to delete the property?'), I18N::get('Delete'));
                                    ?>
                                </div>
                            </td>-->
                        </tr>
					<?php
                }
            ?>
        </tbody>
    </table>
</div>
