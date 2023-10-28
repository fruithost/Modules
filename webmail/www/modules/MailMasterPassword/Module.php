<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */
 
namespace Aurora\Modules\MailMasterPassword;

/**
 * This module adds ability to login to the admin panel as a Super Administrator.
 *
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	/***** private functions *****/
	/**
	 * @return array
	 */
	public function init()
	{
		$this->subscribeEvent('Core::Login::before', array($this, 'onBeforLogin'), 10);
	}
	
	/**
	 * Return crypted password.
	 * 
	 * @param string $Password
	 * @return string
	 */
	protected function cryptPassword($Password)
	{
		return crypt(trim($Password), \Aurora\System\Api::$sSalt);
	}

	/**
	 * Tries to log in with specified credentials.
	 * 
	 * @param array $aParams Parameters contain the required credentials.
	 * @param array|mixed $mResult Parameter is passed by reference for further filling with result. Result is the array with data for authentication token.
	 */
	public function onBeforLogin(&$aArgs, &$mResult)
	{
		$sPassword = $this->getConfig('Password', false);
		
		if ($sPassword !== false && !empty($sPassword) && $this->cryptPassword($aArgs['Password']) === $sPassword)
		{
			$oAccount = \Aurora\Modules\Mail\Module::getInstance()->getAccountsManager()->getAccountUsedToAuthorize($aArgs['Login']);
			if ($oAccount instanceof \Aurora\Modules\Mail\Classes\Account)
			{
				$aArgs['Password'] = $oAccount->getPassword();
			}
		}
	}
	/***** private functions *****/

	public function UpdateSettings($MasterPassword)
	{
		$this->setConfig('Password', $this->cryptPassword($MasterPassword));
		return $this->saveModuleConfig();
	}

}
