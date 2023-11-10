<?php
	use fruithost\Accounting\Auth;
	use fruithost\Localization\I18N;

	$root = sprintf('%s%s', HOST_PATH, Auth::getUsername());
?>
<div class="container">
	<div class="form-group row">
		<label for="protected_directory_path" class="col-4 col-form-label col-form-label-sm"><?php I18N::__('Path'); ?>:</label>
		<div class="col-8">
			<select name="protected_directory_path" id="protected_directory_path" class="form-control">
				<option value=""> - <?php I18N::__('Please select'); ?> - </option>
				<option value="/">/ (root)</option>
				<?php
					$existing	= [];
					
					if(is_readable($root)) {
						foreach(new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator(sprintf('%s/', $root), \RecursiveDirectoryIterator::SKIP_DOTS | \RecursiveDirectoryIterator::KEY_AS_PATHNAME | \FilesystemIterator::CURRENT_AS_FILEINFO), \RecursiveIteratorIterator::LEAVES_ONLY | \RecursiveIteratorIterator::SELF_FIRST) AS $info) {
							if($info->isDir()) {
								printf('<option value="%1$s">%1$s</option>', str_replace($root, '', $info->getPath()) . '/' . $info->getFilename());
							}
						}
					}
				?>
			</select>
		</div>
	</div>
	<div class="form-group row">
		<label for="protected_directory_message" class="col-4 col-form-label col-form-label-sm"><?php I18N::__('Message'); ?>:</label>
		<div class="col-8">
			<input type="text" class="form-control" name="protected_directory_message" id="protected_directory_message" aria-label="<?php I18N::__('Message'); ?>" />
		</div>
	</div>
	<input type="hidden" name="protected_directory_id" value="" />
</div>