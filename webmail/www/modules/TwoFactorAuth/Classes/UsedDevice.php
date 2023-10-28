<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\TwoFactorAuth\Classes;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2020, Afterlogic Corp.
 *
 * @package Api
 */
class UsedDevice extends \Aurora\System\EAV\Entity
{
	protected $aStaticMap = [
        'UserId'		    => ['bigint', 0, true],
        'DeviceId'          => ['string', '', true],
        'DeviceName'		=> ['string', '', true],
        'AuthToken'			=> ['text', '', true],
        'CreationDateTime'  => ['int', 0, true],
        'LastUsageDateTime'	=> ['int', 0, true],
        'TrustTillDateTime'	=> ['int', 0, true],
        'DeviceIP'			=> ['string', '', true],
	];

	public function toResponseArray()
	{
		$aResponse = parent::toResponseArray();
		$aResponse['Authenticated'] = false;
		if (\Aurora\Api::GetSettings()->GetValue('StoreAuthTokenInDB', false) && !empty($aResponse['AuthToken']) && !empty(\Aurora\System\Api::UserSession()->Get($aResponse['AuthToken'])))
		{
			$aResponse['Authenticated'] = true;
		}
		unset($aResponse['AuthToken']);
		return $aResponse;
	}
}
