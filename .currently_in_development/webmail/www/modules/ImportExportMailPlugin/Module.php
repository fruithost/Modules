<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\ImportExportMailPlugin;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	/*
	 * @var $oFilecacheManager \Aurora\System\Managers\Filecache
	 */
	public $oFilecacheManager = null;
	public $sLogPrefix = 'plugin-import-export-mail-';

	public function init()
	{
		$this->aErrors = [
			Enums\ErrorCodes::UnknownError	=> $this->i18N('UNKNOWN_ERROR'),
			Enums\ErrorCodes::ErrorSizeLimit	=> $this->i18N('ERROR_SIZE_LIMIT', ['SIZE' => $this->getConfig('UploadSizeLimitMb', 0)])
		];

		$this->AddEntry('transfer-mail', 'EntryTransferMail');
	}

	/**
	 * Obtains list of module settings
	 *
	 * @return array
	 */
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		return [
			'UploadSizeLimitMb' => $this->getConfig('UploadSizeLimitMb', 0)
		];
	}

	/**
	 * Creating empty files before data export
	 *
	 * @return bool|array
	 */
	public function ExportMailPrepare()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		$mResult = false;
		$oUser = \Aurora\System\Api::getAuthenticatedUser();

		if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
		{
			$sZipName = \md5(\time().\rand(1000, 9999));
			$mResult = [
				'Zip' => $sZipName,
			];
			$this->getFilecacheManager()->put($oUser->PublicId, $sZipName, '', '.zip');
			$this->getFilecacheManager()->put($oUser->PublicId, $sZipName, 'prepare', '.info');
		}

		return $mResult;
	}

	/**
	 * Exporting mails into zip file
	 *
	 * @param int $AccountId Mail account ID
	 * @param string $Folder Folder name
	 * @param string $Zip ZIP file name
	 * @return boolean
	 * @throws \Aurora\Modules\ImportExportMailPlugin\Exception
	 */
	public function ExportMailGenerate($AccountId, $Folder, $Zip)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		$bResult = false;
		$oUser = \Aurora\System\Api::getAuthenticatedUser();

		if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
		{
			$sUserPublicId = $oUser->PublicId;
			try
			{
				$aTempFiles = [];

				$this->getFilecacheManager()->put($oUser->PublicId, $Zip, 'generate', '.info');
				$oAccount = \Aurora\System\Api::GetModule('Mail')->GetAccount($AccountId);

				if ($Folder !== null && $Zip !== null
					&& $oAccount
					&& $oAccount->IdUser === $oUser->EntityId)
				{
					$oApiMail = $this->getMailManager();
					$iOffset = 0;
					$iLimit = 20;

					$sZipFilePath = $this->getFilecacheManager()->generateFullFilePath($sUserPublicId, $Zip, '.zip');
					$rZipResource = fopen($sZipFilePath, 'w+b');
					$oZip = new \ZipStream\ZipStream(null, [\ZipStream\ZipStream::OPTION_OUTPUT_STREAM => $rZipResource]);
					$this->Log('Start fetching mail');

					$self = $this;

					$aData = $oApiMail->getFolderInformation($oAccount, $Folder);
					$iCount = (is_array($aData) && 4 === count($aData)) ? $aData[0] : 0;

					while ($iOffset <= $iCount)
					{
						$oMessageListCollection =  $oApiMail->getMessageList($oAccount, $Folder, $iOffset, $iLimit);
						$oMessageListCollection->ForeachList(function ($oMessage) use ($oApiMail, $sUserPublicId, $oAccount, $self, $Folder, &$oZip, &$aTempFiles) {
							$iUid = $oMessage->getUid();
							$oApiMail->directMessageToStream($oAccount,
								function($rResource, $sContentType, $sFileName, $sMimeIndex = '') use ($sUserPublicId, $self, $iUid, &$oZip, &$aTempFiles) {

									$sTempName = \md5(\time().\rand(1000, 9999).$sFileName);
									$aTempFiles[] = $sTempName;

									if (is_resource($rResource) && $self->getFilecacheManager()->putFile($sUserPublicId, $sTempName, $rResource))
									{
										$sFilePath = $self->getFilecacheManager()->generateFullFilePath($sUserPublicId, $sTempName);
										$rSubResource = fopen($sFilePath, 'rb');
										if (is_resource($rSubResource))
										{
											$sFileName = 'uid-' . $iUid . '.eml';
											$self->Log('Append file \'' . $sFileName . '\' to ZIP');
											$oZip->addFileFromStream($sFileName, $rSubResource, [], \ZipStream\ZipStream::METHOD_STORE);
											$MemoryUsage = memory_get_usage(true)/(1024*1024);
											$self->Log('Memory usage: ' . $MemoryUsage);
											@fclose($rSubResource);
										}
									}
								}, $Folder, $iUid);
						});
						$iOffset = $iOffset + $iLimit;
					}
					$this->Log('End fetching mail');
					$oZip->finish();
					$this->Log('Create ZIP file');
					foreach ($aTempFiles as $sTempName)
					{
						$this->Log('Remove temp file: ' . $sTempName);
						$self->getFilecacheManager()->clear($sUserPublicId, $sTempName);
					}
				}
				$this->Log('Generating ZIP Result: ');
				$this->getFilecacheManager()->put($sUserPublicId, $Zip, 'ready', '.info');
				$bResult = true;
			}
			catch (Exception $oException)
			{
				$this->getFilecacheManager()->put($sUserPublicId, $Zip, 'error', '.info');
				$this->Log($oException, true);
				throw $oException;
			}
		}

		return $bResult;
	}

	/**
	 * Checking status of export process
	 *
	 * @param string $Zip ZIP file name
	 * @return bool|array
	 */
	public function ExportMailStatus($Zip)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		$mResult = false;
		$oUser = \Aurora\System\Api::getAuthenticatedUser();

		if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
		{
			if ($this->getFilecacheManager()->isFileExists($oUser->PublicId, $Zip, '.info'))
			{
				$mResult = [
					'Status' => $this->getFilecacheManager()->get($oUser->PublicId, $Zip, '.info')
				];
			}
		}

		return $mResult;
	}

	/**
	 * Entry point for mail export
	 */
	public function EntryTransferMail()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$sAction = (string) \Aurora\System\Router::getItemByIndex(1, '');
		$sFileName = (string) \Aurora\System\Router::getItemByIndex(2, '');
		if ($sAction === 'export')
		{
			$this->ExportMail($sFileName);
		}
	}

	/**
	 * Downloading of exported emails
	 *
	 * @param string $sFileName
	 */
	public function ExportMail($sFileName)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		@ob_start();
		ini_set('display_errors', 0);
		if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
		{
			$this->getFilecacheManager()->put($oUser->PublicId, $sFileName, 'download', '.info');
			$this->Log('Start downloading ZIP file.. ');

			$sZipFilePath = $this->getFilecacheManager()->generateFullFilePath($oUser->PublicId, $sFileName, '.zip');
			$iFileSize = filesize($sZipFilePath);
			$this->Log('ZIP file size: ' . $iFileSize);

			header("Content-type: application/zip");
			header("Content-Disposition: attachment; filename=export-mail.zip");
			header('Accept-Ranges: none', true);
			header('Content-Transfer-Encoding: binary');
			header("Content-Length: " . $iFileSize);
			header("Pragma: no-cache");
			header("Expires: 0");

			$rZipResource = \fopen($sZipFilePath, 'rb');
			if ($rZipResource !== false)
			{
				$this->Log('Start write data to buffer');
				rewind($rZipResource);
				while (!\feof($rZipResource))
				{
					$MemoryUsage = memory_get_usage(true)/(1024*1024);
					$this->Log('Write data to buffer - memory usage:' . $MemoryUsage);
					$sBuffer = @\fread($rZipResource, 8192);
					if (false !== $sBuffer)
					{
						echo $sBuffer;
						ob_flush();
						flush();
						\MailSo\Base\Utils::ResetTimeLimit();
						continue;
					}
					break;
				}
				@\fclose($rZipResource);
				$this->Log('End write data to buffer');
			}
			else
			{
				$this->Log("Error. File {$sZipFilePath} not found.");
			}
			$this->Log('Finish ZIP file downloading');
		}
		@ob_get_clean();
		exit;
	}

	/**
	 * Importing emails into specified folder
	 *
	 * @param int $AccountId Mail account ID
	 * @param string $Folder Folder name
	 * @param array $UploadData Information about uploaded file
	 * @return boolean
	 * @throws \Aurora\System\Exceptions\BaseException
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function ImportMail($AccountId, $Folder, $UploadData)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$bResult = false;
		$oAccount = \Aurora\System\Api::GetModule('Mail')->GetAccount($AccountId);

		if ($oAccount instanceof \Aurora\Modules\Mail\Classes\Account && is_array($UploadData))
		{
			$oUser = \Aurora\System\Api::getAuthenticatedUser();
			if (is_array($UploadData) && $oUser instanceof \Aurora\Modules\Core\Classes\User)
			{
				$iSize = (int) $UploadData['size'];
				$iUploadSizeLimitMb = $this->getConfig('UploadSizeLimitMb', 0);
				if ($iUploadSizeLimitMb > 0 && $iSize/(1024*1024) > $iUploadSizeLimitMb)
				{
					throw new \Aurora\System\Exceptions\BaseException(Enums\ErrorCodes::ErrorSizeLimit);
				}
				$sUploadName = $UploadData['name'];
				$bIsZipExtension  = strtolower(pathinfo($sUploadName, PATHINFO_EXTENSION)) === 'zip';
				if ($bIsZipExtension)
				{
					$sSavedName = 'upload-post-' . md5($UploadData['name'] . $UploadData['tmp_name']);
					if (is_resource($UploadData['tmp_name']))
					{
						$this->getFilecacheManager()->putFile($oUser->UUID, $sSavedName, $UploadData['tmp_name']);
					}
					else
					{
						$this->getFilecacheManager()->moveUploadedFile($oUser->UUID, $sSavedName, $UploadData['tmp_name']);
					}
					if ($this->getFilecacheManager()->isFileExists($oUser->UUID, $sSavedName))
					{
						$sSavedFullName = $this->getFilecacheManager()->generateFullFilePath($oUser->UUID, $sSavedName);
						$oZip = new \ZipArchive();
						if ($oZip->open($sSavedFullName))
						{
							for($i = 0; $i < $oZip->numFiles; $i++)
							{
								$sFileName = $oZip->getNameIndex($i);
								if (strtolower(pathinfo($sFileName, PATHINFO_EXTENSION)) === 'eml')
								{
									$aFileParams = $oZip->statIndex($i);
									$iStreamSize = $aFileParams['size'];
									$rMessage = $oZip->getStream($sFileName);
									if (is_resource($rMessage))
									{
										$this->getMailManager()->appendMessageFromStream($oAccount, $rMessage, $Folder, $iStreamSize);
										@fclose($rMessage);
									}
								}
							}
							$oZip->close();
							$bResult = true;
						}
					}
					else
					{
						throw new \Aurora\System\Exceptions\BaseException(Enums\ErrorCodes::UnknownError);
					}
				}
			}
		}
		else
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		return $bResult;
	}

	/***private***/
	private function getMailManager()
	{
		static $oMailManager = null;
		if ($oMailManager === null)
		{
			$oMailManager = new \Aurora\Modules\Mail\Managers\Main\Manager($this);
		}

		return $oMailManager;
	}

	private function getFilecacheManager()
	{
		if ($this->oFilecacheManager === null)
		{
			$this->oFilecacheManager = new \Aurora\System\Managers\Filecache();
		}

		return $this->oFilecacheManager;
	}

	private function Log($mLog, $bIsException = false, $bIsObject = false)
	{
		if ($bIsException)
		{
			\Aurora\System\Api::LogException($mLog, \Aurora\System\Enums\LogLevel::Full, $this->sLogPrefix);
		}
		else if ($bIsObject)
		{
			\Aurora\System\Api::LogObject($mLog, \Aurora\System\Enums\LogLevel::Full, $this->sLogPrefix);
		}
		else
		{
			\Aurora\System\Api::Log($mLog, \Aurora\System\Enums\LogLevel::Full, $this->sLogPrefix);
		}
	}
}
