<?php

namespace Aurora\Modules\Contacts\Enums;

class PrimaryPhone extends \Aurora\System\Enums\AbstractEnumeration
{
	const Mobile = 0;
	const Personal = 1;
	const Business = 2;

	/**
	 * @var array
	 */
	protected $aConsts = array(
		'Mobile' => self::Mobile,
		'Personal' => self::Personal,
		'Business' => self::Business
	);
}

