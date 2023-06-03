<?php
	use fruithost\Auth;
?>
<div class="container">
	<div class="form-group row">
		<label for="username" class="col-4 col-form-label col-form-label-sm">Username:</label>
		<div class="col-8">
			<input type="text" class="form-control-plaintext" readonly name="username" id="username" aria-label="Username" aria-describedby="prefix" />
		</div>
	</div>
	<div class="form-group row">
		<label for="password" class="col-4 col-form-label col-form-label-sm">New Password:</label>
		<div class="col-8">
			<input type="password" class="form-control" name="password" id="password" />
		</div>
	</div>
	
	<div class="form-group row">
		<label for="path" class="col-4 col-form-label col-form-label-sm">Path:</label>
		<div class="col-8">
			<select name="path" id="path" class="form-control">
				<option value=""> - Please select - </option>
				<option value="/">/ (root)</option>
				<?php
					$root		= sprintf('%s%s', HOST_PATH, Auth::getUsername());
					$existing	= [];
					
					if(is_readable($root)) {
						foreach(new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($root, \RecursiveDirectoryIterator::SKIP_DOTS | \RecursiveDirectoryIterator::KEY_AS_PATHNAME | \FilesystemIterator::CURRENT_AS_FILEINFO), \RecursiveIteratorIterator::LEAVES_ONLY | \RecursiveIteratorIterator::SELF_FIRST) AS $info) {
							if($info->isDir() && $info->getPath() !== $root) {
								printf('<option value="%1$s">%1$s</option>', str_replace($root, '', $info->getPath()) . '/' . $info->getFilename());
							}
						}
					}
				?>
			</select>
		</div>
	</div>
	
	<input type="hidden"  readonly name="user_id" id="user_id" aria-label="User-ID" />
</div>