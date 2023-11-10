<?php
	use fruithost\Localization\I18N;
?>
<div class="jumbotron text-center bg-transparent text-muted">
	<i class="material-icons">sentiment_very_dissatisfied</i>
	<h2><?php I18N::__('No Domains available!'); ?></h2>
	<p class="lead"><?php I18N::__('Please create a new domain to administer it.'); ?></p>
	<button type="button" name="create" data-toggle="modal" data-target="#create_domain" class="btn btn-lg btn-primary mt-4"><?php I18N::__('Create new Domain'); ?></button>
</div>