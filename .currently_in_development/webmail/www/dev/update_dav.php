<?php
/*
 * Update dav-tables from v1.8 to v3.2
 *  example "http://your-webmail-v8-domain/dev/update_dav.php?pass=12345"
 */
set_time_limit(0);
$sPassword = "";
if (PHP_SAPI !== 'cli' && !(isset($_GET['pass']) && $sPassword !== '' && $sPassword === $_GET['pass']))
{
	exit("Update script password is incorrect or not set.");
}
require_once "../system/autoload.php";
\Aurora\System\Api::Init(true);
function myErrorHandler($errno, $errstr, $errfile, $errline)
{
	$sErrorMessage = "[{$errno}] {$errstr} in {$errfile}  on line {$errline}";
	echo $sErrorMessage;
	\Aurora\System\Api::Log($sErrorMessage, \Aurora\System\Enums\LogLevel::Full, 'update-');
	return false;
}
set_error_handler("myErrorHandler");

class Update
{
	public $oPDO = false;
	public $oSettings = false;
	public $oCoreDecorator = null;

	public function Init()
	{
		\Aurora\System\Api::Log("Update DAV: Init ", \Aurora\System\Enums\LogLevel::Full, 'update-');
		$this->oPDO = \Aurora\System\Api::GetPDO();
		if (!$this->oPDO instanceof \PDO)
		{
			\Aurora\System\Api::Log("Error during connection to p8 DB.", \Aurora\System\Enums\LogLevel::Full, 'update-');
			exit("Error during connection to 8 DB.");
		}
		$this->oSettings = \Aurora\System\Api::GetSettings();
		$this->oCoreDecorator = \Aurora\System\Api::GetModuleDecorator('Core');
	}

	public function Start()
	{
		\Aurora\System\Api::Log("Update DAV: Start ", \Aurora\System\Enums\LogLevel::Full, 'update-');
		if (PHP_SAPI !== 'cli')
		{
			echo "<pre>";
		}
		$this->Migrate20();
		$this->Migrate21();
		$this->Migrate30();
		$this->Migrate32();
		$this->UpgradePrincipals();
		$this->MigratePublicCalendars();
	}

	public function UpgradeDAVData(\Aurora\Modules\Core\Classes\User $oUser, $CalendarName)
	{
		$oDBPrefix = $this->oSettings->DBPrefix;
		try
		{
			$sCalendarCheckPrincipal = "SELECT count(*)
					FROM `{$oDBPrefix}adav_{$CalendarName}`
					WHERE `principaluri` = 'principals/{$oUser->PublicId}'";
			$stmt = $this->oPDO->prepare($sCalendarCheckPrincipal);
			$stmt->execute();
			$iCheckPrincipal = (int) $stmt->fetchColumn();

			if ($iCheckPrincipal > 0)
			{//remove old email-principals if exists
				$sCalendarRemovePrincipal = "DELETE
					FROM `{$oDBPrefix}adav_{$CalendarName}`
					WHERE `principaluri` = 'principals/{$oUser->PublicId}'";
				$stmt = $this->oPDO->prepare($sCalendarRemovePrincipal);
				$stmt->execute();
			}
			$sCalendarUpdateQuery = "UPDATE `{$oDBPrefix}adav_{$CalendarName}`
					SET `principaluri`= 'principals/{$oUser->PublicId}'
					WHERE `principaluri` = 'principals/{$oUser->UUID}'";
			$stmt = $this->oPDO->prepare($sCalendarUpdateQuery);
			$stmt->execute();
			$stmt->closeCursor();
		}
		catch(Exception $e)
		{
			\Aurora\System\Api::Log("Error during data update process. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'update-');
			return false;
		}
		return true;
	}

	public function UpgradePrincipals()
	{
		\Aurora\System\Api::Log("Update DAV: Upgrade principals", \Aurora\System\Enums\LogLevel::Full, 'update-');
		foreach (['calendarinstances', 'addressbooks'] as $tablename)
		{
			echo "\nStart UpgradePrincipals in {$tablename} table\n";
			\Aurora\System\Api::Log("Start UpgradePrincipals  in {$tablename} table", \Aurora\System\Enums\LogLevel::Full, 'update-');
			$oDBPrefix = $this->oSettings->DBPrefix;
			try
			{
				$sGetUsersPrincipalsQuery = "SELECT principaluri FROM `{$oDBPrefix}adav_{$tablename}`";
				$stmt = $this->oPDO->prepare($sGetUsersPrincipalsQuery);
				$stmt->execute();
				$aUsersPrincipals = $stmt->fetchAll(PDO::FETCH_COLUMN);
				$stmt->closeCursor();
			}
			catch(Exception $e)
			{
				\Aurora\System\Api::Log("Error during update process. " .  $e->getMessage(), \Aurora\System\Enums\LogLevel::Full, 'update-');
				return false;
			}
			$aProcessedPrincipals = [];
			foreach ($aUsersPrincipals as $UserPrincipal)
			{
				if (!in_array($UserPrincipal, $aProcessedPrincipals))
				{
					$aProcessedPrincipals[] = $UserPrincipal;
					$UserUUID = str_replace('principals/', '', $UserPrincipal);
					$oUsers = $this->oCoreDecorator->GetUserByUUID($UserUUID);
					if ($oUsers instanceof \Aurora\Modules\Core\Classes\User)
					{
						$bResult = $this->UpgradeDAVData($oUsers, $tablename);
						if ($bResult)
						{
							echo "User data updated successfully. {$oUsers->PublicId}\n";
							\Aurora\System\Api::Log("User data updated successfully. {$oUsers->PublicId}", \Aurora\System\Enums\LogLevel::Full, 'update-');
							ob_flush();
							flush();
						}
						else
						{
							echo "Error during update process. {$oUsers->PublicId}\n";
							\Aurora\System\Api::Log("Error during update process. {$oUsers->PublicId}", \Aurora\System\Enums\LogLevel::Full, 'update-');
							ob_flush();
							flush();
						}
					}
					else
					{
						echo "Can't find user with UUID:  {$UserUUID}\n";
						\Aurora\System\Api::Log("Can't find user with UUID:  {$UserUUID}", \Aurora\System\Enums\LogLevel::Full, 'update-');
						ob_flush();
						flush();
					}
				}
			}
		}
	}

	public function Migrate20()
	{
		\Aurora\System\Api::Log("Update DAV: Migrate20 ", \Aurora\System\Enums\LogLevel::Full, 'update-');
		$pdo = $this->oPDO;
		$prefix = $this->oSettings->DBPrefix . "adav_";
		$dbname = $this->oSettings->DBName;
		$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

		$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

		switch($driver) {
			case 'mysql' :
				echo "Detected MySQL.\n";
				break;
			case 'sqlite' :
				echo "Detected SQLite.\n";
				break;
			default :
				echo "Error: unsupported driver: " . $driver . "\n";
				die(-1);
		}

		foreach(['calendar', 'addressbook'] as $itemType) {

			$tableName = $prefix . $itemType . 's';
			$tableNameOld = $tableName . '_old' . mt_rand(1000,9999);
			$changesTable = $prefix . $itemType . 'changes';

			echo "Upgrading '$tableName'\n";

			// The only cross-db way to do this, is to just fetch a single record.
			$row = $pdo->query("SELECT * FROM $tableName LIMIT 1")->fetch();

			if (!$row) {

				echo "No records were found in the '$tableName' table.\n";
				echo "\n";
				echo "We're going to rename the old table to $tableNameOld (just in case).\n";
				echo "and re-create the new table.\n";

				switch($driver) {

					case 'mysql' :
						$pdo->exec("RENAME TABLE $tableName TO $tableNameOld");
						switch($itemType) {
							case 'calendar' :
								$pdo->exec("
									CREATE TABLE {$prefix}calendars (
										id INT(11) UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
										principaluri VARCHAR(100),
										displayname VARCHAR(100),
										uri VARCHAR(200),
										synctoken INT(11) UNSIGNED NOT NULL DEFAULT '1',
										description TEXT,
										calendarorder INT(11) UNSIGNED NOT NULL DEFAULT '0',
										calendarcolor VARCHAR(10),
										timezone TEXT,
										components VARCHAR(20),
										transparent TINYINT(1) NOT NULL DEFAULT '0',
										UNIQUE(principaluri, uri)
									) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
								");
								break;
							case 'addressbook' :
								$pdo->exec("
									CREATE TABLE {$prefix}addressbooks (
										id INT(11) UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
										principaluri VARCHAR(255),
										displayname VARCHAR(255),
										uri VARCHAR(200),
										description TEXT,
										synctoken INT(11) UNSIGNED NOT NULL DEFAULT '1',
										UNIQUE(principaluri, uri)
									) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
								");
								break;
						}
					break;

					case 'sqlite' :

						$pdo->exec("ALTER TABLE $tableName RENAME TO $tableNameOld");

						switch($itemType) {
							case 'calendar' :
								$pdo->exec("
									CREATE TABLE {$prefix}calendars (
										id integer primary key asc,
										principaluri text,
										displayname text,
										uri text,
										synctoken integer,
										description text,
										calendarorder integer,
										calendarcolor text,
										timezone text,
										components text,
										transparent bool
									);
								");
								break;
							case  'addressbook' :
								$pdo->exec("
									CREATE TABLE {$prefix}addressbooks (
										id integer primary key asc,
										principaluri text,
										displayname text,
										uri text,
										description text,
										synctoken integer
									);
								");
								break;
						}
					break;
				}
				echo "Creation of 2.0 $tableName table is complete\n";
			} else {

				// Checking if there's a synctoken field already.
				if (array_key_exists('synctoken', $row)) {
					echo "The 'synctoken' field already exists in the $tableName table.\n";
					echo "It's likely you already upgraded, so we're simply leaving\n";
					echo "the $tableName table alone\n";
				} else {
					echo "1.8 table schema detected\n";
					switch($driver) {

						case 'mysql' :
							$pdo->exec("ALTER TABLE $tableName ADD synctoken INT(11) UNSIGNED NOT NULL DEFAULT '1'");
							$pdo->exec("ALTER TABLE $tableName DROP ctag");
							$pdo->exec("UPDATE $tableName SET synctoken = '1'");
							break;
						case 'sqlite' :
							$pdo->exec("ALTER TABLE $tableName ADD synctoken integer");
							$pdo->exec("UPDATE $tableName SET synctoken = '1'");
							echo "Note: there's no easy way to remove fields in sqlite.\n";
							echo "The ctag field is no longer used, but it's kept in place\n";
							break;
					}
					echo "Upgraded '$tableName' to 2.0 schema.\n";
				}
			}
			try {
				$pdo->query("SELECT * FROM $changesTable LIMIT 1");

				echo "'$changesTable' already exists. Assuming that this part of the\n";
				echo "upgrade was already completed.\n";
			} catch (Exception $e) {
				echo "Creating '$changesTable' table.\n";
				switch($driver) {
					case 'mysql' :
						$pdo->exec("
							CREATE TABLE $changesTable (
								id INT(11) UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
								uri VARCHAR(200) NOT NULL,
								synctoken INT(11) UNSIGNED NOT NULL,
								{$itemType}id INT(11) UNSIGNED NOT NULL,
								operation TINYINT(1) NOT NULL,
								INDEX {$itemType}id_synctoken ({$itemType}id, synctoken)
							) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
						");
						break;
					case 'sqlite' :
						$pdo->exec("
							CREATE TABLE $changesTable (
								id integer primary key asc,
								uri text,
								synctoken integer,
								{$itemType}id integer,
								operation bool
							);
						");
						$pdo->exec("CREATE INDEX {$itemType}id_synctoken ON $changesTable ({$itemType}id, synctoken);");
						break;
				}
			}
		}
		try {
			$pdo->query("SELECT * FROM {$prefix}calendarsubscriptions LIMIT 1");

			echo "'calendarsubscriptions' already exists. Assuming that this part of the\n";
			echo "upgrade was already completed.\n";
		} catch (Exception $e) {
			echo "Creating calendarsubscriptions table.\n";
			switch($driver) {

				case 'mysql' :
					$pdo->exec("
						CREATE TABLE {$prefix}calendarsubscriptions (
							id INT(11) UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
							uri VARCHAR(200) NOT NULL,
							principaluri VARCHAR(100) NOT NULL,
							source TEXT,
							displayname VARCHAR(100),
							refreshrate VARCHAR(10),
							calendarorder INT(11) UNSIGNED NOT NULL DEFAULT '0',
							calendarcolor VARCHAR(10),
							striptodos TINYINT(1) NULL,
							stripalarms TINYINT(1) NULL,
							stripattachments TINYINT(1) NULL,
							lastmodified INT(11) UNSIGNED,
							UNIQUE(principaluri, uri)
						);
					");
					break;
				case 'sqlite' :
					$pdo->exec("
						CREATE TABLE {$prefix}calendarsubscriptions (
							id integer primary key asc,
							uri text,
							principaluri text,
							source text,
							displayname text,
							refreshrate text,
							calendarorder integer,
							calendarcolor text,
							striptodos bool,
							stripalarms bool,
							stripattachments bool,
							lastmodified int
						);
					");

					$pdo->exec("CREATE INDEX principaluri_uri ON {$prefix}calendarsubscriptions (principaluri, uri);");
					break;
			}
		}
		try {
			$pdo->query("SELECT * FROM {$prefix}propertystorage LIMIT 1");
			echo "'propertystorage' already exists. Assuming that this part of the\n";
			echo "upgrade was already completed.\n";
		} catch (Exception $e) {
			echo "Creating propertystorage table.\n";
			switch($driver) {

				case 'mysql' :
					$pdo->exec("
						CREATE TABLE  IF NOT EXISTS {$prefix}propertystorage (
							id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
							path VARBINARY(1024) NOT NULL,
							name VARBINARY(100) NOT NULL,
							value MEDIUMBLOB
						);
					");
					$pdo->exec("
						CREATE UNIQUE INDEX path_property ON {$prefix}propertystorage (path(600), name(100));
									");
									break;
								case 'sqlite' :
									$pdo->exec("
						CREATE TABLE {$prefix}propertystorage (
							id integer primary key asc,
							path TEXT,
							name TEXT,
							value TEXT
						);
					");
					$pdo->exec("
						CREATE UNIQUE INDEX path_property ON {$prefix}propertystorage (path, name);
					");
					break;
			}
		}
		echo "Upgrading cards table to 2.0 schema\n";

		try {
			$create = false;
			$row = $pdo->query("SELECT * FROM {$prefix}cards LIMIT 1")->fetch();
			if (!$row) {
				echo "There was no data in the cards table, so we're re-creating it\n";
				echo "The old table will be renamed to cards_old, just in case.\n";

				$create = true;
				switch($driver) {
					case 'mysql' :
						$pdo->exec("RENAME TABLE {$prefix}cards TO {$prefix}cards_old");
						break;
					case 'sqlite' :
						$pdo->exec("ALTER TABLE {$prefix}cards RENAME TO {$prefix}cards_old");
						break;
				}
			}
		} catch (Exception $e) {
			echo "Exception while checking cards table. Assuming that the table does not yet exist.\n";
			$create = true;
		}
		if ($create) {
			switch($driver) {
				case 'mysql' :
					$pdo->exec("
						CREATE TABLE IF NOT EXISTS {$prefix}cards (
							id INT(11) UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
							addressbookid INT(11) UNSIGNED NOT NULL,
							carddata MEDIUMBLOB,
							uri VARCHAR(200),
							lastmodified INT(11) UNSIGNED,
							etag VARBINARY(32),
							size INT(11) UNSIGNED NOT NULL
						) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
					");
					break;

				case 'sqlite' :
					$pdo->exec("
						CREATE TABLE {$prefix}cards (
							id integer primary key asc,
							addressbookid integer,
							carddata blob,
							uri text,
							lastmodified integer
							etag text,
							size integer
						);
					");
					break;
			}
		} else {
			switch($driver) {
				case 'mysql' :
					$row = (int) $pdo->query("SELECT count(*)
						FROM information_schema.COLUMNS
						WHERE
							TABLE_SCHEMA = '{$dbname}'
						AND TABLE_NAME = '{$prefix}cards'
						AND COLUMN_NAME = 'etag'
					")->fetchColumn();
					if (!$row)
					{
						$pdo->exec("
							ALTER TABLE {$prefix}cards
							ADD etag VARBINARY(32);
						");
					}
					$row = (int) $pdo->query("SELECT count(*)
						FROM information_schema.COLUMNS
						WHERE
							TABLE_SCHEMA = '{$dbname}'
						AND TABLE_NAME = '{$prefix}cards'
						AND COLUMN_NAME = 'size'
					")->fetchColumn();
					if (!$row)
					{
						$pdo->exec("
							ALTER TABLE {$prefix}cards
							ADD size INT(11) UNSIGNED NOT NULL;
						");
					}
					break;
				case 'sqlite' :
					$pdo->exec("
						ALTER TABLE {$prefix}cards ADD etag text;
						ALTER TABLE {$prefix}cards ADD size integer;
					");
					break;
			}
			echo "Reading all old vcards and populating etag and size fields.\n";
			$result = $pdo->query('SELECT id, carddata FROM ' . $prefix . 'cards');
			$stmt = $pdo->prepare('UPDATE ' . $prefix . 'cards SET etag = ?, size = ? WHERE id = ?');
			while($row = $result->fetch(\PDO::FETCH_ASSOC)) {
				$stmt->execute([
					md5($row['carddata']),
					strlen($row['carddata']),
					$row['id']
				]);
			}
		}
		echo "Upgrade to 2.0 schema completed.\n\n";
		ob_flush();
		flush();
	}

	public function Migrate21()
	{
		\Aurora\System\Api::Log("Update DAV: Migrate21 ", \Aurora\System\Enums\LogLevel::Full, 'update-');
		$pdo = $this->oPDO;
		$prefix = $this->oSettings->DBPrefix . "adav_";
		$dbname = $this->oSettings->DBName;
		$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

		$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

		switch($driver) {

			case 'mysql' :
				echo "Detected MySQL.\n";
				break;
			case 'sqlite' :
				echo "Detected SQLite.\n";
				break;
			default :
				echo "Error: unsupported driver: " . $driver . "\n";
				die(-1);
		}

		echo "Upgrading '{$prefix}calendarobjects'\n";
		$addUid = false;
		try {
			$result = $pdo->query('SELECT * FROM ' . $prefix . 'calendarobjects LIMIT 1');
			$row = $result->fetch(\PDO::FETCH_ASSOC);

			if (!$row) {
				echo "No data in table. Going to try to add the uid field anyway.\n";
				$addUid = true;
			} elseif (array_key_exists('uid', $row)) {
				echo "uid field exists. Assuming that this part of the migration has\n";
				echo "Already been completed.\n";
			} else {
				echo "2.0 schema detected.\n";
				$addUid = true;
			}

		} catch (Exception $e) {
			echo "Could not find a calendarobjects table. Skipping this part of the\n";
			echo "upgrade.\n";
		}

		if ($addUid) {

			switch($driver) {
				case 'mysql' :
					$row = (int) $pdo->query("SELECT count(*)
						FROM information_schema.COLUMNS
						WHERE
							TABLE_SCHEMA = '{$dbname}'
						AND TABLE_NAME = '{$prefix}calendarobjects'
						AND COLUMN_NAME = 'uid'
					")->fetchColumn();
					if (!$row)
					{
						$pdo->exec('ALTER TABLE ' . $prefix . 'calendarobjects ADD uid VARCHAR(200)');
					}
					break;
				case 'sqlite' :
					$pdo->exec('ALTER TABLE ' . $prefix . 'calendarobjects ADD uid TEXT');
					break;
			}

			$result = $pdo->query('SELECT id, calendardata FROM ' . $prefix . 'calendarobjects');
			$stmt = $pdo->prepare('UPDATE ' . $prefix . 'calendarobjects SET uid = ? WHERE id = ?');
			$counter = 0;

			while($row = $result->fetch(\PDO::FETCH_ASSOC)) {

				try {
					$vobj = \Sabre\VObject\Reader::read($row['calendardata']);
				} catch (\Exception $e) {
					echo "Warning! Item with id $row[id] could not be parsed!\n";
					continue;
				}
				$uid = null;
				$item = $vobj->getBaseComponent();
				if (!isset($item->UID)) {
					echo "Warning! Item with id $item[id] does NOT have a UID property and this is required.\n";
					continue;
				}
				$uid = (string)$item->UID;
				$stmt->execute([$uid, $row['id']]);
				$counter++;

			}

		}

		echo "Creating 'schedulingobjects'\n";

		switch($driver) {

			case 'mysql' :
				$pdo->exec('CREATE TABLE IF NOT EXISTS ' . $prefix . 'schedulingobjects
					(
						id INT(11) UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
						principaluri VARCHAR(255),
						calendardata MEDIUMBLOB,
						uri VARCHAR(200),
						lastmodified INT(11) UNSIGNED,
						etag VARCHAR(32),
						size INT(11) UNSIGNED NOT NULL
					) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
				');
				break;


			case 'sqlite' :
				$pdo->exec('CREATE TABLE IF NOT EXISTS ' . $prefix . 'schedulingobjects (
						id integer primary key asc,
						principaluri text,
						calendardata blob,
						uri text,
						lastmodified integer,
						etag text,
						size integer
					)
				');
				break;
				$pdo->exec('
					CREATE INDEX principaluri_uri ON ' . $prefix . 'calendarsubscriptions (principaluri, uri);
				');
				break;
		}
		echo "Done.\n";
		echo "Upgrade to 2.1 schema completed.\n\n";
		ob_flush();
		flush();
	}

	public function Migrate30()
	{
		\Aurora\System\Api::Log("Update DAV: Migrate30 ", \Aurora\System\Enums\LogLevel::Full, 'update-');
		$pdo = $this->oPDO;
		$prefix = $this->oSettings->DBPrefix . "adav_";
		$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

		$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

		switch($driver) {

			case 'mysql' :
				echo "Detected MySQL.\n";
				break;
			case 'sqlite' :
				echo "Detected SQLite.\n";
				break;
			default :
				echo "Error: unsupported driver: " . $driver . "\n";
				die(-1);
		}

		echo "Upgrading 'propertystorage'\n";
		$addValueType = false;
		try {
			$result = $pdo->query('SELECT * FROM ' . $prefix . 'propertystorage LIMIT 1');
			$row = $result->fetch(\PDO::FETCH_ASSOC);

			if (!$row) {
				echo "No data in table. Going to re-create the table.\n";
				$random = mt_rand(1000,9999);
				echo "Renaming propertystorage -> propertystorage_old$random and creating new table.\n";

				switch($driver) {

					case 'mysql' :
						$pdo->exec('RENAME TABLE ' . $prefix . 'propertystorage TO ' . $prefix . 'propertystorage_old' . $random);
						$pdo->exec('
							CREATE TABLE ' . $prefix . 'propertystorage (
								id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
								path VARBINARY(1024) NOT NULL,
								name VARBINARY(100) NOT NULL,
								valuetype INT UNSIGNED,
								value MEDIUMBLOB
							);
						');
						$pdo->exec('CREATE UNIQUE INDEX path_property_' . $random . '  ON ' . $prefix . 'propertystorage (path(600), name(100));');
						break;
					case 'sqlite' :
						$pdo->exec('ALTER TABLE ' . $prefix . 'propertystorage RENAME TO propertystorage_old' . $random);
						$pdo->exec('
						CREATE TABLE ' . $prefix . 'propertystorage (
							id integer primary key asc,
							path text,
							name text,
							valuetype integer,
							value blob
						);');

						$pdo->exec('CREATE UNIQUE INDEX path_property_' . $random . ' ON ' . $prefix . 'propertystorage (path, name);');
						break;

				}
			} elseif (array_key_exists('valuetype', $row)) {
				echo "valuetype field exists. Assuming that this part of the migration has\n";
				echo "Already been completed.\n";
			} else {
				echo "2.1 schema detected. Going to perform upgrade.\n";
				$addValueType = true;
			}

		} catch (Exception $e) {
			echo "Could not find a propertystorage table. Skipping this part of the\n";
			echo "upgrade.\n";
			echo $e->getMessage(), "\n";
		}

		if ($addValueType) {
			switch($driver) {
				case 'mysql' :
					$pdo->exec('ALTER TABLE ' . $prefix . 'propertystorage ADD valuetype INT UNSIGNED');
					break;
				case 'sqlite' :
					$pdo->exec('ALTER TABLE ' . $prefix . 'propertystorage ADD valuetype INT');

					break;
			}
			$pdo->exec('UPDATE ' . $prefix . 'propertystorage SET valuetype = 1 WHERE valuetype IS NULL ');
		}
		echo "Migrating vcardurl\n";
		try {
			$result = $pdo->query('SELECT id, uri, vcardurl FROM ' . $prefix . 'principals WHERE vcardurl IS NOT NULL');
			$stmt1 = $pdo->prepare('INSERT INTO ' . $prefix . 'propertystorage (path, name, valuetype, value) VALUES (?, ?, 3, ?)');

			while($row = $result->fetch(\PDO::FETCH_ASSOC)) {
				// Inserting the new record
				$stmt1->execute([
					'addressbooks/' . basename($row['uri']),
					'{http://calendarserver.org/ns/}me-card',
					serialize(new Sabre\DAV\Xml\Property\Href($row['vcardurl']))
				]);

				echo serialize(new Sabre\DAV\Xml\Property\Href($row['vcardurl']));
			}
		} catch (Exception $e) {
			echo "Can't migrate vcardurl";
		}
		echo "Done.\n";
		echo "Upgrade to 3.0 schema completed.\n\n";
		ob_flush();
		flush();
	}

	public function Migrate32()
	{
		\Aurora\System\Api::Log("Update DAV: Migrate32 ", \Aurora\System\Enums\LogLevel::Full, 'update-');
		$backupPostfix = time();
		$pdo = $this->oPDO;
		$prefix = $this->oSettings->DBPrefix . "adav_";
		$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

		$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
		switch ($driver) {
			case 'mysql' :
				echo "Detected MySQL.\n";
				break;
			case 'sqlite' :
				echo "Detected SQLite.\n";
				break;
			default :
				echo "Error: unsupported driver: " . $driver . "\n";
				die(-1);
		}
		echo "Creating 'calendarinstances'\n";

		try {
			$result = $pdo->query("SELECT * FROM ".$prefix."calendarinstances LIMIT 1");
			$result->fetch(\PDO::FETCH_ASSOC);
			echo "calendarinstances exists. Assuming this part of the migration has already been done.\n";
		} catch (Exception $e) {
			echo "calendarinstances does not yet exist. Creating table and migrating data.\n";

			switch ($driver) {
				case 'mysql' :
					$pdo->exec("
						CREATE TABLE ".$prefix."calendarinstances (
							id INTEGER UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
							calendarid INTEGER UNSIGNED NOT NULL,
							principaluri VARBINARY(100),
							access TINYINT(1) NOT NULL DEFAULT '1' COMMENT '1 = owner, 2 = read, 3 = readwrite',
							displayname VARCHAR(100),
							uri VARBINARY(200),
							description TEXT,
							calendarorder INT(11) UNSIGNED NOT NULL DEFAULT '0',
							calendarcolor VARBINARY(10),
							timezone TEXT,
							transparent TINYINT(1) NOT NULL DEFAULT '0',
							share_href VARBINARY(100),
							share_displayname VARCHAR(100),
							share_invitestatus TINYINT(1) NOT NULL DEFAULT '2' COMMENT '1 = noresponse, 2 = accepted, 3 = declined, 4 = invalid',
							public TINYINT(1) NOT NULL DEFAULT '0',
							UNIQUE(principaluri, uri),
							UNIQUE(calendarid, principaluri),
							UNIQUE(calendarid, share_href)
						) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
						"
					);
					$pdo->exec("
						INSERT INTO ".$prefix."calendarinstances
							(
								calendarid,
								principaluri,
								access,
								displayname,
								uri,
								description,
								calendarorder,
								calendarcolor,
								transparent
							)
						SELECT
							id,
							principaluri,
							1,
							displayname,
							uri,
							description,
							calendarorder,
							calendarcolor,
							transparent
						FROM ".$prefix."calendars
						");
					break;
				case 'sqlite' :
					$pdo->exec("
						CREATE TABLE ".$prefix."calendarinstances (
							id integer primary key asc NOT NULL,
							calendarid integer,
							principaluri text,
							access integer COMMENT '1 = owner, 2 = read, 3 = readwrite' NOT NULL DEFAULT '1',
							displayname text,
							uri text NOT NULL,
							description text,
							calendarorder integer,
							calendarcolor text,
							timezone text,
							transparent bool,
							share_href text,
							share_displayname text,
							share_invitestatus integer DEFAULT '2',
							UNIQUE (principaluri, uri),
							UNIQUE (calendarid, principaluri),
							UNIQUE (calendarid, share_href)
						);
						"
					);
					$pdo->exec("
						INSERT INTO ".$prefix."calendarinstances
							(
								calendarid,
								principaluri,
								access,
								displayname,
								uri,
								description,
								calendarorder,
								calendarcolor,
								transparent
							)
						SELECT
							id,
							principaluri,
							1,
							displayname,
							uri,
							description,
							calendarorder,
							calendarcolor,
							transparent
						FROM ".$prefix."calendars
						");
					break;
			}
		}
		try {
			$result = $pdo->query("SELECT * FROM ".$prefix."calendars LIMIT 1");
			$row = $result->fetch(\PDO::FETCH_ASSOC);

			if (!$row) {
				echo "Source table is empty.\n";
				$migrateCalendars = true;
			}

			$columnCount = is_array($row) ? count($row) : 0;
			if ($columnCount === 3) {
				echo "The calendars table has 3 columns already. Assuming this part of the migration was already done.\n";
				$migrateCalendars = false;
			} else {
				echo "The calendars table has " . $columnCount . " columns.\n";
				$migrateCalendars = true;
			}

		} catch (Exception $e) {
			echo "calendars table does not exist. This is a major problem. Exiting.\n";
			exit(-1);
		}

		if ($migrateCalendars) {
			$calendarBackup = 'calendars_3_1_' . $backupPostfix;
			echo "Backing up 'calendars' to '", $calendarBackup, "'\n";
			switch ($driver) {
				case 'mysql' :
					$pdo->exec("RENAME TABLE ".$prefix."calendars TO " . $calendarBackup);
					break;
				case 'sqlite' :
					$pdo->exec("ALTER TABLE ".$prefix."calendars RENAME TO " . $calendarBackup);
					break;
			}
			echo "Creating new calendars table.\n";
			switch ($driver) {
				case 'mysql' :
					$pdo->exec("
						CREATE TABLE ".$prefix."calendars (
							id INTEGER UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
							synctoken INTEGER UNSIGNED NOT NULL DEFAULT '1',
							components VARBINARY(21)
						) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
						"
					);
					break;
				case 'sqlite' :
					$pdo->exec("
						CREATE TABLE ".$prefix."calendars (
							id integer primary key asc NOT NULL,
							synctoken integer DEFAULT 1 NOT NULL,
							components text NOT NULL
						);
						"
					);
					break;
			}
			echo "Migrating data from old to new table\n";

			$pdo->exec("
				INSERT INTO ".$prefix."calendars (id, synctoken, components) SELECT id, synctoken, COALESCE(components,\"VEVENT,VTODO,VJOURNAL\") as components FROM $calendarBackup
				"
			);
		}
		echo "Upgrade to 3.2 schema completed.\n\n";
		ob_flush();
		flush();
	}

	public function MigratePublicCalendars()
	{
		\Aurora\System\Api::Log("Update DAV: Public calendars migration started", \Aurora\System\Enums\LogLevel::Full, 'update-');
		echo "Public calendars migration started.\n";
		\Aurora\System\Api::Log("Public calendars migration.", \Aurora\System\Enums\LogLevel::Full, 'update-');
		$prefix = $this->oSettings->DBPrefix;
		$dbname = $this->oSettings->DBName;
		$oCalendarModuleDecorator = \Aurora\System\Api::GetModuleDecorator('Calendar');
		//check if 'calendarshares' table xists
		$sCheckCalendarsharesQuery = "
			SELECT 1
				FROM INFORMATION_SCHEMA.TABLES
				WHERE TABLE_TYPE='BASE TABLE'
				AND TABLE_SCHEMA = '{$dbname}'
				AND TABLE_NAME='{$prefix}adav_calendarshares'
		";
		$row = (int) $this->oPDO->query($sCheckCalendarsharesQuery)->fetchColumn();
		if (!$row)
		{
			\Aurora\System\Api::Log("Skip public calendars migration. '{$prefix}adav_calendarshares' table or view not found.", \Aurora\System\Enums\LogLevel::Full, 'update-');
			echo "Skip public calendars migration. '{$prefix}adav_calendarshares' table or view not found.\n";
			ob_flush();
			flush();
			return false;
		}
		$sSelectAllSharedCalendarsQuery = "
			SELECT
				{$prefix}adav_calendarshares.*,
				{$prefix}adav_calendarshares.principaluri AS member_principal,
				calendarinstances.uri AS calendar_uri,
				calendarinstances.principaluri AS owner_principaluri
			FROM {$prefix}adav_calendarshares
			LEFT JOIN {$prefix}adav_calendarinstances AS calendarinstances on calendarinstances.id = {$prefix}adav_calendarshares.calendarid
			WHERE {$prefix}adav_calendarshares.principaluri IS NOT NULL
		";

		$stmt = $this->oPDO->prepare($sSelectAllSharedCalendarsQuery);
		$stmt->execute();
		$aSharedCalendars = $stmt->fetchAll(PDO::FETCH_ASSOC);
		foreach ($aSharedCalendars as $aSharedCalendar)
		{
			$sUserPublicId = str_replace('principals/', '', $aSharedCalendar['member_principal']);
			$sOwnerPublicId = str_replace('principals/', '', $aSharedCalendar['owner_principaluri']);
			$sCalendarUri = $aSharedCalendar['calendar_uri'];
			$oOwner = $this->oCoreDecorator->GetUserByPublicId($sOwnerPublicId);
			if ($oOwner instanceof \Aurora\Modules\Core\Classes\User)
			{
				if ($sUserPublicId === 'caldav_public_user@localhost')
				{//publick
					$oCalendarModuleDecorator->UpdateCalendarPublic(
						$sCalendarUri,
						true,
						$oOwner->EntityId
					);
				}
			}
		}
		\Aurora\System\Api::Log("Update DAV: Public calendars migrated", \Aurora\System\Enums\LogLevel::Full, 'update-');
		echo "Public calendars migrated\n";
		\Aurora\System\Api::Log("Public calendars migrated", \Aurora\System\Enums\LogLevel::Full, 'update-');
		ob_flush();
		flush();
	}
}
ob_start();
$oUpdate = new Update();

try
{
	$oUpdate->Init();
	$oUpdate->Start();
}
catch (Exception $e)
{
	echo "Exception: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine();
	\Aurora\System\Api::Log("Exception: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine(), \Aurora\System\Enums\LogLevel::Full, 'update-');
	exit();
}

ob_end_flush();
exit("Done");
