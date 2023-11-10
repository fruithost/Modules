<?php
	use fruithost\Auth;
?>
<div class="container">
	<div class="form-group row">
		<label for="mysql_user_username" class="col-4 col-form-label col-form-label-sm">Username:</label>
		<div class="col-8">
			<div class="input-group mb-3">
				<div class="input-group-prepend">
					<span class="input-group-text"><?php print Auth::getUsername(); ?>_</span>
				</div>
				<input type="text" class="form-control" name="mysql_user_username" id="mysql_user_username" aria-label="Username" aria-describedby="prefix" />
			</div>
		</div>
	</div>
	<div class="form-group row">
		<label for="mysql_user_password" class="col-4 col-form-label col-form-label-sm">Password:</label>
		<div class="col-8">
			<input type="text" class="form-control" name="mysql_user_password" id="mysql_user_password" />
		</div>
	</div>
	<div class="form-group row">
		<label for="mysql_user_database" class="col-4 col-form-label col-form-label-sm">Database:</label>
		<div class="col-8">
			<select name="mysql_user_database" id="mysql_user_database" class="form-control">
				<option value=""> - Please select - </option>
				<?php
					foreach($databases AS $database) {
						printf('<option value="%s">%s_%s</option>', $database->id, Auth::getUsername($database->user_id), $database->name);
					}
				?>
			</select>
		</div>
	</div>
	
	<div class="form-group row">
		<label for="mysql_user_connection" class="col-4 col-form-label col-form-label-sm">Remote Access:</label>
		<div class="col-8 form-check">
			<input class="form-check-input" type="radio" name="mysql_user_connection" id="mysql_user_connection" value="%" checked />
			<label class="form-check-label" for="mysql_user_connection">Allow from any IP</label>
		</div>
		<div class="col-8 offset-4 form-check">
			<input class="form-check-input" type="radio" name="mysql_user_connection" id="localhost" value="localhost" />
			<label class="form-check-label" for="localhost">Only Local</label>
		</div>
	</div>
</div>