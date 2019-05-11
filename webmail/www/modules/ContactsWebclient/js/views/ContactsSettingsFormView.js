'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CContactsSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.contactsPerPageValues = ko.observableArray(Types.getAdaptedPerPageList(Settings.ContactsPerPage));
	
	this.contactsPerPage = ko.observable(Settings.ContactsPerPage);
}

_.extendOwn(CContactsSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CContactsSettingsFormView.prototype.ViewTemplate = '%ModuleName%_ContactsSettingsFormView';

CContactsSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.contactsPerPage()
	];
};

CContactsSettingsFormView.prototype.revertTeamValues = function ()
{
	this.contactsPerPage(Settings.ContactsPerPage);
};

CContactsSettingsFormView.prototype.getParametersForSave = function ()
{
	return {
		'ContactsPerPage': this.contactsPerPage()
	};
};

CContactsSettingsFormView.prototype.applySavedValues = function (oParameters)
{
	Settings.update(oParameters.ContactsPerPage);
};

module.exports = new CContactsSettingsFormView();
