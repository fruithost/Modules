<?php
namespace Aurora\Modules\Min;

require_once dirname(__file__)."/../../system/autoload.php";
\Aurora\System\Api::Init(true);

class SelfDestructingMinHashes
{
	private $oPDO;
	private $oDBPrefix;

	public function __construct()
	{
		$this->oPDO = \Aurora\System\Api::GetPDO();
		$oSettings = \Aurora\System\Api::GetSettings();
		$this->oDBPrefix = $oSettings->DBPrefix;
	}

	public static function NewInstance()
	{
		return new self();
	}

	public function Execute()
	{
		\Aurora\System\Api::Log('---------- Start SelfDestructingMinHashes cron script', \Aurora\System\Enums\LogLevel::Full, 'cron-');
		$iTime = \time();
		$sDelMinHashesQuery = "DELETE FROM `{$this->oDBPrefix}min_hashes`
			WHERE expire_date <= {$iTime}
				AND expire_date IS NOT NULL
		";

		try
		{
			$this->oPDO->exec($sDelMinHashesQuery);
		}
		catch(Exception $e)
		{
			\Aurora\System\Api::Log("Error during SelfDestructingMinHashes cron script execution. ", \Aurora\System\Enums\LogLevel::Full, 'cron-');
		}

		\Aurora\System\Api::Log('---------- End SelfDestructingMinHashes cron script', \Aurora\System\Enums\LogLevel::Full, 'cron-');
	}
}

$iTimer = microtime(true);

SelfDestructingMinHashes::NewInstance()->Execute();

\Aurora\System\Api::Log('Cron SelfDestructingMinHashes execution time: '.(microtime(true) - $iTimer).' sec.', \Aurora\System\Enums\LogLevel::Full, 'cron-');
