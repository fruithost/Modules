<?php
	namespace fruithost\Module\SSL\Providers;
	
	interface Provider {
		public function getName() : string;
		public function getDescription() : string;
		public function isFree() : bool;
		public function getIcon() : string | null;
		public function renewPeriod() : int | null;
		public function renewUntil() : int | null;
	}
?>