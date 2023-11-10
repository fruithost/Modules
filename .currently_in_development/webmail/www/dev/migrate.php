<?php
/**
 * Remember that migration starts only for NEW WebMail v8 installation without any users
 * 1 - enter path to your WebMail v7 installation in $sP7ProductPath
 *  For example "C:/web/your-WebMail-v7-domain"
 * 2 - set $sPassword variable and run the script with arguments "user_list" & "pass" for creating file "user_list" in "data" directory
 * For example "http://your-webmail-v8-domain/dev/migrate.php?pass=12345&user_list"
 * 3 - check that "user_list" file was successfully created and contains list of users
 * 4 - set $sPassword variable and run the script with argument "pass" to start migration process
 * 5 - The migration process is described in detail at:
 * https://afterlogic.com/docs/webmail-pro-8/installation/migration-from-v7
 */
$sPassword = "";
$sP7ProductPath = "PATH_TO_YOUR_WEBMAIL_V7_INSTALLATION";

$sP7ApiPath = $sP7ProductPath . '/libraries/afterlogic/api.php';
set_time_limit(0);
if (!file_exists($sP7ApiPath))
{
	exit("Wrong path for import");
}
if (!(isset($_GET['pass']) && $sPassword !== '' && $sPassword === $_GET['pass']))
{
	exit("Migration script password is incorrect or not set.");
}

require_once $sP7ApiPath;
require_once "../system/autoload.php";
\Aurora\System\Api::Init(true);

class P7ToP8Migration
{
	//Number of unsuccessful attempts after which user will be skipped
	const ATTEMPTS_MAX_NUMBER = 3;

	public $oP7Settings = false;
	public $oP7PDO = false;
	public $oP8PDO = false;
	public $oP8Settings = false;

	public $oP7ApiDomainsManager = null;
	public $oP7ApiUsersManager = null;
	public $oP7ApiContactsManagerFrom = null;
	public $oP7ApiContactsManager = null;
	public $oP7ApiSocial = null;

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

	public $sP7UserFiles = null;
	public $sP8UserFiles = null;

	public function Init()
	{
		$this->oP7Settings = \CApi::GetSettings();
		$this->oP7PDO = \CApi::GetPDO();
		if (!$this->oP7PDO instanceof PDO)
		{
			\Aurora\System\Api::Log("Error during connection to p7 DB.", \Aurora\System\Enums\LogLevel::Full, 'migration-');
			exit("Error during connection to p7 DB.");
		}
		$this->oP8PDO = \Aurora\System\Api::GetPDO();
		if (!$this->oP8PDO instanceof \PDO)
		{
			\Aurora\System\Api::Log("Error during connection to p8 DB.", \Aurora\System\Enums\LogLevel::Full, 'migration-');
			exit("Error during connection to 8 DB.");
		}
		$this->oP8Settings = \Aurora\System\Api::GetSettings();

		/* @var $oP7ApiDomainsManager CApiDomainsManager */
		$this->oP7ApiDomainsManager = \CApi::Manager('domains');
		/* @var $oP7ApiUsersManager CApiUsersManager */
		$this->oP7ApiUsersManager = \CApi::Manager('users');
		/* @var $oP7ApiContactsManagerFrom CApiContactsManager */
		$this->oP7ApiContactsManagerFrom = \CApi::Manager('contactsmain', 'db');
		/* @var $P7ApiContacts CApiContactsManager */
		$this->oP7ApiContactsManager = \CApi::Manager('contacts');
		/* @var $oP7ApiSocial \CApiSocialManager */
		$this->oP7ApiSocial = \CApi::Manager('social');
		/* @var $oP7ApiMail \CApiMailManager */
		$this->oP7ApiMail = \CApi::Manager('mail');

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
				'DBUpgraded' => 0,
				'CurUserEmail' => '',
				'CurUserStatus' => -1,
				'CurAccountId' => 0,
				'NewAccountId' => 0,
				'CurIdentitiesId' => 0,
				'NewIdentitiesId' => 0,
				'CurContactId' => 0,
				'CurGroupContactId' => 0,
				'CurSocialAccountId' => 0,
				'NewSocialAccountId' => 0,
				'UsersMigrated' => 0,
				'DomainsMigrated' => 0,
				'FilesMigrated' => 0,
				'SharedCalendarsStatus' => 0
			];
		}

		$this->sUserListFile = \Aurora\System\Api::DataPath() . "/user_list";
		$this->sMigratedUsersFile = \Aurora\System\Api::DataPath() . '/migrated-users';
		$this->sNotMigratedUsersFile = \Aurora\System\Api::DataPath() . '/not-migrated-users';

		$this->sP7UserFiles = \CApi::DataPath() . "/files/private";
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
		if (!$this->oMigrationLog->DBUpgraded)
		{
			if (!$this->UpgradeDB())
			{
				exit("Error during migration process. For more detail see log-file.");
			}
			$this->oMigrationLog->DBUpgraded = 1;
			file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
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

			while (($sP7UserEmail = @fgets($rUserListHandle)) !== false)
			{
				$sP7UserEmail = \trim($sP7UserEmail);
				if ($sP7UserEmail === '')
				{
					continue;
				}
				if (!$this->bFindUser && $this->oMigrationLog->CurUserEmail !== '' && $sP7UserEmail !== $this->oMigrationLog->CurUserEmail)
				{
					//skip User
					continue;
				}
				else if ($sP7UserEmail === $this->oMigrationLog->CurUserEmail && $this->oMigrationLog->CurUserStatus >= self::ATTEMPTS_MAX_NUMBER)
				{
					//add user to not-migrated-users files and skip
					$rNotMigratedUsersHandle = @fopen($this->sNotMigratedUsersFile, "a");
					if (!$rNotMigratedUsersHandle || !@fwrite($rNotMigratedUsersHandle, $sP7UserEmail . "\r\n"))
					{
						\Aurora\System\Api::Log("Error: can't write in " . $this->sNotMigratedUsersFile, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						exit("Error: can't write in " . $this->sNotMigratedUsersFile);
					}
					$this->bFindUser = true;
					$this->oMigrationLog->CurUserStatus = -1;
					continue;
				}
				else if ($sP7UserEmail === $this->oMigrationLog->CurUserEmail && $this->oMigrationLog->CurUserStatus === 0)
				{
					//skip User if successfully migrated
					$this->bFindUser = true;
					continue;
				}
				$this->Output("User: $sP7UserEmail");
				$this->bFindUser = true;
				//fix the beginning of migration
				$this->oMigrationLog->CurUserStatus = $this->oMigrationLog->CurUserStatus === -1 ? 1 : $this->oMigrationLog->CurUserStatus + 1;
				$this->oMigrationLog->CurUserEmail = $sP7UserEmail;
				file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));

				$oP7Account = $this->oP7ApiUsersManager->getAccountByEmail($sP7UserEmail);
				if (!$oP7Account instanceof \CAccount)
				{
					\Aurora\System\Api::Log("Account not found. " . $sP7UserEmail, \Aurora\System\Enums\LogLevel::Full, 'migration-');
					$this->Redirect();
				}

				if (!$oP7Account instanceof \CAccount)
				{
					\Aurora\System\Api::Log("Error: not found user:  " . $sP7UserEmail, \Aurora\System\Enums\LogLevel::Full, 'migration-');
					$this->Redirect();
				}
				$iP7UserId = $oP7Account->IdUser;
				$oP8User = $this->oP8CoreDecorator->GetUserByPublicId($sP7UserEmail);
				if ($oP8User instanceof \Aurora\Modules\Core\Classes\User)
				{
					\Aurora\System\Api::Log("User already exists: " . $sP7UserEmail, \Aurora\System\Enums\LogLevel::Full, 'migration-');
				}
				else
				{
					\Aurora\System\Api::Log("User: {$sP7UserEmail}. Start migration ", \Aurora\System\Enums\LogLevel::Full, 'migration-');
					$iNewUserId = $this->oP8CoreDecorator->CreateUser(0, $sP7UserEmail, \Aurora\System\Enums\UserRole::NormalUser, false);
					if (!$iNewUserId)
					{
						\Aurora\System\Api::Log("Error while User creation: " . $sP7UserEmail, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						$this->Redirect();
					}
					$oP8User = $this->oP8CoreDecorator->GetUserByUUID($iNewUserId);
					if (!$oP8User instanceof \Aurora\Modules\Core\Classes\User)
					{
						\Aurora\System\Api::Log("User not found: " . $sP7UserEmail, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						$this->Redirect();
					}

					$this->oMigrationLog->CurAccountId = 0;
					$this->oMigrationLog->NewAccountId = 0;
					$this->oMigrationLog->CurIdentitiesId = 0;
					$this->oMigrationLog->NewIdentitiesId = 0;
					$this->oMigrationLog->CurSocialAccountId = 0;
					$this->oMigrationLog->NewSocialAccountId = 0;
					$this->oMigrationLog->CurContactId = 0;
					$this->oMigrationLog->CurGroupContactId = 0;
					file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
				}
				if (!$this->UserP7ToP8($oP7Account, $oP8User))
				{
					\Aurora\System\Api::Log("Error while User settings creation: " . $sP7UserEmail, \Aurora\System\Enums\LogLevel::Full, 'migration-');
					$this->Redirect();
				}
				\Aurora\System\Api::Log("  Settings migrated successfully ", \Aurora\System\Enums\LogLevel::Full, 'migration-');
				//DOMAIN
				$sDomainName = $oP7Account->Domain->IdDomain === 0 ? $oP7Account->Domain->IncomingMailServer : $oP7Account->Domain->Name;
				$oP7DefaultDomain = $this->oP7ApiDomainsManager->getDefaultDomain();
				$oServer = $this->GetServerByName($sDomainName);
				$bServerOwnerIsAccount = $oP7Account->Domain->IdDomain === 0 &&
					($oP7Account->IncomingMailServer !== $oP7DefaultDomain->IncomingMailServer ||
					$oP7Account->OutgoingMailServer !== $oP7DefaultDomain->OutgoingMailServer);
				$oServer = $bServerOwnerIsAccount ? null : $oServer;
				if (!$oServer && !$bServerOwnerIsAccount)
				{
					$oP7Domain = $oP7Account->Domain->IdDomain === 0 ?
						$oP7DefaultDomain :
						$this->oP7ApiDomainsManager->getDomainById($oP7Account->Domain->IdDomain);
					$iServerId = $this->DomainP7ToP8($oP7Domain);
					if (!$iServerId)
					{
						\Aurora\System\Api::Log("Error while Server creation: " . $oP7Account->Domain->Name, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						$this->Redirect();
					}
					\Aurora\System\Api::Log("  Server {$oP7Account->Domain->Name} migrated successfully ", \Aurora\System\Enums\LogLevel::Full, 'migration-');
					$oServer = $this->oP8MailModuleDecorator->GetServer($iServerId);
					if (!$oServer instanceof \Aurora\Modules\Mail\Classes\Server)
					{
						\Aurora\System\Api::Log("Server not found. Server Id: " . $iServerId, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						$this->Redirect();
					}
					file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
				}
				//ACCOUNTS
				$aAccounts = $this->oP7ApiUsersManager->getUserAccounts($iP7UserId);
				$aAccountsId = array_keys($aAccounts);
				\Aurora\System\Api::Log("  Accounts IDs: " . implode(', ', $aAccountsId), \Aurora\System\Enums\LogLevel::Full, 'migration-');
				foreach ($aAccountsId as $iP7AccountId)
				{
					if (!$this->bFindAccount && $this->oMigrationLog->CurAccountId !== 0 && $iP7AccountId < $this->oMigrationLog->CurAccountId)
					{
						//skip Account if already done
						\Aurora\System\Api::Log("Skip Account: " . $sP7UserEmail . " id " . $iP7AccountId, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						continue;
					}
					else
					{
						$this->bFindAccount = true;
					}
					if (!$this->AccountP7ToP8($iP7AccountId, $oP8User, $oServer))
					{
						\Aurora\System\Api::Log("Error while User accounts creation: " . $sP7UserEmail, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						$this->Redirect();
					}
					//SOCIAL ACCOUNTS
					if (!$this->SocialAccountsP7ToP8($iP7AccountId, $oP8User))
					{
						\Aurora\System\Api::Log("Error while User social accounts creation: " . $sP7UserEmail, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						$this->Redirect();
					}
				}

				//GROUP CONTACTS
				$aGroupContactListItems = $this->oP7ApiContactsManagerFrom->getGroupItems($iP7UserId);
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
					$oGroup = $this->oP7ApiContactsManagerFrom->getGroupById($iP7UserId, $oGroupListItem->Id);
					$iContactsCount = $this->oP7ApiContactsManagerFrom->getContactItemsCount($iP7UserId, '', '', $oGroup->IdGroup);
					$aContacts = $this->oP7ApiContactsManagerFrom->getContactItems($iP7UserId, \EContactSortField::EMail, \ESortOrder::ASC, 0, $iContactsCount, '', '', $oGroup->IdGroup);
					$sP8GroupContactUUID = $this->GroupContactP7ToP8($oGroup, $oP8User, $aContacts);
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
				$aContactListItems = $this->oP7ApiContactsManagerFrom->getContactItemsWithoutOrder($iP7UserId, 0, 9999);
				$iTotalContacsCount = count($aContactListItems);
				if ($iTotalContacsCount === 0)
				{
					$this->oMigrationLog->CurContactId = 0;
					file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
				}
				$iContactsCount = 0;
				$iSkipContactsCount = 0;
				/* @var $oListItem CContactListItem */
				foreach ($aContactListItems as $oListItem)
				{
					if (!$this->bFindContact && $this->oMigrationLog->CurContactId !== 0 && $oListItem->Id !== $this->oMigrationLog->CurContactId)
					{
						//skip Contact if already done
						\Aurora\System\Api::Log("Skip contact " . $oListItem->Id, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						$iSkipContactsCount++;
						continue;
					}
					else if (!$this->bFindContact && $this->oMigrationLog->CurContactId !== 0)
					{
						\Aurora\System\Api::Log("Skip contact " . $oListItem->Id, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						$iSkipContactsCount++;
						$this->bFindContact = true;
						continue;
					}
					$this->bFindContact = true;
					if (!$this->ContactP7ToP8($oListItem->IdUser, $oListItem->Id, $oP8User))
					{
						\Aurora\System\Api::Log("Error while Contact creation: " . $oListItem->Id, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						$this->Redirect();
					}
					else
					{
						$iContactsCount++;
						\Aurora\System\Api::Log("	Contact migrated " . $oListItem->Id, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						if ($iContactsCount >= 100 && ($iContactsCount + $iSkipContactsCount) < $iTotalContacsCount)
						{
							$sMessage = "	Processed " . ($iContactsCount + $iSkipContactsCount) . " contacts from " . $iTotalContacsCount;
							$this->Output($sMessage);
							\Aurora\System\Api::Log($sMessage, \Aurora\System\Enums\LogLevel::Full, 'migration-');
							if ($this->oMigrationLog->CurUserStatus > 1)
							{
								$this->oMigrationLog->CurUserStatus--;
								file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
							}
							\Aurora\System\Api::Log('	CurUserStatus ' . $this->oMigrationLog->CurUserStatus, \Aurora\System\Enums\LogLevel::Full, 'migration-');
							$this->Redirect();
						}
					}
				}
				//FILES
				$sTargetPath = $this->sP7UserFiles . "/" . $sP7UserEmail;
				if ($sP7UserEmail !== '' && is_dir($sTargetPath))
				{
					\Aurora\System\Api::Log("	Started copying user files for " . $sP7UserEmail, \Aurora\System\Enums\LogLevel::Full, 'migration-');
					$sDestinationPath = $this->sP8UserFiles . "/" . $oP8User->UUID;
					$this->CopyDir($sTargetPath, $sDestinationPath);
					\Aurora\System\Api::Log("	File copying complete", \Aurora\System\Enums\LogLevel::Full, 'migration-');
				}

				//add user to migrated-users file
				if(!@fwrite($rMigratedUsersHandle, $sP7UserEmail . "\r\n"))
				{
					\Aurora\System\Api::Log("Error: can't write in " . $this->sMigratedUsersFile, \Aurora\System\Enums\LogLevel::Full, 'migration-');
					exit("Error: can't write in " . $this->sMigratedUsersFile);
				}
				\Aurora\System\Api::Log("User: $sP7UserEmail Processed " . ($iContactsCount + $iSkipContactsCount) . " contacts from " . $iTotalContacsCount, \Aurora\System\Enums\LogLevel::Full, 'migration-');
				$this->oMigrationLog->CurUserStatus = 0;
				file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
				$this->Output("Processed " . ($iContactsCount + $iSkipContactsCount) . " contacts from " . $iTotalContacsCount);
				$this->Redirect();
			}
			fclose($rUserListHandle);
			//SHARED CALENDARS
			$this->MigrateSharedCalendars();
		}
		\Aurora\System\Api::Log("Users were migrated.", \Aurora\System\Enums\LogLevel::Full, 'migration-');
		$this->Output("Users were migrated");
		$this->oMigrationLog->UsersMigrated = 1;
		file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
	}

	public function UserP7ToP8(\CAccount $oP7Account, \Aurora\Modules\Core\Classes\User $oP8User)
	{
		$oP7UserCalendarSettings = $this->oP7ApiUsersManager->getCalUser($oP7Account->IdUser);
		$oP8User->IsDisabled = $oP7Account ? $oP7Account->IsDisabled : false;

		//Common settings
		$oP8User->Language = $oP7Account->User->DefaultLanguage;
		$oP8User->{'CoreWebclient::AutoRefreshIntervalMinutes'} = $oP7Account->User->AutoCheckMailInterval;
		$oP8User->TimeFormat = $oP7Account->User->DefaultTimeFormat;
		$oP8User->DateFormat =$oP7Account->User->DefaultDateFormat;
		$oP8User->DesktopNotifications =$oP7Account->User->DesktopNotifications;

		$oP8User->{'MailWebclient::MailsPerPage'} =$oP7Account->User->MailsPerPage;

		$oP8User->{'Contacts::ContactsPerPage'} = $oP7Account->User->ContactsPerPage;

		//Calendar
		if ($oP7UserCalendarSettings)
		{
			$oP8User->{'Calendar::HighlightWorkingHours'} = $oP7UserCalendarSettings->ShowWorkDay;
			$oP8User->{'Calendar::HighlightWorkingDays'} = $oP7UserCalendarSettings->ShowWeekEnds;
			$oP8User->{'Calendar::WorkdayStarts'} = $oP7UserCalendarSettings->WorkDayStarts;
			$oP8User->{'Calendar::WorkdayEnds'} = $oP7UserCalendarSettings->WorkDayEnds;
			$oP8User->{'Calendar::WeekStartsOn'} = $oP7UserCalendarSettings->WeekStartsOn;
			$oP8User->{'Calendar::DefaultTab'} = $oP7UserCalendarSettings->DefaultTab;
		}

		//Other
		$oP8User->Question1 = $oP7Account->User->Question1;
		$oP8User->Question2 = $oP7Account->User->Question2;
		$oP8User->Answer1 = $oP7Account->User->Answer1;
		$oP8User->Answer2 = $oP7Account->User->Answer2;
		$oP8User->SipEnable = $oP7Account->User->SipEnable;
		$oP8User->SipImpi = $oP7Account->User->SipImpi;
		$oP8User->SipPassword = $oP7Account->User->SipPassword;
		$oP8User->Capa = $oP7Account->User->Capa;
		$oP8User->CustomFields = $oP7Account->User->CustomFields;
		$oP8User->FilesEnable = $oP7Account->User->FilesEnable;
		$oP8User->EmailNotification = $oP7Account->User->EmailNotification;
		$oP8User->PasswordResetHash = $oP7Account->User->PasswordResetHash;
		return $this->oP8CoreDecorator->UpdateUserObject($oP8User);
	}

	public function AccountP7ToP8($iP7AccountId, \Aurora\Modules\Core\Classes\User $oP8User, $oServer)
	{
		$bResult = false;
		$oP7Account = $this->oP7ApiUsersManager->getAccountById($iP7AccountId);
		\Aurora\System\Api::Log("  Start migrate account: " . $iP7AccountId . ' | ' . $oP7Account->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
		if (!$oP7Account instanceof \CAccount)
		{
			return false;
		}
		$aResults = $this->oP8MailModule->getAccountsManager()->oEavManager->getEntities(
			'Aurora\Modules\Mail\Classes\Account',
			[],
			0,
			0,
			[
				'Email' => $oP7Account->Email,
				'IdUser' => $oP8User->EntityId
			]
		);

		if (is_array($aResults) && isset($aResults[0]))
		{
			\Aurora\System\Api::Log("  Skip duplicate account " . $iP7AccountId . ' | ' . $oP7Account->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
			return true;
		}
		$oP7DefaultDomain = $this->oP7ApiDomainsManager->getDefaultDomain();
		$bServerOwnerIsAccount = $oP7Account->Domain->IdDomain === 0 &&
			($oP7Account->IncomingMailServer !== $oP7DefaultDomain->IncomingMailServer ||
			$oP7Account->OutgoingMailServer !== $oP7DefaultDomain->OutgoingMailServer);
		if (!$oServer || $bServerOwnerIsAccount)
		{
			$oP7Account->Domain->IncomingMailServer	= $oP7Account->IncomingMailServer;
			$oP7Account->Domain->IncomingMailPort		= $oP7Account->IncomingMailPort;
			$oP7Account->Domain->IncomingMailUseSSL	= $oP7Account->IncomingMailUseSSL;

			$oP7Account->Domain->OutgoingMailServer	= $oP7Account->OutgoingMailServer;
			$oP7Account->Domain->OutgoingMailPort		= $oP7Account->OutgoingMailPort;
			$oP7Account->Domain->OutgoingMailUseSSL	= $oP7Account->OutgoingMailUseSSL;
			$oP7Account->Domain->OutgoingMailAuth		= $oP7Account->OutgoingMailAuth;

			$iServerId = $this->DomainP7ToP8(
				$oP7Account->Domain,
				$bServerOwnerIsAccount ? \Aurora\Modules\Mail\Enums\ServerOwnerType::Account : \Aurora\Modules\Mail\Enums\ServerOwnerType::SuperAdmin
			);
			if (!$iServerId)
			{
				\Aurora\System\Api::Log("Error while Server creation: " . $oP7Account->Domain->IncomingMailServer, \Aurora\System\Enums\LogLevel::Full, 'migration-');
				$this->Redirect();
			}
			else
			{
				\Aurora\System\Api::Log("  Server {$oP7Account->Domain->Name} migrated successfully ", \Aurora\System\Enums\LogLevel::Full, 'migration-');
			}
			$oServer = $this->oP8MailModuleDecorator->GetServer($iServerId);
		}

		$aServer = ['ServerId' => $oServer->EntityId];

		if ($this->oMigrationLog->CurAccountId === $iP7AccountId)
		{
			$oP8Account = $this->oP8MailModule->getAccountsManager()->getAccountById($this->oMigrationLog->NewAccountId);
			\Aurora\System\Api::Log("  Account already exists." . $oP8Account->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
		}
		else
		{
			$oP8Account = $this->oP8MailModuleDecorator->CreateAccount(
				$oP8User->EntityId,
				$oP7Account->FriendlyName,
				$oP7Account->Email,
				$oP7Account->IncomingMailLogin,
				$oP7Account->IncomingMailPassword,
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
				\Aurora\System\Api::Log("  Error. Account not created: " . $oP7Account->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
			}
		}

		if ($oP8Account)
		{
			$sFolderOrders = '';
			$aFolderOrders = $this->oP7ApiMail->getFoldersOrder($oP7Account);
			if (is_array($aFolderOrders) && count($aFolderOrders) > 0)
			{
				$sFolderOrders = json_encode($aFolderOrders);
			}

			$oP8Account->IsDisabled = $oP7Account->IsDisabled;
			$oP8Account->UseToAuthorize = !$oP7Account->IsInternal;
			$oP8Account->Signature = $oP7Account->Signature;
			$oP8Account->UseSignature = $oP7Account->SignatureOptions;
			$oP8Account->UseThreading = $oServer->EnableThreading;
			$oP8Account->FoldersOrder = $sFolderOrders;
			$oP8Account->SaveRepliesToCurrFolder = $oP7Account->User->SaveRepliedMessagesToCurrentFolder;

			$bResult = $this->oP8MailModule->getAccountsManager()->updateAccount($oP8Account);
			//System folders mapping
			$aSystemFoldersNames = $this->oP7ApiMail->getSystemFolderNames($oP7Account);
			if (is_array($aSystemFoldersNames) && count($aSystemFoldersNames) > 0)
			{
				$Sent = array_search(\EFolderType::Sent, $aSystemFoldersNames);
				$Drafts = array_search(\EFolderType::Drafts, $aSystemFoldersNames);
				$Trash = array_search(\EFolderType::Trash, $aSystemFoldersNames);
				$Spam = array_search(\EFolderType::Spam, $aSystemFoldersNames);
				if (!$this->oP8MailModule->SetupSystemFolders($oP8Account->EntityId, $Sent, $Drafts, $Trash, $Spam))
				{
					\Aurora\System\Api::Log("Error while setup system folders: ", \Aurora\System\Enums\LogLevel::Full, 'migration-');
				}
				else
				{
					\Aurora\System\Api::Log("  System folders setup successfully. Account: " . $oP8Account->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
				}
			}

			$this->oMigrationLog->CurAccountId = $iP7AccountId;
			$this->oMigrationLog->NewAccountId = $oP8Account->EntityId;
			file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
		}
		if ($bResult)
		{
			$bResult = $this->IdentitiesP7ToP8($iP7AccountId, $oP8Account);
		}
		\Aurora\System\Api::Log("  End migrate account: " . $iP7AccountId . ' | ' . $oP7Account->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
		return $bResult;
	}

	public function SocialAccountsP7ToP8($iP7AccountId, \Aurora\Modules\Core\Classes\User $oP8User)
	{
		\Aurora\System\Api::Log("  Sart migrate for Social accounts.", \Aurora\System\Enums\LogLevel::Full, 'migration-');
		$aSocials = $this->oP7ApiSocial->getSocials($iP7AccountId);
		if (is_array($aSocials))
		{
			foreach ($aSocials as $oSocial)
			{
				if (!$this->bFindSocial && $this->oMigrationLog->CurSocialAccountId !== 0 && $oSocial->Id <= $this->oMigrationLog->CurSocialAccountId)
				{
					//skip Social Account if already done
					\Aurora\System\Api::Log("Skip Social Account: " . $oSocial->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
					continue;
				}
				else
				{
					$this->bFindSocial = true;
				}

				$oP8SocialAccount = new \Aurora\Modules\OAuthIntegratorWebclient\Classes\Account();
				$oP8SocialAccount->IdUser = $oP8User->EntityId;
				$oP8SocialAccount->IdSocial = $oSocial->IdSocial;
				$oP8SocialAccount->Type = $oSocial->TypeStr;
				$oP8SocialAccount->Name = $oSocial->Name;
				$oP8SocialAccount->Email = $oSocial->Email;
				$oP8SocialAccount->RefreshToken = $oSocial->RefreshToken;
				$oP8SocialAccount->Scopes = $oSocial->Scopes;
				$oP8SocialAccount->Disabled = $oSocial->Disabled;

				if (!$this->oP8OAuthIntegratorWebclientModule->oManager->createAccount($oP8SocialAccount))
				{
					\Aurora\System\Api::Log("Error while Social Account creation: " . $oSocial->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
					$this->Redirect();
				}

				$oP8NewSocialAccount = $this->oP8OAuthIntegratorWebclientModule->oManager->getAccount($oP8User->EntityId, $oSocial->TypeStr);
				if (!$oP8NewSocialAccount && !$oP8NewSocialAccount instanceof \Aurora\Modules\OAuthIntegratorWebclient\Classes\Account)
				{
					\Aurora\System\Api::Log("Error while Social Account creation: " . $oSocial->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
					$this->Redirect();
				}
				else
				{
					\Aurora\System\Api::Log("  Social Account {$oSocial->Name}|{$oSocial->Email} was created successfully.", \Aurora\System\Enums\LogLevel::Full, 'migration-');
				}
				$this->oMigrationLog->CurSocialAccountId = $oSocial->Id;
				$this->oMigrationLog->NewSocialAccountId = $oP8NewSocialAccount->EntityId;
				file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
			}
		}
		\Aurora\System\Api::Log("  End migrate for Social accounts.", \Aurora\System\Enums\LogLevel::Full, 'migration-');
		return true;
	}

	public function IdentitiesP7ToP8($iP7AccountId, $oP8Account)
	{
		$bResult = false;
		$aAccountIdentities = $this->oP7ApiUsersManager->getAccountIdentities($iP7AccountId);
		if (is_array($aAccountIdentities) && count($aAccountIdentities) > 0)
		{
			\Aurora\System\Api::Log(" Start Identities migration. Account: " . $oP8Account->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
			foreach ($aAccountIdentities as $oP7Identity)
			{
				if (!$this->bFindIdentity && $this->oMigrationLog->CurIdentitiesId !== 0 && $oP7Identity->IdIdentity < $this->oMigrationLog->CurIdentitiesId)
				{
					//skip Identity if already done
					\Aurora\System\Api::Log("Skip Identity " . $oListItem->Id, \Aurora\System\Enums\LogLevel::Full, 'migration-');
					continue;
				}
				else
				{
					$this->bFindIdentity = true;
				}
				if ($oP7Identity instanceof \CIdentity)
				{
					if ($oP7Identity->IdIdentity === $this->oMigrationLog->CurIdentitiesId)
					{
						$iP8EntityId = $this->oMigrationLog->NewIdentitiesId;
					}
					else
					{
						$iP8EntityId = $this->oP8MailModuleDecorator->CreateIdentity(
							$oP8Account->IdUser,
							$oP8Account->EntityId,
							$oP7Identity->FriendlyName,
							$oP7Identity->Email
						);
						if ($oP7Identity->Default && $iP8EntityId)
						{
							$this->oP8MailModuleDecorator->UpdateIdentity(
								$oP8Account->IdUser,
								$oP8Account->EntityId,
								$iP8EntityId,
								$oP7Identity->FriendlyName,
								$oP7Identity->Email,
								true
							);
						}
					}
					if (!$iP8EntityId)
					{
						\Aurora\System\Api::Log("Error while Identity creation: " . $oP7Identity->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
						return false;
					}
					else
					{
						\Aurora\System\Api::Log("  Account: " . $oP8Account->Email . " Identity {$oP7Identity->Email}|{$oP7Identity->FriendlyName} was migrated.", \Aurora\System\Enums\LogLevel::Full, 'migration-');
					}
					$this->oMigrationLog->CurIdentitiesId = $oP7Identity->IdIdentity;
					$this->oMigrationLog->NewIdentitiesId = $iP8EntityId;
					file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));

					if (isset($oP7Identity->UseSignature) && isset($oP7Identity->Signature))
					{
						$bResult = !!$this->oP8MailModule->getIdentitiesManager()->updateIdentitySignature($iP8EntityId, $oP7Identity->UseSignature, $oP7Identity->Signature);
						if (!$bResult)
						{
							\Aurora\System\Api::Log("Error while Signature creation: " . $oP7Identity->Email, \Aurora\System\Enums\LogLevel::Full, 'migration-');
							return $bResult;
						}
						else
						{
							\Aurora\System\Api::Log("  Account: " . $oP8Account->Email . " Signature {$oP7Identity->Email}|{$oP7Identity->Signature} was migrated.", \Aurora\System\Enums\LogLevel::Full, 'migration-');
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

	public function ContactP7ToP8($iP7UserId, $iP7ContactId, \Aurora\Modules\Core\Classes\User $oP8User)
	{
		$aResult = false;
		$aContactOptions = [];
		$aObgectFieldsConformity = [
			"PrimaryEmail" => "PrimaryEmail",
			"FullName" => "FullName",
			"FirstName" => "FirstName",
			"LastName" => "LastName",
			"NickName" => "NickName",
			"ItsMe" => "ItsMe",
			"Skype" => "Skype",
			"Facebook" => "Facebook",
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
			"ETag" => "ETag",
			"BirthDay" => "BirthdayDay",
			"BirthMonth" => "BirthdayMonth",
			"BirthYear" => "BirthdayYear"
		];

		$oP7Contact = $this->oP7ApiContactsManager->getContactById($iP7UserId, $iP7ContactId);
		if (!$oP7Contact instanceof \CContact)
		{
			return $aResult;
		}
		$aContactOptions["GroupUUIDs"] = [];
		foreach ($aObgectFieldsConformity as $sPropertyNameP8 => $sPropertyNameP7)
		{
			$aContactOptions[$sPropertyNameP8] = $oP7Contact->$sPropertyNameP7;
		}
		foreach ($oP7Contact->GroupsIds as $iGroupId)
		{
			$oP7Group = $this->oP7ApiContactsManagerFrom->getGroupById($iP7UserId, $iGroupId);
			if ($oP7Group)
			{
				$oP8Group = $this->oP8ContactsDecorator->GetGroupByName($oP7Group->Name, $oP8User->EntityId);
				if ($oP8Group instanceof \Aurora\Modules\Contacts\Classes\Group)
				{
					$aContactOptions["GroupUUIDs"][] = $oP8Group->UUID;
				}
			}
		}

		if ($this->oP8ContactsDecorator->CreateContact($aContactOptions, $oP8User->EntityId))
		{
			$this->oMigrationLog->CurContactId = $iP7ContactId;
			file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
			$aResult = true;
		}
		return $aResult;
	}

	public function GroupContactP7ToP8(\CGroup $oGroup, \Aurora\Modules\Core\Classes\User $oP8User)
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

	public function GetServerByName($sServerName)
	{
		$aFilters = ['$AND' => [
			'Name' => [$sServerName, '='],
			'OwnerType' => [\Aurora\Modules\Mail\Enums\ServerOwnerType::SuperAdmin, '=']
		]];

		$oServer = $this->oP8MailModule->getServersManager()->getServerByFilter($aFilters);
		return $oServer;
	}

	public function DomainP7ToP8(\CDomain $oDomain, $sOwnerType = \Aurora\Modules\Mail\Enums\ServerOwnerType::SuperAdmin)
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
		$oServer->EnableThreading = $oDomain->UseThreads;
		$oServer->EnableSieve = $bSieveEnabled;
		$oServer->SievePort = $iSievePort;
		$oServer->UseFullEmailAddressAsLogin = !$this->oP7Settings->GetConf('WebMail/UseLoginWithoutDomain');

		$iServerId = $this->oP8MailModule->getServersManager()->createServer($oServer);
		return $iServerId ? $iServerId : false;
	}

	public function UpgradeDB()
	{
		$sP7DBPrefix = $this->oP7Settings->GetConf('Common/DBPrefix');

		$sP8DBLogin = $this->oP8Settings->DBLogin;
		$sP8DBPassword = $this->oP8Settings->DBPassword;
		$sP8DBName = $this->oP8Settings->DBName;
		$sP8DBPrefix = $this->oP8Settings->DBPrefix;
		$sP8DBHost = $this->oP8Settings->DBHost;

		//Check if DB exists
		$sCheckTablesQuery = "SELECT count(*) FROM INFORMATION_SCHEMA.TABLES
			WHERE table_schema = '{$sP8DBName}'
			AND (
			   table_name LIKE '{$sP8DBPrefix}eav_entities'
			  OR table_name LIKE '{$sP8DBPrefix}eav_attributes_text'
			  OR table_name LIKE '{$sP8DBPrefix}eav_attributes_bool'
			  OR table_name LIKE '{$sP8DBPrefix}eav_attributes_datetime'
			  OR table_name LIKE '{$sP8DBPrefix}eav_attributes_int'
			  OR table_name LIKE '{$sP8DBPrefix}eav_attributes_string'
			)";
		try
		{
			$stmt = $this->oP8PDO->prepare($sCheckTablesQuery);
			$stmt->execute();
			$iCheckTables = (int) $stmt->fetchColumn();
			if ($iCheckTables < 6)
			{
				\Aurora\System\Api::Log("The integrity of the database is broken. ", \Aurora\System\Enums\LogLevel::Full, 'migration-');
				$this->Output("The integrity of the database is broken");
				return false;
			}
			$sTablesListQuery = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE table_schema = '{$sP8DBName}' ";
			$stmt = $this->oP8PDO->prepare($sTablesListQuery);
			$stmt->execute();
			$sTablesList = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
			\Aurora\System\Api::Log("P8 tables list before upgrade: " .  implode(', ', $sTablesList), \Aurora\System\Enums\LogLevel::Full, 'migration-');
		}
		catch (Exception $e)
		{
			\Aurora\System\Api::Log("Error during upgrade DB process. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'migration-');
			return false;
		}

		if (!isset($_GET["skip_sabredav_migrate"]))
		{
			//Delete tables in P8
			$sDelTableQuery = "DROP TABLE IF EXISTS `{$sP8DBPrefix}adav_addressbookchanges`,
				`{$sP8DBPrefix}adav_addressbooks`,
				`{$sP8DBPrefix}adav_cache`,
				`{$sP8DBPrefix}adav_calendarchanges`,
				`{$sP8DBPrefix}adav_calendarobjects`,
				`{$sP8DBPrefix}adav_calendars`,
				`{$sP8DBPrefix}adav_calendarsubscriptions`,
				`{$sP8DBPrefix}adav_cards`,
				`{$sP8DBPrefix}adav_groupmembers`,
				`{$sP8DBPrefix}adav_locks`,
				`{$sP8DBPrefix}adav_principals`,
				`{$sP8DBPrefix}adav_propertystorage`,
				`{$sP8DBPrefix}adav_reminders`,
				`{$sP8DBPrefix}adav_schedulingobjects`,
				`{$sP8DBPrefix}adav_calendarinstances`
			";

			try
			{
				$this->oP8PDO->exec($sDelTableQuery);
			}
			catch(Exception $e)
			{
				\Aurora\System\Api::Log("Error during upgrade DB process. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'migration-');
				return false;
			}
			\Aurora\System\Api::Log("Deleting tables from P8 DB: " . $sDelTableQuery, \Aurora\System\Enums\LogLevel::Full, 'migration-');
			$this->Output("<pre>Deleting tables before moving");

			try
			{
				$sTablesListQuery = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE table_schema = '{$sP8DBName}' ";
				$stmt = $this->oP8PDO->prepare($sTablesListQuery);
				$stmt->execute();
				$sTablesList = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
				\Aurora\System\Api::Log("P8 tables list after delete operation: " .  implode(', ', $sTablesList), \Aurora\System\Enums\LogLevel::Full, 'migration-');
			}
			catch(Exception $e)
			{
				\Aurora\System\Api::Log("Error during upgrade DB process. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'migration-');
				return false;
			}

			//Move tables from P7 DB to P8  DB
			$this->Output("Moving tables from p7 DB to p8  DB\n-----------------------------------------------");
			$this->MoveTables();

			//Rename tables before upgrading
			$sRenameTablesQuery = "RENAME TABLE {$sP7DBPrefix}adav_addressbooks TO addressbooks,
				{$sP7DBPrefix}adav_cache TO cache,
				{$sP7DBPrefix}adav_calendarobjects TO calendarobjects,
				{$sP7DBPrefix}adav_calendars TO calendars,
				{$sP7DBPrefix}adav_cards TO cards,
				{$sP7DBPrefix}adav_groupmembers TO groupmembers,
				{$sP7DBPrefix}adav_locks TO locks,
				{$sP7DBPrefix}adav_principals TO principals,
				{$sP7DBPrefix}adav_reminders TO reminders";

			try
			{
				$this->oP8PDO->exec($sRenameTablesQuery);
			}
			catch(Exception $e)
			{
				\Aurora\System\Api::Log("Error during rename tables process. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'migration-');
				return false;
			}
			\Aurora\System\Api::Log("DAV tables was renamed.", \Aurora\System\Enums\LogLevel::Full, 'migration-');

			if (isset($_GET["stop_before_sabredav_migrate"]))
			{
				\Aurora\System\Api::Log("stop_before_sabredav_migrate", \Aurora\System\Enums\LogLevel::Full, 'migration-');
				$this->Output("\n stop_before_sabredav_migrate");
				die();
			}
			//Upgrade sabredav data from 1.8 to 3.2 version
			$aOutput = null;
			$iStatus = null;
			$sUpgrade18To20 = "php ../vendor/sabre/dav/bin/migrateto20.php \"mysql:host={$sP8DBHost};dbname={$sP8DBName}\" {$sP8DBLogin}" . ($sP8DBPassword ? " '{$sP8DBPassword}'" : "");
			exec($sUpgrade18To20, $aOutput, $iStatus);
			if ($iStatus !== 0)
			{
				\Aurora\System\Api::Log("Error during upgrade DB process. Failed migration from a pre-2.0 database to 2.0. Output:\n" . implode("\n", $aOutput), \Aurora\System\Enums\LogLevel::Full, 'migration-');
				return false;
			}
			\Aurora\System\Api::Log("Migrate from a pre-2.0 database to 2.0." . implode("\n", $aOutput), \Aurora\System\Enums\LogLevel::Full, 'migration-');
			$this->Output(implode("\n", $aOutput));
			$this->Output("\n-----------------------------------------------");

			unset($aOutput);
			unset($iStatus);
			$sUpgrade20To21 = "php ../vendor/sabre/dav/bin/migrateto21.php \"mysql:host={$sP8DBHost};dbname={$sP8DBName}\" {$sP8DBLogin}" . ($sP8DBPassword ? " '{$sP8DBPassword}'" : "");
			exec($sUpgrade20To21, $aOutput, $iStatus);
			if ($iStatus !== 0)
			{
				\Aurora\System\Api::Log("Error during upgrade DB process. Failed migration from a pre-2.1 database to 2.1. Output:\n" . implode("\n", $aOutput), \Aurora\System\Enums\LogLevel::Full, 'migration-');
				return false;
			}
			\Aurora\System\Api::Log("Migrate from a pre-2.1 database to 2.1." . implode("\n", $aOutput), \Aurora\System\Enums\LogLevel::Full, 'migration-');
			$this->Output(implode("\n", $aOutput));
			$this->Output("\n-----------------------------------------------");

			unset($aOutput);
			unset($iStatus);
			$sUpgrade21To30 = "php ../vendor/sabre/dav/bin/migrateto30.php \"mysql:host={$sP8DBHost};dbname={$sP8DBName}\" {$sP8DBLogin}" . ($sP8DBPassword ? " '{$sP8DBPassword}'" : "");
			exec($sUpgrade21To30, $aOutput, $iStatus);
			if ($iStatus !== 0)
			{
				\Aurora\System\Api::Log("Error during upgrade DB process. Failed migration from a pre-3.0 database to 3.0. Output:\n" . implode("\n", $aOutput), \Aurora\System\Enums\LogLevel::Full, 'migration-');
				return false;
			}
			\Aurora\System\Api::Log("Migrate from a pre-3.0 database to 3.0." . implode("\n", $aOutput), \Aurora\System\Enums\LogLevel::Full, 'migration-');
			$this->Output(implode("\n", $aOutput));
			$this->Output("\n-----------------------------------------------");

			unset($aOutput);
			unset($iStatus);
			$sUpgrade30To32 = "php ../vendor/afterlogic/dav/bin/migrateto32.php \"mysql:host={$sP8DBHost};dbname={$sP8DBName}\" \"\" {$sP8DBLogin}" . ($sP8DBPassword ? " '{$sP8DBPassword}'" : "");
			exec($sUpgrade30To32, $aOutput, $iStatus);
			if ($iStatus !== 0)
			{
				\Aurora\System\Api::Log("Error during upgrade DB process. Failed migration from a pre-3.2 database to 3.2. Output:\n" . implode("\n", $aOutput), \Aurora\System\Enums\LogLevel::Full, 'migration-');
				return false;
			}
			\Aurora\System\Api::Log("Migrate from a pre-3.2 database to 3.2." . implode("\n", $aOutput), \Aurora\System\Enums\LogLevel::Full, 'migration-');
			$this->Output(implode("\n", $aOutput));
			$this->Output("\n-----------------------------------------------");
		}

		try
		{
			$sDbPort = '';
			$sUnixSocket = '';
			$iPos = strpos($sP8DBHost, ':');
			if (false !== $iPos && 0 < $iPos)
			{
				$sAfter = substr($sP8DBHost, $iPos + 1);
				$sP8DBHost = substr($sP8DBHost, 0, $iPos);

				if (is_numeric($sAfter))
				{
					$sDbPort = $sAfter;
				}
				else
				{
					$sUnixSocket = $sAfter;
				}
			}
			$this->oP8PDO = @new \PDO('mysql:dbname=' . $sP8DBName .
						(empty($sP8DBHost) ? '' : ';host='.$sP8DBHost).
						(empty($sDbPort) ? '' : ';port='.$sDbPort).
						(empty($sUnixSocket) ? '' : ';unix_socket='.$sUnixSocket), $sP8DBLogin, $sP8DBPassword);
			//Add prefixes
			$sPrefix = $sP8DBPrefix . "adav_";
			$sAddPrefixQuery = "RENAME TABLE addressbooks TO {$sPrefix}addressbooks,
				cache TO {$sPrefix}cache,
				calendarobjects TO {$sPrefix}calendarobjects,
				calendars TO {$sPrefix}calendars,
				cards TO {$sPrefix}cards,
				groupmembers TO {$sPrefix}groupmembers,
				locks TO {$sPrefix}locks,
				principals TO {$sPrefix}principals,
				reminders TO {$sPrefix}reminders,
				calendarchanges TO {$sPrefix}calendarchanges,
				calendarsubscriptions TO {$sPrefix}calendarsubscriptions,
				propertystorage TO {$sPrefix}propertystorage,
				schedulingobjects TO {$sPrefix}schedulingobjects,
				addressbookchanges TO {$sPrefix}addressbookchanges,
				calendarinstances TO {$sPrefix}calendarinstances";
			$this->oP8PDO->exec($sAddPrefixQuery);

			\Aurora\System\Api::Log("Prefixex was added to DAV-tables.", \Aurora\System\Enums\LogLevel::Full, 'migration-');

			//Remove DAV contacts
			$sTruncateQuery = "TRUNCATE {$sPrefix}addressbooks; TRUNCATE {$sPrefix}cards;";
			$this->oP8PDO->exec($sTruncateQuery);
			//Drop 'principals' table
			$sDropPrincipalsTablesQuery = "DROP TABLE IF EXISTS {$sPrefix}principals";
			$this->oP8PDO->exec($sDropPrincipalsTablesQuery);
			\Aurora\System\Api::Log("Drop 'principals' tables: " .  $sDropPrincipalsTablesQuery, \Aurora\System\Enums\LogLevel::Full, 'migration-');

			//Drop backup tables
			$sGetBackupTablesNamesQuery = "SHOW TABLES WHERE `Tables_in_{$sP8DBName}` LIKE '%_old%' OR `Tables_in_{$sP8DBName}` LIKE 'calendars_%' ";
			$stmt = $this->oP8PDO->prepare($sGetBackupTablesNamesQuery);
			$stmt->execute();
			$aBackupTablesNames = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);

			if (is_array($aBackupTablesNames) && count($aBackupTablesNames) > 0)
			{
				$sDropBackupTablesQuery = "DROP TABLE IF EXISTS " . implode(", ", $aBackupTablesNames);
				$this->oP8PDO->exec($sDropBackupTablesQuery);
				\Aurora\System\Api::Log("Drop backup tables: " .  $sDropBackupTablesQuery, \Aurora\System\Enums\LogLevel::Full, 'migration-');
			}
		}
		catch(Exception $e)
		{
			\Aurora\System\Api::Log("Error during upgrade DB process. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'migration-');
			return false;
		}

		$this->Output("DB upgraded");
		return true;
	}

	public function UpdateUserFilesInfo()
	{
		$this->Output("<pre>Start updating files information");
		\Aurora\System\Api::Log("Start updating files information", \Aurora\System\Enums\LogLevel::Full, 'migration-');
		if ($this->oMigrationLog->FilesMigrated)
		{
			$this->Output("Files information already updated");
			\Aurora\System\Api::Log("Files already moved", \Aurora\System\Enums\LogLevel::Full, 'migration-');
			return true;
		}
		$oDirectory = dir($this->sP8UserFiles);

		if ($oDirectory)
		{
			while (false !== ($sRead = $oDirectory->read()))
			{
				if ('.' === $sRead || '..' === $sRead)
				{
					continue;
				}

				if ($sRead === ".sabredav")
				{
					$aFilesProperties = unserialize(@file_get_contents($this->sP8UserFiles . '/' . $sRead));
					if (is_array($aFilesProperties) && count($aFilesProperties) > 0)
					{
						$aFilesProperties = $this->RenameFilesOwner($aFilesProperties);
						@file_put_contents($this->sP8UserFiles . '/' . $sRead, serialize($aFilesProperties));
					}
				}

				$sPathDir = $this->sP8UserFiles.'/'.$sRead;
				if (is_dir($sPathDir))
				{
					$this->UpdateDir($sPathDir);
				}
			}
			$oDirectory->close();
		}
		$this->oMigrationLog->FilesMigrated = 1;
		file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
		$this->Output("Files information successfully updated");
		\Aurora\System\Api::Log("Files information successfully updated", \Aurora\System\Enums\LogLevel::Full, 'migration-');
	}

	public function CopyDir($sSource, $sDestination)
	{
		if (\is_dir($sSource))
		{
			if (!\is_dir($sDestination))
			{
				\mkdir($sDestination);
			}

			$oDirectory = \dir($sSource);
			if ($oDirectory)
			{
				while (false !== ($sRead = $oDirectory->read()))
				{
					if ('.' === $sRead || '..' === $sRead)
					{
						continue;
					}

					$sPathDir = $sSource.'/'.$sRead;
					if (\is_dir($sPathDir))
					{
						$this->CopyDir($sPathDir, $sDestination.'/'.$sRead);
						continue;
					}

					\copy($sPathDir, $sDestination.'/'.$sRead);
					// if ($sRead === ".sabredav")
					// {
					// 	$aFilesProperties = unserialize(@file_get_contents($sDestination.'/'.$sRead));
					// 	if (is_array($aFilesProperties) && count($aFilesProperties) > 0)
					// 	{
					// 		$aFilesProperties = $this->RenameFilesOwner($aFilesProperties);
					// 		@file_put_contents($sDestination.'/'.$sRead, serialize($aFilesProperties));
					// 	}
					// }
				}
				$oDirectory->close();
			}
		}
	}

	public function UpdateDir($sDir)
	{
		$oDirectory = dir($sDir);
		if ($oDirectory)
		{
			while (false !== ($sRead = $oDirectory->read()))
			{
				if ('.' === $sRead || '..' === $sRead)
				{
					continue;
				}

				if ($sRead === ".sabredav")
				{
					$aFilesProperties = unserialize(@file_get_contents($sDir . '/' . $sRead));
					if (is_array($aFilesProperties) && count($aFilesProperties) > 0)
					{
						$aFilesProperties = $this->RenameFilesOwner($aFilesProperties);
						@file_put_contents($sDir . '/' . $sRead, serialize($aFilesProperties));
					}
				}
				$sPathDir = $sDir . '/' . $sRead;
				if (is_dir($sPathDir))
				{
					$this->UpdateDir($sPathDir);
				}
			}
			$oDirectory->close();
		}
	}

	public function RenameFilesOwner($aFilesProperties)
	{
		foreach ($aFilesProperties as &$oItem)
		{
			if (isset($oItem["properties"]["Owner"]))
			{
				$oP8User = $this->oP8CoreDecorator->GetUserByPublicId($oItem["properties"]["Owner"]);
				if (!$oP8User instanceof \Aurora\Modules\Core\Classes\User)
				{
					continue;
				}
				$oItem["properties"]["Owner"] = $oP8User->UUID;
			}
		}
		return $aFilesProperties;
	}

	public function CreateUserList()
	{
		$sGetUserLIstQuery = "SELECT DISTINCT `email` FROM `" . \CApi::GetSettings()->GetConf('Common/DBPrefix') . "awm_accounts`
				WHERE `def_acct`=1
				ORDER BY `email`";
		$stmt = \CApi::GetPDO()->prepare($sGetUserLIstQuery);
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
		echo  $sMessage . "\n";
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
		$aDomains = $this->oP7ApiDomainsManager->getFullDomainsList();
		$aDomains[0] = array(false, 'Default'); // Default Domain

		foreach ($aDomains as $iDomainId => $oDomainItem)
		{
			$sDomainName = $oDomainItem[1];
			$oServer = $iDomainId !== 0 ? $this->GetServerByName($sDomainName) : false;

			if ($iDomainId !== 0 && !$oServer)
			{
				//create server if not exists and not default
				$iServerId = $this->DomainP7ToP8($this->oP7ApiDomainsManager->getDomainById($iDomainId));
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

	public function MoveTables()
	{
		$sP7DBPrefix = $this->oP7Settings->GetConf('Common/DBPrefix');
		$iRowLimit = 1000;

		$aTables = [
			"adav_addressbooks",
			"adav_cache",
			"adav_calendarobjects",
			"adav_calendars",
			"adav_cards",
			"adav_groupmembers",
			"adav_locks",
			"adav_principals",
			"adav_reminders"
		];

		foreach ($aTables as $sTableName)
		{
			$sGetTableQuery = "SHOW CREATE TABLE `{$sP7DBPrefix}{$sTableName}`";
			try
			{
				$stmt = $this->oP7PDO->prepare($sGetTableQuery);
				$stmt->execute();
				$aGetTable = $stmt->fetchAll();
				$this->oP8PDO->exec($aGetTable[0]['Create Table']);
				$sSelectRowCount = "SELECT count(*) FROM `{$sP7DBPrefix}{$sTableName}`";
				$stmt = $this->oP7PDO->prepare($sSelectRowCount);
				$stmt->execute();
				$iRowCount = (int) $stmt->fetchColumn();
				$iOffset = 0;
				\Aurora\System\Api::Log("    Table: {$sP7DBPrefix}{$sTableName}. Migration started", \Aurora\System\Enums\LogLevel::Full, 'migration-');
				while($iOffset < $iRowCount)
				{
					$sSelectAllQuery = "SELECT * FROM `{$sP7DBPrefix}{$sTableName}` LIMIT {$iRowLimit} OFFSET {$iOffset}";
					$stmt = $this->oP7PDO->prepare($sSelectAllQuery);
					$stmt->execute();
					$aGetTableData = $stmt->fetchAll(PDO::FETCH_ASSOC);
					$iOffset += $iRowLimit;
					$sInsertDataQuery = '';

					foreach ($aGetTableData as $aRow)
					{
						$sInsertDataRow = "";
						foreach ($aRow as $field)
						{
							if (is_null($field))
								$field = "NULL";
							else
								$field = "'" . addslashes($field) . "'";
							if ($sInsertDataRow == "")
								$sInsertDataRow = $field;
							else
								$sInsertDataRow = $sInsertDataRow . ', ' . $field;
						}
						$sInsertDataQuery .= "INSERT INTO `{$sP7DBPrefix}{$sTableName}` VALUES ({$sInsertDataRow});\n";
					}
					if ($sInsertDataQuery !== '')
					{
						$this->oP8PDO->exec($sInsertDataQuery);
					}
				}
				\Aurora\System\Api::Log("    Table: {$sP7DBPrefix}{$sTableName}. Migrated successfully", \Aurora\System\Enums\LogLevel::Full, 'migration-');
			}
			catch(Exception $e)
			{
				\Aurora\System\Api::Log("Error during upgrade DB process. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'migration-');
				return false;
			}
		}
	}

	public function MigrateSharedCalendars()
	{
		if ($this->oMigrationLog->SharedCalendarsStatus > self::ATTEMPTS_MAX_NUMBER)
		{
			$this->Output("Shared calendars not migrated. Script have exceeded the maximum number of attempts.");
			\Aurora\System\Api::Log("Shared calendars not migrated. Script have exceeded the maximum number of attempts. " . $this->oMigrationLog->SharedCalendarsStatus, \Aurora\System\Enums\LogLevel::Full, 'migration-');
			return false;
		}
		else
		{
			$this->oMigrationLog->SharedCalendarsStatus = $this->oMigrationLog->SharedCalendarsStatus + 1;
			file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
		}
		\Aurora\System\Api::Log("Shared calendars migration. Attempt " . $this->oMigrationLog->SharedCalendarsStatus, \Aurora\System\Enums\LogLevel::Full, 'migration-');
		$sP7DBPrefix = $this->oP7Settings->GetConf('Common/DBPrefix');

		$sSelectAllSharedCalendarsQuery = "
			SELECT
				{$sP7DBPrefix}adav_calendarshares.*,
				prncpl.uri AS member_principal,
				prncpl.displayname AS member_displayname,
				clndr.uri AS calendar_uri,
				clndr.principaluri AS owner_principaluri
			FROM {$sP7DBPrefix}adav_calendarshares
			LEFT JOIN {$sP7DBPrefix}adav_principals AS prncpl on prncpl.id = {$sP7DBPrefix}adav_calendarshares.member
			LEFT JOIN {$sP7DBPrefix}adav_calendars AS clndr on clndr.id = {$sP7DBPrefix}adav_calendarshares.calendarid
			WHERE prncpl.uri IS NOT NULL
		";
		$stmt = $this->oP7PDO->prepare($sSelectAllSharedCalendarsQuery);
		$stmt->execute();
		$aSharedCalendars = $stmt->fetchAll(PDO::FETCH_ASSOC);
		foreach ($aSharedCalendars as $aSharedCalendar)
		{
			$sUserPublicId = str_replace('principals/', '', $aSharedCalendar['member_principal']);
			$sOwnerPublicId = str_replace('principals/', '', $aSharedCalendar['owner_principaluri']);
			$sCalendarUri = $aSharedCalendar['calendar_uri'];
			$oOwner = $this->oP8CoreDecorator->GetUserByPublicId($sOwnerPublicId);
			if ($oOwner instanceof \Aurora\Modules\Core\Classes\User)
			{
				if ($sUserPublicId === 'default_dav_tenant_user@localhost')
				{//shared with all
					$this->oP8CalendarModuleDecorator->UpdateCalendarShare(
						$oOwner->EntityId,
						$sCalendarUri,
						/*IsPublic*/0,
						/*Shares*/json_encode([]),
						/*ShareToAll*/true,
						/*ShareToAllAccess*/$aSharedCalendar['readonly'] ? \Aurora\Modules\Calendar\Enums\Permission::Read : \Aurora\Modules\Calendar\Enums\Permission::Write
					);
				}
				else if ($sUserPublicId === 'caldav_public_user@localhost')
				{//publick
					$this->oP8CalendarModuleDecorator->UpdateCalendarPublic(
						$sCalendarUri,
						true,
						$oOwner->EntityId
					);
				}
				else
				{
					$aShares = [[
						'name' => $aSharedCalendar['member_displayname'],
						'email' => $sUserPublicId,
						'access' => $aSharedCalendar['readonly'] ? \Aurora\Modules\Calendar\Enums\Permission::Read : \Aurora\Modules\Calendar\Enums\Permission::Write
					]];
					$this->oP8CalendarModuleDecorator->UpdateCalendarShare(
						$oOwner->EntityId,
						$sCalendarUri,
						/*IsPublic*/0,
						/*Shares*/
						json_encode($aShares),
						/*ShareToAll*/false,
						/*ShareToAllAccess*/\Aurora\Modules\Calendar\Enums\Permission::Read
					);
				}
			}
		}
		$this->Output("Shared calendars migrated");
		\Aurora\System\Api::Log("Shared calendars migrated", \Aurora\System\Enums\LogLevel::Full, 'migration-');
	}
}
ob_start();
$oMigration = new P7ToP8Migration();

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
		// $oMigration->UpdateUserFilesInfo();
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
