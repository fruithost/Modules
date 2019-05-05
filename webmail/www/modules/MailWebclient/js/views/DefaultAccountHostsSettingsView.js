'use strict';

var
	ko = require('knockout'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js');
;

/**
 * @constructor
 */
function CDefaultAccountHostsSettingsView()
{
	this.defaultAccount = AccountList.getDefault();
	this.visible = ko.observable(!!this.defaultAccount && this.defaultAccount.oServer.bSetExternalAccessServers);
	this.externalAccessImapServer = ko.observable(this.visible() ? this.defaultAccount.oServer.sExternalAccessImapServer : '');
	this.externalAccessImapPort = ko.observable(this.visible() ? this.defaultAccount.oServer.iExternalAccessImapPort : 143);
	this.externalAccessSmtpServer = ko.observable(this.visible() ? this.defaultAccount.oServer.sExternalAccessSmtpServer : '');
	this.externalAccessSmtpPort = ko.observable(this.visible() ? this.defaultAccount.oServer.iExternalAccessSmtpPort : 25);
	this.credentialsHintText = App.mobileCredentialsHintText;
	this.bDemo = UserSettings.IsDemo;
}

CDefaultAccountHostsSettingsView.prototype.ViewTemplate = '%ModuleName%_DefaultAccountHostsSettingsView';

module.exports = new CDefaultAccountHostsSettingsView();
