<?php
	use fruithost\Auth;
	use fruithost\PHP;
	use fruithost\I18N;

	$php = new PHP();
	
	if(empty($this->domain)) {
		$php->setPath(sprintf('%s%s/', HOST_PATH, Auth::getUsername()));
	} else {
		$php->setPath(sprintf('%s%s/%s/', HOST_PATH, Auth::getUsername(), $this->domain));
	}
	
	$info = $php->getInfo();
	
	if($php->hasErrors()) {
		?>
			<div class="container">
				<div class="alert alert-danger mt-4" role="alert">
					<strong><?php I18N::__('Problem!'); ?></strong>
					<p class="pb-0 mb-0"><?php printf(I18N::get('Domain "<strong>%s</strong>" currently not accessible.'), $this->domain); ?></p>
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
								<div class="col text-right"><img src="data:image/png;base64,<?php print $info['logo']['PHP']; ?>" /></div>
							</div>
						</div>
					
						<div class="border border-primary my-2 rounded">
							<table class="table table-sm">
								<tbody>
									<?php 
										foreach($info['info'] AS $name => $value) {
											if(is_int($name)) {
												continue;
											}
											?>
												<tr>
													<th class="text-nowrap"><?php I18N::__($name); ?></th>
													<td class="text-muted"><?php print (is_array($value) ? '<small class="text-danger">' . implode('</small><br /><small class="text-danger">', $value) . '</small>' : $value); ?></td>
												</tr>
											<?php
										}
									?>
								</tbody>
							</table>
						</div>
						<div class="row">
							<small class="col text-break"><?php print $info['info'][1]; ?></small>
							<div class="col text-right"><img src="data:image/png;base64,<?php print $info['logo']['Zend']; ?>" /></div>
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
									<div class="border border-primary my-2 rounded">
										<table class="table table-sm">
											<thead class="text-center">
												<tr>
													<th colspan="4" class="border-top-0 border-bottom-0 alert alert-primary">
														<h3><?php print strtoupper($section); ?></h3>
													</th>
												</tr>
											</thead>
											<tbody>
												<?php 
													foreach($content AS $name => $data) {
														if(is_int($name)) {
															continue;
														}
														?>
															<tr>
																<th scope="row" class="text-nowrap"><?php print $name; ?></th>
																<?php
																	if(is_array($data)) {
																		print '<td class="text-muted text-break text-wrap">';
																		
																		foreach($data AS $index => $value) {
																			printf('%s</td><td class="text-muted text-break text-wrap">', (is_array($value) ? '<small class="text-danger">' . implode('</small><br /><small class="text-danger">', $value) . '</small>' : $value));
																		}
																		
																		print '</td>';
																	} else {
																		printf('<td colspan="2" class="text-muted text-break text-wrap">%s</td>', $data);
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