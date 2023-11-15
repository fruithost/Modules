<?php
	use fruithost\Accounting\Auth;
	use fruithost\System\Utils;
	use fruithost\Localization\I18N;
?>
<div class="container">
	<div class="form-group row">
		<label for="name" class="col-4 col-form-label col-form-label-sm"><?php I18N::__('Name'); ?>:</label>
		<div class="col-8">
			<input type="text" class="form-control" name="name" id="name" value="" placeholder="<?php I18N::__('Name of your Job'); ?>" />
		</div>
	</div>
	<div class="form-group row border-bottom border-muted"></div>
	<div class="form-group row">
		<label for="template" class="col-4 col-form-label col-form-label-sm"><?php I18N::__('Template'); ?>:</label>
		<div class="col-8">
			<select name="template" id="template" class="form-select">
				<option value="--">-- <?php I18N::__('Common Settings'); ?> --</option>
				<option value="* * * * *"><?php I18N::__('Each Minute'); ?> (* * * * *)</option>
				<option value="*/5 * * * *"><?php I18N::__('All 5 Minutes'); ?> (*/5 * * * *)</option>
				<option value="0,30 * * * *"><?php I18N::__('Each 30 Minutes'); ?> (0,30 * * * *)</option>
				<option value="0 * * * *"><?php I18N::__('Each Hour'); ?> (0 * * * *)</option>
				<option value="0 0,12 * * *"><?php I18N::__('Each 12 Hours'); ?> (0 0,12 * * *)</option>
				<option value="0 0 * * *"><?php I18N::__('Each Day'); ?> (0 0 * * *)</option>
				<option value="0 0 * * 0"><?php I18N::__('Each Week'); ?> (0 0 * * 0)</option>
				<option value="0 0 1,15 * *"><?php I18N::__('On the 1st and 15th of the Month'); ?> (0 0 1,15 * *)</option>
				<option value="0 0 1 * *"><?php I18N::__('Each Month'); ?> (0 0 1 * *)</option>
				<option value="0 0 1 1 *"><?php I18N::__('Each Year'); ?> (0 0 1 1 *)</option>
			</select>
		</div>
	</div>
	<div class="form-group row">
		<label for="minute" class="col-4 col-form-label col-form-label-sm"><?php I18N::__('Minute'); ?>:</label>
		<div class="col-2 pr-1">
			<input type="text" class="form-control" name="minute" id="minute" value="*" />
		</div>
		<div class="col-6 pl-0">
			<select name="template_minute" id="template_minute" class="form-select">
				<option value="--">-- <?php I18N::__('Common Settings'); ?> --</option>
				<option value="*"><?php I18N::__('Each Minute'); ?> (*)</option>
				<option value="*/2"><?php I18N::__('Each two Minutes'); ?> (*/2)</option>
				<option value="*/5"><?php I18N::__('Each Five Minutes'); ?> (*/5)</option>
				<option value="*/10"><?php I18N::__('Each Ten Minutes'); ?> (*/10)</option>
				<option value="*/15"><?php I18N::__('Each Fifteen Minutes'); ?> (*/15)</option>
				<option value="0,30"><?php I18N::__('Each Thirty Minutes'); ?> (0,30)</option>
				<option value="--">-- <?php I18N::__('Minutes'); ?> --</option>
				<?php
					for($minute = 0; $minute <= 59; $minute++) {
						if($minute == 0) {
							printf('<option value="%1$d">:%1$s (%2$s)</option>', Utils::zeroize($minute), I18N::get('At the beginning of the hour'));
						} else if($minute == 15) {
							printf('<option value="%1$d">:%1$s (%2$s)</option>', Utils::zeroize($minute), I18N::get('At one quarter past the hour'));
						} else if($minute == 30) {
							printf('<option value="%1$d">:%1$s (%2$s)</option>', Utils::zeroize($minute), I18N::get('At half past the hour'));
						} else if($minute == 45) {
							printf('<option value="%1$d">:%1$s (%2$s)</option>', Utils::zeroize($minute), I18N::get('At one quarter until the hour'));
						} else {
							printf('<option value="%1$d">:%1$s</option>', Utils::zeroize($minute));
						}
					}
				?>
			</select>
		</div>
	</div>
	<div class="form-group row">
		<label for="hour" class="col-4 col-form-label col-form-label-sm"><?php I18N::__('Hour'); ?>:</label>
		<div class="col-2 pr-1">
			<input type="text" class="form-control" name="hour" id="hour" value="*" />
		</div>
		<div class="col-6 pl-0">
			<select name="template_hour" id="template_hour" class="form-select">
				<option value="--">-- <?php I18N::__('Common Settings'); ?> --</option>
				<option value="*"><?php I18N::__('Every Hour'); ?> (*)</option>
				<option value="*/2"><?php I18N::__('Every Other Hour'); ?> (*/2)</option>
				<option value="*/3"><?php I18N::__('Every Third Hour'); ?> (*/3) </option>
				<option value="*/4"><?php I18N::__('Every Fourth Hour'); ?> (*/4)</option>
				<option value="*/6"><?php I18N::__('Every Sixth Hour'); ?> (*/6)</option>
				<option value="0,12"><?php I18N::__('Every Twelve Hours'); ?> (0,12)</option>
				<option value="--">-- <?php I18N::__('Hours'); ?> --</option>
				<?php
					for($hour = 0; $hour <= 23; $hour++) {
						printf('<option value="%1$d">%1$s:00</option>', Utils::zeroize($hour));
					}
				?>
			</select>
		</div>
	</div>
	<div class="form-group row">
		<label for="day" class="col-4 col-form-label col-form-label-sm"><?php I18N::__('Day'); ?>:</label>
		<div class="col-2 pr-1">
			<input type="text" class="form-control" name="day" id="day" value="*" />
		</div>
		<div class="col-6 pl-0">
			<select name="template_day" id="template_day" class="form-select">
				<option value="--">-- <?php I18N::__('Common Settings'); ?> --</option>
				<option value="*"><?php I18N::__('Every Day'); ?> (*)</option>
				<option value="*/2"><?php I18N::__('Every Other Day'); ?> (*/2)</option>
				<option value="1,15"><?php I18N::__('On the 1st and 15th of the Month'); ?> (1,15)</option>
				<option value="--">-- <?php I18N::__('Days'); ?> --</option>
				<?php
					for($day = 0; $day <= 31; $day++) {
						printf('<option value="%1$d">%1$d</option>', $day);
					}
				?>
			</select>
		</div>
	</div>
	<div class="form-group row">
		<label for="month" class="col-4 col-form-label col-form-label-sm"><?php I18N::__('Month'); ?>:</label>
		<div class="col-2 pr-1">
			<input type="text" class="form-control" name="month" id="month" value="*" />
		</div>
		<div class="col-6 pl-0">
			<select name="template_month" id="template_month" class="form-select">
				<option value="--">-- <?php I18N::__('Common Settings'); ?> --</option>
				<option value="*"><?php I18N::__('Every Month'); ?> (*)</option>
				<option value="*/2"><?php I18N::__('Every Other Month'); ?> (*/2)</option>
				<option value="*/4"><?php I18N::__('Every Third Month'); ?> (*/4)</option>
				<option value="1,7"><?php I18N::__('Every Six Months'); ?> (1,7)</option>
				<option value="--">-- <?php I18N::__('Months'); ?> --</option>
				<?php
					foreach([
						'January',
						'February',
						'March',
						'April',
						'May',
						'June',
						'July',
						'August',
						'September',
						'October',
						'November',
						'December'
					] AS $index => $month) {
						printf('<option value="%1$d">%2$s (%1$d)</option>', $index + 1, I18N::get($month));
					}
				?>
			</select>
		</div>
	</div>
	<div class="form-group row">
		<label for="weekday" class="col-4 col-form-label col-form-label-sm"><?php I18N::__('Weekday'); ?>:</label>
		<div class="col-2 pr-1">
			<input type="text" class="form-control" name="weekday" id="weekday" value="*" />
		</div>
		<div class="col-6 pl-0">
			<select name="template_weekday" id="template_weekday" class="form-select">
				<option value="--">-- <?php I18N::__('Common Settings'); ?> --</option>
				<option value="*"><?php I18N::__('Every Day'); ?> (*)</option>
				<option value="1-5"><?php I18N::__('Every Weekday'); ?> (1-5)</option>
				<option value="0,6"><?php I18N::__('Every Weekend Day'); ?> (6,0)</option>
				<option value="1,3,5"><?php I18N::__('Every Monday, Wednesday, and Friday'); ?> (1,3,5)</option>
				<option value="2,4"><?php I18N::__('Every Tuesday and Thursday'); ?> (2,4)</option>
				<option value="--">-- <?php I18N::__('Weekdays'); ?> --</option>
				<?php
					foreach([
						'Sunday',
						'Monday',
						'Tuesday',
						'Wednesday',
						'Thursday',
						'Friday',
						'Saturday'
					] AS $index => $weekday) {
						printf('<option value="%1$d">%2$s (%1$d)</option>', $index, I18N::get($weekday));
					}
				?>
			</select>
		</div>
	</div>
	<div class="form-group row border-bottom border-muted"></div>
	<div class="form-group row">
		<label for="php" class="col-4 col-form-label col-form-label-sm"><?php I18N::__('Action'); ?>:</label>
		<div class="col-8 form-check">
			<input class="form-check-input" type="radio" name="type" id="php" value="php" checked />
			<label class="form-check-label" for="php"><?php I18N::__('Execute PHP Script'); ?>:</label>
		</div>
	</div>
	<div class="form-group row php">
		<div class="col-8 offset-4">
			<select name="php" class="form-select">
				<option value="">-- <?php I18N::__('Please Select'); ?> --</option>
				<?php
					$root		= sprintf('%s%s', HOST_PATH, Auth::getUsername());
					
					if(is_readable($root)) {
						foreach(new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($root), \RecursiveIteratorIterator::SELF_FIRST) AS $path => $info) {
							if($info->isDir() || !preg_match('/\.php$/', $info->getFilename())) {
								continue;
							}
							
							printf('<option value="%1$s/%2$s">%1$s/%2$s</option>', str_replace($root, '', $info->getPath()), $info->getFilename());
						}
					}
				?>
			</select>
		</div>
		<div class="col-8 offset-4 mt-1">
			<input type="text" name="parameters" placeholder="<?php I18N::__('Arguments'); ?>" value="" class="form-control" />
		</div>
	</div>
	<div class="form-group row">
		<div class="col-8 offset-4 form-check">
			<input class="form-check-input" type="radio" name="type" id="url" value="url" />
			<label class="form-check-label" for="url"><?php I18N::__('Call URL'); ?>:</label>
		</div>
	</div>
	<div class="form-group row d-none url">
		<div class="col-8 offset-4">
			<input type="text" name="url" placeholder="http://" value="" class="form-control" />
		</div>
	</div>
	<input type="hidden" name="cron_id" value="" />
</div>
<script type="text/javascript">
	(() => {
		window.addEventListener('DOMContentLoaded', () => {
			[].map.call(document.querySelectorAll('#create_cron,#change_cron'), function(target) {
				[].map.call(target.querySelectorAll('select[name="template"]'), function(template) {
					template.addEventListener('change', function(event) {
						var option = this.value;
						
						if(option !== '--') {
							var option_array = option.split(' ');
							
							target.querySelector('input[name="minute"]').value				= option_array[0];
							target.querySelector('input[name="hour"]').value				= option_array[1];
							target.querySelector('input[name="day"]').value					= option_array[2];
							target.querySelector('input[name="month"]').value				= option_array[3];
							target.querySelector('input[name="weekday"]').value				= option_array[4];
							target.querySelector('select[name="template_minute"]').value	= option_array[0];
							target.querySelector('select[name="template_hour"]').value		= option_array[1];
							target.querySelector('select[name="template_day"]').value		= option_array[2];
							target.querySelector('select[name="template_month"]').value		= option_array[3];
							target.querySelector('select[name="template_weekday"]').value	= option_array[4];
						}
					});
				});
					
				[].map.call([
					'minute',
					'hour',
					'day',
					'month',
					'weekday'
				], function(type) {
					[].map.call(target.querySelectorAll('select[name="template_' + type + '"]'), function(select) {
						select.addEventListener('change', function(event) {
							if(this.value !== '--') {
								target.querySelector('input[name="' + type + '"]').value = this.value;
							}
						});
					});
				});

				[].map.call(target.querySelectorAll('input[type="radio"][name="type"]'), function(radio) {
					radio.addEventListener('change', function(event) {
						let php = target.querySelector('div.php');
						let url = target.querySelector('div.url');
						
						switch(this.value) {
							case 'php':
								php.classList.remove('d-none');
								url.classList.add('d-none');
							break;
							case 'url':
								php.classList.add('d-none');
								url.classList.remove('d-none');						
							break;
						}
					});
				});
			});
		});
	})();
</script>