<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\MailChangePasswordPoppassdPlugin;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Api
 * @subpackage Net
 */
class Poppassd extends \Aurora\System\Net\AbstractProtocol
{
	/**
	 * @return bool
	 */
	public function Connect()
	{
		$bResult = false;
		if (parent::Connect())
		{
			$bResult = $this->CheckResponse($this->GetNextLine(), 0);
		}
		return $bResult;
	}

	/**
	 * @param string $sLogin
	 * @param string $sPassword
	 * @return bool
	 */
	public function Login($sLogin, $sPassword)
	{
		return $this->SendCommand('user '.$sLogin, array(), 1) && $this->SendCommand('pass '.$sPassword, array($sPassword), 1);
	}

	/**
	 * @param string $sLogin
	 * @param string $sPassword
	 * @return bool
	 */
	public function ConnectAndLogin($sLogin, $sPassword)
	{
		return $this->Connect() && $this->Login($sLogin, $sPassword);
	}

	/**
	 * @return bool
	 */
	public function Disconnect()
	{
		return parent::Disconnect();
	}

	/**
	 * @return bool
	 */
	public function Logout()
	{
		return $this->SendCommand('quit', array(), 0);
	}

	/**
	 * @return bool
	 */
	public function LogoutAndDisconnect()
	{
		return $this->Logout() && $this->Disconnect();
	}

	/**
	 * @param string $sNewPassword
	 * @return bool
	 */
	public function NewPass($sNewPassword)
	{
		$bResult = false;
		$sMessage = '';
		$aLines = [];
		if ($this->WriteLine('newpass '.$sNewPassword, array($sNewPassword)))
		{
			while ($sLine = $this->GetNextLine())
			{
				$aLine = \explode(' ', $sLine);
				if ($aLine[0] == 200)
				{
					$bResult = true;
					break;
				}
				if ($aLine[0] == 500)
				{
					$bResult = false;
					$aLines[] = substr($sLine, 4) ;
				}
			}
		}
		if (!$bResult)
		{
			$sMessage = implode("\n", $aLines);
		}

		return [$bResult, $sMessage];

//		return $this->SendCommand('newpass '.$sNewPassword, array($sNewPassword), 0);
	}

	/**
	 * @param string $sCmd
	 * @return bool
	 */
	public function SendLine($sCmd)
	{
		return $this->WriteLine($sCmd);
	}

	/**
	 * @param string $sCmd
	 * @param array $aHideValues = array()
	 * @param int $iCheckType = 0
	 * @return bool
	 */
	public function SendCommand($sCmd, $aHideValues = array(), $iCheckType = 0)
	{
		if ($this->WriteLine($sCmd, $aHideValues))
		{
			return $this->CheckResponse($this->GetNextLine(), $iCheckType);
		}

		return false;
	}

	/**
	 * @return string
	 */
	public function GetNextLine()
	{
		return $this->ReadLine();
	}

	/**
	 * @param string $sResponse
	 * @param int $iCheckType = 0
	 * @return bool
	 */
	public function CheckResponse($sResponse, $iCheckType = 0)
	{
		switch ($iCheckType)
		{
			case 0:
				return (bool) preg_match('/^2\d\d/', $sResponse);
				break;
			case 1:
				return (bool) preg_match('/^[23]\d\d/', $sResponse);
				break;
		}

		return false;
	}
}
