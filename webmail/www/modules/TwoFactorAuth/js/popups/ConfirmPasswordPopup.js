'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js')
;

/**
 * @constructor
 */
function CConfirmPasswordPopup()
{
	CAbstractPopup.call(this);

	this.fSuccessCallback = null;
	this.password = ko.observable('');
	this.passwordFocus = ko.observable(true);
	this.inProgress = ko.observable(false);
}

_.extendOwn(CConfirmPasswordPopup.prototype, CAbstractPopup.prototype);

CConfirmPasswordPopup.prototype.PopupTemplate = '%ModuleName%_ConfirmPasswordPopup';

CConfirmPasswordPopup.prototype.onOpen = function (fSuccessCallback)
{
	this.fSuccessCallback = fSuccessCallback;
	this.password('');
	this.passwordFocus(true);
};

CConfirmPasswordPopup.prototype.verifyPassword = function ()
{
	var oParameters = {
		'Password': this.password()
	};
	this.inProgress(true);
	Ajax.send('%ModuleName%', 'VerifyPassword', oParameters, this.onVerifyPasswordResponse, this);
};

CConfirmPasswordPopup.prototype.onVerifyPasswordResponse = function (oResponse)
{
	this.inProgress(false);
	if (oResponse && oResponse.Result)
	{
		if (_.isFunction(this.fSuccessCallback))
		{
			this.fSuccessCallback(this.password());
		}
		this.closePopup();
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_WRONG_PASSWORD'));
	}
};

module.exports = new CConfirmPasswordPopup();
