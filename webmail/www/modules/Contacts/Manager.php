<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\Contacts;

use Aurora\Modules\Contacts\Classes\CTag;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @ignore
 */
class Manager extends \Aurora\System\Managers\AbstractManager
{
	private $oEavManager = null;

	/**
	 * @param \Aurora\System\Module\AbstractModule $oModule
	 */
	public function __construct(\Aurora\System\Module\AbstractModule $oModule = null)
	{
		parent::__construct($oModule);

		if ($oModule instanceof \Aurora\System\Module\AbstractModule)
		{
			$this->oEavManager = \Aurora\System\Managers\Eav::getInstance();
		}
	}
	
	/**
	 * 
	 * @param string $sUUID
	 * @return \Aurora\Modules\Contacts\Classes\Contact
	 */
	public function getContact($sUUID)
	{
		$oContact = $this->oEavManager->getEntity($sUUID, Classes\Contact::class);
		if ($oContact)
		{
			$oContact->GroupsContacts = $this->getGroupContacts(null, $sUUID);
		}
		return $oContact;
	}
	
	/**
	 * 
	 * @param string $sEmail
	 * @return \Aurora\Modules\Contacts\Classes\Contact
	 */
	public function getContactByEmail($iUserId, $sEmail)
	{
		$oContact = null;
		$aFilters = array(
			'$AND' => array(
				'ViewEmail' => array($sEmail, '='),
				'IdUser' => array($iUserId, '='),
			)
		);

		$oContact = (new \Aurora\System\EAV\Query())
			->select()
			->whereType(Classes\Contact::class)
			->where($aFilters)
			->orderBy(['FullName'])
			->one()
			->exec();

		if ($oContact instanceof Classes\Contact)
		{
			$oContact->GroupsContacts = $this->getGroupContacts(null, $oContact->UUID);
		}
		return $oContact;
	}
	
	/**
	 * Returns group item identified by its ID.
	 * 
	 * @param string $sUUID Group ID 
	 * 
	 * @return \Aurora\Modules\Contacts\Classes\Group
	 */
	public function getGroup($sUUID)
	{
		$mResult = false;
		$oGroup = $this->oEavManager->getEntity($sUUID, Classes\Group::class);

		if ($oGroup instanceof \Aurora\Modules\Contacts\Classes\Group)
		{
			$oGroup->GroupContacts = $this->getGroupContacts($oGroup->UUID);
			$mResult = $oGroup;
		}

		return $mResult;
	}
	
	/**
	 * Returns group item identified by its name.
	 * 
	 * @param string $sName Group name
	 * 
	 * @return \Aurora\Modules\Contacts\Classes\Group
	 */
	public function getGroupByName($sName, $iUserId)
	{
		$aFilters = [
			'$AND' => [
				'Name' => [$sName, '='],
				'IdUser' => [$iUserId, '=']
			]
		];

		return (new \Aurora\System\EAV\Query())
			->select()
			->whereType(Classes\Group::class)
			->where($aFilters)
			->one()
			->exec();
	}

	/**
	 * Updates contact information. Using this method is required to finalize changes made to the contact object. 
	 * 
	 * @param \Aurora\Modules\Contacts\Classes\Contact $oContact  Contact object to be updated 
	 * @param bool $bUpdateFromGlobal
	 * 
	 * @return bool
	 */
	public function updateContact($oContact)
	{
		$oContact->DateModified = date('Y-m-d H:i:s');
		$oContact->calculateETag();
		$res = $this->oEavManager->saveEntity($oContact);
		if ($res)
		{
			$this->updateContactGroups($oContact);
			if ($oContact->Storage === 'personal')
			{
				$this->updateCTag($oContact->IdUser, $oContact->Storage);
			}
			else
			{
				$this->updateCTag($oContact->IdTenant, $oContact->Storage);
			}
		}
		
		return $res;
	}
	
	/**
	 * 
	 * @param type $oContact
	 */
	public function updateContactGroups($oContact)
	{
		$aGroupContact = $this->getGroupContacts(null, $oContact->UUID);

		$compare_func = function($oGroupContact1, $oGroupContact2) {
			if ($oGroupContact1->GroupUUID === $oGroupContact2->GroupUUID)
			{
				return 0;
			}
			if ($oGroupContact1->GroupUUID > $oGroupContact2->GroupUUID)
			{
				return -1;
			}
			return 1;
		};

		$aGroupContactToDelete = array_udiff($aGroupContact, $oContact->GroupsContacts, $compare_func);
		$aGroupContactUUIDsToDelete = array_map(
			function($oGroupContact) { 
				return $oGroupContact->UUID; 
			}, 
			$aGroupContactToDelete
		);
		$this->oEavManager->deleteEntities($aGroupContactUUIDsToDelete);

		$aGroupContactToAdd = array_udiff($oContact->GroupsContacts, $aGroupContact, $compare_func);
		foreach ($aGroupContactToAdd as $oGroupContact)
		{
			$this->oEavManager->saveEntity($oGroupContact);
		}		
	}
	
	/**
	 * Updates group information. Using this method is required to finalize changes made to the group object. 
	 * 
	 * @param \Aurora\Modules\Contacts\Classes\Group $oGroup
	 *
	 * @return bool
	 */
	public function updateGroup($oGroup)
	{
		$res = false;
		if ($oGroup instanceof Classes\Group)
		{
			$res = $oGroup->save();
			if ($res)
			{
				$this->updateCTag($oGroup->IdUser, 'personal');
				foreach ($oGroup->GroupContacts as $oGroupContact)
				{
					$oGroupContact->GroupUUID = $oGroup->UUID;
					$res = $oGroupContact->save();
				}
			}
		}

		return $res;
	}

	/**
	 * Returns list of contacts which match the specified criteria 
	 * 
	 * @param int $iUserId User ID 
	 * @param string $sSearch Search pattern. Default value is empty string.
	 * @param string $sFirstCharacter If specified, will only return contacts with names starting from the specified character. Default value is empty string.
	 * @param string $sGroupUUID. Default value is **''**.
	 * @param int $iTenantId Group ID. Default value is null.
	 * @param bool $bAll Default value is null
	 * 
	 * @return int
	 */
	public function getContactsCount($aFilters = [], $sGroupUUID = '')
	{
		$aContactUUIDs = [];
		if (!empty($sGroupUUID))
		{
			$aGroupContact = $this->getGroupContacts($sGroupUUID);
			foreach ($aGroupContact as $oGroupContact)
			{
				$aContactUUIDs[] = $oGroupContact->ContactUUID;
			}
			
			if (empty($aContactUUIDs))
			{
				return 0;
			}
		}
		
		return (new \Aurora\System\EAV\Query())
			->whereType(Classes\Contact::class)
			->where($aFilters)
			->whereIdOrUuidIn($aContactUUIDs)
			->count()
			->exec();
	}

	/**
	 * Returns list of contacts within specified range, sorted according to specified requirements. 
	 * 
	 * @param int $iSortField Sort field. Accepted values:
	 *
	 *		\Aurora\Modules\Contacts\Enums\SortField::Name
	 *		\Aurora\Modules\Contacts\Enums\SortField::Email
	 *		\Aurora\Modules\Contacts\Enums\SortField::Frequency
	 *
	 * Default value is **\Aurora\Modules\Contacts\Enums\SortField::Email**.
	 * @param int $iSortOrder Sorting order. Accepted values:
	 *
	 *		\Aurora\System\Enums\SortOrder::ASC
	 *		\Aurora\System\Enums\SortOrder::DESC,
	 *
	 * for ascending and descending respectively. Default value is **\Aurora\System\Enums\SortOrder::ASC**.
	 * @param int $iOffset Ordinal number of the contact item the list stars with. Default value is **0**.
	 * @param int $iLimit The upper limit for total number of contacts returned. Default value is **20**.
	 * @param array $aFilters
	 * @param array $aViewAttrs
	 * 
	 * @return array|bool
	 */
	public function getContacts($iSortField = \Aurora\Modules\Contacts\Enums\SortField::Name, $iSortOrder = \Aurora\System\Enums\SortOrder::ASC,
		$iOffset = 0, $iLimit = 20, $aFilters = array(), $aViewAttrs = array())
	{
		$sSortField = 'FullName';
		$sCustomSelect = '';
		switch ($iSortField)
		{
			case \Aurora\Modules\Contacts\Enums\SortField::Email:
				$sSortField = 'ViewEmail';
				break;
			case \Aurora\Modules\Contacts\Enums\SortField::Frequency:
				$sSortField = 'AgeScore';
				$sCustomSelect = ', (attr_Frequency/CEIL(DATEDIFF(CURDATE() + INTERVAL 1 DAY, attr_DateModified)/30)) as attr_AgeScore';
				break;
		}

		return (new \Aurora\System\EAV\Query())
			->select($aViewAttrs)
			->customSelect($sCustomSelect)
			->whereType(Classes\Contact::class)
			->where($aFilters)
			->offset($iOffset)
			->limit($iLimit)
			->orderBy([$sSortField])
			->sortOrder($iSortOrder)
			->exec();
	}

		/**
	 * Returns list of contacts within specified range, sorted according to specified requirements. 
	 * 
	 * @param int $iSortField Sort field. Accepted values:
	 *
	 *		\Aurora\Modules\Contacts\Enums\SortField::Name
	 *		\Aurora\Modules\Contacts\Enums\SortField::Email
	 *		\Aurora\Modules\Contacts\Enums\SortField::Frequency
	 *
	 * Default value is **\Aurora\Modules\Contacts\Enums\SortField::Email**.
	 * @param int $iSortOrder Sorting order. Accepted values:
	 *
	 *		\Aurora\System\Enums\SortOrder::ASC
	 *		\Aurora\System\Enums\SortOrder::DESC,
	 *
	 * for ascending and descending respectively. Default value is **\Aurora\System\Enums\SortOrder::ASC**.
	 * @param int $iOffset Ordinal number of the contact item the list stars with. Default value is **0**.
	 * @param int $iLimit The upper limit for total number of contacts returned. Default value is **20**.
	 * @param array $aFilters
	 * @param array $aViewAttrs
	 * 
	 * @return array|bool
	 */
	public function getContactsAsArray($iSortField = \Aurora\Modules\Contacts\Enums\SortField::Name, $iSortOrder = \Aurora\System\Enums\SortOrder::ASC,
		$iOffset = 0, $iLimit = 20, $aFilters = array(), $aViewAttrs = array())
	{
		$sSortField = 'FullName';
		$sCustomSelect = '';
		switch ($iSortField)
		{
			case \Aurora\Modules\Contacts\Enums\SortField::Email:
				$sSortField = 'ViewEmail';
				break;
			case \Aurora\Modules\Contacts\Enums\SortField::Frequency:
				$sSortField = 'AgeScore';
				$sCustomSelect = ', (attr_Frequency/CEIL(DATEDIFF(CURDATE() + INTERVAL 1 DAY, attr_DateModified)/30)) as attr_AgeScore';
				break;
		}

		return (new \Aurora\System\EAV\Query())
			->select($aViewAttrs)
			->customSelect($sCustomSelect)
			->whereType(Classes\Contact::class)
			->where($aFilters)
			->offset($iOffset)
			->limit($iLimit)
			->orderBy([$sSortField])
			->sortOrder($iSortOrder)
			->asArray()
			->exec();
	}

	/**
	 * Returns uid list of contacts. 

	 * @param array $aFilters

	 * 
	 * @return array|bool
	 */
	public function getContactUids($aFilters = array())
	{
		return (new \Aurora\System\EAV\Query())
			->select(['UUID'])
			->whereType(Classes\Contact::class)
			->where($aFilters)
			->onlyUUIDs()
			->exec();
	}	

	/**
	 * Returns list of user's groups. 
	 * 
	 * @param int $iUserId User ID 
	 * 
	 * @return array|bool
	 */
	public function getGroups($iUserId, $aFilters = [])
	{
		$aViewAttrs = array();
		if (count($aFilters) > 0)
		{
			$aFilters['IdUser'] = array($iUserId, '=');
			$aFilters = array('$AND' => $aFilters);
		}
		else
		{
			$aFilters = array('IdUser' => array($iUserId, '='));
		}

		return (new \Aurora\System\EAV\Query())
			->select($aViewAttrs)
			->whereType(Classes\Group::class)
			->where($aFilters)
			->orderBy(['Name'])
			->exec();
	}

	/**
	 * The method is used for saving created contact to the database. 
	 * 
	 * @param \Aurora\Modules\Contacts\Classes\Contact $oContact
	 * 
	 * @return bool
	 */
	public function createContact($oContact)
	{
		$oContact->DateModified = date('Y-m-d H:i:s');
		$oContact->calculateETag();
		$res = $this->oEavManager->saveEntity($oContact);
		
		if ($res)
		{
			if ($oContact->Storage === 'personal')
			{
				$this->updateCTag($oContact->IdUser, $oContact->Storage);
			}
			else
			{
				$this->updateCTag($oContact->IdTenant, $oContact->Storage);
			}

			foreach ($oContact->GroupsContacts as $oGroupContact)
			{
				$oGroupContact->ContactUUID = $oContact->UUID;
				$oGroupContact->save();
			}
		}

		return $res;
	}

	/**
	 * The method is used for saving created group to the database. 
	 * 
	 * @param \Aurora\Modules\Contacts\Classes\Group $oGroup
	 * 
	 * @return bool
	 */
	public function createGroup($oGroup)
	{
		$res = $oGroup->save();
		
		if ($res)
		{
			foreach ($oGroup->GroupContacts as $oGroupContact)
			{
				$oGroupContact->GroupUUID = $oGroup->UUID;
				$res = $oGroupContact->save();
			}
		}

		return $res;
	}

	/**
	 * Deletes one or multiple contacts from address book.
	 * 
	 * @param array $aContactUUIDs Array of strings
	 * 
	 * @return bool
	 */
	public function deleteContacts($iIdUser, $sStorage, $aContactUUIDs)
	{
		$aEntitiesUUIDs = [];
		
		foreach ($aContactUUIDs as $sContactUUID)
		{
			$aEntitiesUUIDs[] = $sContactUUID;
			$aGroupContact = $this->getGroupContacts(null, $sContactUUID);
			foreach ($aGroupContact as $oGroupContact)
			{
				$aEntitiesUUIDs[] = $oGroupContact->UUID;
			}
		}
		
		$oUser = \Aurora\Modules\Core\Module::getInstance()->GetUserUnchecked($iIdUser);
		if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
		{
			$iIdUser = $sStorage === 'personal' ? $oUser->EntityId : $oUser->IdTenant;
		}
		$this->updateCTag($iIdUser, $sStorage);
		return $this->oEavManager->deleteEntities($aEntitiesUUIDs);
	}

	public function getGroupContacts($sGroupUUID = null, $sContactUUID = null)
	{
		$aViewAttrs = array('GroupUUID', 'ContactUUID');
		$aFilters = array();
		if (is_string($sGroupUUID) && $sGroupUUID !== '')
		{
			$aFilters = array('GroupUUID' => $sGroupUUID);
		}
		if (is_string($sContactUUID) && $sContactUUID !== '')
		{
			$aFilters = array('ContactUUID' => $sContactUUID);
		}

		return (new \Aurora\System\EAV\Query())
			->select($aViewAttrs)
			->whereType(Classes\GroupContact::class)
			->where($aFilters)
			->exec();
	}
	
	/**
	 * Deletes specific groups from address book.
	 * 
	 * @param array $aGroupUUIDs array of strings - groups identifiers.
	 * 
	 * @return bool
	 */
	public function deleteGroups($aGroupUUIDs)
	{
		$aEntitiesUUIDs = [];
		
		foreach ($aGroupUUIDs as $sGroupUUID)
		{
			$aEntitiesUUIDs[] = $sGroupUUID;
			$aGroupContact = $this->getGroupContacts($sGroupUUID);
			foreach ($aGroupContact as $oGroupContact)
			{
				$aEntitiesUUIDs[] = $oGroupContact->UUID;

				$oContact = $this->getContact($oGroupContact->ContactUUID);
				if ($oContact instanceof Classes\Contact)
				{
					if ($oContact->Storage === 'personal')
					{
						$this->updateCTag($oContact->IdUser, $oContact->Storage);
					}
					else
					{
						$this->updateCTag($oContact->IdTenant, $oContact->Storage);
					}

					$oContact->DateModified = date('Y-m-d H:i:s');
					$oContact->calculateETag();
					$oContact->saveAttributes(['DateModified', 'ETag']);
				}

			}
		}
		
		return $this->oEavManager->deleteEntities($aEntitiesUUIDs);
	}

	/**
	 * Adds one or multiple contacts to the specific group. 
	 * 
	 * @param string $sGroupUUID Group identifier to be used 
	 * @param array $aContactUUIDs Array of integers
	 * 
	 * @return bool
	 */
	public function addContactsToGroup($sGroupUUID, $aContactUUIDs)
	{
		$res = true;
		
		$aCurrGroupContact = $this->getGroupContacts($sGroupUUID);
		$aCurrContactUUIDs = array_map(
			function($oGroupContact) { 
				return $oGroupContact->ContactUUID; 
			}, 
			$aCurrGroupContact
		);
		
		foreach ($aContactUUIDs as $sContactUUID)
		{
			if (!in_array($sContactUUID, $aCurrContactUUIDs))
			{
				$oGroupContact = new Classes\GroupContact(Module::GetName());
				$oGroupContact->GroupUUID = $sGroupUUID;
				$oGroupContact->ContactUUID = $sContactUUID;
				$res = $oGroupContact->save() || $res;

				$oContact = $this->getContact($sContactUUID);
				if ($oContact instanceof Classes\Contact)
				{
					if ($oContact->Storage === 'personal')
					{
						$this->updateCTag($oContact->IdUser, $oContact->Storage);
					}
					else
					{
						$this->updateCTag($oContact->IdTenant, $oContact->Storage);
					}

					$oContact->DateModified = date('Y-m-d H:i:s');
					$oContact->calculateETag();
					$oContact->save();
				}
			}
		}
		
		return $res;
	}

	/**
	 * The method deletes one or multiple contacts from the group. 
	 * 
	 * @param string $sGroupUUID Group identifier
	 * @param array $aContactUUIDs Array of integers
	 * 
	 * @return bool
	 */
	public function removeContactsFromGroup($sGroupUUID, $aContactUUIDs)
	{
		$aCurrGroupContact = $this->getGroupContacts($sGroupUUID);
		$aIdEntitiesToDelete = array();
		
		foreach ($aCurrGroupContact as $oGroupContact)
		{
			if (in_array($oGroupContact->ContactUUID, $aContactUUIDs))
			{
				$aIdEntitiesToDelete[] = $oGroupContact->UUID;

				$oContact = $this->getContact($oGroupContact->ContactUUID);
				if ($oContact instanceof Classes\Contact)
				{
					if ($oContact->Storage === 'personal')
					{
						$this->updateCTag($oContact->IdUser, $oContact->Storage);
					}
					else
					{
						$this->updateCTag($oContact->IdTenant, $oContact->Storage);
					}

					$oContact->DateModified = date('Y-m-d H:i:s');
					$oContact->calculateETag();
					$oContact->save();
				}
			}
		}
		
		return $this->oEavManager->deleteEntities($aIdEntitiesToDelete);
	}
	public function getCTags($iUserId, $Storage)
	{
		$mResult = [];

		$aFilters = [
			'$AND' => [
				'Storage' => [$Storage, '='],
				'UserId' => [$iUserId, '=']
			]
		];

		$aEntities = (new \Aurora\System\EAV\Query())
			->whereType(Classes\CTag::class)
			->where($aFilters)
			->exec();

		if (is_array($aEntities) && count($aEntities) > 0)
		{
			$mResult = $aEntities;
		}

		return $mResult;
	}	


	public function getCTag($iUserId, $Storage)
	{
		$mResult = new Classes\CTag();
		$mResult->UserId = $iUserId;
		$mResult->Storage = $Storage;

		$aFilters = [
			'$AND' => [
				'Storage' => [$Storage, '='],
				'UserId' => [$iUserId, '=']
			]
		];

		$aEntities = (new \Aurora\System\EAV\Query())
			->whereType(Classes\CTag::class)
			->where($aFilters)
			->exec();

		if (is_array($aEntities) && count($aEntities) > 0)
		{
			$mResult = $aEntities[0];
		}

		return $mResult;
	}	

	public function updateCTag($iUserId, $Storage)
	{
		$oCTagObject = $this->getCTag($iUserId, $Storage);
		$oCTagObject->CTag = $oCTagObject->CTag + 1;

		$this->oEavManager->saveEntity($oCTagObject);
	}

	public function deleteCTagsByUserId($iUserId, $Storage)
	{
		$aCTags = $this->getCTags($iUserId, $Storage);
		foreach ($aCTags as $oCTag)
		{
			$this->oEavManager->deleteEntity($oCTag->EntityId, Classes\CTag::class);
		}
	}
}
