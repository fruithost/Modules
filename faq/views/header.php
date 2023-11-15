<?php
	use fruithost\Localization\I18N;
?>
<div class="container">
	<div class="row">
		<div class="row text-center">
			<h3 class="m-4"><?php I18N::__('What can we help you with?'); ?></h3>
			<form class="container col-12 offset-3 text-center mt-4 mb-4" method="post" action="<?php print $this->url('/module/faq'); ?>">
				<div class="row">
					<div class="col input-group mt-4 mb-3">
						<input type="text" name="query" class="form-control" placeholder="<?php I18N::__('Enter a question or key word...'); ?>" value="<?php print (isset($_POST['query']) ? $_POST['query'] : ''); ?>" aria-label="<?php I18N::__('Enter a question or key word...'); ?>" aria-describedby="search" />
						<button type="submit" id="search" name="action" value="search" class="btn btn-primary"><?php I18N::__('Search'); ?></button>
					</div>
				</div>
			</form>
		</div>
	</div>
	<div class="row mt-5">
		<div class="row d-flex align-items-start">
			<div class="col-3 border-end h-100">
				<ul class="nav flex-column nav-tabs" role="tablist" style="min-width: 200px;" id="v-pills-tab" role="tablist" aria-orientation="vertical">
					<li class="text-bg-secondary text-uppercase small rounded p-2 mb-2 me-0">Filter</li>
					<?php
						foreach($this->categories AS $category) {
							?>
								<li class="nav-item">
									<button class="nav-link" id="v-pills-<?php print $category->id; ?>-tab" data-bs-toggle="pill" data-bs-target="#v-pills-<?php print $category->id; ?>" type="button" role="tab" aria-controls="v-pills-<?php print $category->id; ?>" aria-selected="true"><?php print $category->name; ?></button>
								</li>
							<?php
						}
					?>
				</ul>
			</div>
			<div class="col-9">
				<div class="tab-content flex-grow-1" id="v-pills-tabContent">