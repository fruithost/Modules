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
class CommandCreator extends \Aurora\System\Db\AbstractCommandCreator
{
	/**
	 * @param string $sHash
	 *
	 * @return string
	 */
	public function getMinByHash($sHash)
	{
		$sSql = 'SELECT hash_id, hash, data, expire_date FROM %smin_hashes WHERE hash = %s';
		
		return sprintf($sSql, $this->prefix(), $this->escapeString($sHash));
	}
	
	/**
	 * @param string $sHashID
	 *
	 * @return string
	 */
	public function getMinByID($sHashID)
	{
		$sSql = 'SELECT hash_id, hash, data, expire_date FROM %smin_hashes WHERE hash_id = %s';

		return sprintf($sSql, $this->prefix(), $this->escapeString($sHashID));
	}

	/**
	 * @param string $sHashID
	 *
	 * @return string
	 */
	public function getMinListByUserId($iUserId)
	{
		$sSql = 'SELECT hash_id, hash, data, expire_date FROM %smin_hashes WHERE user_id = %d';

		return sprintf($sSql, $this->prefix(), $iUserId);
	}	
	
	/**
	 * @param string $sHash
	 *
	 * @return string
	 */
	public function deleteMinByHash($sHash)
	{
		$sSql = 'DELETE FROM %smin_hashes WHERE hash = %s';

		return sprintf($sSql, $this->prefix(), $this->escapeString($sHash));
	}

	/**
	 * @param string $sHashID
	 *
	 * @return string
	 */
	public function deleteMinByID($sHashID)
	{
		$sSql = 'DELETE FROM %smin_hashes WHERE hash_id = %s';

		return sprintf($sSql, $this->prefix(), $this->escapeString($sHashID));
	}

	/**
	 * @param string $sHash
	 * @param string $sHashID
	 * @param string $sEncodedParams
	 *
	 * @return string
	 */
	public function createMin($sHash, $sHashID, $sEncodedParams, $iUserId = null, $iExpireDate = null)
	{
		$sExpireDate = $iExpireDate ? (int) $iExpireDate : 'NULL';
		$sSql = 'INSERT INTO %smin_hashes ( hash_id, user_id, hash, data, expire_date ) VALUES ( %s, %d, %s, %s, %s )';

		return sprintf($sSql, $this->prefix(), $this->escapeString($sHashID), $iUserId, $this->escapeString($sHash),
			$this->escapeString($sEncodedParams), $sExpireDate);
	}

	/**
	 * @param string $sHashID
	 * @param string $sEncodedParams
	 * @param string $sNewHashID Default value is **null**
	 *
	 * @return string
	 */
	public function updateMinByID($sHashID, $sEncodedParams, $sNewHashID = null)
	{
		$sAdd = '';
		if (!empty($sNewHashID))
		{
			$sAdd = sprintf(', hash_id = %s', $this->escapeString($sNewHashID));
		}

		$sSql = 'UPDATE %smin_hashes SET data = %s%s WHERE hash_id = %s';

		return sprintf($sSql, $this->prefix(), $this->escapeString($sEncodedParams), $sAdd, $this->escapeString($sHashID));
	}
	
	/**
	 * @param string $sHash
	 * @param string $sEncodedParams
	 * @param string $sNewHashID Default value is **null**
	 *
	 * @return string
	 */
	public function updateMinByHash($sHash, $sEncodedParams, $sNewHashID = null)
	{
		$sAdd = '';
		if (!empty($sNewHashID))
		{
			$sAdd = sprintf(', hash_id = %s', $this->escapeString($sNewHashID));
		}
		
		$sSql = 'UPDATE %smin_hashes SET data = %s%s WHERE hash = %s';

		return sprintf($sSql, $this->prefix(), $this->escapeString($sEncodedParams), $sAdd, $this->escapeString($sHash));
	}
}
