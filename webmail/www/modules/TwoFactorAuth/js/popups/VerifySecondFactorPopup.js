'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),

	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),

	ConvertUtils = require('modules/%ModuleName%/js/utils/Convert.js'),
	DeviceUtils = require('modules/%ModuleName%/js/utils/Device.js'),

	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CVerifySecondFactorPopup()
{
	CAbstractPopup.call(this);

	this.isMobile = ko.observable(App.isMobile() || false);

	this.fAfterVerify = null;
	this.fOnCancel = null;
	this.login = ko.observable(null);
	this.sPassword = null;

	this.bAllowTrustedDevices = Settings.AllowTrustedDevices;

	this.verificationResponse = ko.observable(null);
	this.verificationPassed = ko.computed(function () {
		return this.verificationResponse() !== null;
	}, this);
	this.verificationResponse.subscribe(function () {
		 if (this.verificationPassed() && !this.bAllowTrustedDevices)
		 {
			this.afterVerify();
			this.closePopup();
		 }
	}, this);

	this.trustThisBrowser = ko.observable(false);
	this.sTrustThisBrowserText = TextUtils.i18n('%MODULENAME%/LABEL_TRUST_DEVICE_PLURAL', {
		'COUNT': Settings.TrustDevicesForDays
	}, null, Settings.TrustDevicesForDays);

	this.allOptionsVisible = ko.observable(false);
	this.securityKeyVisible = ko.observable(false);
	this.authenticatorAppVisible = ko.observable(false);
	this.backupCodesVisible = ko.observable(false);

	this.hasSecurityKey = ko.observable(false);
	this.securityKeyInProgress = ko.observable(false);
	this.securityKeyError = ko.observable(false);
	this.bSecurityKeysNotSupportedError = !(navigator.credentials && navigator.credentials.get);
	this.bIsHttps = window.location.protocol === 'https:';

	this.hasAuthenticatorApp = ko.observable(false);
	this.authenticatorCode = ko.observable('');
	this.authenticatorCodeFocused = ko.observable(false);
	this.authenticatorCodeInProgress = ko.observable(false);

	this.hasBackupCodes = ko.observable(false);
	this.backupCode = ko.observable(false);
	this.backupCodeFocus = ko.observable(false);
	this.backupCodeInProgress = ko.observable(false);

	this.hasSeveralOptions = ko.computed(function () {
		var iOptionsCount = 0;
		if (this.hasSecurityKey())
		{
			iOptionsCount++;
		}
		if (this.hasAuthenticatorApp())
		{
			iOptionsCount++;
		}
		if (this.hasBackupCodes())
		{
			iOptionsCount++;
		}
		return iOptionsCount > 1;
	}, this);
	
	this.continueInProgress = ko.observable(false);
	this.continueCommand = Utils.createCommand(this, this.afterVerify, function () {
		return !this.continueInProgress();
	});
}

_.extendOwn(CVerifySecondFactorPopup.prototype, CAbstractPopup.prototype);

CVerifySecondFactorPopup.prototype.PopupTemplate = '%ModuleName%_VerifySecondFactorPopup';

CVerifySecondFactorPopup.prototype.onOpen = function (fAfterVerify, fOnCancel, oTwoFactorAuthData, sLogin, sPassword)
{
	this.continueInProgress(false);
	
	this.fAfterVerify = fAfterVerify;
	this.fOnCancel = fOnCancel;
	this.login(sLogin);
	this.sPassword = sPassword;

	this.hasSecurityKey(Settings.AllowSecurityKeys && oTwoFactorAuthData.HasSecurityKey);
	this.hasAuthenticatorApp(Settings.AllowAuthenticatorApp && oTwoFactorAuthData.HasAuthenticatorApp);
	this.hasBackupCodes(Settings.AllowBackupCodes && oTwoFactorAuthData.HasBackupCodes);

	this.verificationResponse(null);
	this.authenticatorCode('');
	this.authenticatorCodeInProgress(false);
	this.backupCode('');
	this.backupCodeInProgress(false);

	this.allOptionsVisible(false);
	this.securityKeyVisible(false);
	this.authenticatorAppVisible(false);
	this.backupCodesVisible(false);
	if (this.hasSecurityKey())
	{
		this.useSecurityKey();
	}
	else if (this.hasAuthenticatorApp())
	{
		this.useAuthenticatorApp();
	}
};

CVerifySecondFactorPopup.prototype.useOtherOption = function ()
{
	this.allOptionsVisible(true);
	this.securityKeyVisible(false);
	this.authenticatorAppVisible(false);
	this.backupCodesVisible(false);
};

CVerifySecondFactorPopup.prototype.useSecurityKey = function ()
{
	if (this.hasSecurityKey())
	{
		this.allOptionsVisible(false);
		this.securityKeyVisible(true);
		this.authenticatorAppVisible(false);
		this.backupCodesVisible(false);
		this.verifySecurityKey();
	}
};

CVerifySecondFactorPopup.prototype.useAuthenticatorApp = function ()
{
	if (this.hasAuthenticatorApp())
	{
		this.allOptionsVisible(false);
		this.securityKeyVisible(false);
		this.authenticatorAppVisible(true);
		this.backupCodesVisible(false);
		this.authenticatorCodeFocused(true);
	}
};

CVerifySecondFactorPopup.prototype.useBackupCodes = function ()
{
	if (this.hasBackupCodes())
	{
		this.allOptionsVisible(false);
		this.securityKeyVisible(false);
		this.authenticatorAppVisible(false);
		this.backupCodesVisible(true);
		this.backupCodeFocus(true);
	}
};

CVerifySecondFactorPopup.prototype.verifySecurityKey = function ()
{
	if (!this.bSecurityKeysNotSupportedError)
	{
		var oParameters = {
			'Login': this.login(),
			'Password': this.sPassword
		};
		this.securityKeyInProgress(true);
		this.securityKeyError(false);
		Ajax.send('%ModuleName%', 'VerifySecurityKeyBegin', oParameters, this.onVerifySecurityKeyBegin, this);
	}
	else
	{
		this.securityKeyInProgress(false);
		this.securityKeyError(true);
	}
};

CVerifySecondFactorPopup.prototype.onVerifySecurityKeyBegin = function (oResponse)
{
	var oGetArgs = oResponse && oResponse.Result;
	if (oGetArgs)
	{
		oGetArgs.publicKey.challenge = ConvertUtils.base64ToArrayBuffer(oGetArgs.publicKey.challenge);
		oGetArgs.publicKey.allowCredentials.forEach(element => {
			element.id = ConvertUtils.base64ToArrayBuffer(element.id);
		});

		navigator.credentials.get(oGetArgs)
			.then((oCreds) => {
				var
					oCredsResponse = oCreds && oCreds.response,
					oParameters = {
						'Login': this.login(),
						'Password': this.sPassword,
						'Attestation': {
							id: oCreds && oCreds.rawId ? ConvertUtils.arrayBufferToBase64(oCreds.rawId) : null,
							clientDataJSON: oCredsResponse && oCredsResponse.clientDataJSON  ? ConvertUtils.arrayBufferToBase64(oCredsResponse.clientDataJSON) : null,
							authenticatorData: oCredsResponse && oCredsResponse.authenticatorData ? ConvertUtils.arrayBufferToBase64(oCredsResponse.authenticatorData) : null,
							signature : oCredsResponse && oCredsResponse.signature ? ConvertUtils.arrayBufferToBase64(oCredsResponse.signature) : null
						}
					}
				;
				Ajax.send('%ModuleName%', 'VerifySecurityKeyFinish', oParameters, this.onVerifySecurityKeyFinish, this);
			})
			.catch((err) => {
				this.securityKeyInProgress(false);
				this.securityKeyError(true);
			});
	}
	else
	{
		this.securityKeyInProgress(false);
		this.securityKeyError(true);
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_VERIFY_SECURITY_KEY'));
	}
};

CVerifySecondFactorPopup.prototype.onVerifySecurityKeyFinish = function (oResponse)
{
	this.securityKeyInProgress(false);
	if (oResponse && oResponse.Result)
	{
		this.verificationResponse(oResponse);
	}
	else
	{
		this.securityKeyError(true);
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_VERIFY_SECURITY_KEY'));
	}
};

CVerifySecondFactorPopup.prototype.verifyAuthenticatorCode = function ()
{
	var oParameters = {
		'Login': this.login(),
		'Password': this.sPassword,
		'Code': this.authenticatorCode()
	};
	this.authenticatorCodeInProgress(true);
	Ajax.send('%ModuleName%', 'VerifyAuthenticatorAppCode', oParameters, this.onVerifyAuthenticatorAppCodeResponse, this);
};

CVerifySecondFactorPopup.prototype.onVerifyAuthenticatorAppCodeResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	this.authenticatorCodeInProgress(false);
	this.authenticatorCode('');
	if (oResult)
	{
		this.verificationResponse(oResponse);
	}
	else
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_WRONG_CODE'));
	}
};

CVerifySecondFactorPopup.prototype.verifyBackupCode = function ()
{
	var oParameters = {
		'Login': this.login(),
		'Password': this.sPassword,
		'BackupCode': this.backupCode()
	};
	this.backupCodeInProgress(true);
	Ajax.send('%ModuleName%', 'VerifyBackupCode', oParameters, this.onVerifyBackupCode, this);
};

CVerifySecondFactorPopup.prototype.onVerifyBackupCode = function (oResponse)
{
	var oResult = oResponse.Result;

	this.backupCodeInProgress(false);
	this.backupCode('');
	if (oResult)
	{
		this.verificationResponse(oResponse);
	}
	else
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_WRONG_BACKUP_CODE'));
	}
};

CVerifySecondFactorPopup.prototype.cancelPopup = function ()
{
	if (_.isFunction(this.fOnCancel))
	{
		this.fOnCancel(false);
	}
	this.closePopup();
};

CVerifySecondFactorPopup.prototype.afterVerify = function ()
{
	if (this.trustThisBrowser())
	{
		var oParameters = {
			'Login': this.login(),
			'Password': this.sPassword,
			'DeviceId': Utils.getUUID(),
			'DeviceName': DeviceUtils.getName(),
			'Trust': this.trustThisBrowser()
		};
		this.continueInProgress(true);
		Ajax.send('%ModuleName%', 'TrustDevice', oParameters, function () {
			if (_.isFunction(this.fAfterVerify))
			{
				this.fAfterVerify(this.verificationResponse());
			}
		}, this);
	}
	else if (_.isFunction(this.fAfterVerify))
	{
		this.fAfterVerify(this.verificationResponse());
	}
};

module.exports = new CVerifySecondFactorPopup();
