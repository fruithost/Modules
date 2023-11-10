'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	Settings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	CAbstractSettingsFormView = require('modules/%ModuleName%/js/views/CAbstractSettingsFormView.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	AlertPopup = require('%PathToCoreWebclientModule%/js/popups/AlertPopup.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js')
;

/**
* @constructor
*/
function CDbAdminSettingsView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.sFakePass = 'xxxxxxxxxx';
	
	/* Editable fields */
	this.dbLogin = ko.observable(Settings.DbLogin);
	this.dbPassword = ko.observable(this.sFakePass);
	this.dbName = ko.observable(Settings.DbName);
	this.dbHost = ko.observable(Settings.DbHost);
	/*-- Editable fields */

	this.isCreating = ko.observable(false);
	this.startError = ko.observable('');
	this.setStartError();
}

_.extendOwn(CDbAdminSettingsView.prototype, CAbstractSettingsFormView.prototype);

CDbAdminSettingsView.prototype.ViewTemplate = '%ModuleName%_DbAdminSettingsView';

CDbAdminSettingsView.prototype.setStartError = function ()
{
	this.startError((Settings.DbLogin === '' || Settings.DbName === '' || Settings.DbHost === '') ? TextUtils.i18n('%MODULENAME%/ERROR_DB_ACCESS') : '');
};

/**
 * Returns error text to show on start if the tab has empty fields.
 * 
 * @returns {String}
 */
CDbAdminSettingsView.prototype.getStartError = function ()
{
	return this.startError;
};

CDbAdminSettingsView.prototype.getCurrentValues = function()
{
	return [
		this.dbLogin(),
		this.dbPassword(),
		this.dbName(),
		this.dbHost()
	];
};

CDbAdminSettingsView.prototype.revertGlobalValues = function()
{
	this.dbLogin(Settings.DbLogin);
	this.dbPassword(this.sFakePass);
	this.dbName(Settings.DbName);
	this.dbHost(Settings.DbHost);
};

CDbAdminSettingsView.prototype.getParametersForSave = function ()
{
	if (this.dbPassword() === this.sFakePass)
	{
		return {
			'DbLogin': $.trim(this.dbLogin()),
			'DbName': $.trim(this.dbName()),
			'DbHost': $.trim(this.dbHost())
		};
	}
	return {
		'DbLogin': $.trim(this.dbLogin()),
		'DbPassword': $.trim(this.dbPassword()),
		'DbName': $.trim(this.dbName()),
		'DbHost': $.trim(this.dbHost())
	};
};

/**
 * @param {Object} oParameters
 */
CDbAdminSettingsView.prototype.applySavedValues = function (oParameters)
{
	if (Settings.StoreAuthTokenInDB)
	{
		Popups.showPopup(AlertPopup, [TextUtils.i18n('%MODULENAME%/INFO_AUTHTOKEN_DB_STORED')]);
	}
	Settings.updateDb(oParameters.DbLogin, oParameters.DbName, oParameters.DbHost);
	this.setStartError();
};

CDbAdminSettingsView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === '');
};

CDbAdminSettingsView.prototype.testConnection = function ()
{
	Ajax.send('TestDbConnection', this.getParametersForSave(), function (oResponse) {
		if (oResponse.Result)
		{
			Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_DB_CONNECT_SUCCESSFUL'));
		}
		else
		{
			Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_DB_CONNECT_FAILED'));
		}
	}, this);
};

CDbAdminSettingsView.prototype.createTables = function ()
{
	var 
		self = this,		
		fCreateTables = function () {
			self.isCreating(true);
			Ajax.send('CreateTables', null, function (oResponse) {
				if (oResponse.Result)
				{
					Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_CREATE_TABLES_SUCCESSFUL'));
				}
				else
				{
					Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_CREATE_TABLES_FAILED'));
				}
				self.isCreating(false);
			});
		};
	
	if (this.sSavedState !== this.getCurrentState())
	{
		Popups.showPopup(ConfirmPopup, [TextUtils.i18n('%MODULENAME%/CONFIRM_SAVE_CHANGES_BEFORE_CREATE_TABLES'), _.bind(function (bOk) {
			if (bOk)
			{
				var oIsSavingSubscribtion = this.isSaving.subscribe(function (bSaving) {
					if (!bSaving)
					{
						fCreateTables();
						oIsSavingSubscribtion.dispose();
					}
				}, this);
				
				this.save();
			}
		}, this)]);
	}
	else
	{
		fCreateTables();
	}
};

CDbAdminSettingsView.prototype.updateConfig = function ()
{
	Ajax.send('UpdateConfig', null, function (oResponse) {
		if (oResponse.Result)
		{
			Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_UPDATE_CONFIG_SUCCESSFUL'));
		}
		else
		{
			Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_UPDATE_CONFIG_FAILED'));
		}
	});
}

module.exports = new CDbAdminSettingsView();
