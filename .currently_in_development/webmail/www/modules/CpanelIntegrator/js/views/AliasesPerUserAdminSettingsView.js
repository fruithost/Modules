'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass'),
	
	Cache = ModulesManager.run('MailDomains', 'getMailDomainsCache'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
* @constructor
*/
function CAliasesPerUserAdminSettingsView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.iUserId = 0;
	this.iRequestedUserId = 0;
	
	this.domain = ko.observable('');
	this.domains = ko.computed(function () {
		return _.map(Cache.domains(), function (oDomain) {
			return oDomain.Name;
		});
	}, this);
	
	this.aliasName = ko.observable('');
	this.aliases = ko.observableArray([]);
	this.selectedAliases = ko.observableArray([]);
}

_.extendOwn(CAliasesPerUserAdminSettingsView.prototype, CAbstractSettingsFormView.prototype);

CAliasesPerUserAdminSettingsView.prototype.ViewTemplate = '%ModuleName%_AliasesPerUserAdminSettingsView';

CAliasesPerUserAdminSettingsView.prototype.getCurrentValues = function()
{
	return [
		this.aliasName(),
		this.domain()
	];
};

CAliasesPerUserAdminSettingsView.prototype.revertGlobalValues = function()
{
	this.aliasName('');
	this.domain('');
};

/**
 * Runs after routing to this view.
 */
CAliasesPerUserAdminSettingsView.prototype.onRouteChild = function ()
{
	this.aliasName('');
	this.selectedAliases([]);
	this.requestNewData();
};

/**
 * Validates alias name and sends request to create a new alias.
 */
CAliasesPerUserAdminSettingsView.prototype.addNewAlias = function ()
{
	if (this.aliasName() === '')
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_EMPTY_ALIAS'));
		return;
	}
	
	Ajax.send(Settings.ServerModuleName, 'AddNewAlias', {
		'UserId': this.iUserId,
		'AliasName': this.aliasName(),
		'AliasDomain': this.domain()
	}, function (oResponse) {
		if (oResponse.Result)
		{
			this.aliasName('');
			this.requestAliases();
		}
		else
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_ADD_NEW_ALIAS'));
		}
	}, this);
};

/**
 * Validates selectes aliases and sends request to delete them.
 */
CAliasesPerUserAdminSettingsView.prototype.deleteAliases = function ()
{
	if (this.selectedAliases().length === 0)
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_EMPTY_ALIASES'));
		return;
	}
	
	Ajax.send(Settings.ServerModuleName, 'DeleteAliases', {
		'UserId': this.iUserId,
		'Aliases': this.selectedAliases()
	}, function (oResponse) {
		if (oResponse.Result)
		{
			this.selectedAliases([]);
			this.requestAliases();
		}
		else
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_DELETE_ALIASES_PLURAL', {}, null, this.selectedAliases().length));
		}
	}, this);
};

/**
 * Requests aliases if setting tab is shown and user was changed.
 */
CAliasesPerUserAdminSettingsView.prototype.requestNewData = function ()
{
	if (this.bShown && this.iRequestedUserId !== this.iUserId)
	{
		this.requestAliases();
	}
};

/**
 * Requests aliases.
 */
CAliasesPerUserAdminSettingsView.prototype.requestAliases = function ()
{
	this.iRequestedUserId = this.iUserId;
	this.aliases([]);
	Ajax.send(Settings.ServerModuleName, 'GetAliases', {'UserId': this.iUserId}, function (oResponse) {
		if (oResponse.Result)
		{
			this.aliases(oResponse.Result.Aliases);
			this.domain(oResponse.Result.Domain);
		}
	}, this);
};

/**
 * Sets access level for the view via entity type and entity identifier.
 * This view is visible only for User entity type.
 * 
 * @param {string} sEntityType Current entity type.
 * @param {number} iEntityId Indentificator of current intity.
 */
CAliasesPerUserAdminSettingsView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === 'User');
	if (this.iUserId !== iEntityId)
	{
		this.iUserId = iEntityId;
		this.requestNewData();
	}
};

module.exports = new CAliasesPerUserAdminSettingsView();
