'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),

	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js')
;

/**
 * @constructor
 */
function CConfigureAuthenticatorAppPopup()
{
	CAbstractPopup.call(this);
	
	this.sEditVerificator = null;
	this.fSuccessCallback = null;

	this.authenticatorQRCodeUrl = ko.observable('');
	this.authenticatorSecret = ko.observable('');
	this.authenticatorCode = ko.observable('');
	this.authenticatorCodeFocus = ko.observable(false);
	this.saveInProgress = ko.observable(false);
	this.qrCodeIsLoading = ko.observable(false);

	this.saveCommand = Utils.createCommand(this, this.save, function () {
		return Types.isNonEmptyString(this.authenticatorQRCodeUrl())
			&& Types.isNonEmptyString(this.authenticatorSecret())
			&& Types.isNonEmptyString(this.authenticatorCode());
	});
}

_.extendOwn(CConfigureAuthenticatorAppPopup.prototype, CAbstractPopup.prototype);

CConfigureAuthenticatorAppPopup.prototype.PopupTemplate = '%ModuleName%_ConfigureAuthenticatorAppPopup';

CConfigureAuthenticatorAppPopup.prototype.onOpen = function (sEditVerificator, fSuccessCallback)
{
	this.sEditVerificator = sEditVerificator;
	this.fSuccessCallback = fSuccessCallback;
	this.authenticatorQRCodeUrl('');
	this.authenticatorSecret('');
	this.authenticatorCode('');
	this.authenticatorCodeFocus(false);
	this.saveInProgress(false);
	this.qrCodeIsLoading(true);
	this.getAuthenticatorAppData();
};

CConfigureAuthenticatorAppPopup.prototype.getAuthenticatorAppData = function ()
{
	var oParameters = {
		'Password': this.sEditVerificator
	};
	Ajax.send('%ModuleName%', 'RegisterAuthenticatorAppBegin', oParameters, this.onRegisterAuthenticatorAppBeginResponse, this);
};

CConfigureAuthenticatorAppPopup.prototype.onRegisterAuthenticatorAppBeginResponse = function (oResponse)
{
	var oResult = oResponse && oResponse.Result;

	if(oResult && oResult.Secret && oResult.QRcode)
	{
		this.authenticatorQRCodeUrl(oResult.QRcode);
		this.authenticatorSecret(oResult.Secret);
		this.authenticatorCodeFocus(true);
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_WRONG_PASSWORD'));
	}
};

CConfigureAuthenticatorAppPopup.prototype.save = function ()
{
	if (Types.isNonEmptyString(this.authenticatorCode()))
	{
		var oParameters = {
			'Password': this.sEditVerificator,
			'Code': this.authenticatorCode(),
			'Secret': this.authenticatorSecret()
		};
		this.saveInProgress(true);
		Ajax.send('%ModuleName%', 'RegisterAuthenticatorAppFinish', oParameters, this.onRegisterAuthenticatorAppFinishResponse, this);
	}
};

CConfigureAuthenticatorAppPopup.prototype.onRegisterAuthenticatorAppFinishResponse = function (Response)
{
	this.saveInProgress(false);
	if(Response && Response.Result)
	{
		if (_.isFunction(this.fSuccessCallback))
		{
			this.fSuccessCallback();
		}
		this.closePopup();
	}
	else
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_WRONG_CODE'));
	}
};

module.exports = new CConfigureAuthenticatorAppPopup();
