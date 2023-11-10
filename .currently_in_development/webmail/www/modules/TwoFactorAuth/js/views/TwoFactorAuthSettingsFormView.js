'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),

	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),

	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),

	CDeviceModel = require('modules/%ModuleName%/js/models/CDeviceModel.js'),
	ConfigureAuthenticatorAppPopup = require('modules/%ModuleName%/js/popups/ConfigureAuthenticatorAppPopup.js'),
	ConfirmPasswordPopup = require('modules/%ModuleName%/js/popups/ConfirmPasswordPopup.js'),
	CreateSecurityKeyPopup = require('modules/%ModuleName%/js/popups/CreateSecurityKeyPopup.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	EditSecurityKeyPopup = require('modules/%ModuleName%/js/popups/EditSecurityKeyPopup.js'),
	ShowBackupCodesPopup = require('modules/%ModuleName%/js/popups/ShowBackupCodesPopup.js')
;

/**
 * @constructor
 */
function CTwoFactorAuthSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.visibleHeading = ko.observable(true); // Can be changed by SecuritySettingsWebclient module

	this.showRecommendationToConfigure = ko.observable(Settings.ShowRecommendationToConfigure);

	this.bAllowSecurityKeys = Settings.AllowSecurityKeys;

	this.bAllowAuthenticatorApp = Settings.AllowAuthenticatorApp;

	this.securityKeys = ko.observableArray(Settings.SecurityKeys);

	this.hasBackupCodes = ko.observable(false);
	this.infoShowBackupCodes = ko.observable('');

	this.hasAuthenticatorApp = ko.observable(Settings.AuthenticatorAppEnabled);

	this.isEnabledTwoFactorAuth = ko.computed(function () {
		return this.hasAuthenticatorApp() || this.securityKeys().length > 0;
	}, this);
	this.isEnabledTwoFactorAuth.subscribe(function () {
		if (!this.isEnabledTwoFactorAuth())
		{
			Settings.updateBackupCodesCount(0);
			this.populateSettings();
		}
	}, this);

	this.sEditVerificator = '';
	this.passwordVerified = ko.observable(false);

	this.allowBackupCodes = ko.computed(function () {
		return Settings.AllowBackupCodes && (this.hasAuthenticatorApp() || this.securityKeys().length > 0) && this.passwordVerified();
	}, this);
	
	this.devices = ko.observableArray([]);
	this.allowUsedDevices = ko.computed(function () {
		return Settings.AllowUsedDevices && this.devices().length > 0;
	}, this);
	this.allowRevokeAll = ko.computed(function () {
		return Settings.AllowTrustedDevices && !!_.find(this.devices(), function (oDevice) { return Types.isNonEmptyString(oDevice.sDeviceExpiresDate); });
	}, this);
	this.bAllowDeviceLogout = UserSettings.StoreAuthTokenInDB;

	this.populateSettings();
	
	this.revokeAllCommand = Utils.createCommand(this, this.askRevokeTrustFromAllDevices, function () {
		return this.allowRevokeAll();
	});
}

_.extendOwn(CTwoFactorAuthSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CTwoFactorAuthSettingsFormView.prototype.ViewTemplate = '%ModuleName%_TwoFactorAuthSettingsFormView';

CTwoFactorAuthSettingsFormView.prototype.onShow = function ()
{
	this.clearAll();
};

CTwoFactorAuthSettingsFormView.prototype.clearAll = function ()
{
	this.sEditVerificator = '';
	this.passwordVerified(false);
	this.populateSettings();
	this.getUsedDevices();
};

CTwoFactorAuthSettingsFormView.prototype.populateSettings = function ()
{
	this.showRecommendationToConfigure(Settings.ShowRecommendationToConfigure);

	this.hasAuthenticatorApp(Settings.AuthenticatorAppEnabled);

	this.hasBackupCodes(Settings.BackupCodesCount > 0);
	this.infoShowBackupCodes(this.hasBackupCodes() ? TextUtils.i18n('%MODULENAME%/INFO_SHOW_BACKUP_CODES', { 'COUNT': Settings.BackupCodesCount }) : '');
};

CTwoFactorAuthSettingsFormView.prototype.confirmPassword = function ()
{
	Popups.showPopup(ConfirmPasswordPopup, [function (sEditVerificator) {
		this.sEditVerificator = sEditVerificator;
		this.passwordVerified(true);
	}.bind(this)]);
};

CTwoFactorAuthSettingsFormView.prototype.setupAuthenticatorApp = function ()
{
	Popups.showPopup(ConfigureAuthenticatorAppPopup, [this.sEditVerificator, function () {
		Settings.updateAuthenticatorApp(true);
		this.populateSettings();
		this.disableShowRecommendation();
	}.bind(this)]);
};

CTwoFactorAuthSettingsFormView.prototype.disableShowRecommendation = function ()
{
	if (this.showRecommendationToConfigure())
	{
		this.showRecommendationToConfigure(false);
		Ajax.send('%ModuleName%', 'UpdateSettings', {'ShowRecommendationToConfigure': false}, function () {
			Settings.updateShowRecommendation(false);
			this.populateSettings();
		}.bind(this));
	}
};

CTwoFactorAuthSettingsFormView.prototype.askDisableAuthenticatorApp = function ()
{
	var sConfirm = TextUtils.i18n('%MODULENAME%/CONFIRM_DISABLE_AUTHENTICATOR_APP');
	Popups.showPopup(ConfirmPopup, [sConfirm, _.bind(function (bDisableAuthenticatorApp) {
		if (bDisableAuthenticatorApp)
		{
			this.disableAuthenticatorApp();
		}
	}, this)]);
};

CTwoFactorAuthSettingsFormView.prototype.disableAuthenticatorApp = function ()
{
	var oParameters = {
		'Password': this.sEditVerificator
	};
	Ajax.send('%ModuleName%', 'DisableAuthenticatorApp', oParameters);
	Settings.updateAuthenticatorApp(false);
	this.populateSettings();
};

CTwoFactorAuthSettingsFormView.prototype.showBackupCodes = function ()
{
	if (this.allowBackupCodes())
	{
		Popups.showPopup(ShowBackupCodesPopup, [this.sEditVerificator, function (iBackupCodesCount) {
			Settings.updateBackupCodesCount(iBackupCodesCount);
			this.populateSettings();
		}.bind(this)]);
	}
};

CTwoFactorAuthSettingsFormView.prototype.addSecurityKey = function ()
{
	Popups.showPopup(CreateSecurityKeyPopup, [this.sEditVerificator, this.addCreatedSecurityKey.bind(this)]);
};

CTwoFactorAuthSettingsFormView.prototype.addCreatedSecurityKey = function (iId, sName)
{
	this.securityKeys.push({
		'Id': iId,
		'keyName': ko.observable(sName)
	});
	this.disableShowRecommendation();
};

CTwoFactorAuthSettingsFormView.prototype.askNewSecurityKeyName = function (iId, sName)
{
	Popups.showPopup(EditSecurityKeyPopup, [this.sEditVerificator, iId, sName, this.updateSecurityKeyName.bind(this)]);
};

CTwoFactorAuthSettingsFormView.prototype.updateSecurityKeyName = function (iId, sName)
{
	_.each(this.securityKeys(), function (oSecurityKey) {
		if (oSecurityKey.Id === iId)
		{
			oSecurityKey.keyName(sName);
		}
	});
	this.securityKeys.valueHasMutated();
};

CTwoFactorAuthSettingsFormView.prototype.askRemoveSecurityKey = function (iId, sName)
{
	var sConfirm = TextUtils.i18n('%MODULENAME%/CONFIRM_REMOVE_SECURITY_KEY', {
		'KEYNAME': sName
	});
	Popups.showPopup(ConfirmPopup, [sConfirm, _.bind(function (bRemoveKey) {
		if (bRemoveKey)
		{
			this.removeSecurityKey(iId);
		}
	}, this)]);
};

CTwoFactorAuthSettingsFormView.prototype.removeSecurityKey = function (iId)
{
	Ajax.send(
		'%ModuleName%',
		'DeleteSecurityKey', 
		{
			'Password': this.sEditVerificator,
			'KeyId': iId
		},
		function (oResponse) {
			if (oResponse && oResponse.Result)
			{
				this.securityKeys(_.filter(this.securityKeys(), function (oSecurityKey) {
					return oSecurityKey.Id !== iId;
				}));
				Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_DELETE_SECURITY_KEY'));
			}
			else
			{
				Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_DELETE_SECURITY_KEY'));
			}
		},
		this
	);
};

CTwoFactorAuthSettingsFormView.prototype.getUsedDevices = function ()
{
	Ajax.send('%ModuleName%', 'GetUsedDevices', {}, function (oResponse) {
		var
			aDevicesData = oResponse && oResponse.Result,
			aDevices = []
		;
		if (Types.isNonEmptyArray(aDevicesData))
		{
			_.each(aDevicesData, function (oDeviceData) {
				var oDevice = new CDeviceModel(oDeviceData);
				aDevices.push(oDevice);
			});
		}
		this.devices(aDevices);
	}, this);
};
		
CTwoFactorAuthSettingsFormView.prototype.askRevokeTrustFromAllDevices = function ()
{
	var
		sConfirm = TextUtils.i18n('%MODULENAME%/CONFIRM_REVOKE_ALL'),
		sHeading = TextUtils.i18n('%MODULENAME%/CONFIRM_HEADING_REVOKE_ALL')
	;
	Popups.showPopup(ConfirmPopup, [sConfirm, _.bind(function (bRevokeAll) {
		if (bRevokeAll)
		{
			this.revokeTrustFromAllDevices();
		}
	}, this), sHeading]);
};
		
CTwoFactorAuthSettingsFormView.prototype.revokeTrustFromAllDevices = function ()
{
	Ajax.send('%ModuleName%', 'RevokeTrustFromAllDevices', {}, function (oResponse) {
		this.getUsedDevices();
		if (!(oResponse && oResponse.Result))
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_REVOKE_TRUST'));
		}
	}, this);
};

CTwoFactorAuthSettingsFormView.prototype.askLogoutFromDevice = function (sDeviceId, sDeviceName)
{
	var
		sConfirm = TextUtils.i18n('%MODULENAME%/CONFIRM_LOGOUT_DEVICE'),
		sHeading = TextUtils.i18n('%MODULENAME%/CONFIRM_HEADING_LOGOUT_DEVICE', {
			'NAME': sDeviceName
		})
	;
	Popups.showPopup(ConfirmPopup, [sConfirm, _.bind(function (bLogout) {
		if (bLogout)
		{
			this.logoutFromDevice(sDeviceId);
		}
	}, this), sHeading]);
};
		
CTwoFactorAuthSettingsFormView.prototype.logoutFromDevice = function (sDeviceId)
{
	var oParameters = {
		'DeviceId': sDeviceId
	};
	Ajax.send('%ModuleName%', 'LogoutFromDevice', oParameters, function (oResponse) {
		this.getUsedDevices();
		if (!oResponse || !oResponse.Result)
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_LOGOUT_DEVICE'));
		}
	}, this);
};

CTwoFactorAuthSettingsFormView.prototype.askRemoveDevice = function (sDeviceId, sDeviceName)
{
	var
		sConfirm = TextUtils.i18n('%MODULENAME%/CONFIRM_LOGOUT_DEVICE'),
		sHeading = TextUtils.i18n('%MODULENAME%/CONFIRM_HEADING_REMOVE_DEVICE', {
			'NAME': sDeviceName
		})
	;
	Popups.showPopup(ConfirmPopup, [sConfirm, _.bind(function (bLogout) {
		if (bLogout)
		{
			this.removeDevice(sDeviceId);
		}
	}, this), sHeading]);
};
		
CTwoFactorAuthSettingsFormView.prototype.removeDevice = function (sDeviceId)
{
	var oParameters = {
		'DeviceId': sDeviceId
	};
	Ajax.send('%ModuleName%', 'RemoveDevice', oParameters, function (oResponse) {
		this.getUsedDevices();
		if (!oResponse || !oResponse.Result)
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_LOGOUT_DEVICE'));
		}
	}, this);
};

module.exports = new CTwoFactorAuthSettingsFormView();
