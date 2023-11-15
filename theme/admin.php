<?php
	use fruithost\Accounting\Auth;
	use fruithost\Localization\I18N;
	
	$themes = $module->getInstance()->getThemes(json_decode($module->getSettings('THEMES', json_encode([]))));
?>
<div class="container">	
	<div class="form-group row">
		<label for="themes" class="col-4 p-0 m-0"><?php I18N::__('User selectable Themes'); ?>:</label>
		<?php
			if(count($themes) == 0) {
				?>
					<div class="alert alert-danger col-8 mt-4" role="alert">
						<strong><?php I18N::__('No Themes available!'); ?></strong>
						<p class="pb-0 mb-0"><?php I18N::__('Please install some Themes.'); ?></p>
					</div>
				<?php
			} else {
				foreach($themes AS $index => $theme) {
					$classes = [ 'col-8', 'form-check' ];
					
					if($index > 0) {
						$classes[] = 'offset-4';
					}
					?>
						<div class="<?php print implode(' ', $classes); ?>">
							<div class="form-check">
								<input class="form-check-input" type="checkbox" id="themes_<?php print $theme['name']; ?>" name="themes[]" value="<?php print $theme['name']; ?>"<?php print ($theme['selected'] ? ' CHECKED' : ''); ?> />
								<label class="form-check-label" for="themes_<?php print $theme['name']; ?>"><?php print $theme['name']; ?></label>
							</div>
						</div>
					<?php
				}
			}
		?>
	</div>
</div>