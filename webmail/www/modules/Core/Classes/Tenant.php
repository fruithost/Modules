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
 * @property int $IdChannel
 * @property bool $IsDisabled
 * @property bool $IsEnableAdminPanelLogin
 * @property bool $IsDefault
 * @property string $Name
 * @property string $Email
 * @property string $PasswordHash
 * @property string $Description
 * @property string $WebDomain
 * @property int $UserCountLimit
 * @property string $Capa
 * @property int $Expared
 * @property string $PayUrl
 * @property bool $IsTrial
 * @property bool $AllowChangeAdminEmail
 * @property bool $AllowChangeAdminPassword
 *
 * @property string $LogoUrl
 * 
 * @property bool $SipAllow
 * @property bool $SipAllowConfiguration
 * @property string $SipRealm
 * @property string $SipWebsocketProxyUrl
 * @property string $SipOutboundProxyUrl
 * @property string $SipCallerID
 * 
 * @property bool $TwilioAllow
 * @property bool $TwilioAllowConfiguration
 * @property string $TwilioAccountSID
 * @property string $TwilioAuthToken
 * @property string $TwilioAppSID
 *
 * @property array $Socials
 * 
 * @property string $CalendarNotificationEmailAccount
 * @property string $InviteNotificationEmailAccount
 *
 * @package Classes
 * @subpackage Tenants
 */
class Tenant extends \Aurora\System\EAV\Entity
{
	protected $aStaticMap = array(
			'IdTenant'					=> array('int', 0),
			'IdChannel'					=> array('int', 0, true),
			'IsDisabled'				=> array('bool', false, true),
			'IsDefault'					=> array('bool', false, true),
//			'IsEnableAdminPanelLogin'	=> array('bool', false),
			'Name'						=> array('string', '', true),
//			'Email'						=> array('string', ''),
//			'PasswordHash'				=> array('string', ''),
			'Description'				=> array('string', ''),
			'WebDomain'					=> array('string', ''),
			'UserCountLimit'			=> array('int', 0),
			'Capa'						=> array('string', '', false), //(string) $oSettings->GetConf('TenantGlobalCapa')
			
			'AllowChangeAdminEmail'		=> array('bool', true),
			'AllowChangeAdminPassword'	=> array('bool', true),

			'Expared'					=> array('int', 0),
			'PayUrl'					=> array('string', ''),
			'IsTrial'					=> array('bool', false),

			'LogoUrl'					=> array('string', ''),

//			'SipAllow'					=> array('bool', false, false), //!!$oSettings->GetConf('Sip/AllowSip')
//			'SipAllowConfiguration'		=> array('bool', false),
//			'SipRealm'					=> array('string', '', false), //, (string) $oSettings->GetConf('Sip/Realm')
//			'SipWebsocketProxyUrl'		=> array('string', '', false), //, (string) $oSettings->GetConf('Sip/WebsocketProxyUrl')
//			'SipOutboundProxyUrl'		=> array('string', '', false), //, (string) $oSettings->GetConf('Sip/OutboundProxyUrl')
//			'SipCallerID'				=> array('string', '', false), //, (string) $oSettings->GetConf('Sip/CallerID')
			
//			'Socials'					=> array('array', array(), false), //$this->getDefaultSocials()
			'CalendarNotificationEmailAccount'	=> array('string', ''),
			'InviteNotificationEmailAccount'	=> array('string', '')		
	);
	
	public function __construct($sModule)
	{
		$this->ParentType = 'Aurora\System\Module\Settings';
		
		parent::__construct($sModule);
	}	

	/**
	 * temp method
	 */
	public function setInheritedSettings()
	{
		$oSettings =&\Aurora\System\Api::GetSettings();
		$oMap = $this->getStaticMap();
		
		if (isset($oMap['Capa'][2]) && !$oMap['Capa'][2])
		{
			$this->Capa = (string) $oSettings->GetConf('TenantGlobalCapa');
		}
		
		if (isset($oMap['SipAllow'][2]) && !$oMap['SipAllow'][2])
		{
			$this->SipAllow = !!$oSettings->GetConf('Sip/AllowSip');
		}
		
		if (isset($oMap['SipRealm'][2]) && !$oMap['SipRealm'][2])
		{
			$this->SipRealm = (string) $oSettings->GetConf('Sip/Realm');
		}
		
		if (isset($oMap['SipWebsocketProxyUrl'][2]) && !$oMap['SipWebsocketProxyUrl'][2])
		{
			$this->SipWebsocketProxyUrl = (string) $oSettings->GetConf('Sip/WebsocketProxyUrl');
		}
		
		if (isset($oMap['SipOutboundProxyUrl'][2]) && !$oMap['SipOutboundProxyUrl'][2])
		{
			$this->SipOutboundProxyUrl = (string) $oSettings->GetConf('Sip/OutboundProxyUrl');
		}
		
		if (isset($oMap['SipCallerID'][2]) && !$oMap['SipCallerID'][2])
		{
			$this->SipCallerID = (string) $oSettings->GetConf('Sip/CallerID');
		}
		
		if (isset($oMap['TwilioAllow'][2]) && !$oMap['TwilioAllow'][2])
		{
			$this->TwilioAllow = !!$oSettings->GetConf('Twilio/AllowTwilio');
		}
		
		if (isset($oMap['TwilioPhoneNumber'][2]) && !$oMap['TwilioPhoneNumber'][2])
		{
			$this->TwilioPhoneNumber = (string) $oSettings->GetConf('Twilio/PhoneNumber');
		}
		
		if (isset($oMap['TwilioAccountSID'][2]) && !$oMap['TwilioAccountSID'][2])
		{
			$this->TwilioAccountSID = (string) $oSettings->GetConf('Twilio/AccountSID');
		}
		
		if (isset($oMap['TwilioAuthToken'][2]) && !$oMap['TwilioAuthToken'][2])
		{
			$this->TwilioAuthToken = (string) $oSettings->GetConf('Twilio/AuthToken');
		}
		
		if (isset($oMap['TwilioAppSID'][2]) && !$oMap['TwilioAppSID'][2])
		{
			$this->TwilioAppSID = (string) $oSettings->GetConf('Twilio/AppSID');
		}
		
//		if (isset($oMap['Socials'][2]) && !$oMap['Socials'][2])
//		{
//			$this->Socials = $this->getDefaultSocials();
//		}
	}
	
	/**
	 * @return bool
	 */
	public function isFilesSupported()
	{
		$oCoreModule = \Aurora\System\Api::GetModule('Core'); 
		if (!$oCoreModule || !$oCoreModule->getConfig('AllowCapa', false))
		{
			return true;
		}
	}

	/**
	 * @return bool
	 */
	public function isHelpdeskSupported()
	{
		$oCoreModule = \Aurora\System\Api::GetModule('Core'); 
		if (!$oCoreModule || !$oCoreModule->getConfig('AllowCapa', false))
		{
			return true;
		}
	}

	/**
	 * @return bool
	 */
	public function isTwilioSupported()
	{
		$oCoreModule = \Aurora\System\Api::GetModule('Core'); 
		if (!$oCoreModule || !$oCoreModule->getConfig('AllowCapa', false))
		{
			return true;
		}
	}
	
	
	/**
	 * @param string $sPassword
	 *
	 * @return string
	 */
	public static function hashPassword($sPassword)
	{
		return empty($sPassword) ? '' : md5('Awm'.md5($sPassword.'Awm'));
	}

	/**
	 * @param string $sPassword
	 *
	 * @return bool
	 */
	public function validatePassword($sPassword)
	{
		return self::hashPassword($sPassword) === $this->PasswordHash;
	}

	/**
	 * @param string $sPassword
	 */
	public function setPassword($sPassword)
	{
		$this->PasswordHash = self::hashPassword($sPassword);
	}

	public function getUserCount()
	{
//		$oUsersApi =\Aurora\System\Api::GetSystemManager('users');
//		return $oUsersApi->getUsersCountForTenant($this->EntityId);
	}

	/**
	 * @return bool
	 *
	 * @throws \Aurora\System\Exceptions\ValidationException(Errs::Validation_InvalidTenantName) 1109
	 * @throws \Aurora\System\Exceptions\ValidationException(Errs::Validation_FieldIsEmpty) 1102
	 * @throws \Aurora\System\Exceptions\ValidationException(Errs::Validation_InvalidEmail) 1107
	 *
	 * @return true
	 */
	public function validate()
	{
		if (!$this->IsDefault)
		{
			switch (true)
			{
//				case !\Aurora\System\Utils\Validate::IsValidLogin($this->Login):
//					throw new \Aurora\System\Exceptions\ValidationException(Errs::Validation_InvalidTenantName);
				case \Aurora\System\Utils\Validate::IsEmpty($this->Name):
					throw new \Aurora\System\Exceptions\ValidationException(Errs::Validation_FieldIsEmpty, null, array(
						'{{ClassName}}' => 'Tenant', '{{ClassField}}' => 'Name'));
//				case !\Aurora\System\Utils\Validate::IsEmpty($this->Email) && !preg_match('/^[^@]+@[^@]+$/', $this->Email):
//					throw new \Aurora\System\Exceptions\ValidationException(Errs::Validation_InvalidEmail, null, array(
//						'{{ClassName}}' => 'Tenant', '{{ClassField}}' => 'Email'));
			}
		}

		return true;
	}
	
	

	/**
	 * @return array
	 */
	public function getDefaultSocials()
	{
		$aResult = array();
		$oSettings =&\Aurora\System\Api::GetSettings();
		$aSocials = $oSettings->GetConf('Socials');
		if (isset($aSocials) && is_array($aSocials))
		{
			$oPlugin = \Aurora\System\Api::Plugin()->GetPluginByName('external-services');
			if ($oPlugin)
			{
				$aConnectors = $oPlugin->GetEnabledConnectors();
				foreach ($aSocials as $sKey => $aSocial)
				{
					if (in_array(strtolower($sKey), $aConnectors))
					{
						$oTenantSocial = \Aurora\Modules\Core\Classes\TenantSocials::initFromSettings($aSocial);
						if ($oTenantSocial !== null)
						{
							$aResult[strtolower($sKey)] = $oTenantSocial;
						}
					}
				}
			}
		}
		
		return $aResult;
	}
	
	/**
	 * @return array
	 */
	public function getSocialsForSettings()
	{
		$aSettingsSocials = array();
		foreach ($this->Socials as $sKey => $oSocial)
		{
			if (is_array($oSocial))
			{
				$aSettingsSocials[ucfirst($sKey)] = $oSocial;
			}
			else if ($oSocial instanceof \Aurora\Modules\Core\Classes\TenantSocials)
			{
				$aSettingsSocials[ucfirst($sKey)] = $oSocial->initForSettings();
			}
		}
		return $aSettingsSocials;
	}
	
	/**
	 * @param array $aSocials
	 */
	public function setSocials($aSocials)
	{
/*
		if ($this->IdTenant === 0)
		{
			$this->Socials = $this->getSocialsForSettings();
		}
		else
		{
 */
			$this->Socials = $aSocials;
/*
		}
 */
	}
	
	public function toResponseArray()
	{
		$oSettings = \Aurora\System\Api::GetModuleManager()->GetModuleSettings('Core');
		$aResponse = array(
			'Name' => $this->Name,
			'Description' => $this->Description,
			'WebDomain' => $this->WebDomain,
			'SiteName' => $oSettings->GetTenantValue($this->Name, 'SiteName', '')
		);
		$aArgs = ['Tenant' => $this];
		\Aurora\System\Api::GetModule('Core')->broadcastEvent(
			'Tenant::ToResponseArray',
			$aArgs,
			$aResponse
		);
		return $aResponse;
	}
}
