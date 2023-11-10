<?php
/*
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 * @license AGPL-3.0 or Afterlogic Software License
 *
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\MailSaveMessageAsPdfPlugin\Enums;

class ErrorCodes
{
	const LibraryNoFound = 1;

	/**
	 * @var array
	 */
	protected $aConsts = [
		'LibraryNoFound' => self::LibraryNoFound,
	];
}
