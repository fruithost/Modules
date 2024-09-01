<?php
	use fruithost\Storage\Database;
	
	foreach([
		'pma__bookmark',
		'pma__central_columns',
		'pma__column_info',
		'pma__designer_settings',
		'pma__export_templates',
		'pma__favorite',
		'pma__history',
		'pma__navigationhiding',
		'pma__pdf_pages',
		'pma__recent',
		'pma__relation',
		'pma__savedsearches',
		'pma__table_coords',
		'pma__table_info',
		'pma__table_uiprefs',
		'pma__tracking',
		'pma__userconfig',
		'pma__usergroups',
		'pma__users'
	] AS $table) {
		if(!Database::tableExists($table)) {
			printf('<br />Table <strong>%s</strong> not exists!', $table);
		}
	}
?>