<?php
	use fruithost\Auth;
	use fruithost\I18N;
	
	$provider		= null;
	$certificate	= [
		'cert'	=> null,
		'key'	=> null,
		'root'	=> null,
		'data'	=> null
	];
	
	switch($this->certificate->type) {
		case 'LETSENCRYPT':
			$provider	= $this->providers['LetsEncrypt'];
		break;
		case 'SELFSIGNED':
			$provider	= $this->providers['SelfSigned'];
		break;
		case 'CERTIFICATE':
			$provider	= $this->providers['Certificate'];
		break;
	}
	
	if(empty($provider)) {
		?>
			<div class="container">
				<div class="alert alert-danger mt-4" role="alert">
					<strong><?php I18N::__('Problem!'); ?></strong>
					<p class="pb-0 mb-0"><?php I18N::__('An unknown error has occurred.'); ?></p>
				</div>
			</div>
		<?php
		return;
	}
	
	if(file_exists(sprintf('/etc/fruithost/config/apache2/ssl/%s.key', $this->domain->name)) && is_readable(sprintf('/etc/fruithost/config/apache2/ssl/%s.key', $this->domain->name))) {
		$certificate['key'] = file_get_contents(sprintf('/etc/fruithost/config/apache2/ssl/%s.key', $this->domain->name));
	}
	
	if(file_exists(sprintf('/etc/fruithost/config/apache2/ssl/%s.cert', $this->domain->name)) && is_readable(sprintf('/etc/fruithost/config/apache2/ssl/%s.cert', $this->domain->name))) {
		$certificate['cert']	= file_get_contents(sprintf('/etc/fruithost/config/apache2/ssl/%s.cert', $this->domain->name));
		$certificate['data']	= openssl_x509_parse($certificate['cert'], false);
	}
	
	if(file_exists(sprintf('/etc/fruithost/config/apache2/ssl/%s.root', $this->domain->name)) && is_readable(sprintf('/etc/fruithost/config/apache2/ssl/%s.root', $this->domain->name))) {
		$certificate['root'] = file_get_contents(sprintf('/etc/fruithost/config/apache2/ssl/%s.root', $this->domain->name));
	}
?>
	<div class="col">
		<div class="card">
			<div class="card-header">
			<div class=" d-flex flex-row">
				<span class="align-self-start flex-shrink-1 p-1">
					<?php
						$icon = $provider->getIcon();
						if(!empty($icon)) {
							if(preg_match('/^data:/', $icon)) {
								printf('<img src="%s" />', $icon);
							} else if(preg_match('/^(http|https|\/):/', $icon)) {
								printf('<img src="%s" />', $icon);
							} else {
								print $icon;
							}
						}
					?>
				</span>
				<h4 class="align-self-stretch flex-fill mt-auto p-1"><?php print $provider->getName(); ?></h4>
				<small class="align-self-end text-uppercase flex-shrink-1 mb-auto">
					<?php
						if($provider->isFree()) {
							I18N::__('Free');
						} else {
							?>
								<span class="d-inline-block material-icons text-info" data-toggle="hover" title="<?php I18N::__('Higher costs may be incurred'); ?>" data-content="<?php I18N::__('You can only choose this option if you have already purchased a valid SSL certificate from an approved certification authority.<br /><br />Using the certificate is of course completely free of charge, you only have to procure it yourself.'); ?>">info</span>
							<?php
						}
					?>
				</small>
			</div>
		</div>
		<div class="card-body">
			<div class="row">
				<div class="col">
					<?php
						if(empty($certificate['data'])) {
							?>
								<h6 class="text-danger"><i class="material-icons align-top">beenhere</i> <?php I18N::__('Certificate is invalid'); ?></h6>
							<?php
						} else {
							?>
								<h6 class="text-success"><i class="material-icons align-top">beenhere</i> <?php printf(I18N::get('Valid thru <strong>%s</strong>'), date(Auth::getSettings('TIME_FORMAT', NULL, $this->getSettings('TIME_FORMAT', 'd.m.Y - H:i:s')), strtotime(date_create_from_format('ymdHise', $certificate['data']['validTo'])->format('c')))); ?></h6>
							<?php
						}
						
						if(empty($certificate['data'])) {
							$text = I18N::get('not valid');
						} else {
							$text = I18N::get('valid');
						}
						?>
							<p><?php printf(I18N::get('This certificate is <strong>%s</strong> and currently in-use with %s.'), $text, $this->domain->name); ?></p>
						<?php
						if($provider->renewUntil() !== null) {
							?>
								<p><?php printf(I18N::get('Certificate will <strong>automatically renew %d days before expiration</strong>. We will notify you via email when this happens.'), $provider->renewUntil()); ?></p>
							<?php
						}
					?>
				</div>
				<div class="col">
					<h6><i class="material-icons align-top text-warning">error_outline</i> <?php I18N::__('No unique IP'); ?></h6>
					<p><?php I18N::__('This domain is currently <strong>not using a Unique IP</strong>.'); ?></p>
				</div>
				<div class="col">
					<h6><i class="material-icons align-top text-danger">delete</i> <?php I18N::__('Remove Certificate'); ?></h6>
					<p><?php I18N::__('Stop using this certificate with your domain. Note the certificate will still remain valid until its expiration and will be available for use anytime under <strong>Other Certificates</strong>.'); ?></p>
					<form method="post" action="<?php print $this->url(sprintf('/module/ssl/view/%d', $this->domain->id)); ?>">
						<button name="action" value="delete" class="btn btn-outline-danger" data-confirm="<?php I18N::__('Do you really wan\'t to delete the Certificate?'); ?>"><?php I18N::__('Remove Certificate'); ?></button>
					</form>
				</div>
			</div>
			<div class="row mt-5">
				<div class="col-4">
					<h6><i class="material-icons align-bottom text-success">https</i> <?php I18N::__('Automatic HTTPS'); ?></h6>
					<div class="custom-control custom-switch">
						<input type="checkbox" data-toggle="collapse" data-target="#collapse_force_https" aria-expanded="false" aria-controls="collapse_force_https" class="custom-control-input" name="force_https" id="force_https"<?php print ($this->certificate->force_https == 'YES' ? ' CHECKED' : ''); ?> />
						<label class="custom-control-label" for="force_https"><?php I18N::__('Redirect all site content over a secure HTTPS connection.'); ?></label>
					</div>
					<div class="mt-3 collapse alert alert-warning<?php print ($this->certificate->force_https != 'YES' ? ' show' : ''); ?>" role="alert" id="collapse_force_https">
						<h4 class="alert-heading"><i class="material-icons align-text-bottom text-danger">error</i> <?php I18N::__('Warning'); ?></h4>
						<p><?php I18N::__('Disabling this setting will slow the loading of your site and will default to insecure connections. You should only disable this setting if your site requires special redirect settings in your <strong>.htaccess</strong> file or you want to allow mixed content on your site.'); ?></p>
					</div>
				</div>
				<div class="col-4">
					<h6><i class="badge badge-success align-bottom text-light">HSTS</i> <?php I18N::__('Strict Transport Security (HSTS)'); ?></h6>
					<div class="custom-control custom-switch">
						<input type="checkbox" data-toggle="collapse" aria-expanded="false" class="custom-control-input" name="enable_hsts" id="enable_hsts"<?php print ($this->certificate->enable_hsts == 'YES' ? ' CHECKED' : ''); ?> />
						<label class="custom-control-label" for="enable_hsts"><?php I18N::__('Enables HSTS'); ?></label>
					</div>
					<p class="mt-3"><?php I18N::__('This web security policy guarantees that clients only access the HTTPS version of a website and not the HTTP version. It serves as protection against man-in-the-middle attacks such as SSL stripping, downgrade attacks and more.'); ?></p>
				</div>
				<div class="col-4">
				</div>
			</div>
		</div>
		<div class="card-body">
			<h4><?php I18N::__('Certificate Configuration'); ?></h4>
			<hr />
			<div class="row" id="details_tab">
				<?php
					if(empty($certificate['cert']) && empty($certificate['key']) && empty($certificate['root'])) {
						?>
							<div class="col">
								<div class="alert alert-warning" role="alert">
									<h4 class="alert-heading"><?php I18N::__('Not available'); ?></h4>
									<p><?php I18N::__('The certificate configuration is currently not available. Please wait until the certificate has been created.'); ?></p>
								</div>
							</div>
						<?php
					} else {		
						?>
							<div class="col-3 border-right">
								<ul class="nav flex-column nav-tabs" role="tablist" aria-orientation="vertical">
									<?php
										if(!empty($certificate['cert'])) {
											?>
												<li class="nav-item"><button class="nav-link" id="cert-tab" data-toggle="tab" data-target="#cert" type="button" role="tab"><?php I18N::__('Certificate'); ?></button></li>
											<?php
										}
										
										if(!empty($certificate['key'])) {
											?>
												<li class="nav-item"><button class="nav-link" id="key-tab" data-toggle="tab" data-target="#key" type="button" role="tab"><?php I18N::__('Private Key'); ?></button></li>
											<?php
										}
										
										if(!empty($certificate['root'])) {
											?>
												<li class="nav-item"><button class="nav-link" id="root-tab" data-toggle="tab" data-target="#root" type="button" role="tab"><?php I18N::__('Intermediate Certificate'); ?></button></li>
											<?php
										}
										
										if(!empty($certificate['data'])) {
											?>
												<li class="nav-item"><button class="nav-link" id="details-tab" data-toggle="tab" data-target="#details" type="button" role="tab"><?php I18N::__('Details'); ?></button></li>
											<?php
										}
									?>
								</ul>
							</div>
							<div class="col-9">
								<div class="tab-content">
									<?php
										if(!empty($certificate['cert'])) {
											?>
												<div class="tab-pane" id="cert" role="tabpanel" aria-labelledby="cert-tab">
													<textarea class="form-control bg-dark text-white border-0 rounded-0" rows="15"><?php print $certificate['cert']; ?></textarea>
												</div>
											<?php
										}
										
										if(!empty($certificate['key'])) {
											?>
												<div class="tab-pane" id="key" role="tabpanel" aria-labelledby="key-tab">
													<textarea class="form-control bg-dark text-white border-0 rounded-0" rows="15"><?php print $certificate['key']; ?></textarea>
												</div>
											<?php
										}
										
										if(!empty($certificate['root'])) {
											?>
												<div class="tab-pane" id="root" role="tabpanel" aria-labelledby="root-tab">
													<textarea class="form-control bg-dark text-white border-0 rounded-0" rows="15"><?php print $certificate['root']; ?></textarea>
												</div>
											<?php
										}
										
										if(!empty($certificate['data'])) {
											?>
												<div class="tab-pane container" id="details" role="tabpanel" aria-labelledby="details-tab">
													<div class="row">
														<div class="col-6">
															<?php
																foreach($certificate['data']['subject'] AS $name => $value) {
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
																	<input type="text" readonly class="form-control-plaintext" value="<?php print date(Auth::getSettings('TIME_FORMAT', NULL, $this->getSettings('TIME_FORMAT', 'd.m.Y - H:i:s')), strtotime(date_create_from_format('ymdHise', $certificate['data']['validFrom'])->format('c'))); ?>" />
																</div>
															</div>
															<div class="form-group row">
																<label class="col-sm-4 col-form-label font-weight-bold"><?php I18N::__('Valid to'); ?></label>
																<div class="col-sm-8">
																	<input type="text" readonly class="form-control-plaintext" value="<?php print date(Auth::getSettings('TIME_FORMAT', NULL, $this->getSettings('TIME_FORMAT', 'd.m.Y - H:i:s')), strtotime(date_create_from_format('ymdHise', $certificate['data']['validTo'])->format('c'))); ?>" />
																</div>
															</div>
														</div>
														<div class="col-6">
															<div class="form-group row">
																<label class="col-sm-4 col-form-label font-weight-bold"><?php I18N::__('Version'); ?></label>
																<div class="col-sm-8">
																	<input type="text" readonly class="form-control-plaintext" value="<?php print $certificate['data']['version']; ?>" />
																</div>
															</div>
															<div class="form-group row">
																<label class="col-sm-4 col-form-label font-weight-bold"><?php I18N::__('Hash'); ?> (<?php print $certificate['data']['signatureTypeSN']; ?>)</label>
																<div class="col-sm-8">
																	<input type="text" readonly class="form-control-plaintext" value="<?php print $certificate['data']['hash']; ?>" />
																</div>
															</div>
															<div class="form-group row">
																<label class="col-sm-4 col-form-label font-weight-bold"><?php I18N::__('Serial Number'); ?></label>
																<div class="col-sm-8">
																	<input type="text" readonly class="form-control-plaintext" value="<?php print $certificate['data']['serialNumberHex']; ?>" />
																</div>
															</div>
														</div>
													</div>
												</div>
											<?php
										}
									?>
								</div>
							</div>
						<?php
					}
				?>
			</div>
		</div>
	</div>
</div>
<script type="text/javascript">
	_watcher_ssl_details = setInterval(function() {
		if(typeof(jQuery) !== 'undefined') {
			clearInterval(_watcher_ssl_details);
			
			(function($) {
				$('div#details_tab li.nav-item:eq(0) button, div#details_tab div.tab-pane:eq(0)').addClass('active');
				
				$('input[name="force_https"], input[name="enable_hsts"]').on('change', function(event) {
					let element = $(this);
					element.attr('disabled', true);
					
					$.ajax({
						type:	'POST',
						url:	'<?php print $this->url(sprintf('/module/ssl/view/%d', $this->domain->id)); ?>',
						data:	{
							action:	element.attr('name'),
							value:	element.prop('checked')
						},
						success: function onSuccess(response) {
							element.removeAttr('disabled');
							element.prop('checked', /^true$/i.test(response));
						}
					});
				});
			}(jQuery));
		}
	}, 500);
</script>