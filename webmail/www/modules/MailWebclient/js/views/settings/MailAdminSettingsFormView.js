'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Browser = require('%PathToCoreWebclientModule%/js/Browser.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass'),
	
	MailUtils = require('modules/%ModuleName%/js/utils/Mail.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CMailAdminSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);

	this.bAllowHorizontalLayout = Settings.AllowHorizontalLayout;
	
	this.aLayoutValues = [
		{ text: TextUtils.i18n('%MODULENAME%/LABEL_VERT_SPLIT_LAYOUT'), value: false },
		{ text: TextUtils.i18n('%MODULENAME%/LABEL_HORIZ_SPLIT_LAYOUT'), value: true }
	];
	
	this.bAllowMultiAccounts = Settings.AllowMultiAccounts;
	
	this.autocreateMailAccountOnNewUserFirstLogin = ko.observable(Settings.AutocreateMailAccountOnNewUserFirstLogin);
	this.allowAddAccounts = ko.observable(Settings.AllowAddAccounts);
	this.horizontalLayoutByDefault = ko.observable(Settings.HorizontalLayoutByDefault);
}

_.extendOwn(CMailAdminSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CMailAdminSettingsFormView.prototype.ViewTemplate = '%ModuleName%_Settings_MailAdminSettingsFormView';

CMailAdminSettingsFormView.prototype.registerMailto = function ()
{
	MailUtils.registerMailto();
};

CMailAdminSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.autocreateMailAccountOnNewUserFirstLogin,
		this.allowAddAccounts,
		this.horizontalLayoutByDefault()
	];
};

CMailAdminSettingsFormView.prototype.revertGlobalValues = function ()
{
	this.autocreateMailAccountOnNewUserFirstLogin(Settings.AutocreateMailAccountOnNewUserFirstLogin);
	this.allowAddAccounts(Settings.AllowAddAccounts);
	this.horizontalLayoutByDefault(Settings.HorizontalLayoutByDefault);
};

CMailAdminSettingsFormView.prototype.getParametersForSave = function ()
{
	return {
		'AutocreateMailAccountOnNewUserFirstLogin': this.autocreateMailAccountOnNewUserFirstLogin(),
		'AllowAddAccounts': this.allowAddAccounts(),
		'HorizontalLayoutByDefault': this.horizontalLayoutByDefault()
	};
};

CMailAdminSettingsFormView.prototype.applySavedValues = function (oParameters)
{
	Settings.updateAdmin(oParameters.AutocreateMailAccountOnNewUserFirstLogin, oParameters.AllowAddAccounts, oParameters.HorizontalLayoutByDefault);
};

CMailAdminSettingsFormView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === '');
};

module.exports = new CMailAdminSettingsFormView();
