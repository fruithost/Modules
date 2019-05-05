<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\Min;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	public $oApiMinManager = null;
	
	/***** private functions *****/
	/**
	 * Initializes module.
	 * 
	 * @ignore
	 */
	public function init()
	{
		$this->oApiMinManager = new Manager($this);
		$this->AddEntry('window', 'EntryMin');
		$this->subscribeEvent('Core::CreateTables::after', array($this, 'onAfterCreateTables'));
	}
	
	/**
	 * Creates tables required for module work. Called by event subscribe.
	 * 
	 * @ignore
	 * @param array $aParams Parameters
	 */
	public function onAfterCreateTables($aParams, &$mResult)
	{
		if ($mResult)
		{
			$mResult = $this->oApiMinManager->createTablesFromFile();
		}
	}
	/***** private functions *****/
	
	/***** public functions *****/
	/**
	 * @ignore
	 * @return string
	 */
	public function EntryMin()
	{
		$sResult = '';
		$aPaths = \Aurora\System\Application::GetPaths();
		$sModule = empty($aPaths[1]) ? '' : $aPaths[1];
		try
		{
			if (!empty($sModule))
			{
//				\Aurora\System\Api::GetModuleManager()->ExecuteMethod($sModule, $sMethod, $aParameters);
				if (/*method_exists($this->oActions, $sMethodName)*/ true)
				{
					if ('Min' === $aPaths[1])
					{
						$mHashResult = $this->oApiMinManager->getMinByHash(empty($aPaths[2]) ? '' : $aPaths[2]);
						
						$this->oActions->SetActionParams(array(
							'Result' => $mHashResult,
							'Hash' => empty($aPaths[2]) ? '' : $aPaths[2],
						));
					}
					else
					{
						$this->oActions->SetActionParams(array(
							'AccountID' => empty($aPaths[2]) || '0' === (string) $aPaths[2] ? '' : $aPaths[2],
							'RawKey' => empty($aPaths[3]) ? '' : $aPaths[3]
						));
					}
					
					$mResult = \call_user_func(array($this->oActions, $sMethodName));
					$sTemplate = isset($mResult['Template']) && !empty($mResult['Template']) &&
						\is_string($mResult['Template']) ? $mResult['Template'] : null;
					
					if (!empty($sTemplate) && \is_array($mResult) && \file_exists(AU_APP_ROOT_PATH.$sTemplate))
					{
						$sResult = \file_get_contents(AU_APP_ROOT_PATH.$sTemplate);
						if (\is_string($sResult))
						{
							$sResult = \strtr($sResult, $mResult);
						}
						else
						{
							\Aurora\System\Api::Log('Empty template.', \Aurora\System\Enums\LogLevel::Error);
						}
					}
					else if (!empty($sTemplate))
					{
						\Aurora\System\Api::Log('Empty template.', \Aurora\System\Enums\LogLevel::Error);
					}
					else if (true === $mResult)
					{
						$sResult = '';
					}
					else
					{
						\Aurora\System\Api::Log('False result.', \Aurora\System\Enums\LogLevel::Error);
					}
				}
				else
				{
					\Aurora\System\Api::Log('Invalid action.', \Aurora\System\Enums\LogLevel::Error);
				}
			}
			else
			{
				\Aurora\System\Api::Log('Empty action.', \Aurora\System\Enums\LogLevel::Error);
			}
		}
		catch (\Exception $oException)
		{
			\Aurora\System\Api::LogException($oException);
		}
		
		return $sResult;
	}
	/***** public functions *****/
	
	/***** public functions might be called with web API *****/
	/**
	 * Crates min hash.
	 * 
	 * @param string $HashId Hash identifier.
	 * @param array $Parameters Hash parameters.
	 * @return string|boolean
	 */
	public function CreateMin($HashId, $Parameters)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		
		return $this->oApiMinManager->createMin($HashId, $Parameters);
	}
	
	/**
	 * Returns parameters object by min hash.
	 * 
	 * @param string $sHash Min hash.
	 * @return array|bool
	 */
	public function GetMinByHash($sHash)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);
		
		return $this->oApiMinManager->getMinByHash($sHash);
	}
	
	/**
	 * Returns parameters object by min hash identifier.
	 * 
	 * @param string $Id
	 * @return array|bool
	 */
	public function GetMinByID($Id)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);
		
		return $this->oApiMinManager->getMinByID($Id);
	}
	
	/**
	 * Updates min hash by min hash identifier.
	 * 
	 * @param string $Id Hash identifier.
	 * @param array $Data Hash parameters.
	 * @param string $NewId New hash identifier.
	 * @return boolean
	 */
	public function UpdateMinByID($Id, $Data, $NewId = null)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		
		return $this->oApiMinManager->updateMinByID($Id, $Data, $NewId);
	}
	
	/**
	 * Updates min hash by min hash.
	 * 
	 * @param string $Hash Min hash.
	 * @param array $Data Hash parameters.
	 * @param string $NewHash New min hash.
	 * @return boolean
	 */
	public function UpdateMinByHash($Hash, $Data, $NewHash = null)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);
		
		return $this->oApiMinManager->updateMinByHash($Hash, $Data, $NewHash);
	}
	
	/**
	 * Deletes min hash by min hash identifier.
	 * 
	 * @param string $Id
	 * @return boolean
	 */
	public function DeleteMinByID($Id)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		
		return $this->oApiMinManager->deleteMinByID($Id);
	}

    public function DeleteMinByHash($Hash)
    {
        \Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

        return $this->oApiMinManager->deleteMinByHash($Hash);
    }
	/***** public functions might be called with web API *****/
}
