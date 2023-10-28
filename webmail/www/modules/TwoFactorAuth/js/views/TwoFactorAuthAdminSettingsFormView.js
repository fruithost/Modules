'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CTwoFactorAuthAdminSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName, 'UpdateEntitySpaceLimits');
	
	this.iUserId = 0;
	
	this.userPublicId = ko.observable('');
	this.twoFactorAuthEnabled = ko.observable(false);
	
	App.subscribeEvent('ReceiveAjaxResponse::after', _.bind(function (oParams) {
		if (oParams.Request.Module === 'Core' && oParams.Request.Method === 'GetUser')
		{
			if (oParams.Response.Result && oParams.Request.Parameters.Id === this.iUserId)
			{
				this.userPublicId(oParams.Response.Result.PublicId);
			}
		}
	}, this));
	this.tfaStatusForUserText = ko.computed(function () {
		if (this.twoFactorAuthEnabled())
		{
			return TextUtils.i18n('%MODULENAME%/INFO_TFA_ENABLED_FOR_USER', {'USER': this.userPublicId()});
		}
		
		return TextUtils.i18n('%MODULENAME%/INFO_TFA_DISABLED_FOR_USER', {'USER': this.userPublicId()});
	}, this);
}

_.extendOwn(CTwoFactorAuthAdminSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CTwoFactorAuthAdminSettingsFormView.prototype.ViewTemplate = '%ModuleName%_TwoFactorAuthAdminSettingsFormView';

CTwoFactorAuthAdminSettingsFormView.prototype.onRouteChild = function ()
{
	this.twoFactorAuthEnabled(false);
	this.requestPerUserSettings();
};

CTwoFactorAuthAdminSettingsFormView.prototype.requestPerUserSettings = function ()
{
	Ajax.send('%ModuleName%', 'GetUserSettings', { 'UserId': this.iUserId }, function (oResponse, oRequest) {
		if (oResponse.Result && oRequest.Parameters.UserId === this.iUserId)
		{
			this.twoFactorAuthEnabled(Types.pBool(oResponse.Result.TwoFactorAuthEnabled));
		}
	}, this);
};

CTwoFactorAuthAdminSettingsFormView.prototype.comfirmDisableUserTfa = function ()
{
	Popups.showPopup(ConfirmPopup, [TextUtils.i18n('%MODULENAME%/CONFIRM_DISABLE_TFA', {'USER': this.userPublicId()}), _.bind(function (bDisableUserTfa) {
		if (bDisableUserTfa)
		{
			this.disableUserTfa();
		}
	}, this), '', TextUtils.i18n('%MODULENAME%/ACTION_DISABLE_TFA')]);
};

CTwoFactorAuthAdminSettingsFormView.prototype.disableUserTfa = function ()
{
	Ajax.send('%ModuleName%', 'DisableUserTwoFactorAuth', { 'UserId': this.iUserId }, function (oResponse, oRequest) {
		if (oResponse.Result)
		{
			this.twoFactorAuthEnabled(false);
			Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_DISABLE_USER_TFA', {'USER': this.userPublicId()}));
		}
		else
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_DISABLE_USER_TFA', {'USER': this.userPublicId()}));
		}
	}, this);
};

CTwoFactorAuthAdminSettingsFormView.prototype.setAccessLevel = function (sEntityType, iUserId)
{
	this.visible(sEntityType === 'User');
	this.iUserId = iUserId;
};

module.exports = new CTwoFactorAuthAdminSettingsFormView();
