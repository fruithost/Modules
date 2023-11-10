<?php
require_once "../system/autoload.php";

const ROWLIMIT = 1000;

if (php_sapi_name() !== 'cli')
{
	exit("Use console");
}
\Aurora\System\Db\Pdo\MySql::$bUseReconnect = true;
\Aurora\System\Api::Init(true);

$oP8PDO = \Aurora\System\Api::GetPDO();
if (!$oP8PDO instanceof \PDO)
{
	\Aurora\System\Api::Log("Error during connection to p8 DB.", \Aurora\System\Enums\LogLevel::Full, 'server-to-tenant-');
	exit("Error during connection to p8 DB.");
}
$oP8MailModule = \Aurora\System\Api::GetModule("Mail");
$oP8Core = \Aurora\System\Api::GetModule('Core');
$oEavManager = \Aurora\System\Managers\Eav::getInstance();

$aServers = $oP8MailModule::Decorator()->GetServers();
foreach ($aServers as $oServer)
{
	$sNewTenantName = $oServer->Name . "_" . $oServer->EntityId;
	$iNewTenantId = null;
	//check if tenant already exists
	$oTenant = @$oP8Core->getTenantsManager()->getTenantByName($sNewTenantName);
	if ($oTenant && isset($oTenant->EntityId))
	{
		$iNewTenantId = $oTenant->EntityId;
	}
	else
	{
		//create new Tenant
		$iNewTenantId = $oP8Core::Decorator()->CreateTenant(0, $sNewTenantName);
		if (!is_numeric($iNewTenantId))
		{
			\Aurora\System\Api::Log("Error while Tenant creation", \Aurora\System\Enums\LogLevel::Full, 'server-to-tenant-');
			exit("Error while Tenant creation");
		}
	}
	$oServer->TenantId = $iNewTenantId;
	$oEavManager->updateEntity($oServer);
	//get all account with ServerId === $oServer->EntityId
	$aGetAccountsResults = $oEavManager->getEntities(
		'Aurora\Modules\Mail\Classes\Account',
		[],
		0,
		0,
		[
			'ServerId' => $oServer->EntityId
		]
	);
	if (is_array($aGetAccountsResults))
	{
		foreach ($aGetAccountsResults as $oAccount)
		{
			$oUser = $oP8Core::Decorator()->GetUser($oAccount->IdUser);
			if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
			{
				$oUser->IdTenant = $iNewTenantId;
				$oEavManager->updateEntity($oUser);
				//get all user contacts
				$iOffset = 0;
				$iRowCount = $aGetContactsResults = $oEavManager->getEntitiesCount(
					'Aurora\Modules\Contacts\Classes\Contact',
					[
						'IdUser' => $oUser->EntityId
					]
				);
				while($iOffset < $iRowCount)
				{
					$aGetContactsResults = $oEavManager->getEntities(
						'Aurora\Modules\Contacts\Classes\Contact',
						[],
						$iOffset,
						ROWLIMIT,
						[
							'IdUser' => $oUser->EntityId
						]
					);
					$iOffset += ROWLIMIT;
					if (is_array($aGetContactsResults))
					{
						foreach ($aGetContactsResults as $oContact)
						{
							$oContact->IdTenant = $iNewTenantId;
							$oEavManager->updateEntity($oContact);
						}
					}
				}
			}
		}
	}
	\Aurora\System\Api::Log("Server {$oServer->Name} fixed.", \Aurora\System\Enums\LogLevel::Full, 'server-to-tenant-');
	echo "Server {$oServer->Name} fixed.\n";
}
exit("Done");
