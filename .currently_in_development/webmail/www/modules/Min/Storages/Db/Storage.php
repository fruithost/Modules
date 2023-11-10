<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\Min\Storages\Db;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 */
class Storage extends \Aurora\Modules\Min\Storages\Storage
{
	/**
	 * @var CDbStorage $oConnection
	 */
	protected $oConnection;

	/**
	 * @var CApiMinCommandCreatorMySQL
	 */
	protected $oCommandCreator;

	/**
	 * 
	 * @param \Aurora\System\Managers\AbstractManager $oManager
	 */
	public function __construct(\Aurora\System\Managers\AbstractManager &$oManager)
	{
		parent::__construct($oManager);

		$this->oConnection =& $oManager->GetConnection();
		$this->oCommandCreator = new CommandCreator\MySQL();
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
		$sNewMin = '';

		if (is_string($sHashID) && 0 < strlen($sHashID) && false !== $this->getMinByID($sHashID))
		{
			return false;
		}

		while (true)
		{
			$sNewMin = \Aurora\System\Utils::GenerateShortHashString(10);
			if (false === $this->getMinByHash($sNewMin))
			{
				break;
			}
		}

		if (0 < strlen($sNewMin))
		{
			$aParams['__hash_id__'] = $sHashID;
			$aParams['__hash__'] = $sNewMin;
			$aParams['__time__'] = time();
			$aParams['__time_update__'] = time();

			if ($this->oConnection->Execute($this->oCommandCreator->createMin($sNewMin, md5($sHashID), @\json_encode($aParams), $iUserId, $iExpireDate)))
			{
				$mResult = $sNewMin;
			}
		}

		$this->throwDbExceptionIfExist();
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
		if (is_string($sHashID) && 0 < strlen($sHashID))
		{
			$aPrevParams = $this->getMinByID($sHashID);
			if (isset($aPrevParams['__hash__']))
			{
				$aParams['__hash__'] = $aPrevParams['__hash__'];
			}
			if (!empty($sNewHashID))
			{
				$aParams['__hash_id__'] = $sNewHashID;
			}
			if (isset($aPrevParams['__time__']))
			{
				$aParams['__time__'] = $aPrevParams['__time__'];
			}

			$aParams['__time_update__'] = time();
			$aMergedParams = array_merge($aPrevParams, $aParams);
			$mResult = $this->oConnection->Execute($this->oCommandCreator->updateMinByID(md5($sHashID), @\json_encode($aMergedParams),
				!empty($sNewHashID) ? md5($sNewHashID) : null));
		}

		$this->throwDbExceptionIfExist();
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
		if (is_string($sHash) && 0 < strlen($sHash) && is_array($aParams))
		{
			$aPrevParams = $this->getMinByHash($sHash);
			if (isset($aPrevParams['__hash_id__']))
			{
				$aParams['__hash_id__'] = $aPrevParams['__hash_id__'];
			}
			if (!empty($sNewHashID))
			{
				$aParams['__hash_id__'] = $sNewHashID;
			}
			if (isset($aPrevParams['__time__']))
			{
				$aParams['__time__'] = $aPrevParams['__time__'];
			}

			$aParams['__time_update__'] = time();
			$mResult = $this->oConnection->Execute($this->oCommandCreator->updateMinByHash($sHash, @\json_encode($aParams),
				!empty($sNewHashID) ? md5($sNewHashID) : null));
		}

		$this->throwDbExceptionIfExist();
		return $mResult;
	}

	/**
	 * @return array|bool
	 */
	private function parseGetMinDbResult()
	{
		$mResult = false;
		$oRow = $this->oConnection->GetNextRecord();
		if ($oRow && !empty($oRow->data))
		{
			$aData = @\json_decode($oRow->data, true);
			if (is_array($aData) && 0 < count($aData))
			{
				$mResult = $aData;
			}
			if ($oRow->expire_date)
			{
				$mResult['expire_date'] = $oRow->expire_date;
			}
		}
		$this->oConnection->FreeResult();

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

		if (is_string($sHashID) && 0 < strlen($sHashID) && $this->oConnection->Execute($this->oCommandCreator->getMinByID(md5($sHashID))))
		{
			$mResult = $this->parseGetMinDbResult();
		}

		$this->throwDbExceptionIfExist();
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

		if (is_string($sHash) && 0 < strlen($sHash) && $this->oConnection->Execute($this->oCommandCreator->getMinByHash($sHash)))
		{
			$mResult = $this->parseGetMinDbResult();
		}

		$this->throwDbExceptionIfExist();
		return $mResult;
	}

	/**
	 * @param int $iUserId
	 *
	 * @return array|bool
	 */
	public function getMinListByUserId($iUserId)
	{
		$mResult = [];

		if ($this->oConnection->Execute($this->oCommandCreator->getMinListByUserId($iUserId)))
		{
			while($oRow = $this->oConnection->GetNextRecord())
			{
				if (!empty($oRow->data))
				{
					$aData = @\json_decode($oRow->data, true);
					if (is_array($aData) && 0 < count($aData))
					{
						$mResult[]= $aData;
					}
				}
			}
			$this->oConnection->FreeResult();			
		}

		$this->throwDbExceptionIfExist();
		return $mResult;
	}
	
	/**
	 * @param string $sHashID
	 *
	 * @return array|bool
	 */
	public function deleteMinByID($sHashID)
	{
		$mResult = false;
		if (is_string($sHashID) && 0 < strlen($sHashID))
		{
			$mResult = $this->oConnection->Execute($this->oCommandCreator->deleteMinByID(md5($sHashID)));
		}

		$this->throwDbExceptionIfExist();
		return $mResult;
	}
	
	/**
	 * @param string $sHash
	 *
	 * @return array|bool
	 */
	public function deleteMinByHash($sHash)
	{
		$mResult = false;
		if (is_string($sHash) && 0 < strlen($sHash))
		{
			$mResult = $this->oConnection->Execute($this->oCommandCreator->deleteMinByHash($sHash));
		}

		$this->throwDbExceptionIfExist();
		return $mResult;
	}
}
