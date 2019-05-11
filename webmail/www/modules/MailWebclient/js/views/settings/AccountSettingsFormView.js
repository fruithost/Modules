'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ChangePasswordPopup = ModulesManager.run('ChangePasswordWebclient', 'getChangePasswordPopup'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CServerPairPropertiesView = require('modules/%ModuleName%/js/views/settings/CServerPairPropertiesView.js')
;

/**
 * @constructor
 */ 
function CAccountSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.sFakePass = 'xxxxxxxx'; // fake password uses to display something in password input while account editing
	
	this.bAllowIdentities = Settings.AllowIdentities;
	
	this.useToAuthorize = ko.observable(false);
	this.canBeUsedToAuthorize = ko.observable(false);
	this.isDefaultAccount = ko.observable(false);
	this.friendlyName = ko.observable('');
	this.email = ko.observable('');
	this.incomingLogin = ko.observable('');
	this.incomingPassword = ko.observable('');
	this.useThreading = ko.observable(false);
	this.saveRepliesToCurrFolder = ko.observable(false);

	this.oServerPairPropertiesView = new CServerPairPropertiesView('acc_edit');
	this.enableThreading = this.oServerPairPropertiesView.enableThreading;
	this.enableThreading.subscribe(function () {
		if (!this.enableThreading())
		{
			this.useThreading(false);
		}
	}, this);

	this.allowChangePassword = ko.observable(false);
	
	this.incLoginFocused = ko.observable(false);
	this.incLoginFocused.subscribe(function () {
		if (this.incLoginFocused() && this.incomingLogin() === '')
		{
			this.incomingLogin(this.email());
		}
	}, this);

	AccountList.editedId.subscribe(function () {
		if (this.bShown)
		{
			this.populate();
		}
	}, this);
	this.updateSavedState();
	this.oServerPairPropertiesView.currentValues.subscribe(function () {
		this.updateSavedState();
	}, this);
	
	this.visibleTab = ko.observable(true);
	ko.computed(function () {
		var oAccount = AccountList.getEdited();
		if (oAccount)
		{
			this.allowChangePassword(ModulesManager.run('ChangePasswordWebclient', 'isChangePasswordButtonAllowed', [AccountList.collection().length, oAccount]));
			this.isDefaultAccount(oAccount.bDefault);
		}
		else
		{
			this.allowChangePassword(false);
			this.isDefaultAccount(false);
		}
	}, this);
	this.isDisableAuthorize = ko.observable(App.userAccountsCount() <= 1);
	
	this.oDefaultAccountHostsSettingsView = require('modules/%ModuleName%/js/views/DefaultAccountHostsSettingsView.js');
}

_.extendOwn(CAccountSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CAccountSettingsFormView.prototype.ViewTemplate = '%ModuleName%_Settings_AccountSettingsFormView';

CAccountSettingsFormView.prototype.onShow = function ()
{
	this.oServerPairPropertiesView.fullInit();
	this.populate();
};

CAccountSettingsFormView.prototype.getCurrentValues = function ()
{
	var
		aMain = [
			this.useToAuthorize(),
			this.friendlyName(),
			this.email(),
			this.incomingLogin(),
			this.incomingPassword(),
			this.useThreading(),
			this.saveRepliesToCurrFolder()
		],
		aServers = this.oServerPairPropertiesView.currentValues()
	;
	
	return aMain.concat(aServers);
};

CAccountSettingsFormView.prototype.getParametersForSave = function ()
{
	var
		oAccount = AccountList.getEdited(),
		sIncomingPassword = $.trim(this.incomingPassword())
	;
	return {
		'AccountID': oAccount.id(),
		'UseToAuthorize': this.useToAuthorize(),
		'FriendlyName': this.friendlyName(),
		'Email': $.trim(this.email()),
		'IncomingLogin': $.trim(this.incomingLogin()),
		'IncomingPassword': sIncomingPassword === this.sFakePass ? '' : sIncomingPassword,
		'Server': this.oServerPairPropertiesView.getParametersForSave(),
		'UseThreading': this.useThreading(),
		'SaveRepliesToCurrFolder': this.saveRepliesToCurrFolder()
	};
};

CAccountSettingsFormView.prototype.revert = function ()
{
	this.populate();
};

CAccountSettingsFormView.prototype.populate = function ()
{
	var oAccount = AccountList.getEdited();
	if (oAccount)
	{	
		this.friendlyName(oAccount.friendlyName());
		this.email(oAccount.email());
		this.incomingLogin(oAccount.incomingLogin());
		this.incomingPassword(this.sFakePass);
		this.oServerPairPropertiesView.setServer(oAccount.oServer);
		
		this.useToAuthorize(oAccount.useToAuthorize());
		this.canBeUsedToAuthorize(oAccount.canBeUsedToAuthorize());
		this.useThreading(oAccount.useThreading());
		this.saveRepliesToCurrFolder(oAccount.bSaveRepliesToCurrFolder);
		
		this.isDisableAuthorize(this.useToAuthorize() ? App.userAccountsCount() <= 1 : false);
	}
	else
	{
		this.friendlyName('');
		this.email('');
		this.incomingLogin('');
		this.incomingPassword('');
		
		this.oServerPairPropertiesView.clear();
		
		this.useToAuthorize(true);
		this.canBeUsedToAuthorize(false);
		this.useThreading(false);
		
		this.isDisableAuthorize(true);
	}
	
	this.updateSavedState();
};

CAccountSettingsFormView.prototype.remove = function ()
{
	if (this.isDisableAuthorize())
	{
		Screens.showError(TextUtils.i18n('COREWEBCLIENT/ERROR_ACCOUNT_DELETING_DISABLE'), true);
	}
	else
	{
		var oAccount = AccountList.getEdited();

		if (oAccount)
		{
			oAccount.remove();
		}
	}
};

CAccountSettingsFormView.prototype.save = function ()
{
	this.isSaving(true);
	
	this.updateSavedState();
	
	Ajax.send('UpdateAccount', this.getParametersForSave(), this.onResponse, this);
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAccountSettingsFormView.prototype.onResponse = function (oResponse, oRequest)
{
	this.isSaving(false);

	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_SAVING_SETTINGS_FAILED'));
	}
	else
	{
		var
			oParameters = oRequest.Parameters,
			iAccountId = Types.pInt(oParameters.AccountID),
			oAccount = AccountList.getAccount(iAccountId)
		;

		if (oAccount)
		{
			oAccount.updateFromServer(oResponse.Result);
			this.populate();
			Screens.showReport(TextUtils.i18n('COREWEBCLIENT/REPORT_SETTINGS_UPDATE_SUCCESS'));
		}
	}
};

CAccountSettingsFormView.prototype.changePassword = function ()
{
	if (this.allowChangePassword())
	{
		Popups.showPopup(ChangePasswordPopup, [{
			iAccountId: AccountList.editedId(),
			sModule: Settings.ServerModuleName,
			bHasOldPassword: true
		}]);
	}
};

module.exports = new CAccountSettingsFormView();
