<?php
require_once "../system/autoload.php";
\Aurora\System\Api::Init(true);

class ImportDownloads
{
	public $oPDO = false;

	/**
	* @var \Aurora\Modules\Sales\Module
	*/
	public $oSalesModule = null;
	public $iPageSize = 100;

	public function Init($iPackageSize = 100)
	{
		$this->oPDO = \Aurora\System\Api::GetPDO();
		$this->iPageSize = $iPackageSize;
		$this->oSalesModule = \Aurora\System\Api::GetModule('Sales');
	}

	public function GetDownloadsCount()
	{
		$iDownloadsCount = 0;
				
		$sQuery = "SELECT count(download_id) as count FROM downloads;";
		$stmt = $this->oPDO->prepare($sQuery);
		$stmt->execute();
		$aResult = $stmt->fetch(\PDO::FETCH_ASSOC);
		if (isset($aResult['count']))
		{
			$iDownloadsCount = $aResult['count'];
		}
		
		return $iDownloadsCount;
	}

	public function Start($Page)
	{
		$iPage = $Page - 1;
		$iStart = abs($iPage * $this->iPageSize);		

		$sQuery = "SELECT * FROM downloads LIMIT " . $iStart . ", " . $this->iPageSize . ";";
		$stmt = $this->oPDO->prepare($sQuery);
		$stmt->execute();
		$aResult = $stmt->fetchAll(\PDO::FETCH_ASSOC);
		foreach ($aResult as $aDownload)
		{
			\Aurora\System\Api::Log('START: CreateDownload ['. $aDownload['download_id'] .']', \Aurora\System\Enums\LogLevel::Full, 'import-');
			
			$oResult = $this->oSalesModule->CreateDownload(
				$aDownload['download_id'], 
				$aDownload['product_id'], 
				$aDownload['download_date'], 
				$aDownload['email'], 					
				$aDownload['referer'], 
				$aDownload['ip'], 
				$aDownload['gad'], 
				$aDownload['product_version'], 
				$aDownload['trial_key'], 
				$aDownload['license_type'], 
				$aDownload['referrer_page'], 
				$aDownload['is_upgrade'], 
				$aDownload['platform_type']
			);
			
			$sResult = $oResult ? 'true' : 'false';
			\Aurora\System\Api::Log('END: ' . $sResult, \Aurora\System\Enums\LogLevel::Full, 'import-');
		}
	}


	public function Redirect($iPage)
	{
		$uri_parts = explode('?', $_SERVER['REQUEST_URI'], 2);
		echo '<head>
			<meta http-equiv="refresh" content="1;URL=//' . $_SERVER['SERVER_NAME'] . $uri_parts[0] . '?page=' . $iPage . '"  />
			</head>';
		exit;
	}

	public function Output($sMessage)
	{
		\Aurora\System\Api::Log($sMessage, \Aurora\System\Enums\LogLevel::Full, 'import-');
		echo  $sMessage . "\n";
		ob_flush();
		flush();
	}
}

ob_start();
$oImport = new ImportDownloads();

$iPage = isset($_GET['page']) ? $_GET['page'] : 1;

$oImport->Init(100);
$oImport->Output('INIT');

$iDownloadsCount = $oImport->GetDownloadsCount();

$iNumPages = ceil($iDownloadsCount/$oImport->iPageSize);
if ($iPage <= $iNumPages)
{
	$oImport->Output('Start [Page]: ' . $iPage);
	$oImport->Start($iPage);
	$oImport->Redirect($iPage+1);
}
	
ob_end_flush();
exit("Done");
