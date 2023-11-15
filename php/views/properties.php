<?php
	use fruithost\Localization\I18N;
	use fruithost\UI\Icon;
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
				<div class="card mt-2">
					<div class="card-header d-flex flex-row">
						<?php I18N::__($section); ?>
					</div>
					<div class="card-body p-0 overflow-hidden">
						<table class="table m-0 table-borderless table-striped">
							<thead>
								<tr>
									<th colspan="2">
										<?php I18N::__('Name'); ?>
									</th>
									<th>
										<?php I18N::__('Value'); ?>
									</th>
								</tr>
							</thead>
							<tbody>
								<?php
									foreach($entrys AS $name => $entry) {
										?>
											<tr>
												<td style="width: 1px">
													<?php
														if(isset($entry->reference) && !empty($entry->reference)) {
															printf('<a href="%s" class="text-info text-decoration-none" target="_blank">%s</a>', $entry->reference, Icon::render('info', [
																'classes' => [ 'd-inline-block' ]
															]));
														}
													?>
												</td>
												<td style="width: 50%">
													<?php
														print $name;
														
														if(isset($entry->deprecated) && $entry->deprecated) {
															?>
																<br />
																<mark class="small d-inline-block mt-2">
																	<small>
																		<?php
																			Icon::show('warning', [
																				'classes'		=> [ 'd-inline-block', 'text-warning', 'middle', 'mx-1' ],
																				'attributes'	=> [
																					'title' => I18N::get('This property is deprecated!')
																				]
																			]);
																			
																			I18N::__('DEPRECATED');
																		?>
																	</small>
																</mark>
															<?php
														}
													?>
												</td>
												<td>
													<?php
														switch($entry->type) {
															case 'Boolean':
																$selected = $entry->default;
																
																if(isset($this->ini[$name])) {
																	$selected = $this->ini[$name];
																}
																?>
																	<div class="form-check">
																		<input class="form-check-input" type="radio" name="php[<?php print $name; ?>]" value="1" id="<?php print $name; ?>_yes"<?php print ($selected ? ' CHECKED' : ''); ?>>
																		<label class="form-check-label" for="<?php print $name; ?>_yes">
																			<?php
																				I18N::__('On');
																				
																				print ($entry->default ? sprintf(' (%s)', I18N::get('default')) : '');
																			?>
																		</label>
																	</div>
																	<div class="form-check">
																		<input class="form-check-input" type="radio" name="php[<?php print $name; ?>]" value="0" id="<?php print $name; ?>_no"<?php print (!$selected ? ' CHECKED' : ''); ?>>
																		<label class="form-check-label" for="<?php print $name; ?>_no">
																			<?php
																				I18N::__('Off');
																				
																				print (!$entry->default ? sprintf(' (%s)', I18N::get('default')) : '');
																			?>
																		</label>
																	</div>
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
																	<select name="php[<?php print $name; ?>]" class="form-select">
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
												</td>
											</tr>
										<?php
									}
								?>
							</tbody>
						</table>
					</div>
				</div>
			<?php
			}
		}
	?>
</div>