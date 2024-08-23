<?php
	use fruithost\Localization\I18N;
	use fruithost\UI\Icon;
?>
<style>
    .cm-editor {
        height:     100%;
        max-height: none;
        border:     1px solid var(--bs-tertiary-bg);
    }
    
    .cm-scroller {
        overflow: auto;
    }
</style>
<div class="tab-content">
	<div class="tab-pane<?php print (empty($tab) ? ' show active' : ''); ?>" id="<?php print (isset($tab) ? $tab : 'unknown'); ?>" role="tabpanel" aria-labelledby="<?php print (isset($tab) ? $tab : 'unknown'); ?>-tab">
        <?php
            if($content === null) {
                ?>
                    File not exists.
                <?php
            } else if($content === false) {
	            ?>
                 File not accessible.
	            <?php
            } else {
                ?>
                    <div id="code-editor" data-language="<?php print $type; ?>"></div>
                    <textarea name="content" class="d-none" id="code-area"><?php print $content; ?></textarea>
                    <script id="editor-content" type="text/plain"><?php print $content; ?></script>
                <?php
            }
        ?>
	</div>
</div>
<script type="text/javascript">
	let url = '<?php print $this->url(sprintf('/module/config/%s', $submodule)); ?>';
	document.querySelector('select[name="file"]').addEventListener('change', (event) => {
		let value				= event.target.value;
		window.location.href	= url + '?file=' + value;
	}, true);
</script>