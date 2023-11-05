<?php
	use fruithost\I18N;
?>
<form class="col-6 offset-3 text-center mt-4 mb-4" method="post" action="<?php print $this->url('/module/faq'); ?>">
	<h1 class="mt-4 mb-4"><?php I18N::__('What can we help you with?'); ?></h1>
	
	<div class="input-group mt-4 mb-3">
		<input type="text" name="query" class="form-control" placeholder="<?php I18N::__('Enter a question or key word...'); ?>" value="<?php print (isset($_POST['query']) ? $_POST['query'] : ''); ?>" aria-label="<?php I18N::__('Enter a question or key word...'); ?>" aria-describedby="search" />
		<div class="input-group-append">
			<button type="submit" id="search" name="action" value="search" class="btn btn-primary"><?php I18N::__('Search'); ?></button>
		</div>
	</div>
</form>