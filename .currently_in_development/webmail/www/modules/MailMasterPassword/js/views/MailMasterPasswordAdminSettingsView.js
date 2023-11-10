'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
* @constructor
*/
function CMailMasterPasswordAdminSettingsView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);

//	this.visible = ko.observable(true);
	
	/* Editable fields */
	this.masterPassword = ko.observable('');
	/*-- Editable fields */
}

_.extendOwn(CMailMasterPasswordAdminSettingsView.prototype, CAbstractSettingsFormView.prototype);

CMailMasterPasswordAdminSettingsView.prototype.ViewTemplate = '%ModuleName%_MailMasterPasswordAdminSettingsView';

CMailMasterPasswordAdminSettingsView.prototype.getParametersForSave = function ()
{
	return {
		'MasterPassword': this.masterPassword()
	};
};

CMailMasterPasswordAdminSettingsView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === '');
}; 

module.exports = new CMailMasterPasswordAdminSettingsView();
