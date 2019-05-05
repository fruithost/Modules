<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\MailWebclient;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractWebclientModule
{
	/**
	 * Initializes CoreWebclient Module.
	 * 
	 * @ignore
	 */
	public function init() 
	{
		\Aurora\Modules\Core\Classes\User::extend(
			self::GetName(),
			[
				'AllowChangeInputDirection'		=> array('bool', $this->getConfig('AllowChangeInputDirection', false)),
				'MailsPerPage'					=> array('int', $this->getConfig('MailsPerPage', 20)),
				'ShowMessagesCountInFolderList'	=> array('bool', $this->getConfig('ShowMessagesCountInFolderList', false)),
				'HorizontalLayout'				=> array('bool', $this->getConfig('HorizontalLayoutByDefault', false)),
			]
		);		
		
		$this->subscribeEvent('Mail::UpdateSettings::after', array($this, 'onAfterUpdateSettings'));
	}
	
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);
		
		$aSettings = array(
			'AllowAppRegisterMailto' => $this->getConfig('AllowAppRegisterMailto', false),
			'AllowChangeInputDirection' => $this->getConfig('AllowChangeInputDirection', false),
			'AllowExpandFolders' => $this->getConfig('AllowExpandFolders', false),
			'AllowSpamFolder' => $this->getConfig('AllowSpamFolder', true),
			'AllowAddNewFolderOnMainScreen' => $this->getConfig('AllowAddNewFolderOnMainScreen', false),
			'ComposeToolbarOrder' => $this->getConfig('ComposeToolbarOrder', array()),
			'DefaultFontName' => $this->getConfig('DefaultFontName', 'Tahoma'),
			'DefaultFontSize' => $this->getConfig('DefaultFontSize', 3),
			'JoinReplyPrefixes' => $this->getConfig('JoinReplyPrefixes', false),
			'MailsPerPage' => $this->getConfig('MailsPerPage', 20),
			'MaxMessagesBodiesSizeToPrefetch' => $this->getConfig('MaxMessagesBodiesSizeToPrefetch', 50000),
			'MessageBodyTruncationThreshold' => $this->getConfig('MessageBodyTruncationThreshold', 650000), // in bytes
			'ShowEmailAsTabName' => $this->getConfig('ShowEmailAsTabName', true),
			'AllowShowMessagesCountInFolderList' => $this->getConfig('AllowShowMessagesCountInFolderList', false),
			'AllowSearchMessagesBySubject' => $this->getConfig('AllowSearchMessagesBySubject', false),
			'PrefixesToRemoveBeforeSearchMessagesBySubject' => $this->getConfig('PrefixesToRemoveBeforeSearchMessagesBySubject', []),
			'AllowHorizontalLayout' => $this->getConfig('AllowHorizontalLayout', false),
			'HorizontalLayoutByDefault' => $this->getConfig('HorizontalLayoutByDefault', false),
		);
		
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oUser && $oUser->Role === \Aurora\System\Enums\UserRole::NormalUser)
		{
			if (isset($oUser->{self::GetName().'::AllowChangeInputDirection'}))
			{
				$aSettings['AllowChangeInputDirection'] = $oUser->{self::GetName().'::AllowChangeInputDirection'};
			}
			if (isset($oUser->{self::GetName().'::MailsPerPage'}))
			{
				$aSettings['MailsPerPage'] = $oUser->{self::GetName().'::MailsPerPage'};
			}
			if (isset($oUser->{self::GetName().'::ShowMessagesCountInFolderList'}))
			{
				$aSettings['ShowMessagesCountInFolderList'] = $oUser->{self::GetName().'::ShowMessagesCountInFolderList'};
			}
			if ($this->getConfig('AllowHorizontalLayout', false) && isset($oUser->{self::GetName().'::HorizontalLayout'}))
			{
				$aSettings['HorizontalLayout'] = $oUser->{self::GetName().'::HorizontalLayout'};
			}
		}
		
		return $aSettings;
	}
	
	public function onAfterUpdateSettings($Args, &$Result)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oUser)
		{
			if ($oUser->Role === \Aurora\System\Enums\UserRole::NormalUser)
			{
				$oCoreDecorator = \Aurora\Modules\Core\Module::Decorator();
				if (isset($Args['MailsPerPage']))
				{
					$oUser->{self::GetName().'::MailsPerPage'} = $Args['MailsPerPage'];
				}
				if (isset($Args['AllowChangeInputDirection']))
				{
					$oUser->{self::GetName().'::AllowChangeInputDirection'} = $Args['AllowChangeInputDirection'];
				}
				if (isset($Args['ShowMessagesCountInFolderList']))
				{
					$oUser->{self::GetName().'::ShowMessagesCountInFolderList'} = $Args['ShowMessagesCountInFolderList'];
				}
				if ($this->getConfig('AllowHorizontalLayout', false) && isset($Args['HorizontalLayout']))
				{
					$oUser->{self::GetName().'::HorizontalLayout'} = $Args['HorizontalLayout'];
				}
				return $oCoreDecorator->UpdateUserObject($oUser);
			}
			if ($oUser->Role === \Aurora\System\Enums\UserRole::SuperAdmin)
			{
				if (isset($Args['MailsPerPage']))
				{
					$this->setConfig('MailsPerPage', $Args['MailsPerPage']);
				}
				if (isset($Args['AllowChangeInputDirection']))
				{
					$this->setConfig('AllowChangeInputDirection', $Args['AllowChangeInputDirection']);
				}
				if ($this->getConfig('AllowHorizontalLayout', false) && isset($Args['HorizontalLayoutByDefault']))
				{
					$this->setConfig('HorizontalLayoutByDefault', $Args['HorizontalLayoutByDefault']);
				}
				return $this->saveModuleConfig();
			}
		}
	}
}
