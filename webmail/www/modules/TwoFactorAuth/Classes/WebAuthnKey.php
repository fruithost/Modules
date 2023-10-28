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
class WebAuthnKey extends \Aurora\System\EAV\Entity
{
	protected $aStaticMap = [
        'UserId'			=> ['bigint', 0, true],
        'Name'              => ['string', '', true],
        'KeyData'			=> ['text', '', true],
        'CreationDateTime'  => ['int', 0, true],
        'LastUsageDateTime'	=> ['int', 0, true]
	];
}
