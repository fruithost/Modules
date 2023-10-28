<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\GoogleAuthWebclient\Classes;

use Exception;

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

	/**
	 *
	 */
	public function CreateClient($sId, $sSecret, $sScopes)
	{
		if (empty($sId) || empty($sSecret))
		{
			throw new \Aurora\Modules\OAuthIntegratorWebclient\Exceptions\NotConfigured(
				\Aurora\Modules\OAuthIntegratorWebclient\Enums\ErrorCodes::NotConfigured
			);
		}
		$oClient = new \oauth_client_class;
		$oClient->offline = true;
		$oClient->debug = self::$Debug;
		$oClient->debug_http = self::$Debug;
		$oClient->server = 'Google';
		$oClient->redirect_uri = $this->GetRedirectUrl();
		$oClient->client_id = $sId;
		$oClient->client_secret = $sSecret;
		$oClient->scope = $sScopes;
		return $oClient;
	}

	public function Init($Id, $sSecret, $aScopes = [])
	{
		$mResult = false;

		$oClient = $this->CreateClient($Id, $sSecret, $aScopes[1]);
		if($oClient)
		{
			$oUser = null;
			if(($bSuccess = $oClient->Initialize()))
			{
				if(($bSuccess = $oClient->Process()))
				{
					if(strlen($oClient->authorization_error))
					{
						$oClient->error = $oClient->authorization_error;
						$bSuccess = false;
					}
					elseif(strlen($oClient->access_token))
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
					'scopes' => \explode('|', $aScopes[0])
				);
			}
			else
			{
				$mResult = [
					'type' => $this->Name,
					'error' => $oClient->error
				];

				$oClient->ResetAccessToken();
			}
		}

		return $mResult;
	}
}