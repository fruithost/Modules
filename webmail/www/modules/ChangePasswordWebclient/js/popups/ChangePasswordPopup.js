'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	UrlUtils = require('%PathToCoreWebclientModule%/js/utils/Url.js'),
	ValidationUtils = require('%PathToCoreWebclientModule%/js/utils/Validation.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js')
;

/**
 * @constructor
 */
function CChangePasswordPopup()
{
	CAbstractPopup.call(this);
	
	this.currentPassword = ko.observable('');
	this.newPassword = ko.observable('');
	this.confirmPassword = ko.observable('');
	
	this.accountId = ko.observable('');
	this.hasOldPassword = ko.observable(false);
	this.oParams = null;
}

_.extendOwn(CChangePasswordPopup.prototype, CAbstractPopup.prototype);

CChangePasswordPopup.prototype.PopupTemplate = '%ModuleName%_ChangePasswordPopup';

/**
 * @param {Object} oParams
 * @param {String} oParams.sModule
 * @param {boolean} oParams.bHasOldPassword
 * @param {Function} oParams.fAfterPasswordChanged
 */
CChangePasswordPopup.prototype.onOpen = function (oParams)
{
	this.currentPassword('');
	this.newPassword('');
	this.confirmPassword('');
	
	this.accountId(oParams.iAccountId);
	this.hasOldPassword(oParams.bHasOldPassword);
	this.oParams = oParams;
};

CChangePasswordPopup.prototype.change = function ()
{
	var
		sNewPass = $.trim(this.newPassword()),
		sConfirmPassword = $.trim(this.confirmPassword())
	;
	
	if (ValidationUtils.checkPassword(sNewPass, sConfirmPassword))
	{
		this.sendChangeRequest();
	}
};

CChangePasswordPopup.prototype.sendChangeRequest = function ()
{
	var
		oParameters = {
			'AccountId': this.accountId(),
			'CurrentPassword': $.trim(this.currentPassword()),
			'NewPassword': $.trim(this.newPassword())
		},
		oExcept = {
			Module: this.oParams.sModule,
			Method: 'ChangePassword'
		};
	;
	
	Ajax.send(this.oParams.sModule, 'ChangePassword', oParameters, this.onUpdatePasswordResponse, this);
	Ajax.abortAndStopSendRequests(oExcept);
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CChangePasswordPopup.prototype.onUpdatePasswordResponse = function (oResponse, oRequest)
{
	if (oResponse.Result === false)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_PASSWORD_NOT_SAVED'));
		Ajax.startSendRequests();
	}
	else
	{
		if (oResponse.Result && oResponse.Result.RefreshToken)
		{
			$.cookie('AuthToken', oResponse.Result.RefreshToken, { expires: 30 });
			UrlUtils.clearAndReloadLocation(true, false);
		}
		else
		{
			if (this.hasOldPassword())
			{
				Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_PASSWORD_CHANGED'));
			}
			else
			{
				Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_PASSWORD_SET'));
			}

			this.closePopup();

			if ($.isFunction(this.oParams.fAfterPasswordChanged))
			{
				this.oParams.fAfterPasswordChanged();
			}
		}
	}
};

module.exports = new CChangePasswordPopup();
