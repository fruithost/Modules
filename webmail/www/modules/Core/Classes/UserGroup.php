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
class UserGroup extends \Aurora\System\EAV\Entity
{
	protected $aStaticMap = array(
		'UrlIdentifier'	=> array('string', ''),
		'IdTenant'	=> array('string', '')
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
			case \Aurora\System\Utils\Validate::IsEmpty($this->UrlIdentifier):
				throw new \Aurora\System\Exceptions\ValidationException(Errs::Validation_FieldIsEmpty, null, array(
					'{{ClassName}}' => 'UserGroup', '{{ClassField}}' => 'UrlIdentifier'));
		}

		return true;
	}
}
