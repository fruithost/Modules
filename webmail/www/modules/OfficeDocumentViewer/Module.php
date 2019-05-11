<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\OfficeDocumentViewer;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	/**
	 * Initializes module.
	 * 
	 * @ignore
	 */
	public function init()
	{
		$this->subscribeEvent('System::download-file-entry::before', array($this, 'onBeforeFileViewEntry'));
		$this->subscribeEvent('System::file-cache-entry::before', array($this, 'onBeforeFileViewEntry'));
		$this->subscribeEvent('System::mail-attachment-entry::before', array($this, 'onBeforeFileViewEntry'));
	}
	
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		return array(
			'ExtensionsToView' => $this->getExtensionsToView()
		);
	}
	
	protected function getExtensionsToView()
	{
		return $this->getConfig('ExtensionsToView', [
			'doc', 
			'docx', 
			'docm', 
			'dotm', 
			'dotx', 
			'xlsx', 
			'xlsb', 
			'xls', 
			'xlsm', 
			'pptx', 
			'ppsx', 
			'ppt', 
			'pps', 
			'pptm', 
			'potm', 
			'ppam', 
			'potx', 
			'ppsm', 
			'odt', 
			'odx']
		);
	}
	
	/**
	 * @param string $sFileName = ''
	 * @return bool
	 */
	protected function isOfficeDocument($sFileName = '')
	{
		$sExtensions = implode('|', $this->getExtensionsToView());
		return !!preg_match('/\.(' . $sExtensions . ')$/', strtolower(trim($sFileName)));
	}	
	
	/**
	 * 
	 * @param type $aArguments
	 * @param type $aResult
	 */
	public function onBeforeFileViewEntry(&$aArguments, &$aResult)
	{
		$sEntry = (string) \Aurora\System\Application::GetPathItemByIndex(0, '');
		$sHash = (string) \Aurora\System\Application::GetPathItemByIndex(1, '');
		$sAction = (string) \Aurora\System\Application::GetPathItemByIndex(2, '');

		$aValues = \Aurora\System\Api::DecodeKeyValues($sHash);
		
		$sFileName = isset($aValues['Name']) ? urldecode($aValues['Name']) : '';
		if (empty($sFileName))
		{
			$sFileName = isset($aValues['FileName']) ? urldecode($aValues['FileName']) : '';
		}

		if ($this->isOfficeDocument($sFileName) && $sAction === 'view' && !isset($aValues['AuthToken']))
		{
			$aValues['AuthToken'] = \Aurora\System\Api::UserSession()->Set(
				array(
					'token' => 'auth',
					'id' => \Aurora\System\Api::getAuthenticatedUserId()
				),
				time() + 60 * 5 // 5 min
			);			
			
			$sHash = \Aurora\System\Api::EncodeKeyValues($aValues);
			
			// 'https://view.officeapps.live.com/op/view.aspx?src=';
			// 'https://view.officeapps.live.com/op/embed.aspx?src=';
			// 'https://docs.google.com/viewer?embedded=true&url=';
			
			$sViewerUrl = $this->getConfig('ViewerUrl');
			if (!empty($sViewerUrl))
			{
				\header('Location: ' . $sViewerUrl . urlencode($_SERVER['HTTP_REFERER'] . '?' . $sEntry .'/' . $sHash . '/' . $sAction));
			}
		}
		$sAuthToken = isset($aValues['AuthToken']) ? $aValues['AuthToken'] : null;
		if (isset($sAuthToken))
		{
			\Aurora\System\Api::setAuthToken($sAuthToken);
			\Aurora\System\Api::setUserId(
				\Aurora\System\Api::getAuthenticatedUserId($sAuthToken)
			);
		}			
	}
}	
