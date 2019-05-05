'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
* @constructor
*/
function CAdminSettingsView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	/* Editable fields */
	this.enable = ko.observable(Settings.EnableModule);
	this.id = ko.observable(Settings.Id);
	this.secret = ko.observable(Settings.Secret);
	this.key = ko.observable(Settings.Key);
	this.scopes = ko.observable(Settings.getScopesCopy());
	/*-- Editable fields */
}

_.extendOwn(CAdminSettingsView.prototype, CAbstractSettingsFormView.prototype);

CAdminSettingsView.prototype.ViewTemplate = '%ModuleName%_AdminSettingsView';

/**
 * Returns current values of changeable parameters. These values are used to compare with their previous version.
 * @returns {Array}
 */
CAdminSettingsView.prototype.getCurrentValues = function()
{
	var aScopesValues = _.map(this.scopes(), function (oScope) {
		return oScope.Name + oScope.Value();
	});
	return [
		this.enable(),
		this.id(),
		this.secret(),
		this.key(),
		aScopesValues
	];
};

/**
 * Reverts values of changeable parameters to default ones.
 */
CAdminSettingsView.prototype.revertGlobalValues = function()
{
	this.enable(Settings.EnableModule);
	this.id(Settings.Id);
	this.secret(Settings.Secret);
	this.key(Settings.Key);
	this.scopes(Settings.getScopesCopy());
};

/**
 * Validates changeable parameters before their saving.
 * @returns {Boolean}
 */
CAdminSettingsView.prototype.validateBeforeSave = function ()
{
	if (this.enable() && (this.id() === '' || this.secret() === '' || this.key() === ''))
	{
		Screens.showError(TextUtils.i18n('COREWEBCLIENT/ERROR_REQUIRED_FIELDS_EMPTY'));
		return false;
	}
	return true;
};

/**
 * Returns changeable parameters as object to save them on the server-side.
 * @returns {object}
 */
CAdminSettingsView.prototype.getParametersForSave = function ()
{
	return {
		'EnableModule': this.enable(),
		'Id': this.id(),
		'Secret': this.secret(),
		'Key': this.key(),
		'Scopes': _.map(this.scopes(), function(oScope) {
			return {
				Name: oScope.Name,
				Description: oScope.Description,
				Value: oScope.Value()
			};
		})
	};
};

/**
 * Uses just saved changeable parameters to update default ones.
 * @param {object} oParameters
 */
CAdminSettingsView.prototype.applySavedValues = function (oParameters)
{
	Settings.updateAdmin(oParameters.EnableModule, oParameters.Id, oParameters.Secret, oParameters.Key, oParameters.Scopes);
};

/**
 * Sets access level for the view via entity type and entity identifier.
 * This view is visible only for empty entity type.
 * @param {string} sEntityType Current entity type.
 * @param {number} iEntityId Indentificator of current intity.
 */
CAdminSettingsView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === '');
};

module.exports = new CAdminSettingsView();
