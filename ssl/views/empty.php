<?php
	use fruithost\I18N;
?>
<div class="jumbotron text-center bg-transparent text-muted">
	<i class="material-icons">public</i>
	<h2><?php I18N::__('No Certificates available!'); ?></h2>
	<p class="lead"><?php printf(I18N::get('Please navigate to the domain overview and click on the %s <strong>lock-symbol</strong> to add a certificate.'), '<i class="material-icons text-danger small align-text-bottom">lock_open</i>'); ?></p>
	<a href="<?php print $this->url('/module/domains'); ?>" class="btn btn-lg btn-outline-primary mt-4"><?php I18N::__('Go to my Domains'); ?></a>
</div>