<?php
/**
 * Remember that migration starts only for NEW WebMail v8 installation without any users
 * 1 - enter path to your WebMail v6 installation in $sP6ProductPath
 *  For example "C:/web/your-WebMail-v6-domain"
 * 2 - set $sPassword variable and run the script with arguments "user_list" & "pass" for creating file "user_list" in "data" directory
 * For example "http://your-webmail-v8-domain/dev/migrate.php?pass=12345&user_list"
 * 3 - check that "user_list" file was successfully created and contains list of users
 * 4 - set $sPassword variable and run the script with argument "pass" to start migration process
  */
  
$sPassword = "1";
$sP6ProductPath = "d:\\www\\p6\\";

$sP6ApiPath = $sP6ProductPath . '/libraries/afterlogic/api.php';
set_time_limit(0);
if (!file_exists($sP6ApiPath))
{
	exit("Wrong path for import");
}
if (!(isset($_GET['pass']) && $sPassword !== '' && $sPassword === $_GET['pass']))
{
	exit("Migration script password is incorrect or not set.");
}

require_once $sP6ApiPath;
include_once $sP6ProductPath.'calendar/db_query.php';		

require_once "../system/autoload.php";
\Aurora\System\Api::Init(true);

class P6ToP8Migration
{
	//Number of unsuccessful attempts after which user will be skipped
	const ATTEMPTS_MAX_NUMBER = 3;

	public $oP6Settings = false;
	public $oP8Settings = false;

	public $oP6ApiDomainsManager = null;
	public $oP6ApiUsersManager = null;
	public $oP6ApiContactsManager = null;

	public $oP8ContactsDecorator = null;
	public $oP8CoreDecorator = null;
	public $oP8MailModule = null;
	public $oP8MailModuleDecorator = null;
	public $oP8OAuthIntegratorWebclientModule = null;
	public $oP8CalendarModuleDecorator = null;

	public $sMigrationLogFile = null;
	public $sUserListFile = null;
	public $sMigratedUsersFile = null;
	public $sNotMigratedUsersFile = null;
	public $oMigrationLog = null;

	public $iUserCount = 0;
	public $bFindUser = false;
	public $bFindAccount = false;
	public $bFindIdentity = false;
	public $bFindContact = false;
	public $bFindGroupContact = false;
	public $bFindSocial = false;
	
	public $bFindCalendar = false;
	public $bFindEvent = false;
	
	public $sP6UserFiles = null;
	public $sP8UserFiles = null;

	/**
	 * @return PDO|false
	 */
	public static function GetPDO()
	{
		static $oPdoCache = null;
		if (null !== $oPdoCache)
		{
			return $oPdoCache;
		}

		$oSettings =& \CApi::GetSettings();

		$sDbPort = '';
		$sUnixSocket = '';

		$iDbType = $oSettings->GetConf('Common/DBType');
		$sDbHost = $oSettings->GetConf('Common/DBHost');
		$sDbName = $oSettings->GetConf('Common/DBName');
		$sDbLogin = $oSettings->GetConf('Common/DBLogin');
		$sDbPassword = $oSettings->GetConf('Common/DBPassword');

		$iPos = strpos($sDbHost, ':');
		if (false !== $iPos && 0 < $iPos)
		{
			$sAfter = substr($sDbHost, $iPos + 1);
			$sDbHost = substr($sDbHost, 0, $iPos);

			if (is_numeric($sAfter))
			{
				$sDbPort = $sAfter;
			}
			else
			{
				$sUnixSocket = $sAfter;
			}
		}

		$oPdo = false;
		if (class_exists('PDO'))
		{
			try
			{
				$oPdo = @new \PDO(('mysql').':dbname='.$sDbName.
					(empty($sDbHost) ? '' : ';host='.$sDbHost).
					(empty($sDbPort) ? '' : ';port='.$sDbPort).
					(empty($sUnixSocket) ? '' : ';unix_socket='.$sUnixSocket), $sDbLogin, $sDbPassword);

				if ($oPdo)
				{
					$oPdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
				}
			}
			catch (Exception $oException)
			{
				\CApi::Log($oException->getMessage(), \ELogLevel::Error);
				\CApi::Log($oException->getTraceAsString(), \ELogLevel::Error);
				$oPdo = false;
			}
		}
		else
		{
			\CApi::Log('Class PDO dosn\'t exist', \ELogLevel::Error);
		}

		if (false !== $oPdo)
		{
			$oPdoCache = $oPdo;
		}

		return $oPdo;
	}

	public function Init()
	{
		$this->oP6Settings = \CApi::GetSettings();

		$this->oP8Settings = \Aurora\System\Api::GetSettings();

		/* @var $oP6ApiDomainsManager CApiDomainsManager */
		$this->oP6ApiDomainsManager = \CApi::Manager('domains');
		/* @var $oP6ApiUsersManager CApiUsersManager */
		$this->oP6ApiUsersManager = \CApi::Manager('users');
		/* @var $P6ApiContacts CApiContactsManager */
		$this->oP6ApiContactsManager = \CApi::Manager('contacts');

		$this->oP8ContactsDecorator = \Aurora\System\Api::GetModuleDecorator('Contacts');
		$this->oP8CoreDecorator = \Aurora\System\Api::GetModuleDecorator('Core');
		$oP8MailModule = \Aurora\System\Api::GetModule("Mail");
		$this->oP8MailModule = $oP8MailModule;
		$this->oP8MailModuleDecorator = $oP8MailModule::Decorator();
		$this->oP8OAuthIntegratorWebclientModule = \Aurora\System\Api::GetModule("OAuthIntegratorWebclient");
		$this->oP8CalendarModuleDecorator = \Aurora\System\Api::GetModuleDecorator('Calendar');

		if (!$this->oP8MailModule instanceof Aurora\Modules\Mail\Module)
		{
			\Aurora\System\Api::Log("Error during initialisation process. Mail module not found", \Aurora\System\Enums\LogLevel::Full, 'migration-');
			exit("Error during initialisation process. For more detail see log-file.");
		}

		$this->sMigrationLogFile = \Aurora\System\Api::DataPath() . '/migration';
		if (file_exists($this->sMigrationLogFile))
		{
			$this->oMigrationLog = json_decode(@file_get_contents($this->sMigrationLogFile));
		}
		if (!$this->oP8OAuthIntegratorWebclientModule instanceof Aurora\Modules\OAuthIntegratorWebclient\Module)
		{
			\Aurora\System\Api::Log("Error during initialisation process. OAuthIntegratorWebclient module not found", \Aurora\System\Enums\LogLevel::Full, 'migration-');
			exit("Error during initialisation process. For more detail see log-file.");
		}

		if (!$this->oMigrationLog)
		{
			/**
			 * CurUserStatus
			 * -1 - not processed
			 * 0 - successfully migrated
			 * n > 0 - number of attempts
			 */
			$this->oMigrationLog = (object) [
				'CurUserEmail' => '',
				'CurUserStatus' => -1,
				'CurAccountId' => 0,
				'NewAccountId' => 0,
				'CurIdentitiesId' => 0,
				'NewIdentitiesId' => 0,
				'CurContactId' => 0,
				'CurGroupContactId' => 0,
				'UsersMigrated' => 0,
				'DomainsMigrated' => 0,
				'CurCalendarId' => 0,
				'CurEventId' => 0
			];
		}

		$this->sUserListFile = \Aurora\System\Api::DataPath() . "/user_list";
		$this->sMigratedUsersFile = \Aurora\System\Api::DataPath() . '/migrated-users';
		$this->sNotMigratedUsersFile = \Aurora\System\Api::DataPath() . '/not-migrated-users';

		$this->sP6UserFiles = \CApi::DataPath() . "/files/private";
		$this->sP8UserFiles = \Aurora\System\Api::DataPath() . "/files/private";
		if (!file_exists(\Aurora\System\Api::DataPath() . "/files") && !is_dir(\Aurora\System\Api::DataPath() . "/files"))
		{
			mkdir(\Aurora\System\Api::DataPath() . "/files");
		}
		if (!file_exists(\Aurora\System\Api::DataPath() . "/files/private") && !is_dir(\Aurora\System\Api::DataPath() . "/files/private"))
		{
			mkdir(\Aurora\System\Api::DataPath() . "/files/private");
		}
	}

	public function Start()
	{
		if ($this->oMigrationLog->UsersMigrated)
		{
			return true;
		}

		if ($this->oMigrationLog->CurUserEmail === '')
		{
			$this->Output("Start users migration");
			\Aurora\System\Api::Log("Start users migration", \Aurora\System\Enums\LogLevel::Full, 'migration-');
		}
		else
		{
			$this->Output("<pre>");
		}
		//USERS
		if (!file_exists($this->sUserListFile))
		{
			\Aurora\System\Api::Log("Error: User list not found in " . $this->sUserListFile, \Aurora\System\Enums\LogLevel::Full, 'migration-');
			exit("Error: User list not found in " . $this->sUserListFile);
		}

		$rUserListHandle = @fopen($this->sUserListFile, "r");
		if ($rUserListHandle)
		{
			$rMigratedUsersHandle = @fopen($this->sMigratedUsersFile, "a");
			if (!$rMigratedUsersHandle)
			{
				\Aurora\System\Api::Log("Error: can't write in " . $this->sMigratedUsersFile, \Aurora\System\Enums\LogLevel::Full, 'migration-');
				exit("Error: can't write in " . $this->sMigratedUsersFile);
			}

			while (($sP6UserEmail = @fgets($rUserListHandle)) !== false)
			{
				$sP6UserEmail = \trim($sP6UserEmail);
				if ($sP6UserEmail === '')
				{
					continue;
				}
				if (!$this->bFindUser && $this->oMigrationLog->CurUserEmail !== '' && $sP6UserEmail !== $this->oMigrationLog->CurUserEmail)
				{
					//skip User
					continue;
				}
				else if ($sP6UserEmail === $this->oMigrationLog->CurUserEmail && $this->oMigrationLog->CurUserStatus >= self::ATTEMPTS_MAX_NUMBER)
				{
					//add user to not-migrated-users files and skip
					$rNotMigratedUsersHandle = @fopen($this->sNotMigratedUsersFile, "a");
					if (!$rNotMigratedUsersHandle || !@fwrite($rNotMigratedUsersHandle, $sP6UserEmail . "\r\n"))
					{
						\Aurora\System\Api::Log("Error: can't write in " . $this->sNotMigratedUsersFile, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						exit("Error: can't write in " . $this->sNotMigratedUsersFile);
					}
					$this->bFindUser = true;
					$this->oMigrationLog->CurUserStatus = -1;
					continue;
				}
				else if ($sP6UserEmail === $this->oMigrationLog->CurUserEmail && $this->oMigrationLog->CurUserStatus === 0)
				{
					//skip User if successfully migrated
					$this->bFindUser = true;
					continue;
				}
				$this->Output("User: $sP6UserEmail");
				$this->bFindUser = true;
				//fix the beginning of migration
				$this->oMigrationLog->CurUserStatus = $this->oMigrationLog->CurUserStatus === -1 ? 1 : $this->oMigrationLog->CurUserStatus + 1;
				$this->oMigrationLog->CurUserEmail = $sP6UserEmail;
				file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));

				$oP6Account = $this->oP6ApiUsersManager->GetAccountOnLogin($sP6UserEmail);
				if (!$oP6Account instanceof \CAccount)
				{
					\Aurora\System\Api::Log("Account not found. " . $sP6UserEmail, \Aurora\System\Enums\LogLevel::Full, 'migration-');
					$this->Redirect();
				}

				if (!$oP6Account instanceof \CAccount)
				{
					\Aurora\System\Api::Log("Error: not found user:  " . $sP6UserEmail, \Aurora\System\Enums\LogLevel::Full, 'migration-');
					$this->Redirect();
				}
				$iP6UserId = $oP6Account->IdUser;

				$oP8User = $this->oP8CoreDecorator->GetUserByPublicId($sP6UserEmail);
				if ($oP8User instanceof \Aurora\Modules\Core\Classes\User)
				{
					\Aurora\System\Api::Log("User already exists: " . $sP6UserEmail, \Aurora\System\Enums\LogLevel::Full, 'migration-');
				}
				else
				{
					\Aurora\System\Api::Log("User: {$sP6UserEmail}. Start migration ", \Aurora\System\Enums\LogLevel::Full, 'migration-');
					$iNewUserId = $this->oP8CoreDecorator->CreateUser(0, $sP6UserEmail, \Aurora\System\Enums\UserRole::NormalUser, false);
					if (!$iNewUserId)
					{
						\Aurora\System\Api::Log("Error while User creation: " . $sP6UserEmail, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						$this->Redirect();
					}
					$oP8User = $this->oP8CoreDecorator->GetUserByUUID($iNewUserId);
					if (!$oP8User instanceof \Aurora\Modules\Core\Classes\User)
					{
						\Aurora\System\Api::Log("User not found: " . $sP6UserEmail, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						$this->Redirect();
					}

					$this->oMigrationLog->CurAccountId = 0;
					$this->oMigrationLog->NewAccountId = 0;
					$this->oMigrationLog->CurIdentitiesId = 0;
					$this->oMigrationLog->NewIdentitiesId = 0;
					$this->oMigrationLog->CurContactId = 0;
					$this->oMigrationLog->CurGroupContactId = 0;
					$this->oMigrationLog->CurCalendarId = 0;
					$this->oMigrationLog->CurEventId = 0;
					file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
				}
				if (!$this->UserP6ToP8($oP6Account, $oP8User))
				{
					\Aurora\System\Api::Log("Error while User settings creation: " . $sP6UserEmail, \Aurora\System\Enums\LogLevel::Full, 'migration-');
					$this->Redirect();
				}
				\Aurora\System\Api::Log("  Settings migrated successfully ", \Aurora\System\Enums\LogLevel::Full, 'migration-');
				//DOMAIN
				$sDomainName = $oP6Account->Domain->IdDomain === 0 ? $oP6Account->Domain->IncomingMailServer : $oP6Account->Domain->Name;
				$oP6DefaultDomain = $this->oP6ApiDomainsManager->getDefaultDomain();
				$oServer = $this->GetServerByName($sDomainName);
				$bServerOwnerIsAccount = $oP6Account->Domain->IdDomain === 0 &&
					($oP6Account->IncomingMailServer !== $oP6DefaultDomain->IncomingMailServer ||
					$oP6Account->OutgoingMailServer !== $oP6DefaultDomain->OutgoingMailServer);
				$oServer = $bServerOwnerIsAccount ? null : $oServer;
				if (!$oServer && !$bServerOwnerIsAccount)
				{
					$oP6Domain = $oP6Account->Domain->IdDomain === 0 ?
						$oP6DefaultDomain :
						$this->oP6ApiDomainsManager->getDomainById($oP6Account->Domain->IdDomain);
					$iServerId = $this->DomainP6ToP8($oP6Domain);
					if (!$iServerId)
					{
						\Aurora\System\Api::Log("Error while Server creation: " . $oP6Account->Domain->Name, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						$this->Redirect();
					}
					\Aurora\System\Api::Log("  Server {$oP6Account->Domain->Name} migrated successfully ", \Aurora\System\Enums\LogLevel::Full, 'migration-');
					$oServer = $this->oP8MailModuleDecorator->GetServer($iServerId);
					if (!$oServer instanceof \Aurora\Modules\Mail\Classes\Server)
					{
						\Aurora\System\Api::Log("Server not found. Server Id: " . $iServerId, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						$this->Redirect();
					}
					file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
				}
				//ACCOUNTS
				$aAccountsId = $this->oP6ApiUsersManager->GetUserIdList($iP6UserId);
				\Aurora\System\Api::Log("  Accounts IDs: " . implode(', ', $aAccountsId), \Aurora\System\Enums\LogLevel::Full, 'migration-');
				foreach ($aAccountsId as $iP6AccountId)
				{
					if (!$this->bFindAccount && $this->oMigrationLog->CurAccountId !== 0 && $iP6AccountId < $this->oMigrationLog->CurAccountId)
					{
						//skip Account if already done
						\Aurora\System\Api::Log("Skip Account: " . $sP6UserEmail . " id " . $iP6AccountId, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						continue;
					}
					else
					{
						$this->bFindAccount = true;
					}
					if (!$this->AccountP6ToP8($iP6AccountId, $oP8User, $oServer))
					{
						\Aurora\System\Api::Log("Error while User accounts creation: " . $sP6UserEmail, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						$this->Redirect();
					}
				}

				//GROUP CONTACTS
				$aGroupContactListItems = $this->oP6ApiContactsManager->GetGroupItems($iP6UserId);
				if (count($aGroupContactListItems) === 0)
				{
					$this->oMigrationLog->CurGroupContactId = 0;
					file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
				}
				foreach ($aGroupContactListItems as $oGroupListItem)
				{
					if (!$this->bFindGroupContact && $this->oMigrationLog->CurGroupContactId !== 0 && $oGroupListItem->Id !== $this->oMigrationLog->CurGroupContactId)
					{
						//skip GroupContact if already done
						\Aurora\System\Api::Log("Skip Group contact " . $oGroupListItem->Id, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						continue;
					}
					else if (!$this->bFindGroupContact && $this->oMigrationLog->CurGroupContactId !== 0)
					{
						$this->bFindGroupContact = true;
						continue;
					}
					$this->bFindGroupContact = true;
					$oGroup = $this->oP6ApiContactsManager->getGroupById($iP6UserId, $oGroupListItem->Id);
					$iContactsCount = $this->oP6ApiContactsManager->getContactItemsCount($iP6UserId, '', '', $oGroup->IdGroup);
					$aContacts = $this->oP6ApiContactsManager->getContactItems($iP6UserId, \EContactSortField::EMail, \ESortOrder::ASC, 0, $iContactsCount, '', '', $oGroup->IdGroup);
					$sP8GroupContactUUID = $this->GroupContactP6ToP8($oGroup, $oP8User, $aContacts);
					if (!$sP8GroupContactUUID)
					{
						\Aurora\System\Api::Log("Error while Group contact creation: " . $oGroup->Name, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						$this->Redirect();
					}
					else
					{
						$this->oMigrationLog->CurGroupContactId = $sP8GroupContactUUID;
						file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
					}
				}
				//CONTACTS
				/* @var $aContactListItems array */
				$aContactListItems = $this->oP6ApiContactsManager->getContactItemsWithoutOrder($iP6UserId, 0, 9999);
				if (count($aContactListItems) === 0)
				{
					$this->oMigrationLog->CurContactId = 0;
					file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
				}
				$iContactsCount = 0;
				/* @var $oListItem CContactListItem */
				foreach ($aContactListItems as $oListItem)
				{
					if (!$this->bFindContact && $this->oMigrationLog->CurContactId !== 0 && $oListItem->Id !== $this->oMigrationLog->CurContactId)
					{
						//skip Contact if already done
						\Aurora\System\Api::Log("Skip contact " . $oListItem->Id, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						continue;
					}
					else if (!$this->bFindContact && $this->oMigrationLog->CurContactId !== 0)
					{
						$this->bFindContact = true;
						continue;
					}
					$this->bFindContact = true;
					if (!$this->ContactP6ToP8($iP6UserId, $oListItem->Id, $oP8User))
					{
						\Aurora\System\Api::Log("Error while Contact creation: " . $oListItem->Id, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						$this->Redirect();
					}
					else
					{
						$iContactsCount++;
					}
				}

				//CALENDARS
				$this->CalendarsP6ToP8($iP6UserId, $oP8User);

				//add user to migrated-users file
				if(!@fwrite($rMigratedUsersHandle, $sP6UserEmail . "\r\n"))
				{
					\Aurora\System\Api::Log("Error: can't write in " . $this->sMigratedUsersFile, \Aurora\System\Enums\LogLevel::Full, 'migration-');
					exit("Error: can't write in " . $this->sMigratedUsersFile);
				}
				\Aurora\System\Api::Log("User: $sP6UserEmail Processed " . $iContactsCount . " contacts from " . count($aContactListItems), \Aurora\System\Enums\LogLevel::Full, 'migration-');
				$this->oMigrationLog->CurUserStatus = 0;
				file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
				$this->Output("Processed " . $iContactsCount . " contacts from " . count($aContactListItems));
				$this->Redirect();
			}
			fclose($rUserListHandle);
		}
		\Aurora\System\Api::Log("Users were migrated.", \Aurora\System\Enums\LogLevel::Full, 'migration-');
		$this->Output("Users were migrated");
		$this->oMigrationLog->UsersMigrated = 1;
		file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
	}

	public function UserP6ToP8(\CAccount $oP6Account, \Aurora\Modules\Core\Classes\User $oP8User)
	{	
		$oP8User->IsDisabled = $oP6Account ? $oP6Account->IsDisabled : false;

		//Common settings
		$oP8User->Language = $oP6Account->User->DefaultLanguage;
		$oP8User->{'CoreWebclient::AutoRefreshIntervalMinutes'} = $oP6Account->User->AutoCheckMailInterval;
		$oP8User->TimeFormat = $oP6Account->User->DefaultTimeFormat;
		$oP8User->DateFormat =$oP6Account->User->DefaultDateFormat;

		$oP8User->{'MailWebclient::MailsPerPage'} =$oP6Account->User->MailsPerPage;

		$oP8User->{'Contacts::ContactsPerPage'} = $oP6Account->User->ContactsPerPage;

		//Calendar
		$oP8User->{'Calendar::WorkdayStarts'} = $oP6Account->Domain->CalendarWorkdayStarts;
		$oP8User->{'Calendar::WorkdayEnds'} = $oP6Account->Domain->CalendarWorkdayEnds;
		$oP8User->{'Calendar::WeekStartsOn'} = $oP6Account->Domain->CalendarWeekStartsOn;
		$oP8User->{'Calendar::DefaultTab'} =  $oP6Account->Domain->CalendarDefaultTab;

		//Other
		$oP8User->Question1 = $oP6Account->User->Question1;
		$oP8User->Question2 = $oP6Account->User->Question2;
		$oP8User->Answer1 = $oP6Account->User->Answer1;
		$oP8User->Answer2 = $oP6Account->User->Answer2;
		$oP8User->CustomFields = $oP6Account->CustomFields;
		return $this->oP8CoreDecorator->UpdateUserObject($oP8User);
	}

	public function AccountP6ToP8($iP6AccountId, \Aurora\Modules\Core\Classes\User $oP8User, $oServer)
	{
		$bResult = false;
		$oP6Account = $this->oP6ApiUsersManager->getAccountById($iP6AccountId);
		\Aurora\System\Api::Log("  Start migrate account: " . $iP6AccountId . ' | ' . $oP6Account->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
		if (!$oP6Account instanceof \CAccount)
		{
			return false;
		}
		$aResults = $this->oP8MailModule->getAccountsManager()->oEavManager->getEntities(
			'Aurora\Modules\Mail\Classes\Account',
			[],
			0,
			0,
			[
				'Email' => $oP6Account->Email,
				'IdUser' => $oP8User->EntityId
			]
		);

		if (is_array($aResults) && isset($aResults[0]))
		{
			\Aurora\System\Api::Log("  Skip duplicate account " . $iP6AccountId . ' | ' . $oP6Account->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
			return true;
		}
		$oP6DefaultDomain = $this->oP6ApiDomainsManager->getDefaultDomain();
		$bServerOwnerIsAccount = $oP6Account->Domain->IdDomain === 0 &&
			($oP6Account->IncomingMailServer !== $oP6DefaultDomain->IncomingMailServer ||
			$oP6Account->OutgoingMailServer !== $oP6DefaultDomain->OutgoingMailServer);
		if (!$oServer || $bServerOwnerIsAccount)
		{
			$oP6Account->Domain->IncomingMailServer	= $oP6Account->IncomingMailServer;
			$oP6Account->Domain->IncomingMailPort		= $oP6Account->IncomingMailPort;
			$oP6Account->Domain->IncomingMailUseSSL	= $oP6Account->IncomingMailUseSSL;

			$oP6Account->Domain->OutgoingMailServer	= $oP6Account->OutgoingMailServer;
			$oP6Account->Domain->OutgoingMailPort		= $oP6Account->OutgoingMailPort;
			$oP6Account->Domain->OutgoingMailUseSSL	= $oP6Account->OutgoingMailUseSSL;
			$oP6Account->Domain->OutgoingMailAuth		= $oP6Account->OutgoingMailAuth;

			$iServerId = $this->DomainP6ToP8(
				$oP6Account->Domain,
				$bServerOwnerIsAccount ? \Aurora\Modules\Mail\Enums\ServerOwnerType::Account : \Aurora\Modules\Mail\Enums\ServerOwnerType::SuperAdmin
			);
			if (!$iServerId)
			{
				\Aurora\System\Api::Log("Error while Server creation: " . $oP6Account->Domain->IncomingMailServer, \Aurora\System\Enums\LogLevel::Full, 'migration-');
				$this->Redirect();
			}
			else
			{
				\Aurora\System\Api::Log("  Server {$oP6Account->Domain->Name} migrated successfully ", \Aurora\System\Enums\LogLevel::Full, 'migration-');
			}
			$oServer = $this->oP8MailModuleDecorator->GetServer($iServerId);
		}

		$aServer = ['ServerId' => $oServer->EntityId];

		if ($this->oMigrationLog->CurAccountId === $iP6AccountId)
		{
			$oP8Account = $this->oP8MailModule->getAccountsManager()->getAccountById($this->oMigrationLog->NewAccountId);
			\Aurora\System\Api::Log("  Account already exists." . $oP8Account->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
		}
		else
		{
			$oP8Account = $this->oP8MailModuleDecorator->CreateAccount(
				$oP8User->EntityId,
				$oP6Account->FriendlyName,
				$oP6Account->Email,
				$oP6Account->IncomingMailLogin,
				$oP6Account->IncomingMailPassword,
				$aServer
			);
			$this->oMigrationLog->CurIdentitiesId = 0;
			$this->oMigrationLog->NewIdentitiesId = 0;
			if ($oP8Account)
			{
				\Aurora\System\Api::Log("  Account created successfully. Account: " . $oP8Account->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
			}
			else
			{
				\Aurora\System\Api::Log("  Error. Account not created: " . $oP6Account->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
			}
		}

		if ($oP8Account)
		{
			$sFolderOrders = '';
/*			$aFolderOrders = $this->oP6ApiMail->getFoldersOrder($oP6Account);
			if (is_array($aFolderOrders) && count($aFolderOrders) > 0)
			{
				$sFolderOrders = json_encode($aFolderOrders);
			}
*/
			$oP8Account->IsDisabled = $oP6Account->IsDisabled;
			$oP8Account->UseToAuthorize = !$oP6Account->IsInternal;
			$oP8Account->Signature = $oP6Account->Signature;
			$oP8Account->UseSignature = $oP6Account->SignatureOptions;
			$oP8Account->UseThreading = $oServer->EnableThreading;
			$oP8Account->FoldersOrder = $sFolderOrders;
//			$oP8Account->SaveRepliesToCurrFolder = $oP6Account->User->SaveRepliedMessagesToCurrentFolder;

			$bResult = $this->oP8MailModule->getAccountsManager()->updateAccount($oP8Account);
			//System folders mapping
			// $aSystemFoldersNames = $this->oP6ApiMail->getSystemFolderNames($oP6Account);
			// if (is_array($aSystemFoldersNames) && count($aSystemFoldersNames) > 0)
			// {
			// 	$Sent = array_search(\EFolderType::Sent, $aSystemFoldersNames);
			// 	$Drafts = array_search(\EFolderType::Drafts, $aSystemFoldersNames);
			// 	$Trash = array_search(\EFolderType::Trash, $aSystemFoldersNames);
			// 	$Spam = array_search(\EFolderType::Spam, $aSystemFoldersNames);
			// 	if (!$this->oP8MailModule->SetupSystemFolders($oP8Account->EntityId, $Sent, $Drafts, $Trash, $Spam))
			// 	{
			// 		\Aurora\System\Api::Log("Error while setup system folders: ", \Aurora\System\Enums\LogLevel::Full, 'migration-');
			// 	}
			// 	else
			// 	{
			// 		\Aurora\System\Api::Log("  System folders setup successfully. Account: " . $oP8Account->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
			// 	}
			// }

			$this->oMigrationLog->CurAccountId = $iP6AccountId;
			$this->oMigrationLog->NewAccountId = $oP8Account->EntityId;
			file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
		}
		if ($bResult)
		{
			$bResult = $this->IdentitiesP6ToP8($oP6Account, $oP8Account);
		}
		\Aurora\System\Api::Log("  End migrate account: " . $iP6AccountId . ' | ' . $oP6Account->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
		return $bResult;
	}

	public function IdentitiesP6ToP8($oP6Account, $oP8Account)
	{
		$bResult = false;
		$aAccountIdentities = $this->oP6ApiUsersManager->GetIdentities($oP6Account);
		if (is_array($aAccountIdentities) && count($aAccountIdentities) > 0)
		{
			\Aurora\System\Api::Log(" Start Identities migration. Account: " . $oP8Account->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
			foreach ($aAccountIdentities as $oP6Identity)
			{
				if (!$this->bFindIdentity && $this->oMigrationLog->CurIdentitiesId !== 0 && $oP6Identity->IdIdentity < $this->oMigrationLog->CurIdentitiesId)
				{
					//skip Identity if already done
					\Aurora\System\Api::Log("Skip Identity " . $oP6Identity->Id, \Aurora\System\Enums\LogLevel::Full, 'migration-');
					continue;
				}
				else
				{
					$this->bFindIdentity = true;
				}
				if ($oP6Identity instanceof \CIdentity)
				{
					if ($oP6Identity->IdIdentity === $this->oMigrationLog->CurIdentitiesId)
					{
						$iP8EntityId = $this->oMigrationLog->NewIdentitiesId;
					}
					else
					{
						$iP8EntityId = $this->oP8MailModuleDecorator->CreateIdentity(
							$oP8Account->IdUser,
							$oP8Account->EntityId,
							$oP6Identity->FriendlyName,
							$oP6Identity->Email
						);
						if ($oP6Identity->Default && $iP8EntityId)
						{
							$this->oP8MailModuleDecorator->UpdateIdentity(
								$oP8Account->IdUser,
								$oP8Account->EntityId,
								$iP8EntityId,
								$oP6Identity->FriendlyName,
								$oP6Identity->Email,
								true
							);
						}
					}
					if (!$iP8EntityId)
					{
						\Aurora\System\Api::Log("Error while Identity creation: " . $oP6Identity->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						return false;
					}
					else
					{
						\Aurora\System\Api::Log("  Account: " . $oP8Account->Email . " Identity {$oP6Identity->Email}|{$oP6Identity->FriendlyName} was migrated.", \Aurora\System\Enums\LogLevel::Full, 'migration-');
					}
					$this->oMigrationLog->CurIdentitiesId = $oP6Identity->IdIdentity;
					$this->oMigrationLog->NewIdentitiesId = $iP8EntityId;
					file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));

					if (isset($oP6Identity->UseSignature) && isset($oP6Identity->Signature))
					{
						$bResult = !!$this->oP8MailModule->getIdentitiesManager()->updateIdentitySignature($iP8EntityId, $oP6Identity->UseSignature, $oP6Identity->Signature);
						if (!$bResult)
						{
							\Aurora\System\Api::Log("Error while Signature creation: " . $oP6Identity->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
							return $bResult;
						}
						else
						{
							\Aurora\System\Api::Log("  Account: " . $oP8Account->Email . " Signature {$oP6Identity->Email}|{$oP6Identity->Signature} was migrated.", \Aurora\System\Enums\LogLevel::Full, 'migration-');
						}
					}
				}
			}
			\Aurora\System\Api::Log(" End Identities migration. Account: " . $oP8Account->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
		}
		else
		{
			$bResult = true;
		}
		return $bResult;
	}

	public function ContactP6ToP8($iP6UserId, $iP6ContactId, \Aurora\Modules\Core\Classes\User $oP8User)
	{
		$aResult = false;
		$aContactOptions = [];
		$aObgectFieldsConformity = [
			"PrimaryEmail" => "PrimaryEmail",
			"FullName" => "FullName",
			"FirstName" => "FirstName",
			"LastName" => "SurName",
			"NickName" => "NickName",
			"PersonalEmail" => "HomeEmail",
			"PersonalAddress" => "HomeStreet",
			"PersonalCity" => "HomeCity",
			"PersonalState" => "HomeState",
			"PersonalZip" => "HomeZip",
			"PersonalCountry" => "HomeCountry",
			"PersonalWeb" => "HomeWeb",
			"PersonalFax" => "HomeFax",
			"PersonalPhone" => "HomePhone",
			"PersonalMobile" => "HomeMobile",
			"BusinessEmail" => "BusinessEmail",
			"BusinessCompany" => "BusinessCompany",
			"BusinessJobTitle" => "BusinessJobTitle",
			"BusinessDepartment" => "BusinessDepartment",
			"BusinessOffice" => "BusinessOffice",
			"BusinessAddress" => "BusinessStreet",
			"BusinessCity" => "BusinessCity",
			"BusinessState" => "BusinessState",
			"BusinessZip" => "BusinessZip",
			"BusinessCountry" => "BusinessCountry",
			"BusinessFax" => "BusinessFax",
			"BusinessPhone" => "BusinessPhone",
			"BusinessWeb" => "BusinessWeb",
			"OtherEmail" => "OtherEmail",
			"Notes" => "Notes",
			"BirthDay" => "BirthdayDay",
			"BirthMonth" => "BirthdayMonth",
			"BirthYear" => "BirthdayYear"
		];

		$oP6Contact = $this->oP6ApiContactsManager->getContactById($iP6UserId, $iP6ContactId);
		if (!$oP6Contact instanceof \CContact)
		{
			return $aResult;
		}
		$aContactOptions["GroupUUIDs"] = [];
		foreach ($aObgectFieldsConformity as $sPropertyNameP8 => $sPropertyNameP6)
		{
			$aContactOptions[$sPropertyNameP8] = $oP6Contact->$sPropertyNameP6;
		}
		foreach ($oP6Contact->GroupsIds as $iGroupId)
		{
			$oP6Group = $this->oP6ApiContactsManager->getGroupById($iP6UserId, $iGroupId);
			if ($oP6Group)
			{
				$oP8Group = $this->oP8ContactsDecorator->GetGroupByName($oP6Group->Name, $oP8User->EntityId);
				if ($oP8Group instanceof \Aurora\Modules\Contacts\Classes\Group)
				{
					$aContactOptions["GroupUUIDs"][] = $oP8Group->UUID;
				}
			}
		}

		if ($this->oP8ContactsDecorator->CreateContact($aContactOptions, $oP8User->EntityId))
		{
			$this->oMigrationLog->CurContactId = $iP6ContactId;
			file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
			$aResult = true;
		}
		return $aResult;
	}

	public function GroupContactP6ToP8(\CGroup $oGroup, \Aurora\Modules\Core\Classes\User $oP8User)
	{
		$oP8NewGroup = [
			"UUID" => "",
			"Name" => $oGroup->Name,
			"IsOrganization" => (int) $oGroup->IsOrganization,
			"Email" => $oGroup->Email,
			"Country" => $oGroup->Country,
			"City" => $oGroup->City,
			"Company" => $oGroup->Company,
			"Fax" => $oGroup->Fax,
			"Phone" => $oGroup->Phone,
			"State" => $oGroup->State,
			"Street" => $oGroup->Street,
			"Web" => $oGroup->Web,
			"Zip" => $oGroup->Zip,
			"Contacts" => []
		];
		$oP8Group = $this->oP8ContactsDecorator->GetGroupByName($oGroup->Name, $oP8User->EntityId);
		if ($oP8Group instanceof \Aurora\Modules\Contacts\Classes\Group)
		{
			return true;
		}
		return $this->oP8ContactsDecorator->CreateGroup($oP8NewGroup, $oP8User->EntityId);
	}


	public function GetP8CalendarColor($iP6CalendarColor)
	{
		$calendar_color = "#ef9554";
		switch ($iP6CalendarColor) {
			case 1:
				$calendar_color = "#ef9554";
				break;
			case 2:
				$calendar_color = "#f58787";
				break;
			case 3:
				$calendar_color = "#6fd0ce";
				break;
			case 4:
				$calendar_color = "#90bbe0";
				break;
			case 5:
				$calendar_color = "#baa2f3";
				break;
			case 6:
				$calendar_color = "#f68bcd";
				break;
			case 7:
				$calendar_color = "#d987da";
				break;
			case 8:
				$calendar_color = "#4affb8";
				break;
			case 9:
				$calendar_color = "#9f9fff";
				break;
			case 10:
				$calendar_color = "#5cc9c9";
				break;
			case 11:
				$calendar_color = "#76cb76";
				break;
			case 12:
				$calendar_color = "#aec9c9";
				break;
			case 15:
				$calendar_color = "#797979";
				break;
			default:
				$calendar_color = "#ef9554";
				break;
		}
		
		return $calendar_color;
	}

	public function CalendarsP6ToP8($iP6UserId, $oP8User)
	{
		$this->Output("Start calendars migration");
		\Aurora\System\Api::Log("Start calendars migration", \Aurora\System\Enums\LogLevel::Full, 'migration-');

		// Get calendars
		$aP6ToP8Calendars = [];
		$sDbPrefix = \CApi::GetSettings()->GetConf('Common/DBPrefix');
		$aP6Calendars = \SQL::SelectCalendars($sDbPrefix, $iP6UserId);

		if (count($aP6Calendars) === 0)
		{
			$this->oMigrationLog->CurCalendarId = 0;
			file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
		}

		$iCalendarsCount = 0;
		if (is_array($aP6Calendars) && count($aP6Calendars) > 0)
		{
			$oP8User->DefaultTimeZone = 'UTC';
			$oP8User->saveAttribute('DefaultTimeZone');

			foreach ($aP6Calendars as $aP6Calendar)
			{
				if (!$this->bFindCalendar && $this->oMigrationLog->CurCalendarId !== 0 && (int) $aP6Calendar['calendar_id'] !== $this->oMigrationLog->CurCalendarId)
				{
					//skip Calendar if already done
					\Aurora\System\Api::Log("Skip calendar " . $aP6Calendar['calendar_id'], \Aurora\System\Enums\LogLevel::Full, 'migration-');
					continue;
				}
				else if (!$this->bFindCalendar && $this->oMigrationLog->CurCalendarId !== 0)
				{
					$this->bFindCalendar = true;
					continue;
				}
				$this->bFindCalendar = true;

				if (is_array($aP6Calendar))
				{
					$aP8Calendar = $this->oP8CalendarModuleDecorator->CreateCalendar(
						$oP8User->EntityId, 
						$aP6Calendar['calendar_name'], 
						$aP6Calendar['calendar_description'], 
						$this->GetP8CalendarColor((int) $aP6Calendar['calendar_color'])
					);

					if ($aP8Calendar)
					{
						$aP6ToP8Calendars[$aP6Calendar['calendar_id']] = $aP8Calendar['Id'];
						$this->oMigrationLog->CurCalendarId = (int) $aP6Calendar['calendar_id'];
						$iCalendarsCount++;						
					}
					else
					{
						\Aurora\System\Api::Log('Error while Calendar creation: ' . $aP6Calendar['calendar_id'], \Aurora\System\Enums\LogLevel::Full, 'migration-');
						$this->Redirect();
					}
				}
			}

			$sLogMessage = "  Processed " . $iCalendarsCount . " calendars from " . count($aP6Calendars);
			\Aurora\System\Api::Log($sLogMessage, \Aurora\System\Enums\LogLevel::Full, 'migration-');
			$this->Output($sLogMessage);

			$this->Output("Start events migration");
			\Aurora\System\Api::Log("Start events migration", \Aurora\System\Enums\LogLevel::Full, 'migration-');

			$aP6Events = \SQL::SelectEvents(
				$sDbPrefix, 
				date("Y-m-d H:i:s", 0), 
				date("Y-m-d H:i:s", time()), 
				$iP6UserId, 
				false, 
				null
			);

			$iEventsCount = 0;
			foreach ($aP6Events as $aP6Event)
			{
				if (!$this->bFindEvent && $this->oMigrationLog->CurEventId !== 0 && (int) $aP6Event['event_id'] !== $this->oMigrationLog->CurEventId)
				{
					//skip Event if already done
					\Aurora\System\Api::Log("Skip event " . $aP6Event['event_id'], \Aurora\System\Enums\LogLevel::Full, 'migration-');
					continue;
				}
				else if (!$this->bFindEvent && $this->oMigrationLog->CurEventId !== 0)
				{
					$this->bFindEvent = true;
					continue;
				}
				$this->bFindEvent = true;

				$aP8Event = $this->oP8CalendarModuleDecorator->CreateEvent(
					$oP8User->EntityId, 
					$aP6ToP8Calendars[$aP6Event['calendar_id']], 
					$aP6Event['event_name'], 
					$aP6Event['event_text'], 
					'', 
					strtotime($aP6Event['event_timefrom'] . ' GMT'), 
					strtotime($aP6Event['event_timetill'] . ' GMT'), 
					(bool) $aP6Event['event_allday'], 
					[], 
					[], 
					null, 
					null, 
					null
				);
				if ($aP8Event)
				{
					$this->oMigrationLog->CurEventId = $aP6Event['event_id'];
					$iEventsCount++;
				}
				else
				{
					\Aurora\System\Api::Log('Error while Event creation: ' . $aP6Event['event_id'], \Aurora\System\Enums\LogLevel::Full, 'migration-');
					$this->Redirect();
				}
			}
			$sLogMessage = "  Processed " . $iEventsCount . " events from " . count($aP6Events);
			\Aurora\System\Api::Log($sLogMessage, \Aurora\System\Enums\LogLevel::Full, 'migration-');
			$this->Output($sLogMessage);

			$oP8User->DefaultTimeZone = '';
			$oP8User->saveAttribute('DefaultTimeZone');

			file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
		}
	}

	public function GetServerByName($sServerName)
	{
		$aServers = $this->oP8MailModuleDecorator->GetServers();
		foreach ($aServers as $oServer)
		{
			if ($oServer->Name === $sServerName)
			{
				return $oServer;
			}
		}
		return false;
	}

	public function DomainP6ToP8(\CDomain $oDomain, $sOwnerType = \Aurora\Modules\Mail\Enums\ServerOwnerType::SuperAdmin)
	{
		$iSievePort = (int) \CApi::GetConf('sieve.config.port', 2000);
		$aSieveDomains = \CApi::GetConf('sieve.config.domains', array());
		$aSieveDomains = array_map('trim', $aSieveDomains);
		$aSieveDomains = array_map('strtolower', $aSieveDomains);
		$bSieveEnabled = \CApi::GetConf('sieve', false) && in_array($oDomain->IncomingMailServer, $aSieveDomains);

		$oServer = new \Aurora\Modules\Mail\Classes\Server(\Aurora\Modules\Mail\Module::GetName());
		$oServer->OwnerType = $sOwnerType;
		$oServer->TenantId = 0;
		$oServer->Name = $oDomain->IdDomain === 0 ? $oDomain->IncomingMailServer : $oDomain->Name;
		$oServer->IncomingServer = $oDomain->IncomingMailServer;
		$oServer->IncomingPort = $oDomain->IncomingMailPort;
		$oServer->IncomingUseSsl = $oDomain->IncomingMailUseSSL;
		$oServer->OutgoingServer = $oDomain->OutgoingMailServer;
		$oServer->OutgoingPort = $oDomain->OutgoingMailPort;
		$oServer->OutgoingUseSsl = $oDomain->OutgoingMailUseSSL;
		$oServer->SmtpAuthType = $oDomain->OutgoingMailAuth;
		$oServer->SmtpLogin = $oDomain->OutgoingMailLogin;
		$oServer->SmtpPassword = $oDomain->OutgoingMailPassword;
		$oServer->Domains = $oDomain->IdDomain === 0 ? '*' : $oDomain->Name;
		$oServer->UseFullEmailAddressAsLogin = $this->oP6Settings->GetConf('WebMail/UseLoginAsEmailAddress');

		$iServerId = $this->oP8MailModule->getServersManager()->createServer($oServer);
		return $iServerId ? $iServerId : false;
	}

	public function CreateUserList()
	{
		$sGetUserLIstQuery = "SELECT DISTINCT `email` FROM `" . \CApi::GetSettings()->GetConf('Common/DBPrefix') . "awm_accounts`
				WHERE `def_acct`=1
				ORDER BY `email`";
		$stmt = self::GetPDO()->prepare($sGetUserLIstQuery);
		$stmt->execute();
		$aUsers = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);


		file_put_contents($this->sUserListFile, implode("\r\n", $aUsers));
	}

	public function Redirect()
	{
		echo '<head>
			<meta http-equiv="refresh" content="1;URL=//' . $_SERVER['SERVER_NAME'] . $_SERVER['REQUEST_URI'] . '" />
			</head>';
		exit;
	}

	public function Output($sMessage)
	{
		echo  $sMessage . "";
		ob_flush();
		flush();
	}

	public function MigrateEmptyDomains()
	{
		if ($this->oMigrationLog->DomainsMigrated === 1)
		{
			$this->Output("Empty domains already migrated");
			\Aurora\System\Api::Log("Empty domains already migrated", \Aurora\System\Enums\LogLevel::Full, 'migration-');
			return true;
		}
		$this->Output("Migrate empty domains");
		\Aurora\System\Api::Log("Migrate empty domains", \Aurora\System\Enums\LogLevel::Full, 'migration-');
		$aDomains = $this->oP6ApiDomainsManager->getFullDomainsList();
		$aDomains[0] = array(false, 'Default'); // Default Domain

		foreach ($aDomains as $iDomainId => $oDomainItem)
		{
			$sDomainName = $oDomainItem[1];
			$oServer = $iDomainId !== 0 ? $this->GetServerByName($sDomainName) : false;

			if ($iDomainId !== 0 && !$oServer)
			{
				//create server if not exists and not default
				$iServerId = $this->DomainP6ToP8($this->oP6ApiDomainsManager->getDomainById($iDomainId));
				if (!$iServerId)
				{
					\Aurora\System\Api::Log("Error while Server creation: " . $sDomainName, \Aurora\System\Enums\LogLevel::Full, 'migration-');
					$this->Redirect();
				}
				$oServer = $this->oP8MailModuleDecorator->GetServer($iServerId);
				if (!$oServer instanceof \Aurora\Modules\Mail\Classes\Server)
				{
					\Aurora\System\Api::Log("Server not found. Server Id: " . $iServerId, \Aurora\System\Enums\LogLevel::Full, 'migration-');
					$this->Redirect();
				}
				$this->oMigrationLog->DomainsMigrated = 1;
				file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
			}
		}
		$this->Output("Empty domains migrated");
		\Aurora\System\Api::Log("Empty domains migrated", \Aurora\System\Enums\LogLevel::Full, 'migration-');
	}
}
ob_start();
$oMigration = new P6ToP8Migration();

if (isset($_GET["user_list"]))
{
	$oMigration->Init();
	$oMigration->CreateUserList();
}
else
{
	try
	{
		$oMigration->Init();
		if (!file_exists($oMigration->sUserListFile))
		{
			$oMigration->CreateUserList();
		}
		$oMigration->Start();
		$oMigration->MigrateEmptyDomains();
	}
	catch (Exception $e)
	{
		\Aurora\System\Api::Log("Exception: " . $e->getMessage() .
			"\nCode: " . $e->getCode() .
			"\nFile: " . $e->getFile() .
			"\nLine: " . $e->getLine() .
			"\n" . $e->getTraceAsString(), \Aurora\System\Enums\LogLevel::Full, 'migration-');
		$oMigration->Redirect();
	}
}
ob_end_flush();
exit("Done");
