<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\AdminPanelWebclient;

/**
 * Displays admin panel web interface.
 *
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Modules
 * @internal
 */
class Module extends \Aurora\System\Module\AbstractWebclientModule
{
	/**
	 * @deprecated since version 8.3.7
	 */
	public function TestDbConnection($DbLogin, $DbName, $DbHost, $DbPassword = null)
	{
		return \Aurora\Modules\Core\Module::Decorator()->TestDbConnection($DbLogin, $DbName, $DbHost, $DbPassword);
	}
	
	/**
	 * @deprecated since version 8.3.7
	 */
	public function CreateTables()
	{
		return \Aurora\Modules\Core\Module::Decorator()->CreateTables();
	}
	
	/**
	 * @deprecated since version 8.3.7
	 */
	public function GetEntityList($Type, $Offset = 0, $Limit = 0, $Search = '', $TenantId = 0, $Filters = [])
	{
		return \Aurora\Modules\Core\Module::Decorator()->GetEntityList($Type, $Offset, $Limit, $Search, $TenantId, $Filters);
	}
	
	/**
	 * @deprecated since version 8.3.7
	 */
	public function GetEntity($Type, $Id)
	{
		return \Aurora\Modules\Core\Module::Decorator()->GetEntity($Type, $Id);
	}
	
	/**
	 * @deprecated since version 8.3.7
	 */
	public function CreateTenant($ChannelId = 0, $Name = '', $Description = '', $WebDomain = '', $SiteName = null)
	{
		return \Aurora\Modules\Core\Module::Decorator()->CreateTenant($ChannelId, $Name, $Description, $WebDomain, $SiteName);
	}
	
	/**
	 * @deprecated since version 8.3.7
	 */
	public function CreateUser($TenantId = 0, $PublicId = '', $Role = \Aurora\System\Enums\UserRole::NormalUser, $WriteSeparateLog = false)
	{
		return \Aurora\Modules\Core\Module::Decorator()->CreateUser($TenantId, $PublicId, $Role, $WriteSeparateLog);
	}
	
	/**
	 * @deprecated since version 8.3.7
	 */
	public function UpdateEntity($Type, $Data)
	{
		switch ($Type)
		{
			case 'Tenant':
				$iId = isset($Data['Id']) ? $Data['Id'] : null;
				$sDescription = isset($Data['Description']) ? $Data['Description'] : null;
				$WebDomain = isset($Data['WebDomain']) ? $Data['WebDomain'] : null;
				$SiteName = isset($Data['SiteName']) ? $Data['SiteName'] : null;
				return \Aurora\Modules\Core\Module::Decorator()->UpdateTenant($iId, $sDescription, $WebDomain, $SiteName);
			case 'User':
				$iId = isset($Data['Id']) ? $Data['Id'] : null;
				$sPublicId = isset($Data['PublicId']) ? $Data['PublicId'] : null;
				$iTenantId = isset($Data['TenantId']) ? $Data['TenantId'] : null;
				$iRole = isset($Data['Role']) ? $Data['Role'] : null;
				$bWriteSeparateLog = isset($Data['WriteSeparateLog']) ? $Data['WriteSeparateLog'] : null;
				$iQuotaBytes = isset($Data['QuotaBytes']) ? $Data['QuotaBytes'] : null;
				$sPassword = isset($Data['Password']) ? $Data['Password'] : null;
				return \Aurora\Modules\Core\Module::Decorator()->UpdateUser($iId, $sPublicId, $iTenantId, $iRole, $bWriteSeparateLog, $iQuotaBytes, $sPassword);
		}
		return false;
	}
	
	/**
	 * @deprecated since version 8.3.7
	 */
	public function DeleteEntities($Type, $IdList)
	{
		$bResult = true;
		foreach ($IdList as $sId)
		{
			$bResult = $bResult && $this->DeleteEntity($Type, $sId);
		}
		return $bResult;
	}

	/**
	 * @deprecated since version 8.3.7
	 */
	public function DeleteEntity($Type, $Id)
	{
		switch ($Type)
		{
			case 'Tenant':
				return \Aurora\Modules\Core\Module::Decorator()->DeleteTenant($Id);
			case 'User':
				return \Aurora\Modules\Core\Module::Decorator()->DeleteUser($Id);
		}
		return false;
	}
	
	/**
	 * Obtains list of module settings for authenticated user.
	 * 
	 * @return array
	 */
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);
		
		
		$aTenants = [];
		
		try {
			// Settings should be obtainable even if db is not configured yet
			$aTenants = \Aurora\Modules\Core\Module::Decorator()->GetTenants(0, 0, '');
		}
		catch (\Exception $ex) {}
		
		return array(
			'EntitiesPerPage' => $this->getConfig('EntitiesPerPage', 20),
			'TabsOrder' => $this->getConfig('TabsOrder', ['licensing', 'admin-security', 'admin-db', 'logs-viewer', 'system', 'common', 'modules']),
			'EntitiesOrder' => $this->getConfig('EntitiesOrder', []),
			'Tenants' => $aTenants,
		);
	}
	
	/**
	 * @deprecated since version 8.3.7
	 */
	public function UpdateSettings(
			$DbLogin = null, $DbPassword = null, $DbName = null, $DbHost = null,
			$AdminLogin = null, $Password = null, $NewPassword = null, $AdminLanguage = null,
			$Language = null, $AutodetectLanguage = null, $TimeFormat = null, $DateFormat = null, $EnableLogging = null,
			$EnableEventLogging = null, $LoggingLevel = null
	)
	{
		return \Aurora\Modules\Core\Module::Decorator()->UpdateSettings(
			$DbLogin, $DbPassword, $DbName, $DbHost,
			$AdminLogin, $Password, $NewPassword, $AdminLanguage,
			$Language, $AutodetectLanguage, $TimeFormat, $DateFormat, $EnableLogging,
			$EnableEventLogging, $LoggingLevel
		);
	}

	/**
	 * @deprecated since version 8.3.7
	 */
	public function UpdateConfig()
	{
		return \Aurora\Modules\Core\Module::Decorator()->UpdateConfig();
	}
}
