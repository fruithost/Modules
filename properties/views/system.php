<?php
	use fruithost\Localization\I18N;
	use fruithost\UI\Icon;
?>
<div class="border rounded overflow-hidden mb-5">
    <table class="table table-borderless table-striped table-hover mb-0">
        <thead>
        <tr>
            <th class="bg-secondary-subtle" scope="col"><?php I18N::__('Name'); ?></th>
            <th class="bg-secondary-subtle" scope="col"><?php I18N::__('Value'); ?></th>
        </tr>
        </thead>
        <tbody>
            <?php
                foreach($constants AS $category => $data) {
					foreach($data AS $name => $value) {
						?>
							<tr>
								<td>
									<input type="text" class="form-control" value="<?php print $name; ?>" disabled />
								</td>
								<td>
									<?php
										if($value == '[** PROTECTED **]') {
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
										} else if($value == BS) {
											?>
												<span class="badge text-bg-light p-2"><?php print BS; ?></span>
											<?php
										} else if($value == DS) {
											?>
												<span class="badge text-bg-light p-2"><?php print DS; ?></span>
											<?php
										} else if($value == TAB) {
											?>
												<span class="badge text-bg-light p-2">\t</span>
											<?php
										} else if(is_bool($value)) {
											?>
												<select class="form-control">
													<option value="true"<?php print ($value ? ' SELECTED' : ''); ?>>true</option>
													<option value="false"<?php print (!$value ? ' SELECTED' : ''); ?>>false</option>
												</select>
											<?php
										} else {
											?>
												<input class="form-control" value="<?php print $value; ?>" />
											<?php
										}
									?>
								</td>
							</tr>
						<?php
					}
                }
            ?>
        </tbody>
    </table>
</div>