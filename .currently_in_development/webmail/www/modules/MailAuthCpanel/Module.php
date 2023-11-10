<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\MailAuthCpanel;

/**
 * This module allows cPanel user to Access Webmail from Email Accounts screen.
 * 
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	protected $aRequireModules = array(
		'Mail'
	);

	public $oApiMailManager = null;
	public $oApiAccountsManager = null;
	public $oApiServersManager = null;
	
	/**
	 * Initializes MailAuthCpanel Module.
	 * 
	 * @ignore
	 */
	public function init() {}
	
	/**
	 * Attempts to authorize user via mail account with specified credentials.
	 * 
	 * @ignore
	 * @param array $aArgs Credentials.
	 * @param array|boolean $mResult List of results values.
	 * @return boolean
	 */
	protected function OnLogin($aArgs, &$mResult)
	{
		$bResult = false;
		$oServer = null;
		$iUserId = 0;

		$aLoginParts = explode('/', $aArgs['Login']);
		if (!is_array($aLoginParts) || $aLoginParts[0] == '')
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}
		$aArgs['Email'] = $aLoginParts[0];
		$oAccount = \Aurora\System\Api::getModule('Mail')->getAccountsManager()->getAccountUsedToAuthorize($aArgs['Email']);

		$bNewAccount = false;
		$bAutocreateMailAccountOnNewUserFirstLogin = \Aurora\Modules\Mail\Module::Decorator()->getConfig('AutocreateMailAccountOnNewUserFirstLogin', false);

		if ($bAutocreateMailAccountOnNewUserFirstLogin && !$oAccount)
		{
			$sEmail = $aArgs['Email'];
			$sDomain = \MailSo\Base\Utils::GetDomainFromEmail($sEmail);
			$oServer = \Aurora\System\Api::getModule('Mail')->getServersManager()->GetServerByDomain(strtolower($sDomain));
			if (!$oServer)
			{
				$oServer = \Aurora\System\Api::getModule('Mail')->getServersManager()->GetServerByDomain('*');
			}
			if ($oServer)
			{
				$oAccount = new \Aurora\Modules\Mail\Classes\Account(self::GetName());
				$oAccount->Email = $aArgs['Email'];
				$oAccount->IncomingLogin = $aArgs['Login'];
				$oAccount->setPassword($aArgs['Password']);
				$oAccount->ServerId = $oServer->EntityId;
				$bNewAccount = true;
			}
		}

		if ($oAccount instanceof \Aurora\Modules\Mail\Classes\Account)
		{
			try
			{
				if ($bAutocreateMailAccountOnNewUserFirstLogin || !$bNewAccount)
				{
					$bNeedToUpdatePasswordOrLogin = $aArgs['Password'] !== $oAccount->getPassword() || $aArgs['Login'] !== $oAccount->IncomingLogin;
					$oAccount->IncomingLogin = $aArgs['Login'];
					$oAccount->setPassword($aArgs['Password']);

					\Aurora\System\Api::getModule('Mail')->getMailManager()->validateAccountConnection($oAccount);

					if ($bNeedToUpdatePasswordOrLogin)
					{
						\Aurora\System\Api::getModule('Mail')->getAccountsManager()->updateAccount($oAccount);
					}

					$bResult =  true;
				}

				if ($bAutocreateMailAccountOnNewUserFirstLogin && $bNewAccount)
				{
					$oUser = null;
					$aSubArgs = array(
						'UserName' => $sEmail,
						'Email' => $sEmail,
						'UserId' => $iUserId
					);
					$this->broadcastEvent(
						'CreateAccount',
						$aSubArgs,
						$oUser
					);
					if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
					{
						$iUserId = $oUser->EntityId;
						$bPrevState = \Aurora\System\Api::skipCheckUserRole(true);
						$oAccount = \Aurora\Modules\Mail\Module::Decorator()->CreateAccount(
							$iUserId,
							$sEmail,
							$sEmail,
							$aArgs['Login'],
							$aArgs['Password'],
							array('ServerId' => $oServer->EntityId)
						);
						\Aurora\System\Api::skipCheckUserRole($bPrevState);
						if ($oAccount)
						{
							$oAccount->UseToAuthorize = true;
							$oAccount->UseThreading = $oServer->EnableThreading;
							$bResult = \Aurora\System\Api::getModule('Mail')->getAccountsManager()->updateAccount($oAccount);
						}
						else
						{
							$bResult = false;
						}
					}
				}

				if ($bResult)
				{
					$mResult = \Aurora\System\UserSession::getTokenData($oAccount, $aArgs['SignMe']);
				}
			}
			catch (\Aurora\System\Exceptions\ApiException $oException)
			{
				throw $oException;
			}
			catch (\Exception $oException) {}
		}

		return $bResult;
	}

	/**
	 * Call onLogin method, gets responses from them and returns AuthToken.
	 *
	 * @param string $Login Account login.
	 * @param string $Password Account passwors.
	 * @param string $Email Account email.
	 * @param bool $SignMe Indicates if it is necessary to remember user between sessions.
	 * @return array
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function Login($Login, $Password, $SignMe = false)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		$mResult = false;

		$aArgs = array (
			'Login' => $Login,
			'Password' => $Password,
			'SignMe' => $SignMe
		);
		$this->OnLogin(
			$aArgs,
			$mResult
		);

		if (is_array($mResult))
		{
			$iTime = $SignMe ? 0 : time() + 60 * 60 * 24 * 30;
			$sAuthToken = \Aurora\System\Api::UserSession()->Set($mResult, $iTime);

			\Aurora\System\Api::LogEvent('login-success: ' . $Login, self::GetName());
			return array(
				'AuthToken' => $sAuthToken
			);
		}

		\Aurora\System\Api::LogEvent('login-failed: ' . $Login, self::GetName());
		if (!is_writable(\Aurora\System\Api::DataPath()))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::SystemNotConfigured);
		}
		throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AuthError);
	}

}
