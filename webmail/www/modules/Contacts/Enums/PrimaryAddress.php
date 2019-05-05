<?php

namespace Aurora\Modules\Contacts\Enums;

class PrimaryAddress extends \Aurora\System\Enums\AbstractEnumeration
{
	const Personal = 0;
	const Business = 1;

	/**
	 * @var array
	 */
	protected $aConsts = array(
		'Personal' => self::Personal,
		'Business' => self::Business,
	);
}

