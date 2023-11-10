<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\CpanelIntegrator\Classes;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2020, Afterlogic Corp.
 * 
 * @property int $IdUser
 */
class Alias extends \Aurora\System\EAV\Entity
{
	protected $aStaticMap = [
		'IdUser'		=> ['int', 0, true],
		'IdAccount'		=> ['int', 0, true],
		'Email'			=> ['string', ''],
		'ForwardTo'	=> ['string', ''],
		'FriendlyName'	=> ['string', '', true],
		'UseSignature'	=> ['bool', false],
		'Signature'		=> ['text', '']
	];
}
