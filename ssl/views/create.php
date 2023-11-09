<?php
	use fruithost\Auth;
	use fruithost\I18N;
?>
<form method="post" action="<?php print $this->url(sprintf('/module/ssl/create/certificate?domain=%d', $this->domain->id)); ?>">	
	<div class="container-fluid">
		<div class="row">
			<div class="col">
				<h4>Import Certificate</h4>
				<?php
					if(isset($confirmate) && $confirmate) {
						?>
							<p><?php printf(I18N::get('Please check the certificate and confirm that you want to import this certificate for the domain <strong>%s</strong>!'), $this->domain->name); ?></p>
						<?php
					} else {
						?>
							<p>Please enter the information for the certificate you'd like to import below.<br/>Note that all information must be entered with leading BEGIN and trailing END markers to be accepted.</p>
						<?php
					}
				?>
			</div>
		</div>
		<?php
			if(isset($errors)) {
				?>
					<div class="alert alert-danger mt-4" role="alert"><?php (is_array($errors) ? var_dump($errors) : print $errors) ?></div>
				<?php
			}
			
			if(isset($confirmate) && $confirmate) {
				?>
					<div class="tab-pane container" id="details" role="tabpanel" aria-labelledby="details-tab">
						<div class="row">
							<div class="col-6">
								<?php
									foreach($cert_details['subject'] AS $name => $value) {
										switch($name) {
											case 'commonName':
												$name = I18N::get('Common Name');
											break;
											case 'organizationName':
												$name = I18N::get('Organization Name');
											break;
											case 'emailAddress':
												$name = I18N::get('E-Mail Address');
											break;
										}
										?>
											<div class="form-group row">
												<label class="col-sm-4 col-form-label font-weight-bold"><?php print $name; ?></label>
												<div class="col-sm-8">
													<input type="text" readonly class="form-control-plaintext" value="<?php print $value; ?>" />
												</div>
											</div>
										<?php
									}
								?>
								
								<div class="form-group row">
									<label class="col-sm-4 col-form-label font-weight-bold"><?php I18N::__('Valid from'); ?></label>
									<div class="col-sm-8">
										<input type="text" readonly class="form-control-plaintext" value="<?php print date(Auth::getSettings('TIME_FORMAT', NULL, $this->getSettings('TIME_FORMAT', 'd.m.Y - H:i:s')), strtotime(date_create_from_format('ymdHise', $cert_details['validFrom'])->format('c'))); ?>" />
									</div>
								</div>
								<div class="form-group row">
									<label class="col-sm-4 col-form-label font-weight-bold"><?php I18N::__('Valid to'); ?></label>
									<div class="col-sm-8">
										<input type="text" readonly class="form-control-plaintext" value="<?php print date(Auth::getSettings('TIME_FORMAT', NULL, $this->getSettings('TIME_FORMAT', 'd.m.Y - H:i:s')), strtotime(date_create_from_format('ymdHise', $cert_details['validTo'])->format('c'))); ?>" />
									</div>
								</div>
							</div>
							<div class="col-6">
								<div class="form-group row">
									<label class="col-sm-4 col-form-label font-weight-bold"><?php I18N::__('Version'); ?></label>
									<div class="col-sm-8">
										<input type="text" readonly class="form-control-plaintext" value="<?php print $cert_details['version']; ?>" />
									</div>
								</div>
								<div class="form-group row">
									<label class="col-sm-4 col-form-label font-weight-bold"><?php I18N::__('Hash'); ?> (<?php print $cert_details['signatureTypeSN']; ?>)</label>
									<div class="col-sm-8">
										<input type="text" readonly class="form-control-plaintext" value="<?php print $cert_details['hash']; ?>" />
									</div>
								</div>
								<div class="form-group row">
									<label class="col-sm-4 col-form-label font-weight-bold"><?php I18N::__('Serial Number'); ?></label>
									<div class="col-sm-8">
										<input type="text" readonly class="form-control-plaintext" value="<?php print $cert_details['serialNumberHex']; ?>" />
									</div>
								</div>
							</div>
						</div>
					</div>
					
					<input type="hidden" name="import" value="true" />
				<?php
			} else {
				?>
					<div class="row mt-5">
						<div class="col-md-6">
							<div class="form-group row">
								<label for="key" class="col-sm-2 col-form-label"><strong><?php I18N::__('Private Key'); ?>:</strong></label>
								<div class="col-sm-10">
									<textarea id="key" name="key" class="form-control bg-dark text-white border-0 rounded-0" rows="10" placeholder="-----BEGIN RSA PRIVATE KEY-----<?php print PHP_EOL . I18N::get('Private Key Code') . PHP_EOL; ?>-----END RSA PRIVATE KEY-----"><?php print(!empty($key) ? $key : ''); ?></textarea>
								</div>
							</div>				
						</div>
						<div class="col-md-6">
							<div class="form-group row">
								<label for="root" class="col-sm-2 col-form-label"><strong><?php I18N::__('Intermediate Certificate'); ?>:</strong> (Optional)</label>
								<div class="col-sm-10">
									<textarea id="root" name="root" class="form-control bg-dark text-white border-0 rounded-0" rows="10" placeholder="-----BEGIN CERTIFICATE-----<?php print PHP_EOL . I18N::get('Certificate Code') . PHP_EOL; ?>-----END CERTIFICATE-----"><?php print(!empty($root) ? $root : ''); ?></textarea>
								</div>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-md-6">
							<div class="form-group row">
								<label for="cert" class="col-sm-2 col-form-label"><strong><?php I18N::__('Certificate'); ?>:</strong></label>
								<div class="col-sm-10">
									<textarea id="cert" name="cert" class="form-control bg-dark text-white border-0 rounded-0" rows="10" placeholder="-----BEGIN CERTIFICATE -----<?php print PHP_EOL . I18N::get('Certificate Code') . PHP_EOL; ?>-----END CERTIFICATE-----"><?php print(!empty($cert) ? $cert : ''); ?></textarea>
								</div>
							</div>
						</div>
					</div>
				<?php
			}
		?>
		
		<div class="row border-top pt-3 pb-2 mb-3">
			<div class="col">
				<a href="<?php print $this->url(sprintf('/module/ssl/view/%d', $this->domain->id)); ?>" class="btn d-inline-block btn-outline-danger mr-2"><?php I18N::__('Cancel'); ?></a>
			</div>
			<div class="col text-right">
				<button type="submit" name="action" value="create" class="btn d-inline-block btn-outline-success"><?php I18N::__('Proceed'); ?></button>				
			</div>
		</div>
	</div>
</form>