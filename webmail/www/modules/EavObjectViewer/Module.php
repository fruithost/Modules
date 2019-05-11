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
				$sTemplateContent = file_get_contents($this->GetPath().'/templates/Index.html');
				$sTemplateContent = str_replace('%MODULE_PATH%', 'modules/EavObjectViewer', $sTemplateContent);
				
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
		$oManagerApi = \Aurora\System\Managers\Eav::getInstance();

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

						if ($_POST['EntityId'])
						{
							$oObject->EntityId = (int)$_POST['EntityId'];

							foreach ($aViewProperties as $property)
							{
								if (!empty($_POST[$property]))
								{
									$oObject->{$property} = $_POST[$property];
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

				case 'delete':
					$result = $oManagerApi->deleteEntity($_POST['EntityId']);
					break;

				case 'delete_multiple':
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
					if (isset($_POST['ObjectName']))
					{
						$aResultItems = array();

						$sObjectType = 	str_replace('_', '\\', $_POST['ObjectName']);
						$oEntity = new $sObjectType('Core');
						
						$aFilters = array();
						if (!empty($_POST['searchField']))
						{
							if ($oEntity->isStringAttribute($_POST['searchField']))
							{
								$aFilters = [$_POST['searchField'] => ['%'.$_POST['searchText'].'%', 'LIKE']];
							}
							else if ($oEntity->getType($_POST['searchField']) === 'int')
							{
								$aFilters = [$_POST['searchField'] => [(int)$_POST['searchText'], '=']];
							}
						}
						
						$aItems = $oManagerApi->getEntities(
							$sObjectType, 
							array(), 
							0, 
							99, 
							$aFilters,
							array(), 
							\Aurora\System\Enums\SortOrder::ASC
						);

						if (is_array($aItems))
						{
							$aAttributes = $oManagerApi->getAttributesNamesByEntityType($sObjectType);
							
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
								foreach ($aAttributes as $sAttribute)
								{
									if (isset($oItem->{$sAttribute}))
									{
										$aResultItems['Fields'][$sAttribute] = $oItem->getType($sAttribute);
										if ($sObjectType === 'Aurora\Modules\StandardAuth\Classes\Account') 
										{
											$aResultItem[$sAttribute] = htmlspecialchars($oItem->{$sAttribute});
										}
										else
										{
											$aResultItem[$sAttribute] = $oItem->{$sAttribute};
										}
									}
									else
									{
										$aResultItems['Fields'][$sAttribute] = 'string';
										$aResultItem[$sAttribute] = '';
									}
									
								}
								$aResultItems['Values'][] = $aResultItem;
							}

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