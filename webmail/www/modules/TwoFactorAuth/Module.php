<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\TwoFactorAuth;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
			
	public function init()
	{
		$this->extendObject(
			'Aurora\Modules\Core\Classes\User',
			[
				'Secret'		=> array('string', ''),
				'AuthToken'	=> array('text', '')
			]
		);

		$this->subscribeEvent('Core::Login::after', array($this, 'onAfterLogin'));
	}

	/**
	 * Obtains list of module settings for authenticated user.
	 *
	 * @return array
	 */
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);
		
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!empty($oUser) && $oUser->Role === \Aurora\System\Enums\UserRole::NormalUser)
		{
			return [
				'EnableTwoFactorAuth' => $oUser->{$this->GetName().'::Secret'} ? true : false
			];
		}

		return null;
	}

	/**
	 * Verifies user's password and returns Secret and QR-code
	 *
	 * @param string $Password
	 * @return bool|array
	 */
	public function EnableTwoFactorAuth($Password)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		$mResult = false;

		if (!empty($Password))
		{	
			$mResult = \Aurora\System\Api::GetModuleDecorator('Core')->VerifyPassword($Password);
			if ($mResult)
			{
				$oUser = \Aurora\System\Api::getAuthenticatedUser();
				$oGoogle = new \PHPGangsta_GoogleAuthenticator();
				$sSecret = $oUser->{$this->GetName().'::Secret'} ? $oUser->{$this->GetName().'::Secret'} : $oGoogle->createSecret();

				$mResult = [
					'Secret' => $sSecret,
					'QRcode' => $oGoogle->getQRCodeGoogleUrl($_SERVER['SERVER_NAME'], $sSecret),
					'Enabled' => $oUser->{$this->GetName().'::Secret'} ? true : false
				];
			}
		}

		return $mResult;
	}

	/**
	 * Verifies user's Pin and saves Secret in case of success
	 *
	 * @param string $Pin
	 * @param string $Secret
	 * @return boolean
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function TwoFactorAuthSave($Pin, $Secret)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$bResult = false;
		if (!$Pin || !$Secret || empty($Pin) || empty($Secret))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		$iClockTolerance = $this->getConfig('ClockTolerance', 2);
		$oGoogle = new \PHPGangsta_GoogleAuthenticator();

		$oStatus = $oGoogle->verifyCode($Secret, $Pin, $iClockTolerance);
		if ($oStatus === true)
		{
			$oUser->{$this->GetName().'::Secret'} = $Secret;
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
	public function DisableTwoFactorAuth($Password)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		$bResult = false;

		if (!empty($Password))
		{
			$bVerificationResult = \Aurora\System\Api::GetModuleDecorator('Core')->VerifyPassword($Password);
			if ($bVerificationResult)
			{
				$oUser = \Aurora\System\Api::getAuthenticatedUser();
				$oUser->{$this->GetName().'::Secret'} = "";
				$bResult = \Aurora\Modules\Core\Module::Decorator()->UpdateUserObject($oUser);
			}
		}

		return $bResult;
	}

	/**
	 * Verifies user's PIN and returns AuthToken in case of success
	 *
	 * @param string $Pin
	 * @param int $UserId
	 * @return bool|array
	 * @throws \Aurora\System\Exceptions\ApiException
	 * @throws \Aurora\System\Exceptions\BaseException
	 */
	public function VerifyPin($Pin, $UserId)
	{
		$mResult = false;

		if (!$Pin || empty($Pin) || !$UserId || empty($UserId))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}
		$oUser = \Aurora\System\Api::getUserById((int) $UserId);
		if ($oUser instanceof \Aurora\Modules\Core\Classes\User && $oUser->{$this->GetName().'::Secret'} && $oUser->{$this->GetName().'::AuthToken'})
		{
			$oGoogle = new \PHPGangsta_GoogleAuthenticator();
			$iClockTolerance = $this->getConfig('ClockTolerance', 2);
			$oStatus = $oGoogle->verifyCode($oUser->{$this->GetName().'::Secret'}, $Pin, $iClockTolerance);
			if ($oStatus)
			{
				$mResult = ['AuthToken' => $oUser->{$this->GetName().'::AuthToken'}];
				$oUser->{$this->GetName().'::AuthToken'} = '';
				$bPrevState = \Aurora\System\Api::skipCheckUserRole(true);
				\Aurora\Modules\Core\Module::Decorator()->UpdateUserObject($oUser);
				\Aurora\System\Api::skipCheckUserRole($bPrevState);
			}
		}
		else
		{
			throw new \Aurora\System\Exceptions\BaseException(Enums\ErrorCodes::SecretNotSet);
		}

		return $mResult;
	}

	/**
	 * Checks if User has TwoFactorAuth enabled and return UserId instead of AuthToken
	 *
	 * @param array $aArgs
	 * @param aray $mResult
	 */
	public function onAfterLogin($aArgs, &$mResult)
	{
		$sAuthToken = (is_array($mResult) && isset($mResult['AuthToken'])) ? $mResult['AuthToken'] : '';
		$oUser = \Aurora\System\Api::getAuthenticatedUser($sAuthToken);
		if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
		{
			if ($oUser->{$this->GetName().'::Secret'} !== "")
			{
				$mResult['TwoFactorAuth'] = ['UserId' => $oUser->EntityId];
				$oUser->{$this->GetName().'::AuthToken'} = $mResult['AuthToken'];
				\Aurora\Modules\Core\Module::Decorator()->UpdateUserObject($oUser);
				unset($mResult['AuthToken']);
			}
		}
	}
}
