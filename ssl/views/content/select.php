<?php
	use fruithost\I18N;
?>
<div class="row">
	<div class="col">
		<h1><?php I18N::__('Secure Certificates'); ?></h1>
		<p><?php I18N::__('Add a certificate to your domain to protect information passed between your website and its visitors, providing more trust for your customers and potentially boosting your search engine rankings.'); ?></p>
	</div>
</div>
<div class="row mt-5">
	<?php
		foreach($this->providers AS $provider) {
			?>
			<div class="col">
				<div class="card">
					<div class="card-header d-flex flex-row">
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
					<div class="card-body">
						<?php print $provider->getDescription(); ?>
					</div>
					<div class="card-footer text-center">
						<a href="<?php print $this->url(sprintf('/module/ssl/create/%s?domain=%d', $provider->getKey(), $this->domain->id)); ?>" class="btn btn-outline-success"><?php I18N::__('Select this Option'); ?></a>
					</div>
				</div>
			</div>
			<?php
		}
	?>
</div>