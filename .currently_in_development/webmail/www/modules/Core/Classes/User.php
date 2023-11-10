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
 * @property int $IdUser
 * @property int $IdSubscription
 * @property int $CreatedTime
 * @property int $LastLogin
 * @property int $LastLoginNow
 * @property int $LoginsCount
 * @property string $Language
 * @property int $TimeFormat
 * @property string $DateFormat
 * @property string $Question1
 * @property string $Question2
 * @property string $Answer1
 * @property string $Answer2
 * @property string $Capa
 * @property bool $DesktopNotifications
 * @property mixed $CustomFields
 * @property bool $SipEnable
 * @property string $SipImpi
 * @property string $SipPassword
 * 
 * @property bool $FilesEnable
 * @property string $EmailNotification
 * @property string $PasswordResetHash
 * 
 * @property bool $WriteSeparateLog
 *
 * @package Classes
 * @subpackage Users
 */
class User extends \Aurora\System\EAV\Entity
{
	/**
	 * @var CSubscription
	 */
	private $oSubCache;

	/**
	 * Creates a new instance of the object.
	 * 
	 * @return void
	 */
	public function __construct($sModule)
	{
		$this->ParentType = \Aurora\Modules\Core\Classes\Tenant::class;
		$oModuleManager = \Aurora\System\Api::GetModuleManager();
		
		$this->aStaticMap = array(
			'Name'						=> array('string', '', true),
			'PublicId'					=> array('string', '', true),
			'IdTenant'					=> array('int', 0),
			'IsDisabled'				=> array('bool', false, true),
			'IdSubscription'			=> array('int', 0),
			'Role'						=> array('int', \Aurora\System\Enums\UserRole::NormalUser),

			'DateCreated'				=> array('datetime', null, true),
			'LastLogin'					=> array('datetime', null),
			'LastLoginNow'				=> array('string', ''),
			'LoginsCount'				=> array('int', 0),

			'Language'					=> array('string', ''),

			'TimeFormat'				=> array('int', 1 /*$oModuleManager->getModuleConfigValue('Core', 'TimeFormat')*/),
			'DateFormat'				=> array('string', ''/*$oModuleManager->getModuleConfigValue('Core', 'DateFormat')*/),

			'Question1'					=> array('string', ''),
			'Question2'					=> array('string', ''),
			'Answer1'					=> array('string', ''),
			'Answer2'					=> array('string', ''),

			'SipEnable'					=> array('bool', true),
			'SipImpi'					=> array('string', ''),
			'SipPassword'				=> array('string', ''),
			
			'DesktopNotifications'		=> array('bool', false),

			'Capa'						=> array('string', ''),
			'CustomFields'				=> array('string', ''),

			'FilesEnable'				=> array('bool', true),
			
			'EmailNotification'			=> array('string', ''),
			
			'PasswordResetHash'			=> array('string', ''),
			
			'WriteSeparateLog'			=> array('bool', false),

			'DefaultTimeZone'			=> array('string', ''),
			
			'TokensValidFromTimestamp' => array('int', 0),
		);

		$this->oSubCache = null;

		parent::__construct($sModule);

//		$this->SetUpper(array('Capa'));
	}


	public function isAdmin()
	{
		return $this->EntityId === -1;
	}	
	
	public function isNormalOrTenant()
	{
		return $this->Role === \Aurora\System\Enums\UserRole::NormalUser || $this->Role === \Aurora\System\Enums\UserRole::TenantAdmin;
	}	
	
	/**
	 * @ignore
	 * @todo not used
	 * 
	 * @param string $sCapaName
	 *
	 * @return bool
	 */
	public function getCapa($sCapaName)
	{
		return true;
		// TODO

		$oCoreModule = \Aurora\System\Api::GetModule('Core'); 
		if (!$oCoreModule || !$oCoreModule->getConfig('AllowCapa', false) || '' === $this->Capa ||
			0 === $this->IdSubscription)
		{
			return true;
		}

		$sCapaName = preg_replace('/[^A-Z0-9_=]/', '', strtoupper($sCapaName));

		$aCapa = explode(' ', $this->Capa);

		return in_array($sCapaName, $aCapa);
	}

	/**
	 * @ignore
	 * @todo not used
	 * 
	 * @return void
	 */
	public function allowAllCapas()
	{
		$this->Capa = '';
	}

	/**
	 * @ignore
	 * @todo not used
	 * 
	 * @return void
	 */
	public function removeAllCapas()
	{
		$this->Capa = \Aurora\System\Enums\Capa::NO;
	}

	/**
	 * @ignore
	 * @todo not used
	 * 
	 * @param Aurora\Modules\Core\Classes\Tenant $oTenant
	 * @param string $sCapaName
	 * @param bool $bValue
	 *
	 * @return bool
	 */
	public function setCapa($oTenant, $sCapaName, $bValue)
	{
		$oCoreModule = \Aurora\System\Api::GetModule('Core'); 
		if (!$oCoreModule || !$oCoreModule->getConfig('AllowCapa', false) || !$oTenant)
		{
			return true;
		}

		return true;
	}

	/**
	 * Checks if the user has only valid data.
	 * 
	 * @return bool
	 */
	public function validate()
	{
		switch (true)
		{
			case false:
				throw new \Aurora\System\Exceptions\ValidationException(Errs::Validation_FieldIsEmpty, null, array(
					'{{ClassName}}' => 'Aurora\Modules\Core\Classes\User', '{{ClassField}}' => 'Error'));
		}

		return true;
	}

	public function getTenant()
	{
		return \Aurora\Api::GetModuleDecorator($this->getModule())->GetTenantUnchecked($this->IdTenant);
	}
}
