<?php
	use fruithost\Localization\I18N;
?>
<style>
	.instruction {
		list-style-type: decimal;
		font-weight: bold;
	}
	
	.instruction span {
		font-weight: normal;
	}
	
	.instruction table {
		margin: 10px 0;
	}
	
	.instruction table td {
		vertical-align: top;
		padding: 5px;
	}
	
	.instruction img {
		border: 1px solid;
		padding: 4px;
	}
	
	.instruction .green {
		color: rgb(42, 144, 37);
	}
</style>
<ul class="instruction">
	<li><span><?php I18N::__('Install an authenticator app from the App Store for your smartphone.'); ?></span></li>
	<li><span><?php I18N::__('Open the installed authenticator app on the smartphone.'); ?></span></li>
	<li>
		<span><?php I18N::__('Scan the QR code with the Authenticator app to add two-factor authentication:'); ?></span>
		<table>
			<tr>
				<td><strong><?php I18N::__('QR-Code'); ?>:</strong></td>
				<td>
					<img src="<?php print $qr_code; ?>" />
				</td>
			</tr>
			<tr>
				<td><strong><?php I18N::__('Secure key'); ?>:</strong></td>
				<td>
					<strong class="green"><?php print $secret; ?></strong>
				</td>
			</tr>
		</table>
	</li>
	<li>
		<span><?php I18N::__('To confirm the correct installation of the external authenticator app, enter the security code that appears on the smartphone:'); ?></span>
		<br />
		<br />
		<div class="col-md-3 text-center">
			<input type="text" class="form-control text-center" name="code" value="" placeholder="000000" />
		</div>
	</li>
</ul>
<?php // print $timer; ?>