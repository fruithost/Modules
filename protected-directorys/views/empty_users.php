<?php
	use fruithost\Localization\I18N;
	use fruithost\UI\Icon;
?>
<div class="jumbotron text-center bg-transparent text-muted">
	<?php Icon::show('smiley-bad'); ?>
	<h2><?php I18N::__('No Users available!'); ?></h2>
	<p class="lead"><?php I18N::__('Please add an new User to the protected Directory to administer it.'); ?></p>
	<button type="button" name="create" data-bs-toggle="modal" data-bs-target="#create_protected_directory_user" class="btn btn-lg btn-primary mt-4"><?php I18N::__('Create User'); ?></button>
</div>