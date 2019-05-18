<?php
	use fruithost\Auth;
?>
<div class="container">	
	<div class="form-group row">
		<label for="themes" class="col-4 p-0 m-0">User selectable Themes:</label>
		<?php
			foreach($module->getInstance()->getThemes(json_decode($module->getSettings('THEMES', json_encode([])))) AS $index => $theme) {
				$classes = [ 'col-8', 'form-check' ];
				
				if($index > 0) {
					$classes[] = 'offset-4';
				}
				?>
					<div class="<?php print implode(' ', $classes); ?>">
						<input class="form-check-input" type="checkbox" name="themes[]" id="<?php print $theme['name']; ?>" value="<?php print $theme['name']; ?>"<?php print ($theme['selected'] ? ' CHECKED' : ''); ?> />
						<label class="form-check-label" for="<?php print $theme['name']; ?>"><?php print $theme['name']; ?></label>
					</div>
				<?php
			}
		?>
	</div>
</div>
<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-top">
	<div class="container">
		<div class="row text-center">
			<a href="<?php print $this->url('/admin/modules' . (!empty($tab) ? '/' . $tab : '')); ?>" class="btn d-inline-block btn-outline-danger mr-2">Cancel</a>
			<button type="submit" name="action" value="settings" class="btn d-inline-block btn-outline-success">Save</button>				
		</div>
	</div>
</div>