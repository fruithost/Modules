<?php
	use fruithost\Localization\I18N;
	
	if(empty($this->domain)) {
		?>
			<div class="container">
				<div class="alert alert-danger mt-4" role="alert">
					<strong><?php I18N::__('Problem!'); ?></strong>
					<p class="pb-0 mb-0"><?php printf(I18N::get('You have no permissions to edit the given Domain.'), $this->domain); ?></p>
				</div>
			</div>
		<?php
	} else if(empty($this->certificate)) {
		require_once(sprintf('%s/content/select.php', dirname(__FILE__)));
	} else {
		require_once(sprintf('%s/content/details.php', dirname(__FILE__)));
	}
?>