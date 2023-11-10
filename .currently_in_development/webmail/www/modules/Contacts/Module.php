<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\Contacts;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	public $oManager = null;

	protected $aImportExportFormats = ['csv', 'vcf'];

	public function getManager()
	{
		if ($this->oManager === null)
		{
			$this->oManager = new Manager($this);
		}

		return $this->oManager;
	}

	/**
	 * Initializes Contacts Module.
	 *
	 * @ignore
	 */
	public function init()
	{
		$this->subscribeEvent('Mail::AfterUseEmails', array($this, 'onAfterUseEmails'));
		$this->subscribeEvent('Mail::GetBodyStructureParts', array($this, 'onGetBodyStructureParts'));
		$this->subscribeEvent('Core::DeleteUser::before', array($this, 'onBeforeDeleteUser'));
		$this->subscribeEvent('Core::CreateTables::after', array($this, 'onAfterCreateTables'));

		$this->subscribeEvent('Calendar::CreateEvent', array($this, 'onCreateOrUpdateEvent'));
		$this->subscribeEvent('Calendar::UpdateEvent', array($this, 'onCreateOrUpdateEvent'));


		\Aurora\Modules\Core\Classes\User::extend(
			self::GetName(),
			[
				'ContactsPerPage' => array('int', $this->getConfig('ContactsPerPage', 20)),
			]
		);
	}

	/***** public functions *****/
	/**
	 * Returns API contacts manager.
	 * @return \CApiContactsManager
	 */
	public function GetApiContactsManager()
	{
		return $this->getManager();
	}
	/***** public functions *****/

	/***** public functions might be called with web API *****/
	/**
	 * @apiDefine Contacts Contacts Module
	 * Main Contacts module. It provides PHP and Web APIs for managing contacts.
	 */

	/**
	 * @api {post} ?/Api/ GetSettings
	 * @apiName GetSettings
	 * @apiGroup Contacts
	 * @apiDescription Obtains list of module settings for authenticated user.
	 *
	 * @apiHeader {string} [Authorization] "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Contacts} Module Module name
	 * @apiParam {string=GetSettings} Method Method name
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetSettings'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {mixed} Result.Result List of module settings in case of success, otherwise **false**.
	 * @apiSuccess {int} Result.Result.ContactsPerPage=20 Count of contacts that will be displayed on one page.
	 * @apiSuccess {string} Result.Result.ImportContactsLink=&quot;&quot; Link for learning more about CSV format.
	 * @apiSuccess {array} Result.Result.Storages='[]' List of storages wich will be shown in the interface.
	 * @apiSuccess {array} Result.Result.ImportExportFormats='[]' List of formats that can be used for import and export contacts.
	 * @apiSuccess {array} Result.Result.\Aurora\Modules\Contacts\Enums\PrimaryEmail='[]' Enumeration with primary email values.
	 * @apiSuccess {array} Result.Result.\Aurora\Modules\Contacts\Enums\PrimaryPhone='[]' Enumeration with primary phone values.
	 * @apiSuccess {array} Result.Result.\Aurora\Modules\Contacts\Enums\PrimaryAddress='[]' Enumeration with primary address values.
	 * @apiSuccess {array} Result.Result.\Aurora\Modules\Contacts\Enums\SortField='[]' Enumeration with sort field values.
	 * @apiSuccess {int} [Result.ErrorCode] Error code
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetSettings',
	 *	Result: { ContactsPerPage: 20, ImportContactsLink: '', Storages: ['personal', 'team'],
	 * ImportExportFormats: ['csv', 'vcf'], \Aurora\Modules\Contacts\Enums\PrimaryEmail: {'Personal': 0, 'Business': 1, 'Other': 2},
	 * \Aurora\Modules\Contacts\Enums\PrimaryPhone: {'Mobile': 0, 'Personal': 1, 'Business': 2},
	 * \Aurora\Modules\Contacts\Enums\PrimaryAddress: {'Personal': 0, 'Business': 1},
	 * \Aurora\Modules\Contacts\Enums\SortField: {'Name': 1, 'Email': 2, 'Frequency': 3} }
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetSettings',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */

	/**
	 * Obtains list of module settings for authenticated user.
	 * @return array
	 */
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$aStorages = self::Decorator()->GetStorages();

		$aStorageNames = \array_map(function($oStorage) {
			return $oStorage['Id'];
		}, $aStorages);

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		$ContactsPerPage = $this->getConfig('ContactsPerPage', 20);
		if ($oUser && $oUser->isNormalOrTenant() && isset($oUser->{self::GetName().'::ContactsPerPage'}))
		{
			$ContactsPerPage = $oUser->{self::GetName().'::ContactsPerPage'};
		}

		return array(
			'ContactsPerPage' => $ContactsPerPage,
			'ImportContactsLink' => $this->getConfig('ImportContactsLink', ''),
			'Storages' => $aStorageNames,
			'PrimaryEmail' => (new Enums\PrimaryEmail)->getMap(),
			'PrimaryPhone' => (new Enums\PrimaryPhone)->getMap(),
			'PrimaryAddress' => (new Enums\PrimaryAddress)->getMap(),
			'SortField' => (new Enums\SortField)->getMap(),
			'ImportExportFormats' => $this->aImportExportFormats,
			'SaveVcfServerModuleName' => \Aurora\System\Api::GetModuleManager()->ModuleExists('DavContacts') ? 'DavContacts' : ''
		);
	}

	public function IsDisplayedStorage($Storage)
	{
		return true;
	}

	//Depricated
	public function GetContactStorages()
	{
		return $this->Decorator()->GetStorages();
	}

	public function GetStorages()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$aStorages = [];
		$aStorageNames = [];
		$this->broadcastEvent('GetStorages', $aStorageNames);
		\ksort($aStorageNames);

		$iUserId = \Aurora\System\Api::getAuthenticatedUserId();

		foreach ($aStorageNames as $iIndex => $sStorageName) {
			$aStorages[] = [
				'Id' => $sStorageName,
				'CTag' => $this->Decorator()->GetCTag($iUserId, $sStorageName),
				'Display' => $this->Decorator()->IsDisplayedStorage($sStorageName),
				'Order' => $iIndex
			];
		}

		return $aStorages;
	}

	/**
	 * @api {post} ?/Api/ UpdateSettings
	 * @apiName UpdateSettings
	 * @apiGroup Contacts
	 * @apiDescription Updates module's settings - saves them to config.json file.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Contacts} Module Module name
	 * @apiParam {string=UpdateSettings} Method Method name
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **ContactsPerPage** *int* Count of contacts per page.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'UpdateSettings',
	 *	Parameters: '{ ContactsPerPage: 10 }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name
	 * @apiSuccess {string} Result.Method Method name
	 * @apiSuccess {bool} Result.Result Indicates if settings were updated successfully.
	 * @apiSuccess {int} [Result.ErrorCode] Error code
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'UpdateSettings',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'UpdateSettings',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */

	/**
	 * Updates module's settings - saves them to config.json file or to user settings in db.
	 * @param int $ContactsPerPage Count of contacts per page.
	 * @return boolean
	 */
	public function UpdateSettings($ContactsPerPage)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$bResult = false;

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oUser)
		{
			if ($oUser->isNormalOrTenant())
			{
				$oUser->{self::GetName().'::ContactsPerPage'} = $ContactsPerPage;
				return \Aurora\Modules\Core\Module::Decorator()->UpdateUserObject($oUser);
			}
			if ($oUser->Role === \Aurora\System\Enums\UserRole::SuperAdmin)
			{
				$this->setConfig('ContactsPerPage', $ContactsPerPage);
				$bResult = $this->saveModuleConfig();
			}
		}

		return $bResult;
	}

	/**
	 * @api {post} ?/Api/ Export
	 * @apiName Export
	 * @apiGroup Contacts
	 * @apiDescription Exports specified contacts to a file with specified format.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Contacts} Module Module name
	 * @apiParam {string=Export} Method Method name
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **Format** *string* File format that should be used for export.<br>
	 * &emsp; **Filters** *array* Filters for obtaining specified contacts.<br>
	 * &emsp; **GroupUUID** *string* UUID of group that should contain contacts for export.<br>
	 * &emsp; **ContactUUIDs** *array* List of UUIDs of contacts that should be exported.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'Export',
	 *	Parameters: '{ Format: "csv", Filters: [], GroupUUID: "", ContactUUIDs: [] }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name
	 * @apiSuccess {string} Result.Method Method name
	 * @apiSuccess {mixed} Result.Result Contents of CSV or VCF file in case of success, otherwise **false**.
	 * @apiSuccess {int} [Result.ErrorCode] Error code
	 *
	 * @apiSuccessExample {json} Success response example:
	 * contents of CSV or VCF file
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'Export',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */

	/**
	 * Exports specified contacts to a file with specified format.
	 * @param string $Format File format that should be used for export.
	 * @param array $Filters Filters for obtaining specified contacts.
	 * @param string $GroupUUID UUID of group that should contain contacts for export.
	 * @param array $ContactUUIDs List of UUIDs of contacts that should be exported.
	 */
	public function Export($UserId, $Storage, $Format, $Filters = [], $GroupUUID = '', $ContactUUIDs = [])
	{
		$this->CheckAccess($UserId);

		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$sOutput = '';

		if (empty($GroupUUID) && $Format === 'vcf')
		{
			$aGroups = $this->getManager()->getGroups($UserId);
			foreach ($aGroups as $oGroup)
			{
				$oVCard = new \Sabre\VObject\Component\VCard();
				\Aurora\Modules\Contacts\Classes\VCard\Helper::UpdateVCardFromGroup($oGroup, $oVCard);
				foreach ($oGroup->GroupContacts as $oGroupContact)
				{
					$oContact = \Aurora\System\Managers\Eav::getInstance()->getEntity($oGroupContact->ContactUUID, \Aurora\Modules\Contacts\Classes\Contact::class);
					if ($oContact)
					{
						$sVCardUID = null;
						if ($oContact->Storage !== 'team')
						{
							if (!empty($oContact->{'DavContacts::VCardUID'}))
							{
								$sVCardUID = $oContact->{'DavContacts::VCardUID'};
							}
						}
						else
						{
							$sVCardUID = $oContact->UUID;
						}
						if (isset($sVCardUID))
						{
							$oVCard->add('X-ADDRESSBOOKSERVER-MEMBER', 'urn:uuid:' . $sVCardUID);
						}
					}
				}

				$sOutput .= $oVCard->serialize();
			}
		}

		$aPreparedFilters = $this->prepareFiltersFromStorage($UserId, $Storage);
		$aFilters = \Aurora\System\EAV\Query::prepareWhere($aPreparedFilters);

		if (empty($ContactUUIDs) && !empty($GroupUUID))
		{
			$aGroupContact = $this->getManager()->getGroupContacts($GroupUUID);
			foreach ($aGroupContact as $oGroupContact)
			{
				$ContactUUIDs[] = $oGroupContact->ContactUUID;
			}
			if (empty($ContactUUIDs))
			{
				$ContactUUIDs = array();
			}
		}
		if (count($ContactUUIDs) > 0)
		{
			foreach ($aFilters as $sKey => $mValue)
			{
				if (stripos($sKey, '$AND'))
				{
					$aFilters[$sKey]['UUID'] = [$ContactUUIDs, 'IN'];
				}
			}
		}

		$aFilters = ['$OR' => $aFilters];

		$aContacts = $this->getManager()->getContacts(Enums\SortField::Name, \Aurora\System\Enums\SortOrder::ASC, 0, 0, $aFilters);

		if (is_array($aContacts))
		{
			switch ($Format)
			{
				case 'csv':
					$oSync = new Classes\Csv\Sync();
					$sOutput = $oSync->Export($aContacts);
					break;
				case 'vcf':
					foreach ($aContacts as $oContact)
					{
						$oContact->GroupsContacts = $this->getManager()->getGroupContacts(null, $oContact->UUID);

						$sOutput .= self::Decorator()->GetContactAsVCF($UserId, $oContact);
					}
					break;
			}
		}

		if (is_string($sOutput) && !empty($sOutput))
		{
			header('Pragma: public');
			header('Content-Type: text/csv');
			header('Content-Disposition: attachment; filename="export.' . $Format . '";');
			header('Content-Transfer-Encoding: binary');
		}

		echo $sOutput;
	}

	public function GetContactAsVCF($UserId, $Contact)
	{
		$this->CheckAccess($UserId);

		$oVCard = new \Sabre\VObject\Component\VCard();
		Classes\VCard\Helper::UpdateVCardFromContact($Contact, $oVCard);
		return $oVCard->serialize();
	}

	/**
	 * @api {post} ?/Api/ GetGroups
	 * @apiName GetGroups
	 * @apiGroup Contacts
	 * @apiDescription Returns all groups for authenticated user.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Contacts} Module Module name
	 * @apiParam {string=GetGroups} Method Method name
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetGroups'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name
	 * @apiSuccess {string} Result.Method Method name
	 * @apiSuccess {mixed} Result.Result List of groups in case of success, otherwise **false**.
	 * @apiSuccess {int} [Result.ErrorCode] Error code
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetGroups',
	 *	Result: [{ City: '', Company: '', Contacts: [], Country: '', Email: '', Fax: '', IdUser: 3,
	 * IsOrganization: false, Name: 'group_name', Phone: '', State: '', Street: '', UUID: 'uuid_value',
	 * Web: '', Zip: '' }]
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetGroups',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */

	/**
	 * Returns all groups for authenticated user.
	 * @return array
	 */
	public function GetGroups($UserId = null)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$this->CheckAccess($UserId);

		return $this->getManager()->getGroups($UserId);
	}

	/**
	 * @api {post} ?/Api/ GetGroup
	 * @apiName GetGroup
	 * @apiGroup Contacts
	 * @apiDescription Returns group with specified UUID.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Contacts} Module Module name
	 * @apiParam {string=GetGroup} Method Method name
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **$UUID** *string* UUID of group to return.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetGroup',
	 *	Parameters: '{ UUID: "group_uuid" }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name
	 * @apiSuccess {string} Result.Method Method name
	 * @apiSuccess {mixed} Result.Result Group object in case of success, otherwise **false**.
	 * @apiSuccess {string} Result.Result.City=&quot;&quot;
	 * @apiSuccess {string} Result.Result.Company=&quot;&quot;
	 * @apiSuccess {array} Result.Result.Contacts='[]'
	 * @apiSuccess {string} Result.Result.Country=&quot;&quot;
	 * @apiSuccess {string} Result.Result.Email=&quot;&quot;
	 * @apiSuccess {string} Result.Result.Fax=&quot;&quot;
	 * @apiSuccess {int} Result.Result.IdUser=0
	 * @apiSuccess {bool} Result.Result.IsOrganization=false
	 * @apiSuccess {string} Result.Result.Name=&quot;&quot;
	 * @apiSuccess {string} Result.Result.Phone=&quot;&quot;
	 * @apiSuccess {string} Result.Result.Street=&quot;&quot;
	 * @apiSuccess {string} Result.Result.UUID=&quot;&quot;
	 * @apiSuccess {string} Result.Result.Web=&quot;&quot;
	 * @apiSuccess {string} Result.Result.Zip=&quot;&quot;
	 * @apiSuccess {int} [Result.ErrorCode] Error code
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetGroup',
	 *	Result: { City: '', Company: 'group_company', Contacts: [], Country: '', Email: '', Fax: '',
	 * IdUser: 3, IsOrganization: true, Name: 'group_name', Phone:'', State:'', Street:'',
	 * UUID: 'group_uuid', Web:'', Zip: '' }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetGroup',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */

	/**
	 * Returns group with specified UUID.
	 * @param string $UUID UUID of group to return.
	 * @return \Aurora\Modules\Contacts\Classes\Group
	 */
	public function GetGroup($UserId, $UUID)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$this->CheckAccess($UserId);

		return $this->getManager()->getGroup($UUID);
	}

	/**
	 * Returns group item identified by its name.
	 * @param string $sName Group name
	 * @return \Aurora\Modules\Contacts\Classes\Group
	 */
	public function GetGroupByName($Name, $UserId = null)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (isset($UserId) && $UserId !==  \Aurora\System\Api::getAuthenticatedUserId())
		{
			\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);
		}
		else
		{
			$UserId = \Aurora\System\Api::getAuthenticatedUserId();
		}

		$this->CheckAccess($UserId);

		return $this->getManager()->getGroupByName($Name, $UserId);
	}
	/**
	 * @api {post} ?/Api/ GetContacts
	 * @apiName GetContacts
	 * @apiGroup Contacts
	 * @apiDescription Returns list of contacts for specified parameters.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Contacts} Module Module name
	 * @apiParam {string=GetContacts} Method Method name
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **Offset** *int* Offset of contacts list.<br>
	 * &emsp; **Limit** *int* Limit of result contacts list.<br>
	 * &emsp; **SortField** *int* Name of field order by.<br>
	 * &emsp; **SortOrder** *int* Sorting direction.<br>
	 * &emsp; **Storage** *string* Storage value.<br>
	 * &emsp; **Search** *string* Search string.<br>
	 * &emsp; **GroupUUID** *string* UUID of group that should contain all returned contacts.<br>
	 * &emsp; **Filters** *array* Other conditions for obtaining contacts list.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetContacts',
	 *	Parameters: '{ Offset: 0, Limit: 20, SortField: 1, SortOrder: 0, Storage: "personal",
	 *		Search: "", GroupUUID: "", Filters: [] }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name
	 * @apiSuccess {string} Result.Method Method name
	 * @apiSuccess {mixed} Result.Result Object with contacts data in case of success, otherwise **false**.
	 * @apiSuccess {int} Result.Result.ContactCount Count of contacts that are obtained with specified conditions.
	 * @apiSuccess {array} Result.Result.List List of contacts objects.
	 * @apiSuccess {int} [Result.ErrorCode] Error code
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetContacts',
	 *	Result: '{ "ContactCount": 6, "List": [{ "UUID": "contact_uuid", "IdUser": 3, "Name": "",
	 *		"Email": "contact@email.com", "Storage": "personal" }] }'
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetContacts',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */

	/**
	 * Returns list of contacts for specified parameters.
	 * @param string $Storage Storage type of contacts.
	 * @param int $Offset Offset of contacts list.
	 * @param int $Limit Limit of result contacts list.
	 * @param int $SortField Name of field order by.
	 * @param int $SortOrder Sorting direction.
	 * @param string $Search Search string.
	 * @param string $GroupUUID UUID of group that should contain all returned contacts.
	 * @param array $Filters Other conditions for obtaining contacts list.
	 * @param bool $WithGroups Indicates whether contact groups should be included in the contact list
	 * @param bool $WithoutTeamContactsDuplicates Do not show a contact from the global address book if the contact with the same email address already exists in personal address book
	 * @return array
	 */
	public function GetContacts($UserId, $Storage = '', $Offset = 0, $Limit = 20, $SortField = Enums\SortField::Name, $SortOrder = \Aurora\System\Enums\SortOrder::ASC, $Search = '', $GroupUUID = '', $Filters = array(), $WithGroups = false, $WithoutTeamContactsDuplicates = false)
	{
		// $Storage is used by subscribers to prepare filters.
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$this->CheckAccess($UserId);

		$aPreparedFilters = $this->prepareFiltersFromStorage($UserId, $Storage, $SortField);
		$aFilters = array_merge($aPreparedFilters, $Filters);
		$aFilters = \Aurora\System\EAV\Query::prepareWhere($aFilters);

		$aContactUUIDs = array();
		$aGroupUsersList = [];
		if (!empty($GroupUUID))
		{
			$aGroupContact = $this->getManager()->getGroupContacts($GroupUUID);
			foreach ($aGroupContact as $oGroupContact)
			{
				$aContactUUIDs[] = $oGroupContact->ContactUUID;
			}
			if (empty($aContactUUIDs))
			{
				$aContactUUIDs = array();
			}
			if (count($aContactUUIDs) > 0)
			{
				foreach ($aFilters as $sKey => $mValue)
				{
					if (stripos($sKey, '$AND'))
					{
						$aFilters[$sKey]['UUID'] = [$aContactUUIDs, 'IN'];
					}
				}
			}
		}

		if (!empty($Search))
		{
			$aSearchFilters = [];
			if ($SortField === Enums\SortField::Frequency)
			{
				$aSearchFilters = [
					'FullName' => ['%'.$Search.'%', 'LIKE'],
					'ViewEmail' => ['%'.$Search.'%', 'LIKE'],
					'BusinessCompany' => ['%'.$Search.'%', 'LIKE']
				];
			}
			else
			{
				$aSearchFilters = [
					'FullName' => ['%'.$Search.'%', 'LIKE'],
					'ViewEmail' => ['%'.$Search.'%', 'LIKE'],
					'PersonalEmail' => ['%'.$Search.'%', 'LIKE'],
					'BusinessEmail' => ['%'.$Search.'%', 'LIKE'],
					'OtherEmail' => ['%'.$Search.'%', 'LIKE'],
					'BusinessCompany' => ['%'.$Search.'%', 'LIKE']
				];
			}

			if (count($aFilters) > 0)
			{
				$aFilters = [
					'$AND' => [
						'1$OR' => $aFilters,
						'2$OR' => $aSearchFilters
					]
				];
			}
			else
			{
				$aFilters = [
					'$OR' => $aSearchFilters
				];
			}
			if ($WithGroups)
			{
				$oUser = \Aurora\System\Api::getAuthenticatedUser();
				if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
				{
					$aGroups = $this->getManager()->getGroups($oUser->EntityId, ['Name' => ['%' . $Search . '%', 'LIKE']]);
					if ($aGroups)
					{
						foreach ($aGroups as $oGroup)
						{
							$aGroupContactsEmails = [];
							$aGroupContacts = $this->getManager()->getGroupContacts($oGroup->UUID);

							foreach ($aGroupContacts as $oGroupContact)
							{
								$oContact = $this->getManager()->getContact($oGroupContact->ContactUUID);
								if ($oContact)
								{
									$aGroupContactsEmails[] = $oContact->FullName ? "\"{$oContact->FullName}\" <{$oContact->ViewEmail}>" : $oContact->ViewEmail;
								}
							}
							$aGroupUsersList[] = [
								'UUID' => $oGroup->UUID,
								'IdUser' => $oGroup->IdUser,
								'FullName' => $oGroup->Name,
								'FirstName' => '',
								'LastName' => '',
								'ViewEmail' => implode(', ', $aGroupContactsEmails),
								'Storage' => '',
								'Frequency' => 0,
								'DateModified' => '',
								'IsGroup' => true,
							];
						}
					}
				}
			}
		}
		elseif (count($aFilters) > 1)
		{
			$aFilters = ['$OR' => $aFilters];
		}

		if ($SortField === Enums\SortField::Frequency)
		{
			$aFilters['Frequency'] = ['-1', '!='];
			$aFilters = [
				'$AND' => $aFilters
			];
		}

		$aContacts = array();
		$iCount = 0;
		if ((!empty($GroupUUID) && count($aContactUUIDs) > 0) || empty($GroupUUID))
		{
			$iCount = $this->getManager()->getContactsCount($aFilters);
			$aContacts = $this->getManager()->getContactsAsArray($SortField, $SortOrder, $Offset, $Limit, $aFilters);
		}
		if ($Storage === 'all' && $WithoutTeamContactsDuplicates)
		{
			$aPersonalContactEmails = array_map(function($oContact) {
				if ($oContact->Storage === 'personal')
				{
					return $oContact->ViewEmail;
				}
			}, $aContacts);
			$aUniquePersonalContactEmails = array_unique(array_diff($aPersonalContactEmails, [null]));
			foreach ($aContacts as $key => $aContact)
			{
				if ($oContact->Storage === 'team' && in_array($aContact['ViewEmail'], $aUniquePersonalContactEmails))
				{
					unset($aContacts[$key]);
				}
			}
		}
		$aList = array();
		if (is_array($aContacts))
		{
			foreach ($aContacts as $aContact)
			{
				$aList[] = array(
					'UUID' => $aContact['UUID'],
					'IdUser' => $aContact['IdUser'],
					'FullName' => $aContact['FullName'],
					'FirstName' => isset($aContact['FirstName']) ? $aContact['FirstName'] : '',
					'LastName' => isset($aContact['LastName']) ? $aContact['LastName'] : '',
					'ViewEmail' => $aContact['ViewEmail'],
					'Storage' => $aContact['Storage'],
					'Frequency' => $aContact['Frequency'],
					'DateModified' => isset($aContact['DateModified']) ? $aContact['DateModified'] : 0,
					'ETag' => isset($aContact['ETag']) ? $aContact['ETag'] : '',
					'AgeScore' => isset($aContact['AgeScore']) ? (float) $aContact['AgeScore'] : 0
				);
			}
		}

		$aList = array_merge($aList, $aGroupUsersList);
		return array(
			'ContactCount' => $iCount,
			'List' => \Aurora\System\Managers\Response::GetResponseObject($aList)
		);
	}

	public function GetContactSuggestions($UserId,  $Storage, $Limit = 20, $SortField = Enums\SortField::Name, $SortOrder = \Aurora\System\Enums\SortOrder::ASC, $Search = '', $WithGroups, $WithoutTeamContactsDuplicates = false)
	{
		// $Storage is used by subscribers to prepare filters.
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$this->CheckAccess($UserId);
		$aResult = array(
			'ContactCount' => 0,
			'List' => []
		);
		$aArgs = [
			'UserId' => $UserId,
			'Storage' => $Storage,
 			'Limit' => $Limit,
			'SortField' => $SortField,
			'SortOrder' => $SortOrder,
			'Search' => $Search
		];
		$aContacts = [];
		$this->broadcastEvent('GetContactSuggestions', $aArgs, $aContacts);
		$aResultList = [];
		foreach ($aContacts as $sStorage => $aStorageContacts)
		{
			$aResultList = array_merge(
				$aResultList,
				$aStorageContacts['List']
			);
		}

		$aPersonalContactEmails = [];
		if (isset($aContacts['personal'])) {
			$aPersonalContactEmails = array_map(function($aContact) {
				return $aContact['ViewEmail'];
			}, $aContacts['personal']['List']);
		}

		$aUniquePersonalContactEmails = array_unique(array_diff($aPersonalContactEmails, [null]));
		foreach ($aResultList as $key => $aContact)
		{
			if ($aContact['Storage'] === 'team' && in_array($aContact['ViewEmail'], $aUniquePersonalContactEmails))
			{
				unset($aResultList[$key]);
			}
		}

		usort(
			$aResultList,
			function($a, $b){
				if ($a['AgeScore'] == $b['AgeScore']) 
				{
					return 0;
				}
				return ($a['AgeScore'] > $b['AgeScore']) ? +1 : -1;
			}
		);

		$aGroupUsersList = [];
		if ($WithGroups)
		{
			$oUser = \Aurora\System\Api::getAuthenticatedUser();
			if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
			{
				$aGroups = $this->getManager()->getGroups($oUser->EntityId, ['Name' => ['%' . $Search . '%', 'LIKE']]);
				if ($aGroups)
				{
					foreach ($aGroups as $oGroup)
					{
						$aGroupContactsEmails = [];
						$aGroupContacts = $this->getManager()->getGroupContacts($oGroup->UUID);

						foreach ($aGroupContacts as $oGroupContact)
						{
							$oContact = $this->getManager()->getContact($oGroupContact->ContactUUID);
							if ($oContact)
							{
								$aGroupContactsEmails[] = $oContact->FullName ? "\"{$oContact->FullName}\" <{$oContact->ViewEmail}>" : $oContact->ViewEmail;
							}
						}
						$aGroupUsersList[] = [
							'UUID' => $oGroup->UUID,
							'IdUser' => $oGroup->IdUser,
							'FullName' => $oGroup->Name,
							'FirstName' => '',
							'LastName' => '',
							'ViewEmail' => implode(', ', $aGroupContactsEmails),
							'Storage' => '',
							'Frequency' => 0,
							'DateModified' => '',
							'IsGroup' => true,
						];
					}
				}
			}
		}

		$aResultList = array_slice($aResultList, 0, $Limit);
		$aResultList = array_merge($aResultList, $aGroupUsersList);
		$aResult['List'] = $aResultList;
		$aResult['ContactCount'] = count($aResult['List']);
		return $aResult;
	}

	/*
		This method used as trigger for subscibers. Check these modules: PersonalContacts, SharedContacts, TeamContacts
	*/

	public function CheckAccessToObject($User, $Contact)
	{
		return true;
	}

	public function CheckAccess(&$UserId)
	{
		$bAccessDenied = true;

		$oAuthenticatedUser = \Aurora\System\Api::getAuthenticatedUser();

		if ($UserId === null)
		{
			$iUserId = $oAuthenticatedUser->EntityId;
		}
		else
		{
			$iUserId = (int) $UserId;

			$iUserRole = $oAuthenticatedUser instanceof \Aurora\Modules\Core\Classes\User ? $oAuthenticatedUser->Role : \Aurora\System\Enums\UserRole::Anonymous;
			switch ($iUserRole)
			{
				case (\Aurora\System\Enums\UserRole::SuperAdmin):
					// everything is allowed for SuperAdmin
					$UserId = $iUserId;
					$bAccessDenied = false;
					break;
				case (\Aurora\System\Enums\UserRole::TenantAdmin):
					// everything is allowed for TenantAdmin
					$oUser = \Aurora\Modules\Core\Module::getInstance()->GetUser($iUserId);
					if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
					{
						if ($oAuthenticatedUser->IdTenant === $oUser->IdTenant)
						{
							$UserId = $iUserId;
							$bAccessDenied = false;
						}
					}
					break;
				case (\Aurora\System\Enums\UserRole::NormalUser):
					// User identifier shoud be checked
					if ($iUserId === $oAuthenticatedUser->EntityId)
					{
						$UserId = $iUserId;
						$bAccessDenied = false;
					}
					break;
				case (\Aurora\System\Enums\UserRole::Customer):
				case (\Aurora\System\Enums\UserRole::Anonymous):
					// everything is forbidden for Customer and Anonymous users
					break;
			}
			if ($bAccessDenied)
			{
				throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
			}
		}
	}

	/**
	 * @api {post} ?/Api/ GetContact
	 * @apiName GetContact
	 * @apiGroup Contacts
	 * @apiDescription Returns contact with specified UUID.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Contacts} Module Module name
	 * @apiParam {string=GetContact} Method Method name
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **UUID** *string* UUID of contact to return.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetContact',
	 *	Parameters: '{ UUID: "contact_uuid" }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name
	 * @apiSuccess {string} Result.Method Method name
	 * @apiSuccess {mixed} Result.Result Object with contact data in case of success, otherwise **false**.
	 * @apiSuccess {int} [Result.ErrorCode] Error code
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetContact',
	 *	Result: '{ "IdUser": 3, "UUID": "group_uuid", "Storage": "personal", "FullName": "", "PrimaryEmail": 0,
	 * "PrimaryPhone": 1, "PrimaryAddress": 0, "FirstName": "", "LastName": "", "NickName": "", "Skype": "",
	 * "Facebook": "", "PersonalEmail": "contact@email.com", "PersonalAddress": "", "PersonalCity": "",
	 * "PersonalState": "", "PersonalZip": "", "PersonalCountry": "", "PersonalWeb": "", "PersonalFax": "",
	 * "PersonalPhone": "", "PersonalMobile": "123-234-234", "BusinessEmail": "", "BusinessCompany": "",
	 * "BusinessAddress": "", "BusinessCity": "", "BusinessState": "", "BusinessZip": "", "BusinessCountry": "",
	 * "BusinessJobTitle": "", "BusinessDepartment": "", "BusinessOffice": "", "BusinessPhone": "",
	 * "BusinessFax": "", "BusinessWeb": "", "OtherEmail": "", "Notes": "", "BirthDay": 0, "BirthMonth": 0,
	 * "BirthYear": 0, "ETag": "", "GroupUUIDs": ["group1_uuid", "group2_uuid"] }'
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetContact',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */

	/**
	 * Returns contact with specified UUID.
	 * @param string $UUID UUID of contact to return.
	 * @return \Aurora\Modules\Contacts\Classes\Contact
	 */
	public function GetContact($UUID, $UserId = null)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$this->CheckAccess($UserId);
		$oUser = \Aurora\Modules\Core\Module::getInstance()->GetUserUnchecked($UserId);

		$mResult = false;

		if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
		{
			$oContact = $this->getManager()->getContact($UUID);
			if (self::Decorator()->CheckAccessToObject($oUser, $oContact))
			{
				$mResult = $oContact;
			}
		}

		return $mResult;
	}

	/**
	 * @api {post} ?/Api/ GetContactsByEmails
	 * @apiName GetContactsByEmails
	 * @apiGroup Contacts
	 * @apiDescription Returns list of contacts with specified emails.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Contacts} Module Module name
	 * @apiParam {string=GetContactsByEmails} Method Method name
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **Emails** *array* List of emails of contacts to return.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetContactsByEmails',
	 *	Parameters: '{ Emails: ["contact@email.com"] }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name
	 * @apiSuccess {string} Result.Method Method name
	 * @apiSuccess {mixed} Result.Result List of contacts in case of success, otherwise **false**.
	 * @apiSuccess {int} [Result.ErrorCode] Error code
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetContactsByEmails',
	 *	Result: [{ "IdUser": 3, "UUID": "group_uuid", "Storage": "personal", "FullName": "", "PrimaryEmail": 0,
	 * "PrimaryPhone": 1, "PrimaryAddress": 0, "FirstName": "", "LastName": "", "NickName": "", "Skype": "",
	 * "Facebook": "", "PersonalEmail": "contact@email.com", "PersonalAddress": "", "PersonalCity": "",
	 * "PersonalState": "", "PersonalZip": "", "PersonalCountry": "", "PersonalWeb": "", "PersonalFax": "",
	 * "PersonalPhone": "", "PersonalMobile": "123-234-234", "BusinessEmail": "", "BusinessCompany": "",
	 * "BusinessAddress": "", "BusinessCity": "", "BusinessState": "", "BusinessZip": "", "BusinessCountry": "",
	 * "BusinessJobTitle": "", "BusinessDepartment": "", "BusinessOffice": "", "BusinessPhone": "",
	 * "BusinessFax": "", "BusinessWeb": "", "OtherEmail": "", "Notes": "", "BirthDay": 0, "BirthMonth": 0,
	 * "BirthYear": 0, "ETag": "", "GroupUUIDs": ["group1_uuid", "group2_uuid"] }]
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'GetContactsByEmails',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */

	/**
	 * Returns list of contacts with specified emails.
	 * @param string $Storage storage of contacts.
	 * @param array $Emails List of emails of contacts to return.
	 * @return array
	 */
	public function GetContactsByEmails($UserId, $Storage, $Emails, $Filters = array())
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$this->CheckAccess($UserId);

		$aPreparedFilters = $this->prepareFiltersFromStorage($UserId, $Storage);
		$aFilters = array_merge($aPreparedFilters, $Filters);
		$aFilters = \Aurora\System\EAV\Query::prepareWhere($aFilters);

		if (!empty($aFilters))
		{
			$aFilters = [
				'$AND' => [
					'$OR' => $aFilters,
					'ViewEmail' => [$Emails, 'IN']
				]
			];
			if ($Storage !== \Aurora\Modules\Contacts\Enums\StorageType::All)
			{
				$aFilters['$AND']['Storage'] = $Storage;
			}
		}
		else
		{
			if ($Storage !== \Aurora\Modules\Contacts\Enums\StorageType::All)
			{
				$aFilters = [
					'$AND' => [
						'Storage' => $Storage,
						'ViewEmail' => [$Emails, 'IN']
					]
				];
			}
			else
			{
				$aFilters = [
					'ViewEmail' => [$Emails, 'IN']
				];
			}
		}

		$aContacts = $this->getManager()->getContacts(Enums\SortField::Name, \Aurora\System\Enums\SortOrder::ASC, 0, 0, $aFilters);

		return $aContacts;
	}

	/**
	 * Returns list of contacts with specified uids.
	 * @param int $UserId
	 * @param array $Uids List of uids of contacts to return.
	 * @return array
	 */
	public function GetContactsByUids($UserId, $Uids)
	{
		$aResult = [];
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$this->CheckAccess($UserId);
		$oUser = \Aurora\Modules\Core\Module::getInstance()->GetUserUnchecked($UserId);

		if (is_array($Uids) && count($Uids) > 0)
		{
			$aContacts = $this->getManager()->getContacts(
				Enums\SortField::Name,
				\Aurora\System\Enums\SortOrder::ASC,
				0,
				0,
				['UUID' => [$Uids, 'IN']]
			);

			foreach ($aContacts as $oContact)
			{
				if ($oContact instanceof \Aurora\Modules\Contacts\Classes\Contact)
				{
					if (self::Decorator()->CheckAccessToObject($oUser, $oContact))
					{
						$oContact->GroupsContacts = $this->getManager()->getGroupContacts(null, $oContact->UUID);
						$oContact->Storage = ($oContact->Auto) ? 'collected' : $oContact->Storage;
						$aResult[] = $oContact;
					}
				}
			}
		}
		else
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		return $aResult;
	}

	/**
	 * Returns list of contacts with specified emails.
	 * @param string $Storage storage of contacts.
	 * @param array $Uids List of emails of contacts to return.
	 * @return array
	 */
	public function GetContactsInfo($Storage, $UserId = null, $Filters = [])
	{
		$aResult = [
			'CTag' => $this->GetCTag($UserId, $Storage),
			'Info' => array()
		];
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$this->CheckAccess($UserId);

		$aPreparedFilters = $this->prepareFiltersFromStorage($UserId, $Storage);
		$aFilters = array_merge($aPreparedFilters, $Filters);
		$aFilters = \Aurora\System\EAV\Query::prepareWhere($aFilters);

		// if (count($aFilters) > 1)
		// {
		// 	$aFilters = ['$OR' => $aFilters];
		// }
		$aContacts = (new \Aurora\System\EAV\Query())
			->select(['UUID', 'ETag', 'Storage', 'Auto'])
			->whereType(Classes\Contact::class)
			->where($aFilters)
			->exec();

		foreach ($aContacts as $oContact)
		{
			$aResult['Info'][] = [
				'UUID' => $oContact->UUID,
				'ETag' => $oContact->ETag,
				'Storage' => $oContact->Auto ? 'collected' : $oContact->Storage
			];
		}

		return $aResult;
	}

	/**
	 * @api {post} ?/Api/ CreateContact
	 * @apiName CreateContact
	 * @apiGroup Contacts
	 * @apiDescription Creates contact with specified parameters.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Contacts} Module Module name
	 * @apiParam {string=CreateContact} Method Method name
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **Contact** *object* Parameters of contact to create.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'CreateContact',
	 *	Parameters: '{ "Contact": { "UUID": "", "PrimaryEmail": 0, "PrimaryPhone": 0, "PrimaryAddress": 0,
	 * "FullName": "second", "FirstName": "", "LastName": "", "NickName": "", "Storage": "personal",
	 * "Skype": "", "Facebook": "", "PersonalEmail": "contact2@email.com", "PersonalAddress": "",
	 * "PersonalCity": "", "PersonalState": "", "PersonalZip": "", "PersonalCountry": "", "PersonalWeb": "",
	 * "PersonalFax": "", "PersonalPhone": "", "PersonalMobile": "", "BusinessEmail": "", "BusinessCompany": "",
	 * "BusinessJobTitle": "", "BusinessDepartment": "", "BusinessOffice": "", "BusinessAddress": "",
	 * "BusinessCity": "", "BusinessState": "", "BusinessZip": "", "BusinessCountry": "", "BusinessFax": "",
	 * "BusinessPhone": "", "BusinessWeb": "", "OtherEmail": "", "Notes": "", "ETag": "", "BirthDay": 0,
	 * "BirthMonth": 0, "BirthYear": 0, "GroupUUIDs": [] } }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name
	 * @apiSuccess {string} Result.Method Method name
	 * @apiSuccess {mixed} Result.Result New contact UUID in case of success, otherwise **false**.
	 * @apiSuccess {int} [Result.ErrorCode] Error code
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'CreateContact',
	 *	Result: 'new_contact_uuid'
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'CreateContact',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */

	/**
	 * Creates contact with specified parameters.
	 * @param array $Contact Parameters of contact to create.
	 * @param int $UserId Identifier of user that should own a new contact.
	 * @return bool|string
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function CreateContact($Contact, $UserId = null)
	{
		$this->CheckAccess($UserId);

		$oUser = \Aurora\Modules\Core\Module::getInstance()->GetUserUnchecked($UserId);

		$mResult = false;

		if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
		{
			$oContact = new Classes\Contact(self::GetName());
			$oContact->IdUser = $oUser->EntityId;
			$oContact->IdTenant = $oUser->IdTenant;
			$oContact->populate($Contact, true);

			$oContact->Frequency = $this->getAutocreatedContactFrequencyAndDeleteIt($oUser->EntityId, $oContact->ViewEmail);
			if ($this->getManager()->createContact($oContact))
			{
				$mResult = ['UUID' => $oContact->UUID, 'ETag' => $oContact->ETag];
			}
		}

		return $mResult;
	}

	/**
	 * Obtains autocreated contact frequency if user have already created it.
	 * Removes autocreated contact.
	 * @param int $UserId User identifier.
	 * @param string $sViewEmail View email of contact to create
	 */
	private function getAutocreatedContactFrequencyAndDeleteIt($UserId, $sViewEmail)
	{
		$this->CheckAccess($UserId);

		$iFrequency = 0;
		$sStorage = 'personal';
		$aFilters = [
			'$AND' => [
				'ViewEmail' => [$sViewEmail, '='],
				'IdUser' => [$UserId, '='],
				'Auto' => [true, '='],
				'Storage' => $sStorage
			]
		];
		$oAutocreatedContacts = $this->getManager()->getContacts(
			\Aurora\Modules\Contacts\Enums\SortField::Name,
			\Aurora\System\Enums\SortOrder::ASC,
			0,
			1,
			$aFilters
		);
		if (is_array($oAutocreatedContacts) && isset($oAutocreatedContacts[0]))
		{
			$iFrequency = $oAutocreatedContacts[0]->Frequency;
			$this->getManager()->deleteContacts($UserId, $sStorage, [$oAutocreatedContacts[0]->UUID]);
		}
		return $iFrequency;
	}

	/**
	 * @api {post} ?/Api/ UpdateContact
	 * @apiName UpdateContact
	 * @apiGroup Contacts
	 * @apiDescription Updates contact with specified parameters.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Contacts} Module Module name
	 * @apiParam {string=UpdateContact} Method Method name
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **Contact** *array* Parameters of contact to update.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'UpdateContact',
	 *	Parameters: '{ "Contact": { "UUID": "contact2_uuid", "PrimaryEmail": 0, "PrimaryPhone": 0,
	 * "PrimaryAddress": 0, "FullName": "contact2", "FirstName": "", "LastName": "", "NickName": "",
	 * "Storage": "personal", "Skype": "", "Facebook": "", "PersonalEmail": "contact2@email.com",
	 * "PersonalAddress": "", "PersonalCity": "", "PersonalState": "", "PersonalZip": "", "PersonalCountry": "",
	 * "PersonalWeb": "", "PersonalFax": "", "PersonalPhone": "", "PersonalMobile": "", "BusinessEmail": "",
	 * "BusinessCompany": "", "BusinessJobTitle": "", "BusinessDepartment": "", "BusinessOffice": "",
	 * "BusinessAddress": "", "BusinessCity": "", "BusinessState": "", "BusinessZip": "", "BusinessCountry": "",
	 * "BusinessFax": "", "BusinessPhone": "", "BusinessWeb": "", "OtherEmail": "", "Notes": "", "ETag": "",
	 * "BirthDay": 0, "BirthMonth": 0, "BirthYear": 0, "GroupUUIDs": [] } }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name
	 * @apiSuccess {string} Result.Method Method name
	 * @apiSuccess {bool} Result.Result Indicates if contact was updated successfully.
	 * @apiSuccess {int} [Result.ErrorCode] Error code
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'UpdateContact',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'UpdateContact',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */

	/**
	 * Updates contact with specified parameters.
	 * @param array $Contact Parameters of contact to update.
	 * @return bool
	 */
	public function UpdateContact($UserId, $Contact)
	{
		$this->CheckAccess($UserId);

		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$oContact = $this->getManager()->getContact($Contact['UUID']);
		if ($oContact)
		{
			$oContact->populate($Contact, true);
			if ($this->UpdateContactObject($oContact))
			{
				return [
					'UUID' => $oContact->UUID,
					'ETag' => $oContact->ETag
				];
			}
			else
			{
				return false;
			}
		}

		return false;
	}

	public function UpdateContactObject($Contact)
	{
		// $iUserId = $Contact->IdUser;
		// $this->CheckAccess($iUserId);

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		$this->CheckAccessToObject($oUser, $Contact);

		return $this->getManager()->updateContact($Contact);
	}


	/**
	 * @api {post} ?/Api/ DeleteContacts
	 * @apiName DeleteContacts
	 * @apiGroup Contacts
	 * @apiDescription Deletes contacts with specified UUIDs.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Contacts} Module Module name
	 * @apiParam {string=DeleteContacts} Method Method name
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **UUIDs** *array* Array of strings - UUIDs of contacts to delete.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'DeleteContacts',
	 *	Parameters: '{ UUIDs: ["uuid1", "uuid"] }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name
	 * @apiSuccess {string} Result.Method Method name
	 * @apiSuccess {bool} Result.Result Indicates if contacts were deleted successfully.
	 * @apiSuccess {int} [Result.ErrorCode] Error code
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'DeleteContacts',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'DeleteContacts',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */

	/**
	 * Deletes contacts with specified UUIDs.
	 * @param array $UUIDs Array of strings - UUIDs of contacts to delete.
	 * @return bool
	 */
	public function DeleteContacts($UserId, $Storage, $UUIDs)
	{
		$this->CheckAccess($UserId);

		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		return $this->getManager()->deleteContacts($UserId, $Storage, $UUIDs);
	}

	/**
	 * @api {post} ?/Api/ CreateGroup
	 * @apiName CreateGroup
	 * @apiGroup Contacts
	 * @apiDescription Creates group with specified parameters.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Contacts} Module Module name
	 * @apiParam {string=CreateGroup} Method Method name
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **Group** *object* Parameters of group to create.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'CreateGroup',
	 *	Parameters: '{ "Group": { "UUID": "", "Name": "new_group_name", "IsOrganization": "0", "Email": "",
	 * "Country": "", "City": "", "Company": "", "Fax": "", "Phone": "", "State": "", "Street": "",
	 * "Web": "", "Zip": "", "Contacts": [] } }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name
	 * @apiSuccess {string} Result.Method Method name
	 * @apiSuccess {mixed} Result.Result New group UUID in case of success, otherwise **false**.
	 * @apiSuccess {int} [Result.ErrorCode] Error code
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'CreateGroup',
	 *	Result: 'new_group_uuid'
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'CreateGroup',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */

	/**
	 * Creates group with specified parameters.
	 * @param array $Group Parameters of group to create.
	 * @return string|bool
	 */
	public function CreateGroup($Group, $UserId = null)
	{
		$this->CheckAccess($UserId);

		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (is_array($Group))
		{
			\Aurora\System\Validator::validate($Group, [
				'Name'	=>	'required'
			]);

			$oGroup = new Classes\Group(self::GetName());
			$oGroup->IdUser = (int) $UserId;

			$oGroup->populate($Group);

			$this->getManager()->createGroup($oGroup);
			return $oGroup ? $oGroup->UUID : false;
		}
		else
		{
			return false;
		}
	}

	/**
	 * @api {post} ?/Api/ UpdateGroup
	 * @apiName UpdateGroup
	 * @apiGroup Contacts
	 * @apiDescription Updates group with specified parameters.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Contacts} Module Module name
	 * @apiParam {string=UpdateGroup} Method Method name
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **Group** *object* Parameters of group to update.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'UpdateGroup',
	 *	Parameters: '{ "Group": { "UUID": "group_uuid", "Name": "group_name", "IsOrganization": "0",
	 * "Email": "", "Country": "", "City": "", "Company": "", "Fax": "", "Phone": "", "State": "",
	 * "Street": "", "Web": "", "Zip": "", "Contacts": [] } }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name
	 * @apiSuccess {string} Result.Method Method name
	 * @apiSuccess {bool} Result.Result Indicates if group was updated successfully.
	 * @apiSuccess {int} [Result.ErrorCode] Error code
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'UpdateGroup',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'UpdateGroup',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */

	/**
	 * Updates group with specified parameters.
	 * @param array $Group Parameters of group to update.
	 * @return boolean
	 */
	public function UpdateGroup($UserId, $Group)
	{
		$this->CheckAccess($UserId);

		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$oGroup = $this->getManager()->getGroup($Group['UUID']);
		if ($oGroup)
		{
			if (isset($Group['Contacts']) && is_array($Group['Contacts']))
			{
				$aGroupContactUUIDs = [];
				foreach ($oGroup->GroupContacts as $oGroupContact)
				{
					$aGroupContactUUIDs[] = $oGroupContact->UUID;
				}
				\Aurora\System\Managers\Eav::getInstance()->deleteEntities($aGroupContactUUIDs);
			}

			$oGroup->populate($Group);
			return $this->getManager()->updateGroup($oGroup);
		}

		return false;
	}

	/**
	 * @api {post} ?/Api/ DeleteGroup
	 * @apiName DeleteGroup
	 * @apiGroup Contacts
	 * @apiDescription Deletes group with specified UUID.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Contacts} Module Module name
	 * @apiParam {string=DeleteGroup} Method Method name
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **UUID** *string* UUID of group to delete.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'DeleteGroup',
	 *	Parameters: '{ UUID: "group_uuid" }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name
	 * @apiSuccess {string} Result.Method Method name
	 * @apiSuccess {bool} Result.Result Indicates if group was deleted successfully.
	 * @apiSuccess {int} [Result.ErrorCode] Error code
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'DeleteGroup',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'DeleteGroup',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */

	/**
	 * Deletes group with specified UUID.
	 * @param string $UUID UUID of group to delete.
	 * @return bool
	 */
	public function DeleteGroup($UserId, $UUID)
	{
		$this->CheckAccess($UserId);

		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		$this->getManager()->updateCTag($UserId, 'personal');
		return $this->getManager()->deleteGroups([$UUID]);
	}

	/**
	 * @api {post} ?/Api/ AddContactsToGroup
	 * @apiName AddContactsToGroup
	 * @apiGroup Contacts
	 * @apiDescription Adds specified contacts to specified group.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Contacts} Module Module name
	 * @apiParam {string=AddContactsToGroup} Method Method name
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **GroupUUID** *string* UUID of group.<br>
	 * &emsp; **ContactUUIDs** *array* Array of strings - UUIDs of contacts to add to group.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'AddContactsToGroup',
	 *	Parameters: '{ GroupUUID: "group_uuid", ContactUUIDs: ["contact1_uuid", "contact2_uuid"] }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name
	 * @apiSuccess {string} Result.Method Method name
	 * @apiSuccess {bool} Result.Result Indicates if contacts were successfully added to group.
	 * @apiSuccess {int} [Result.ErrorCode] Error code
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'AddContactsToGroup',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'AddContactsToGroup',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */

	/**
	 * Adds specified contacts to specified group.
	 * @param string $GroupUUID UUID of group.
	 * @param array $ContactUUIDs Array of strings - UUIDs of contacts to add to group.
	 * @return boolean
	 */
	public function AddContactsToGroup($UserId, $GroupUUID, $ContactUUIDs)
	{
		$this->CheckAccess($UserId);

		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (is_array($ContactUUIDs) && !empty($ContactUUIDs))
		{
			return $this->getManager()->addContactsToGroup($GroupUUID, $ContactUUIDs);
		}

		return true;
	}

	/**
	 * @api {post} ?/Api/ RemoveContactsFromGroup
	 * @apiName RemoveContactsFromGroup
	 * @apiGroup Contacts
	 * @apiDescription Removes specified contacts from specified group.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Contacts} Module Module name
	 * @apiParam {string=RemoveContactsFromGroup} Method Method name
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **GroupUUID** *string* UUID of group.<br>
	 * &emsp; **ContactUUIDs** *array* Array of strings - UUIDs of contacts to remove from group.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'RemoveContactsFromGroup',
	 *	Parameters: '{ GroupUUID: "group_uuid", ContactUUIDs: ["contact1_uuid", "contact2_uuid"] }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name
	 * @apiSuccess {string} Result.Method Method name
	 * @apiSuccess {bool} Result.Result Indicates if contacts were successfully removed from group.
	 * @apiSuccess {int} [Result.ErrorCode] Error code
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'RemoveContactsFromGroup',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'RemoveContactsFromGroup',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */

	/**
	 * Removes specified contacts from specified group.
	 * @param string $GroupUUID UUID of group.
	 * @param array $ContactUUIDs Array of strings - UUIDs of contacts to remove from group.
	 * @return boolean
	 */
	public function RemoveContactsFromGroup($UserId, $GroupUUID, $ContactUUIDs)
	{
		$this->CheckAccess($UserId);

		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (is_array($ContactUUIDs) && !empty($ContactUUIDs))
		{
			return $this->getManager()->removeContactsFromGroup($GroupUUID, $ContactUUIDs);
		}

		return true;
	}

	/**
	 * @api {post} ?/Api/ Import
	 * @apiName Import
	 * @apiGroup Contacts
	 * @apiDescription Imports contacts from file with specified format.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Contacts} Module Module name
	 * @apiParam {string=Import} Method Method name
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **UploadData** *array* Array of uploaded file data.<br>
	 * &emsp; **Storage** *string* Storage name.<br>
	 * &emsp; **GroupUUID** *array* Group UUID.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'Import',
	 *	Parameters: '{ "UploadData": { "tmp_name": "tmp_name_value", "name": "name_value" },
	 *		"Storage": "personal", "GroupUUID": "" }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name
	 * @apiSuccess {string} Result.Method Method name
	 * @apiSuccess {mixed} Result.Result Object with counts of imported and parsed contacts in case of success, otherwise **false**.
	 * @apiSuccess {int} [Result.ErrorCode] Error code
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'Import',
	 *	Result: { "ImportedCount" : 2, "ParsedCount": 3}
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Contacts',
	 *	Method: 'Import',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */

	/**
	 * Imports contacts from file with specified format.
	 * @param array $UploadData Array of uploaded file data.
	 * @param array $GroupUUID Group UUID.
	 * @return array
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function Import($UserId, $UploadData, $GroupUUID)
	{
		$this->CheckAccess($UserId);
		$oUser = \Aurora\Modules\Core\Module::getInstance()->GetUserUnchecked($UserId);

		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$aResponse = array(
			'ImportedCount' => 0,
			'ParsedCount' => 0
		);

		if (is_array($UploadData))
		{
			$oApiFileCacheManager = new \Aurora\System\Managers\Filecache();
			$sTempFileName = 'import-post-' . md5($UploadData['name'] . $UploadData['tmp_name']);
			if ($oApiFileCacheManager->moveUploadedFile($oUser->UUID, $sTempFileName, $UploadData['tmp_name'], '', self::GetName()))
			{
				$sTempFilePath = $oApiFileCacheManager->generateFullFilePath($oUser->UUID, $sTempFileName, '', self::GetName());

				$aImportResult = array();

				$sFileExtension = strtolower(\Aurora\System\Utils::GetFileExtension($UploadData['name']));
				switch ($sFileExtension)
				{
					case 'csv':
						$oSync = new Classes\Csv\Sync();
						$aImportResult = $oSync->Import($oUser->EntityId, $sTempFilePath, $GroupUUID);
						break;
					case 'vcf':
						$aImportResult = $this->importVcf($oUser->EntityId, $sTempFilePath);
						break;
				}

				if (is_array($aImportResult) && isset($aImportResult['ImportedCount']) && isset($aImportResult['ParsedCount']))
				{
					$aResponse['ImportedCount'] = $aImportResult['ImportedCount'];
					$aResponse['ParsedCount'] = $aImportResult['ParsedCount'];
				}
				else
				{
					throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::IncorrectFileExtension);
				}

				$oApiFileCacheManager->clear($oUser->UUID, $sTempFileName, '', self::GetName());
			}
			else
			{
				throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::UnknownError);
			}
		}
		else
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::UnknownError);
		}

		return $aResponse;
	}

	public function GetGroupEvents($UserId, $UUID)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$this->CheckAccess($UserId);

		$aResult = [];
		$aEvents = $this->_getGroupEvents($UUID);
		if (is_array($aEvents) && 0 < count($aEvents))
		{
			foreach ($aEvents as $oEvent)
			{
				$aResult[] = \Aurora\Modules\Calendar\Module::getInstance()->GetBaseEvent($UserId, $oEvent->CalendarUUID, $oEvent->EventUUID);
			}
		}

		return $aResult;
	}

	public function UpdateSharedContacts($UserId, $UUIDs)
	{
		$this->CheckAccess($UserId);

		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		return true;
	}

	public function AddContactsFromFile($UserId, $File)
	{
		$this->CheckAccess($UserId);
		$oUser = \Aurora\Modules\Core\Module::getInstance()->GetUserUnchecked($UserId);

		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (empty($File))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		$oApiFileCache = new \Aurora\System\Managers\Filecache();

		$sTempFilePath = $oApiFileCache->generateFullFilePath($oUser->UUID, $File); // Temp files with access from another module should be stored in System folder
		$aImportResult = $this->importVcf($oUser->EntityId, $sTempFilePath);

		return $aImportResult;
	}

	public function GetCTag($UserId, $Storage)
	{
		$this->CheckAccess($UserId);
		$oUser = \Aurora\Modules\Core\Module::getInstance()->GetUserUnchecked($UserId);

		$iResult = 0;
		if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
		{
			$iUserId = $Storage === 'personal' || $Storage === 'collected' ? $oUser->EntityId : $oUser->IdTenant;

			$oCTag = $this->getManager()->getCTag($iUserId, $Storage);
			if ($oCTag instanceof Classes\CTag)
			{
				$iResult = $oCTag->CTag;
			}
		}

		return $iResult;
	}

	/**
	 *
	 * @param type $UserId
	 * @param type $UUID
	 * @param type $Storage
	 * @param type $FileName
	 */
	public function SaveContactAsTempFile($UserId, $UUID, $FileName)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$this->CheckAccess($UserId);

		$mResult = false;

		$oContact = self::Decorator()->GetContact($UUID, $UserId);
		if ($oContact)
		{
			$oVCard = new \Sabre\VObject\Component\VCard();
			\Aurora\Modules\Contacts\Classes\VCard\Helper::UpdateVCardFromContact($oContact, $oVCard);
			$sVCardData = $oVCard->serialize();
			if ($sVCardData)
			{
				$sUUID = \Aurora\System\Api::getUserUUIDById($UserId);
				$sTempName = md5($sUUID.$UUID);
				$oApiFileCache = new \Aurora\System\Managers\Filecache();

				$oApiFileCache->put($sUUID, $sTempName, $sVCardData);
				if ($oApiFileCache->isFileExists($sUUID, $sTempName))
				{
					$mResult = \Aurora\System\Utils::GetClientFileResponse(
						null, $UserId, $FileName, $sTempName, $oApiFileCache->fileSize($sUUID, $sTempName)
					);
				}
			}
		}

		return $mResult;
	}
	/***** public functions might be called with web API *****/

	/***** private functions *****/
	private function importVcf($iUserId, $sTempFilePath)
	{
		$aImportResult = array(
			'ParsedCount' => 0,
			'ImportedCount' => 0,
			'ImportedUids' => []
		);
		// You can either pass a readable stream, or a string.
		$oHandler = fopen($sTempFilePath, 'r');
		$oSplitter = new \Sabre\VObject\Splitter\VCard($oHandler, \Sabre\VObject\Reader::OPTION_IGNORE_INVALID_LINES);
		$oContactsDecorator = Module::Decorator();
		$oApiContactsManager = $oContactsDecorator ? $oContactsDecorator->GetApiContactsManager() : null;
		if ($oApiContactsManager)
		{
			while ($oVCard = $oSplitter->getNext())
			{
				set_time_limit(30);

				$aContactData = Classes\VCard\Helper::GetContactDataFromVcard($oVCard);
				$oContact = isset($aContactData['UUID']) ? $oApiContactsManager->getContact($aContactData['UUID']) : null;
				$aImportResult['ParsedCount']++;
				if (!isset($oContact) || empty($oContact))
				{
					$CreatedContactData = $oContactsDecorator->CreateContact($aContactData, $iUserId);
					if ($CreatedContactData)
					{
						$aImportResult['ImportedCount']++;
						$aImportResult['ImportedUids'][] = $CreatedContactData['UUID'];
					}
				}
			}
		}
		return $aImportResult;
	}

	private function prepareFiltersFromStorage($UserId, $Storage = '', $SortField = Enums\SortField::Name)
	{
		$aArgs = [
			'UserId' => $UserId,
			'Storage' => $Storage,
			'SortField' => $SortField
		];
		$aPreparedFilters = [];

		$this->broadcastEvent('PrepareFiltersFromStorage', $aArgs, $aPreparedFilters);

		return $aPreparedFilters;
	}

	public function onAfterUseEmails($Args, &$Result)
	{
		$aAddresses = $Args['Emails'];
		$iUserId = \Aurora\System\Api::getAuthenticatedUserId();
		foreach ($aAddresses as $sEmail => $sName)
		{
			$oContact = $this->getManager()->getContactByEmail($iUserId, $sEmail);
			if ($oContact)
			{
				if ($oContact->Frequency !== -1)
				{
					$oContact->Frequency = $oContact->Frequency + 1;
					$this->getManager()->updateContact($oContact);
				}
			}
			else
			{
				self::Decorator()->CreateContact([
					'FullName' => $sName,
					'PersonalEmail' => $sEmail,
					'Auto' => true,
				], $iUserId);
			}
			$this->getManager()->updateCTag($iUserId, 'collected');
		}
	}

	public function onGetBodyStructureParts($aParts, &$aResultParts)
	{
		foreach ($aParts as $oPart)
		{
			if ($oPart instanceof \MailSo\Imap\BodyStructure &&
					($oPart->ContentType() === 'text/vcard' || $oPart->ContentType() === 'text/x-vcard'))
			{
				$aResultParts[] = $oPart;
				break;
			}
		}
	}

	public function onBeforeDeleteUser(&$aArgs, &$mResult)
	{
		$this->CheckAccess($aArgs['UserId']);

		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$aGroups = $this->getManager()->getGroups($aArgs['UserId']);
		if (count($aGroups) > 0)
		{
			$aGroupUUIDs = [];
			foreach ($aGroups as $oGroup)
			{
				$aGroupUUIDs[] = $oGroup->UUID;
			}
			$this->getManager()->deleteGroups($aGroupUUIDs);
		}
		$this->getManager()->deleteCTagsByUserId($aArgs['UserId'], 'personal');
		$this->getManager()->deleteCTagsByUserId($aArgs['UserId'], 'collected');
	}

	/**
	 *
	 */
	public function onAfterCreateTables(&$aData, &$mResult)
	{
		\Aurora\System\Managers\Db::getInstance()->executeSqlFile(
			dirname(__FILE__) . '/Sql/update_contact_notes_field_type.sql'
		);
	}

	public function onCreateOrUpdateEvent(&$aArgs)
	{
		$oEvent = $aArgs['Event'];
		$aGroups = \Aurora\Modules\Calendar\Classes\Helper::findGroupsHashTagsFromString($oEvent->Name);
		$aGroupsDescription = \Aurora\Modules\Calendar\Classes\Helper::findGroupsHashTagsFromString($oEvent->Description);
		$aGroups = array_merge($aGroups, $aGroupsDescription);
		$aGroupsLocation = \Aurora\Modules\Calendar\Classes\Helper::findGroupsHashTagsFromString($oEvent->Location);
		$aGroups = array_merge($aGroups, $aGroupsLocation);
		$oUser = \Aurora\System\Api::getAuthenticatedUser();

		if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
		{
			foreach ($aGroups as $sGroup)
			{
				$sGroupName = ltrim($sGroup, '#');
				$oGroup = $this->Decorator()->GetGroupByName($sGroupName, $oUser->EntityId);
				if (!$oGroup)
				{
					$sGroupUUID = $this->Decorator()->CreateGroup(['Name' => $sGroupName], $oUser->EntityId);
					if ($sGroupUUID)
					{
						$oGroup = $this->GetGroup($oUser->EntityId, $sGroupUUID);
					}
				}

				if ($oGroup instanceof Classes\Group)
				{
					$this->removeEventFromGroup($oGroup->UUID, $oEvent->IdCalendar, $oEvent->Id);
					$this->addEventToGroup($oGroup->UUID, $oEvent->IdCalendar, $oEvent->Id);
				}
			}
		}
	}

	/**
	 * @param string $sGroupUUID
	 *
	 * @return bool
	 */
	protected function _getGroupEvents($sGroupUUID)
	{
		$mResult = false;
		try
		{
			$mResult = (new \Aurora\System\EAV\Query(Classes\GroupEvent::class))
				->select()
				->where(['GroupUUID' => $sGroupUUID])
				->exec();

		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$mResult = false;
		}
		return $mResult;
	}

	/**
	 * @param string $sCalendarUUID
	 * @param string $sEventUUID
	 *
	 * @return bool
	 */
	protected function getGroupEvent($sCalendarUUID, $sEventUUID)
	{
		$mResult = false;
		try
		{
			$mResult = (new \Aurora\System\EAV\Query(Classes\GroupEvent::class))
				->select()
				->where([
					'$AND' => [
						'CalendarUUID' => $sCalendarUUID,
						'EventUUID' => $sEventUUID
					]
				])
				->one()
				->exec();
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$mResult = false;
		}
		return $mResult;
	}

	/**
	 * @param string $sGroupUUID
	 * @param string $sCalendarUUID
	 * @param string $sEventUUID
	 *
	 * @return bool
	 */
	protected function addEventToGroup($sGroupUUID, $sCalendarUUID, $sEventUUID)
	{
		$bResult = false;
		try
		{
			$oGroupEvent = new Classes\GroupEvent($this->GetName());
			$oGroupEvent->GroupUUID = $sGroupUUID;
			$oGroupEvent->CalendarUUID = $sCalendarUUID;
			$oGroupEvent->EventUUID = $sEventUUID;
			$bResult = $oGroupEvent->save();
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$bResult = false;
		}
		return $bResult;
	}

	/**
	 * @param string $sGroupUUID
	 * @param string $sCalendarUUID
	 * @param string $sEventUUID
	 *
	 * @return bool
	 */
	protected function removeEventFromGroup($sGroupUUID, $sCalendarUUID, $sEventUUID)
	{
		$mResult = false;
		try
		{
			$mResult = (new \Aurora\System\EAV\Query(Classes\GroupEvent::class))
				->select()
				->where([
					'$AND' => [
						'GroupUUID' => $sGroupUUID,
						'CalendarUUID' => $sCalendarUUID,
						'EventUUID' => $sEventUUID
					]
				])
				->one()
				->exec();

			if ($mResult instanceof Classes\GroupEvent)
			{
				$mResult = $mResult->delete();
			}
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$mResult = false;
		}
		return $mResult;
	}

	/**
	 * @param string $sCalendarUUID
	 * @param string $sEventUUID
	 *
	 * @return bool
	 */
	public function removeEventFromAllGroups($sCalendarUUID, $sEventUUID)
	{
		$mResult = false;
		try
		{
			$mResult = (new \Aurora\System\EAV\Query(Classes\GroupEvent::class))
				->select()
				->where([
					'$AND' => [
						'CalendarUUID' => $sCalendarUUID,
						'EventUUID' => $sEventUUID
					]
				])
				->exec();

			if (is_array($mResult))
			{
				foreach ($mResult as $oGroupEvent)
				{
					if ($mResult instanceof Classes\GroupEvent)
					{
						$mResult->delete();
					}
				}
			}
			$mResult = true;
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$mResult = false;
		}
		return $mResult;
	}
	/***** private functions *****/
}
