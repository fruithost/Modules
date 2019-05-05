'use strict';

var
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	ModuleErrors = require('%PathToCoreWebclientModule%/js/ModuleErrors.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	Api = {}
;

/**
 * @param {Object} oResponse
 * @param {string=} sDefaultError
 * @param {boolean=} bNotHide = false
 */
Api.showErrorByCode = function (oResponse, sDefaultError, bNotHide)
{
	var
		iErrorCode = oResponse.ErrorCode,
		sResponseError = oResponse.ErrorMessage || '',
		sResultError = ModuleErrors.getErrorMessage(oResponse) || ''
	;
	
	if (sResultError === '')
	{
		switch (iErrorCode)
		{
			default:
				sResultError = sDefaultError || TextUtils.i18n('%MODULENAME%/ERROR_UNKNOWN');
				break;
			case Enums.Errors.AuthError:
				sResultError = TextUtils.i18n('%MODULENAME%/ERROR_PASS_INCORRECT');
				break;
			case Enums.Errors.DataBaseError:
				sResultError = TextUtils.i18n('%MODULENAME%/ERROR_DATABASE');
				break;
			case Enums.Errors.LicenseProblem:
				sResultError = TextUtils.i18n('%MODULENAME%/ERROR_INVALID_LICENSE');
				break;
			case Enums.Errors.LicenseLimit:
				sResultError = TextUtils.i18n('%MODULENAME%/ERROR_LICENSE_USERS_LIMIT');
				break;
			case Enums.Errors.DemoLimitations:
				sResultError = TextUtils.i18n('%MODULENAME%/INFO_DEMO_THIS_FEATURE_IS_DISABLED');
				break;
			case Enums.Errors.Captcha:
				sResultError = TextUtils.i18n('%MODULENAME%/ERROR_CAPTCHA_IS_INCORRECT');
				break;
			case Enums.Errors.AccessDenied:
				break;
			case Enums.Errors.UserAlreadyExists:
				sResultError = TextUtils.i18n('%MODULENAME%/ERROR_USER_ALREADY_EXISTS');
				break;
			case Enums.Errors.CanNotChangePassword:
				sResultError = TextUtils.i18n('%MODULENAME%/ERROR_UNABLE_CHANGE_PASSWORD');
				break;
			case Enums.Errors.AccountOldPasswordNotCorrect:
				sResultError = TextUtils.i18n('%MODULENAME%/ERROR_CURRENT_PASSWORD_NOT_CORRECT');
				break;
			case Enums.Errors.AccountAlreadyExists:
				sResultError = TextUtils.i18n('%MODULENAME%/ERROR_ACCOUNT_ALREADY_EXISTS');
				break;
			case Enums.Errors.HelpdeskUserNotExists:
				sResultError = TextUtils.i18n('%MODULENAME%/ERROR_FORGOT_NO_HELPDESK_ACCOUNT');
				break;
			case Enums.Errors.DataTransferFailed:
				sResultError = TextUtils.i18n('%MODULENAME%/ERROR_DATA_TRANSFER_FAILED');
				break;
			case Enums.Errors.NotDisplayedError:
				sResultError = '';
				break;
			case Enums.Errors.SystemNotConfigured:
				sResultError = TextUtils.i18n('%MODULENAME%/ERROR_SYSTEM_NOT_CONFIGURED');
				break;
		}
	}
	
	if (sResultError !== '')
	{
		if (sResponseError !== '')
		{
			sResultError += ' (' + sResponseError + ')';
		}
		Screens.showError(sResultError, !!bNotHide);
	}
	else if (sResponseError !== '')
	{
		Screens.showError(sResponseError);
	}
};

module.exports = Api;
