<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\CpanelIntegrator\Managers;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2020, Afterlogic Corp.
 */
class Aliases extends \Aurora\System\Managers\AbstractManager
{
	/**
	 * @var \Aurora\System\Managers\Eav
	 */
	public $oEavManager = null;

	/**
	 * @param \Aurora\System\Module\AbstractModule $oModule
	 */
	public function __construct(\Aurora\System\Module\AbstractModule $oModule = null)
	{
		parent::__construct($oModule);

		$this->oEavManager = \Aurora\System\Managers\Eav::getInstance();

	}

	/**
	 * @param \Aurora\Modules\CpanelIntegrator\Classes\Alias $oAlias
	 * @return int|bool
	 */
	public function createAlias(\Aurora\Modules\CpanelIntegrator\Classes\Alias &$oAlias)
	{
		$mResult = false;
		if ($oAlias->validate())
		{
			$mResult = $this->oEavManager->saveEntity($oAlias);
			if (!$mResult)
			{
				throw new \Aurora\System\Exceptions\ManagerException(\Aurora\Modules\CpanelIntegrator\Enums\ErrorCodes::AliasCreateFailed);
			}
		}

		return $mResult;
	}

	/**
	 * @param \Aurora\Modules\CpanelIntegrator\Classes\Alias $oAlias
	 * @return bool
	 */
	public function updateAlias(\Aurora\Modules\CpanelIntegrator\Classes\Alias $oAlias)
	{
		$bResult = false;
		if ($oAlias->validate())
		{
			if (!$this->oEavManager->saveEntity($oAlias))
			{
				throw new \Aurora\System\Exceptions\ManagerException(\Aurora\Modules\CpanelIntegrator\Enums\ErrorCodes::AliasUpdateFailed);
			}

			$bResult = true;
		}

		return $bResult;
	}

	/**
	 * @param \Aurora\Modules\CpanelIntegrator\Classes\Alias $oAlias
	 * @return bool
	 */
	public function deleteAlias(\Aurora\Modules\CpanelIntegrator\Classes\Alias $oAlias)
	{
		$bResult = $this->oEavManager->deleteEntity($oAlias->EntityId, \Aurora\Modules\CpanelIntegrator\Classes\Alias::class);

		return $bResult;
	}

	/**
	 * @param int $iEntityId
	 * @return object
	 */
	public function getAlias($iEntityId)
	{
		$oResult = $this->oEavManager->getEntity($iEntityId);

		return $oResult;
	}

	/**
	 * @param array $aFilter
	 * @return array
	 */
	public function getAliases($iCount = 0, $iLimit = 0, $aFilter = [])
	{
		$aAliases = $this->oEavManager->getEntities(
			\Aurora\Modules\CpanelIntegrator\Classes\Alias::class,
			[],
			$iCount,
			$iLimit,
			$aFilter
		);

		return $aAliases;
	}

	/**
	 * @param int $iUserId UserId.
	 * @return array
	 */
	public function getAliasesByUserId($iUserId)
	{
		return $this->getAliases(0, 0, ['IdUser' => $iUserId]);
	}

	/**
	 * @param int $iUserId UserId.
	 * @return bool|\Aurora\Modules\CpanelIntegrator\Classes\Alias
	 */
	public function getUserAliasByEmail($iUserId, $sEmail)
	{
		$mResult = false;
		$aAliases = $this->getAliases(
			0,
			0,
			[
				'IdUser'	=> $iUserId,
				'Email'	=> $sEmail
			]
		);
		if (is_array($aAliases) && isset($aAliases[0]))
		{
			$mResult = $aAliases[0];
		}

		return $mResult;
	}
}