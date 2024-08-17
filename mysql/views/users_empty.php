<?php
	use fruithost\UI\Icon;
	use fruithost\Localization\I18N;
?>
<div class="jumbotron text-center bg-transparent text-muted">
	<?php Icon::show('smiley-bad'); ?>
	<h2><?php I18N::__('No Users available!'); ?></h2>
	<p class="lead"><?php I18N::__('Please create a new user to administer it.'); ?></p>
	<button type="button" name="create" data-bs-toggle="modal" data-bs-target="#create_users" class="btn btn-lg btn-primary mt-4"><?php I18N::__('Create new User'); ?></button>
</div>