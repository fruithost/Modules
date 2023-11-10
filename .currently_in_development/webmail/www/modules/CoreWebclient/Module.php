<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\CoreWebclient;

/**
 * System module that provides Web application core functionality and UI framework.
 *
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2020, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractWebclientModule
{
	/***** private functions *****/
	/**
	 * Initializes CoreWebclient Module.
	 *
	 * @ignore
	 */
	public function init()
	{
		\Aurora\System\Router::getInstance()->registerArray(
			self::GetName(),
			[
				'default' => [$this, 'EntryDefault'],
				'error' => [$this, 'EntryDefault'],
				'debugmode' => [$this, 'EntryDefault'],
				'xdebug_session_start' => [$this, 'EntryDefault'],
				'install' => [$this, 'EntryCompatibility']
			]
		);

		\Aurora\Modules\Core\Classes\User::extend(
			self::GetName(),
			[
				'AllowDesktopNotifications'		=> array('bool', $this->getConfig('AllowDesktopNotifications', false)),
				'AutoRefreshIntervalMinutes'	=> array('int', $this->getConfig('AutoRefreshIntervalMinutes', 0)),
				'Theme'							=> array('string', $this->getConfig('Theme', 'Default')),
			]

		);

		$this->subscribeEvent('Core::UpdateSettings::after', array($this, 'onAfterUpdateSettings'));
		
		$this->denyMethodsCallByWebApi([
			'SetHtmlOutputHeaders',
		]);
	}

	/**
	 *
	 * @param array $aSystemList
	 * @return array
	 */
	private function getLanguageList($aSystemList)
	{
		$aResultList = [];
		$aLanguageNames = $this->getConfig('LanguageNames', false);
		foreach ($aSystemList as $sLanguage)
		{
			if (isset($aLanguageNames[$sLanguage]))
			{
				$aResultList[] = [
					'name' => $aLanguageNames[$sLanguage],
					'value' => $sLanguage
				];
			}
			else
			{
				$aResultList[] = [
					'name' => $sLanguage,
					'value' => $sLanguage
				];
			}
		}
		return $aResultList;
	}
	/***** private functions *****/

	/***** public functions *****/
	/**
	 *
	 * @return array
	 */
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		$oIntegrator = \Aurora\System\Api::GetModule('Core')->getIntegratorManager();

		return array(
			'AllowChangeSettings' => $this->getConfig('AllowChangeSettings', false),
			'AllowClientDebug' => $this->getConfig('AllowClientDebug', false),
			'AllowDesktopNotifications' => $oUser ? $oUser->{self::GetName().'::AllowDesktopNotifications'} : $this->getConfig('AllowDesktopNotifications', false),
			'AllowMobile' => $this->getConfig('AllowMobile', false),
			'AllowPrefetch' => $this->getConfig('AllowPrefetch', true),
			'AttachmentSizeLimit' => $this->getConfig('AttachmentSizeLimit', 0),
			'AutoRefreshIntervalMinutes' => $oUser ? $oUser->{self::GetName().'::AutoRefreshIntervalMinutes'} : $this->getConfig('AutoRefreshIntervalMinutes', 0),
			'CustomLogoutUrl' => $this->getConfig('CustomLogoutUrl', ''),
			'DefaultAnonymScreenHash' => $this->getConfig('DefaultAnonymScreenHash', ''),
			'DefaultUserScreenHash' => $this->getConfig('DefaultUserScreenHash', ''),
			'GoogleAnalyticsAccount' => $this->getConfig('GoogleAnalyticsAccount', ''),
			'HeaderModulesOrder' => $this->getConfig('HeaderModulesOrder', []),
			'IsDemo' => $this->getConfig('IsDemo', false),
			'IsMobile' => $oIntegrator->isMobile(),
			'LanguageListWithNames' => $this->getLanguageList($oIntegrator->getLanguageList()),
			'MultipleFilesUploadLimit' => $this->getConfig('MultipleFilesUploadLimit', 50),
			'ShowQuotaBar' => $this->getConfig('ShowQuotaBar', false),
			'QuotaWarningPerc' => $this->getConfig('QuotaWarningPerc', 0),
			'Theme' => $oUser ? $oUser->{self::GetName().'::Theme'} : $this->getConfig('Theme', 'Default'),
			'ThemeList' => $this->getConfig('ThemeList', ['Default']),
		);
	}

	/**
	 *
	 * @param array $Args
	 * @param mixed $Result
	 */
	public function onAfterUpdateSettings($Args, &$Result)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oUser && $oUser->isNormalOrTenant())
		{
			if (isset($Args['AllowDesktopNotifications']))
			{
				$oUser->{self::GetName().'::AllowDesktopNotifications'} = $Args['AllowDesktopNotifications'];
			}
			if (isset($Args['AutoRefreshIntervalMinutes']))
			{
				$oUser->{self::GetName().'::AutoRefreshIntervalMinutes'} = $Args['AutoRefreshIntervalMinutes'];
			}
			if (isset($Args['Theme']))
			{
				$oUser->{self::GetName().'::Theme'} = $Args['Theme'];
			}

			$oCoreDecorator = \Aurora\Modules\Core\Module::Decorator();
			$oCoreDecorator->UpdateUserObject($oUser);
		}

		if ($oUser && $oUser->Role === \Aurora\System\Enums\UserRole::SuperAdmin)
		{
			if (isset($Args['Theme']))
			{
				$this->setConfig('Theme', $Args['Theme']);
			}
			$Result = $this->saveModuleConfig();
		}
	}

	/**
	 * @ignore
	 */
	public function SetHtmlOutputHeaders()
	{
		@\header('Content-Type: text/html; charset=utf-8', true);
		$sContentSecurityPolicy = $this->getConfig('ContentSecurityPolicy', '');
		if (!empty($sContentSecurityPolicy))
		{
			$aArgs = [];
			$aAddDefault = [];
			$this->broadcastEvent(
				'AddToContentSecurityPolicyDefault',
				$aArgs,
				$aAddDefault
			);
			if (!empty($aAddDefault))
			{
				$aPieces = explode(';', $sContentSecurityPolicy);
				foreach ($aPieces as $iIndex => $sPiece) {
					$sPrepared = strtolower(trim($sPiece));
					if (strpos($sPrepared, 'default-src') === 0)
					{
						$aPieces[$iIndex] = implode(' ', array_merge([$sPiece], $aAddDefault));
					}
				}
				$sContentSecurityPolicy = implode(';', $aPieces);
			}
			@\header('Content-Security-Policy: ' . $sContentSecurityPolicy, true);
		}
	}

	/**
	 * @ignore
	 */
	public function EntryDefault()
	{
		$sResult = '';

		$oIntegrator = \Aurora\System\Managers\Integrator::getInstance();

		self::Decorator()->SetHtmlOutputHeaders();

		$sUserAgent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
		if (!\strpos(\strtolower($sUserAgent), 'firefox'))
		{
			@\header('Last-Modified: '.\gmdate('D, d M Y H:i:s').' GMT');
		}

		$oSettings =& \Aurora\System\Api::GetSettings();
		if ($oSettings)
		{
			if (($oSettings->GetValue('CacheCtrl', true) && isset($_COOKIE['aft-cache-ctrl'])))
			{
				@\setcookie('aft-cache-ctrl', '', \strtotime('-1 hour'), \Aurora\System\Api::getCookiePath(),
						null, \Aurora\System\Api::getCookieSecure());
				\MailSo\Base\Http::SingletonInstance()->StatusHeader(304);
				exit();
			}
		}

		$sResult = \file_get_contents($this->GetPath().'/templates/Index.html');
		if (\is_string($sResult))
		{
			if ($oSettings)
			{
				$sFrameOptions = $oSettings->GetValue('XFrameOptions', '');
				if (0 < \strlen($sFrameOptions))
				{
					@\header('X-Frame-Options: '.$sFrameOptions);
				}
			}

			$sResult = strtr($sResult, array(
				'{{AppVersion}}' => AU_APP_VERSION,
				'{{IntegratorDir}}' => $oIntegrator->isRtl() ? 'rtl' : 'ltr',
				'{{IntegratorLinks}}' => $oIntegrator->buildHeadersLink(),
				'{{IntegratorBody}}' => $oIntegrator->buildBody()
			));
		}


		return $sResult;
	}

	/**
	 * @ignore
	 */
	public function EntryCompatibility()
	{
		$mResult = '';

		$aCompatibilities = \Aurora\System\Api::GetModuleDecorator('Core')->GetCompatibilities();
		$sContent = '';
		$bResult = true;
		foreach ($aCompatibilities as $sModule => $aItems)
		{
			$sContent .= "<div class=\"row\">
					<h2>Module: " . $sModule . "</h2>
				</div><br />";
			foreach ($aItems as $aItem)
			{
				$sValue = '';
				if ($aItem['Result'])
				{
					$sValue = $this->getSuccessHtmlValue($aItem['Value']);
				}
				else
				{
					if (is_array($aItem['Value']) && count($aItem['Value']) > 0)
					{
						$sValue = $this->getErrorHtmlValue($aItem['Value'][0], isset($aItem['Value'][1]) ? $aItem['Value'][1] : '');
					}
				}
				$sContent .= "<div class=\"row\">
					<span class=\"field_label\"><b>" . $aItem['Name'] . ":</b> </span>
					<span class=\"field_value_limit\">" . $sValue . "</span>
				</div>";
				$bResult &= $aItem['Result'];
			}
		}
		$sContent .= "<br />";

		$sPath = $this->GetPath().'/templates/Compatibility.html';
		if (\file_exists($sPath))
		{
			$sResult = \file_get_contents($sPath);
			if (\is_string($sResult))
			{
				$sResult = strtr($sResult, array(
					'{{Compatibilities}}' => $sContent,
					'{{Result}}' => $bResult ?
					'The current server environment meets all the requirements. Click Next to proceed.' :
					'Please make sure that all the requirements are met and click Retry.',

					'{{NextButtonHref}}' => ($bResult) ? './' : './?install',
					'{{ResultClassSuffix}}' => ($bResult) ? '_ok' : '_error',
					'{{NextButtonName}}' => ($bResult) ? 'next_btn' : 'retry_btn',
					'{{NextButtonValue}}' => ($bResult) ? 'Next' : 'Retry'

				));

				$mResult = $sResult;
			}
		}

		return $mResult;
	}

	protected function getSuccessHtmlValue($sValue)
	{
		return '<span class="state_ok">'.$sValue.'</span>';
	}

	protected function getErrorHtmlValue($sError, $sErrorHelp = '')
	{
		$sResult = '<span class="state_error">'.$sError.'</span>';
		if (!empty($sErrorHelp))
		{
			$sResult .= '<span class="field_description">'.$sErrorHelp.'</span>';
		}
		return $sResult;
	}

	protected function getWarningHtmlValue($sVarning, $sVarningHelp = '')
	{
		$sResult = '<span class="state_warning"><img src="./images/alarm.png"> Not detected. <br />'.$sVarning.'</span>';
		if (!empty($sVarningHelp))
		{
			$sResult .= '<span class="field_description">'.$sVarningHelp.'</span>';
		}
		return $sResult;
	}


}
