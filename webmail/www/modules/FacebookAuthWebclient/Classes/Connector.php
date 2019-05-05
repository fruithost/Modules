<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\FacebookAuthWebclient\Classes;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Classes
 * @subpackage AuthIntegrator
 */
class Connector extends \Aurora\Modules\OAuthIntegratorWebclient\Classes\Connector
{
	protected $Name = 'facebook';
	
	public function CreateClient($sId, $sSecret, $sScope)
	{
		$sRedirectUrl = \rtrim(\MailSo\Base\Http::SingletonInstance()->GetFullUrl(), '\\/ ').'/?oauth='.$this->Name;
		if (!\strpos($sRedirectUrl, '://localhost'))
		{
			$sRedirectUrl = \str_replace('http:', 'https:', $sRedirectUrl);
		}

		$oClient = new \oauth_client_class;
		$oClient->debug = self::$Debug;
		$oClient->debug_http = self::$Debug;
		$oClient->server = 'Facebook';
		$oClient->redirect_uri = $sRedirectUrl;
		$oClient->client_id = $sId;
		$oClient->client_secret = $sSecret;
		$oClient->scope = 'email';
			
		$oOAuthIntegratorWebclientModule = \Aurora\System\Api::GetModule('OAuthIntegratorWebclient');
		if ($oOAuthIntegratorWebclientModule)
		{
			$oClient->configuration_file = $oOAuthIntegratorWebclientModule->GetPath() .'/classes/OAuthClient/'.$oClient->configuration_file;
		}
		
		return $oClient;
	}
	
	public function Init($sId, $sSecret, $sScope = '')
	{
		$mResult = false;

		$oClient = $this->CreateClient($sId, $sSecret, $sScope);
		if($oClient)
		{
			$oUser = null;
			if(($success = $oClient->Initialize()))
			{
				if(($success = $oClient->Process()))
				{
					if (\strlen($oClient->access_token))
					{
						$success = $oClient->CallAPI(
							'https://graph.facebook.com/me',
							'GET',
							array(),
							array(
								'FailOnAccessError' => true
							),
							$oUser
						);
					}
				}

				$success = $oClient->Finalize($success);
			}

			if($oClient->exit)
			{
				exit;
			}

			if ($success && $oUser)
			{
				$mResult = array(
					'type' => $this->Name,
					'id' => $oUser->id,
					'name' => $oUser->name,
					'email' => isset($oUser->email) ? $oUser->email : '',
					'access_token' => $oClient->access_token,
					'scopes' => \explode('|', $sScope)
				);
			}
			else
			{
				$oClient->ResetAccessToken();
				$mResult = false;
			}
		}
		
		return $mResult;
	}}