<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\OpenPgpWebclient;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractWebclientModule
{
	public function init()
	{
		\Aurora\Modules\Core\Classes\User::extend(
			self::GetName(),
			[
				'EnableModule'			=> ['bool', false],
				'RememberPassphrase'	=> ['bool', false]
			]
		);

		\Aurora\Modules\Contacts\Classes\Contact::extend(
			self::GetName(),
			[
				'PgpKey' => ['text', null],
				'PgpEncryptMessages' => ['bool', false],
				'PgpSignMessages' => ['bool', false],
			]

		);

		$this->subscribeEvent('Files::PopulateFileItem::after', array($this, 'onAfterPopulateFileItem'));
		$this->subscribeEvent('Mail::GetBodyStructureParts', array($this, 'onGetBodyStructureParts'));
		$this->subscribeEvent('Mail::ExtendMessageData', array($this, 'onExtendMessageData'));
		$this->subscribeEvent('Contacts::CreateContact::after', array($this, 'onAfterCreateOrUpdateContact'));
		$this->subscribeEvent('Contacts::UpdateContact::after', array($this, 'onAfterCreateOrUpdateContact'));
		$this->subscribeEvent('Contacts::GetContacts::after', array($this, 'onAfterGetContacts'));
	}

	/**
	 * @ignore
	 * @todo not used
	 * @param array $aArgs
	 * @param object $oItem
	 * @return boolean
	 */
	public function onAfterPopulateFileItem($aArgs, &$oItem)
	{
		if ($oItem && '.asc' === \strtolower(\substr(\trim($oItem->Name), -4)))
		{
			$oFilesDecorator = \Aurora\System\Api::GetModuleDecorator('Files');
			if ($oFilesDecorator instanceof \Aurora\System\Module\Decorator)
			{
				$mResult = $oFilesDecorator->GetFileContent($aArgs['UserId'], $oItem->TypeStr, $oItem->Path, $oItem->Name);
				if (isset($mResult))
				{
					$oItem->Content = $mResult;
				}
			}
		}
	}

	public function onGetBodyStructureParts($aParts, &$aResultParts)
	{
		foreach ($aParts as $oPart)
		{
			if ($oPart instanceof \MailSo\Imap\BodyStructure && $oPart->ContentType() === 'text/plain' && '.asc' === \strtolower(\substr(\trim($oPart->FileName()), -4)))
			{
				$aResultParts[] = $oPart;
			}
		}
	}

	public function onExtendMessageData($aData, &$oMessage)
	{
		foreach ($aData as $aDataItem)
		{
			$oPart = $aDataItem['Part'];
			$bAsc = $oPart instanceof \MailSo\Imap\BodyStructure && $oPart->ContentType() === 'text/plain' && '.asc' === \strtolower(\substr(\trim($oPart->FileName()), -4));
			$sData = $aDataItem['Data'];
			if ($bAsc)
			{
				$iMimeIndex = $oPart->PartID();
				foreach ($oMessage->getAttachments()->GetAsArray() as $oAttachment)
				{
					if ($iMimeIndex === $oAttachment->getMimeIndex())
					{
						$oAttachment->setContent($sData);
					}
				}
			}
		}
	}

	public function onAfterCreateOrUpdateContact($aArgs, &$mResult)
	{
		if (isset($mResult['UUID']) && isset($aArgs['Contact']['PublicPgpKey']))
		{
			$sPublicPgpKey = $aArgs['Contact']['PublicPgpKey'];
			if (empty(\trim($sPublicPgpKey)))
			{
				$sPublicPgpKey = null;
			}
			$oContact = \Aurora\Modules\Contacts\Module::Decorator()->GetContact($mResult['UUID'], $aArgs['UserId']);
			if ($oContact instanceof \Aurora\Modules\Contacts\Classes\Contact)
			{
				$oContact->{$this->GetName() . '::PgpKey'} = $sPublicPgpKey;
				if (isset($aArgs['Contact']['PgpEncryptMessages']) && is_bool($aArgs['Contact']['PgpEncryptMessages']))
				{
					$oContact->{$this->GetName() . '::PgpEncryptMessages'} = $aArgs['Contact']['PgpEncryptMessages'];
				}
				if (isset($aArgs['Contact']['PgpSignMessages']) && is_bool($aArgs['Contact']['PgpSignMessages']))
				{
					$oContact->{$this->GetName() . '::PgpSignMessages'} = $aArgs['Contact']['PgpSignMessages'];
				}
				\Aurora\Modules\Contacts\Module::Decorator()->UpdateContactObject($oContact);
			}
		}
	}

	public function onAfterGetContacts($aArgs, &$mResult)
	{
		if (isset($mResult['List']))
		{
			$aContactUUIDs = array_map(function ($aValue) {
				return $aValue['UUID'];
			}, $mResult['List']);
			$aContactsInfo = $this->GetContactsWithPublicKeys($aArgs['UserId'], $aContactUUIDs);
			foreach ($mResult['List'] as &$aContact)
			{
				$aContact['HasPgpPublicKey'] = false;
				$aContact['PgpEncryptMessages'] = false;
				$aContact['PgpSignMessages'] = false;
				if (isset($aContactsInfo[$aContact['UUID']]))
				{
					$aContact['HasPgpPublicKey'] = true;
					$aContact['PgpEncryptMessages'] = $aContactsInfo[$aContact['UUID']]['PgpEncryptMessages'];
					$aContact['PgpSignMessages'] = $aContactsInfo[$aContact['UUID']]['PgpSignMessages'];
				}
			}
		}
	}

	/***** public functions might be called with web API *****/
	/**
	 * Obtains list of module settings for authenticated user.
	 *
	 * @return array
	 */
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		$aSettings = array();
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oUser && $oUser->isNormalOrTenant())
		{
			if (isset($oUser->{self::GetName().'::EnableModule'}))
			{
				$aSettings['EnableModule'] = $oUser->{self::GetName().'::EnableModule'};
			}
			if (isset($oUser->{self::GetName().'::RememberPassphrase'}))
			{
				$aSettings['RememberPassphrase'] = $oUser->{self::GetName().'::RememberPassphrase'};
			}
		}
		return $aSettings;
	}

	public function UpdateSettings($EnableModule, $RememberPassphrase)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oUser)
		{
			if ($oUser->isNormalOrTenant())
			{
				$oCoreDecorator = \Aurora\Modules\Core\Module::Decorator();
				$oUser->{self::GetName().'::EnableModule'} = $EnableModule;
				if (isset($RememberPassphrase))
				{
					$oUser->{self::GetName().'::RememberPassphrase'} = $RememberPassphrase;
				}
				return $oCoreDecorator->UpdateUserObject($oUser);
			}
			if ($oUser->Role === \Aurora\System\Enums\UserRole::SuperAdmin)
			{
				return true;
			}
		}

		return false;
	}

	public function AddPublicKeyToContact($UserId, $Email, $Key, $UserName = '')
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$bResult = false;
		$aUpdatedContactIds = [];

		if (\MailSo\Base\Validator::SimpleEmailString($Email))
		{
			$aContacts = \Aurora\Modules\Contacts\Module::Decorator()->GetContactsByEmails(
				$UserId,
				\Aurora\Modules\Contacts\Enums\StorageType::Personal,
				[$Email]
			);

			if (count($aContacts) === 0)
			{
				$mResult = \Aurora\Modules\Contacts\Module::Decorator()->CreateContact(
					[
						'PersonalEmail' => $Email,
						'FullName' => $UserName
					],
					$UserId
				);
				if (isset($mResult['UUID']))
				{
					$oContact = \Aurora\Modules\Contacts\Module::Decorator()->GetContact($mResult['UUID'], $UserId);
					if ($oContact instanceof \Aurora\Modules\Contacts\Classes\Contact &&
						$oContact->Storage === \Aurora\Modules\Contacts\Enums\StorageType::Personal)
					{
						$aContacts = [$oContact];
					}
				}
			}

			if (is_array($aContacts) && count($aContacts) > 0)
			{
				foreach ($aContacts as $oContact)
				{
					if ($oContact instanceof \Aurora\Modules\Contacts\Classes\Contact &&
						$oContact->Storage === \Aurora\Modules\Contacts\Enums\StorageType::Personal)
					{
						$oContact->{$this->GetName() . '::PgpKey'} = $Key;
						\Aurora\Modules\Contacts\Module::Decorator()->UpdateContactObject($oContact);
						$aUpdatedContactIds[] = $oContact->UUID;
					}
				}

				// $bResult = true;
			}
		}

		return $aUpdatedContactIds;
	}

	public function AddPublicKeysToContacts($UserId, $Keys)
	{
		$mResult = false;
		$aUpdatedContactIds = [];
		
		foreach ($Keys as $aKey)
		{
			if (isset($aKey['Email'], $aKey['Key']))
			{
				$sUserName = isset($aKey['Name']) ? $aKey['Name'] : '';
				$mResult = $this->AddPublicKeyToContact($UserId, $aKey['Email'], $aKey['Key'], $sUserName);
				if (is_array($mResult)) {
					$aUpdatedContactIds = array_merge($aUpdatedContactIds, $mResult);
				}
			}
		}

		return $aUpdatedContactIds;
	}

	public function RemovePublicKeyFromContact($UserId, $Email)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$bResult = false;

		if (\MailSo\Base\Validator::SimpleEmailString($Email))
		{
			$aContacts = \Aurora\Modules\Contacts\Module::Decorator()->GetContactsByEmails(
				$UserId,
				\Aurora\Modules\Contacts\Enums\StorageType::Personal,
				[$Email]
			);

			if (is_array($aContacts) && count($aContacts) > 0)
			{
				foreach ($aContacts as $oContact)
				{
					if ($oContact instanceof \Aurora\Modules\Contacts\Classes\Contact &&
						$oContact->Storage === \Aurora\Modules\Contacts\Enums\StorageType::Personal)
					{
						$oContact->{$this->GetName() . '::PgpKey'} = null;
						\Aurora\Modules\Contacts\Module::Decorator()->UpdateContactObject($oContact);
					}
				}

				$bResult = true;
			}
		}

		return $bResult;
	}

	public function GetPublicKeysByCountactUUIDs($UserId, $ContactUUIDs)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$aResult = [];

		if (count($ContactUUIDs))
		{
			$aContacts = \Aurora\Modules\Contacts\Module::Decorator()->GetContactsByUids($UserId, $ContactUUIDs);
			if (is_array($aContacts) && count($aContacts) > 0)
			{
				foreach ($aContacts as $oContact)
				{
					$aResult[] = [
						'Email' => $oContact->ViewEmail,
						'PublicPgpKey' => $oContact->{$this->GetName() . '::PgpKey'}
					];
				}
			}
		}

		return $aResult;
	}

	public function GetContactsWithPublicKeys($UserId, $UUIDs)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		$mResult = [];

		$aContactsInfo = (new \Aurora\System\EAV\Query())
			->select(['UUID', 'ETag', 'Storage', 'Auto', $this->GetName() . '::PgpEncryptMessages', $this->GetName() . '::PgpSignMessages'])
			->whereType(\Aurora\Modules\Contacts\Classes\Contact::class)
			->where([
				'$AND' => [
					$this->GetName() . '::PgpKey' => ['NULL', 'IS NOT'],
					'UUID' => [$UUIDs, 'IN']
				]
			])
			->exec();

		if (isset($aContactsInfo) && count($aContactsInfo) > 0)
		{
			foreach ($aContactsInfo as $oContactInfo)
			{
				$mResult[$oContactInfo->UUID]  = [
					'PgpEncryptMessages' => $oContactInfo->{$this->GetName() . '::PgpEncryptMessages'},
					'PgpSignMessages' => $oContactInfo->{$this->GetName() . '::PgpSignMessages'}
				];
			}
		}

		return $mResult;
	}

	public function GetPublicKeysFromContacts($UserId)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$aResult = [];

		$aContactsInfo = \Aurora\Modules\Contacts\Module::Decorator()->GetContactsInfo(
			\Aurora\Modules\Contacts\Enums\StorageType::Personal,
			$UserId,
			[
				'$AND' => [
					$this->GetName() . '::PgpKey' => ['NULL', 'IS NOT']
				]
			]
		);

		$aContactUUIDs = [];
		if (is_array($aContactsInfo['Info']) && count($aContactsInfo['Info']) > 0)
		{
			$aContactUUIDs = array_map(function ($aValue) {
				return $aValue['UUID'];
			}, $aContactsInfo['Info']);
		}
		$aResult = $this->Decorator()->GetPublicKeysByCountactUUIDs($UserId, $aContactUUIDs);


		return $aResult;
	}
	/***** public functions might be called with web API *****/
}
