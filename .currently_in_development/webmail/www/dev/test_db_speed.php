<?php
$iteration_count = 70;

require_once "../system/autoload.php";
\Aurora\System\Api::Init(true);
echo "start";
$oP8Settings = \Aurora\System\Api::GetSettings();
$oP8DBLogin = $oP8Settings->GetConf('DBLogin');
$oP8DBPassword = $oP8Settings->GetConf('DBPassword');
$oP8DBName = $oP8Settings->GetConf('DBName');
$oP8DBPrefix = $oP8Settings->GetConf('DBPrefix');
$oP8DBHost = $oP8Settings->GetConf('DBHost');

$sDbPort = '';
$sUnixSocket = '';
$iPos = strpos($oP8DBHost, ':');
if (false !== $iPos && 0 < $iPos)
{
	$sAfter = substr($oP8DBHost, $iPos + 1);
	$sP8DBHost = substr($oP8DBHost, 0, $iPos);

	if (is_numeric($sAfter))
	{
		$sDbPort = $sAfter;
	}
	else
	{
		$sUnixSocket = $sAfter;
	}
}
$oP8PDO = @new \PDO('mysql:dbname=' . $oP8DBName .
	(empty($sP8DBHost) ? '' : ';host='.$sP8DBHost).
	(empty($sDbPort) ? '' : ';port='.$sDbPort).
	(empty($sUnixSocket) ? '' : ';unix_socket='.$sUnixSocket), $oP8DBLogin, $oP8DBPassword);

$oP8PDO->exec("CREATE TABLE  IF NOT EXISTS speed_test (
		`id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
		`indexid` INT(11) UNSIGNED NOT NULL,
		`data` MEDIUMTEXT NULL,
		`uid` VARCHAR(255) NULL DEFAULT NULL,
		`lastmodified` INT(11) UNSIGNED NULL DEFAULT NULL,
		PRIMARY KEY (`id`),
		INDEX `INDEX_ID` (`indexid`)
	)
	COLLATE='utf8_general_ci'
	ENGINE=InnoDB
	AUTO_INCREMENT=4
");
$oP8PDO->exec("CREATE TABLE  IF NOT EXISTS speed_test2 (
		`id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
		`indexid` INT(11) UNSIGNED NOT NULL,
		`data` MEDIUMTEXT NULL,
		`uid` VARCHAR(255) NULL DEFAULT NULL,
		`lastmodified` INT(11) UNSIGNED NULL DEFAULT NULL,
		PRIMARY KEY (`id`),
		INDEX `INDEX_ID` (`indexid`)
	)
	COLLATE='utf8_general_ci'
	ENGINE=MyISAM
	AUTO_INCREMENT=4
");

$data = "BEGIN:VCARD
	VERSION:3.0
	PRODID:-//Sabre//Sabre VObject 4.1.6//EN
	UID:4ba12441-3380-47de-aca6-9bb1e0fdb111
	FN:123
	N:;;;;;
	X-OFFICE:
	X-USE-FRIENDLY-NAME:1
	TITLE:
	NICKNAME:
	NOTE:
	ORG:;
	END:VCARD
	";
\Aurora\System\Api::Log("Start InnoDB", \Aurora\System\Enums\LogLevel::Full, 'speed-test-');
for ($i = 0; $i < $iteration_count; $i++)
{
	$sInsertDataQuery = "";
	\Aurora\System\Api::Log(" Generate query: " . ($i + 1), \Aurora\System\Enums\LogLevel::Full, 'speed-test-');
	for ($j = 0; $j < 1000; $j++)
	{
		$indexid = rand(0, 100);
		$uid = md5((string) $indexid);
		$lastmodified = time();
		$sInsertDataQuery .= "INSERT INTO `speed_test` (indexid, data, uid, lastmodified) VALUES ({$indexid}, '{$data}', '{$uid}', {$lastmodified});\n";
	}
	\Aurora\System\Api::Log("  Start insert for query: " . ($i + 1), \Aurora\System\Enums\LogLevel::Full, 'speed-test-');
	if ($sInsertDataQuery !== '')
	{
		$oP8PDO->exec($sInsertDataQuery);
	}
	\Aurora\System\Api::Log("  End insert for query: " . ($i + 1), \Aurora\System\Enums\LogLevel::Full, 'speed-test-');
}
\Aurora\System\Api::Log("End InnoDB", \Aurora\System\Enums\LogLevel::Full, 'speed-test-');

\Aurora\System\Api::Log("Start MyISAM", \Aurora\System\Enums\LogLevel::Full, 'speed-test-');
for ($i = 0; $i < $iteration_count; $i++)
{
	$sInsertDataQuery = "";
	\Aurora\System\Api::Log(" Generate query: " . ($i + 1), \Aurora\System\Enums\LogLevel::Full, 'speed-test-');
	for ($j = 0; $j < 1000; $j++)
	{
		$indexid = rand(0, 100);
		$uid = md5((string) $indexid);
		$lastmodified = time();
		$sInsertDataQuery .= "INSERT INTO `speed_test2` (indexid, data, uid, lastmodified) VALUES ({$indexid}, '{$data}', '{$uid}', {$lastmodified});\n";
	}
	\Aurora\System\Api::Log("  Start insert for query: " . ($i + 1), \Aurora\System\Enums\LogLevel::Full, 'speed-test-');
	if ($sInsertDataQuery !== '')
	{
		$oP8PDO->exec($sInsertDataQuery);
	}
	\Aurora\System\Api::Log("  End insert for query: " . ($i + 1), \Aurora\System\Enums\LogLevel::Full, 'speed-test-');
}
\Aurora\System\Api::Log("End MyISAM", \Aurora\System\Enums\LogLevel::Full, 'speed-test-');
echo "\nend";