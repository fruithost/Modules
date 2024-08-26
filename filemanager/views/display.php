<?php
	use fruithost\Localization\I18N;
	use fruithost\UI\Icon;
	
	function printPath($context, $root, $path, $depth = 0, $only_dirs = false) {
	    $html = '';
    
		if(!empty($path)) {
			foreach($path AS $entry) {			
				switch($entry['type']) {
					case 'directory':
						if(!empty($entry['children'])) {
							$html .= sprintf('<div class="list-group-item" data-bs-toggle="collapse" data-bs-target="#tree-%1$s">', $entry['name']);
							$html .= sprintf('<a data-type="%1$s" href="%3$s" class="text-decoration-none fst-normal" role="button">%2$s</a>', $entry['type'], $entry['name'], $context->url('/module/filemanager/?path='.str_replace($root, '', $entry['path'].DS.$entry['name'])));
							$html .= '</div>';
						} else {
							$html .= '<div class="list-group-item">';
							$html .= sprintf('<a data-type="%1$s" href="%3$s" class="text-decoration-none fst-normal">%2$s</a>', $entry['type'], $entry['name'], $context->url('/module/filemanager/?path='.str_replace($root, '', $entry['path'].DS.$entry['name'])));
							$html .= '</div>';
                        }
                        
                        if(!empty($entry['children'])) {
	                        $html .= sprintf('<div class="list-group collapse list-group-flush ps-5" id="tree-%1$s">', $entry['name']);
	                        $html .= printPath($context, $root, $entry['children'], $depth++, $only_dirs);
	                        $html .= '</div>';
                        }
					break;
					case 'file':
                        if($only_dirs) {
                            return;
                        }
                        
						$html .= '<div class="list-group-item">';
						$html .= sprintf('<span data-type="%s">%s</span>', $entry['type'], $entry['name']);
						$html .= '</div>';
					break;
				}
			}
		}
		return $html;
	}
?>
<form method="post" action="<?php print $this->url('/server/logs'); ?>">
	<section class="contentbar-content left">
		<aside class="bg-body-tertiary border-start contentbar d-md-block">
			<h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-2 mb-2 text-muted" data-toggle="collapse" data-target="#collapse_account" aria-expanded="false" aria-controls="collapse_account">
				<span><?php I18N::__('Files'); ?></span>
			</h6>
            <div class="list-group tree list-group-flush">
                <?php
                    print printPath($this, $root, $files, 0, true);
                ?>
            </div>
		</aside>

        <div class="loading jumbotron text-center bg-transparent text-muted" style="display: none;">
			<h2><?php I18N::__('Loading'); ?></h2>
			<p class="lead">
			<div class="spinner-border text-primary" role="status"></div>
			</p>
		</div>
		<div class="no-file jumbotron text-center bg-transparent text-muted" style="display: block;">
			<?php Icon::show('file'); ?>
			<h2><?php I18N::__('No File selected!'); ?></h2>
			<p class="lead"><?php I18N::__('Please select an Logfile from the List.'); ?></p>
		</div>
		<article class="editor" style="display: none;">
            
        </article>
	</section>
</form>