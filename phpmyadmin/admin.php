<?php
	use fruithost\Auth;
?>
<div class="container">	
	<div class="form-group row">
		<label for="iframe" class="col-4 col-form-label col-form-label-sm">Open PHPMyAdmin as:</label>
		<div class="col-8 form-check">
			<input class="form-check-input" type="radio" name="VIEW" id="iframe" value="IFRAME"<?php print ($module->getSettings('VIEW', 'IFRAME') === 'IFRAME' ? ' CHECKED' : ''); ?> />
			<label class="form-check-label" for="iframe">Internal / Embedded <code>&lt;iframe&gt;</code></label>
		</div>
		<div class="col-8 offset-4 form-check">
			<input class="form-check-input" type="radio" name="VIEW" id="external" value="EXTERNAL"<?php print ($module->getSettings('VIEW', 'IFRAME') === 'EXTERNAL' ? ' CHECKED' : ''); ?> />
			<label class="form-check-label" for="external">External / New Site</label>
		</div>
	</div>
	<div class="form-group row">
		<label for="user" class="col-4 col-form-label col-form-label-sm">Login-Type:</label>
		<div class="col-8 form-check">
			<input class="form-check-input" type="radio" name="LOGIN" id="user" value="USER"<?php print ($module->getSettings('LOGIN', 'USER') === 'USER' ? ' CHECKED' : ''); ?> />
			<label class="form-check-label" for="user">Automatic created username, based on their real username</label>
		</div>
		<div class="col-8 offset-4 form-check">
			<input class="form-check-input" type="radio" name="LOGIN" id="selection" value="SELECTION"<?php print ($module->getSettings('LOGIN', 'USER') === 'SELECTION' ? ' CHECKED' : ''); ?> />
			<label class="form-check-label" for="selection">User must select their available Usernames from an List</label>
		</div>
	</div>
</div>
<div class="container pt-3 pb-2 mb-3 border-top">
    <div class="row">
        <div class="col text-end">
            <a href="<?php print $this->url('/admin/modules' . (!empty($tab) ? '/' . $tab : '')); ?>" class="btn d-inline-block btn-outline-danger mr-2">Cancel</a>
            <button type="submit" name="action" value="settings" class="btn d-inline-block btn-outline-success">Save</button>
        </div>
    </div>
</div>