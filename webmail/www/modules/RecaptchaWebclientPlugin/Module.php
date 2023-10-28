<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\RecaptchaWebclientPlugin;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2020, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	protected $sRecaptchaWebclientPluginToken = null;

	public function init()
	{
		$this->aErrors = [
			Enums\ErrorCodes::RecaptchaVerificationError	=> $this->i18N('ERROR_RECAPTCHA_VERIFICATION_DID_NOT_COMPLETE'),
			Enums\ErrorCodes::RecaptchaUnknownError		=> $this->i18N('ERROR_UNKNOWN_RECAPTCHA_ERROR'),
		];

		\Aurora\System\EventEmitter::getInstance()->onAny(
			[
				['MailLoginFormWebclient::Login::before', [$this, 'onBeforeMailLoginFormWebclientLogin']],
				['StandardLoginFormWebclient::Login::before', [$this, 'onBeforeStandardLoginFormWebclient'], 90],
				['MailSignup::Signup::before', [$this, 'onSignup'], 90],
				['Core::Login::after', [$this, 'onAfterLogin']]
			]
		);
		
		$this->subscribeEvent('AddToContentSecurityPolicyDefault', array($this, 'onAddToContentSecurityPolicyDefault'));
	}

	public function onAddToContentSecurityPolicyDefault($aArgs, &$aAddDefault)
	{
		$aAddDefault[] = 'www.google.com www.gstatic.com';
	}

	private function isRecaptchaEnabledForIP()
	{
		return !in_array(\Aurora\System\Utils::getClientIp(), $this->getConfig('WhitelistIPs', []));
	}

	/**
	 * Obtains list of module settings for authenticated user.
	 * @return array
	 */
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		return [
			'PublicKey' => $this->getConfig('PublicKey', ''),
			'LimitCount' => $this->getConfig('LimitCount', 0),
			'ShowRecaptcha' => $this->isRecaptchaEnabledForIP(),
		];
	}

	public function onBeforeMailLoginFormWebclientLogin($aArgs, &$mResult, &$mSubscriptionResult)
	{
		if (isset($aArgs['RecaptchaWebclientPluginToken']) && !empty($aArgs['RecaptchaWebclientPluginToken']))
		{
			$this->sRecaptchaWebclientPluginToken = $aArgs['RecaptchaWebclientPluginToken'];
		}
	}

	public function onBeforeStandardLoginFormWebclient($aArgs, &$mResult, &$mSubscriptionResult)
	{
		$iAuthError = isset($_COOKIE['auth-error']) ? (int) $_COOKIE['auth-error'] : 0;
		//If the user has exceeded the number of authentication attempts
		if ($iAuthError >= $this->getConfig('LimitCount', 0) && $this->isRecaptchaEnabledForIP())
		{
			if (isset($aArgs['RecaptchaWebclientPluginToken']) && !empty($aArgs['RecaptchaWebclientPluginToken']))
			{
				$this->sRecaptchaWebclientPluginToken = $aArgs['RecaptchaWebclientPluginToken'];
			}

			if (!$this->sRecaptchaWebclientPluginToken || empty($this->sRecaptchaWebclientPluginToken))
			{
				$mSubscriptionResult = [
					'Error' => [
						'Code'		=> Enums\ErrorCodes::RecaptchaVerificationError,
						'ModuleName'	=> $this->GetName(),
						'Override'		=> true
					]
				];
				return true;
			}
			$sPrivateKey = $this->getConfig('PrivateKey', '');
			$oRecaptcha = new \ReCaptcha\ReCaptcha($sPrivateKey, $this->getRequestMethod());
			$oResponse = $oRecaptcha->verify($this->sRecaptchaWebclientPluginToken);
			if (!$oResponse->isSuccess())
			{
				\Aurora\System\Api::Log("RECAPTCHA error: " . implode(', ', $oResponse->getErrorCodes()));
				$mSubscriptionResult = [
					'Error' => [
						'Code'		=> Enums\ErrorCodes::RecaptchaUnknownError,
						'ModuleName'	=> $this->GetName(),
						'Override'		=> true
					]
				];
				return true;
			}
			//If the user is authenticated, reset the counter for unsuccessful attempts.
			if (isset($_COOKIE['auth-error']))
			{
				@\setcookie('auth-error', 0, \strtotime('+1 hour'), \Aurora\System\Api::getCookiePath(), null, \Aurora\System\Api::getCookieSecure());
//				@\setcookie('auth-error');
			}
		}
	}

	public function onSignup($aArgs, &$mResult, &$mSubscriptionResult)
	{
		if (!isset($aArgs['RecaptchaWebclientPluginToken']) || empty($aArgs['RecaptchaWebclientPluginToken']))
		{
			$mSubscriptionResult = [
				'Error' => [
					'Code'		=> Enums\ErrorCodes::RecaptchaVerificationError,
					'ModuleName'	=> $this->GetName(),
					'Override'		=> true
				]
			];
			return true;
		}
		$sPrivateKey = $this->getConfig('PrivateKey', '');
		$oRecaptcha = new \ReCaptcha\ReCaptcha($sPrivateKey, $this->getRequestMethod());
		$oResponse = $oRecaptcha->verify($aArgs['RecaptchaWebclientPluginToken']);
		if (!$oResponse->isSuccess())
		{
			\Aurora\System\Api::Log("RECAPTCHA error: " . implode(', ', $oResponse->getErrorCodes()));
			$mSubscriptionResult = [
				'Error' => [
					'Code'		=> Enums\ErrorCodes::RecaptchaUnknownError,
					'ModuleName'	=> $this->GetName(),
					'Override'		=> true
				]
			];
			return true;
		}
	}

	public function onAfterLogin($aArgs, &$mResult)
	{
		//if auth was failed - incrementing auth-error counter
		if (!(is_array($mResult) && isset($mResult['AuthToken'])))
		{
			$iAuthErrorCount = isset($_COOKIE['auth-error']) ? ((int) $_COOKIE['auth-error'] + 1) : 1;
			@\setcookie('auth-error', $iAuthErrorCount, \strtotime('+1 hour'), \Aurora\System\Api::getCookiePath(), 
				null, \Aurora\System\Api::getCookieSecure());
		}
	}

	private function getRequestMethod()
	{
		$sRequestMethod = $this->getConfig('RequestMethod', Enums\RequestMethods::SocketPost);
		switch ($sRequestMethod)
		{
			case Enums\RequestMethods::CurlPost:
				return new \ReCaptcha\RequestMethod\CurlPost();
			case Enums\RequestMethods::Post:
				return new \ReCaptcha\RequestMethod\Post();
			case Enums\RequestMethods::SocketPost:
			default:
			return new \ReCaptcha\RequestMethod\SocketPost();
		}
	}
}
