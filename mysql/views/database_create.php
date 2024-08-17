<?php
	use fruithost\Accounting\Auth;
	use fruithost\Localization\I18N;
?>
<div class="container">
	<div class="form-group row">
		<label for="name" class="col-4 col-form-label col-form-label-sm"><?php I18N::__('Database name'); ?>:</label>
		<div class="col-8">
			<div class="input-group mb-3">
				<div class="input-group-prepend">
					<span class="input-group-text" id="prefix"><?php print Auth::getUsername(); ?>_</span>
				</div>
				<input type="text" class="form-control" name="name" id="name" aria-label="Name" aria-describedby="prefix" />
			</div>
		</div>
	</div>
</div>