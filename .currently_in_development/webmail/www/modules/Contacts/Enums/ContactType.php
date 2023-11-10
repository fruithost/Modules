<?php

namespace Aurora\Modules\Contacts\Enums;

class ContactType extends \Aurora\System\Enums\AbstractEnumeration
{
	const Personal = 0;
	const Global_ = 1;
	const GlobalAccounts = 2;
	const GlobalMailingList = 3;

	/**
	 * @var array
	 */
	protected $aConsts = array(
		'Personal' => self::Personal,
		'Global_' => self::Global_,
		'GlobalAccounts' => self::GlobalAccounts,
		'GlobalMailingList' => self::GlobalMailingList
	);
}
