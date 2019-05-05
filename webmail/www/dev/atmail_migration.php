<?php
/**
 *  1 - specify connection to the database Atmail
 * 	private $sAtmailDbName = 'atmailDBName';
 *	private $sAtmailDbHost = '127.0.0.1';
 *	private $sAtmailDbPort = '';
 *	private $sAtmailDbLogin = 'db_login';
 *	private $sAtmailDbPassword = 'db_password';
 * 
 * Remember that migration starts only for NEW WebMail v8 installation without any users
 * 2 - run the script with argument "--user_list" for creating file "user_list" in "data" directory
 * For example "php atmail_migration.php --user_list"
 * 3 - check that "user_list" file was successfully created and contains list of users
 * 4 - run the script to start migration process
 */

$aLongopts = [
	"user_list",
];
$aOptions = getopt(null, $aLongopts);


require_once "../system/autoload.php";
\Aurora\System\Db\Pdo\MySql::$bUseReconnect = true;
\Aurora\System\Api::Init(true);

class AtmailToP8Migration
{
	//Number of unsuccessful attempts after which user will be skipped
	const ATTEMPTS_MAX_NUMBER = 3;

	private $sAtmailDbName = '';
	private $sAtmailDbHost = '';
	private $sAtmailDbPort = '';
	private $sAtmailDbLogin = '';
	private $sAtmailDbPassword = '';

	public $oAtmailPDO = false;
	public $oP8PDO = false;
	public $oP8Settings = false;

	public $oP8ContactsDecorator = null;
	public $oP8CoreDecorator = null;
	public $oP8MailModule = null;
	public $oP8MailModuleDecorator = null;
	public $oP8MtaConnectorModule = null;

	public $sMigrationLogFile = null;
	public $sUserListFile = null;
	public $sMigratedUsersFile = null;
	public $sNotMigratedUsersFile = null;
	public $oMigrationLog = null;

	public $iUserCount = 0;
	public $bFindUser = false;
	public $bFindAccount = false;
	public $bFindIdentity = false;
	public $bFindGroupContact = false;
	public $bFindContact = false;


	public $iP8TenantId = 0;

	public function Init($aOptions)
	{
		$this->oAtmailPDO = @new \PDO( 'mysql:dbname=' . $this->sAtmailDbName .
			(empty($this->sAtmailDbHost) ? '' : ';host='.$this->sAtmailDbHost) .
			(empty($this->sAtmailDbPort) ? '' : ';port='.$this->sAtmailDbPort), $this->sAtmailDbLogin, $this->sAtmailDbPassword);
		if (!$this->oAtmailPDO instanceof PDO)
		{
			\Aurora\System\Api::Log("Error during connection to Atmail DB.", \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			exit("Error during connection to Atmail DB.");
		}
		$this->oP8PDO = \Aurora\System\Api::GetPDO();
		if (!$this->oP8PDO instanceof \PDO)
		{
			\Aurora\System\Api::Log("Error during connection to p8 DB.", \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			exit("Error during connection to p8 DB.");
		}
		$this->oP8Settings = \Aurora\System\Api::GetSettings();

		$this->oP8ContactsDecorator = \Aurora\System\Api::GetModuleDecorator('Contacts');
		$this->oP8CoreDecorator = \Aurora\System\Api::GetModuleDecorator('Core');
		$oP8MailModule = \Aurora\System\Api::GetModule("Mail");
		$this->oP8MailModule = $oP8MailModule;
		$this->oP8MailModuleDecorator = $oP8MailModule::Decorator();

		if (!$this->oP8MailModule instanceof Aurora\Modules\Mail\Module)
		{
			\Aurora\System\Api::Log("Error during initialisation process. Mail module not found", \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			exit("Error during initialisation process. For more detail see log-file.");
		}

		$this->sMigrationLogFile = \Aurora\System\Api::DataPath() . '/migration';
		if (file_exists($this->sMigrationLogFile))
		{
			$this->oMigrationLog = json_decode(@file_get_contents($this->sMigrationLogFile));
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
				'ServerCreated' => 0,
				'CurUserEmail' => '',
				'CurUserStatus' => -1,
				'IsSignatureMigrated' => 0,
				'CurContactId' => 0,
				'CurGroupContactId' => 0,
				'UsersMigrated' => 0
			];
		}

		$this->sUserListFile = \Aurora\System\Api::DataPath() . "/user_list";
		$this->sMigratedUsersFile = \Aurora\System\Api::DataPath() . '/migrated-users';
		$this->sNotMigratedUsersFile = \Aurora\System\Api::DataPath() . '/not-migrated-users';
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
		//SERVER
		$oServer = null;
		if (!$this->oMigrationLog->ServerCreated)
		{
			$iServerId = $this->CreateServer();
			if (!$iServerId)
			{
				exit("Error during migration process. For more detail see log-file.");
			}
			$this->Output("Server created successfully");
			$this->oMigrationLog->ServerCreated = 1;
			file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
			$oServer = $this->oP8MailModuleDecorator->GetServer($iServerId);
			if (!$oServer instanceof \Aurora\Modules\Mail\Classes\Server)
			{
				\Aurora\System\Api::Log("Error: Serdev with ID {$iServerId} not found. ", \Aurora\System\Enums\LogLevel::Full, 'atmail-');
				exit("Error: Serdev with ID {$iServerId} not found.");
			}
		}
		//USERS
		if (!file_exists($this->sUserListFile))
		{
			\Aurora\System\Api::Log("Error: User list not found in " . $this->sUserListFile, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			exit("Error: User list not found in " . $this->sUserListFile);
		}
		$rUserListHandle = @fopen($this->sUserListFile, "r");
		if ($rUserListHandle)
		{
			$rMigratedUsersHandle = @fopen($this->sMigratedUsersFile, "a");
			if (!$rMigratedUsersHandle)
			{
				\Aurora\System\Api::Log("Error: can't write in " . $this->sMigratedUsersFile, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
				exit("Error: can't write in " . $this->sMigratedUsersFile);
			}

			while (($sAtmailUserEmail = @fgets($rUserListHandle)) !== false)
			{
				$sAtmailUserEmail = \trim($sAtmailUserEmail);
				if ($sAtmailUserEmail === '')
				{
					continue;
				}
				if (!$this->bFindUser && $this->oMigrationLog->CurUserEmail !== '' && $sAtmailUserEmail !== $this->oMigrationLog->CurUserEmail)
				{
					//skip User
					continue;
				}
				else if ($sAtmailUserEmail === $this->oMigrationLog->CurUserEmail && $this->oMigrationLog->CurUserStatus >= self::ATTEMPTS_MAX_NUMBER)
				{
					//add user to not-migrated-users files and skip
					$rNotMigratedUsersHandle = @fopen($this->sNotMigratedUsersFile, "a");
					if (!$rNotMigratedUsersHandle || !@fwrite($rNotMigratedUsersHandle, $sAtmailUserEmail . "\r\n"))
					{
						\Aurora\System\Api::Log("Error: can't write in " . $this->sNotMigratedUsersFile, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
						exit("Error: can't write in " . $this->sNotMigratedUsersFile);
					}
					$this->bFindUser = true;
					$this->oMigrationLog->CurUserStatus = -1;
					continue;
				}
				else if ($sAtmailUserEmail === $this->oMigrationLog->CurUserEmail && $this->oMigrationLog->CurUserStatus === 0)
				{
					//skip User if successfully migrated
					$this->bFindUser = true;
					continue;
				}
				$this->Output("User: $sAtmailUserEmail");
				$this->bFindUser = true;
				//fix the beginning of migration
				$this->oMigrationLog->CurUserStatus = $this->oMigrationLog->CurUserStatus === -1 ? 1 : $this->oMigrationLog->CurUserStatus + 1;
				$this->oMigrationLog->CurUserEmail = $sAtmailUserEmail;
				file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));

				$aAtmailAccount = $this->getAtmailAccountByEmail($sAtmailUserEmail);
				if (empty($aAtmailAccount))
				{
					\Aurora\System\Api::Log("Error. Account not found. " . $sAtmailUserEmail, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
					$this->Escape();
				}
				$oP8User = $this->oP8CoreDecorator->GetUserByPublicId($sAtmailUserEmail);
				if ($oP8User instanceof \Aurora\Modules\Core\Classes\User)
				{
					\Aurora\System\Api::Log("User already exists: " . $sAtmailUserEmail, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
				}
				else
				{
					\Aurora\System\Api::Log("User: {$sAtmailUserEmail}. Start migration ", \Aurora\System\Enums\LogLevel::Full, 'atmail-');
					$iNewUserId = $this->oP8CoreDecorator->CreateUser(0, $sAtmailUserEmail, \Aurora\System\Enums\UserRole::NormalUser, false);
					if (!$iNewUserId)
					{
						\Aurora\System\Api::Log("Error while User creation: " . $sAtmailUserEmail, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
						$this->Escape();
					}
					$oP8User = $this->oP8CoreDecorator->GetUserByUUID($iNewUserId);
					if (!$oP8User instanceof \Aurora\Modules\Core\Classes\User)
					{
						\Aurora\System\Api::Log("Error. User not found: " . $sAtmailUserEmail, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
						$this->Escape();
					}
				}
				$oP8Account = $this->oP8MailModule->GetAccountByEmail($sAtmailUserEmail, $oP8User->EntityId);
				if ($oP8Account)
				{
					\Aurora\System\Api::Log("  Account already exists." . $oP8Account->Email, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
				}
				else
				{
					$oP8Account = $this->oP8MailModuleDecorator->CreateAccount(
						$oP8User->EntityId,
						/*FriendlyName*/		$aAtmailAccount['RealName'],
						/*Email*/				$sAtmailUserEmail,
						/*IncomingLogin*/		$sAtmailUserEmail,
						/*IncomingPassword*/	random_int(10000000, 99999999),
						['ServerId' => $oServer->EntityId]
					);
					if ($oP8Account)
					{
						\Aurora\System\Api::Log("  Account created successfully. Account: " . $sAtmailUserEmail, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
					}
					else
					{
						\Aurora\System\Api::Log("  Error. Account not created: " . $sAtmailUserEmail, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
						$this->Escape();
					}
				}
				//SIGNATURE
				if (isset($aAtmailAccount['Signature']) && !empty($aAtmailAccount['Signature']))
				{
					$oP8Account->Signature = $aAtmailAccount['Signature'];
					$oP8Account->UseSignature = true;
					if (!$this->oP8MailModule->getAccountsManager()->updateAccount($oP8Account))
					{
						\Aurora\System\Api::Log("Error. Signature not created: " . $sAtmailUserEmail, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
						$this->Escape();
					}
					else
					{
						\Aurora\System\Api::Log("  Signature created successfully: " . $sAtmailUserEmail, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
					}
				}
				//GROUP CONTACTS
				$this->migrateUserGroupContacts($oP8User);
				//CONTACTS
				$this->migrateUserContacts($oP8User);

				//add user to migrated-users file
				if(!@fwrite($rMigratedUsersHandle, $sAtmailUserEmail . "\r\n"))
				{
					\Aurora\System\Api::Log("Error: can't write in " . $this->sMigratedUsersFile, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
					exit("Error: can't write in " . $this->sMigratedUsersFile);
				}
				$this->oMigrationLog->CurUserStatus = 0;
				file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
			}
			fclose($rUserListHandle);
		}
		else
		{
			\Aurora\System\Api::Log("Error: can't read from " . $this->sUserListFile, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			exit("Error: can't read from " . $this->sUserListFile);
		}
		\Aurora\System\Api::Log("Users were migrated.", \Aurora\System\Enums\LogLevel::Full, 'atmail-');
		$this->Output("Users were migrated");
		$this->oMigrationLog->UsersMigrated = 1;
		file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
	}

	public function UpgradeDB()
	{
		$oP8DBLogin = $this->oP8Settings->DBLogin;
		$oP8DBPassword = $this->oP8Settings->DBPassword;
		$oP8DBName = $this->oP8Settings->DBName;
		$oP8DBPrefix = $this->oP8Settings->DBPrefix;
		$oP8DBHost = $this->oP8Settings->DBHost;

		//Check if DB exists
		$sCheckTablesQuery = "SELECT count(*) FROM INFORMATION_SCHEMA.TABLES
			WHERE table_schema = '{$oP8DBName}'
			AND (
			   table_name LIKE '{$oP8DBPrefix}eav_entities'
			  OR table_name LIKE '{$oP8DBPrefix}eav_attributes_text'
			  OR table_name LIKE '{$oP8DBPrefix}eav_attributes_bool'
			  OR table_name LIKE '{$oP8DBPrefix}eav_attributes_datetime'
			  OR table_name LIKE '{$oP8DBPrefix}eav_attributes_int'
			  OR table_name LIKE '{$oP8DBPrefix}eav_attributes_string'
			)";
		try
		{
			$stmt = $this->oP8PDO->prepare($sCheckTablesQuery);
			$stmt->execute();
			$iCheckTables = (int) $stmt->fetchColumn();
			if ($iCheckTables < 6)
			{
				\Aurora\System\Api::Log("The integrity of the database is broken. ", \Aurora\System\Enums\LogLevel::Full, 'atmail-');
				$this->Output("The integrity of the database is broken");
				return false;
			}
			$sTablesListQuery = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE table_schema = '{$oP8DBName}' ";
			$stmt = $this->oP8PDO->prepare($sTablesListQuery);
			$stmt->execute();
			$sTablesList = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
			\Aurora\System\Api::Log("P8 tables list before upgrade: " .  implode(', ', $sTablesList), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
		}
		catch (Exception $e)
		{
			\Aurora\System\Api::Log("Error during upgrade DB process. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			return false;
		}

		//Delete tables in P8
		$sDelTableQuery = "DROP TABLE IF EXISTS
			`{$oP8DBPrefix}adav_calendarchanges`,
			`{$oP8DBPrefix}adav_calendarobjects`,
			`{$oP8DBPrefix}adav_calendars`,
			`{$oP8DBPrefix}adav_calendarsubscriptions`,
			`{$oP8DBPrefix}adav_calendarinstances`,
			`{$oP8DBPrefix}adav_principals`
		";

		try
		{
			$this->oP8PDO->exec($sDelTableQuery);
		}
		catch(Exception $e)
		{
			\Aurora\System\Api::Log("Error during upgrade DB process. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			return false;
		}
		\Aurora\System\Api::Log("Deleting tables from P8 DB: " . $sDelTableQuery, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
		$this->Output("Deleting tables before moving");

		try
		{
			$sTablesListQuery = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE table_schema = '{$oP8DBName}' ";
			$stmt = $this->oP8PDO->prepare($sTablesListQuery);
			$stmt->execute();
			$sTablesList = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
			\Aurora\System\Api::Log("P8 tables list after delete operation: " .  implode(', ', $sTablesList), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
		}
		catch(Exception $e)
		{
			\Aurora\System\Api::Log("Error during upgrade DB process. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			return false;
		}

		//Move tables from Atmail DB to P8  DB
		$this->Output("Move tables from Atmail DB to p8  DB\n-----------------------------------------------");
		if (!$this->MoveTables())
		{
			$this->Escape();
		}

		//Rename tables before upgrading
		$sRenameTablesQuery = "RENAME TABLE
			{$oP8DBPrefix}adav_addressbooks TO addressbooks,
			{$oP8DBPrefix}adav_cache TO cache,
			{$oP8DBPrefix}adav_cards TO cards,
			{$oP8DBPrefix}adav_groupmembers TO groupmembers,
			{$oP8DBPrefix}adav_locks TO locks";

		try
		{
			$this->oP8PDO->exec($sRenameTablesQuery);
		}
		catch(Exception $e)
		{
			\Aurora\System\Api::Log("Error during rename tables process. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			return false;
		}
		\Aurora\System\Api::Log("DAV tables was renamed.", \Aurora\System\Enums\LogLevel::Full, 'atmail-');

		//Deleting problematic data impeding migration
		try
		{
			$sRemoveSomeCalendarsQuery = "DELETE FROM calendars WHERE id IN (19159, 13867, 17241, 17242, 13864, 13877, 13880, 13871, 19386, 13869, 17243)";
			$this->oP8PDO->exec($sRemoveSomeCalendarsQuery);
		}
		catch(Exception $e)
		{
			\Aurora\System\Api::Log("Error during deleting problematic data: " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			return false;
		}

		$sUnixSocket = '';
		$sDbPort = '';
		$iPos = strpos($oP8DBHost, ':');
		if (false !== $iPos && 0 < $iPos)
		{
			$sAfter = substr($oP8DBHost, $iPos + 1);
			$oP8DBHost = substr($oP8DBHost, 0, $iPos);
			if (is_numeric($sAfter))
			{
				$sDbPort = $sAfter;
			}
			else
			{
				$sUnixSocket = $sAfter;
			}
		}
		$aOutput = null;
		$iStatus = null;

		$sUpgrade30To32 = "php ../vendor/afterlogic/dav/bin/migrateto32.php \"mysql:host={$oP8DBHost}".
			(empty($sDbPort) ? '' : ';port='.$sDbPort).
			(empty($sUnixSocket) ? '' : ';unix_socket='.$sUnixSocket).
			";dbname={$oP8DBName}\" \"\" {$oP8DBLogin}" . ($oP8DBPassword ? " {$oP8DBPassword}" : "");
		exec($sUpgrade30To32, $aOutput, $iStatus);
		if ($iStatus !== 0)
		{
			\Aurora\System\Api::Log("Error during upgrade DB process. Failed migration from a pre-3.2 database to 3.2. Output:\n" . implode("\n", $aOutput), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			return false;
		}
		\Aurora\System\Api::Log("Migrate from a pre-3.2 database to 3.2." . implode("\n", $aOutput), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
		$this->Output(implode("\n", $aOutput));
		$this->Output("\n-----------------------------------------------");

		try
		{
			//Add prefixes
			$sPrefix = $oP8DBPrefix . "adav_";
			$sAddPrefixQuery = "RENAME TABLE
				addressbooks TO {$sPrefix}addressbooks,
				cache TO {$sPrefix}cache,
				calendarchanges TO {$sPrefix}calendarchanges,
				calendarinstances TO {$sPrefix}calendarinstances,
				calendarobjects TO {$sPrefix}calendarobjects,
				calendars TO {$sPrefix}calendars,
				calendarsubscriptions TO {$sPrefix}calendarsubscriptions,
				cards TO {$sPrefix}cards,
				groupmembers TO {$sPrefix}groupmembers,
				locks TO {$sPrefix}locks,
				principals TO {$sPrefix}principals
			";
			$this->oP8PDO->exec($sAddPrefixQuery);

			\Aurora\System\Api::Log("Prefixex was added to DAV-tables.", \Aurora\System\Enums\LogLevel::Full, 'atmail-');

			//Drop 'principals' table
			$sDropPrincipalsTablesQuery = "DROP TABLE IF EXISTS {$sPrefix}principals";
			$this->oP8PDO->exec($sDropPrincipalsTablesQuery);
			\Aurora\System\Api::Log("Drop 'principals' tables: " .  $sDropPrincipalsTablesQuery, \Aurora\System\Enums\LogLevel::Full, 'atmail-');

			//Drop backup tables
			$sGetBackupTablesNamesQuery = "SHOW TABLES WHERE `Tables_in_{$oP8DBName}` LIKE '%_old%' OR `Tables_in_{$oP8DBName}` LIKE 'calendars_%' ";
			$stmt = $this->oP8PDO->prepare($sGetBackupTablesNamesQuery);
			$stmt->execute();
			$aBackupTablesNames = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);

			if (is_array($aBackupTablesNames) && count($aBackupTablesNames) > 0)
			{
				$sDropBackupTablesQuery = "DROP TABLE IF EXISTS " . implode(", ", $aBackupTablesNames);
				$this->oP8PDO->exec($sDropBackupTablesQuery);
				\Aurora\System\Api::Log("Drop backup tables: " .  $sDropBackupTablesQuery, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			}
		}
		catch(Exception $e)
		{
			\Aurora\System\Api::Log("Error during upgrade DB process. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			return false;
		}

		$this->Output("DB upgraded");
		return true;
	}

	public function MoveTables()
	{
		$iRowLimit = 1000;

		$aTables = [
			"calendarobjects",
			"calendars",
			"calendarsubscriptions",
			"calendarchanges",
			"principals"
		];

		foreach ($aTables as $sTableName)
		{
			$sGetTableQuery = "SHOW CREATE TABLE `{$sTableName}`";
			try
			{
				$stmt = $this->oAtmailPDO->prepare($sGetTableQuery);
				$stmt->execute();
				$aGetTable = $stmt->fetchAll();
				$this->oP8PDO->exec($aGetTable[0]['Create Table']);
				$sSelectRowCount = "SELECT count(*) FROM `{$sTableName}`";
				$stmt = $this->oAtmailPDO->prepare($sSelectRowCount);
				$stmt->execute();
				$iRowCount = (int) $stmt->fetchColumn();
				$iOffset = 0;
				\Aurora\System\Api::Log("    Table: {$sTableName}. Migration started", \Aurora\System\Enums\LogLevel::Full, 'atmail-');
				while($iOffset < $iRowCount)
				{
					$sSelectAllQuery = "SELECT * FROM `{$sTableName}` LIMIT {$iRowLimit} OFFSET {$iOffset}";
					$stmt = $this->oAtmailPDO->prepare($sSelectAllQuery);
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
							{
								$field = "NULL";
							}
							else
							{
								$field = "'" . addslashes($field) . "'";
							}
							if ($sInsertDataRow == "")
							{
								$sInsertDataRow = $field;
							}
							else
							{
								$sInsertDataRow = $sInsertDataRow . ', ' . $field;
							}
						}
						$sInsertDataQuery .= "INSERT INTO `{$sTableName}` VALUES ({$sInsertDataRow});\n";
					}
					if ($sInsertDataQuery !== '')
					{
						$this->oP8PDO->exec($sInsertDataQuery);
					}
				}
				\Aurora\System\Api::Log("    Table: {$sTableName}. Migrated successfully", \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			}
			catch(Exception $e)
			{
				\Aurora\System\Api::Log("Error during upgrade DB process. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
				return false;
			}
		}

		return true;
	}

	public function CreateServer()
	{
		try
		{
			//Getting server config from DB
			$sGetServerConfigQuery = "SELECT
				keyValue as %s
				FROM Config
				WHERE keyName = '%s'";
			foreach (['smtpport', 'smtphost', 'mailserver_hostname'] as $sConfigName)
			{
				$stmt = $this->oAtmailPDO->prepare(sprintf($sGetServerConfigQuery, $sConfigName, $sConfigName));
				$stmt->execute();
				$aServerConfig[$sConfigName] = $stmt->fetchColumn();
			}

			if (isset($aServerConfig['smtpport']) && isset($aServerConfig['smtphost']) && isset($aServerConfig['mailserver_hostname']))
			{
				//Creating server in P8
				$iServerId = $this->oP8MailModuleDecorator->CreateServer(
					/*Name*/			$aServerConfig['smtphost'],
					/*IncomingServer*/	$aServerConfig['mailserver_hostname'],
					/*IncomingPort*/		143,
					/*IncomingUseSsl*/	false,
					/*OutgoingServer*/	$aServerConfig['smtphost'],
					/*OutgoingPort*/		$aServerConfig['smtpport'],
					/*OutgoingUseSsl*/	false,
					/*SmtpAuthType*/	 '2', //user credentials
					/*Domains*/		'*',
					/*EnableThreading*/	true,
					/*EnableSieve*/		false,
					/*SievePort*/		4190
				);
			}
		}
		catch (Exception $e)
		{
			\Aurora\System\Api::Log("Error during CreateServer process. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			return false;
		}

		return isset($iServerId) ? $iServerId : false;
	}

	public function migrateUserGroupContacts(\Aurora\Modules\Core\Classes\User $oP8User)
	{
		$aGroupContactListItems = $this->getAtmailGroupContactsByEmail($oP8User->PublicId);
		if (count($aGroupContactListItems) === 0)
		{
			$this->oMigrationLog->CurGroupContactId = 0;
			file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
		}
		foreach ($aGroupContactListItems as $aGroupListItem)
		{
			if (!$this->bFindGroupContact && $this->oMigrationLog->CurGroupContactId !== 0 && $aGroupListItem['id'] !== $this->oMigrationLog->CurGroupContactId)
			{
				//skip GroupContact if already done
				\Aurora\System\Api::Log("Skip Group contact " . $aGroupListItem['id'], \Aurora\System\Enums\LogLevel::Full, 'atmail-');
				continue;
			}
			else if (!$this->bFindGroupContact && $this->oMigrationLog->CurGroupContactId !== 0)
			{
				$this->bFindGroupContact = true;
				continue;
			}
			$this->bFindGroupContact = true;

			//Group creation
			$oP8NewGroup = [
				"UUID" => "",
				"Name" => $aGroupListItem['GroupName']
			];
			$oP8Group = $this->oP8ContactsDecorator->GetGroupByName($aGroupListItem['GroupName'], $oP8User->EntityId);
			if ($oP8Group instanceof \Aurora\Modules\Contacts\Classes\Group)
			{
				\Aurora\System\Api::Log("Group already exists: " . $aGroupListItem['GroupName'], \Aurora\System\Enums\LogLevel::Full, 'atmail-');
				continue;
			}
			$sP8GroupContactUUID = $this->oP8ContactsDecorator->CreateGroup($oP8NewGroup, $oP8User->EntityId);
			if (!$sP8GroupContactUUID)
			{
				\Aurora\System\Api::Log("Error while Group contact creation: " . $aGroupListItem['GroupName'], \Aurora\System\Enums\LogLevel::Full, 'atmail-');
				$this->Escape();
			}
			else
			{
				$this->oMigrationLog->CurGroupContactId = $sP8GroupContactUUID;
				file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
			}
		}
	}

	public function migrateUserContacts(\Aurora\Modules\Core\Classes\User $oP8User)
	{
		$iRowLimit = 1000;
		$iRowCount = $this->getAtmailUserContactItemsCountByEmail($oP8User->PublicId);
		$iOffset = 0;
		$iProcessedContactsCount = 0;

		while($iOffset < $iRowCount)
		{
			$aContactListItems = $this->getAtmailUserContactItemsByEmail($oP8User->PublicId, $iRowLimit, $iOffset);
			$iOffset += $iRowLimit;
			if (count($aContactListItems) === 0)
			{
				$this->oMigrationLog->CurContactId = 0;
				file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
			}
			foreach ($aContactListItems as $aListItem)
			{
				if (!$this->bFindContact && $this->oMigrationLog->CurContactId !== 0 && $aListItem['id'] !== $this->oMigrationLog->CurContactId)
				{
					//skip Contact if already done
					\Aurora\System\Api::Log("Skip contact " . $aListItem['id'], \Aurora\System\Enums\LogLevel::Full, 'atmail-');
					continue;
				}
				else if (!$this->bFindContact && $this->oMigrationLog->CurContactId !== 0)
				{
					$this->bFindContact = true;
					continue;
				}
				$this->bFindContact = true;
				if (!$this->ContactAtmailToP8($aListItem, $oP8User))
				{
					\Aurora\System\Api::Log("Error while Contact creation: " . $aListItem['id'], \Aurora\System\Enums\LogLevel::Full, 'atmail-');
					$this->Escape();
				}
				else
				{
					$iProcessedContactsCount++;
				}
				if ($iProcessedContactsCount % 100 === 0)
				{
					\Aurora\System\Api::Log("   Processed " . $iProcessedContactsCount . " contacts from " . $iRowCount, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
					$this->Output("    Processed " . $iProcessedContactsCount . " contacts from " . $iRowCount);
				}
			}
		}
		\Aurora\System\Api::Log("User: {$oP8User->PublicId} Processed " . $iProcessedContactsCount . " contacts from " . $iRowCount, \Aurora\System\Enums\LogLevel::Full, 'atmail-');
		$this->Output("Processed " . $iProcessedContactsCount . " contacts from " . $iRowCount);
	}

	public function getAtmailAccountByEmail($sEmail)
	{
		$aUsrer = [];
		try
		{
			$sGetUsrerQuery = "SELECT
					Users.Account,
					UserSettings.RealName,
					UserSettings.Signature
				FROM Users
				LEFT JOIN UserSettings on Users.Account = UserSettings.Account
				WHERE Users.Account = '%s' ";
			$stmt = $this->oAtmailPDO->prepare(sprintf($sGetUsrerQuery, $sEmail));
			$stmt->execute();
			$aResult = $stmt->fetchAll();

			if (isset($aResult[0]))
			{
				$aUsrer = $aResult[0];
			}
		}
		catch (Exception $e)
		{
			\Aurora\System\Api::Log("Error getting account. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			$this->Escape();
		}

		return $aUsrer;
	}

	public function ContactAtmailToP8($aListItem, \Aurora\Modules\Core\Classes\User $oP8User)
	{
		$bResult = false;

		if ($aListItem['isCompany'])
		{
			$bResult = $this->CompanyAtmailToP8($aListItem, $oP8User);
		}
		else
		{
			$aContactOptions = [];
			$aObgectFieldsConformity = [
				"FirstName" => "UserFirstName",
				"LastName" => "UserLastName",
				"NickName" => "UserTitle",
				"PersonalEmail" => "UserEmail",
				"PersonalAddress" => "UserHomeAddress",
				"PersonalCity" => "UserHomeCity",
				"PersonalState" => "UserHomeState",
				"PersonalZip" => "UserHomeZip",
				"PersonalCountry" => "UserHomeCountry",
				"PersonalWeb" => "UserURL",
				"PersonalFax" => "UserHomeFax",
				"PersonalPhone" => "UserHomePhone",
				"PersonalMobile" => "UserHomeMobile",
				"BusinessEmail" => "UserEmail2",
				"BusinessCompany" => "UserWorkCompany",
				"BusinessJobTitle" => "UserWorkTitle",
				"BusinessDepartment" => "UserWorkDept",
				"BusinessOffice" => "UserWorkOffice",
				"BusinessAddress" => "UserWorkAddress",
				"BusinessCity" => "UserWorkCity",
				"BusinessState" => "UserWorkState",
				"BusinessZip" => "UserWorkZip",
				"BusinessCountry" => "UserWorkCountry",
				"BusinessFax" => "UserWorkFax",
				"BusinessPhone" => "UserWorkPhone",
				"OtherEmail" => "UserEmail3",
				"Notes" => "UserInfo"
			];

			$aContactOptions["GroupUUIDs"] = [];
			foreach ($aObgectFieldsConformity as $sPropertyNameP8 => $sPropertyNameAtmail)
			{
				$aContactOptions[$sPropertyNameP8] = $aListItem[$sPropertyNameAtmail];
			}
			$aContactOptions['FullName'] = (isset($aListItem['UserFirstName']) ? $aListItem['UserFirstName'] : '')
				. ((isset($aListItem['UserFirstName']) && isset($aListItem['UserLastName'])) ? ' ' : '')
				. isset($aListItem['UserLastName']) ? $aListItem['UserLastName'] : '';
			if (isset($aListItem['UserDOB']))
			{
				$oBirthDate = new DateTime($aListItem['UserDOB']);
				$aContactOptions['BirthDay'] = (int) $oBirthDate->format('j');
				$aContactOptions['BirthMonth'] = (int) $oBirthDate->format('n');
				$aContactOptions['BirthYear'] = (int) $oBirthDate->format('Y');
			}
			//Adding contacts to groups
			$aContactGroups = $this->getGroupsForContact($aListItem['id'], $oP8User->PublicId);
			foreach ($aContactGroups as $sGroupName)
			{
				$oP8Group = $this->oP8ContactsDecorator->GetGroupByName($sGroupName, $oP8User->EntityId);
				if ($oP8Group instanceof \Aurora\Modules\Contacts\Classes\Group)
				{
					$aContactOptions["GroupUUIDs"][] = $oP8Group->UUID;
				}
			}

			if ($this->oP8ContactsDecorator->CreateContact($aContactOptions, $oP8User->EntityId))
			{
				$this->oMigrationLog->CurContactId = $aListItem['id'];
				file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
				$bResult = true;
			}
		}

		return $bResult;
	}

	public function CompanyAtmailToP8($aListItem, \Aurora\Modules\Core\Classes\User $oP8User)
	{
		$bResult = false;

		$oP8NewCompany = [
			"UUID"				=> "",
			"Name"				=> $aListItem['UserFirstName'],
			"IsOrganization"	=> "1",
			"Email"				=> $aListItem['UserEmail'],
			"Country"			=> $aListItem['UserHomeCountry'],
			"City"				=> $aListItem['UserHomeCity'],
			"Company"			=> $aListItem['UserFirstName'],
			"Fax"				=> $aListItem['UserHomeFax'],
			"Phone"				=> $aListItem['UserHomePhone'],
			"State"				=> $aListItem['UserHomeState'],
			"Street"			=> $aListItem['UserHomeAddress'],
			"Web"				=> $aListItem['UserURL'],
			"Zip"				=> $aListItem['UserHomeZip'],
			"Contacts"			=> []
		];
		$oP8Company = $this->oP8ContactsDecorator->GetGroupByName($aListItem['UserFirstName'], $oP8User->EntityId);
		if ($oP8Company instanceof \Aurora\Modules\Contacts\Classes\Group)
		{
			\Aurora\System\Api::Log("Company already exists: " . $aListItem['UserFirstName'], \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			$bResult = true;

		}
		$sP8CompanyContactUUID = $this->oP8ContactsDecorator->CreateGroup($oP8NewCompany, $oP8User->EntityId);
		if (!$sP8CompanyContactUUID)
		{
			\Aurora\System\Api::Log("Error while Company contact creation: " . $aListItem['UserFirstName'], \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			$this->Escape();
		}
		else
		{
			$this->oMigrationLog->CurContactId = $aListItem['id'];
			file_put_contents($this->sMigrationLogFile, json_encode($this->oMigrationLog));
			$bResult = true;
		}

		return $bResult;
	}

	public function getAtmailUserContactItemsCountByEmail($sEmail)
	{
		$iResult = 0;

		try
		{
			$sGetContactsQuery = "SELECT
					count(*)
				FROM Abook
				WHERE Account = '%s'
				AND Global = 0";
			$stmt = $this->oAtmailPDO->prepare(sprintf($sGetContactsQuery, $sEmail));
			$stmt->execute();
			$iResult = (int) $stmt->fetchColumn();
		}
		catch (Exception $e)
		{
			\Aurora\System\Api::Log("Error getting contacts count. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			$this->Escape();
		}

		return $iResult;
	}

	public function getAtmailUserContactItemsByEmail($sEmail, $iLimit = 0, $iOffset = 0)
	{
		try
		{
			$sGetContactsQuery = "SELECT
					id,
					Account,
					UserFirstName,
					UserLastName,
					UserTitle,
					UserEmail,
					UserHomeAddress,
					UserHomeCity,
					UserHomeState,
					UserHomeZip,
					UserHomeCountry,
					UserURL,
					UserHomeFax,
					UserHomePhone,
					UserHomeMobile,
					UserEmail2,
					UserWorkCompany,
					UserWorkTitle,
					UserWorkDept,
					UserWorkOffice,
					UserWorkAddress,
					UserWorkCity,
					UserWorkState,
					UserWorkZip,
					UserWorkCountry,
					UserWorkFax,
					UserWorkPhone,
					UserEmail3,
					UserInfo,
					isCompany,
					UserDOB
				FROM Abook
				WHERE Account = '%s'
				AND Global = 0
				ORDER BY id
				LIMIT {$iLimit}
				OFFSET {$iOffset}";
			$stmt = $this->oAtmailPDO->prepare(sprintf($sGetContactsQuery, $sEmail));
			$stmt->execute();
			$aResult = $stmt->fetchAll();
		}
		catch (Exception $e)
		{
			\Aurora\System\Api::Log("Error getting contacts. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			$this->Escape();
		}

		return $aResult;
	}

	public function getAtmailGroupContactsByEmail($sEmail)
	{
		try
		{
			$sGetGroupContactsQuery = "SELECT
					GroupName
				FROM AbookGroupNames
				WHERE Account =  '%s' ";
			$stmt = $this->oAtmailPDO->prepare(sprintf($sGetGroupContactsQuery, $sEmail));
			$stmt->execute();
			$aResult = $stmt->fetchAll();
		}
		catch (Exception $e)
		{
			\Aurora\System\Api::Log("Error getting Group contacts. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			$this->Escape();
		}

		return $aResult;
	}

	public function getGroupsForContact($iAtmailContactId, $sEmail)
	{
		$aResult = [];

		try
		{
			$sGetGroupContactsQuery = "SELECT
					AbookGroupNames.GroupName
				FROM AbookGroup
				JOIN AbookGroupNames ON AbookGroup.GroupID = AbookGroupNames.id
				WHERE AbookID = %d
				AND AbookGroup.Account = '%s' ";
			$stmt = $this->oAtmailPDO->prepare(sprintf($sGetGroupContactsQuery, $iAtmailContactId, $sEmail));
			$stmt->execute();
			$aResult = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
		}
		catch (Exception $e)
		{
			\Aurora\System\Api::Log("Error getting Groups for contact {$iAtmailContactId} " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			$this->Escape();
		}

		return $aResult;
	}

	public function CreateUserList()
	{
		try
		{
			$sGetUserLIstQuery = "SELECT `Account` FROM `Users`
					ORDER BY `Account`";
			$stmt = $this->oAtmailPDO->prepare($sGetUserLIstQuery);
			$stmt->execute();
			$aUsers = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
			file_put_contents($this->sUserListFile, implode("\r\n", $aUsers));
		}
		catch (Exception $e)
		{
			\Aurora\System\Api::Log("Error creating User list. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
			$this->Escape();
		}
	}

	public function Escape()
	{
		echo 'Exit with error. For more detail see log-file.';
		exit;
	}

	public function Output($sMessage)
	{
		echo  $sMessage . "\n";
	}
}

$oMigration = new AtmailToP8Migration();


if (isset($aOptions["user_list"]))
{
	$oMigration->Init($aOptions);
	$oMigration->CreateUserList();
}
else
{
	try
	{
		$oMigration->Init($aOptions);
		if (!file_exists($oMigration->sUserListFile))
		{
			$oMigration->CreateUserList();
		}
		$oMigration->Start();
	}
	catch (Exception $e)
	{
		\Aurora\System\Api::Log("Exception: " . $e->getMessage() .
			"\nCode: " . $e->getCode() .
			"\nFile: " . $e->getFile() .
			"\nLine: " . $e->getLine() .
			"\n" . $e->getTraceAsString(), \Aurora\System\Enums\LogLevel::Full, 'atmail-');
		$oMigration->Escape();
	}
}
exit("Done");
