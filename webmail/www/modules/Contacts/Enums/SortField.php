<?php

namespace Aurora\Modules\Contacts\Enums;

class SortField extends \Aurora\System\Enums\AbstractEnumeration
{
	const Name = 1;
	const Email = 2;
	const Frequency = 3;

	/**
	 * @var array
	 */
	protected $aConsts = array(
		'Name' => self::Name,
		'Email' => self::Email,
		'Frequency' => self::Frequency
	);
}

