<?php
	use fruithost\Auth;
?>
<div class="container">
	<div class="form-group row">
		<label for="domain" class="col-4 col-form-label col-form-label-sm">Domain name:</label>
		<div class="col-8">
			<input type="text" class="form-control" name="domain" id="domain" value="" placeholder="domain.tld" />
		</div>
	</div>
	
	<div class="form-group row">
		<label for="new" class="col-4 col-form-label col-form-label-sm">Home directory:</label>
		<div class="col-8 form-check">
			<input class="form-check-input" type="radio" name="type" id="new" value="new" checked />
			<label class="form-check-label" for="new">Create a new home directory</label>
		</div>
		<div class="col-8 offset-4 form-check">
			<input class="form-check-input" type="radio" name="type" id="existing" value="existing" />
			<label class="form-check-label" for="existing">Use existing home directory:</label>
		</div>
	</div>
	<div class="form-group row d-none directories">
		<div class="col-8 offset-4">
			<select name="directory" class="form-control">
				<option value="/">/ (root)</option>
				<?php
					foreach(new \DirectoryIterator(sprintf('%s%s', HOST_PATH, Auth::getUsername())) AS $info) {
						if($info->isDot() || !$info->isDir()) {
							continue;
						}
						
						printf('<option value="/%1$s">/%1$s</option>', $info->getFilename());
					}
				?>
			</select>
		</div>
	</div>
	<p class="blockquote-footer text-muted">The domain must refer to the IP Address <strong><?php print $_SERVER['SERVER_ADDR']; ?></strong> or be managed by our <a href="<?php print $template->url('/module/dns'); ?>" target="_blank">nameserver</a> (DNS). Adding domains does not replace the domain registration!</p>
</div>
<script type="text/javascript">
	_watcher = setInterval(function() {
		if(typeof(jQuery) !== 'undefined') {
			clearInterval(_watcher);
			
			(function($) {
				$('input[type="radio"][name="type"]').on('change', function(event) {
					let select = $('.directories');
					
					if($(this).val() === 'new') {
						select.addClass('d-none');
					} else {
						select.removeClass('d-none');
					}
				});
			}(jQuery));
		}
	}, 500);
</script>