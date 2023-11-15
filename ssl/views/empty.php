<?php
	use fruithost\Localization\I18N;
    use fruithost\UI\Icon;
?>
<div class="jumbotron text-center bg-transparent text-muted">
	<?php
		Icon::show('domains');
	?>
	<h2><?php I18N::__('No Certificates available!'); ?></h2>
	<p class="lead">
		<?php
			printf(I18N::get('Please navigate to the domain overview and click on the %s <strong>lock-symbol</strong> to add a certificate.'), Icon::render('insecure', [
				'classes'	=> [ 'text-danger', 'small',  'align-text-bottom']
			]));
		?>
	</p>
	<a href="<?php print $this->url('/module/domains'); ?>" class="btn btn-lg btn-outline-primary mt-4"><?php I18N::__('Go to my Domains'); ?></a>
</div>