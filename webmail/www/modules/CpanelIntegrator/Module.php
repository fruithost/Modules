<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\CpanelIntegrator;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	const UAPI = '3';
	private $oCpanel = null;
	public $oMailModule = null;

	public function init()
	{
		$this->subscribeEvent('MailSignup::Signup::before', [$this, 'onAfterSignup']);
		$this->subscribeEvent('Mail::Account::ToResponseArray', array($this, 'onMailAccountToResponseArray'));
		$this->subscribeEvent('Mail::ChangeAccountPassword', array($this, 'onChangeAccountPassword'));
	}

	public function getCpanel()
	{
		if (!$this->oCpanel)
		{
			$sHost = $this->getConfig('CpanelHost', '');
			$sPort = $this->getConfig('CpanelPort', '');
			$sUser = $this->getConfig('CpanelUser', '');
			$sPassword = $this->getConfig('CpanelPassword', '');

			$this->oCpanel = new \Gufy\CpanelPhp\Cpanel([
				'host'		=> "https://" . $sHost . ":" . $sPort,
				'username'	=> $sUser,
				'auth_type'	=> 'password',
				'password'	=> $sPassword,
			]);
		}

		return $this->oCpanel;
	}

	/**
	 * Creates account with credentials specified in registration form
	 *
	 * @param array $aArgs New account credentials.
	 * @param type $mResult Is passed by reference.
	 */
	public function onAfterSignup($aArgs, &$mResult)
	{
		try
		{
			$oCpanel = $this->getCpanel();
		}
		catch(\Exception $oException)
		{}
		if (isset($aArgs['Login']) && isset($aArgs['Password'])
			&& !empty(trim($aArgs['Password'])) && !empty(trim($aArgs['Login']))
			&& $oCpanel)
		{
			$bResult = false;
			$oResult = null;
			$sLogin = trim($aArgs['Login']);
			$sPassword = trim($aArgs['Password']);
			$sFriendlyName = isset($aArgs['Name']) ? trim($aArgs['Name']) : '';
			$bSignMe = isset($aArgs['SignMe']) ? (bool) $aArgs['SignMe'] : false;
			$bPrevState = \Aurora\System\Api::skipCheckUserRole(true);
			$iUserId = \Aurora\Modules\Core\Module::Decorator()->CreateUser(0, $sLogin);
			$oUser = \Aurora\System\Api::getUserById((int) $iUserId);
			if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
			{
				$sDomain = \MailSo\Base\Utils::GetDomainFromEmail($oUser->PublicId);
				if (!empty($sDomain))
				{
					$iQuota = (int) $this->getConfig('UserDefaultQuotaMB', 1);
					try
					{
						$sResult = $oCpanel->execute_action(self::UAPI, 'Email', 'add_pop', $oCpanel->getUsername(),
							[
								'email'	=> $sLogin,
								'password'	=> $sPassword,
								'quota'	=> $iQuota,
								'domain'	=> $sDomain
							]
						);
						$oResult = \json_decode($sResult);
					}
					catch(\Exception $oException)
					{}
					if ($oResult && isset($oResult->result) && isset($oResult->result->data) && !empty($oResult->result->data))
					{
						try
						{
							$bPrevState = \Aurora\System\Api::skipCheckUserRole(true);
							$oAccount = \Aurora\Modules\Mail\Module::Decorator()->CreateAccount($oUser->EntityId, $sFriendlyName, $sLogin, $sLogin, $sPassword);
							\Aurora\System\Api::skipCheckUserRole($bPrevState);
							if ($oAccount instanceof \Aurora\Modules\Mail\Classes\Account)
							{
								$bResult = true;
								$iTime = $bSignMe ? 0 : time();
								$sAuthToken = \Aurora\System\Api::UserSession()->Set(
									[
										'token'		=> 'auth',
										'sign-me'		=> $bSignMe,
										'id'			=> $oAccount->IdUser,
										'account'		=> $oAccount->EntityId,
										'account_type'	=> $oAccount->getName()
									], $iTime);
								$mResult = ['AuthToken' => $sAuthToken];
							}
						}
						catch (\Exception $oException)
						{
							if ($oException instanceof \Aurora\Modules\Mail\Exceptions\Exception &&
								$oException->getCode() === \Aurora\Modules\Mail\Enums\ErrorCodes::CannotLoginCredentialsIncorrect)
							{
								\Aurora\Modules\Core\Module::Decorator()->DeleteUser($oUser->EntityId);
							}
							throw $oException;
						}
					}
					else if ($oResult && isset($oResult->result)
						&& isset($oResult->result->errors) && !empty($oResult->result->errors)
						&& isset($oResult->result->errors[0]))
					{
						//If Account wasn't created - delete user
						\Aurora\Modules\Core\Module::Decorator()->DeleteUser($oUser->EntityId);
						throw new \Exception($oResult->result->errors[0]);
					}
				}
			}
			if (!$bResult)
			{	//If Account wasn't created - delete user
				\Aurora\Modules\Core\Module::Decorator()->DeleteUser($oUser->EntityId);
			}
			\Aurora\System\Api::skipCheckUserRole($bPrevState);
		}

		return true; // break subscriptions to prevent account creation in other modules
	}

	/**
	 * Adds to account response array information about if allowed to change the password for this account.
	 * @param array $aArguments
	 * @param mixed $mResult
	 */
	public function onMailAccountToResponseArray($aArguments, &$mResult)
	{
		$oAccount = $aArguments['Account'];

		if ($oAccount && $this->checkCanChangePassword($oAccount))
		{
			if (!isset($mResult['Extend']) || !is_array($mResult['Extend']))
			{
				$mResult['Extend'] = [];
			}
			$mResult['Extend']['AllowChangePasswordOnMailServer'] = true;
		}
	}

	/**
	 * Tries to change password for account if allowed.
	 * @param array $aArguments
	 * @param mixed $mResult
	 */
	public function onChangeAccountPassword($aArguments, &$mResult)
	{
		$bPasswordChanged = false;
		$bBreakSubscriptions = false;
		
		$oAccount = $aArguments['Account'];
		if ($oAccount && $this->checkCanChangePassword($oAccount) && $oAccount->getPassword() === $aArguments['CurrentPassword'])
		{
			$bPasswordChanged = $this->changePassword($oAccount, $aArguments['NewPassword']);
			$bBreakSubscriptions = true; // break if Cpanel plugin tries to change password in this account. 
		}
		
		if (is_array($mResult))
		{
			$mResult['AccountPasswordChanged'] = $mResult['AccountPasswordChanged'] || $bPasswordChanged;
		}
		
		return $bBreakSubscriptions;
	}

	/**
	 * Checks if allowed to change password for account.
	 * @param \Aurora\Modules\Mail\Classes\Account $oAccount
	 * @return bool
	 */
	protected function checkCanChangePassword($oAccount)
	{
		$bFound = in_array('*', $this->getConfig('SupportedServers', array()));

		if (!$bFound)
		{
			$oServer = $oAccount->getServer();

			if ($oServer && in_array($oServer->IncomingServer, $this->getConfig('SupportedServers')))
			{
				$bFound = true;
			}
		}
		return $bFound;
	}

	/**
	 * Tries to change password for account.
	 * @param \Aurora\Modules\Mail\Classes\Account $oAccount
	 * @param string $sPassword
	 * @return boolean
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	protected function changePassword($oAccount, $sPassword)
	{
		$bResult = false;
		if (0 < strlen($oAccount->IncomingPassword) && $oAccount->IncomingPassword !== $sPassword )
		{
			$cpanel_host = $this->getConfig('CpanelHost', '');
			$cpanel_user = $this->getConfig('CpanelUser','');
			$cpanel_pass = $this->getConfig('CpanelPassword','');
			$cpanel_user0 = null;

			$email_user = urlencode($oAccount->Email);
			$email_pass = urlencode($sPassword);
			list($email_login, $email_domain) = explode('@', $oAccount->Email);

			if ($cpanel_user == "root")
			{
				$query = "https://".$cpanel_host.":2087/json-api/listaccts?api.version=1&searchtype=domain&search=".$email_domain;

				$curl = curl_init();
				curl_setopt($curl, CURLOPT_SSL_VERIFYPEER,0);
				curl_setopt($curl, CURLOPT_SSL_VERIFYHOST,0);
				curl_setopt($curl, CURLOPT_HEADER,0);
				curl_setopt($curl, CURLOPT_RETURNTRANSFER,1);
				$header[0] = "Authorization: Basic " . base64_encode($cpanel_user.":".$cpanel_pass) . "\n\r";
				curl_setopt($curl, CURLOPT_HTTPHEADER, $header);
				curl_setopt($curl, CURLOPT_URL, $query);
				$result = curl_exec($curl);
				if ($result == false) {
					\Aurora\System\Api::Log("curl_exec threw error \"" . curl_error($curl) . "\" for $query");
					curl_close($curl);
					throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Exceptions\Errs::UserManager_AccountNewPasswordUpdateError);
				} else {
					curl_close($curl);
					\Aurora\System\Api::Log("..:: QUERY0 ::.. ".$query);
					$json_res = json_decode($result,true);
					\Aurora\System\Api::Log("..:: RESULT0 ::.. ".$result);
					if(isset($json_res['data']['acct'][0]['user'])) {
						$cpanel_user0 = $json_res['data']['acct'][0]['user'];
						\Aurora\System\Api::Log("..:: USER ::.. ".$cpanel_user0);
					}
				}
				$query = "https://".$cpanel_host.":2087/json-api/cpanel?cpanel_jsonapi_user=".$cpanel_user0."&cpanel_jsonapi_module=Email&cpanel_jsonapi_func=passwdpop&cpanel_jsonapi_apiversion=2&email=".$email_user."&password=".$email_pass."&domain=".$email_domain;
			}
			else
			{
				$query = "https://".$cpanel_host.":2083/execute/Email/passwd_pop?email=".$email_user."&password=".$email_pass."&domain=".$email_domain;
			}

			$curl = curl_init();
			curl_setopt($curl, CURLOPT_SSL_VERIFYPEER,0);
			curl_setopt($curl, CURLOPT_SSL_VERIFYHOST,0);
			curl_setopt($curl, CURLOPT_HEADER,0);
			curl_setopt($curl, CURLOPT_RETURNTRANSFER,1);
			$header[0] = "Authorization: Basic " . base64_encode($cpanel_user.":".$cpanel_pass) . "\n\r";
			curl_setopt($curl, CURLOPT_HTTPHEADER, $header);
			curl_setopt($curl, CURLOPT_URL, $query);
			$result = curl_exec($curl);
			if ($result == false) {
				\Aurora\System\Api::Log("curl_exec threw error \"" . curl_error($curl) . "\" for $query");
				curl_close($curl);
				throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Exceptions\Errs::UserManager_AccountNewPasswordUpdateError);
			} else {
				curl_close($curl);
				\Aurora\System\Api::Log("..:: QUERY ::.. ".$query);
				$json_res = json_decode($result,true);
				\Aurora\System\Api::Log("..:: RESULT ::.. ".$result);
				if ((isset($json_res["errors"]))&&($json_res["errors"]!==null))
				{
					throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Exceptions\Errs::UserManager_AccountNewPasswordUpdateError);
				} else {
					$bResult = true;
				}
			}
		}
		return $bResult;
	}

	protected function getMailModule()
	{
		if (!$this->oMailModule)
		{
			$this->oMailModule = \Aurora\System\Api::GetModule('Mail');
		}

		return $this->oMailModule;
	}
}
