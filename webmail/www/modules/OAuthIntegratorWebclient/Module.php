<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\OAuthIntegratorWebclient;

/**
 * Brings oAuth support into Aurora platform.
 *
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @internal
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractWebclientModule
{
	public $oManager = null;

	/***** private functions *****/
	/**
	 * Initializes module.
	 *
	 * @ignore
	 */
	public function init()
	{
		include_once __DIR__.'/Classes/OAuthClient/http.php';
		include_once __DIR__.'/Classes/OAuthClient/oauth_client.php';

		$this->aErrors = [
			Enums\ErrorCodes::ServiceNotAllowed			=> $this->i18N('ERROR_SERVICE_NOT_ALLOWED'),
			Enums\ErrorCodes::AccountNotAllowedToLogIn	=> $this->i18N('ERROR_ACCOUNT_NOT_ALLOWED'),
			Enums\ErrorCodes::AccountAlreadyConnected	=> $this->i18N('ERROR_ACCOUNT_ALREADY_CONNECTED'),
		];

		$this->oManager = new Manager($this);

		$this->AddEntry('oauth', 'OAuthIntegratorEntry');
		$this->includeTemplate('StandardLoginFormWebclient_LoginView', 'Login-After', 'templates/SignInButtonsView.html', self::GetName());
		$this->includeTemplate('StandardRegisterFormWebclient_RegisterView', 'Register-After', 'templates/SignInButtonsView.html', self::GetName());
		$this->subscribeEvent('Core::DeleteUser::after', array($this, 'onAfterDeleteUser'));
		$this->subscribeEvent('Core::GetAccounts', array($this, 'onGetAccounts'));

		$this->denyMethodsCallByWebApi([
			'GetAccessToken'
		]);
	}

	/**
	 * Deletes all oauth accounts which are owened by the specified user.
	 *
	 * @ignore
	 * @param int $iUserId User identifier.
	 */
	public function onAfterDeleteUser($aArgs, &$mResult)
	{
		if ($mResult)
		{
			$this->oManager->deleteAccountByUserId($aArgs['UserId']);
		}
	}

	/**
	 *
	 * @param array $aArgs
	 * @param array $aResult
	 */
	public function onGetAccounts($aArgs, &$aResult)
	{
		$aUserInfo = \Aurora\System\Api::getAuthenticatedUserInfo($aArgs['AuthToken']);
		if (isset($aUserInfo['userId']))
		{
			$iUserId = $aUserInfo['userId'];
			$mAccounts = $this->oManager->getAccounts($iUserId);
			if (\is_array($mAccounts))
			{
				foreach ($mAccounts as $oAccount) {
					$aResult[] = array(
						'Id' => $oAccount->EntityId,
						'UUID' => $oAccount->UUID,
						'Type' => $oAccount->getName(),
						'Email' => $oAccount->Email
					);
				}
			}
		}
	}
	/***** private functions *****/

	/***** public functions *****/
	/**
	 * @ignore
	 */
	public function OAuthIntegratorEntry()
	{
		$mResult = false;
		$sOAuthArg = $this->oHttp->GetQuery('oauth', '');
		$sOAuthArg = \explode('-', $sOAuthArg);

		if (isset($sOAuthArg[1]) && $sOAuthArg[1] === 'connect')
		{
			$aArgs['Service'] = $sOAuthArg[0];
			$this->broadcastEvent(
				'ResetAccessToken',
				$aArgs,
				$mResult
			);
			$mResult = false;
			setcookie('oauth-redirect', 'connect');
			\Aurora\System\Api::Location2('./?oauth=' . $sOAuthArg[0]);
			return true;
		}

		$aArgs = array(
			'Service' => $this->oHttp->GetQuery('oauth', '')
		);

		$this->broadcastEvent(
			'OAuthIntegratorAction',
			$aArgs,
			$mResult
		);

		$sError = $this->oHttp->GetQuery('error', null);
		if (isset($sError))
		{
			if (isset($_COOKIE["oauth-redirect"]))
			{
				$sOAuthIntegratorRedirect = $_COOKIE["oauth-redirect"];
				$sInvitationLinkHash =  isset($_COOKIE["InvitationLinkHash"]) ? $_COOKIE["InvitationLinkHash"] : null;
				if ($sOAuthIntegratorRedirect === 'register' && isset($sInvitationLinkHash))
				{

					\Aurora\System\Api::Location2(
						'./#register/' . $sInvitationLinkHash
					);
				}

			}
		}
		if (false !== $mResult && \is_array($mResult) && !isset($mResult['error']))
		{
			$iAuthUserId = isset($_COOKIE[\Aurora\System\Application::AUTH_TOKEN_KEY]) ? \Aurora\System\Api::getAuthenticatedUserId($_COOKIE[\Aurora\System\Application::AUTH_TOKEN_KEY]) : null;

			$oUser = null;
			$sOAuthIntegratorRedirect = 'login';
			if (isset($_COOKIE["oauth-redirect"]))
			{
				$sOAuthIntegratorRedirect = $_COOKIE["oauth-redirect"];
				@\setcookie('oauth-redirect', null, \strtotime('-1 hour'), \Aurora\System\Api::getCookiePath(),
						null, \Aurora\System\Api::getCookieSecure());
			}

			$oOAuthAccount = new Classes\Account(self::GetName());
			$oOAuthAccount->Type = $mResult['type'];
			$oOAuthAccount->AccessToken = isset($mResult['access_token']) ? $mResult['access_token'] : '';
			$oOAuthAccount->RefreshToken = isset($mResult['refresh_token']) ? $mResult['refresh_token'] : '';
			$oOAuthAccount->IdSocial = $mResult['id'];
			$oOAuthAccount->Name = $mResult['name'];
			$oOAuthAccount->Email = $mResult['email'];

			$oAccountOld = $this->oManager->getAccountById($oOAuthAccount->IdSocial, $oOAuthAccount->Type);
			if ($oAccountOld && !$oAccountOld->issetScope('mail'))
			{
				if ($sOAuthIntegratorRedirect === 'register')
				{
					\Aurora\System\Api::Location2(
						'./?error=' . Enums\ErrorCodes::AccountAlreadyConnected . '&module=' . self::GetName()
					);
				}

				if (!$oAccountOld->issetScope('auth') && $sOAuthIntegratorRedirect !== 'connect')
				{
					\Aurora\System\Api::Location2(
						'./?error=' . Enums\ErrorCodes::AccountNotAllowedToLogIn . '&module=' . self::GetName()
					);
				}

				$oOAuthAccount->setScopes(
					$mResult['scopes']
				);
				$oOAuthAccount->EntityId = $oAccountOld->EntityId;
				$oOAuthAccount->IdUser = $oAccountOld->IdUser;
				$this->oManager->updateAccount($oOAuthAccount);

				$oUser = \Aurora\Modules\Core\Module::Decorator()->GetUserUnchecked($oOAuthAccount->IdUser);
			}
			else
			{
				if ($iAuthUserId)
				{
					$aArgs = array(
						'UserName' => $mResult['name'],
						'UserId' => $iAuthUserId
					);
					$this->broadcastEvent(
						'CreateAccount',
						$aArgs,
						$oUser
					);
				}

				$aArgs = array();
				$this->broadcastEvent(
					'CreateOAuthAccount',
					$aArgs,
					$oUser
				);

				if (!($oUser instanceOf \Aurora\Modules\Core\Classes\User)  &&
						($sOAuthIntegratorRedirect === 'register' || $this->getConfig('AllowNewUsersRegister', false)))
				{
					$bPrevState = \Aurora\System\Api::skipCheckUserRole(true);

					try
					{
						$iUserId = \Aurora\Modules\Core\Module::Decorator()->CreateUser(0, $oOAuthAccount->Email);
						if ($iUserId)
						{
							$oUser = \Aurora\Modules\Core\Module::Decorator()->GetUserUnchecked($iUserId);
						}
					}
					catch (\Aurora\System\Exceptions\ApiException $oException)
					{
						if ($oException->getCode() === \Aurora\System\Notifications::UserAlreadyExists)
						{
							\Aurora\System\Api::Location2(
								'./?error=' . Enums\ErrorCodes::AccountAlreadyConnected . '&module=' . self::GetName()
							);
						}
					}

					\Aurora\System\Api::skipCheckUserRole($bPrevState);
				}

				if ($oUser instanceOf \Aurora\Modules\Core\Classes\User)
				{
					$oOAuthAccount->IdUser = $oUser->EntityId;
					$oOAuthAccount->setScopes($mResult['scopes']);
					$this->oManager->createAccount($oOAuthAccount);
				}
			}

			if ($sOAuthIntegratorRedirect === 'login' || $sOAuthIntegratorRedirect === 'register')
			{
				if ($oUser)
				{
					$sAuthToken = \Aurora\System\Api::UserSession()->Set(
						\Aurora\System\UserSession::getTokenData($oOAuthAccount, true),
						\time() + 60 * 60 * 24 * 30
					);
					@\setcookie(\Aurora\System\Application::AUTH_TOKEN_KEY, $sAuthToken, \strtotime('+30 days'),
							\Aurora\System\Api::getCookiePath(), null, \Aurora\System\Api::getCookieSecure());

					//this will store user data in static variable of Api class for later usage
					\Aurora\System\Api::getAuthenticatedUser($sAuthToken);

					if ($this->oHttp->GetQuery('mobile', '0') === '1')
					{
						return json_encode(
							array(
								'AuthToken' => $sAuthToken
							)
						);
					}
					else
					{
						\Aurora\System\Api::Location2('./');
					}
				}
				else
				{
					\Aurora\System\Api::Location2(
						'./?error=' . Enums\ErrorCodes::AccountNotAllowedToLogIn . '&module=' . self::GetName()
					);
				}
			}
			else
			{
				$sResult = $mResult !== false ? \json_encode($mResult) : 'false';
				$sErrorCode = '';

				if ($oUser && $iAuthUserId && $oUser->EntityId !== $iAuthUserId)
				{
					$sResult = 'false';
					$sErrorCode = Enums\ErrorCodes::AccountAlreadyConnected;
				}

				self::EchoJsCallback($mResult['type'], $sResult, $sErrorCode);
			}
		}
		else
		{
			self::EchoJsCallback($mResult['type'], 'false', '');
		}
	}

	protected static function EchoJsCallback($sType, $sResult, $sErrorCode)
	{
		echo
		"<script>"
			.	" try {"
			.		"if (typeof(window.opener.".$sType."ConnectCallback) !== 'undefined') {"
			.			"window.opener.".$sType."ConnectCallback(".$sResult . ", '".$sErrorCode."','".self::GetName()."');"
			.		"}"
			.	" }"
			.	" finally  {"
			.		"window.close();"
			.	" }"
		. "</script>";
		exit;
	}

	/**
	 * Returns oauth account with specified type.
	 *
	 * @param string $Type Type of oauth account.
	 * @return \Aurora\Modules\OAuthIntegratorWebclient\Classes\Account
	 */
	public function GetAccount($Type, $Email = '')
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		return $this->oManager->getAccount(
			\Aurora\System\Api::getAuthenticatedUserId(),
			$Type,
			$Email
		);
	}

	/**
	 * Updates oauth acount.
	 *
	 * @param \Aurora\Modules\OAuthIntegratorWebclient\Classes\Account $oAccount Oauth account.
	 * @return boolean
	 */
	public function UpdateAccount(\Aurora\Modules\OAuthIntegratorWebclient\Classes\Account $oAccount)
	{
		return $this->oManager->updateAccount($oAccount);
	}
	/***** public functions *****/

	/***** public functions might be called with web API *****/
	/**
	 * Returns all oauth services names.
	 *
	 * @return array
	 */
	public function GetServices()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);
	}

	/**
	 * Returns all oauth services settings for authenticated user.
	 *
	 * @return array
	 */
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		$aSettings = array();

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!empty($oUser) && $oUser->Role === \Aurora\System\Enums\UserRole::SuperAdmin)
		{
			$aArgs = array();
			$aServices = array();
			$this->broadcastEvent(
				'GetServicesSettings',
				$aArgs,
				$aServices
			);
			$aSettings['Services'] = $aServices;
		}

		if (!empty($oUser) && $oUser->isNormalOrTenant())
		{
			$aSettings['AuthModuleName'] = $this->getConfig('AuthModuleName');
			$aSettings['OnlyPasswordForAccountCreate'] = $this->getConfig('OnlyPasswordForAccountCreate');
		}

		return $aSettings;
	}

	/**
	 * Updates all oauth services settings.
	 *
	 * @param array $Services Array with services settings passed by reference.
	 *
	 * @return boolean
	 */
	public function UpdateSettings($Services)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::TenantAdmin);

		$aArgs = array(
			'Services' => $Services
		);
		$this->broadcastEvent(
			'UpdateServicesSettings',
			$aArgs
		);

		return true;
	}

	/**
	 * Get all oauth accounts.
	 *
	 * @return array
	 */
	public function GetAccounts()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$UserId = \Aurora\System\Api::getAuthenticatedUserId();
		$aResult = array();
		$mAccounts = $this->oManager->getAccounts($UserId);
		if (\is_array($mAccounts))
		{
			foreach ($mAccounts as $oAccount) 
			{
				if (!$oAccount->issetScope('mail'))
				{
					$aResult[] = array(
						'Id' => $oAccount->EntityId,
						'UUID' => $oAccount->UUID,
						'Type' => $oAccount->Type,
						'Email' => $oAccount->Email,
						'Name' => $oAccount->Name,
						'Scopes' => $oAccount->Scopes,
					);
				}
			}
		}
		return $aResult;
	}

	/**
	 * Deletes oauth account with specified type.
	 *
	 * @param string $Type Type of oauth account.
	 * @return boolean
	 */
	public function DeleteAccount($Type, $Email = '')
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$aArgs = [
			'Service' => $Type,
			'Email' => $Email
		];
		$mResult = false;
		$this->broadcastEvent(
			'ResetAccessToken',
			$aArgs,
			$mResult
		);
		return $this->oManager->deleteAccount(
			\Aurora\System\Api::getAuthenticatedUserId(),
			$Type,
			$Email
		);
	}

	public function GetAccessToken($sType, $sEmail)
	{
		$mResult = false;
		$oAccount = $this->GetAccount($sType, $sEmail);
		if ($oAccount)
		{
			$aArgs = [
				'Service' => $sType,
				'Account' => $oAccount
			];
			$this->broadcastEvent(
				'GetAccessToken',
				$aArgs,
				$mResult
			);
		}

		return $mResult;
	}

	public function CreateMailAccount($OAuthAccountData)
	{
		$UserId = \Aurora\Api::getAuthenticatedUserId();
		$FriendlyName = $OAuthAccountData['name'];
		$Email = $OAuthAccountData['email'];
		$IncomingLogin = $OAuthAccountData['email'];

		$IncomingPassword = '';
		$mResult = \Aurora\Modules\Mail\Module::Decorator()->CreateAccount($UserId, $FriendlyName, $Email, $IncomingLogin, $IncomingPassword, null, $OAuthAccountData['type']);

		if ($mResult instanceof \Aurora\Modules\Mail\Classes\Account)
		{
			$oResException = \Aurora\Modules\Mail\Module::getInstance()->getMailManager()->validateAccountConnection($mResult, false);
			if ($oResException instanceof \Exception)
			{
				\Aurora\Modules\Mail\Module::Decorator()->DeleteAccount($mResult->EntityId);
				throw new \Aurora\System\Exceptions\ApiException(0, $oResException, $this->i18N('ERROR_ACCOUNT_IMAP_VALIDATION_FAILED'));
			}
		}
		return $mResult;
	}
	/***** public functions might be called with web API *****/
}
