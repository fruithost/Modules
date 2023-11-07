<?php
	use fruithost\Auth;
	use fruithost\I18N;
?>
<p><?php I18N::__('Add a certificate to your domain to protect information passed between your website and its visitors, providing more trust for your customers and potentially boosting your search engine rankings.'); ?></p>
<table class="table table-borderless table-striped table-hover">
	<thead>
		<tr>
			<th scope="col" colspan="2"><?php I18N::__('Domain'); ?></th>
			<th scope="col"><?php I18N::__('Certificate'); ?></th>
			<th scope="col"><?php I18N::__('Expires'); ?></th>
			<th scope="col" colspan="2"></th>
		</tr>
	</thead>
	<tbody>
		<?php
			foreach($this->certificates AS $certificate) {
				?>
					<tr>
						<td scope="row"><?php print $certificate->name; ?></td>
						<td>
							<?php
								switch($certificate->type) {
									case 'LETSENCRYPT':
										I18N::__('Let\'s Encrypt');
									break;
									case 'SELFSIGNED':
										I18N::__('Self-signed');
									break;
									case 'CERTIFICATE':
										I18N::__('Certificate');
									break;
								}
							?>
						</td>
						<td>
							<?php
								if($certificate->time_created === null) {
									printf('<span class="text-warning">%s...</span>', I18N::get('Pending'));
								} else if($certificate->time_created !== null) {
									if(!file_exists(sprintf('%s%s/%s', HOST_PATH, Auth::getUsername(), $certificate->directory))) {
										printf('<span class="text-danger">%s</span>', I18N::get('Error'));
									} else {
										printf('<span class="text-success">%s</span>', I18N::get('Live'));
									}
								}
							?>
						</td>
						<td>
							<?php
								if($certificate->days_expiring === null) {
									printf('<span class="text-warning">%s...</span>', I18N::get('Pending'));
								} else if($certificate->days_expiring !== null) {
									if(!file_exists(sprintf('%s%s/%s', HOST_PATH, Auth::getUsername(), $certificate->directory))) {
										printf('<span class="text-danger">%s</span>', I18N::get('Error'));
									} else {
										printf('<span class="text-success">%s</span>', I18N::get('Live'));
									}
								}
							?>
						</td>
						<td class="text-right">
							<a class="delete btn btn-sm btn-primary" href="<?php print sprintf('%s/view/%s', $this->url('/module/ssl'), $certificate->id); ?>"><?php I18N::__('Manage'); ?></a>
						</td>
					</tr>
				<?php
			}
		?>
	</tbody>
</table>
<script type="text/javascript">
	_watcher_domain = setInterval(function() {
		if(typeof(jQuery) !== 'undefined') {
			clearInterval(_watcher_domain);
			
			(function($) {
				$('button[name="action"].delete').on('click', function(event) {
					$(event.target).parent().parent().find('input[type="checkbox"][name="domain[]"]').prop('checked', true);
				});
			}(jQuery));
		}
	}, 500);
</script>