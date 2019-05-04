<div class="container">
	<div class="form-group row">
		<label for="display_errors" class="col-4 col-form-label col-form-label-sm">display_errors</label>
		<div class="col-8">
			<select name="display_errors" class="form-control">
				<option value="On">On</option>
				<option value="Off">Off</option>
			</select>
		</div>
		<div class="text-muted ml-4">
			Description of display_errors
		</div>
	</div>
	<div class="form-group row">
		<label for="display_startup_errors" class="col-4 col-form-label col-form-label-sm">display_startup_errors</label>
		<div class="col-8">
			<select name="display_startup_errors" class="form-control">
				<option value="On">On</option>
				<option value="Off">Off</option>
			</select>
		</div>
		<div class="text-muted ml-4">
			Description of display_startup_errors
		</div>
	</div>
	<div class="form-group row">
		<label for="log_errors" class="col-4 col-form-label col-form-label-sm">log_errors</label>
		<div class="col-8">
			<select name="log_errors" class="form-control">
				<option value="On">On</option>
				<option value="Off">Off</option>
			</select>
		</div>
		<div class="text-muted ml-4">
			Description of log_errors
		</div>
	</div>
	<div class="form-group row">
		<label for="error_reporting" class="col-4 col-form-label col-form-label-sm">error_reporting</label>
		<div class="col-8">
			<?php
				$types = [
					'E_ALL',
					'E_ERROR',
					'E_WARNING',
					'E_PARSE',
					'E_NOTICE',
					'E_CORE_ERROR',
					'E_CORE_WARNING',
					'E_COMPILE_ERROR',
					'E_COMPILE_WARNING',
					'E_USER_ERROR',
					'E_USER_WARNING',
					'E_USER_NOTICE',
					'E_STRICT',
					'E_RECOVERABLE_ERROR',
					'E_DEPRECATED',
					'E_USER_DEPRECATED',
					'E_ALL'
				];
				
				foreach($types AS $type) {
					?>
						<div class="row mb-1">
							<div class="col-sm-2">
								<select class="form-control form-control-sm">
									<option value="-">-</option>
									<option value="~">~</option>
									<option value="+">+</option>
								</select>
							</div>
							<div class="col-sm-10">
								<?php print $type; ?>
							</div>
						</div>
					<?php
				}
			?>
		</div>
		<div class="text-muted ml-4">
			Description of error_reporting
		</div>
	</div>
	<div class="form-group row">
		<label for="mail.log" class="col-4 col-form-label col-form-label-sm">mail.log</label>
		<div class="col-8">
			<input type="text" class="form-control" name="mail.log" id="mail.log" value="" placeholder="mail.log" />
		</div>
		<div class="text-muted ml-4">
			Description of mail.log
		</div>
	</div>
</div>