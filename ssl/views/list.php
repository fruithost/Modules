<?php
	use fruithost\Accounting\Auth;
	use fruithost\Localization\I18N;
?>
<p><?php I18N::__('Add a certificate to your domain to protect information passed between your website and its visitors, providing more trust for your customers and potentially boosting your search engine rankings.'); ?></p>
<?php
	/*if(isset($error)) {
		?>
			<div class="alert alert-danger mt-4" role="alert"><?php (is_array($error) ? var_dump($error) : print $error); ?></div>
		<?php
	} else if(isset($success)) {
		?>
			<div class="alert alert-success mt-4" role="alert"><?php (is_array($success) ? var_dump($success) : print $success); ?></div>
		<?php
	}*/
	
	if(count($this->certificates) == 0) {
		require_once(sprintf('%s/empty.php', dirname(__FILE__)));
		return;
	}
?>
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
				if($certificate->type == 'DELETED') {
					continue;
				}
				
				$cert = [
					'cert'	=> null,
					'key'	=> null,
					'data'	=> null
				];
				
				
				if(file_exists(sprintf('/etc/fruithost/config/apache2/ssl/%s.cert', $certificate->name)) && is_readable(sprintf('/etc/fruithost/config/apache2/ssl/%s.cert', $certificate->name))) {
					$cert['cert']	= file_get_contents(sprintf('/etc/fruithost/config/apache2/ssl/%s.cert', $certificate->name));
					$cert['key']	= file_get_contents(sprintf('/etc/fruithost/config/apache2/ssl/%s.key', $certificate->name));
					$cert['data']	= openssl_x509_parse($cert['cert'], false);
				}
				?>
					<tr>
						<td scope="row"><?php print $certificate->name; ?></td>
						<td>
							<?php
								switch($certificate->type) {
									case 'LETSENCRYPT':
										print 'Let\'s Encrypt';
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
								if(empty($cert['cert']) && !empty($cert['key']) && $certificate->time_created === null) {
									printf('<span class="text-danger">%s</span>', I18N::get('Error'));
								} else if($certificate->time_created === null) {
									printf('<span class="text-warning">%s...</span>', I18N::get('Pending'));
								} else if($certificate->time_created !== null) {
									if(!file_exists(sprintf('%s%s/%s', HOST_PATH, Auth::getUsername(), $certificate->directory))) {
										printf('<span class="text-danger">%s</span>', I18N::get('Error'));
									} else if(empty($cert['cert']) && !empty($cert['key'])) {
										printf('<span class="text-danger">%s</span>', I18N::get('Error'));
									} else {
										printf('<span class="text-success">%s</span>', I18N::get('Live'));
									}
								}
							?>
						</td>
						<td>
							<?php
								if(empty($cert['cert']) && !empty($cert['key']) && $certificate->days_expiring === null) {
									printf('<span class="text-danger">%s</span>', I18N::get('Error'));
								} else if($certificate->days_expiring === null) {
									printf('<span class="text-warning">%s...</span>', I18N::get('Pending'));
								} else if($certificate->days_expiring !== null) {
									if(!file_exists(sprintf('%s%s/%s', HOST_PATH, Auth::getUsername(), $certificate->directory))) {
										printf('<span class="text-danger">%s</span>', I18N::get('Error'));
									} else if(empty($cert['data'])) {
										printf('<span class="text-danger">%s</span>', I18N::get('Error'));
									} else {
										printf('<span class="text-success">%s</span>', date(Auth::getSettings('TIME_FORMAT', NULL, $this->getSettings('TIME_FORMAT', 'd.m.Y - H:i:s')), strtotime(date_create_from_format('ymdHise', $cert['data']['validTo'])->format('c'))));
									}
								}
							?>
						</td>
						<td class="text-right">
							<a class="delete btn btn-sm btn-primary" href="<?php print sprintf('%s/view/%s', $this->url('/module/ssl'), $certificate->domain); ?>"><?php I18N::__('Manage'); ?></a>
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