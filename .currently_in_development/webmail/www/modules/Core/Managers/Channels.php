<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\Core\Managers;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Channels
 */
class Channels extends \Aurora\System\Managers\AbstractManager
{
	/**
	 * @var \Aurora\System\Managers\Eav
	 */
	public $oEavManager = null;
	
	/**
	 * 
	 * @param \Aurora\System\Module\AbstractModule $oModule
	 */
	public function __construct(\Aurora\System\Module\AbstractModule $oModule)
	{
		parent::__construct($oModule);
		
		$this->oEavManager = \Aurora\System\Managers\Eav::getInstance();
	}

	/**
	 * @param int $iOffset
	 * @param int $iLimit
	 * @param string $sOrderBy Default value is **Login**
	 * @param bool $iOrderType Default value is **\Aurora\System\Enums\SortOrder::ASC**
	 * @param string $sSearchDesc Default value is empty string
	 *
	 * @return array|false [Id => [Login, Description]]
	 */
	public function getChannelList($iOffset = 0, $iLimit = 0, $sOrderBy = 'Login', $iOrderType = \Aurora\System\Enums\SortOrder::ASC, $sSearchDesc = '')
	{
		$aResult = false;
		$aSearch = empty($sSearchDesc) ? array() : array(
			'Login' => '%'.$sSearchDesc.'%'
		);
		try
		{
			$aResult = $this->oEavManager->getEntities(
				\Aurora\Modules\Core\Classes\Channel::class,
				array('Login', 'Description', 'Password'),
				$iOffset,
				$iLimit,
				$aSearch,
				$sOrderBy,
				$iOrderType
			);
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$this->setLastException($oException);
		}
		return $aResult;
	}

	/**
	 * @param string $sSearchDesc Default value is empty string
	 *
	 * @return int
	 */
	public function getChannelCount($sSearchDesc = '')
	{
		$iResult = 0;
		try
		{
			$aResults = $this->oEavManager->getEntitiesCount(\Aurora\Modules\Core\Classes\Channel::class,
				array(
					'Login' => '%'.$sSearchDesc.'%',
					'Description' => '%'.$sSearchDesc.'%'
				)
			);
			
			$iResult = count($aResults);
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$this->setLastException($oException);
		}
		return $iResult;
	}

	/**
	 * @param int $iChannelId
	 *
	 * @return \Aurora\Modules\Core\Classes\Channel
	 */
	public function getChannelById($iChannelId)
	{
		$oChannel = null;
		try
		{
			$oResult = $this->oEavManager->getEntity($iChannelId, \Aurora\Modules\Core\Classes\Channel::class);
			
			if (!empty($oResult))
			{
				$oChannel = $oResult;
			}
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$this->setLastException($oException);
		}

		return $oChannel;
	}

	/**
	 * @param string $sChannelLogin
	 *
	 * @return int
	 */
	public function getChannelIdByLogin($sChannelLogin)
	{
		$iChannelId = 0;
		try
		{
			$aResultChannels = $this->oEavManager->getEntities(\Aurora\Modules\Core\Classes\Channel::class,
				array(
					'Login'
				),
				0,
				1,
				array('Login' => $sChannelLogin)
			);
			
			if (isset($aResultChannels[0]) && $aResultChannels[0] instanceOf \Aurora\Modules\Core\Classes\Channel)
			{
				$iChannelId = $aResultChannels[0]->EntityId;
			}
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$this->setLastException($oException);
		}

		return $iChannelId;
	}

	/**
	 * @param Aurora\Modules\Core\Classes\Channel $oChannel
	 *
	 * @return bool
	 */
	public function isExists(\Aurora\Modules\Core\Classes\Channel $oChannel)
	{
		$bResult = false;
		try
		{
			$aResultChannels = $this->oEavManager->getEntities(\Aurora\Modules\Core\Classes\Channel::class,
				array('Login'),
				0,
				0,
				array('Login' => $oChannel->Login)
			);

			if ($aResultChannels)
			{
				foreach($aResultChannels as $oObject)
				{
					if ($oObject->EntityId !== $oChannel->EntityId)
					{
						$bResult = true;
						break;
					}
				}
			}
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$this->setLastException($oException);
		}
		return $bResult;
	}

	/**
	 * @param Aurora\Modules\Core\Classes\Channel $oChannel
	 *
	 * @return bool
	 */
	public function createChannel(\Aurora\Modules\Core\Classes\Channel &$oChannel)
	{
		$bResult = false;
		try
		{
			if ($oChannel->validate())
			{
				if (!$this->isExists($oChannel))
				{
					$oChannel->Password = md5($oChannel->Login.mt_rand(1000, 9000).microtime(true));
					
					if (!$this->oEavManager->saveEntity($oChannel))
					{
						throw new \Aurora\System\Exceptions\ManagerException(Errs::ChannelsManager_ChannelCreateFailed);
					}
				}
				else
				{
					throw new \Aurora\System\Exceptions\ManagerException(Errs::ChannelsManager_ChannelAlreadyExists);
				}
			}

			$bResult = true;
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$bResult = false;
			$this->setLastException($oException);
		}

		return $bResult;
	}

	/**
	 * @param Aurora\Modules\Core\Classes\Channel $oChannel
	 *
	 * @return bool
	 */
	public function updateChannel(\Aurora\Modules\Core\Classes\Channel $oChannel)
	{
		$bResult = false;
		try
		{
			if ($oChannel->validate())
			{
				if (!$this->isExists($oChannel))
				{
					if (!$this->oEavManager->saveEntity($oChannel))
					{
						throw new \Aurora\System\Exceptions\ManagerException(Errs::ChannelsManager_ChannelUpdateFailed);
					}
				}
				else
				{
					throw new \Aurora\System\Exceptions\ManagerException(Errs::ChannelsManager_ChannelDoesNotExist);
				}
			}

			$bResult = true;
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$bResult = false;
			$this->setLastException($oException);
		}
		return $bResult;
	}

	/**
	 * @param Aurora\Modules\Core\Classes\Channel $oChannel
	 *
	 * @throws $oException
	 *
	 * @return bool
	 */
	public function deleteChannel(\Aurora\Modules\Core\Classes\Channel $oChannel)
	{
		$bResult = false;
		try
		{
			/* @var $oTenantsManager CApiTenantsManager */
			$oTenantsManager = new \Aurora\Modules\Core\Managers\Tenants\Manager();
			
			if ($oTenantsManager && !$oTenantsManager->deleteTenantsByChannelId($oChannel->EntityId, true))
			{
				$oException = $oTenantsManager->GetLastException();
				if ($oException)
				{
					throw $oException;
				}
			}

			$bResult = $this->oEavManager->deleteEntity($oChannel->EntityId, \Aurora\Modules\Core\Classes\Channel::class);
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$this->setLastException($oException);
		}

		return $bResult;
	}
}
