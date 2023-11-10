<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\Core\Classes;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @property int $IdTenant
 * @property string $UrlIdentifier
 *
 * @package Classes
 * @subpackage UserGroups
 */
class UserBlock extends \Aurora\System\EAV\Entity
{
	protected $aStaticMap = array(
		'Email'	=> array('string', ''),
        'IpAddress'	=> array('string', ''),
        'ErrorLoginsCount' 	=> array('int', 0),
        'Time' 	=> array('int', 0),
	);
}
