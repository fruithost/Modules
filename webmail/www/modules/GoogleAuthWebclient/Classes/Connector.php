<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\GoogleAuthWebclient\Classes;

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
	public $Name = 'google';

	public function CreateClient($sId, $sSecret, $sScope = '')
	{
		$sRedirectUrl = rtrim(\MailSo\Base\Http::SingletonInstance()->GetFullUrl(), '\\/ ').'/?oauth='.$this->Name;

		$oClient = new \oauth_client_class;
		$oClient->offline = true;
		$oClient->debug = self::$Debug;
		$oClient->debug_http = self::$Debug;
		$oClient->server = 'Google';
		$oClient->redirect_uri = $sRedirectUrl;
		$oClient->client_id = $sId;
		$oClient->client_secret = $sSecret;
		$oClient->scope = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive';
		return $oClient;
	}

	public function Init($Id, $sSecret, $sScope = '')
	{
		$mResult = false;

		$oClient = $this->CreateClient($Id, $sSecret, $sScope);
		if($oClient)
		{
			$oUser = null;
			if(($bSuccess = $oClient->Initialize()))
			{
				if(($bSuccess = $oClient->Process()))
				{
					if(strlen($oClient->access_token))
					{
						$bSuccess = $oClient->CallAPI(
							'https://www.googleapis.com/oauth2/v1/userinfo',
							'GET',
							array(),
							array(
								'FailOnAccessError' => true
							),
							$oUser
						);
					}
					else
					{
						$oClient->error = $oClient->authorization_error;
						$bSuccess = false;
					}
				}
				$bSuccess = $oClient->Finalize($bSuccess);
			}

			if($oClient->exit)
			{
				exit;
			}

			if($bSuccess && $oUser)
			{
				$iExpiresIn = 3600;
				$dAccessTokenExpiry = new \DateTime($oClient->access_token_expiry);
				$mResult = array(
					'type' => $this->Name,
					'id' => $oUser->id,
					'name' => $oUser->name,
					'email' => isset($oUser->email) ? $oUser->email : '',
					'access_token' => \json_encode(array(
						'access_token' => $oClient->access_token,
						'created' => ($dAccessTokenExpiry->getTimestamp() - $iExpiresIn),
						'expires_in' => $iExpiresIn
					)),
					'refresh_token' => $oClient->refresh_token,
					'scopes' => \explode('|', $sScope)
				);
			}
			else
			{
				$mResult = false;

				$oClient->ResetAccessToken();
			}
		}
		
		return $mResult;
	}
}