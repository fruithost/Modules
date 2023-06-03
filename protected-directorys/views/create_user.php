<?php
	use fruithost\Auth;
?>
<div class="container">
	<div class="form-group row">
		<label for="protected_directory_path" class="col-4 col-form-label col-form-label-sm">Directory:</label>
		<div class="col-8">
			<input type="text" readonly class="form-control-plaintext" name="protected_directory_path" id="protected_directory_path" value="<?php print (empty($directory->path) ? '' : $directory->path); ?>" />
		</div>
	</div>
	<div class="form-group row">
		<label for="protected_directory_username" class="col-4 col-form-label col-form-label-sm">Username:</label>
		<div class="col-8">
			<input type="text" class="form-control" name="protected_directory_username" id="protected_directory_username" />
		</div>
	</div>
	<div class="form-group row">
		<label for="protected_directory_password" class="col-4 col-form-label col-form-label-sm">Password:</label>
		<div class="col-8">
			<input type="protected_directory_password" class="form-control" name="protected_directory_password" id="protected_directory_password" />
		</div>
	</div>
	<input type="hidden" name="protected_directory_id" value="<?php print (empty($directory->id) ? '' : $directory->id); ?>" />
</div>