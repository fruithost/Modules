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
		
		$oEavManager = new \Aurora\System\Managers\Eav('MongoDb');
		foreach ($aResult as $aDownload)
		{
			$oSale = new \Aurora\Modules\SaleObjects\Classes\Sale('Sales');
			
			$oSale->ProductUUID = '';
			$oSale->CustomerUUID = '';
			$oSale->Date = $aDownload['download_date'];
			$oSale->Price = 0;
			
			$oSale->{'Sales::DownloadId'} = $aDownload['download_id'];
			$oSale->{'Sales::Referer'} = $aDownload['referer'];
			$oSale->{'Sales::Ip'} = $aDownload['ip'];
			$oSale->{'Sales::Gad'} = $aDownload['gad']; 
			$oSale->{'Sales::ProductVersion'} = $aDownload['product_version']; 
			$oSale->{'Sales::LicenseType'} = $aDownload['license_type']; 
			$oSale->{'Sales::ReferrerPage'} = $aDownload['referrer_page']; 
			$oSale->{'Sales::IsUpgrade'} = $aDownload['is_upgrade'];
			$oSale->{'Sales::PlatformType'} = $aDownload['platform_type'];			
			$oSale->{'Sales::Deleted'} = false;			

			$oEavManager->createEntity($oSale);
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
