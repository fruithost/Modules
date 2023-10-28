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
 * @property int $IdTenant
 * @property string $Storage
 * @property string $FullName
 * @property bool $UseFriendlyName
 * @property int $PrimaryEmail
 * @property int $PrimaryPhone
 * @property int $PrimaryAddress
 * @property string $ViewEmail
 * @property string $Title
 * @property string $FirstName
 * @property string $LastName
 * @property string $NickName
 * @property string $Skype
 * @property string $Facebook
 * 
 * @property string $PersonalEmail
 * @property string $PersonalAddress
 * @property string $PersonalCity
 * @property string $PersonalState
 * @property string $PersonalZip
 * @property string $PersonalCountry
 * @property string $PersonalWeb
 * @property string $PersonalFax
 * @property string $PersonalPhone
 * @property string $PersonalMobile
 * @property string $BusinessEmail
 * @property string $BusinessCompany
 * @property string $BusinessAddress
 * @property string $BusinessCity
 * @property string $BusinessState
 * @property string $BusinessZip
 * @property string $BusinessCountry
 * @property string $BusinessJobTitle
 * @property string $BusinessDepartment
 * @property string $BusinessOffice
 * @property string $BusinessPhone
 * @property string $BusinessFax
 * @property string $BusinessWeb
 * 
 * @property string $OtherEmail
 * @property string $Notes
 * @property int $BirthDay
 * @property int $BirthMonth
 * @property int $BirthYear
 * 
 * @property string $ETag
 * @property bool $Auto
 * @property int $Frequency
 *
 * @ignore
 * @package Contactsmain
 * @subpackage Classes
 */
class Contact extends \Aurora\System\EAV\Entity
{
	public $GroupsContacts = array();
	
	public $ExtendedInformation = array();

	public function __construct($sModule)
	{
		$this->aStaticMap = array(
			'IdUser'			=> array('int', 0, true),
			'IdTenant'			=> array('int', 0),
			'Storage'			=> array('string', ''),
			'FullName'			=> array('string', '', true),
			'UseFriendlyName'	=> array('bool', true),
			'PrimaryEmail'		=> array('int', \Aurora\Modules\Contacts\Enums\PrimaryEmail::Personal),
			'PrimaryPhone'		=> array('int', \Aurora\Modules\Contacts\Enums\PrimaryPhone::Personal),
			'PrimaryAddress'	=> array('int', \Aurora\Modules\Contacts\Enums\PrimaryAddress::Personal),
			'ViewEmail'			=> array('string', '', true),

			'Title'				=> array('string', ''),
			'FirstName'			=> array('string', ''),
			'LastName'			=> array('string', ''),
			'NickName'			=> array('string', ''),
			'Skype'				=> array('string', ''),
			'Facebook'			=> array('string', ''),

			'PersonalEmail'		=> array('string', ''),
			'PersonalAddress'	=> array('string', ''),
			'PersonalCity'		=> array('string', ''),
			'PersonalState'		=> array('string', ''),
			'PersonalZip'		=> array('string', ''),
			'PersonalCountry'	=> array('string', ''),
			'PersonalWeb'		=> array('string', ''),
			'PersonalFax'		=> array('string', ''),
			'PersonalPhone'		=> array('string', ''),
			'PersonalMobile'	=> array('string', ''),

			'BusinessEmail'		=> array('string', ''),
			'BusinessCompany'	=> array('string', ''),
			'BusinessAddress'	=> array('string', ''),
			'BusinessCity'		=> array('string', ''),
			'BusinessState'		=> array('string', ''),
			'BusinessZip'		=> array('string', ''),
			'BusinessCountry'	=> array('string', ''),
			'BusinessJobTitle'	=> array('string', ''),
			'BusinessDepartment'=> array('string', ''),
			'BusinessOffice'	=> array('string', ''),
			'BusinessPhone'		=> array('string', ''),
			'BusinessFax'		=> array('string', ''),
			'BusinessWeb'		=> array('string', ''),

			'OtherEmail'		=> array('string', ''),
			'Notes'				=> array('text', ''),

			'BirthDay'			=> array('int', 0),
			'BirthMonth'		=> array('int', 0),
			'BirthYear'			=> array('int', 0),

			'ETag'				=> array('string', ''),
			'Auto'				=> array('bool', false, true),
			'Frequency'			=> array('int', 0, true),
			'DateModified'		=> array('datetime', null, true),

			'AgeScore'			=> array('nodb', 0),
		);
		parent::__construct($sModule);
	}
	
	/**
	 * @param string $sKey
	 * @param mixed $mValue
	 */
	public function __set($sKey, $mValue)
	{
		if (is_string($mValue))
		{
//	        $mValue = str_replace(array("\r","\n"), array("\n","\n"), $mValue);
		}

		parent::__set($sKey, $mValue);
	}
	
	/**
	 * Adds groups to contact. Groups are specified by names.
	 * @param array $aGroupNames List of group names.
	 */
	protected function addGroupsFromNames($aGroupNames)
	{
		$aNonExistingGroups = [];
		if (is_array($aGroupNames) && count($aGroupNames) > 0)
		{
			$oContactsDecorator = \Aurora\Modules\Contacts\Module::Decorator();
			$oApiContactsManager = $oContactsDecorator ? $oContactsDecorator->GetApiContactsManager() : null;
			if ($oApiContactsManager)
			{
				foreach($aGroupNames as $sGroupName)
				{
					$aGroups = $oApiContactsManager->getGroups($this->IdUser, ['Name' => [$sGroupName, '=']]);
					if (is_array($aGroups) && count($aGroups) > 0)
					{
						$this->addGroup($aGroups[0]->UUID);
					}
					
					// Group shouldn't be created here.
					// Very often after this populating contact will never be created.
					// It can be used only for suggestion to create.
					elseif (!empty($sGroupName))
					{
						$oGroup = new \Aurora\Modules\Contacts\Classes\Group($this->getModule());
						$oGroup->IdUser = $this->IdUser;
						$oGroup->Name = $sGroupName;
						$aNonExistingGroups[] = $oGroup;
					}
				}
			}
		}
		
		return $aNonExistingGroups;
	}

	/**
	 * Add group to contact.
	 * @param string $sGroupUUID Group UUID.
	 */
	public function addGroup($sGroupUUID)
	{
		if (!empty($sGroupUUID))
		{
			$oGroupContact = new \Aurora\Modules\Contacts\Classes\GroupContact($this->getModule());

			$oGroupContact->ContactUUID = $this->UUID;
			$oGroupContact->GroupUUID = $sGroupUUID;
			$this->GroupsContacts[] = $oGroupContact;
		}
	}
	
	/**
	 * Returns value of email that is specified as primary.
	 * @return string
	 */
	protected function getViewEmail()
	{
		switch ((int) $this->PrimaryEmail)
		{
			default:
			case \Aurora\Modules\Contacts\Enums\PrimaryEmail::Personal:
				return (string) $this->PersonalEmail;
			case \Aurora\Modules\Contacts\Enums\PrimaryEmail::Business:
				return (string) $this->BusinessEmail;
			case \Aurora\Modules\Contacts\Enums\PrimaryEmail::Other:
				return (string) $this->OtherEmail;
		}
	}
	
	/**
	 * Sets ViewEmail field.
	 */
	public function SetViewEmail()
	{
		$this->ViewEmail = $this->getViewEmail();
	}
	
	/**
	 * Inits contacts from Vcard string.
	 * @param int $iUserId User identifier.
	 * @param string $sData Vcard string.
	 * @param string $sUid Contact UUID.
	 */
	public function InitFromVCardStr($iUserId, $sData, $sUid = '')
	{
		$oUser = \Aurora\Modules\Core\Module::Decorator()->GetUserUnchecked($iUserId);
		if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
		{
			$this->IdUser = $oUser->EntityId;
			$this->IdTenant = $oUser->IdTenant;
		}
		
		if (!empty($sUid))
		{
			$this->UUID = $sUid;
		}
		
		$this->populate(
			VCard\Helper::GetContactDataFromVcard(
				\Sabre\VObject\Reader::read(
					$sData, 
					\Sabre\VObject\Reader::OPTION_IGNORE_INVALID_LINES
				)
			)
		);
	}
	
	/**
	 * Populate contact with specified data.
	 * @param array $aContact List of contact data.
	 */
	public function populate($aContact, $bCreateNonExistingGroups = false)
	{
		$aNonExistingGroups = [];
		parent::populate($aContact);

		if(!empty($aContact['UUID']))
		{
			$this->UUID = $aContact['UUID'];
		}
		else if(empty($this->UUID))
		{
			$this->UUID = \Sabre\DAV\UUIDUtil::getUUID();
		}
		
		$this->GroupsContacts = array();
		if (isset($aContact['GroupUUIDs']) && is_array($aContact['GroupUUIDs']))
		{
			foreach ($aContact['GroupUUIDs'] as $sGroupUUID)
			{
				$this->addGroup($sGroupUUID);
			}
		}
		
		if (isset($aContact['GroupNames']))
		{
			$aNonExistingGroups = $this->addGroupsFromNames($aContact['GroupNames']);
		}
		
		$this->SetViewEmail();
		if ($bCreateNonExistingGroups && is_array($aNonExistingGroups) && count($aNonExistingGroups) > 0)
		{
			$oContactsDecorator = \Aurora\Modules\Contacts\Module::Decorator();
			$oApiContactsManager = $oContactsDecorator ? $oContactsDecorator->GetApiContactsManager() : null;
			if ($oApiContactsManager)
			{
				$oContactsDecorator = \Aurora\Modules\Contacts\Module::Decorator();
				$oApiContactsManager = $oContactsDecorator ? $oContactsDecorator->GetApiContactsManager() : null;
				if ($oApiContactsManager)					
				{
					foreach($aNonExistingGroups as $oGroup)
					{
						$oApiContactsManager->createGroup($oGroup);
						$this->addGroup($oGroup->UUID);
					}
				}
			}
		}
	}
	
	/**
	 * Returns array with contact data.
	 * @return array
	 */
	public function toResponseArray()
	{
		$this->calculateETag();

		$aRes = parent::toResponseArray();
		
		$aGroupUUIDs = array();
		foreach ($this->GroupsContacts as $oGroupContact)
		{
			$aGroupUUIDs[] = $oGroupContact->GroupUUID;
		}
		$aRes['GroupUUIDs'] = $aGroupUUIDs;
		
		foreach ($this->ExtendedInformation as $sKey => $mValue)
		{
			$aRes[$sKey] = $mValue;
		}

		$aArgs = ['Contact' => $this];
		\Aurora\System\Api::GetModule('Core')->broadcastEvent(
			'Contacts::Contact::ToResponseArray',
			$aArgs,
			$aRes
		);		
		
		return $aRes;
	}

	public function calculateETag()
	{
		if (empty($this->ETag)) {
			$this->ETag = \md5(\serialize($this));
		}
	}
}
