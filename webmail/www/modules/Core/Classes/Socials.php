<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\Core\Classes;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @property int $Id
 * @property int $IdTenant
 * @property bool $SocialAllow
 * @property string $SocialName
 * @property string $SocialId
 * @property string $SocialSecret
 * @property string $SocialApiKey
 * @property string $SocialScopes
 * @property string $SupportedScopes
 * @property string $TranslatedScopes
 * @property bool $HasApiKey
 *
 * @package Classes
 * @subpackage Tenants
 */
class TenantSocials extends \Aurora\System\AbstractContainer
{
	public function __construct()
	{
		parent::__construct(get_class($this), 'Id');

		$this->SetDefaults(array(
			'Id'							=> 0,
			'IdTenant'						=> 0,
			'SocialAllow'					=> false,
			'SocialName'					=> '',
			'SocialId'						=> '',
			'SocialSecret'					=> '',
			'SocialApiKey'					=> null,
			'SocialScopes'					=> '',
			'SupportedScopes'				=> array(),
			'TranslatedScopes'				=> array(),
			'HasApiKey'						=> false
		));
	}

	/**
	 * @return array
	 */
	public function getMap()
	{
		return self::getStaticMap();
	}

	/**
	 * @return array
	 */
	public static function getStaticMap()
	{
		return array(
			'Id'			=> array('int', 'id', false, false),
			'IdTenant'		=> array('int', 'id_tenant', true, false),
			'SocialAllow'	=> array('bool', 'social_allow'),
			'SocialName'	=> array('string', 'social_name'),
			'SocialId'		=> array('string', 'social_id'),
			'SocialSecret'	=> array('string', 'social_secret'),
			'SocialApiKey'	=> array('string', 'social_api_key'),
			'SocialScopes'	=> array('string', 'social_scopes'),
			'SupportedScopes' => array('array'),
			'TranslatedScopes' => array('array'),
			'HasApiKey'		=> array('bool')
		);
	}
	
	/**
	 * @param array $aSocial
	 * 
	 * @return TenantSocials
	 */
	public static function initFromSettings($aSocial)
	{
		$oSocial = new TenantSocials();
		
		if (isset($aSocial['Allow'], $aSocial['Name'], $aSocial['Id'], $aSocial['Secret']))
		{
			$oSocial->SocialAllow = ('on' === strtolower($aSocial['Allow']) || '1' === (string) $aSocial['Allow']);
			$oSocial->SocialName = $aSocial['Name'];
			$oSocial->SocialId = $aSocial['Id'];
			$oSocial->SocialSecret = $aSocial['Secret'];
			$oSocial->SocialApiKey = !empty($aSocial['ApiKey']) ? $aSocial['ApiKey'] : null;
			$oSocial->SocialScopes = !empty($aSocial['Scopes']) ? $aSocial['Scopes'] : '';
		}
		
		return $oSocial;
	}
	
	/**
	 * @return array
	 */
	public function initForSettings()
	{
		$aResult = array(
			'Allow'		=> $this->SocialAllow ? 'On' : 'Off',
			'Name'		=> $this->SocialName,
			'Id'		=> $this->SocialId,
			'Secret'	=> $this->SocialSecret,
			'Scopes'	=> $this->SocialScopes
		);
		if (!empty($this->SocialApiKey))
		{
			$aResult['ApiKey'] = $this->SocialApiKey;
		}
		
		return $aResult;
	}

	public function toArray()
	{
		return array(
			'@Object'	=> 'Object/Aurora\\Modules\\Core\\Classes\\TenantSocials',
			'Id'		=> $this->SocialId,
			'Name'		=> $this->SocialName,
			'LowerName'	=> strtolower($this->SocialName),
			'Allow'		=> $this->SocialAllow,
//			'Secret'	=> $this->SocialSecret,
//			'ApiKey'	=> $this->SocialApiKey,
			'Scopes'	=> 
				array_map(function($sValue){
						return strtolower($sValue);
					}, explode(' ', $this->SocialScopes)	
				)
		);
	}
	
	/**
	 * @param string $sScope
	 *
	 * @return bool
	 */
	public function issetScope($sScope)
	{
		return (false !== strpos(strtolower($this->SocialScopes), strtolower($sScope)));
	}		
	
}
