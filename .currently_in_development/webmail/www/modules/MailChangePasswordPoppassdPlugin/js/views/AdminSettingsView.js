'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass')
;

/**
* @constructor
*/
function CPoppassdAdminSettingsView()
{
	CAbstractSettingsFormView.call(this, '%ModuleName%');

	/* Editable fields */
	this.supportedServers = ko.observable(Settings.SupportedServers);
	this.host = ko.observable(Settings.Host);
	this.port = ko.observable(Settings.Port);
	/*-- Editable fields */
}

_.extendOwn(CPoppassdAdminSettingsView.prototype, CAbstractSettingsFormView.prototype);

CPoppassdAdminSettingsView.prototype.ViewTemplate = '%ModuleName%_AdminSettingsView';

CPoppassdAdminSettingsView.prototype.getCurrentValues = function ()
{
	return [
		Types.pString(this.supportedServers()),
		Types.pString(this.host()),
		Types.pInt(this.port())
	];
};

CPoppassdAdminSettingsView.prototype.revertGlobalValues = function ()
{
	this.supportedServers(Settings.SupportedServers);
	this.host(Settings.Host);
	this.port(Settings.Port);
};

CPoppassdAdminSettingsView.prototype.getParametersForSave = function ()
{
	return {
		'SupportedServers': Types.pString(this.supportedServers()),
		'Host': Types.pString(this.host()),
		'Port': Types.pInt(this.port())
	};
};

/**
 * @param {Object} oParameters
 */
CPoppassdAdminSettingsView.prototype.applySavedValues = function (oParameters)
{
	Settings.updateAdmin(oParameters.SupportedServers, oParameters.Host, oParameters.Port);
};

CPoppassdAdminSettingsView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === '');
};

module.exports = new CPoppassdAdminSettingsView();
