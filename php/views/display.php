<?php
	use fruithost\Accounting\Auth;
	use fruithost\Services\PHP;
	use fruithost\Localization\I18N;

	$php = new PHP();
	$path = sprintf('%s%s/', HOST_PATH, Auth::getUsername());
	
	if(!empty($this->domain)) {
		$path = sprintf('%s%s/%s/', HOST_PATH, Auth::getUsername(), $this->domain);
	}
	
	if(!is_readable($path)) {
		mkdir($path);
	}
	
	$php->setPath($path);
	$info = $php->getInfo();
	
	if(!$php->isAvailable() || $php->hasErrors()) {
		?>
			<div class="container">
				<div class="alert alert-danger mt-4" role="alert">
					<strong><?php I18N::__('Problem!'); ?></strong>
					<p class="pb-0 mb-0">
						<?php
							if(empty($this->domain)) {
								print(I18N::get('The <strong>global domain</strong> configuration cannot currently be accessed.'));
							} else {
								printf(I18N::get('Domain "<strong>%s</strong>" currently not accessible.'), $this->domain);
							}
						?>
					</p>
				</div>
			</div>
		<?php
	} else if(empty($info)) {
		?>
			<div class="container">
				<div class="alert alert-danger mt-4" role="alert">
					<strong><?php I18N::__('Problem!'); ?></strong>
					<p class="pb-0 mb-0">
						<?php
							if(empty($this->domain)) {
								print(I18N::get('The <strong>global domain</strong> configuration cannot currently be accessed.'));
							} else {
								printf(I18N::get('Domain "<strong>%s</strong>" currently not accessible.'), $this->domain);
							}
						?>
					</p>
				</div>
			</div>
		<?php
	} else {
		?>
			<div class="container">
				<div class="row justify-content-center">
					<div class="col-10 offset-1">
						<div class="container alert alert-primary" role="alert">
							<div class="row">
								<div class="col"><h5><?php print $info['info'][0]; ?></h5></div>
								<div class="col text-end"><img src="data:image/png;base64,<?php print $info['logo']['PHP']; ?>" /></div>
							</div>
						</div>
					
						<div class="border border-primary-subtle my-2 rounded overflow-hidden">
							<table class="table table-sm  p-0 m-0">
								<tbody>
									<?php 
										foreach($info['info'] AS $name => $value) {
											if(is_int($name)) {
												continue;
											}
											?>
												<tr>
													<th class="text-nowrap p-2"><?php I18N::__($name); ?></th>
													<td class="text-muted p-2"><?php print (is_array($value) ? '<small class="text-danger">' . implode('</small><br /><small class="text-danger">', $value) . '</small>' : $value); ?></td>
												</tr>
											<?php
										}
									?>
								</tbody>
							</table>
						</div>
						<div class="row">
							<small class="col text-break"><?php print $info['info'][1]; ?></small>
							<div class="col text-end"><img src="data:image/png;base64,<?php print $info['logo']['Zend']; ?>" /></div>
						</div>
						<div class="text-center my-5">
							<h2><?php I18N::__('Configuration'); ?></h2>
						</div>
						<?php
							foreach($info AS $section => $content) {
								if($section == 'info' || $section == 'logo') {
									continue;
								}
								?>
									<div class="border border-primary-subtle my-3 rounded overflow-hidden">
										<table class="table table-sm p-0 m-0">
											<thead class="text-center">
												<tr>
													<th colspan="4" class="border-top-0 border-bottom-0 p-0">
														<h3 class="alert alert-primary border-start-0 border-top-0 border-end-0 m-0"><?php print strtoupper($section); ?></h3>
													</th>
												</tr>
											</thead>
											<tbody>
												<?php
													foreach($content AS $name => $data) {
														if(is_int($name) || empty($data)) {
															continue;
														}
														?>
															<tr>
																<th scope="row" class="text-nowrap p-2"><?php print $name; ?></th>
																<?php
																	if(is_array($data)) {
																		print '<td class="text-muted text-break text-wrap p-2">';
																		
																		foreach($data AS $index => $value) {
																			printf('%s</td><td class="text-muted text-break text-wrap p-2">', (is_array($value) ? '<small class="text-danger">' . implode('</small><br /><small class="text-danger">', $value) . '</small>' : $value));
																		}
																		
																		print '</td>';
																	} else {
																		printf('<td colspan="2" class="text-muted text-break text-wrap p-2">%s</td>', $data);
																	}
																?>
															</tr>
														<?php
													}
												?>
											</tbody>
										</table>
									</div>
								<?php
							}
						?>
					</div>
				</div>
			</div>
		<?php
	}
?>