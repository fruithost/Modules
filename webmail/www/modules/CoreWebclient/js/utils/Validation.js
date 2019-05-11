'use strict';

var
	_ = require('underscore'),
	
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	ValidationUtils = {}
;

ValidationUtils.checkIfFieldsEmpty = function (aRequiredFields, sErrorText)
{
	var koFirstEmptyField = _.find(aRequiredFields, function (koField) {
		return koField() === '';
	});
	
	if (koFirstEmptyField)
	{
		if (sErrorText)
		{
			Screens.showError(sErrorText);
		}
		koFirstEmptyField.focused(true);
		return false;
	}
	
	return true;
};

ValidationUtils.checkPassword = function (sNewPass, sConfirmPassword)
{
	var
		TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
		Settings = require('modules/%ModuleName%/js/Settings.js'),
		bPasswordValid = false
	;
	
	if (sConfirmPassword !== sNewPass)
	{
		Screens.showError(TextUtils.i18n('COREWEBCLIENT/ERROR_PASSWORDS_DO_NOT_MATCH'));
	}
	else if (Settings.PasswordMinLength > 0 && sNewPass.length < Settings.PasswordMinLength) 
	{ 
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_PASSWORD_TOO_SHORT').replace('%N%', Settings.PasswordMinLength));
	}
	else if (Settings.PasswordMustBeComplex && (!sNewPass.match(/([0-9])/) || !sNewPass.match(/([!,%,&,@,#,$,^,*,?,_,~])/)))
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_PASSWORD_TOO_SIMPLE'));
	}
	else
	{
		bPasswordValid = true;
	}
	
	return bPasswordValid;
};

module.exports = ValidationUtils;
