<?php
	use fruithost\Storage\Database;
	
	if(!Database::tableExists(DATABASE_PREFIX . 'faq_categories')) {
		print('<br />Table <strong>faq_categories</strong> not exists!');
	}
	
	if(!Database::tableExists(DATABASE_PREFIX . 'faq_entries')) {
		print('<br />Table <strong>faq_entries</strong> not exists!');
	}
?>