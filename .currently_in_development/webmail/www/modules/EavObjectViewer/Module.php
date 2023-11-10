<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\EavObjectViewer;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	public function init() 
	{
		$this->AddEntry('eav-viewer', 'EntryEavObjectViewer');
		$this->AddEntry('eav-viewer-action', 'EntryEavObjectViewerAction');
	}
	
	public function EntryEavObjectViewer()
	{
		$bIsAdmin = false;
		try
		{
			\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);
			$bIsAdmin = true;
		}
		catch (\Aurora\System\Exceptions\ApiException $oEcxeption) {}
		
		if ($bIsAdmin)
		{
			$oCoreClientModule = \Aurora\System\Api::GetModule('CoreWebclient');
			if ($oCoreClientModule instanceof \Aurora\System\Module\AbstractModule) 
			{
				$sTemplateContent = file_get_contents($this->GetPath().'/dist/index.html');
				//$sTemplateContent = '<div src="/app.js"></div>';
				$sTemplateContent = str_replace('src=css', 'src=modules/EavObjectViewer/dist/css', $sTemplateContent);
				$sTemplateContent = str_replace('src=/js', 'src=modules/EavObjectViewer/dist/js', $sTemplateContent);
				$sTemplateContent = str_replace('href=/js', 'href=modules/EavObjectViewer/dist/js', $sTemplateContent);
				$sTemplateContent = str_replace('href=/css', 'href=modules/EavObjectViewer/dist/css', $sTemplateContent);
				
				// var_dump($sTemplateContent);
				// exit;
				
				return $sTemplateContent;
			}
		}
		else
		{
			echo "Auth Error!";
		}
	}
	
	public function EntryEavObjectViewerAction()
	{
		if (isset($_SERVER['HTTP_ORIGIN'])) {
		  // Decide if the origin in $_SERVER['HTTP_ORIGIN'] is one
		  // you want to allow, and if so:
		  header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
		  header('Access-Control-Allow-Credentials: true');
		}

		if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		  if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
			// may also be using PUT, PATCH, HEAD etc
			header('Access-Control-Allow-Methods: GET, POST, OPTIONS');         
		  }
		  
		  if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
			header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
		  }

		  exit(0);
		}
		
		$bIsAdmin = false;
		try
		{
			\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);
			$bIsAdmin = true;
		}
		catch (\Aurora\System\Exceptions\ApiException $oEcxeption) {}
		
		if (!$bIsAdmin) {
			exit;
		}
		$oManagerApi = new \Aurora\System\Managers\Eav();
		if (isset($_POST['action']))
		{
			$result = false;
			$response = [];			
			switch ($_POST['action'])
			{
				case 'types':
					$aTypes = array_map(function($sValue) {
						return str_replace('\\', '_', $sValue);
					}, $oManagerApi->getTypes());
					$response = [
						'error' => false,
						'message'=> '',
						'result' => $aTypes
					];			
					break;
				case 'edit':
					if ($_POST['ObjectName'])
					{
						$sObjectType = str_replace('_', '\\', $_POST['ObjectName']);

						$oObject = \Aurora\System\EAV\Entity::createInstance($sObjectType);

						$aMap = $oObject->getMap();

						$aViewProperties = array_keys($aMap);

						if ($_POST['properties'])
						{
							$properties = json_decode($_POST['properties']);
							
							if (isset($properties->EntityId))
							{
								$oObject->EntityId = (int)$properties->EntityId;

								foreach ($aViewProperties as $propertyName)
								{
									// if (!empty($_POST[$property]))
									if (isset($properties->{$propertyName}))
									{
										$oObject->{$propertyName} = $properties->{$propertyName};
									}
								}
							}
						}

						if (isset($_POST['@DisabledModules'])) 
						{
							$oObject->{'@DisabledModules'} = $_POST['@DisabledModules'];
						}

						$result = $oManagerApi->saveEntity($oObject);

						if ($result) 
						{
							$response['error'] = false;
							$response['message'] = '';
						}
					}
					break;

				// case 'delete':
					// $result = $oManagerApi->deleteEntity($_POST['EntityId']);
					// break;

				// case 'delete_multiple':
				case 'delete':
					if ($_POST['ids'])
					{
						$aIds = explode(',', $_POST['ids']);
					}
					$result = true;

					foreach ($aIds as $id) 
					{
						if (!$oManagerApi->deleteEntity((int)$id))
						{
							$result = false;
						}
					}

					if ($result) 
					{
						$response['error'] = false;
						$response['message'] = '';
					}
					break;

				case 'list':
					$sObjectName = isset($_POST['ObjectName']) ? (string)$_POST['ObjectName'] : '';
					if ($sObjectName)
					{
						$iOffset = (int)$_POST['offset'];
						$iLimit = (int)$_POST['limit'];
						
						$aResultItems = array();

						$sObjectType = 	str_replace('_', '\\', $sObjectName);
						$oEntity = new $sObjectType('Core');

						$aFilters = array();
						$sSearchField = $_POST['searchField'];

						if (!empty($sSearchField))
						{
							switch ($oEntity->getType($sSearchField)) {
								case 'string':
									$aFilters = [$sSearchField => ['%'.(string)$_POST['searchText'].'%', 'LIKE']];
									break;
								case 'int':
									$aFilters = [$sSearchField => [(int)$_POST['searchText'], '=']];
									break;
								case 'bigint':
									$aFilters = [$sSearchField => [$_POST['searchText'], '=']];
									break;
								case 'bool':
									$aFilters = [$sSearchField => [(bool)$_POST['searchText'], '=']];
									break;
							}
						}
						
						$aItems = (new \Aurora\System\EAV\Query($sObjectType))
							->where($aFilters)
							->offset($iOffset)
							->limit($iLimit)
							->exec();

						$iItemsCount = (new \Aurora\System\EAV\Query($sObjectType))
							->where($aFilters)
							->count()
							->exec();

						$aAttributes = $oEntity->getAttributes();

						if (is_array($aItems))
						{
							// $aAttributes = $oManagerApi->getAttributesNamesByEntityType($sObjectType);

							
							foreach ($aItems as $oItem)
							{
								$aResultItem = [
									'EntityId' => $oItem->EntityId,
									'UUID' => $oItem->UUID
								];
								$aResultItems['Fields'] = [
									'EntityId' => 'int',
									'UUID' => 'string'
								];
								foreach ($aAttributes as $sAttribute => $oAttribute)
								{
									if (isset($oItem->{$sAttribute}))
									{
										if ($sObjectType === \Aurora\Modules\StandardAuth\Classes\Account::class) 
										{
											$aResultItem[$sAttribute] = htmlspecialchars($oItem->{$sAttribute});
										}
										else
										{
											$aResultItem[$sAttribute] = htmlspecialchars($oItem->{$sAttribute});
										}
									}
									else
									{
										$aResultItem[$sAttribute] = htmlspecialchars($oAttribute->Value);
									}
									
								}
								$aResultItems['Values'][] = $aResultItem;
							}

							$aResultItems['Fields'] = array();

							foreach ($aAttributes as $sAttribute => $oAttribute)
							{
								$aResultItems['Fields'][$sAttribute] = $oAttribute->Type;
							}
							
							$aResultItems['pagination'] = array(
								'total' => $iItemsCount,
								//'per_page' => 2,
								//'current_page' => 1,
								//'last_page' => 2,
								//'next_page_url' => 'asdasd',
								//'prev_page_url' => 'asdasd1',
								'from' => $iOffset,
								'to' => $iOffset + $iLimit
							);

							$response = [
								'error' => false,
								'message'=> '',
								'result' => $aResultItems
							];
						}
					}
					break;
			}
		}		
		
		return json_encode($response, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE);
	}
}