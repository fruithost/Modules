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
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	ConvertUtils = require('modules/%ModuleName%/js/utils/Convert.js')
;

/**
 * @constructor
 */
function CCreateSecurityKeyPopup()
{
	CAbstractPopup.call(this);

	this.bSecurityKeysNotSupportedError = !(navigator.credentials && navigator.credentials.create);
	this.bIsHttps = window.location.protocol === 'https:';
	
	this.sEditVerificator = '';
	this.sName = '';
	this.iId = 0;
	this.name = ko.observable('');
	this.nameFocus = ko.observable(true);
	this.saveNameInProgress = ko.observable(false);
	this.securityKeyInProgress = ko.observable(false);
	this.securityKeyError = ko.observable(false);
	this.securityKeyCanceled = ko.observable(false);
	
	this.saveCommand = Utils.createCommand(this, this.save, function () {
		return Types.isNonEmptyString(this.name());
	});
}

_.extendOwn(CCreateSecurityKeyPopup.prototype, CAbstractPopup.prototype);

CCreateSecurityKeyPopup.prototype.PopupTemplate = '%ModuleName%_CreateSecurityKeyPopup';

CCreateSecurityKeyPopup.prototype.onOpen = function (sEditVerificator, fCallback)
{
	this.sEditVerificator = sEditVerificator;
	this.fCallback = fCallback;
	this.registerSecurityKey();
};

CCreateSecurityKeyPopup.prototype.registerSecurityKey = function (oResponse) {
	if (!this.bSecurityKeysNotSupportedError)
	{
		this.iId = 0;
		this.name('');
		this.securityKeyInProgress(true);
		this.securityKeyError(false);
		this.securityKeyCanceled(false);
		Ajax.send('%ModuleName%', 'RegisterSecurityKeyBegin', {
			'Password': this.sEditVerificator
		}, this.onRegisterSecurityKeyBeginResponse, this);
	}
	else
	{
		this.securityKeyInProgress(false);
		this.securityKeyError(true);
	}
};

CCreateSecurityKeyPopup.prototype.onRegisterSecurityKeyBeginResponse = function (oResponse) {
	if (oResponse && oResponse.Result)
	{
		var oCreateArgs = oResponse.Result;
		oCreateArgs.publicKey.challenge = ConvertUtils.base64ToArrayBuffer(oCreateArgs.publicKey.challenge);
		oCreateArgs.publicKey.user.id = ConvertUtils.base64ToArrayBuffer(oCreateArgs.publicKey.user.id);
		navigator.credentials.create(oCreateArgs)
			.then((cred) => {
				var oParams = {
					'Password': this.sEditVerificator,
					'Attestation': {
						'attestationObject': ConvertUtils.arrayBufferToBase64(cred.response.attestationObject),
						'clientDataJSON': ConvertUtils.arrayBufferToBase64(cred.response.clientDataJSON)
					}
				};
				Ajax.send('%ModuleName%', 'RegisterSecurityKeyFinish', oParams,
					this.onRegisterSecurityKeyFinishResponse, this);
			})
			.catch((err) => {
				this.securityKeyInProgress(false);
				this.securityKeyCanceled(true);
			});
	}
	else
	{
		this.securityKeyInProgress(false);
		this.closePopup();
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_ADD_SECURITY_KEY'));
	}
};

CCreateSecurityKeyPopup.prototype.onRegisterSecurityKeyFinishResponse = function (oResponse)
{
	this.securityKeyInProgress(false);
	if (oResponse && oResponse.Result)
	{
		this.iId = oResponse.Result;
		this.nameFocus(true);
	}
	else
	{
		this.closePopup();
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_ADD_SECURITY_KEY'));
	}
};

CCreateSecurityKeyPopup.prototype.save = function ()
{
	if (Types.isNonEmptyString(this.name()))
	{
		var oParameters = {
			'Password': this.sEditVerificator,
			'KeyId': this.iId,
			'NewName': this.name()
		};
		this.saveNameInProgress(true);
		Ajax.send('%ModuleName%', 'UpdateSecurityKeyName', oParameters, this.onUpdateSecurityKeyNameResponse, this);
	}
};

CCreateSecurityKeyPopup.prototype.onUpdateSecurityKeyNameResponse = function (oResponse)
{
	this.saveNameInProgress(false);
	if (oResponse && oResponse.Result)
	{
		if (_.isFunction(this.fCallback))
		{
			this.fCallback(this.iId, this.name());
		}
		this.closePopup();
	}
	else
	{
		if (_.isFunction(this.fCallback))
		{
			this.fCallback(this.iId, '');
		}
		this.closePopup();
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_SETUP_SECRET_KEY_NAME'));
	}
};

CCreateSecurityKeyPopup.prototype.cancelPopup = function ()
{
	// Do not close until name is specified
	// this.closePopup();
};

CCreateSecurityKeyPopup.prototype.onEscHandler = function (oEvent)
{
	// Do not close until name is specified
	// this.cancelPopup();
};

module.exports = new CCreateSecurityKeyPopup();
