<?php
	use fruithost\Localization\I18N;
	use fruithost\UI\Icon;
	
	function printPath($path) {
		$html = '<ul class="tree">';
		
		if(!empty($path)) {
			foreach($path AS $entry) {			
				switch($entry['type']) {
					case 'directory':
						$html .= '<li>';
						$html .= sprintf('<span data-type="%s">%s</span>', $entry['type'], $entry['name']);
						$html .= printPath($entry['children']);
						$html .= '</li>';
					break;
					case 'file':
						$html .= '<li>';
						$html .= sprintf('<span data-type="%s">%s</span>', $entry['type'], $entry['name']);
						$html .= '</li>';
					break;
				}
			}
		}
		
		return $html . '</ul>';
	}
?>
<form method="post" action="<?php print $this->url('/server/logs'); ?>">
	<section class="contentbar-content left">
		<aside class="bg-body-tertiary border-start contentbar d-md-block">
			<h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-2 mb-2 text-muted" data-toggle="collapse" data-target="#collapse_account" aria-expanded="false" aria-controls="collapse_account">
				<span><?php I18N::__('Logfiles'); ?></span>
			</h6>
		   <?php
				print printPath($files);
			?>
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