<?php

namespace Aurora\Modules\Contacts\Enums;

class PrimaryEmail extends \Aurora\System\Enums\AbstractEnumeration
{
	const Personal = 0;
	const Business = 1;
	const Other = 2;

	/**
	 * @var array
	 */
	protected $aConsts = array(
		'Personal' => self::Personal,
		'Business' => self::Business,
		'Other' => self::Other
	);
}
