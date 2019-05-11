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
 * @property int $IdChannel
 * @property string $Login
 * @property string $Password
 * @property string $Description
 *
 * @package Classes
 * @subpackage Channels
 */
class Channel extends \Aurora\System\EAV\Entity
{
	protected $aStaticMap = array(
		'Login'			=> array('string', '', true),
		'Password'		=> array('string', ''),
		'Description'	=> array('string', '')
	);	

	/**
	 * @throws \Aurora\System\Exceptions\ValidationException
	 *
	 * @return bool
	 */
	public function validate()
	{
		switch (true)
		{
			case !\Aurora\System\Utils\Validate::IsValidLogin($this->Login):
				throw new \Aurora\System\Exceptions\ValidationException(Errs::Validation_InvalidTenantName);
			case \Aurora\System\Utils\Validate::IsEmpty($this->Login):
				throw new \Aurora\System\Exceptions\ValidationException(Errs::Validation_FieldIsEmpty, null, array(
					'{{ClassName}}' => 'Channel', '{{ClassField}}' => 'Login'));
		}

		return true;
	}
}
