<div class="container">
	<div class="form-group row">
		<label for="session.use_cookies" class="col-4 col-form-label col-form-label-sm">session.use_cookies</label>
		<div class="col-8">
			<select name="session.use_cookies" class="form-control">
				<option value="1">On</option>
				<option value="0">Off</option>
			</select>
		</div>
		<div class="text-muted ml-4">
			Description of session.use_cookies
		</div>
	</div>
	<div class="form-group row">
		<label for="session.use_only_cookies" class="col-4 col-form-label col-form-label-sm">session.use_only_cookies</label>
		<div class="col-8">
			<select name="session.use_only_cookies" class="form-control">
				<option value="1">On</option>
				<option value="0">Off</option>
			</select>
		</div>
		<div class="text-muted ml-4">
			Description of session.use_only_cookies
		</div>
	</div>
	<div class="form-group row">
		<label for="session.auto_start" class="col-4 col-form-label col-form-label-sm">session.auto_start</label>
		<div class="col-8">
			<select name="session.auto_start" class="form-control">
				<option value="1">On</option>
				<option value="0">Off</option>
			</select>
		</div>
		<div class="text-muted ml-4">
			Description of session.auto_start
		</div>
	</div>
	<div class="form-group row">
		<label for="session.name" class="col-4 col-form-label col-form-label-sm">session.name</label>
		<div class="col-8">
			<input type="text" class="form-control" name="session.name" id="session.name" value="" placeholder="PHPSESSID" />
		</div>
		<div class="text-muted ml-4">
			Description of session.name
		</div>
	</div>
	<div class="form-group row">
		<label for="short_open_tag" class="col-4 col-form-label col-form-label-sm">short_open_tag</label>
		<div class="col-8">
			<select name="short_open_tag" class="form-control">
				<option value="On">On</option>
				<option value="Off">Off</option>
			</select>
		</div>
		<div class="text-muted ml-4">
			Description of short_open_tag
		</div>
	</div>
	<div class="form-group row">
		<label for="implicit_flush" class="col-4 col-form-label col-form-label-sm">implicit_flush</label>
		<div class="col-8">
			<select name="implicit_flush" class="form-control">
				<option value="On">On</option>
				<option value="Off">Off</option>
			</select>
		</div>
		<div class="text-muted ml-4">
			Description of display_startup_errors
		</div>
	</div>
	<div class="form-group row">
		<label for="register_argc_argv" class="col-4 col-form-label col-form-label-sm">register_argc_argv</label>
		<div class="col-8">
			<select name="register_argc_argv" class="form-control">
				<option value="On">On</option>
				<option value="Off">Off</option>
			</select>
		</div>
		<div class="text-muted ml-4">
			Description of register_argc_argv
		</div>
	</div>
	<div class="form-group row">
		<label for="user_agent" class="col-4 col-form-label col-form-label-sm">user_agent</label>
		<div class="col-8">
			<input type="text" class="form-control" name="user_agent" id="user_agent" value="" placeholder="PHP" />
		</div>
		<div class="text-muted ml-4">
			Description of user_agent
		</div>
	</div>
	<div class="form-group row">
		<label for="from" class="col-4 col-form-label col-form-label-sm">from</label>
		<div class="col-8">
			<input type="text" class="form-control" name="from" id="from" value="" placeholder="john@doe.com" />
		</div>
		<div class="text-muted ml-4">
			Description of from
		</div>
	</div>
	<div class="form-group row">
		<label for="max_execution_time" class="col-4 col-form-label col-form-label-sm">max_execution_time</label>
		<div class="col-8">
			<input type="number" min="-1" max="999999999" class="form-control" name="max_execution_time" id="max_execution_time" value="60" placeholder="60" />
		</div>
		<div class="text-muted ml-4">
			Description of max_execution_time
		</div>
	</div>
	<div class="form-group row">
		<label for="default_socket_timeout" class="col-4 col-form-label col-form-label-sm">default_socket_timeout</label>
		<div class="col-8">
			<input type="number" min="-1" max="999999999" class="form-control" name="default_socket_timeout" id="default_socket_timeout" value="60" placeholder="60" />
		</div>
		<div class="text-muted ml-4">
			Description of default_socket_timeout
		</div>
	</div>
	<div class="form-group row">
		<label for="max_input_time" class="col-4 col-form-label col-form-label-sm">max_input_time</label>
		<div class="col-8">
			<input type="number" min="-1" max="999999999" class="form-control" name="max_input_time" id="max_input_time" value="30" placeholder="30" />
		</div>
		<div class="text-muted ml-4">
			Description of max_input_time
		</div>
	</div>
	<div class="form-group row">
		<label for="max_file_uploads" class="col-4 col-form-label col-form-label-sm">max_file_uploads</label>
		<div class="col-8">
			<input type="number" min="-1" max="999999999" class="form-control" name="max_file_uploads" id="max_file_uploads" value="20" placeholder="20" />
		</div>
		<div class="text-muted ml-4">
			Description of max_file_uploads
		</div>
	</div>
	<div class="form-group row">
		<label for="memory_limit" class="col-4 col-form-label col-form-label-sm">memory_limit</label>
		<div class="col-8">
			<select name="memory_limit" id="memory_limit" class="form-control">
				<option value="50M">50M</option>
			</select>
		</div>
		<div class="text-muted ml-4">
			Description of memory_limit
		</div>
	</div>
	<div class="form-group row">
		<label for="post_max_size" class="col-4 col-form-label col-form-label-sm">post_max_size</label>
		<div class="col-8">
			<select name="post_max_size" id="post_max_size" class="form-control">
				<option value="50M">50M</option>
			</select>
		</div>
		<div class="text-muted ml-4">
			Description of post_max_size
		</div>
	</div>
	<div class="form-group row">
		<label for="upload_max_filesize" class="col-4 col-form-label col-form-label-sm">upload_max_filesize</label>
		<div class="col-8">
			<select name="upload_max_filesize" id="upload_max_filesize" class="form-control">
				<option value="2M">2M</option>
			</select>
		</div>
		<div class="text-muted ml-4">
			Description of upload_max_filesize
		</div>
	</div>
	<div class="form-group row">
		<label for="default_mimetype" class="col-4 col-form-label col-form-label-sm">default_mimetype</label>
		<div class="col-8">
			<select name="default_mimetype" id="default_mimetype" class="form-control">
				<option value="text/html">text/html</option>
			</select>
		</div>
		<div class="text-muted ml-4">
			Description of default_mimetype
		</div>
	</div>
	<div class="form-group row">
		<label for="default_charset" class="col-4 col-form-label col-form-label-sm">default_charset</label>
		<div class="col-8">
			<select name="default_charset" id="default_charset" class="form-control">
				<option value="UTF-8">UTF-8</option>
			</select>
		</div>
		<div class="text-muted ml-4">
			Description of default_charset
		</div>
	</div>
</div>