<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\OAuthIntegratorWebclient\Enums;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 */
class ErrorCodes
{
	const ServiceNotAllowed = 1;
	const AccountNotAllowedToLogIn = 2;
	const AccountAlreadyConnected = 3;
	const NotConfigured = 4;

	/**
	 * @var array
	 */
	protected $aConsts = [
		'ServiceNotAllowed' => self::ServiceNotAllowed,
		'AccountNotAllowedToLogIn' => self::AccountNotAllowedToLogIn,
		'AccountAlreadyConnected' => self::AccountAlreadyConnected,
		'NotConfigured' => self::NotConfigured,
	];
}
