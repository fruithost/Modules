<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\TwoFactorAuth;

use Aurora\System\Exceptions\ApiException;
use Aurora\System\Exceptions\Exception;
use PragmaRX\Recovery\Recovery;

require_once('Classes/WebAuthn/WebAuthn.php');

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2020, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	public static $VerifyState = false;

	private $oWebAuthn = null;

	/*
	 * @var $oUsedDevicesManager Managers\UsedDevices
	 */
	protected $oUsedDevicesManager = null;

	public function init()
	{
		$this->extendObject(\Aurora\Modules\Core\Classes\User::class, [
				'Secret' => ['string', '', false, true],
				'ShowRecommendationToConfigure' => ['bool', true],
				'IsEncryptedSecret' => ['bool', false],
				'BackupCodes' => ['string', '', false],
				'BackupCodesTimestamp' => ['string', '', false],
				'Challenge' => ['string', '', false],
			]
		);

		\Aurora\System\Router::getInstance()->registerArray(
			self::GetName(),
			[
				'assetlinks' => [$this, 'EntryAssetlinks'],
				'verify-security-key' => [$this, 'EntryVerifySecurityKey'],
			]
		);

		$this->subscribeEvent('Core::Authenticate::after', array($this, 'onAfterAuthenticate'));
		$this->subscribeEvent('Core::Logout::before', array($this, 'onBeforeLogout'));

		$this->oWebAuthn = new \WebAuthn\WebAuthn(
			'WebAuthn Library',
			$this->oHttp->GetHost(),
			[
				'android-key',
				'android-safetynet',
				'apple',
				'fido-u2f',
				'none',
				'packed',
				'tpm'
			],
			false,
			array_merge($this->getConfig('FacetIds', []), [$this->oHttp->GetScheme().'://'.$this->oHttp->GetHost(true, false)])
		);
	}

	/**
	 *
	 * @return \Aurora\Modules\Mail\Managers\UsedDevices\Manager
	 */
	public function getUsedDevicesManager()
	{
		if ($this->oUsedDevicesManager === null)
		{
			$this->oUsedDevicesManager = new Managers\UsedDevices\Manager($this);
		}

		return $this->oUsedDevicesManager;
	}

	/**
	 * Obtains list of module settings for authenticated user.
	 *
	 * @return array
	 */
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		$aSettings = [
			'AllowBackupCodes' => $this->getConfig('AllowBackupCodes', false),
			'AllowSecurityKeys' => $this->getConfig('AllowSecurityKeys', false),
			'AllowAuthenticatorApp' => $this->getConfig('AllowAuthenticatorApp', true),
			'AllowUsedDevices' => $this->getConfig('AllowUsedDevices', false),
			'TrustDevicesForDays' => $this->getConfig('TrustDevicesForDays', 0),
		];

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!empty($oUser) && $oUser->isNormalOrTenant())
		{
            $bShowRecommendationToConfigure = $this->getConfig('ShowRecommendationToConfigure', false);
            if ($bShowRecommendationToConfigure)
            {
                $bShowRecommendationToConfigure = $oUser->{$this->GetName().'::ShowRecommendationToConfigure'};
            }

			$bAuthenticatorAppEnabled = $this->getConfig('AllowAuthenticatorApp', true) && $oUser->{$this->GetName().'::Secret'} ? true : false;
			$aWebAuthKeysInfo = $this->getConfig('AllowSecurityKeys', false) ? $this->_getWebAuthKeysInfo($oUser) : [];
			$iBackupCodesCount = 0;
			if ($bAuthenticatorAppEnabled || count($aWebAuthKeysInfo) > 0)
			{
				$sBackupCodes = \Aurora\System\Utils::DecryptValue($oUser->{$this->GetName().'::BackupCodes'});
				$aBackupCodes = empty($sBackupCodes) ? [] : json_decode($sBackupCodes);
				$aNotUsedBackupCodes = array_filter($aBackupCodes, function($sCode) { return !empty($sCode); });
				$iBackupCodesCount = count($aNotUsedBackupCodes);
			}

			$aSettings = array_merge($aSettings, [
                'ShowRecommendationToConfigure' => $bShowRecommendationToConfigure,
				'WebAuthKeysInfo' => $aWebAuthKeysInfo,
				'AuthenticatorAppEnabled' => $bAuthenticatorAppEnabled,
				'BackupCodesCount' => $iBackupCodesCount,
			]);
		}

		return $aSettings;
	}

    public function UpdateSettings($ShowRecommendationToConfigure)
    {
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

        if ($this->getConfig('ShowRecommendationToConfigure', false))
        {
            $oUser = \Aurora\System\Api::getAuthenticatedUser();
            if (!empty($oUser) && $oUser->isNormalOrTenant())
            {
				$oUser->{$this->GetName() . '::ShowRecommendationToConfigure'} = $ShowRecommendationToConfigure;
				return $oUser->saveAttribute($this->GetName() . '::ShowRecommendationToConfigure');
            }
        }
        return false;
    }

	/**
	 * Obtains user settings. Method is allowed for superadmin only.
	 *
	 * @param int $UserId
	 * @return array|null
	 */
	public function GetUserSettings($UserId)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		if ($this->getConfig('AllowAuthenticatorApp', true))
		{
			$oUser = \Aurora\System\Api::getUserById($UserId);
			if ($oUser instanceof \Aurora\Modules\Core\Classes\User && $oUser->isNormalOrTenant())
			{
				$iWebAuthnKeyCount = (new \Aurora\System\EAV\Query(Classes\WebAuthnKey::class))
					->select(['KeyData'])
					->where(['UserId' => $oUser->EntityId])
					->count()
					->exec();
				return [
					'TwoFactorAuthEnabled' => !empty($oUser->{$this->GetName().'::Secret'}) || $iWebAuthnKeyCount > 0
				];
			}
		}

		return null;
	}

	/**
	 * Disables two factor authentication for specified user. Method is allowed for superadmin only.
	 *
	 * @param int $UserId
	 * @return boolean
	 */
	public function DisableUserTwoFactorAuth($UserId)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		if (!$this->getConfig('AllowAuthenticatorApp', true))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$oUser = \Aurora\System\Api::getUserById($UserId);
		if ($oUser instanceof \Aurora\Modules\Core\Classes\User && $oUser->isNormalOrTenant())
		{
			$oUser->{$this->GetName().'::Secret'} = '';
			$oUser->{$this->GetName().'::IsEncryptedSecret'} = false;

			$oUser->{$this->GetName().'::Challenge'} = '';
			$aWebAuthnKeys = (new \Aurora\System\EAV\Query(Classes\WebAuthnKey::class))
				->select(['Name'])
				->where(['UserId' => $oUser->EntityId])
				->exec();
			$bResult = true;
			foreach ($aWebAuthnKeys as $oWebAuthnKey)
			{
				$bResult = $bResult && $oWebAuthnKey->delete();
			}

			$oUser->{$this->GetName().'::BackupCodes'} = '';
			$oUser->{$this->GetName().'::BackupCodesTimestamp'} = '';
			$bResult = $bResult && \Aurora\Modules\Core\Module::Decorator()->UpdateUserObject($oUser);

			$bResult = $bResult && $this->getUsedDevicesManager()->revokeTrustFromAllDevices($oUser);

			return $bResult;
		}

		return false;
	}

	/**
	 * Verifies user's password and returns Secret and QR-code
	 *
	 * @param string $Password
	 * @return bool|array
	 */
	public function RegisterAuthenticatorAppBegin($Password)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (!$this->getConfig('AllowAuthenticatorApp', true))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		if (empty($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		if (!\Aurora\System\Api::GetModuleDecorator('Core')->VerifyPassword($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$oGoogle = new \PHPGangsta_GoogleAuthenticator();
		$sSecret = '';
		if ($oUser->{$this->GetName().'::Secret'})
		{
			$sSecret = $oUser->{$this->GetName().'::Secret'};
			if ($oUser->{$this->GetName().'::IsEncryptedSecret'})
			{
				$sSecret = \Aurora\System\Utils::DecryptValue($sSecret);
			}
		}
		else
		{
			$sSecret = $oGoogle->createSecret();;
		}
		$sQRCodeName = $oUser->PublicId . "(" . $_SERVER['SERVER_NAME'] . ")";

		return [
			'Secret' => $sSecret,
			'QRcode' => $oGoogle->getQRCodeGoogleUrl($sQRCodeName, $sSecret),
			'Enabled' => $oUser->{$this->GetName().'::Secret'} ? true : false
		];
	}

	/**
	 * Verifies user's Code and saves Secret in case of success
	 *
	 * @param string $Password
	 * @param string $Code
	 * @param string $Secret
	 * @return boolean
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function RegisterAuthenticatorAppFinish($Password, $Code, $Secret)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (!$this->getConfig('AllowAuthenticatorApp', true))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		if (empty($Password) || empty($Code) || empty($Secret))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		if (!\Aurora\System\Api::GetModuleDecorator('Core')->VerifyPassword($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$bResult = false;
		$iClockTolerance = $this->getConfig('ClockTolerance', 2);
		$oGoogle = new \PHPGangsta_GoogleAuthenticator();

		$oStatus = $oGoogle->verifyCode($Secret, $Code, $iClockTolerance);
		if ($oStatus === true)
		{
			$oUser->{$this->GetName().'::Secret'} = \Aurora\System\Utils::EncryptValue($Secret);
			$oUser->{$this->GetName().'::IsEncryptedSecret'} = true;
			\Aurora\Modules\Core\Module::Decorator()->UpdateUserObject($oUser);
			$bResult = true;
		}

		return $bResult;
	}

	/**
	 * Verifies user's Password and disables TwoFactorAuth in case of success
	 *
	 * @param string $Password
	 * @return bool
	 */
	public function DisableAuthenticatorApp($Password)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (!$this->getConfig('AllowAuthenticatorApp', true))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		if (empty($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		if (!\Aurora\System\Api::GetModuleDecorator('Core')->VerifyPassword($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$oUser->{$this->GetName().'::Secret'} = "";
		$oUser->{$this->GetName().'::IsEncryptedSecret'} = false;
		$bResult = \Aurora\Modules\Core\Module::Decorator()->UpdateUserObject($oUser);
		$this->_removeAllDataWhenAllSecondFactorsDisabled($oUser);

		return $bResult;
	}

	/**
	 * Verifies Authenticator code and returns AuthToken in case of success
	 *
	 * @param string $Code
	 * @param int $UserId
	 * @return bool|array
	 * @throws \Aurora\System\Exceptions\ApiException
	 * @throws \Aurora\System\Exceptions\BaseException
	 */
	public function VerifyAuthenticatorAppCode($Code, $Login, $Password)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		if (!$this->getConfig('AllowAuthenticatorApp', true))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		if (empty($Code) || empty($Login)  || empty($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		self::$VerifyState = true;
		$mAuthenticateResult = \Aurora\Modules\Core\Module::Decorator()->Authenticate($Login, $Password);
		self::$VerifyState = false;
		if (!$mAuthenticateResult || !is_array($mAuthenticateResult) || !isset($mAuthenticateResult['token']))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AuthError);
		}

		$oUser = \Aurora\System\Api::getUserById((int) $mAuthenticateResult['id']);
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$mResult = false;
		if ($oUser->{$this->GetName().'::Secret'})
		{
			$sSecret = $oUser->{$this->GetName().'::Secret'};
			if ($oUser->{$this->GetName().'::IsEncryptedSecret'})
			{
				$sSecret = \Aurora\System\Utils::DecryptValue($sSecret);
			}
			$oGoogle = new \PHPGangsta_GoogleAuthenticator();
			$iClockTolerance = $this->getConfig('ClockTolerance', 2);
			$oStatus = $oGoogle->verifyCode($sSecret, $Code, $iClockTolerance);
			if ($oStatus)
			{
				$mResult = \Aurora\Modules\Core\Module::Decorator()->SetAuthDataAndGetAuthToken($mAuthenticateResult);
			}
		}
		else
		{
			throw new \Aurora\System\Exceptions\BaseException(Enums\ErrorCodes::SecretNotSet);
		}

		return $mResult;
	}

	/**
	 * Verifies user's password and returns backup codes generated earlier.
	 *
	 * @param string $Password
	 * @return array|boolean
	 */
    public function GetBackupCodes($Password)
    {
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (!$this->getConfig('AllowBackupCodes', false))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		if (empty($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		if (!\Aurora\System\Api::GetModuleDecorator('Core')->VerifyPassword($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$sBackupCodes = \Aurora\System\Utils::DecryptValue($oUser->{$this->GetName().'::BackupCodes'});
		return [
			'Datetime' => $oUser->{$this->GetName().'::BackupCodesTimestamp'},
			'Codes' => empty($sBackupCodes) ? [] : json_decode($sBackupCodes)
		];
    }

	/**
	 * Verifies user's password, generates backup codes and returns them.
	 *
	 * @param string $Password
	 * @return array|boolean
	 */
    public function GenerateBackupCodes($Password)
    {
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (!$this->getConfig('AllowBackupCodes', false))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		if (empty($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		if (!\Aurora\System\Api::GetModuleDecorator('Core')->VerifyPassword($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$oRecovery = new Recovery();
		$aCodes = $oRecovery
			->setCount(10) // Generate 10 codes
			->setBlocks(2) // Every code must have 2 blocks
			->setChars(4) // Each block must have 4 chars
			->setBlockSeparator(' ')
			->uppercase()
			->toArray();

		$oUser->{$this->GetName().'::BackupCodes'} = \Aurora\System\Utils::EncryptValue(json_encode($aCodes));
		$oUser->{$this->GetName().'::BackupCodesTimestamp'} = time();
		\Aurora\Modules\Core\Module::Decorator()->UpdateUserObject($oUser);

		return [
			'Datetime' => $oUser->{$this->GetName().'::BackupCodesTimestamp'},
			'Codes' => $aCodes,
		];
    }

	public function VerifyBackupCode($BackupCode, $Login, $Password)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		if (!$this->getConfig('AllowBackupCodes', false))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		if (empty($BackupCode) || empty($Login)  || empty($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		self::$VerifyState = true;
		$mAuthenticateResult = \Aurora\Modules\Core\Module::Decorator()->Authenticate($Login, $Password);
		self::$VerifyState = false;
		if (!$mAuthenticateResult || !is_array($mAuthenticateResult) || !isset($mAuthenticateResult['token']))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AuthError);
		}

		$oUser = \Aurora\System\Api::getUserById((int) $mAuthenticateResult['id']);
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$mResult = false;
		$sBackupCodes = \Aurora\System\Utils::DecryptValue($oUser->{$this->GetName().'::BackupCodes'});
		$aBackupCodes = empty($sBackupCodes) ? [] : json_decode($sBackupCodes);
		$sTrimmed = preg_replace('/\s+/', '', $BackupCode);
		$sPrepared = substr_replace($sTrimmed, ' ', 4, 0);
		$index = array_search($sPrepared, $aBackupCodes);
		if ($index !== false)
		{
			$aBackupCodes[$index] = '';
			$oUser->{$this->GetName().'::BackupCodes'} = \Aurora\System\Utils::EncryptValue(json_encode($aBackupCodes));
			\Aurora\Modules\Core\Module::Decorator()->UpdateUserObject($oUser);
			$mResult = \Aurora\Modules\Core\Module::Decorator()->SetAuthDataAndGetAuthToken($mAuthenticateResult);
		}
		return $mResult;
	}

	/**
	 * Checks if User has TwoFactorAuth enabled and return UserId instead of AuthToken
	 *
	 * @param array $aArgs
	 * @param aray $mResult
	 */
	public function onAfterAuthenticate($aArgs, &$mResult)
	{
		if (!self::$VerifyState && $mResult && is_array($mResult) && isset($mResult['token']))
		{
			$oUser = \Aurora\System\Api::getUserById((int) $mResult['id']);
			if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
			{
				$bHasSecurityKey = false;
				if ($this->getConfig('AllowSecurityKeys', false))
				{
					$iWebAuthnKeyCount = (new \Aurora\System\EAV\Query(Classes\WebAuthnKey::class))
						->select(['KeyData'])
						->where(['UserId' => $oUser->EntityId])
						->count()
						->exec();
					$bHasSecurityKey = $iWebAuthnKeyCount > 0;
				}

				$bHasAuthenticatorApp = false;
				if ($this->getConfig('AllowAuthenticatorApp', true))
				{
					$bHasAuthenticatorApp = !!($oUser->{$this->GetName().'::Secret'} !== '');
				}

				$bDeviceTrusted = ($bHasAuthenticatorApp || $bHasAuthenticatorApp) ? $this->getUsedDevicesManager()->checkDeviceAfterAuthenticate($oUser) : false;

				if (($bHasSecurityKey || $bHasAuthenticatorApp) && !$bDeviceTrusted)
				{
					$mResult = [
						'TwoFactorAuth' => [
							'HasAuthenticatorApp' => $bHasAuthenticatorApp,
							'HasSecurityKey' => $bHasSecurityKey,
							'HasBackupCodes' => $this->getConfig('AllowBackupCodes', false) && !empty($oUser->{$this->GetName().'::BackupCodes'})
						]
					];
				}
			}
		}
	}

	/**
	 * Verifies user's password and returns arguments for security key registration.
	 *
	 * @param string $Password
	 * @return array|boolean
	 */
    public function RegisterSecurityKeyBegin($Password)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (!$this->getConfig('AllowSecurityKeys', false))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		if (empty($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		if (!\Aurora\System\Api::GetModuleDecorator('Core')->VerifyPassword($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$oCreateArgs = $this->oWebAuthn->getCreateArgs(
			\base64_encode($oUser->UUID),
			$oUser->PublicId,
			$oUser->PublicId,
			90,
			false,
			'discouraged',
			true,
			[]
		);

		$oCreateArgs->publicKey->user->id = \base64_encode($oCreateArgs->publicKey->user->id->getBinaryString());
		$oCreateArgs->publicKey->challenge = \base64_encode($oCreateArgs->publicKey->challenge->getBinaryString());
		$oUser->{$this->GetName().'::Challenge'} = $oCreateArgs->publicKey->challenge;
		$oUser->saveAttribute($this->GetName().'::Challenge');

		return $oCreateArgs;
	}

	/**
	 * Verifies user's password and finishes security key registration.
	 *
	 * @param array $Attestation
	 * @param string $Password
	 * @return boolean
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
    public function RegisterSecurityKeyFinish($Attestation, $Password)
    {
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (!$this->getConfig('AllowSecurityKeys', false))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		if (empty($Password) || empty($Attestation))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		if (!\Aurora\System\Api::GetModuleDecorator('Core')->VerifyPassword($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$data = $this->oWebAuthn->processCreate(
			\base64_decode($Attestation['clientDataJSON']),
			\base64_decode($Attestation['attestationObject']),
			\base64_decode($oUser->{$this->GetName().'::Challenge'}),
			false
		);
		$data->credentialId = \base64_encode($data->credentialId);
		$data->AAGUID = \base64_encode($data->AAGUID);

		$sEncodedSecurityKeyData = \json_encode($data);
		if ($sEncodedSecurityKeyData === false)
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::UnknownError, null, json_last_error_msg());
		}
		else
		{
			$oWebAuthnKey = new Classes\WebAuthnKey();
			$oWebAuthnKey->UserId = $oUser->EntityId;
			$oWebAuthnKey->KeyData = $sEncodedSecurityKeyData;
			$oWebAuthnKey->CreationDateTime = time();

			return $oWebAuthnKey->save();
		}
	}

	/**
	 * Authenticates user and returns arguments for security key verification.
	 *
	 * @param string $Login
	 * @param string $Password
	 * @return array|boolean
	 */
	public function VerifySecurityKeyBegin($Login, $Password)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		if (!$this->getConfig('AllowSecurityKeys', false))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		self::$VerifyState = true;
		$mAuthenticateResult = \Aurora\Modules\Core\Module::Decorator()->Authenticate($Login, $Password);
		self::$VerifyState = false;
		if (!$mAuthenticateResult || !is_array($mAuthenticateResult) || !isset($mAuthenticateResult['token']))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AuthError);
		}

		$oUser = \Aurora\System\Api::getUserById((int) $mAuthenticateResult['id']);
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$mGetArgs = false;
		$aIds = [];
		$aWebAuthnKeys = (new \Aurora\System\EAV\Query(Classes\WebAuthnKey::class))
			->select(['KeyData'])
			->where(['UserId' => $oUser->EntityId])
			->exec();

		if (is_array($aWebAuthnKeys))
		{
			foreach ($aWebAuthnKeys as $oWebAuthnKey)
			{
				$oKeyData = \json_decode($oWebAuthnKey->KeyData);
				$aIds[] = \base64_decode($oKeyData->credentialId);
			}
		}

		if (count($aIds) > 0)
		{
			$mGetArgs = $this->oWebAuthn->getGetArgs(
				$aIds,
				90
			);
			$mGetArgs->publicKey->challenge = \base64_encode($mGetArgs->publicKey->challenge->getBinaryString());
			if (is_array($mGetArgs->publicKey->allowCredentials))
			{
				foreach ($mGetArgs->publicKey->allowCredentials as $key => $val)
				{
					$val->id = \base64_encode($val->id->getBinaryString());
					$mGetArgs->publicKey->allowCredentials[$key] = $val;
				}
			}

			$oUser->{$this->GetName().'::Challenge'} = $mGetArgs->publicKey->challenge;
			$oUser->saveAttribute($this->GetName().'::Challenge');
		}

		return $mGetArgs;
	}

	/**
	 * Authenticates user and finishes security key verification.
	 *
	 * @param string $Login
	 * @param string $Password
	 * @param array $Attestation
	 * @return boolean
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function VerifySecurityKeyFinish($Login, $Password, $Attestation)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		if (!$this->getConfig('AllowSecurityKeys', false))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		self::$VerifyState = true;
		$mAuthenticateResult = \Aurora\Modules\Core\Module::Decorator()->Authenticate($Login, $Password);
		self::$VerifyState = false;
		if (!$mAuthenticateResult || !is_array($mAuthenticateResult) || !isset($mAuthenticateResult['token']))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AuthError);
		}

		$oUser = \Aurora\System\Api::getUserById((int) $mAuthenticateResult['id']);
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$mResult = true;
		$clientDataJSON = base64_decode($Attestation['clientDataJSON']);
		$authenticatorData = base64_decode($Attestation['authenticatorData']);
		$signature = base64_decode($Attestation['signature']);
		$id = base64_decode($Attestation['id']);
		$credentialPublicKey = null;

		$challenge = \base64_decode($oUser->{$this->GetName().'::Challenge'});

		$aWebAuthnKeys = (new \Aurora\System\EAV\Query(Classes\WebAuthnKey::class))
			->select(['KeyData'])
			->where(['UserId' => $oUser->EntityId])
			->exec();

		$oWebAuthnKey = null;
		if (is_array($aWebAuthnKeys))
		{
			foreach ($aWebAuthnKeys as $oWebAuthnKey)
			{
				$oKeyData = \json_decode($oWebAuthnKey->KeyData);
				if (\base64_decode($oKeyData->credentialId) === $id)
				{
					$credentialPublicKey = $oKeyData->credentialPublicKey;
					break;
				}
			}
		}

		if ($credentialPublicKey !== null)
		{
			try
			{
				// process the get request. throws WebAuthnException if it fails
				$this->oWebAuthn->processGet($clientDataJSON, $authenticatorData, $signature, $credentialPublicKey, $challenge, null, false);
				$mResult = \Aurora\Modules\Core\Module::Decorator()->SetAuthDataAndGetAuthToken($mAuthenticateResult);
				if (isset($oWebAuthnKey))
				{
					$oWebAuthnKey->LastUsageDateTime = time();
					$oWebAuthnKey->saveAttribute('LastUsageDateTime');
				}
			}
			catch (\Exception $oEx)
			{
				$mResult = false;
				throw new \Aurora\System\Exceptions\ApiException(999, $oEx, $oEx->getMessage());
			}
		}

		return $mResult;
	}

	/**
	 * Verifies user's password and changes security key name.
	 *
	 * @param int $KeyId
	 * @param string $NewName
	 * @param string $Password
	 * @return boolean
	 */
	public function UpdateSecurityKeyName($KeyId, $NewName, $Password)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (!$this->getConfig('AllowSecurityKeys', false))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		if (empty($Password) || empty($KeyId) || empty($NewName))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		if (!\Aurora\System\Api::GetModuleDecorator('Core')->VerifyPassword($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$mResult = false;
		$oWebAuthnKey = (new \Aurora\System\EAV\Query(Classes\WebAuthnKey::class))
			->select(['KeyData'])
			->where(
				[
					'UserId' => $oUser->EntityId,
					'EntityId' => $KeyId
				])
			->one()
			->exec();
		if ($oWebAuthnKey instanceof Classes\WebAuthnKey)
		{
			$oWebAuthnKey->Name = $NewName;
			$mResult = $oWebAuthnKey->saveAttribute('Name');
		}
		return $mResult;
	}

	/**
	 * Verifies user's password and removes secutiry key.
	 *
	 * @param int $KeyId
	 * @param string $Password
	 * @return boolean
	 */
	public function DeleteSecurityKey($KeyId, $Password)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (!$this->getConfig('AllowSecurityKeys', false))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		if (empty($Password) || empty($KeyId))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		if (!\Aurora\System\Api::GetModuleDecorator('Core')->VerifyPassword($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$mResult = false;
		$oWebAuthnKey = (new \Aurora\System\EAV\Query(Classes\WebAuthnKey::class))
			->select(['KeyData'])
			->where(
				[
					'UserId' => $oUser->EntityId,
					'EntityId' => $KeyId
				])
			->one()
			->exec();
		if ($oWebAuthnKey instanceof Classes\WebAuthnKey)
		{
			$mResult = $oWebAuthnKey->delete();
			$this->_removeAllDataWhenAllSecondFactorsDisabled($oUser);
		}
		return $mResult;
	}

	/**
	 * Verifies user's password.
	 *
	 * @param string $Password
	 * @return boolean
	 */
	public function VerifyPassword($Password)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (empty($Password))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		return \Aurora\System\Api::GetModuleDecorator('Core')->VerifyPassword($Password);
	}

	public function EntryVerifySecurityKey()
	{
		$oModuleManager = \Aurora\System\Api::GetModuleManager();
		$sTheme = $oModuleManager->getModuleConfigValue('CoreWebclient', 'Theme');

		$oHttp = \MailSo\Base\Http::SingletonInstance();
		$sLogin = $oHttp->GetQuery('login', '');
		$sPassword = $oHttp->GetQuery('password', '');
		$sPackageName = $oHttp->GetQuery('package_name', '');
		if (empty($sLogin) || empty($sPassword))
		{
			return '';
		}

		$oGetArgs = false;
		$sError = false;
		try {
			$oGetArgs = self::Decorator()->VerifySecurityKeyBegin($sLogin, $sPassword);
		}
		catch (\Exception $oEx) {
			$sError = $oEx->getCode() . ': ' . $oEx->getMessage();
		}
		$sResult = \file_get_contents($this->GetPath().'/templates/EntryVerifySecurityKey.html');
		$sResult = \strtr($sResult, array(
			'{{GetArgs}}' => \Aurora\System\Managers\Response::GetJsonFromObject(null, $oGetArgs),
			'{{PackageName}}' => $sPackageName,
			'{{Error}}' => $sError,
			'{{Description}}' => $this->i18N('HINT_INSERT_TOUCH_SECURITY_KEY'),
			'{{Theme}}' => $sTheme,
		));
		\Aurora\Modules\CoreWebclient\Module::Decorator()->SetHtmlOutputHeaders();
		@header('Cache-Control: no-cache', true);
		return $sResult;
	}

	public function EntryAssetlinks()
	{
		@header('Content-Type: application/json; charset=utf-8');
		@header('Cache-Control: no-cache', true);

		$sPath = __DIR__ . '/assets/assetlinks.json';
		$sDistPath = __DIR__ . '/assets/assetlinks.dist.json';

		if (file_exists($sPath))
		{
			$sFileContent = file_get_contents($sPath);
		}
		else if (file_exists($sDistPath)) {
			$sFileContent = file_get_contents($sDistPath);
		}
		else {
			$sFileContent = "[]";
		}

		echo $sFileContent;
	}

	public function TrustDevice($Login, $Password, $DeviceId, $DeviceName)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		self::$VerifyState = true;
		$mAuthenticateResult = \Aurora\Modules\Core\Module::Decorator()->Authenticate($Login, $Password);
		self::$VerifyState = false;
		if (!$mAuthenticateResult || !is_array($mAuthenticateResult) || !isset($mAuthenticateResult['token']))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AuthError);
		}

		$oUser = \Aurora\System\Api::getUserById((int) $mAuthenticateResult['id']);
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		return $this->getUsedDevicesManager()->trustDevice($oUser->EntityId, $DeviceId, $DeviceName);
	}

	public function SaveDevice($DeviceId, $DeviceName)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$oUser = \Aurora\System\Api::getAuthenticatedUser();

		return $this->getUsedDevicesManager()->saveDevice($oUser->EntityId, $DeviceId, $DeviceName, \Aurora\System\Api::getAuthToken());
	}

	public function GetUsedDevices()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (!$this->getConfig('AllowUsedDevices', false))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		return $this->getUsedDevicesManager()->getAllDevices($oUser->EntityId);
	}

	public function RevokeTrustFromAllDevices()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		if (!$this->getUsedDevicesManager()->isTrustedDevicesEnabled())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		return $this->getUsedDevicesManager()->revokeTrustFromAllDevices($oUser);
	}

	public function onBeforeLogout($aArgs, &$mResult)
	{
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oUser instanceof \Aurora\Modules\Core\Classes\User && $oUser->isNormalOrTenant())
		{
			$oUsedDevice = $this->getUsedDevicesManager()->getDeviceByAuthToken($oUser->EntityId, \Aurora\System\Api::getAuthToken());
			if ($oUsedDevice)
			{
				$oUsedDevice->AuthToken = '';
				$oUsedDevice->save();
			}
		}
	}

	public function LogoutFromDevice($DeviceId)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		if (empty($DeviceId))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		$oUsedDevice = $this->getUsedDevicesManager()->getDevice($oUser->EntityId, $DeviceId);
		if ($oUsedDevice && !empty($oUsedDevice->AuthToken))
		{
			\Aurora\System\Api::UserSession()->Delete($oUsedDevice->AuthToken);
			$oUsedDevice->AuthToken = '';
			$oUsedDevice->TrustTillDateTime = $oUsedDevice->CreationDateTime; // revoke trust
			$oUsedDevice->save();
		}
		return true;
	}

	public function RemoveDevice($DeviceId)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!($oUser instanceof \Aurora\Modules\Core\Classes\User) || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied);
		}

		if (empty($DeviceId))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		$oUsedDevice = $this->getUsedDevicesManager()->getDevice($oUser->EntityId, $DeviceId);
		if ($oUsedDevice)
		{
			\Aurora\System\Api::UserSession()->Delete($oUsedDevice->AuthToken);
			$oUsedDevice->delete();
		}
		return true;
	}

	protected function _getWebAuthKeysInfo($oUser)
	{
		$aWebAuthKeysInfo = [];

		if ($oUser instanceof \Aurora\Modules\Core\Classes\User && $oUser->isNormalOrTenant())
		{
			$aWebAuthnKeys = (new \Aurora\System\EAV\Query(Classes\WebAuthnKey::class))
				->select(['Name'])
				->where(['UserId' => $oUser->EntityId])
				->exec();
			foreach ($aWebAuthnKeys as $oWebAuthnKey)
			{
				$aWebAuthKeysInfo[] = [
					$oWebAuthnKey->EntityId,
					$oWebAuthnKey->Name
				];
			}
		}

		return $aWebAuthKeysInfo;
	}

	protected function _removeAllDataWhenAllSecondFactorsDisabled($oUser)
	{
		$iWebAuthnKeyCount = (new \Aurora\System\EAV\Query(Classes\WebAuthnKey::class))
			->select(['KeyData'])
			->where(['UserId' => $oUser->EntityId])
			->count()
			->exec();
		if (empty($oUser->{$this->GetName().'::Secret'}) && $iWebAuthnKeyCount === 0)
		{
			$oUser->{$this->GetName().'::BackupCodes'} = '';
			$oUser->{$this->GetName().'::BackupCodesTimestamp'} = '';
			\Aurora\Modules\Core\Module::Decorator()->UpdateUserObject($oUser);

			$this->getUsedDevicesManager()->revokeTrustFromAllDevices($oUser);
		}
	}
}
