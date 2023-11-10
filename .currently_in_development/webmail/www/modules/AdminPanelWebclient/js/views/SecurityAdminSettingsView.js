'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	Settings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	CAbstractSettingsFormView = require('modules/%ModuleName%/js/views/CAbstractSettingsFormView.js')
;

/**
* @constructor
*/
function CSecurityAdminSettingsView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.aLanguages = Settings.LanguageList;
	
	/* Editable fields */
	this.login = ko.observable(Settings.AdminLogin);
	this.pass = ko.observable('');
	this.newPass = ko.observable('');
	this.confirmPass = ko.observable('');
	this.selectedLanguage = ko.observable(Settings.AdminLanguage);
	/*-- Editable fields */
	
	this.passFocused = ko.observable(false);
	this.newPassFocused = ko.observable(false);
	
	this.startError = ko.observable('');
	this.setStartError();
}

_.extendOwn(CSecurityAdminSettingsView.prototype, CAbstractSettingsFormView.prototype);

CSecurityAdminSettingsView.prototype.ViewTemplate = '%ModuleName%_SecurityAdminSettingsView';

CSecurityAdminSettingsView.prototype.setStartError = function ()
{
	var aErrors = [];

	if (!Settings.AdminHasPassword)
	{
		aErrors.push(TextUtils.i18n('%MODULENAME%/ERROR_ADMIN_EMPTY_PASSWORD'));
	}
	if (!Settings.SaltNotEmpty)
	{
		aErrors.push(TextUtils.i18n('%MODULENAME%/ERROR_SALT_EMPTY'));
	}
	this.startError(aErrors.join('<br /><br />'));
};

/**
 * Returns error text to show on start if there is no admin password.
 * 
 * @returns {String}
 */
CSecurityAdminSettingsView.prototype.getStartError = function ()
{
	return this.startError;
};

CSecurityAdminSettingsView.prototype.getCurrentValues = function()
{
	return [
		this.login(),
		this.pass(),
		this.newPass(),
		this.confirmPass(),
		this.selectedLanguage()
	];
};

CSecurityAdminSettingsView.prototype.revertGlobalValues = function()
{
	this.login(Settings.AdminLogin);
	this.pass('');
	this.newPass('');
	this.confirmPass('');
	this.selectedLanguage(Settings.AdminLanguage);
};

CSecurityAdminSettingsView.prototype.getParametersForSave = function ()
{
	var oParameters = {
		'AdminLogin': $.trim(this.login()),
		'Password': $.trim(this.pass()),
		'NewPassword': $.trim(this.newPass())
	};
	
	if (this.selectedLanguage() !== Settings.AdminLanguage)
	{
		oParameters['AdminLanguage'] = this.selectedLanguage();
	}
	
	return oParameters;
};

/**
 * Applies saved values to the Settings object.
 * 
 * @param {Object} oParameters Parameters which were saved on the server side.
 */
CSecurityAdminSettingsView.prototype.applySavedValues = function (oParameters)
{
	if (this.selectedLanguage() !== Settings.AdminLanguage)
	{
		window.location.reload();
	}
	Settings.updateSecurity(oParameters.AdminLogin, Settings.AdminHasPassword || oParameters.NewPassword !== '');
	this.setStartError();
};

CSecurityAdminSettingsView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === '');
};

CSecurityAdminSettingsView.prototype.validateBeforeSave = function ()
{
	var
		sPass = $.trim(this.pass()),
		sNewPass = $.trim(this.newPass()),
		sConfirmPass = $.trim(this.confirmPass())
	;
	if (Settings.AdminHasPassword && sPass === '' && sNewPass !== '')
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_CURRENT_PASSWORD_EMPTY'));
		this.passFocused(true);
		return false;
	}
	if (sPass !== '' && sNewPass === '')
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_NEW_PASSWORD_EMPTY'));
		this.newPassFocused(true);
		return false;
	}
	if (sPass !== '' && sNewPass !== sConfirmPass)
	{
		Screens.showError(TextUtils.i18n('COREWEBCLIENT/ERROR_PASSWORDS_DO_NOT_MATCH'));
		this.newPassFocused(true);
		return false;
	}
	return true;
};

CSecurityAdminSettingsView.prototype.onResponse = function (oResponse, oRequest)
{
	this.isSaving(false);

	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_SAVING_SETTINGS_FAILED'));
	}
	else
	{
		var oParameters = oRequest.Parameters;

		//clear fields after saving
		this.pass('');
		this.newPass('');
		this.confirmPass('');

		this.updateSavedState();
		this.applySavedValues(oParameters);
		Screens.showReport(TextUtils.i18n('COREWEBCLIENT/REPORT_SETTINGS_UPDATE_SUCCESS'));
	}
};

module.exports = new CSecurityAdminSettingsView();
