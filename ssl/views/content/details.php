<?php
	use fruithost\Auth;
	use fruithost\I18N;
	
	$provider = null;
	
	switch($this->certificate->type) {
		case 'LETSENCRYPT':
			$provider = $this->providers['LetsEncrypt'];
		break;
		case 'SELFSIGNED':
			$provider = $this->providers['SelfSigned'];
		break;
		case 'CERTIFICATE':
			$provider = $this->providers['Certificate'];
		break;
	}
	
	if(empty($provider)) {
		?>
			<div class="container">
				<div class="alert alert-danger mt-4" role="alert">
					<strong><?php I18N::__('Problem!'); ?></strong>
					<p class="pb-0 mb-0"><?php printf(I18N::get('An unknown error has occurred.'), $this->domain); ?></p>
				</div>
			</div>
		<?php
		return;
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
			<p><?php printf(I18N::get('This certificate is valid and currently in-use with %s.'), $this->domain->name); ?></p>
		</div>
		<div class="card-body">
			<div class="row">
				<div class="col">
					<h6 class="text-success"><i class="material-icons align-top">beenhere</i> <?php printf(I18N::get('Valid thru <strong>%s</strong>'), date(Auth::getSettings('TIME_FORMAT', NULL, $this->getSettings('TIME_FORMAT', 'd.m.Y - H:i:s')), time())); ?></h6>
					<?php
						if($provider->renewPeriod() !== null) {
							?>
								<p><?php printf(I18N::get('Certificate will <strong>automatically renew %d days before expiration</strong>. We will notify you via email when this happens.'), $provider->renewPeriod()); ?></p>
							<?php
						}
					?>
				</div>
				<div class="col">
					<h6><i class="material-icons align-top text-warning">error_outline</i> <?php I18N::__('No unique IP'); ?></h6>
					<p><?php I18N::__('This domain is currently <strong>not using a Unique IP</strong>.'); ?></p>
					
					<h6><i class="material-icons align-bottom text-success">https</i> <?php I18N::__('Automatic HTTPS'); ?></h6>
					<div class="custom-control custom-switch">
						<input type="checkbox" data-toggle="collapse" data-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample" class="custom-control-input" id="customSwitch1" CHECKED />
						<label class="custom-control-label" for="customSwitch1"><?php I18N::__('Redirect all site content over a secure HTTPS connection.'); ?></label>
					</div>
					<p></p>
					<div class="collapse alert alert-warning" role="alert" id="collapseExample">
						<h4 class="alert-heading"><i class="material-icons align-text-bottom text-danger">error</i> <?php I18N::__('Warning'); ?></h4>
						<p><?php I18N::__('Disabling this setting will slow the loading of your site and will default to insecure connections. You should only disable this setting if your site requires special redirect settings in your <strong>.htaccess</strong> file or you want to allow mixed content on your site.'); ?></p>
					</div>
				</div>
				<div class="col">
					<h6><i class="material-icons align-top text-danger">delete</i> <?php I18N::__('Remove Certificate'); ?></h6>
					<p><?php I18N::__('Stop using this certificate with your domain. Note the certificate will still remain valid until its expiration and will be available for use anytime under <strong>Other Certificates</strong>.'); ?></p>
					<button class="btn btn-outline-danger"><?php I18N::__('Remove Certificate'); ?></button>
				</div>
			</div>
		</div>
		<div class="card-body">
			<h4><?php I18N::__('Certificate Configuration'); ?></h4>
			<hr />
			<div class="row">
				<div class="col-3 border-right">
					<ul class="nav flex-column nav-tabs" role="tablist" aria-orientation="vertical">
						<li class="nav-item"><button class="nav-link active" id="cert-tab" data-toggle="tab" data-target="#cert" type="button" role="tab"><?php I18N::__('Certificate'); ?></button></li>
						<li class="nav-item"><button class="nav-link" id="key-tab" data-toggle="tab" data-target="#key" type="button" role="tab"><?php I18N::__('Private Key'); ?></button></li>
						<li class="nav-item"><button class="nav-link" id="root-tab" data-toggle="tab" data-target="#root" type="button" role="tab"><?php I18N::__('Intermediate Certificate'); ?></button></li>
					</ul>
				</div>
				<div class="col-9">
					<div class="tab-content">
						<div class="tab-pane show active" id="cert" role="tabpanel" aria-labelledby="cert-tab">
							<textarea class="form-control bg-dark text-white border-0 rounded-0" rows="15">
-----BEGIN CERTIFICATE-----
CERT
-----END CERTIFICATE-----</textarea>
						</div>
						<div class="tab-pane" id="key" role="tabpanel" aria-labelledby="key-tab">
							<textarea class="form-control bg-dark text-white border-0 rounded-0" rows="15">
-----BEGIN PRIVATE KEY-----
CERT
-----END PRIVATE KEY-----</textarea>
						</div>
						<div class="tab-pane" id="root" role="tabpanel" aria-labelledby="root-tab">
							<textarea class="form-control bg-dark text-white border-0 rounded-0" rows="15">
-----BEGIN CERTIFICATE-----
CERT
-----END CERTIFICATE-----</textarea>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<?php
	var_dump($provider);
	var_dump($this->certificate);
	var_dump($this->domain);
?>