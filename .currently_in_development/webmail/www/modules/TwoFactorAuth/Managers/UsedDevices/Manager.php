<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\TwoFactorAuth\Managers\UsedDevices;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2020, Afterlogic Corp.
 */
class Manager extends \Aurora\System\Managers\AbstractManager
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
	
	public function isTrustedDevicesEnabled()
	{
		$iTrustDevicesForDays = $this->GetModule()->getConfig('TrustDevicesForDays', 0);
		return $this->GetModule()->getConfig('AllowUsedDevices', false) && is_int($iTrustDevicesForDays) && $iTrustDevicesForDays > 0;
	}

	public function getAllDevices($iUserId)
	{
		$aTrustedDevices = (new \Aurora\System\EAV\Query(\Aurora\Modules\TwoFactorAuth\Classes\UsedDevice::class))
			->where(
				[
					'UserId' => $iUserId,
				]
			)
			->orderBy('LastUsageDateTime')
			->sortOrder(\Aurora\System\Enums\SortOrder::DESC)
			->exec();
		return $aTrustedDevices;
	}

	public function getDevice($iUserId, $sDeviceId)
	{
		return (new \Aurora\System\EAV\Query(\Aurora\Modules\TwoFactorAuth\Classes\UsedDevice::class))
		->where(
			[
				'UserId' => $iUserId,
				'DeviceId' => $sDeviceId
			]
		)
		->one()
		->exec();
	}
	
	public function getDeviceByAuthToken($iUserId, $sAuthToken)
	{
		return (new \Aurora\System\EAV\Query(\Aurora\Modules\TwoFactorAuth\Classes\UsedDevice::class))
		->where(
			[
				'UserId' => $iUserId,
				'AuthToken' => $sAuthToken
			]
		)
		->one()
		->exec();
	}

	public function checkDeviceAfterAuthenticate($oUser)
	{
		$bDeviceTrusted = false;
		$sDeviceId = \Aurora\System\Api::getDeviceIdFromHeaders();
		if ($sDeviceId && $this->GetModule()->getConfig('TrustDevicesForDays', 0) > 0)
		{
			$oUsedDevice = $this->getDevice($oUser->EntityId, $sDeviceId);
			if ($oUsedDevice)
			{
				if ($oUsedDevice->TrustTillDateTime > time())
				{
					$bDeviceTrusted = true;
					$oUsedDevice->LastUsageDateTime = time();
					$oUsedDevice->save();
				}
			}
		}
		return $bDeviceTrusted;
	}
	
	public function trustDevice($iUserId, $sDeviceId, $sDeviceName)
	{
		$oUsedDevice = $this->getDevice($iUserId, $sDeviceId);
		if (!$oUsedDevice)
		{
			$oUsedDevice = $this->_createUsedDevice($iUserId, $sDeviceId, $sDeviceName);
		}
		else
		{
			$oUsedDevice->DeviceName = $sDeviceName;
		}
		
		if ($this->isTrustedDevicesEnabled())
		{
			$iTrustDevicesForDays = $this->GetModule()->getConfig('TrustDevicesForDays', 0);
			$oUsedDevice->TrustTillDateTime = time() + $iTrustDevicesForDays * 24 * 60 * 60;
		}
		else
		{
			$oUsedDevice->TrustTillDateTime = $oUsedDevice->CreationDateTime;
		}

		return $oUsedDevice->save();
	}
	
	public function saveDevice($iUserId, $sDeviceId, $sDeviceName, $sAuthToken)
	{
		$oUsedDevice = $this->getDevice($iUserId, $sDeviceId);
		if (!$oUsedDevice)
		{
			$oUsedDevice = $this->_createUsedDevice($iUserId, $sDeviceId, $sDeviceName);
		}
		else
		{
			$oUsedDevice->DeviceName = $sDeviceName;
		}

		$oUsedDevice->AuthToken = $sAuthToken;
		$oUsedDevice->LastUsageDateTime = time();

		return $oUsedDevice->save();
	}
	
	public function revokeTrustFromAllDevices($oUser)
	{
		$mResult = true;
		$aTrustedDevices = $this->getAllDevices($oUser->EntityId);
		foreach ($aTrustedDevices as $oUsedDevice)
		{
			$oUsedDevice->TrustTillDateTime = $oUsedDevice->CreationDateTime;
			$mResult = $mResult && $oUsedDevice->save();
		}
		return $mResult;
	}

	private function _createUsedDevice($iUserId, $sDeviceId, $sDeviceName)
	{
		$oUsedDevice = new \Aurora\Modules\TwoFactorAuth\Classes\UsedDevice();
		$oUsedDevice->UserId = $iUserId;
		$oUsedDevice->DeviceId = $sDeviceId;
		$oUsedDevice->DeviceName = $sDeviceName;
		$oUsedDevice->CreationDateTime = time();
		$oUsedDevice->TrustTillDateTime = $oUsedDevice->CreationDateTime;
		$oUsedDevice->LastUsageDateTime = $oUsedDevice->CreationDateTime;
		
		// $_SERVER['REMOTE_ADDR'] may not actually contain real client IP addresses, as it will give you a proxy address for clients connected through a proxy, for example.
		// But the client can set all HTTP header information (ie. $_SERVER['HTTP_CLIENT_IP'], $_SERVER['HTTP_X_FORWARDED_FOR']) to any arbitrary value it wants, so we cannot rely on them.
		$oUsedDevice->DeviceIP = $_SERVER['REMOTE_ADDR'];
		
		return $oUsedDevice;
	}
}
