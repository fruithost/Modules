<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\Contacts\Classes;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @property int $IdUser
 * @property string $Name
 * @property bool $IsOrganization
 * @property string $Email
 * @property string $Company
 * @property string $Street
 * @property string $City
 * @property string $State
 * @property string $Zip
 * @property string $Country
 * @property string $Phone
 * @property string $Fax
 * @property string $Web
 * @property array $Events
 *
 * @ignore
 * @package Contactsmain
 * @subpackage Classes
 */
class Group extends \Aurora\System\EAV\Entity
{
	public $Events = array();
	
	public $GroupContacts = array();
	
	protected $aStaticMap = array(
		'IdUser'			=> array('int', 0, true),

		'Name'				=> array('string', '', true),
		'IsOrganization'	=> array('bool', false),

		'Email'				=> array('string', ''),
		'Company'			=> array('string', ''),
		'Street'			=> array('string', ''),
		'City'				=> array('string', ''),
		'State'				=> array('string', ''),
		'Zip'				=> array('string', ''),
		'Country'			=> array('string', ''),
		'Phone'				=> array('string', ''),
		'Fax'				=> array('string', ''),
		'Web'				=> array('string', ''),
		'Events'			=> array('string', ''),
	);

	public function populate($aGroup)
	{
		parent::populate($aGroup);
		
		$this->GroupContacts = array();
		if (isset($aGroup['Contacts']) && is_array($aGroup['Contacts']))
		{
			$aContactUUIDs = $aGroup['Contacts'];
			foreach ($aContactUUIDs as $sContactUUID)
			{
				$oGroupContact = new \Aurora\Modules\Contacts\Classes\GroupContact($this->getModule());
				$oGroupContact->ContactUUID = $sContactUUID;
				$this->GroupContacts[] = $oGroupContact;
			}
		}
	}
}
