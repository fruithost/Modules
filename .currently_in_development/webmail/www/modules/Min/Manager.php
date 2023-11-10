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
 */
class Manager extends \Aurora\System\Managers\AbstractManagerWithStorage
{
	public function __construct(\Aurora\System\Module\AbstractModule $oModule = null)
	{
		parent::__construct($oModule, new Storages\Db\Storage($this));
	}

	/**
	 * @param string $sHashID
	 * @param array $aParams
	 *
	 * @return string|bool
	 */
	public function createMin($sHashID, $aParams, $iUserId = null, $iExpireDate = null)
	{
		$mResult = false;
		try
		{
			$mResult = $this->oStorage->createMin($sHashID, $aParams, $iUserId, $iExpireDate);
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$this->setLastException($oException);
		}
		return $mResult;
	}

	/**
	 * @param string $sHashID
	 *
	 * @return array|bool
	 */
	public function getMinByID($sHashID)
	{
		$mResult = false;
		try
		{
			$mResult = $this->oStorage->getMinByID($sHashID);
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$this->setLastException($oException);
		}
		return $mResult;
	}

	/**
	 * @param string $sHash
	 *
	 * @return array|bool
	 */
	public function getMinByHash($sHash)
	{
		$mResult = false;
		try
		{
			$mResult = $this->oStorage->getMinByHash($sHash);
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$this->setLastException($oException);
		}
		return $mResult;
	}

	/**
	 * @param int $iUserId
	 *
	 * @return array|bool
	 */
	public function getMinListByUserId($iUserId)
	{
		$mResult = false;
		try
		{
			$mResult = $this->oStorage->getMinListByUserId($iUserId);
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$this->setLastException($oException);
		}
		return $mResult;
	}

	/**
	 * @param string $sHashID
	 *
	 * @return bool
	 */
	public function deleteMinByID($sHashID)
	{
		$mResult = false;
		try
		{
			$mResult = $this->oStorage->deleteMinByID($sHashID);
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$this->setLastException($oException);
		}
		return $mResult;
	}

	/**
	 * @param string $sHash
	 *
	 * @return bool
	 */
	public function deleteMinByHash($sHash)
	{
		$mResult = false;
		try
		{
			$mResult = $this->oStorage->deleteMinByHash($sHash);
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$this->setLastException($oException);
		}
		return $mResult;
	}

	/**
	 * @param string $sHashID
	 * @param array $aParams
	 * @param string $sNewHashID Default value is **null**
	 *
	 * @return bool
	 */
	public function updateMinByID($sHashID, $aParams, $sNewHashID = null)
	{
		$mResult = false;
		try
		{
			$mResult = $this->oStorage->updateMinByID($sHashID, $aParams, $sNewHashID);
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$this->setLastException($oException);
		}
		return $mResult;
	}

	/**
	 * @param string $sHash
	 * @param array $aParams
	 * @param string $sNewHashID Default value is **null**
	 *
	 * @return bool
	 */
	public function updateMinByHash($sHash, $aParams, $sNewHashID = null)
	{
		$mResult = false;
		try
		{
			$mResult = $this->oStorage->updateMinByHash($sHash, $aParams, $sNewHashID);
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$this->setLastException($oException);
		}
		return $mResult;
	}
	
	/**
	 * Creates tables required for module work by executing create.sql file.
	 * 
	 * @return boolean
	 */
	public function createTablesFromFile()
	{
		$bResult = false;
		
		try
		{
			$sFilePath = dirname(__FILE__) . '/Storages/Db/sql/create.sql';
			$bResult = \Aurora\System\Managers\Db::getInstance()->executeSqlFile($sFilePath);
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$this->setLastException($oException);
		}

		return $bResult;
	}

	/**
	 * Update tables required for module work by executing update.sql file.
	 * 
	 * @return boolean
	 */
	public function updateTables()
	{
		$bResult = true;
		
		try
		{
			if (!\Aurora\System\Managers\Db::getInstance()->columnExists('min_hashes', 'user_id'))
			{
				$bResult = \Aurora\System\Managers\Db::getInstance()->executeSql('ALTER TABLE `%PREFIX%min_hashes` ADD COLUMN `user_id` BIGINT(64) NULL DEFAULT NULL AFTER `hash_id`');
			}
			if (!\Aurora\System\Managers\Db::getInstance()->columnExists('min_hashes', 'expire_date'))
			{
				$bResult = \Aurora\System\Managers\Db::getInstance()->executeSql('ALTER TABLE `%PREFIX%min_hashes` ADD COLUMN `expire_date` INT(11) NULL DEFAULT NULL');
			}
		}
		catch (\Aurora\System\Exceptions\BaseException $oException)
		{
			$this->setLastException($oException);
		}

		return $bResult;
	}	
}
