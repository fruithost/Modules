<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\Core;

use Aurora\System\Exceptions\ApiException;

/**
 * System module that provides core functionality such as User management, Tenants management.
 *
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	protected $oTenantsManager = null;

	protected $oChannelsManager = null;

	protected $oUsersManager = null;

	protected $oIntegratorManager = null;

	public function getTenantsManager()
	{
		if ($this->oTenantsManager === null)
		{
			$this->oTenantsManager = new Managers\Tenants($this);
		}

		return $this->oTenantsManager;
	}

	public function getChannelsManager()
	{
		if ($this->oChannelsManager === null)
		{
			$this->oChannelsManager = new Managers\Channels($this);
		}

		return $this->oChannelsManager;
	}

	public function getUsersManager()
	{
		if ($this->oUsersManager === null)
		{
			$this->oUsersManager = new Managers\Users($this);
		}

		return $this->oUsersManager;
	}

	public function getIntegratorManager()
	{
		if ($this->oIntegratorManager === null)
		{
			$this->oIntegratorManager = new \Aurora\System\Managers\Integrator();
		}

		return $this->oIntegratorManager;
	}


	/***** private functions *****/
	/**
	 * Initializes Core Module.
	 *
	 * @ignore
	 */
	public function init()
	{
		\Aurora\System\Router::getInstance()->registerArray(
			self::GetName(),
			[
				'api' => [$this, 'EntryApi'],
				'ping' => [$this, 'EntryPing'],
				'pull' => [$this, 'EntryPull'],
				'mobile' => [$this, 'EntryMobile'],
				'sso' => [$this, 'EntrySso'],
				'postlogin' => [$this, 'EntryPostlogin'],
				'file-cache' => [$this, 'EntryFileCache']
			]
		);

		\Aurora\System\EventEmitter::getInstance()->onAny(
			[
				['CreateAccount', [$this, 'onCreateAccount'], 100],
				['Core::GetCompatibilities::after', [$this, 'onAfterGetCompatibilities']],
				['ChangePassword::after', [$this, 'onAfterChangePassword']],
				['System::RunEntry::before', [$this, 'onBeforeRunEntry'], 100]
			]
		);

		$this->denyMethodsCallByWebApi([
			'UpdateUserObject',
			'GetUserByUUID',
			'GetUserByPublicId',
			'GetAdminUser',
			'GetTenantUnchecked',
			'GetTenantName',
			'GetTenantIdByName',
			'GetDefaultGlobalTenant',
			'UpdateTenantObject',
			'GetUserUnchecked',
			'UpdateTokensValidFromTimestamp',
			'GetAccountUsedToAuthorize',
			'GetDigestHash',
			'VerifyPassword',
			'SetAuthDataAndGetAuthToken',
			'IsModuleDisabledForObject',
			'GetBlockedUser',
			'BlockUser',
			'CheckIsBlockedUser'
		]);
	}

	/**
	 *
	 * @return mixed
	 */
	private function getUploadData()
	{
		$mResult = false;
		$oFile = null;
		if (isset($_FILES) && count($_FILES) > 0)
		{
			$oFile = current($_FILES);
		}
		if (isset($oFile, $oFile['name'], $oFile['tmp_name'], $oFile['size'], $oFile['type']))
		{
			$iError = (isset($oFile['error'])) ? (int) $oFile['error'] : UPLOAD_ERR_OK;
			$mResult = (UPLOAD_ERR_OK === $iError) ? $oFile : false;
		}

		return $mResult;
	}

	/**
	 * Is called by CreateAccount event. Finds or creates and returns User for new account.
	 *
	 * @ignore
	 * @param array $Args {
	 *		*int* **UserId** Identifier of existing user.
	 *		*int* **TenantId** Identifier of tenant for creating new user in it.
	 *		*int* **$PublicId** New user name.
	 * }
	 * @param \Aurora\Modules\Core\Classes\User $oResult
	 */
	public function onCreateAccount(&$Args, &$Result)
	{
		$oUser = null;

		if (isset($Args['UserId']) && (int)$Args['UserId'] > 0)
		{
			$oUser = $this->getUsersManager()->getUser($Args['UserId']);
		}
		else
		{
			$Email = (isset($Args['Email'])) ? $Args['Email'] : '';
			$PublicId = (isset($Args['PublicId'])) ? $Args['PublicId'] : '';
			$sPublicId = null;
			if (!empty($PublicId))
			{
				$sPublicId = $PublicId;
			}
			else if (!empty($Email))
			{
				$sPublicId = $Email;
			}
			if (!empty($sPublicId))
			{
				$oUser = $this->getUsersManager()->getUserByPublicId($sPublicId);
			}
			if (!isset($oUser))
			{
				$bPrevState = \Aurora\System\Api::skipCheckUserRole(true);
				$iUserId = self::Decorator()->CreateUser(isset($Args['TenantId']) ? (int) $Args['TenantId'] : 0, $sPublicId);
				\Aurora\System\Api::skipCheckUserRole($bPrevState);
				$oUser = $this->getUsersManager()->getUser($iUserId);
			}

			if (isset($oUser) && isset($oUser->EntityId))
			{
				$Args['UserId'] = $oUser->EntityId;
			}
		}

		$Result = $oUser;
	}

	/**
	 * @ignore
	 * @param type $aArgs
	 * @param array $mResult
	 */
	public function onAfterGetCompatibilities($aArgs, &$mResult)
	{
		$aCompatibility['php.version'] = phpversion();
		$aCompatibility['php.version.valid'] = (int) (version_compare($aCompatibility['php.version'], '5.3.0') > -1);

		$aCompatibility['safe-mode'] = @ini_get('safe_mode');
		$aCompatibility['safe-mode.valid'] = is_numeric($aCompatibility['safe-mode'])
			? !((bool) $aCompatibility['safe-mode'])
			: ('off' === strtolower($aCompatibility['safe-mode']) || empty($aCompatibility['safe-mode']));

		$aCompatibility['mysql.valid'] = (int) extension_loaded('mysql');
		$aCompatibility['pdo.valid'] = (int)
			((bool) extension_loaded('pdo') && (bool) extension_loaded('pdo_mysql'));

		$aCompatibility['socket.valid'] = (int) function_exists('fsockopen');
		$aCompatibility['iconv.valid'] = (int) function_exists('iconv');
		$aCompatibility['curl.valid'] = (int) function_exists('curl_init');
		$aCompatibility['mbstring.valid'] = (int) function_exists('mb_detect_encoding');
		$aCompatibility['openssl.valid'] = (int) extension_loaded('openssl');
		$aCompatibility['xml.valid'] = (int) (class_exists('DOMDocument') && function_exists('xml_parser_create'));
		$aCompatibility['json.valid'] = (int) function_exists('json_decode');

		$aCompatibility['ini-get.valid'] = (int) function_exists('ini_get');
		$aCompatibility['ini-set.valid'] = (int) function_exists('ini_set');
		$aCompatibility['set-time-limit.valid'] = (int) function_exists('set_time_limit');

		$aCompatibility['session.valid'] = (int) (function_exists('session_start') && isset($_SESSION['checksessionindex']));

		$dataPath = \Aurora\System\Api::DataPath();

		$aCompatibility['data.dir'] = $dataPath;
		$aCompatibility['data.dir.valid'] = (int) (@is_dir($aCompatibility['data.dir']) && @is_writable($aCompatibility['data.dir']));

		$sTempPathName = '_must_be_deleted_'.md5(time());

		$aCompatibility['data.dir.create'] =
			(int) @mkdir($aCompatibility['data.dir'].'/'.$sTempPathName);
		$aCompatibility['data.file.create'] =
			(int) (bool) @fopen($aCompatibility['data.dir'].'/'.$sTempPathName.'/'.$sTempPathName.'.test', 'w+');
		$aCompatibility['data.file.delete'] =
			(int) (bool) @unlink($aCompatibility['data.dir'].'/'.$sTempPathName.'/'.$sTempPathName.'.test');
		$aCompatibility['data.dir.delete'] =
			(int) @rmdir($aCompatibility['data.dir'].'/'.$sTempPathName);


		$oSettings =& \Aurora\System\Api::GetSettings();

		$aCompatibility['settings.file'] = $oSettings ? $oSettings->GetPath() : '';

		$aCompatibility['settings.file.exist'] = (int) @file_exists($aCompatibility['settings.file']);
		$aCompatibility['settings.file.read'] = (int) @is_readable($aCompatibility['settings.file']);
		$aCompatibility['settings.file.write'] = (int) @is_writable($aCompatibility['settings.file']);

		$aCompatibilities = [
			[
				'Name' => 'PHP version',
				'Result' => $aCompatibility['php.version.valid'],
				'Value' => $aCompatibility['php.version.valid']
				? 'OK'
				: [$aCompatibility['php.version'].' detected, 5.3.0 or above required.',
'You need to upgrade PHP engine installed on your server.
If it\'s a dedicated or your local server, you can download the latest version of PHP from its
<a href="http://php.net/downloads.php" target="_blank">official site</a> and install it yourself.
In case of a shared hosting, you need to ask your hosting provider to perform the upgrade.']
			],
			[
				'Name' => 'Safe Mode is off',
				'Result' => $aCompatibility['safe-mode.valid'],
				'Value' => ($aCompatibility['safe-mode.valid'])
				? 'OK'
				: ['Error, safe_mode is enabled.',
'You need to <a href="http://php.net/manual/en/ini.sect.safe-mode.php" target="_blank">disable it in your php.ini</a>
or contact your hosting provider and ask to do this.']
			],
			[
				'Name' => 'PDO MySQL Extension',
				'Result' => $aCompatibility['pdo.valid'],
				'Value' => ($aCompatibility['pdo.valid'])
				? 'OK'
				: ['Error, PHP PDO MySQL extension not detected.',
'You need to install this PHP extension or enable it in php.ini file.']
			],
			[
				'Name' => 'Iconv Extension',
				'Result' => $aCompatibility['iconv.valid'],
				'Value' => ($aCompatibility['iconv.valid'])
				? 'OK'
				: ['Error, iconv extension not detected.',
'You need to install this PHP extension or enable it in php.ini file.']
			],
			[
				'Name' => 'Multibyte String Extension',
				'Result' => $aCompatibility['mbstring.valid'],
				'Value' => ($aCompatibility['mbstring.valid'])
				? 'OK'
				: ['Error, mb_string extension not detected.',
'You need to install this PHP extension or enable it in php.ini file.']
			],
			[
				'Name' => 'CURL Extension',
				'Result' => $aCompatibility['curl.valid'],
				'Value' => ($aCompatibility['curl.valid'])
				? 'OK'
				: ['Error, curl extension not detected.',
'You need to install this PHP extension or enable it in php.ini file.']
			],
			[
				'Name' => 'JSON Extension',
				'Result' => $aCompatibility['json.valid'],
				'Value' => ($aCompatibility['json.valid'])
				? 'OK'
				: ['Error, JSON extension not detected.',
'You need to install this PHP extension or enable it in php.ini file.']
			],
			[
				'Name' => 'XML/DOM Extension',
				'Result' => $aCompatibility['xml.valid'],
				'Value' => ($aCompatibility['xml.valid'])
				? 'OK'
				: ['Error, xml (DOM) extension not detected.',
'You need to install this PHP extension or enable it in php.ini file.']
			],
			[
				'Name' => 'Sockets',
				'Result' => $aCompatibility['socket.valid'],
				'Value' => ($aCompatibility['socket.valid'])
				? 'OK'
				: ['Error, creating network sockets must be enabled.', '
To enable sockets, you should remove fsockopen function from the list of prohibited functions in disable_functions directive of your php.ini file.
In case of a shared hosting, you need to ask your hosting provider to do this.']
			],
			[
				'Name' => 'SSL (OpenSSL extension)',
				'Result' => $aCompatibility['openssl.valid'],
				'Value' => ($aCompatibility['openssl.valid'])
				? 'OK'
				: ['SSL connections (like Gmail) will not be available. ', '
You need to enable OpenSSL support in your PHP configuration and make sure OpenSSL library is installed on your server.
For instructions, please refer to the official PHP documentation. In case of a shared hosting,
you need to ask your hosting provider to enable OpenSSL support.
You may ignore this if you\'re not going to connect to SSL-only mail servers (like Gmail).']
			],
			[
				'Name' => 'Setting memory limits',
				'Result' => $aCompatibility['ini-get.valid'],
				'Value' => ($aCompatibility['ini-get.valid'] && $aCompatibility['ini-set.valid'])
				? 'OK'
				: ['Opening large e-mails may fail.', '
You need to enable setting memory limits in your PHP configuration, i.e. remove ini_get and ini_set functions
from the list of prohibited functions in disable_functions directive of your php.ini file.
In case of a shared hosting, you need to ask your hosting provider to do this.']
			],
			[
				'Name' => 'Setting script timeout',
				'Result' => $aCompatibility['set-time-limit.valid'],
				'Value' => ($aCompatibility['set-time-limit.valid'])
				? 'OK'
				: ['Downloading large mailboxes may fail.', '
To enable setting script timeout, you should remove set_time_limit function from the list
of prohibited functions in disable_functions directive of your php.ini file.
In case of a shared hosting, you need to ask your hosting provider to do this.']
			],
			[
				'Name' => 'WebMail data directory',
				'Result' => $aCompatibility['data.dir.valid'],
				'Value' => ($aCompatibility['data.dir.valid'])
				? 'Found'
				: ['Error, data directory path discovery failure.']
			],
			[
				'Name' => 'Creating/deleting directories',
				'Result' => $aCompatibility['data.dir.create'] && $aCompatibility['data.dir.delete'],
				'Value' => ($aCompatibility['data.dir.create'] && $aCompatibility['data.dir.delete'])
				? 'OK'
				: ['Error, can\'t create/delete sub-directories in the data directory.', '
You need to grant read/write permission over data directory and all its contents to your web server user.
For instructions, please refer to this section of documentation and our
<a href="https://afterlogic.com/docs/webmail-pro-8/troubleshooting/troubleshooting-issues-with-data-directory" target="_blank">FAQ</a>.']
			],
			[
				'Name' => 'Creating/deleting files',
				'Result' => $aCompatibility['data.file.create'] && $aCompatibility['data.file.delete'],
				'Value' => ($aCompatibility['data.file.create'] && $aCompatibility['data.file.delete'])
				? 'OK'
				: ['Error, can\'t create/delete files in the data directory.', '
You need to grant read/write permission over data directory and all its contents to your web server user.
For instructions, please refer to this section of documentation and our
<a href="https://afterlogic.com/docs/webmail-pro-8/troubleshooting/troubleshooting-issues-with-data-directory" target="_blank">FAQ</a>.']
			],
			[
				'Name' => 'WebMail Settings File',
				'Result' => $aCompatibility['settings.file.exist'],
				'Value' => ($aCompatibility['settings.file.exist'])
				? 'Found'
				: ['Not Found, can\'t find "'.$aCompatibility['settings.file'].'" file.', '
Make sure you completely copied the data directory with all its contents from installation package.
By default, the data directory is webmail subdirectory, and if it\'s not the case make sure its location matches one specified in inc_settings_path.php file.']
			],
			[
				'Name' => 'Read/write settings file',
				'Result' => $aCompatibility['settings.file.read'] && $aCompatibility['settings.file.write'],
				'Value' => ($aCompatibility['settings.file.read'] && $aCompatibility['settings.file.write'])
				? 'OK / OK'
				: ['Not Found, can\'t find "'.$aCompatibility['settings.file'].'" file.', '
You should grant read/write permission over settings file to your web server user.
For instructions, please refer to this section of documentation and our
<a href="https://afterlogic.com/docs/webmail-pro-8/troubleshooting/troubleshooting-issues-with-data-directory" target="_blank">FAQ</a>.']
			],
		];

		$mResult[self::GetName()] = $aCompatibilities;
	}

	public function onAfterChangePassword($aArgs, &$mResult)
	{
		if ($mResult && $mResult instanceof \Aurora\System\Classes\AbstractAccount && $mResult->UseToAuthorize)
		{
			$oUser = \Aurora\System\Api::getAuthenticatedUser();
			if ($oUser instanceof \Aurora\Modules\Core\Classes\User &&
				(($oUser->isNormalOrTenant() && $oUser->EntityId === $mResult->IdUser) ||
				$oUser->Role === \Aurora\System\Enums\UserRole::SuperAdmin)
			)
			{
				$oUser = self::Decorator()->GetUserUnchecked($mResult->IdUser);
				if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
				{
					$this->UpdateTokensValidFromTimestamp($oUser);
				}
			}
		}
	}

	public function onBeforeRunEntry($aArgs, &$mResult)
	{
		\Aurora\Api::removeOldLogs();

		return $this->redirectToHttps($aArgs['EntryName'], $mResult);
	}

	/**
	 * Recursively deletes temporary files and folders on time.
	 *
	 * @param string $sTempPath Path to the temporary folder.
	 * @param int $iTime2Kill Interval in seconds at which files needs removing.
	 * @param int $iNow Current Unix timestamp.
	 */
	protected function removeDirByTime($sTempPath, $iTime2Kill, $iNow)
	{
		$iFileCount = 0;
		if (@is_dir($sTempPath))
		{
			$rDirH = @opendir($sTempPath);
			if ($rDirH)
			{
				while (($sFile = @readdir($rDirH)) !== false)
				{
					if ('.' !== $sFile && '..' !== $sFile)
					{
						if (@is_dir($sTempPath.'/'.$sFile))
						{
							$this->removeDirByTime($sTempPath.'/'.$sFile, $iTime2Kill, $iNow);
						}
						else
						{
							$iFileCount++;
						}
					}
				}
				@closedir($rDirH);
			}

			if ($iFileCount > 0)
			{
				if ($this->removeFilesByTime($sTempPath, $iTime2Kill, $iNow))
				{
					@rmdir($sTempPath);
				}
			}
			else
			{
				@rmdir($sTempPath);
			}
		}
	}

	/**
	 * Recursively deletes temporary files on time.
	 *
	 * @param string $sTempPath Path to the temporary folder.
	 * @param int $iTime2Kill Interval in seconds at which files needs removing.
	 * @param int $iNow Current Unix timestamp.
	 *
	 * @return bool
	 */
	protected function removeFilesByTime($sTempPath, $iTime2Kill, $iNow)
	{
		$bResult = true;
		if (@is_dir($sTempPath))
		{
			$rDirH = @opendir($sTempPath);
			if ($rDirH)
			{
				while (($sFile = @readdir($rDirH)) !== false)
				{
					if ($sFile !== '.' && $sFile !== '..')
					{
						if ($iNow - filemtime($sTempPath.'/'.$sFile) > $iTime2Kill)
						{
							@unlink($sTempPath.'/'.$sFile);
						}
						else
						{
							$bResult = false;
						}
					}
				}
				@closedir($rDirH);
			}
		}
		return $bResult;
	}

	protected function redirectToHttps($sEntryName, $mResult)
	{
		$oSettings =& \Aurora\Api::GetSettings();
		if ($oSettings)
		{
			$bRedirectToHttps = $oSettings->RedirectToHttps;

			$bHttps = \Aurora\Api::isHttps();
			if ($bRedirectToHttps && !$bHttps)
			{
				if (\strtolower($sEntryName) !== 'api')
				{
					\header("Location: https://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']);
				}
				else
				{
					$mResult = [
						'ErrorCode' => 110
					];
					return true;
				}
			}
		}
	}

	/***** private functions *****/

	/***** static functions *****/
	/**
	 * @ignore
	 * @return bool
	 */
	private function deleteTree($dir)
	{
		$files = array_diff(scandir($dir), array('.','..'));

		foreach ($files as $file)
		{
			(is_dir("$dir/$file")) ? $this->deleteTree("$dir/$file") : unlink("$dir/$file");
		}

		return rmdir($dir);
	}
	/***** static functions *****/

	/***** public functions *****/
	/**
	 *
	 * @return string
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function EntryApi()
	{
		@ob_start();

		if (!is_writable(\Aurora\System\Api::DataPath()))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::SystemNotConfigured);
		}

		$aResponseItem = null;
		$sModule = $this->oHttp->GetPost('Module', null);
		$sMethod = $this->oHttp->GetPost('Method', null);
		$sParameters = $this->oHttp->GetPost('Parameters', null);
		$sFormat = $this->oHttp->GetPost('Format', null);
		$sTenantName = $this->oHttp->GetPost('TenantName', null);

		if (isset($sModule, $sMethod))
		{
			$oModule = \Aurora\System\Api::GetModule($sModule);
			if ($oModule instanceof \Aurora\System\Module\AbstractModule)
			{
				try
				{
					\Aurora\System\Api::Log(" ");
					\Aurora\System\Api::Log(" ===== API: " . $sModule . '::' . $sMethod);

					$bIsEmptyAuthToken = !\Aurora\System\Api::getAuthTokenFromHeaders();

					if ($this->getConfig('CsrfTokenProtection', true) && !\Aurora\System\Api::validateCsrfToken()/* && !$bIsEmptyAuthToken*/)
					{
						throw new \Aurora\System\Exceptions\ApiException(
							\Aurora\System\Notifications::InvalidToken
						);
					}

					if (!empty($sModule) && !empty($sMethod))
					{
						if (!\Aurora\System\Api::validateAuthToken() && !$bIsEmptyAuthToken)
						{
							throw new \Aurora\System\Exceptions\ApiException(
								\Aurora\System\Notifications::AuthError
							);
						}

						\Aurora\System\Api::setTenantName($sTenantName);

						$aParameters = [];
						if (isset($sParameters) && \is_string($sParameters))
						{
							$aParameters = @\json_decode($sParameters, true);
							if (!\is_array($aParameters))
							{
								$aParameters = array($aParameters);
							}
						}

						$mUploadData = $this->getUploadData();
						if (\is_array($mUploadData))
						{
							$aParameters['UploadData'] = $mUploadData;
						}

						$oModule->CallMethod(
							$sMethod,
							$aParameters,
							true
						);

						$oLastException = \Aurora\System\Api::GetModuleManager()->GetLastException();
						if (isset($oLastException))
						{
							throw $oLastException;
						}

						$aResponseItem = $oModule->DefaultResponse(
							$sMethod,
							\Aurora\System\Api::GetModuleManager()->GetResults()
						);
					}

					if (!\is_array($aResponseItem))
					{
						throw new \Aurora\System\Exceptions\ApiException(
							\Aurora\System\Notifications::UnknownError
						);
					}
				}
				catch (\Exception $oException)
				{
					\Aurora\System\Api::LogException($oException);

					$aAdditionalParams = null;
					if ($oException instanceof \Aurora\System\Exceptions\ApiException)
					{
						$aAdditionalParams = $oException->GetObjectParams();
					}

					$aResponseItem = $oModule->ExceptionResponse(
						$sMethod,
						$oException,
						$aAdditionalParams
					);
				}
			}
			else
			{
				$oException = new \Aurora\System\Exceptions\ApiException(
					\Aurora\System\Notifications::ModuleNotFound
				);
				$aResponseItem = $this->ExceptionResponse(
					$sMethod,
					$oException
				);
			}
		}
		else
		{
			$oException = new \Aurora\System\Exceptions\ApiException(
				\Aurora\System\Notifications::InvalidInputParameter
			);
			$aResponseItem = $this->ExceptionResponse(
				$sMethod,
				$oException
			);
		}

		if (isset($aResponseItem['Parameters']))
		{
			unset($aResponseItem['Parameters']);
		}

		return \Aurora\System\Managers\Response::GetJsonFromObject($sFormat, $aResponseItem);
	}

	/**
	 * @ignore
	 */
	public function EntryMobile()
	{
		$oApiIntegrator = $this->getIntegratorManager();
		$oApiIntegrator->setMobile(true);

		\Aurora\System\Api::Location('./');
	}

	/**
	 * @ignore
	 */
	public function EntrySso()
	{
		try
		{
			$sHash = $this->oHttp->GetRequest('hash');
			if (!empty($sHash))
			{
				$sData = \Aurora\System\Api::Cacher()->get('SSO:'.$sHash, true);
				$aData = \Aurora\System\Api::DecodeKeyValues($sData);

				if (isset($aData['Password'], $aData['Email']))
				{
					$sLanguage = $this->oHttp->GetRequest('lang');
					$aResult = self::Decorator()->Login($aData['Email'], $aData['Password'], $sLanguage);

					if (is_array($aResult) && isset($aResult['AuthToken']))
					{
						$iAuthTokenCookieExpireTime = (int) self::getInstance()->getConfig('AuthTokenCookieExpireTime', 30);
						@\setcookie(
							\Aurora\System\Application::AUTH_TOKEN_KEY,
							$aResult['AuthToken'],
							\strtotime('+' . $iAuthTokenCookieExpireTime . ' days'),
							\Aurora\System\Api::getCookiePath(), null, \Aurora\System\Api::getCookieSecure()
						);
					}
					else
					{
						@\setcookie(
							\Aurora\System\Application::AUTH_TOKEN_KEY,
							null,
							-1
						);
					}
				}
			}
			else
			{
				self::Decorator()->Logout();
			}
		}
		catch (\Exception $oExc)
		{
			\Aurora\System\Api::LogException($oExc);
		}

		\Aurora\System\Api::Location('./');
	}

	/**
	 * @ignore
	 */
	public function EntryPostlogin()
	{
		if ($this->getConfig('AllowPostLogin', false))
		{
			$sEmail = trim((string) $this->oHttp->GetRequest('Email', ''));
			$sLogin = (string) $this->oHttp->GetRequest('Login', '');

			if ($sLogin==='')
			{
				$sLogin = $sEmail;
			}
			$sPassword = (string) $this->oHttp->GetRequest('Password', '');

			$sAtDomain = trim(\Aurora\System\Api::GetSettings()->GetConf('LoginAtDomainValue'));
			if (0 < strlen($sAtDomain))
			{
				$sEmail = \Aurora\System\Utils::GetAccountNameFromEmail($sLogin).'@'.$sAtDomain;
				$sLogin = $sEmail;
			}

			$aResult = self::Decorator()->Login($sLogin, $sPassword);
			if (is_array($aResult) && isset($aResult['AuthToken']))
			{
				$iAuthTokenCookieExpireTime = (int) self::getInstance()->getConfig('AuthTokenCookieExpireTime', 30);
				@\setcookie(
					\Aurora\System\Application::AUTH_TOKEN_KEY,
					$aResult['AuthToken'],
					\strtotime('+' . $iAuthTokenCookieExpireTime . ' days'),
					\Aurora\System\Api::getCookiePath(), null, \Aurora\System\Api::getCookieSecure()
				);
			}

			\Aurora\System\Api::Location('./');
		}
	}

	public function EntryFileCache()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$sRawKey = \Aurora\System\Router::getItemByIndex(1, '');
		$sAction = \Aurora\System\Router::getItemByIndex(2, '');
		$aValues = \Aurora\System\Api::DecodeKeyValues($sRawKey);

		$bDownload = true;
		$bThumbnail = false;

		switch ($sAction)
		{
			case 'view':
				$bDownload = false;
				$bThumbnail = false;
			break;
			case 'thumb':
				$bDownload = false;
				$bThumbnail = true;
			break;
			default:
				$bDownload = true;
				$bThumbnail = false;
			break;
		}

		$iUserId = (isset($aValues['UserId'])) ? $aValues['UserId'] : 0;

		if (isset($aValues['TempFile'], $aValues['TempName'], $aValues['Name']))
		{
			$sModule = isset($aValues['Module']) && !empty($aValues['Module']) ? $aValues['Module'] : 'System';
			$bResult = false;
			$sUUID = \Aurora\System\Api::getUserUUIDById($iUserId);
			$oApiFileCache = new \Aurora\System\Managers\Filecache();
			$mResult = $oApiFileCache->getFile($sUUID, $aValues['TempName'], '', $sModule);

			if (is_resource($mResult))
			{
				$bResult = true;
				$sFileName = $aValues['Name'];
				$sContentType = (empty($sFileName)) ? 'text/plain' : \MailSo\Base\Utils::MimeContentType($sFileName);
				$sFileName = \Aurora\System\Utils::clearFileName($sFileName, $sContentType);

				\Aurora\System\Utils::OutputFileResource($sUUID, $sContentType, $sFileName, $mResult, $bThumbnail, $bDownload);
			}
		}
	}

	public function IsModuleExists($Module)
	{
		return \Aurora\System\Api::GetModuleManager()->ModuleExists($Module);
	}

	/**
	 *
	 * @return string
	 */
	public function GetVersion()
	{
		return \Aurora\System\Api::Version();
	}

	/**
	 * Clears temporary files by cron.
	 *
	 * @ignore
	 * @todo check if it works.
	 *
	 * @return bool
	 */
	protected function ClearTempFiles()
	{
		$sTempPath =\Aurora\System\Api::DataPath().'/temp';
		if (@is_dir($sTempPath))
		{
			$iNow = time();

			$iTime2Run = $this->getConfig('CronTimeToRunSeconds', 10800);
			$iTime2Kill = $this->getConfig('CronTimeToKillSeconds', 10800);
			$sDataFile = $this->getConfig('CronTimeFile', '.clear.dat');

			$iFiletTime = -1;
			if (@file_exists(\Aurora\System\Api::DataPath().'/'.$sDataFile))
			{
				$iFiletTime = (int) @file_get_contents(\Aurora\System\Api::DataPath().'/'.$sDataFile);
			}

			if ($iFiletTime === -1 || $iNow - $iFiletTime > $iTime2Run)
			{
				$this->removeDirByTime($sTempPath, $iTime2Kill, $iNow);
				@file_put_contents(\Aurora\System\Api::DataPath().'/'.$sDataFile, $iNow);
			}
		}

		return true;
	}

	/**
	 * !Not public
	 * This method is restricted to be called by web API (see denyMethodsCallByWebApi method).
	 *
	 * Updates user by object.
	 *
	 * @param \Aurora\Modules\Core\Classes\User $oUser
	 * returns bool
	 */
	public function UpdateUserObject($oUser)
	{
		/** This method is restricted to be called by web API (see denyMethodsCallByWebApi method). **/

		return $this->getUsersManager()->updateUser($oUser);
	}

	/**
	 * !Not public
	 * This method is restricted to be called by web API (see denyMethodsCallByWebApi method).
	 *
	 * Returns user object.
	 *
	 * @param int|string $UserId User identifier or UUID.
	 * @return \Aurora\Modules\Core\Classes\User
	 */
	public function GetUserUnchecked($UserId = '')
	{
		// doesn't call checkUserRoleIsAtLeast because checkUserRoleIsAtLeast function calls GetUserUnchecked function

		/** This method is restricted to be called by web API (see denyMethodsCallByWebApi method). **/

		$oUser = $this->getUsersManager()->getUser($UserId);

		return $oUser ? $oUser : null;
	}

	/**
	 * !Not public
	 * This method is restricted to be called by web API (see denyMethodsCallByWebApi method).
	 *
	 * Returns user object.
	 *
	 * @param int $UUID User uuid identifier.
	 * @return \Aurora\Modules\Core\Classes\User
	 */
	public function GetUserByUUID($UUID)
	{
		// doesn't call checkUserRoleIsAtLeast because checkUserRoleIsAtLeast function calls GetUserUnchecked function

		/** This method is restricted to be called by web API (see denyMethodsCallByWebApi method). **/

		$oUser = $this->getUsersManager()->getUser($UUID);

		return $oUser ? $oUser : null;
	}

	/**
	 * !Not public
	 * This method is restricted to be called by web API (see denyMethodsCallByWebApi method).
	 *
	 * Returns user object.
	 *
	 * @param string $PublicId User public identifier.
	 * @return \Aurora\Modules\Core\Classes\User
	 */
	public function GetUserByPublicId($PublicId)
	{
		/** This method is restricted to be called by web API (see denyMethodsCallByWebApi method). **/

		$oUser = $this->getUsersManager()->getUserByPublicId($PublicId);

		return $oUser ? $oUser : null;
	}

	/**
	 * !Not public
	 * This method is restricted to be called by web API (see denyMethodsCallByWebApi method).
	 *
	 * Creates and returns user with super administrator role.
	 *
	 * @return \Aurora\Modules\Core\Classes\User
	 */
	public function GetAdminUser()
	{
		// doesn't call checkUserRoleIsAtLeast because checkUserRoleIsAtLeast function calls GetAdminUser function

		/** This method is restricted to be called by web API (see denyMethodsCallByWebApi method). **/

		return $this->getIntegratorManager()->GetAdminUser();

	}

	/**
	 * !Not public
	 * This method is restricted to be called by web API (see denyMethodsCallByWebApi method).
	 *
	 * Returns tenant object by identifier.
	 *
	 * @param int $Id Tenant identifier.
	 * @return \Aurora\Modules\Core\Classes\Tenant|null
	 */
	public function GetTenantUnchecked($Id)
	{
		/** This method is restricted to be called by web API (see denyMethodsCallByWebApi method). **/

		$oTenant = $this->getTenantsManager()->getTenantById($Id);

		return $oTenant ? $oTenant : null;
	}

	/**
	 * !Not public
	 * This method is restricted to be called by web API (see denyMethodsCallByWebApi method).
	 *
	 * Returns tenant identifier by tenant name.
	 *
	 * @param string $TenantName Tenant name.
	 * @return int|null
	 */
	public function GetTenantIdByName($TenantName = '')
	{
		/** This method is restricted to be called by web API (see denyMethodsCallByWebApi method). **/

		$iTenantId = $this->getTenantsManager()->getTenantIdByName((string) $TenantName);

		return $iTenantId ? $iTenantId : null;
	}

	/**
	 * !Not public
	 * This method is restricted to be called by web API (see denyMethodsCallByWebApi method).
	 *
	 * Returns current tenant name.
	 *
	 * @return string
	 */
	public function GetTenantName()
	{
		/** This method is restricted to be called by web API (see denyMethodsCallByWebApi method). **/

		$sTenant = '';
		$sAuthToken = \Aurora\System\Api::getAuthToken();
		if (!empty($sAuthToken))
		{
			$iUserId = \Aurora\System\Api::getAuthenticatedUserId();
			if ($iUserId !== false && $iUserId > 0)
			{
				$oUser = self::Decorator()->GetUserUnchecked($iUserId);
				if ($oUser)
				{
					$oTenant = self::Decorator()->GetTenantUnchecked($oUser->IdTenant);
					if ($oTenant)
					{
						$sTenant = $oTenant->Name;
					}
				}
			}
			$sPostTenant = $this->oHttp->GetPost('TenantName', '');
			if (!empty($sPostTenant) && !empty($sTenant) && $sPostTenant !== $sTenant)
			{
				$sTenant = '';
			}
		}
		else
		{
			$sTenant = $this->oHttp->GetRequest('tenant', '');
		}
		\Aurora\System\Api::setTenantName($sTenant);
		return $sTenant;
	}

	/**
	 * @deprecated since version 8.3.7
	 */
	public function GetTenantById($Id)
	{
		return self::Decorator()->GetTenant($Id);
	}

	/**
	 * !Not public
	 * This method is restricted to be called by web API (see denyMethodsCallByWebApi method).
	 *
	 * Returns default global tenant.
	 *
	 * @return \Aurora\Modules\Core\Classes\Tenant
	 */
	public function GetDefaultGlobalTenant()
	{
		/** This method is restricted to be called by web API (see denyMethodsCallByWebApi method). **/

		$oTenant = $this->getTenantsManager()->getDefaultGlobalTenant();

		return $oTenant ? $oTenant : null;
	}

	/**
	 * !Not public
	 * This method is restricted to be called by web API (see denyMethodsCallByWebApi method).
	 *
	 * Updates tenant.
	 *
	 * @param Classes\Tenant $oTenant
	 * @return void
	 */
	public function UpdateTenantObject($oTenant)
	{
		/** This method is restricted to be called by web API (see denyMethodsCallByWebApi method). **/

		return $this->getTenantsManager()->updateTenant($oTenant);
	}

	/**
	 * !Not public
	 * This method is restricted to be called by web API (see denyMethodsCallByWebApi method).
	 *
	 * @param \Aurora\Modules\Core\Classes\User $oUser
	 * @return int
	 */
	public function UpdateTokensValidFromTimestamp($oUser)
	{
		/** This method is restricted to be called by web API (see denyMethodsCallByWebApi method). **/

		$oUser->TokensValidFromTimestamp = time();
		$this->getUsersManager()->updateUser($oUser);
		return $oUser->TokensValidFromTimestamp;
	}
	/***** public functions *****/

	/***** public functions might be called with web API *****/
	/**
	 * @apiDefine Core Core Module
	 * System module that provides core functionality such as User management, Tenants management
	 */

	/**
	 * @api {post} ?/Api/ DoServerInitializations
	 * @apiName DoServerInitializations
	 * @apiGroup Core
	 * @apiDescription Does some pending actions to be executed when you log in.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=DoServerInitializations} Method Method name.
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'DoServerInitializations'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {bool} Result.Result Indicates if server initializations were made successfully.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'DoServerInitializations',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'DoServerInitializations',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Does some pending actions to be executed when you log in.
	 *
	 * @return bool
	 */
	public function DoServerInitializations($Timezone = '')
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Customer);
		$result = true;

		$iUserId = \Aurora\System\Api::getAuthenticatedUserId();

		$oApiIntegrator = $this->getIntegratorManager();

		if ($iUserId && $oApiIntegrator)
		{
			$oApiIntegrator->resetCookies();
		}

		$oCacher = \Aurora\System\Api::Cacher();

		$bDoGC = false;
		$bDoHepdeskClear = false;
		if ($oCacher && $oCacher->IsInited())
		{
			$iTime = $oCacher->GetTimer('Cache/ClearFileCache');
			if (0 === $iTime || $iTime + 60 * 60 * 24 < time())
			{
				if ($oCacher->SetTimer('Cache/ClearFileCache'))
				{
					$bDoGC = true;
				}
			}

			// if (\Aurora\System\Api::GetModuleManager()->ModuleExists('Helpdesk'))
			// {
			// 	$iTime = $oCacher->GetTimer('Cache/ClearHelpdeskUsers');
			// 	if (0 === $iTime || $iTime + 60 * 60 * 24 < time())
			// 	{
			// 		if ($oCacher->SetTimer('Cache/ClearHelpdeskUsers'))
			// 		{
			// 			$bDoHepdeskClear = true;
			// 		}
			// 	}
			// }
		}

		if ($bDoGC)
		{
			\Aurora\System\Api::Log('GC: FileCache / Start');
			$oApiFileCache = new \Aurora\System\Managers\Filecache();
			$oApiFileCache->gc();
			$oCacher->gc();
			\Aurora\System\Api::Log('GC: FileCache / End');
		}

		// if ($bDoHepdeskClear && \Aurora\System\Api::GetModuleManager()->ModuleExists('Helpdesk'))
		// {
		// 	\Aurora\System\Api::ExecuteMethod('Helpdesk::ClearUnregistredUsers');
		// 	\Aurora\System\Api::ExecuteMethod('Helpdesk::ClearAllOnline');
		// }

		return $result;
	}

	/**
	 * @api {post} ?/Api/ Ping
	 * @apiName Ping
	 * @apiGroup Core
	 * @apiDescription Method is used for checking Internet connection.
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=Ping} Method Method name.
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'Ping'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {string} Result.Result Just a string to indicate that connection to backend is working.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'Ping',
	 *	Result: 'Pong'
	 * }
	 */
	/**
	 * Method is used for checking Internet connection.
	 *
	 * @return 'Pong'
	 */
	public function Ping()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		return 'Pong';
	}

	/**
	 * @api {post} ?/Api/ GetAppData
	 * @apiName GetAppData
	 * @apiGroup Core
	 * @apiDescription Obtains a list of settings for each module for the current user.
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=GetAppData} Method Method name.
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'GetAppData'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {string} Result.Result List of settings for each module for the current user.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'GetAppData',
	 *	Result: {
	 *				User: {Id: 0, Role: 4, Name: "", PublicId: ""},
	 *				Core: { ... },
	 *				Contacts: { ... },
	 *				 ...
	 *				CoreWebclient: { ... },
	 *				 ...
	 *			}
	 * }
	 */
	/**
	 * Obtains a list of settings for each module for the current user.
	 *
	 * @return array
	 */
	public function GetAppData()
	{
		$oApiIntegrator = $this->getIntegratorManager();
		return $oApiIntegrator->appData();
	}

	/**
	 * @api {post} ?/Api/ GetSettings
	 * @apiName GetSettings
	 * @apiGroup Core
	 * @apiDescription Obtains list of module settings for authenticated user.
	 *
	 * @apiHeader {string} [Authorization] "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=GetSettings} Method Method name.
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'GetSettings'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {mixed} Result.Result List of module settings in case of success, otherwise **false**.
	 * @apiSuccess {string} Result.Result.SiteName Site name.
	 * @apiSuccess {string} Result.Result.Language Language of interface.
	 * @apiSuccess {int} Result.Result.TimeFormat Time format.
	 * @apiSuccess {string} Result.Result.DateFormat Date format.
	 * @apiSuccess {bool} Result.Result.AutodetectLanguage Indicates if language should be taken from browser.
	 * @apiSuccess {object} Result.Result.EUserRole Enumeration with user roles.
	 * @apiSuccess {string} [Result.Result.DBHost] Database host is returned only if super administrator is authenticated.
	 * @apiSuccess {string} [Result.Result.DBName] Database name is returned only if super administrator is authenticated.
	 * @apiSuccess {string} [Result.Result.DBLogin] Database login is returned only if super administrator is authenticated.
	 * @apiSuccess {string} [Result.Result.AdminLogin] Super administrator login is returned only if super administrator is authenticated.
	 * @apiSuccess {bool} [Result.Result.AdminHasPassword] Indicates if super administrator has set up password. It is returned only if super administrator is authenticated.
	 * @apiSuccess {string} [Result.Result.AdminLanguage] Super administrator language is returned only if super administrator is authenticated.
	 * @apiSuccess {bool} [Result.Result.IsSystemConfigured] Indicates if 'data' folder exist and writable and salt was generated.
	 * @apiSuccess {bool} [Result.Result.SaltNotEmpty] Indicates if salt was generated. It is returned only if super administrator is authenticated.
	 * @apiSuccess {bool} [Result.Result.EnableLogging] Indicates if logging is enabled. It is returned only if super administrator is authenticated.
	 * @apiSuccess {bool} [Result.Result.EnableEventLogging] Indicates if event logging is enabled. It is returned only if super administrator is authenticated.
	 * @apiSuccess {string} [Result.Result.LoggingLevel] Value of logging level. It is returned only if super administrator is authenticated.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'GetSettings',
	 *	Result: { SiteName: "Aurora Cloud", Language: "English", TimeFormat: 1, DateFormat: "MM/DD/YYYY",
	 *		EUserRole: { SuperAdmin: 0, TenantAdmin: 1, NormalUser: 2, Customer: 3, Anonymous: 4 } }
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'GetSettings',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Obtains list of module settings for authenticated user.
	 *
	 * @return array
	 */
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		$oUser = \Aurora\System\Api::getAuthenticatedUser();

		$oApiIntegrator = $this->getIntegratorManager();
		$iLastErrorCode = $oApiIntegrator->getLastErrorCode();
		if (0 < $iLastErrorCode)
		{
			$oApiIntegrator->clearLastErrorCode();
		}

		$oSettings =& \Aurora\System\Api::GetSettings();

		$aSettings = array(
			'AutodetectLanguage' => $this->getConfig('AutodetectLanguage'),
			'UserSelectsDateFormat' => $this->getConfig('UserSelectsDateFormat', false),
			'DateFormat' => $this->getConfig('DateFormat', 'DD/MM/YYYY'),
			'DateFormatList' => $this->getConfig('DateFormatList', ['DD/MM/YYYY', 'MM/DD/YYYY', 'DD Month YYYY']),
			'EUserRole' => (new \Aurora\System\Enums\UserRole)->getMap(),
			'Language' => \Aurora\System\Api::GetLanguage(),
			'ShortLanguage' => \Aurora\System\Utils::ConvertLanguageNameToShort(\Aurora\System\Api::GetLanguage()),
			'LanguageList' => $oApiIntegrator->getLanguageList(),
			'LastErrorCode' => $iLastErrorCode,
			'SiteName' => $this->getConfig('SiteName'),
			'SocialName' => '',
			'TenantName' => \Aurora\System\Api::getTenantName(),
			'EnableMultiTenant' => $oSettings && $oSettings->GetConf('EnableMultiTenant', false),
			'TimeFormat' => $this->getConfig('TimeFormat'),
			'UserId' => \Aurora\System\Api::getAuthenticatedUserId(),
			'IsSystemConfigured' => is_writable(\Aurora\System\Api::DataPath()) &&
				(file_exists(\Aurora\System\Api::GetSaltPath()) && strlen(@file_get_contents(\Aurora\System\Api::GetSaltPath()))),
			'Version' => \Aurora\System\Api::VersionFull(),
			'ProductName' => $this->getConfig('ProductName'),
			'PasswordMinLength' => $oSettings ? $oSettings->GetConf('PasswordMinLength', 0) : 0,
			'PasswordMustBeComplex' => $oSettings && $oSettings->GetConf('PasswordMustBeComplex', false),
			'CookiePath' => \Aurora\System\Api::getCookiePath(),
			'CookieSecure' => \Aurora\System\Api::getCookieSecure(),
			'AuthTokenCookieExpireTime' => $this->getConfig('AuthTokenCookieExpireTime', 30),
			'StoreAuthTokenInDB' => $oSettings->GetConf('StoreAuthTokenInDB'),
			'AvailableClientModules' => $oApiIntegrator->GetClientModuleNames(),
			'AvailableBackendModules' => $oApiIntegrator->GetBackendModules(),
		);

		if ($oSettings && !empty($oUser) && $oUser->Role === \Aurora\System\Enums\UserRole::SuperAdmin)
		{
			$sAdminPassword = $oSettings->GetConf('AdminPassword');

			$aSettings = array_merge($aSettings, array(
				'DBHost' => $oSettings->GetConf('DBHost'),
				'DBName' => $oSettings->GetConf('DBName'),
				'DBLogin' => $oSettings->GetConf('DBLogin'),
				'AdminLogin' => $oSettings->GetConf('AdminLogin'),
				'AdminHasPassword' => !empty($sAdminPassword),
				'AdminLanguage' => $oSettings->GetConf('AdminLanguage'),
				'CommonLanguage' => $this->getConfig('Language'),
				'SaltNotEmpty' => file_exists(\Aurora\System\Api::GetSaltPath()) && strlen(@file_get_contents(\Aurora\System\Api::GetSaltPath())),
				'EnableLogging' => $oSettings->GetConf('EnableLogging'),
				'EnableEventLogging' => $oSettings->GetConf('EnableEventLogging'),
				'LoggingLevel' => $oSettings->GetConf('LoggingLevel'),
				'LogFilesData' => $this->GetLogFilesData(),
				'ELogLevel' => (new \Aurora\System\Enums\LogLevel)->getMap()
			));
		}

		if (!empty($oUser) && $oUser->isNormalOrTenant())
		{
			if ($oUser->DateFormat !== '')
			{
				$aSettings['DateFormat'] = $oUser->DateFormat;
			}
			$aSettings['TimeFormat'] = $oUser->TimeFormat;
			$aSettings['Timezone'] = $oUser->DefaultTimeZone;
		}

		return $aSettings;
	}

	/**
	 * @api {post} ?/Api/ UpdateSettings
	 * @apiName UpdateSettings
	 * @apiGroup Core
	 * @apiDescription Updates specified settings if super administrator is authenticated.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=UpdateSettings} Method Method name.
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **DbLogin** *string* Database login.<br>
	 * &emsp; **DbPassword** *string* Database password.<br>
	 * &emsp; **DbName** *string* Database name.<br>
	 * &emsp; **DbHost** *string* Database host.<br>
	 * &emsp; **AdminLogin** *string* Login for super administrator.<br>
	 * &emsp; **Password** *string* Current password for super administrator.<br>
	 * &emsp; **NewPassword** *string* New password for super administrator.<br>
	 * &emsp; **AdminLanguage** *string* Language for super administrator.<br>
	 * &emsp; **Language** *string* Language that is used on login and for new users.<br>
	 * &emsp; **AutodetectLanguage** *bool* Indicates if browser language should be used on login and for new users.<br>
	 * &emsp; **TimeFormat** *int* Time format that is used for new users.<br>
	 * &emsp; **EnableLogging** *bool* Indicates if logs are enabled.<br>
	 * &emsp; **EnableEventLogging** *bool* Indicates if events logs are enabled.<br>
	 * &emsp; **LoggingLevel** *int* Specify logging level.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'UpdateSettings',
	 *	Parameters: '{ DbLogin: "login_value", DbPassword: "password_value",
	 * DbName: "db_name_value", DbHost: "host_value", AdminLogin: "admin_login_value",
	 * Password: "admin_pass_value", NewPassword: "admin_pass_value" }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {bool} Result.Result Indicates if settings were updated successfully.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'UpdateSettings',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'UpdateSettings',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Updates specified settings if super administrator is authenticated.
	 *
	 * @param string $DbLogin Database login.
	 * @param string $DbPassword Database password.
	 * @param string $DbName Database name.
	 * @param string $DbHost Database host.
	 * @param string $AdminLogin Login for super administrator.
	 * @param string $Password Current password for super administrator.
	 * @param string $NewPassword New password for super administrator.
	 * @param string $AdminLanguage Language for super administrator.
	 * @param string $SiteName Site name.
	 * @param string $Language Language that is used on login and for new users.
	 * @param bool $AutodetectLanguage Indicates if browser language should be used on login and for new users.
	 * @param int $TimeFormat Time format that is used for new users.
	 * @param bool $EnableLogging Indicates if logs are enabled.
	 * @param bool $EnableEventLogging Indicates if events logs are enabled.
	 * @param int $LoggingLevel Specify logging level.
	 * @return bool
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function UpdateSettings(
			$DbLogin = null, $DbPassword = null, $DbName = null, $DbHost = null,
			$AdminLogin = null, $Password = null, $NewPassword = null, $AdminLanguage = null,
			$SiteName = null, $Language = null, $AutodetectLanguage = null, $TimeFormat = null, $DateFormat = null,
			$EnableLogging = null, $EnableEventLogging = null, $LoggingLevel = null)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$oUser = \Aurora\System\Api::getAuthenticatedUser();

		if ($oUser->Role === \Aurora\System\Enums\UserRole::SuperAdmin)
		{
			if ($SiteName !== null || $Language !== null || $TimeFormat !== null || $AutodetectLanguage !== null)
			{
				if ($SiteName !== null)
				{
					$this->setConfig('SiteName', $SiteName);
				}
				if ($AutodetectLanguage !== null)
				{
					$this->setConfig('AutodetectLanguage', $AutodetectLanguage);
				}
				if ($Language !== null)
				{
					$this->setConfig('Language', $Language);
				}
				if ($TimeFormat !== null)
				{
					$this->setConfig('TimeFormat', $TimeFormat);
				}
				$this->saveModuleConfig();
			}
			$oSettings =&\Aurora\System\Api::GetSettings();
			if ($DbLogin !== null)
			{
				$oSettings->DBLogin = $DbLogin;
			}
			if ($DbPassword !== null)
			{
				$oSettings->DBPassword = $DbPassword;
			}
			if ($DbName !== null)
			{
				$oSettings->DBName = $DbName;
			}
			if ($DbHost !== null)
			{
				$oSettings->DBHost = $DbHost;
			}
			if ($AdminLogin !== null && $AdminLogin !== $oSettings->GetConf('AdminLogin'))
			{
				$aArgs = array(
					'Login' => $AdminLogin
				);
				$this->broadcastEvent(
					'CheckAccountExists',
					$aArgs
				);

				$oSettings->AdminLogin = $AdminLogin;
			}

			$sAdminPassword = $oSettings->GetConf('AdminPassword');
			if ((empty($sAdminPassword) && empty($Password) || !empty($Password)) && !empty($NewPassword))
			{
				if (empty($sAdminPassword) || crypt(trim($Password), \Aurora\System\Api::$sSalt) === $sAdminPassword)
				{
					$oSettings->AdminPassword = crypt(trim($NewPassword), \Aurora\System\Api::$sSalt);
				}
				else
				{
					throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Exceptions\Errs::UserManager_AccountOldPasswordNotCorrect);
				}
			}
			if ($AdminLanguage !== null)
			{
				$oSettings->AdminLanguage = $AdminLanguage;
			}
			if ($EnableLogging !== null)
			{
				$oSettings->EnableLogging = $EnableLogging;
			}
			if ($EnableEventLogging !== null)
			{
				$oSettings->EnableEventLogging = $EnableEventLogging;
			}
			if ($LoggingLevel !== null)
			{
				$oSettings->LoggingLevel = $LoggingLevel;
			}
			return $oSettings->Save();
		}

		if ($oUser->isNormalOrTenant())
		{
			if ($Language !== null)
			{
				$oUser->Language = $Language;
			}
			if ($TimeFormat !== null)
			{
				$oUser->TimeFormat = $TimeFormat;
			}
			if ($DateFormat !== null)
			{
				$oUser->DateFormat = $DateFormat;
			}
			return $this->UpdateUserObject($oUser);
		}

		return false;
	}

	public function UpdateLoggingSettings($EnableLogging = null, $EnableEventLogging = null, $LoggingLevel = null)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		$oSettings =&\Aurora\System\Api::GetSettings();

		if ($EnableLogging !== null)
		{
			$oSettings->EnableLogging = $EnableLogging;
		}
		if ($EnableEventLogging !== null)
		{
			$oSettings->EnableEventLogging = $EnableEventLogging;
		}
		if ($LoggingLevel !== null)
		{
			$oSettings->LoggingLevel = $LoggingLevel;
		}

		return $oSettings->Save();
	}

	/**
	 * @ignore
	 * Turns on or turns off mobile version.
	 * @param bool $Mobile Indicates if mobile version should be turned on or turned off.
	 * @return bool
	 */
	public function SetMobile($Mobile)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);
		$oApiIntegrator = $this->getIntegratorManager();
		return $oApiIntegrator ? $oApiIntegrator->setMobile($Mobile) : false;
	}

	/**
	 * @api {post} ?/Api/ CreateTables
	 * @apiName CreateTables
	 * @apiGroup Core
	 * @apiDescription Creates tables reqired for module work. Creates first channel and tenant if it is necessary.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=CreateTables} Method Method name.
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'CreateTables'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {bool} Result.Result Indicates if tables was created successfully.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'CreateTables',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'CreateTables',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Creates tables required for module work. Creates first channel and tenant if it is necessary.
	 *
	 * @return bool
	 */
	public function CreateTables()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		$bResult = false;
		$oEavManager = \Aurora\System\Managers\Eav::getInstance();
		if ($oEavManager->createTablesFromFile())
		{
			$iChannelId = 0;
			$aChannels = $this->getChannelsManager()->getChannelList(0, 1);
			if (is_array($aChannels) && count($aChannels) > 0)
			{
				$iChannelId = $aChannels[0]->EntityId;
			}
			else
			{
				$iChannelId = self::Decorator()->CreateChannel('Default', '');
			}
			if ($iChannelId !== 0)
			{
				$aTenants = $this->getTenantsManager()->getTenantsByChannelId($iChannelId);
				if (is_array($aTenants) && count($aTenants) > 0)
				{
					$bResult = true;
				}
				else
				{
					$mTenantId = self::Decorator()->CreateTenant($iChannelId, 'Default');
					if (is_int($mTenantId))
					{
						$bResult = true;
					}
				}
			}
		}

		return $bResult;
	}

	/**
	 * Updates config files.
	 * @return boolean
	 */
	public function UpdateConfig()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		$bResult = true;
		try
		{
			\Aurora\System\Api::Init();
			\Aurora\System\Api::GetModuleManager()->SyncModulesConfigs();

			\Aurora\System\Api::GetSettings()->SyncConfigs();
		}
		catch (\Exception $e)
		{
			$bResult = false;
		}

		return $bResult;
	}

	/**
	 * @api {post} ?/Api/ TestDbConnection
	 * @apiName TestDbConnection
	 * @apiGroup Core
	 * @apiDescription Tests connection to database with specified credentials.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=TestDbConnection} Method Method name.
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **DbLogin** *string* Database login.<br>
	 * &emsp; **DbName** *string* Database name.<br>
	 * &emsp; **DbHost** *string* Database host.<br>
	 * &emsp; **DbPassword** *string* Database password.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'TestDbConnection',
	 *	Parameters: '{ DbLogin: "db_login_value", DbName: "db_name_value", DbHost: "db_host_value",
	 *		DbPassword: "db_pass_value" }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {bool} Result.Result Indicates if test of database connection was successful.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'TestDbConnection',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'TestDbConnection',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Tests connection to database with specified credentials.
	 *
	 * @param string $DbLogin Database login.
	 * @param string $DbName Database name.
	 * @param string $DbHost Database host.
	 * @param string $DbPassword Database password.
	 * @return bool
	 */
	public function TestDbConnection($DbLogin, $DbName, $DbHost, $DbPassword = null)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		$oSettings =&\Aurora\System\Api::GetSettings();
		$oSettings->DBLogin = $DbLogin;
		if ($DbPassword !== null)
		{
			$oSettings->DBPassword = $DbPassword;
		}
		$oSettings->DBName = $DbName;
		$oSettings->DBHost = $DbHost;

		$oEavManager = \Aurora\System\Managers\Eav::getInstance();
		return $oEavManager->testStorageConnection();
	}

	/**
	 * Obtains authenticated account.
	 *
	 * @param string $AuthToken
	 */
	public function GetAuthenticatedAccount($AuthToken)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		$oAccount = null;
		$oEavManager = \Aurora\System\Managers\Eav::getInstance();
		$aUserInfo = \Aurora\System\Api::getAuthenticatedUserInfo($AuthToken);
		if (isset($aUserInfo['account']))
		{
			$oAccount = $oEavManager->getEntity((int)$aUserInfo['account'], $aUserInfo['accountType']);
		}

		return $oAccount;
	}

	/**
	 * Obtains all accounts from all modules for authenticated user.
	 *
	 * @param string $AuthToken
	 * @param string $Type
	 * @return array
	 */
	public function GetAccounts($AuthToken, $Type = '')
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		$aArgs = array (
			'AuthToken' => $AuthToken,
			'WithPassword' => $this->getConfig('GetAccountWithPassword')
		);
		$aResult = [];

		$this->broadcastEvent(
			'GetAccounts',
			$aArgs,
			$aResult
		);
		if (!empty($Type))
		{
			$aTempResult = [];
			foreach ($aResult as $aItem)
			{
				if ($aItem['Type'] === $Type)
				{
					$aTempResult[] = $aItem;
				}
			}
			$aResult = $aTempResult;
		}
		return $aResult;
	}

	public function CheckIsBlockedUser($sEmail, $sIp)
	{
		$bEnableFailedLoginBlock = $this->getConfig('EnableFailedLoginBlock', false);
		$iLoginBlockAvailableTriesCount = $this->getConfig('LoginBlockAvailableTriesCount', 3);
		$iLoginBlockDurationMinutes = $this->getConfig('LoginBlockDurationMinutes', 30);

		if ($bEnableFailedLoginBlock)
		{
			try
			{
				$oBlockedUser = $this->GetBlockedUser($sEmail, $sIp);
				if ($oBlockedUser)
				{
					if ($oBlockedUser->ErrorLoginsCount >= $iLoginBlockAvailableTriesCount)
					{
						$iBlockTime = (int) ((time() - $oBlockedUser->Time) / 60);
						if ($iBlockTime > $iLoginBlockDurationMinutes)
						{
							$oBlockedUser->Delete();
						}
						else
						{
							throw new \Aurora\System\Exceptions\ApiException(
								1000,
								null,
								$this->i18N("BLOCKED_USER_MESSAGE_ERROR", ["N" => $iLoginBlockAvailableTriesCount, "M" => ($iLoginBlockDurationMinutes - $iBlockTime)])
							);
						}
					}
				}
			}
			catch (\Aurora\System\Exceptions\DbException $oEx)
			{
				\Aurora\System\Api::LogException($oEx);
			}
		}
	}

	public function GetBlockedUser($sEmail, $sIp)
	{
		return (new \Aurora\System\EAV\Query())
		->select()
		->whereType(Classes\UserBlock::class)
		->where(
			[
				'$AND' => [
					'Email' => [$sEmail, '='],
					'IpAddress' => [$sIp, '='],
				]
			]
		)
		->one()
		->exec();
	}

	public function BlockUser($sEmail, $sIp)
	{
		try
		{
			$oBlockedUser = $this->GetBlockedUser($sEmail, $sIp);
			if (!$oBlockedUser)
			{
				$oBlockedUser = new Classes\UserBlock();
				$oBlockedUser->Email = $sEmail;
				$oBlockedUser->IpAddress = $sIp;
			}
			$oBlockedUser->ErrorLoginsCount = $oBlockedUser->ErrorLoginsCount + 1;
			$oBlockedUser->Time = time();

			$oBlockedUser->Save();
		}
		catch (\Aurora\System\Exceptions\DbException $oEx)
		{
			\Aurora\System\Api::LogException($oEx);
		}
	}

	/**
	 *
	 */
	public function Authenticate($Login, $Password, $SignMe = false)
	{
		$mResult = false;

		$aArgs = array (
			'Login' => $Login,
			'Password' => $Password,
			'SignMe' => $SignMe
		);

		try
		{
			$this->broadcastEvent(
				'Login',
				$aArgs,
				$mResult
			);
		}
		catch (\Exception $oException)
		{
			\Aurora\System\Api::GetModuleManager()->SetLastException($oException);
		}

		return $mResult;
	}

	public function SetAuthDataAndGetAuthToken($aAuthData, $Language = '', $SignMe = false)
	{
		$mResult = false;
		if ($aAuthData && is_array($aAuthData))
		{
			$mResult = $aAuthData;
			if (isset($aAuthData['token']))
			{
				$iTime = $SignMe ? 0 : time();
				$iAuthTokenExpirationLifetimeDays = \Aurora\Api::GetSettings()->GetConf('AuthTokenExpirationLifetimeDays', 0);
				$iExpire = 0;
				if ($iAuthTokenExpirationLifetimeDays > 0)
				{
					$iExpire = time() + ($iAuthTokenExpirationLifetimeDays * 24 * 60 * 60);
				}

				$sAuthToken = \Aurora\System\Api::UserSession()->Set($aAuthData, $iTime, $iExpire);

				//this will store user data in static variable of Api class for later usage
				$oUser = \Aurora\System\Api::getAuthenticatedUser($sAuthToken);

				if ($oUser->Role !== \Aurora\System\Enums\UserRole::SuperAdmin)
				{
					// If User is super admin don't try to detect tenant. It will try to connect to DB.
					// Super admin should be able to log in without connecting to DB.
					$oTenant = \Aurora\System\Api::getTenantByWebDomain();
					if ($oTenant && $oUser->IdTenant !== $oTenant->EntityId)
					{
						throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AuthError);
					}
				}

				if ($Language !== '' && $oUser && $oUser->Language !== $Language)
				{
					$oUser->Language = $Language;
				}

				$oUser->LastLogin = date('Y-m-d H:i:s');
				$oUser->LoginsCount =  $oUser->LoginsCount + 1;

				$this->getUsersManager()->updateUser($oUser);
				\Aurora\System\Api::LogEvent('login-success: ' . $oUser->PublicId, self::GetName());
				$mResult = [
					'AuthToken' => $sAuthToken
				];
			}
		}
		else
		{
			\Aurora\System\Api::LogEvent('login-failed', self::GetName());
			\Aurora\System\Api::GetModuleManager()->SetLastException(
				new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AuthError)
			);
		}

		return $mResult;
	}

	/**
	 * @api {post} ?/Api/ Login
	 * @apiName Login
	 * @apiGroup Core
	 * @apiDescription Broadcasts event Login to other modules, gets responses from them and returns AuthToken.
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=Login} Method Method name.
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **Login** *string* Account login.<br>
	 * &emsp; **Password** *string* Account password.<br>
	 * &emsp; **Language** *string* New value of language for user.<br>
	 * &emsp; **SignMe** *bool* Indicates if it is necessary to remember user between sessions. *optional*<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'Login',
	 *	Parameters: '{ Login: "login_value", Password: "password_value", SignMe: true }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {mixed} Result.Result Object in case of success, otherwise **false**.
	 * @apiSuccess {string} Result.Result.AuthToken Authentication token.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'Login',
	 *	Result: { AuthToken: 'token_value' }
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'Login',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Broadcasts event Login to other modules, gets responses from them and returns AuthToken.
	 *
	 * @param string $Login Account login.
	 * @param string $Password Account password.
	 * @param string $Language New value of language for user.
	 * @param bool $SignMe Indicates if it is necessary to remember user between sessions.
	 * @return array
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function Login($Login, $Password, $Language = '', $SignMe = false)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		$sIp = \Aurora\System\Utils::getClientIp();
		$this->CheckIsBlockedUser($Login, $sIp);

		$aAuthData = $this->Decorator()->Authenticate($Login, $Password, $SignMe);

		if (!$aAuthData)
		{
			$this->BlockUser($Login, $sIp);
		}

		return $this->Decorator()->SetAuthDataAndGetAuthToken($aAuthData, $Language, $SignMe);
	}

	/**
	 *
	 * @param [type] $Login
	 * @param [type] $Realm
	 * @param [type] $Type
	 * @return void
	 */
	public function GetDigestHash($Login, $Realm, $Type)
	{

		/** This method is restricted to be called by web API (see denyMethodsCallByWebApi method). **/

		$mResult = null;

		$aArgs = array (
			'Login' => $Login,
			'Realm' => $Realm,
			'Type' => $Type
		);

		$this->broadcastEvent(
			'GetDigestHash',
			$aArgs,
			$mResult
		);

		return $mResult;
	}

	public function GetAccountUsedToAuthorize($Login)
	{

		/** This method is restricted to be called by web API (see denyMethodsCallByWebApi method). **/

		$mResult = null;

		$aArgs = array (
			'Login' => $Login
		);

		$this->broadcastEvent(
			'GetAccountUsedToAuthorize',
			$aArgs,
			$mResult
		);

		return $mResult;
	}

	/**
	 * @param string $Password Account password.
	 * @return bool
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function VerifyPassword($Password)
	{

		/** This method is restricted to be called by web API (see denyMethodsCallByWebApi method). **/

		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);
		$mResult = false;
		$bResult = false;
		$sAuthToken = \Aurora\System\Api::getAuthToken();
		$oApiIntegrator = $this->getIntegratorManager();

		$aUserInfo = $oApiIntegrator->getAuthenticatedUserInfo($sAuthToken);
		if (isset($aUserInfo['account']) && isset($aUserInfo['accountType']))
		{
			$oAccount = \Aurora\System\Managers\Eav::getInstance()->getEntity($aUserInfo['account'], $aUserInfo['accountType']);
			if ($oAccount instanceof \Aurora\System\Classes\AbstractAccount)
			{

				$aArgs = array (
					'Login' => $oAccount->getLogin(),
					'Password' => $Password,
					'SignMe' => false
				);
				$this->broadcastEvent(
					'Login',
					$aArgs,
					$mResult
				);

				if (is_array($mResult)
					&& isset($mResult['token'])
					&& $mResult['token'] === 'auth'
					&& isset($mResult['id'])
				)
				{
					$UserId = \Aurora\System\Api::getAuthenticatedUserId();
					if ($mResult['id'] === $UserId)
					{
						$bResult = true;
					}
				}
			}
		}

		return $bResult;
	}

    /**
     * @param $email
     * @param $resetOption
     * @return bool
     */
    public function ResetPassword($email, $resetOption)
    {
        $mResult = false;

        $aArgs = array (
            'email' => $email,
            'resetOption' => $resetOption
        );
        $this->broadcastEvent(
            'ResetPassword',
            $aArgs,
            $mResult
        );


        if (!empty($mResult))
        {
            \Aurora\System\Api::LogEvent('resetPassword-success: ' . $email , self::GetName());
            return $mResult;
        }

        \Aurora\System\Api::LogEvent('resetPassword-failed: ' . $email, self::GetName());
    }


    public function ResetPasswordBySecurityQuestion($securityAnswer, $securityToken)
    {
        $mResult = false;

        $aArgs = array (
            'securityAnswer' => $securityAnswer,
            'securityToken' => $securityToken
        );
        $this->broadcastEvent(
            'ResetPasswordBySecurityQuestion',
            $aArgs,
            $mResult
        );


        if (!empty($mResult))
        {
            \Aurora\System\Api::LogEvent('ResetPasswordBySecurityQuestion-success: ' . $securityAnswer , self::GetName());
            return $mResult;
        }

        \Aurora\System\Api::LogEvent('ResetPasswordBySecurityQuestion-failed: ' . $securityAnswer, self::GetName());
    }

    public function UpdatePassword($Password, $ConfirmPassword, $Hash)
    {

        $mResult = false;

        $aArgs = array (
            'Password' => $Password,
            'ConfirmPassword' => $ConfirmPassword,
            'Hash' => $Hash
        );
        $this->broadcastEvent(
            'UpdatePassword',
            $aArgs,
            $mResult
        );

        if (!empty($mResult))
        {

            \Aurora\System\Api::LogEvent('updatePassword-success: ' . $Hash , self::GetName());
            return $mResult;
        }

        \Aurora\System\Api::LogEvent('updatePassword-failed: ' . $Hash, self::GetName());
    }

	/**
	 * @api {post} ?/Api/ Logout
	 * @apiName Logout
	 * @apiGroup Core
	 * @apiDescription Logs out authenticated user. Clears session.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=Logout} Method Method name.
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'Logout'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {bool} Result.Result Indicates if logout was successful.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'Logout',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'Logout',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Logs out authenticated user. Clears session.
	 *
	 * @return bool
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function Logout()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);

		\Aurora\System\Api::LogEvent('logout', self::GetName());

		\Aurora\System\Api::UserSession()->Delete(
			\Aurora\System\Api::getAuthToken()
		);


		return true;
	}

	/**
	 * @deprecated since version 8.3.7
	 */
	public function GetEntityList($Type, $Offset = 0, $Limit = 0, $Search = '', $TenantId = 0, $Filters = [])
	{
		switch ($Type)
		{
			case 'Tenant':
				return self::Decorator()->GetTenants($Offset, $Limit, $Search);
			case 'User':
				return self::Decorator()->GetUsers($TenantId, $Offset, $Limit, 'PublicId', \Aurora\System\Enums\SortOrder::ASC, $Search, $Filters);
		}
		return null;
	}

	/**
	 * @deprecated since version 8.3.7
	 */
	public function GetEntity($Type, $Id)
	{
		switch ($Type)
		{
			case 'Tenant':
				return self::Decorator()->GetTenant($Id);
			case 'User':
				return self::Decorator()->GetUser($Id);
		}
		return null;
	}

	/**
	 * Creates channel with specified login and description.
	 *
	 * @param string $Login New channel login.
	 * @param string $Description New channel description.
	 * @return int New channel identifier.
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function CreateChannel($Login, $Description = '')
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		$Login = \trim($Login);
		if ($Login !== '')
		{
			$oChannel = new Classes\Channel(self::GetName());

			$oChannel->Login = $Login;

			if ($Description !== '')
			{
				$oChannel->Description = $Description;
			}

			if ($this->getChannelsManager()->createChannel($oChannel))
			{
				return $oChannel->EntityId;
			}
		}
		else
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}
	}

	/**
	 * Updates channel.
	 *
	 * @param int $ChannelId Channel identifier.
	 * @param string $Login New login for channel.
	 * @param string $Description New description for channel.
	 * @return bool
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function UpdateChannel($ChannelId, $Login = '', $Description = '')
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		if ($ChannelId > 0)
		{
			$oChannel = $this->getChannelsManager()->getChannelById($ChannelId);

			if ($oChannel)
			{
				$Login = \trim($Login);
				if (!empty($Login))
				{
					$oChannel->Login = $Login;
				}
				if (!empty($Description))
				{
					$oChannel->Description = $Description;
				}

				return $this->getChannelsManager()->updateChannel($oChannel);
			}
		}
		else
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		return false;
	}

	/**
	 * Deletes channel.
	 *
	 * @param int $ChannelId Identifier of channel to delete.
	 * @return bool
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function DeleteChannel($ChannelId)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		if ($ChannelId > 0)
		{
			$oChannel = $this->getChannelsManager()->getChannelById($ChannelId);

			if ($oChannel)
			{
				return $this->getChannelsManager()->deleteChannel($oChannel);
			}
		}
		else
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		return false;
	}

	/**
	 * @api {post} ?/Api/ GetTenants
	 * @apiName GetTenants
	 * @apiGroup Core
	 * @apiDescription Obtains tenant list if super administrator is authenticated.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=GetTenants} Method Method name.
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **Offset** *int* Offset of tenant list.<br>
	 * &emsp; **Limit** *int* Limit of result tenant list.<br>
	 * &emsp; **Search** *string* Search string.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'GetTenants'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {mixed} Result.Result Object with array of tenants and their count in case of success, otherwise **false**.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'GetTenants',
	 *	Result: {
	 *				Items: [
	 *					{ Id: 123, Name: 'Default', SiteName: '' }
	 *				],
	 *				Count: 1
	 *			}
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'GetTenants',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Obtains tenant list if super administrator is authenticated.
	 * @param int $Offset Offset of the list.
	 * @param int $Limit Limit of the list.
	 * @param string $Search Search string.
	 * @return array {
	 *		*array* **Items** Tenant list
	 *		*int* **Count** Tenant count
	 * }
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function GetTenants($Offset = 0, $Limit = 0, $Search = '')
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::TenantAdmin);

		$oAuthenticatedUser = \Aurora\System\Api::getAuthenticatedUser();
		$bTenant = $oAuthenticatedUser->Role === \Aurora\System\Enums\UserRole::TenantAdmin;

		$aTenantsFromDb = $this->getTenantsManager()->getTenantList($Offset, $Limit, $Search);
		$oSettings = $this->GetModuleSettings();
		$aTenants = [];

		foreach ($aTenantsFromDb as $oTenant)
		{
			if (!$bTenant || $oTenant->EntityId === $oAuthenticatedUser->IdTenant)
			{
				$aTenants[] = [
					'Id' => $oTenant->EntityId,
					'Name' => $oTenant->Name,
					'SiteName' => $oSettings->GetTenantValue($oTenant->Name, 'SiteName', '')
				];
			}
		}

		$iTenantsCount = $Limit > 0 ? $this->getTenantsManager()->getTenantsCount($Search) : count($aTenantsFromDb);
		return array(
			'Items' => $aTenants,
			'Count' => $iTenantsCount,
		);
	}

	/**
	 * @deprecated since version 8.3.7
	 */
	public function GetTenantList($Offset = 0, $Limit = 0, $Search = '')
	{
		return self::Decorator()->GetTenants($Offset, $Limit, $Search);
	}

	/**
	 * @api {post} ?/Api/ GetTenant
	 * @apiName GetTenant
	 * @apiGroup Core
	 * @apiDescription Returns tenant.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=GetTenant} Method Method name.
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **Id** *int* Tenant identifier.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'GetTenant',
	 *	Parameters: '{ Id: 123 }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {mixed} Result.Result Object in case of success, otherwise **false**.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'GetTenant',
	 *	Result: { Description: '', Name: 'Default', SiteName: '', WebDomain: '' }
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'GetTenant',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Returns tenant object by identifier.
	 *
	 * @param int $Id Tenant identifier.
	 * @return \Aurora\Modules\Core\Classes\Tenant|null
	 */
	public function GetTenant($Id)
	{
		$oAuthenticatedUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!empty($oAuthenticatedUser) && $oAuthenticatedUser->Role === \Aurora\System\Enums\UserRole::TenantAdmin && $oAuthenticatedUser->IdTenant === $Id)
		{
			\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::TenantAdmin);
		}
		else
		{
			\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);
		}

		return $this->GetTenantUnchecked($Id);
	}

	/**
	 * @api {post} ?/Api/ CreateTenant
	 * @apiName CreateTenant
	 * @apiGroup Core
	 * @apiDescription Creates tenant.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=CreateTenant} Method Method name.
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **ChannelId** *int* Identifier of channel new tenant belongs to.<br>
	 * &emsp; **Name** *string* New tenant name.<br>
	 * &emsp; **Description** *string* New tenant description.<br>
	 * &emsp; **WebDomain** *string* New tenant web domain.<br>
	 * &emsp; **SiteName** *string* New tenant site name.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'CreateTenant',
	 *	Parameters: '{ ChannelId: 123, Name: "name_value", Description: "description_value" }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {bool} Result.Result Indicates if tenant was created successfully.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'CreateTenant',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'CreateTenant',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Creates tenant.
	 *
	 * @param int $ChannelId Identifier of channel new tenant belongs to.
	 * @param string $Name New tenant name.
	 * @param string $Description New tenant description.
	 * @param string $WebDomain New tenant web domain.
	 * @param string $SiteName Tenant site name.
	 * @return bool
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function CreateTenant($ChannelId = 0, $Name = '', $Description = '', $WebDomain = '', $SiteName = null)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		$oSettings =&\Aurora\System\Api::GetSettings();
		if (!$oSettings->GetConf('EnableMultiChannel') && $ChannelId === 0)
		{
			$aChannels = $this->getChannelsManager()->getChannelList(0, 1);
			$ChannelId = count($aChannels) === 1 ? $aChannels[0]->EntityId : 0;
		}
		$Name = \trim(\Aurora\System\Utils::getSanitizedFilename($Name));
		if ($Name !== '' && $ChannelId > 0)
		{
			$iTenantsCount = $this->getTenantsManager()->getTenantsByChannelIdCount($ChannelId);
			if ($oSettings->GetConf('EnableMultiTenant') || $iTenantsCount === 0)
			{
				$oTenant = new Classes\Tenant(self::GetName());

				$oTenant->Name = $Name;
				$oTenant->Description = $Description;
				$oTenant->WebDomain = $WebDomain;
				$oTenant->IdChannel = $ChannelId;

				if ($this->getTenantsManager()->createTenant($oTenant))
				{
					if ($SiteName !== null)
					{
						$oSettings = $this->GetModuleSettings();
						$oSettings->SetTenantValue($oTenant->Name, 'SiteName', $SiteName);
						$oSettings->SaveTenantSettings($oTenant->Name);
					}
					return $oTenant->EntityId;
				}
			}
		}
		else
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		return false;
	}

	/**
	 * @api {post} ?/Api/ UpdateTenant
	 * @apiName UpdateTenant
	 * @apiGroup Core
	 * @apiDescription Updates tenant.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=UpdateTenant} Method Method name.
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **TenantId** *int* Identifier of tenant to update.<br>
	 * &emsp; **Description** *string* Tenant description.<br>
	 * &emsp; **WebDomain** *string* Tenant web domain.<br>
	 * &emsp; **SiteName** *string* Tenant site name.<br>
	 * &emsp; **ChannelId** *int* Identifier of the new tenant channel.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'UpdateTenant',
	 *	Parameters: '{ TenantId: 123, Description: "description_value", ChannelId: 123 }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {bool} Result.Result Indicates if tenant was updated successfully.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'UpdateTenant',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'UpdateTenant',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Updates tenant.
	 *
	 * @param int $TenantId Identifier of tenant to update.
	 * @param string $Description Tenant description.
	 * @param string $WebDomain Tenant web domain.
	 * @param string $SiteName Tenant site name.
	 * @param int $ChannelId Identifier of the tenant channel.
	 * @return bool
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function UpdateTenant($TenantId, $Description = null, $WebDomain = null, $SiteName = null, $ChannelId = 0)
	{
		$oAuthenticatedUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oAuthenticatedUser->Role === \Aurora\System\Enums\UserRole::TenantAdmin && $oAuthenticatedUser->IdTenant === $TenantId)
		{
			\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::TenantAdmin);
		}
		else
		{
			\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);
		}

		if (!empty($TenantId))
		{
			$oTenant = $this->getTenantsManager()->getTenantById($TenantId);
			if ($oTenant)
			{
				if ($SiteName !== null)
				{
					$oSettings = $this->GetModuleSettings();
					$oSettings->SetTenantValue($oTenant->Name, 'SiteName', $SiteName);
					$oSettings->SaveTenantSettings($oTenant->Name);
				}
				if ($Description !== null)
				{
					$oTenant->Description = $Description;
				}
				if ($WebDomain !== null && $oAuthenticatedUser->Role === \Aurora\System\Enums\UserRole::SuperAdmin)
				{
					$oTenant->WebDomain = $WebDomain;
				}
				if (!empty($ChannelId) && $oAuthenticatedUser->Role === \Aurora\System\Enums\UserRole::SuperAdmin)
				{
					$oTenant->IdChannel = $ChannelId;
				}

				return $this->getTenantsManager()->updateTenant($oTenant);
			}
		}
		else
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		return false;
	}

		/**
	 * @api {post} ?/Api/ DeleteTenants
	 * @apiName DeleteTenants
	 * @apiGroup Core
	 * @apiDescription Deletes tenants specified by a list of identifiers.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=DeleteTenants} Method Method name.
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **IdList** *array* List of tenants identifiers.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'DeleteTenants',
	 *	Parameters: '{ IdList: [123, 456] }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {bool} Result.Result Indicates if tenants were deleted successfully.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'DeleteTenants',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'DeleteTenants',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Deletes tenants specified by a list of identifiers.
	 * @param array $IdList List of tenants identifiers.
	 * @return bool
	 */
	public function DeleteTenants($IdList)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		$bResult = true;

		foreach ($IdList as $sId)
		{
			$bResult = $bResult && self::Decorator()->DeleteTenant($sId);
		}

		return $bResult;
	}

	/**
	 * @api {post} ?/Api/ DeleteTenant
	 * @apiName DeleteTenant
	 * @apiGroup Core
	 * @apiDescription Deletes tenant.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=DeleteTenant} Method Method name.
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **TenantId** *int* Identifier of tenant to delete.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'DeleteTenant',
	 *	Parameters: '{ TenantId: 123 }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {bool} Result.Result Indicates if tenant was deleted successfully.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'DeleteTenant',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'DeleteTenant',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Deletes tenant.
	 *
	 * @param int $TenantId Identifier of tenant to delete.
	 * @return bool
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function DeleteTenant($TenantId)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		if (!empty($TenantId))
		{
			$oTenant = $this->getTenantsManager()->getTenantById($TenantId);

			if ($oTenant)
			{
				// Tenant users should be deleted here in case if other modules (MailDomains for example) are turned off.
				$aUsers = self::Decorator()->getUsersManager()->getUserList(0, 0, 'PublicId', \Aurora\System\Enums\SortOrder::ASC, '', ['IdTenant' => $oTenant->EntityId]);
				foreach ($aUsers as $aUser)
				{
					self::Decorator()->DeleteUser($aUser['EntityId']);
				}

				// Delete tenant config files.
				$sTenantSpacePath = \Aurora\System\Api::GetModuleManager()->GetModulesSettingsPath().'tenants/'.$oTenant->Name;
				if (@is_dir($sTenantSpacePath))
				{
					$this->deleteTree($sTenantSpacePath);
				}

				// Delete tenant itself.
				return $this->getTenantsManager()->deleteTenant($oTenant);
			}
		}
		else
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		return false;
	}

	/**
	 * @api {post} ?/Api/ GetUsers
	 * @apiName GetUsers
	 * @apiGroup Core
	 * @apiDescription Returns user list.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=GetUsers} Method Method name.
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **Offset** *int* Offset of user list.<br>
	 * &emsp; **Limit** *int* Limit of result user list.<br>
	 * &emsp; **OrderBy** *string* Name of field order by.<br>
	 * &emsp; **OrderType** *int* Order type.<br>
	 * &emsp; **Search** *string* Search string.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'GetUsers',
	 *	Parameters: '{ Offset: 0, Limit: 0, OrderBy: "", OrderType: 0, Search: 0 }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {mixed} Result.Result List of users in case of success, otherwise **false**.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'GetUsers',
	 *	Result: {
	 *				Items: [
	 *					{ Id: 123, PublicId: 'user123_PublicId' },
	 *					{ Id: 124, PublicId: 'user124_PublicId' }
	 *				],
	 *				Count: 2
	 *			}
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'GetUsers',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Returns user list.
	 *
	 * @param int $TenantId Tenant identifier.
	 * @param int $Offset Offset of user list.
	 * @param int $Limit Limit of result user list.
	 * @param string $OrderBy Name of field order by.
	 * @param int $OrderType Order type.
	 * @param string $Search Search string.
	 * @param array $Filters Filters.
	 * @return array {
	 *		*array* **Items** User list.
	 *		*int* **Count** Users count.
	 * }
	 */
	public function GetUsers($TenantId = 0, $Offset = 0, $Limit = 0, $OrderBy = 'PublicId', $OrderType = \Aurora\System\Enums\SortOrder::ASC, $Search = '', $Filters = [])
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::TenantAdmin);

		$oAuthenticatedUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oAuthenticatedUser->Role === \Aurora\System\Enums\UserRole::TenantAdmin && $oAuthenticatedUser->IdTenant === $TenantId)
		{
			\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::TenantAdmin);
		}
		else
		{
			\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);
		}

		$aResult = [
			'Items' => [],
			'Count' => 0,
		];

		if ($TenantId !== 0)
		{
			if (isset($Filters) && is_array($Filters) && count($Filters) > 0)
			{
				$Filters['IdTenant'] = [$TenantId, '='];
				$Filters = [
					'$AND' => $Filters
				];
			}
			else
			{
				$Filters = ['IdTenant' => [$TenantId, '=']];
			}
		}

		$aUsers = $this->getUsersManager()->getUserList($Offset, $Limit, $OrderBy, $OrderType, $Search, $Filters);
		foreach($aUsers as $aUser)
		{
			$aResult['Items'][] = [
				'Id' => $aUser['EntityId'],
				'UUID' => $aUser['UUID'],
				'Name' => $aUser['Name'],
				'PublicId' => $aUser['PublicId']
			];
		}
		$aResult['Count'] = $Limit > 0 ? $this->getUsersManager()->getUsersCount($Search, $Filters) : count($aUsers);

		return $aResult;
	}

	/**
	 * @deprecated since version 8.3.7
	 */
	public function GetUserList($TenantId = 0, $Offset = 0, $Limit = 0, $OrderBy = 'PublicId', $OrderType = \Aurora\System\Enums\SortOrder::ASC, $Search = '', $Filters = [])
	{
		return self::Decorator()->GetUsers($TenantId, $Offset, $Limit, $OrderBy, $OrderType, $Search, $Filters);
	}

	public function GetTotalUsersCount()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::TenantAdmin);

		return $this->getUsersManager()->getTotalUsersCount();
	}

	/**
	 * @api {post} ?/Api/ GetUser
	 * @apiName GetUser
	 * @apiGroup Core
	 * @apiDescription Returns user data.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=GetUser} Method Method name.
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **UserId** *string* User identifier.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'GetUser',
	 *	Parameters: '{ "Id": 17 }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {bool} Result.Result Indicates if test of database connection was successful.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'GetUser',
	 *	Result: {
     *		'Name': '',
     *		'PublicId': 'mail@domain.com',
     *		'Role': 2,
     *		'WriteSeparateLog': false
	 *	}
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'GetUser',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Returns user object.
	 *
	 * @param int|string $Id User identifier or UUID.
	 * @return \Aurora\Modules\Core\Classes\User
	 */
	public function GetUser($Id = '')
	{
		$oUser = $this->getUsersManager()->getUser($Id);
		$oAuthenticatedUser = \Aurora\System\Api::getAuthenticatedUser();

		if (!empty($oUser)) { // User may be needed for anonymous on reset password or register screens. It can be obtained after using skipCheckUserRole method.
			if (!empty($oAuthenticatedUser) && $oAuthenticatedUser->Role === \Aurora\System\Enums\UserRole::NormalUser && $oAuthenticatedUser->EntityId === $oUser->EntityId)
			{
				\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
			}
			else if (!empty($oAuthenticatedUser) && $oAuthenticatedUser->Role === \Aurora\System\Enums\UserRole::TenantAdmin && $oAuthenticatedUser->IdTenant === $oUser->IdTenant)
			{
				\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::TenantAdmin);
			}
			else
			{
				\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);
			}

			return $oUser;
		}

		return null;
	}

	public function TurnOffSeparateLogs()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::TenantAdmin);

		$aResults = $this->getUsersManager()->getUserList(0, 0, 'PublicId', \Aurora\System\Enums\SortOrder::ASC, '', ['WriteSeparateLog' => [true, '=']]);
		foreach($aResults as $aUser)
		{
			$oUser = self::Decorator()->GetUser($aUser['EntityId']);
			if ($oUser)
			{
				$oUser->WriteSeparateLog = false;
				$oUser->saveAttribute('WriteSeparateLog');
			}

			$this->UpdateUserObject($oUser);
		}

		return true;
	}

	public function ClearSeparateLogs()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::TenantAdmin);

		\Aurora\System\Api::RemoveSeparateLogs();

		return true;
	}

	public function GetUsersWithSeparateLog()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::TenantAdmin);

		$aResults = $this->getUsersManager()->getUserList(0, 0, 'PublicId', \Aurora\System\Enums\SortOrder::ASC, '', ['WriteSeparateLog' => [true, '=']]);
		$aUsers = [];
		foreach($aResults as $aUser)
		{
			$aUsers[] = $aUser['PublicId'];
		}
		return $aUsers;
	}

	/**
	 * @api {post} ?/Api/ CreateUser
	 * @apiName CreateUser
	 * @apiGroup Core
	 * @apiDescription Creates user.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=CreateUser} Method Method name.
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **TenantId** *int* Identifier of tenant that will contain new user.<br>
	 * &emsp; **PublicId** *string* New user name.<br>
	 * &emsp; **Role** *int* New user role.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'CreateUser',
	 *	Parameters: '{ TenantId: 123, PublicId: "PublicId_value", Role: 2 }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {mixed} Result.Result User identifier in case of success, otherwise **false**.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'CreateUser',
	 *	Result: 123
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'CreateUser',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Creates user.
	 *
	 * @param int $TenantId Identifier of tenant that will contain new user.
	 * @param string $PublicId New user name.
	 * @param int $Role New user role.
	 * @param bool $WriteSeparateLog Indicates if log file should be written separate for this user.
	 * @return int|false
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function CreateUser($TenantId = 0, $PublicId = '', $Role = \Aurora\System\Enums\UserRole::NormalUser, $WriteSeparateLog = false)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::TenantAdmin);

		if ($TenantId === 0)
		{
			\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);
			$aTenants = $this->getTenantsManager()->getTenantList(0, 1, '', '');
			$TenantId = count($aTenants) === 1 ? $aTenants[0]->EntityId : 0;
		}

		$oAuthenticatedUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!empty($oAuthenticatedUser) && $oAuthenticatedUser->Role === \Aurora\System\Enums\UserRole::TenantAdmin && $oAuthenticatedUser->IdTenant === $TenantId)
		{
			\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::TenantAdmin);
		}
		else
		{
			\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);
		}

		$oTenant = $this->getTenantsManager()->getTenantById($TenantId);
		if (!$oTenant)
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		$PublicId = \trim($PublicId);
		if (!empty($TenantId) && !empty($PublicId))
		{
			$oUser = $this->getUsersManager()->getUserByPublicId($PublicId);
			if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
			{
				throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::UserAlreadyExists);
			}
			else
			{
				$oLicense = \Aurora\System\Api::GetModuleDecorator('Licensing');
				if ($oLicense instanceof \Aurora\System\Module\Decorator)
				{
					if (!$oLicense->ValidateUsersCount($this->GetTotalUsersCount()) || !$oLicense->ValidatePeriod())
					{
						\Aurora\System\Api::Log("Error: License limit");
						throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::LicenseLimit);
					}
				}
			}

			$oUser = new Classes\User(self::GetName());

			$oUser->PublicId = $PublicId;
			$oUser->IdTenant = $TenantId;
			$oUser->Role = $Role;
			$oUser->WriteSeparateLog = $WriteSeparateLog;

			$oUser->Language = \Aurora\System\Api::GetLanguage(true);
			$oUser->TimeFormat = self::getInstance()->getConfig('TimeFormat');
			$oUser->DateFormat = self::getInstance()->getConfig('DateFormat');

			if ($this->getUsersManager()->createUser($oUser))
			{
				return $oUser->EntityId;
			}
		}
		else
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		return false;
	}

	/**
	 * @api {post} ?/Api/ UpdateUser
	 * @apiName UpdateUser
	 * @apiGroup Core
	 * @apiDescription Updates user.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=UpdateUser} Method Method name.
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **UserId** *int* Identifier of user to update.<br>
	 * &emsp; **UserName** *string* New user name.<br>
	 * &emsp; **TenantId** *int* Identifier of tenant that will contain the user.<br>
	 * &emsp; **Role** *int* New user role.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'UpdateUser',
	 *	Parameters: '{ UserId: 123, UserName: "name_value", TenantId: 123, Role: 2 }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {bool} Result.Result Indicates if user was updated successfully.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'UpdateUser',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'UpdateUser',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Updates user.
	 *
	 * @param int $UserId Identifier of user to update.
	 * @param string $PublicId New user name.
	 * @param int $TenantId Identifier of tenant that will contain the user.
	 * @param int $Role New user role.
	 * @param bool $WriteSeparateLog New value of indicator if user's logs should be in a separate file.
	 * @return bool
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function UpdateUser($UserId, $PublicId = '', $TenantId = 0, $Role = -1, $WriteSeparateLog = null)
	{
		$PublicId = \trim($PublicId);
		if (!empty($PublicId) && empty($TenantId) && $Role === -1 && $UserId === \Aurora\System\Api::getAuthenticatedUserId())
		{
			\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);
		}
		else
		{
			\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);
		}

		if ($UserId > 0)
		{
			$oUser = $this->getUsersManager()->getUser($UserId);

			if ($oUser)
			{
				if (!empty($PublicId))
				{
					$oUser->PublicId = $PublicId;
				}
				if (!empty($TenantId))
				{
					$oUser->IdTenant = $TenantId;
				}
				if ($Role !== -1)
				{
					$oUser->Role = $Role;
				}
				if ($WriteSeparateLog !== null)
				{
					$oUser->WriteSeparateLog = $WriteSeparateLog;
				}

				return $this->getUsersManager()->updateUser($oUser);
			}
		}
		else
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		return false;
	}

	/**
	 * @api {post} ?/Api/ DeleteUsers
	 * @apiName DeleteUsers
	 * @apiGroup Core
	 * @apiDescription Deletes users specified by a list of identifiers.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=DeleteUsers} Method Method name.
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **IdList** *int* List of users identifiers.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'DeleteUsers',
	 *	Parameters: '{ IdList: [125, 457] }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {bool} Result.Result Indicates if users were deleted successfully.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'DeleteUsers',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'DeleteUsers',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Deletes users specified by a list of identifiers.
	 * @param array $IdList List of users identifiers.
	 * @return bool
	 */
	public function DeleteUsers($IdList)
	{
		$bResult = true;

		foreach ($IdList as $sId)
		{
			$bResult = $bResult && self::Decorator()->DeleteUser($sId);
		}

		return $bResult;
	}

	/**
	 * @api {post} ?/Api/ DeleteUser
	 * @apiName DeleteUser
	 * @apiGroup Core
	 * @apiDescription Deletes user.
	 *
	 * @apiHeader {string} Authorization "Bearer " + Authentication token which was received as the result of Core.Login method.
	 * @apiHeaderExample {json} Header-Example:
	 *	{
	 *		"Authorization": "Bearer 32b2ecd4a4016fedc4abee880425b6b8"
	 *	}
	 *
	 * @apiParam {string=Core} Module Module name.
	 * @apiParam {string=DeleteUser} Method Method name.
	 * @apiParam {string} Parameters JSON.stringified object <br>
	 * {<br>
	 * &emsp; **UserId** *int* User identifier.<br>
	 * }
	 *
	 * @apiParamExample {json} Request-Example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'DeleteUser',
	 *	Parameters: '{ UserId: 123 }'
	 * }
	 *
	 * @apiSuccess {object[]} Result Array of response objects.
	 * @apiSuccess {string} Result.Module Module name.
	 * @apiSuccess {string} Result.Method Method name.
	 * @apiSuccess {bool} Result.Result Indicates if user was deleted successfully.
	 * @apiSuccess {int} [Result.ErrorCode] Error code.
	 *
	 * @apiSuccessExample {json} Success response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'DeleteUser',
	 *	Result: true
	 * }
	 *
	 * @apiSuccessExample {json} Error response example:
	 * {
	 *	Module: 'Core',
	 *	Method: 'DeleteUser',
	 *	Result: false,
	 *	ErrorCode: 102
	 * }
	 */
	/**
	 * Deletes user.
	 *
	 * @param int $UserId User identifier.
	 * @return bool
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function DeleteUser($UserId = 0)
	{
		$oAuthenticatedUser = \Aurora\System\Api::getAuthenticatedUser();

		$oUser = self::Decorator()->GetUserUnchecked($UserId);

		if ($oUser instanceof \Aurora\Modules\Core\Classes\User && $oAuthenticatedUser->Role === \Aurora\System\Enums\UserRole::TenantAdmin && $oUser->IdTenant === $oAuthenticatedUser->IdTenant)
		{
			\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::TenantAdmin);
		}
		else
		{
			\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);
		}

		$bResult = false;

		if (!empty($UserId) && is_int($UserId))
		{
			$oUser = $this->getUsersManager()->getUser($UserId);

			if ($oUser)
			{
				$bResult = $this->getUsersManager()->deleteUser($oUser);
			}
		}
		else
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter);
		}

		return $bResult;
	}

	public function GetLogFilesData()
	{
		$aData = [];

		$sFileName = \Aurora\System\Api::GetLogFileName();
		$sFilePath = \Aurora\System\Api::GetLogFileDir() . $sFileName;
		$aData['LogFileName'] = $sFileName;
		$aData['LogSizeBytes'] = file_exists($sFilePath) ? filesize($sFilePath) : 0;

		$sEventFileName = \Aurora\System\Api::GetLogFileName(\Aurora\System\Logger::$sEventLogPrefix);
		$sEventFilePath = \Aurora\System\Api::GetLogFileDir() . $sEventFileName;
		$aData['EventLogFileName'] = $sEventFileName;
		$aData['EventLogSizeBytes'] = file_exists($sEventFilePath) ? filesize($sEventFilePath) : 0;

		return $aData;
	}

	public function GetLogFile($EventsLog = false, $PublicId = '')
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		$sLogFilePrefix = $EventsLog ? \Aurora\System\Logger::$sEventLogPrefix : '';
		if ($PublicId !== '')
		{
			$sLogFilePrefix = $PublicId . '-';
		}
		$sFileName = \Aurora\System\Api::GetLogFileDir().\Aurora\System\Api::GetLogFileName($sLogFilePrefix);

		if (file_exists($sFileName))
		{
			$mResult = fopen($sFileName, "r");

			if (false !== $mResult && is_resource($mResult))
			{
				$sContentType = \MailSo\Base\Utils::MimeContentType($sFileName);
				\Aurora\System\Managers\Response::OutputHeaders(true, $sContentType, $sFileName);

				if ($sContentType === 'text/plain')
				{
					$sLogData = stream_get_contents($mResult);
					echo(\MailSo\Base\HtmlUtils::ClearTags($sLogData));
				}
				else
				{
					\MailSo\Base\Utils::FpassthruWithTimeLimitReset($mResult, 8192, function ($sData) {
						return \MailSo\Base\HtmlUtils::ClearTags($sData);
					});
				}

				@fclose($mResult);
			}
		}
	}

	public function GetLog($EventsLog, $PartSize = 10240)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		$sLogFilePrefix = $EventsLog ? \Aurora\System\Logger::$sEventLogPrefix : '';
		$sFileName = \Aurora\System\Api::GetLogFileDir().\Aurora\System\Api::GetLogFileName($sLogFilePrefix);

		$logData = '';

		if (file_exists($sFileName))
		{
			$iOffset = filesize($sFileName) - $PartSize;
			$iOffset = $iOffset < 0 ? 0 : $iOffset;
			$logData = \MailSo\Base\HtmlUtils::ClearTags(file_get_contents($sFileName, false, null, $iOffset, $PartSize));
		}

		return $logData;
	}

	/**
	 *
	 * @param bool $EventsLog
	 * @return bool
	 */
	public function ClearLog($EventsLog)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		$sLogFilePrefix = $EventsLog ? \Aurora\System\Logger::$sEventLogPrefix : '';
		$sFileName = \Aurora\System\Api::GetLogFileDir().\Aurora\System\Api::GetLogFileName($sLogFilePrefix);

		return \Aurora\System\Api::ClearLog($sFileName);
	}

	/**
	 *
	 * @param int $UserId
	 * @param string $Content
	 * @param string $FileName
	 * @return array|bool
	 * @throws \Aurora\System\Exceptions\ApiException
	 */
	public function SaveContentAsTempFile($UserId, $Content, $FileName)
	{
		$mResult = false;
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$sUUID = \Aurora\System\Api::getUserUUIDById($UserId);
		try
		{
			$sTempName = md5($sUUID.$Content.$FileName);
			$oApiFileCache = new \Aurora\System\Managers\Filecache();

			if (!$oApiFileCache->isFileExists($sUUID, $sTempName))
			{
				$oApiFileCache->put($sUUID, $sTempName, $Content);
			}

			if ($oApiFileCache->isFileExists($sUUID, $sTempName))
			{
				$mResult = \Aurora\System\Utils::GetClientFileResponse(
					null, $UserId, $FileName, $sTempName, $oApiFileCache->fileSize($sUUID, $sTempName)
				);
			}
		}
		catch (\Exception $oException)
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::FilesNotAllowed, $oException);
		}

		return $mResult;
	}

	/**
	 * Updates user Timezone.
	 *
	 * @param string $Timezone New Timezone.
	 *
	 */
	public function UpdateUserTimezone($Timezone)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$oUser = \Aurora\System\Api::getAuthenticatedUser();

		if ($oUser && $Timezone)
		{
			if ($oUser && $oUser->DefaultTimeZone !== $Timezone)
			{
				$oUser->DefaultTimeZone = $Timezone;
				$this->UpdateUserObject($oUser);
			}
		}
		else
		{
			return false;
		}
		return true;
	}

	public function GetCompatibilities()
	{
		return [];
	}

	public function IsModuleDisabledForObject($oObject, $sModuleName)
	{
		return ($oObject instanceof \Aurora\System\EAV\Entity) ? $oObject->isModuleDisabled($sModuleName) : false;
	}

	public function GetUserSessions()
	{
		$aResult = [];
		if (\Aurora\Api::GetSettings()->GetValue('StoreAuthTokenInDB', false))
		{
			$oUser = \Aurora\System\Api::getAuthenticatedUser();
			$aUserSessions = \Aurora\System\Api::GetUserSession()->GetUserSessionsFromDB($oUser->EntityId);
			foreach($aUserSessions as $oUserSession)
			{
				$aTokenInfo = \Aurora\System\Api::DecodeKeyValues($oUserSession->Token);

				if ($aTokenInfo !== false && isset($aTokenInfo['id']))
				{
					$aResult[] = [
						'LastUsageDateTime' => $oUserSession->LastUsageDateTime,
						'ExpireDateTime' => (int) isset($aTokenInfo['@expire']) ? $aTokenInfo['@expire'] : 0,
					];
				}
			}
		}
		return $aResult;
	}
	/***** public functions might be called with web API *****/
}
