<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\Dropbox;

/**
 * Adds ability to work with Dropbox.
 * 
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	protected $sService = 'dropbox';
	
	protected $aRequireModules = array(
		'OAuthIntegratorWebclient'
	);
	
	/***** private functions *****/
	/**
	 * Initializes Dropbox Module.
	 * 
	 * @ignore
	 */
	public function init()
	{
		$this->subscribeEvent('GetServicesSettings', array($this, 'onGetServicesSettings'));
		$this->subscribeEvent('UpdateServicesSettings', array($this, 'onUpdateServicesSettings'));
	}
	
	/**
	 * Adds service settings to array passed by reference.
	 * 
	 * @ignore
	 * @param array $aServices Array with services settings passed by reference.
	 */
	public function onGetServicesSettings(&$aServices)
	{
		$aSettings = $this->GetSettings();
		if (!empty($aSettings))
		{
			$aServices[] = $aSettings;
		}
	}
	
	/**
	 * Updates service settings.
	 * 
	 * @ignore
	 * @param array $aServices Array with new values for service settings.
	 * 
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function onUpdateServicesSettings($aServices)
	{
		$aSettings = $aServices[$this->sService];
		
		if (\is_array($aSettings))
		{
			$this->UpdateSettings($aSettings['EnableModule'], $aSettings['Id'], $aSettings['Secret']);
		}
	}
	/***** private functions *****/
	
	/***** public functions might be called with web API *****/
	/**
	 * Obtains list of module settings for authenticated user.
	 * 
	 * @return array
	 */
	public function GetSettings()
	{
		$aResult = array();
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);
		
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!empty($oUser) && $oUser->Role === \Aurora\System\Enums\UserRole::SuperAdmin)
		{
			$aResult = array(
				'Name' => $this->sService,
				'DisplayName' => self::GetName(),
				'EnableModule' => $this->getConfig('EnableModule', false),
				'Id' => $this->getConfig('Id', ''),
				'Secret' => $this->getConfig('Secret', '')
			);
		}
		
		if (!empty($oUser) && $oUser->isNormalOrTenant())
		{
			$oAccount = null;
			$oOAuthIntegratorWebclientDecorator = \Aurora\Modules\OAuthIntegratorWebclient\Module::Decorator();
			if ($oOAuthIntegratorWebclientDecorator)
			{
				$oAccount = $oOAuthIntegratorWebclientDecorator->GetAccount($this->sService);
			}
			$aResult = array(
				'EnableModule' => $this->getConfig('EnableModule', false),
				'Connected' => $oAccount ? true : false
			);
			$aArgs = array(
				'OAuthAccount' => $oAccount
			);
		}
		$this->broadcastEvent('GetSettings', $aArgs, $aResult);
		
		return $aResult;
	}
	
	/**
	 * Updates service settings.
	 * 
	 * @param boolean $EnableModule **true** if module should be enabled.
	 * @param string $Id Service app identifier.
	 * @param string $Secret Service app secret.
	 * 
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function UpdateSettings($EnableModule, $Id, $Secret)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::TenantAdmin);
		
		try
		{
			$this->setConfig('EnableModule', $EnableModule);
			$this->setConfig('Id', $Id);
			$this->setConfig('Secret', $Secret);
			$this->saveModuleConfig();
		}
		catch (\Exception $ex)
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::CanNotSaveSettings);
		}
		
		return true;
	}
	
	/**
	 * Deletes DropBox account.
	 * 
	 * @return boolean
	 */
	public function DeleteAccount()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		
		$bResult = false;
		$oOAuthIntegratorWebclientDecorator = \Aurora\Modules\OAuthIntegratorWebclient\Module::Decorator();
		if ($oOAuthIntegratorWebclientDecorator)
		{
			$bResult = $oOAuthIntegratorWebclientDecorator->DeleteAccount($this->sService);
		}
		
		return $bResult;
	}
	/***** public functions might be called with web API *****/
}
