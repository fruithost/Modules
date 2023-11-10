<?php
	use fruithost\Localization\I18N;
?>
<div class="container">
	<?php
		if(!isset($this->defaults->{$submodule}) && empty($this->defaults->{$submodule})) {
			?>
				<div class="alert alert-danger mt-4" role="alert">
					<strong><?php I18N::__('Access denied!'); ?></strong>
					<p class="pb-0 mb-0"><?php I18N::__('You have no permissions for this page.'); ?></p>
				</div>
			<?php
		} else {
			foreach($this->defaults->{$submodule} AS $section => $entrys) {
				?>
					<div>
						<h5><?php I18N::__($section); ?></h5>
					</div>
				<?php
				foreach($entrys AS $name => $entry) {
					?>
						<div class="form-group row">
							<div class="col-1 text-right">
								<?php
									if(isset($entry->reference) && !empty($entry->reference)) {
										printf('<a href="%s" class="text-info text-decoration-none" target="_blank"><span class="d-inline-block material-icons">info</span></a>', $entry->reference);
									}
								?>
							</div>
							<label for="<?php print $name; ?>" class="col-4 col-form-label col-form-label-sm">
								<?php
									print $name;
									
									if(isset($entry->deprecated) && $entry->deprecated) {
										?>
											<mark class="small d-inline-block">
												<small>
													<span class="d-inline-block material-icons text-warning small middle" title="<?php I18N::__('This property is deprecated!'); ?>">warning</span>
													<?php I18N::__('DEPRECATED'); ?>
												</small>
											</mark>
										<?php
									}
								?>
							</label>
							<div class="col-7">
								<?php
									switch($entry->type) {
										case 'Boolean':
											$selected = $entry->default;
											
											if(isset($this->ini[$name])) {
												$selected = $this->ini[$name];
											}
											?>
												<select name="php[<?php print $name; ?>]" class="form-control">
													<option value="1"<?php print ($selected ? ' SELECTED' : ''); ?>><?php I18N::__('On'); ?><?php print ($entry->default ? sprintf(' (%s)', I18N::get('default')) : ''); ?></option>
													<option value="0"<?php print (!$selected ? ' SELECTED' : ''); ?>><?php I18N::__('Off'); ?><?php print (!$entry->default ? sprintf(' (%s)', I18N::get('default')) : ''); ?></option>
												</select>
											<?php
										break;
										case 'Text':
											$value = $entry->default;
											
											if(isset($this->ini[$name])) {
												$value = $this->ini[$name];
											}
											?>
												<input type="text" class="form-control" name="php[<?php print $name; ?>]" id="<?php print $name; ?>" value="<?php print $value; ?>" placeholder="<?php print (isset($entry->placeholder) ? $entry->placeholder : $entry->default); ?>" />
											<?php
										break;
										case 'Integer':
											$value = $entry->default;
											
											if(isset($this->ini[$name])) {
												$value = $this->ini[$name];
											}
											?>
												<input type="number" min="<?php print $entry->minimum; ?>" max="<?php print $entry->maximum; ?>" class="form-control" name="php[<?php print $name; ?>]" id="<?php print $name; ?>" value="<?php print $value; ?>" placeholder="<?php print (isset($entry->placeholder) ? $entry->placeholder : $entry->default); ?>" />
											<?php
										break;
										case 'List':
											$selected = $entry->default;
											
											if(isset($this->ini[$name])) {
												$selected = $this->ini[$name];
											}
											?>
												<select name="php[<?php print $name; ?>]" class="form-control">
													<?php
														foreach($entry->data AS $value) {
															printf('<option value="%1$s"%2$s>%1$s</option>', $value, ($value == $selected ? ' SELECTED' : ''));
														}
													?>
												</select>
											<?php
										break;
										case 'Flags':
											$value = $entry->default;
											
											if(isset($this->ini[$name])) {
												$value = $this->ini[$name];
											}
											?>
												<input type="text" class="form-control" name="php[<?php print $name; ?>]" id="<?php print $name; ?>" value="<?php print $value; ?>" placeholder="<?php print $entry->default; ?>" />
												
												<div class="row m-2">
													<a href="https://www.php.net/manual/de/language.operators.bitwise.php" class="text-info col-1 text-decoration-none" target="_blank">
														<span class="d-inline-block material-icons">info</span>
													</a>
													<div class="col-3">
														<strong><?php I18N::__('Possible Modifiers'); ?></strong>
														<ul>
															<?php
																foreach($entry->modifiers AS $value) {
																	printf('<ul>%1$s</ul>', $value);
																}
															?>
														</ul>
													</div>
													<div class="col-3">
														<strong><?php I18N::__('Possible Operators'); ?></strong>
														<ul>
															<?php
																foreach($entry->types AS $value) {
																	printf('<ul>%1$s</ul>', $value);
																}
															?>
														</ul>
													</div>
													<div class="col-5">
														<strong><?php I18N::__('Possible Flags'); ?></strong>
														<ul>
															<?php
																foreach($entry->possible AS $value) {
																	printf('<ul>%1$s</ul>', $value);
																}
															?>
														</ul>
													</div>
												</div>
											<?php
										break;
									}
								?>
							</div>
							<div class="text-muted ml-4"><!-- Description --></div>
						</div>
					<?php
				}
			}
		}
	?>
</div>