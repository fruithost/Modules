<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\Contacts\Classes\Csv;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @internal
 * 
 * @package Contacts
 * @subpackage Helpers
 */
class Parser
{
	protected $aContainer;

	protected $aMap;

	public function __construct()
	{
		$this->aContainer = array();

		$this->aMap = array(
			'tokens' => array(
				'Title' => 'Title',
				'First Name' => 'FirstName',
				'FirstName' => 'FirstName',
				'First' => 'FirstName',
				'Middle Name' => '',
				'MiddleName' => '',
				'Last Name' => 'LastName',
				'LastName' => 'LastName',
				'Last' => 'LastName',
				'FullName' => 'FullName',
				'Full Name' => 'FullName',
				'EmailDisplayName' => 'FullName',
				'Email Display Name' => 'FullName',
				'DisplayName' => 'FullName',
				'Display Name' => 'FullName',
				'Name' => 'FullName',
				'NickName' => 'NickName',
				'Nick Name' => 'NickName',
				'Company' => 'BusinessCompany',
				'Department' => 'BusinessDepartment',
				'Job Title' => 'BusinessJobTitle',
				'Business Email' => 'BusinessEmail',
				'Business E-mail' => 'BusinessEmail',
				'Business Web' => 'BusinessWeb',
				'Business Web Page' => 'BusinessWeb',
				'Business Website' => 'BusinessWeb',
				'Business Street' => 'BusinessAddress',
				'Business City' => 'BusinessCity',
				'Business State' => 'BusinessState',
				'Business Postal Code' => 'BusinessZip',
				'Business Country' => 'BusinessCountry',
				'Business Fax' => 'BusinessFax',
				'Business Phone' => 'BusinessPhone',
				'Home Street' => 'PersonalAddress',
				'Home Address' => 'PersonalAddress',
				'Home City' => 'PersonalCity',
				'Home State' => 'PersonalState',
				'Home Postal Code' => 'PersonalZip',
				'Home Country' => 'PersonalCountry',
				'Home Fax' => 'PersonalFax',
				'Home Phone' => 'PersonalPhone',
				'Mobile Phone' => 'PersonalMobile',
				'Email' => 'PersonalEmail',
				'E-mail' => 'PersonalEmail',
				'E-mail Address' => 'PersonalEmail',
				'Email Address' => 'PersonalEmail',
				'EmailAddress' => 'PersonalEmail',
				'Notes' => 'Notes',
				'Office Location' => 'BusinessOffice',
				'Web Page' => 'PersonalWeb',
				'Web-Page' => 'PersonalWeb',
				'WebPage' => 'PersonalWeb',
				'Personal Website' => 'PersonalWeb',
				'Other Email' => 'OtherEmail',
				'Other E-mail' => 'OtherEmail'
			),

			'tokensWithSpecialTreatmentImport' => array(
				'Date of birth' => 'bdayImportForm',
				'Birthday' => 'bdayImportForm'
			)
		);
	}

	public function reset()
	{
		$this->aContainer = array();
	}

	/**
	 * @param array $aContainer
	 */
	public function setContainer($aContainer)
	{
		$this->aContainer = $aContainer;
	}

	/**
	 * @return array
	 */
	public function getParameters()
	{
		$aResult = array();
		$aLowerTokensMap = array_change_key_case($this->aMap['tokens'], CASE_LOWER);
		$aLowerSpecialMap = array_change_key_case($this->aMap['tokensWithSpecialTreatmentImport'], CASE_LOWER);

		if ($this->aContainer && 0 < count($this->aContainer))
		{
			foreach ($this->aContainer as $sHeaderName => $sValue)
			{
				$sHeaderName = trim($sHeaderName);
				$sValue = trim($sValue);
				if (!empty($sValue))
				{
					if (!empty($aLowerTokensMap[strtolower($sHeaderName)]))
					{
						$aResult[$aLowerTokensMap[strtolower($sHeaderName)]] = $sValue;
					}
					else if (!empty($aLowerSpecialMap[strtolower($sHeaderName)]))
					{
						$sFunctionName = $aLowerSpecialMap[strtolower($sHeaderName)];
						$mFuncResult = call_user_func_array(
							array(&$this, $sFunctionName), array($sHeaderName, $sValue)
						);

						if (is_array($mFuncResult) && 0 < count($mFuncResult))
						{
							foreach ($mFuncResult as $sKey => $mResult)
							{
								if (!empty($mResult))
								{
									$aResult[$sKey] = $mResult;
								}
							}
						}
					}
				}
			}
		}

		return $aResult;
	}

	/**
	 * @param string $sToken
	 * @param string $sTokenValue
	 *
	 * @return array
	 */
	protected function bdayImportForm($sToken, $sTokenValue)
	{
		$aReturn = $aExplodeArray = array();
		if (false !== strpos($sTokenValue, '-'))
		{
			$aExplodeArray = explode('-', $sTokenValue, 3);
		}
		else if (false !== strpos($sTokenValue, '.'))
		{
			$aExplodeArray = explode('.', $sTokenValue, 3);
		}
		else if (false !== strpos($sTokenValue, '/'))
		{
			$aExplodeArray = explode('/', $sTokenValue, 3);
		}

		if (3 === count($aExplodeArray))
		{
			$iYear = $iDay = 0;
			if (4 === strlen($aExplodeArray[0]))
			{
				$iYear = (int) $aExplodeArray[0];
				$iDay = (int) $aExplodeArray[2];
			}
			else
			{
				$iYear = (int) $aExplodeArray[2];
				$iDay = (int) $aExplodeArray[0];
			}

			$iMonth = (int) $aExplodeArray[1];

			if (checkdate($iMonth, $iDay, $iYear))
			{
				$aReturn['BirthDay'] = $iDay;
				$aReturn['BirthMonth'] = $iMonth;
				$aReturn['BirthYear'] = $iYear;
			}
		}

		return $aReturn;
	}
}