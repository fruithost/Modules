<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\MailZipWebclientPlugin;

/**
 * Adds Expand button on ZIP-attachment and shows its content.
 * 
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	/* 
	 * @var $oApiFileCache \Aurora\System\Managers\Filecache 
	 */	
	public $oApiFileCache = null;
	
	public function init() 
	{
		$this->oApiFileCache = new \Aurora\System\Managers\Filecache();
	}
	
	/**
	 * Obtains list of module settings for authenticated user.
	 * 
	 * @return array
	 */
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);
		
		return array(
			'AllowZip' => class_exists('ZipArchive')
		);
	}

	public function ExpandFile($UserId, $Hash)
	{
		$mResult = array();
		
		$sUUID = \Aurora\System\Api::getUserUUIDById($UserId);
		$aValues = \Aurora\System\Api::DecodeKeyValues($Hash);
		$oCoreDecorator = \Aurora\Modules\Mail\Module::Decorator();
		
		if (isset($aValues['AccountID']))
		{
			$aFiles = $oCoreDecorator->SaveAttachmentsAsTempFiles($aValues['AccountID'], [$Hash]);
			foreach ($aFiles as $sTempName => $sHash)
			{
				if ($sHash === $Hash)
				{
					$sTempZipPath = $this->oApiFileCache->generateFullFilePath($sUUID, $sTempName);
					$mResult = $this->expandZipAttachment($sUUID, $sTempZipPath);
				}
			}
		}
		else
		{
			$sTempName = (isset($aValues['TempName'])) ? $aValues['TempName'] : 0;
			$sTempZipPath = $this->oApiFileCache->generateFullFilePath($sUUID, $sTempName);
			$mResult = $this->expandZipAttachment($sUUID, $sTempZipPath);
		}
			
		return $mResult;
	}
	
	private function expandZipAttachment($sUUID, $sTempZipPath)
	{
		$aResult = array();
		$bHasMore = false;
		
		$oZip = new \ZipArchive();
		
		if (file_exists($sTempZipPath) && $oZip->open($sTempZipPath))
		{
			// Distributes files by levels.
			$aFilesData = [];
			for ($iIndex = 0; $iIndex < $oZip->numFiles; $iIndex++)
			{
				$aStat = $oZip->statIndex($iIndex);
				if (!empty($aStat['name']))
				{
					$aNameParts = explode('/', $aStat['name']);
					$iFileLevel = count($aNameParts);
					$sFileName = \MailSo\Base\Utils::Utf8Clear(basename($aStat['name']));
					if (!isset($aFilesData[$iFileLevel]) || !is_array($aFilesData[$iFileLevel]))
					{
						$aFilesData[$iFileLevel] = [];
					}
					$aFilesData[$iFileLevel][] = [
						'FileName' => $sFileName,
						'Index' => $iIndex
					];
				}
			}
			// Here $aFilesData contains all levels of folders in ZIP archive.
			
			
			// Reads files level by level and writes them in response until ExpandZipFilesLimit is reached.
			$iFoldersCount = 0;
			$iExpandZipFilesLimit = $this->getConfig('ExpandZipFilesLimit', 500);
			foreach ($aFilesData as $aFiles)
			{
				if (count($aResult) >= $iExpandZipFilesLimit)
				{
					break;
				}
				$iFilesCount = count($aFiles);
				for ($iFileIndex = 0; $iFileIndex < $iFilesCount && count($aResult) < $iExpandZipFilesLimit; $iFileIndex++)
				{
					$aFileItemData = $aFiles[$iFileIndex];
					$sFile = $oZip->getFromIndex($aFileItemData['Index']);
					$iFileSize = $sFile ? strlen($sFile) : 0;
					if ($sFile)
					{
						$sTempName = md5(microtime(true).rand(1000, 9999));

						if ($this->oApiFileCache->put($sUUID, $sTempName, $sFile, '', self::GetName()))
						{
							unset($sFile);

							$aResult[] = \Aurora\System\Utils::GetClientFileResponse(
								self::GetName(), \Aurora\System\Api::getAuthenticatedUserId(), $aFileItemData['FileName'], $sTempName, $iFileSize
							);
						}
						else
						{
							unset($sFile);
						}
					}
					else
					{
						// Counts all items that shouldn't be in response (they are folders usually).
						$iFoldersCount++;
					}
				}
			}
			// Determines if there are more files not in the response (because of ExpandZipFilesLimit).
			$bHasMore = ($iFoldersCount + count($aResult)) < $oZip->numFiles;
			$oZip->close();
		}
		return [
			'Files' => $aResult,
			'HasMore' => $bHasMore
		];
	}
	
	/**
	 * @param int $UserId
	 * @param int $AccountID
	 * @param array $Attachments
	 * @return boolean
	 */
	public function SaveAttachments($UserId, $AccountID, $Attachments = array())
	{
		$mResult = false;
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		
		$aAddFiles = array();
		
		$oMailModuleDecorator = \Aurora\Modules\Mail\Module::Decorator();
		if ($oMailModuleDecorator)
		{
			$aTempFiles = $oMailModuleDecorator->SaveAttachmentsAsTempFiles($AccountID, $Attachments);
			if (\is_array($aTempFiles))
			{
				$sUUID = \Aurora\System\Api::getUserUUIDById($UserId);
				foreach ($aTempFiles as $sTempName => $sData)
				{
					$aData = \Aurora\System\Api::DecodeKeyValues($sData);
					if (\is_array($aData) && isset($aData['FileName']))
					{
						$sFileName = (string) $aData['FileName'];
						$sTempPath = $this->oApiFileCache->generateFullFilePath($sUUID, $sTempName);
						$aAddFiles[] = array($sTempPath, $sFileName);
					}
				}
			}			
		}
		
		if (count($aAddFiles) > 0)
		{
			$oZip = new \ZipArchive();
			
			$sZipTempName = md5(microtime());
			$sZipTempPath = $this->oApiFileCache->generateFullFilePath($sUUID, $sZipTempName, '', self::GetName());
			if ($oZip->open($sZipTempPath, \ZipArchive::CREATE))
			{
				foreach ($aAddFiles as $aItem)
				{
					$oZip->addFile($aItem[0], $aItem[1]);
				}
				$oZip->close();
				$iFileSize =  $this->oApiFileCache->fileSize($sUUID, $sZipTempName, '', self::GetName());
				$mResult = \Aurora\System\Utils::GetClientFileResponse(
					self::GetName(), $UserId, 'attachments.zip', $sZipTempName, $iFileSize
				);
			}
		}
		
		return $mResult;
	}
}
