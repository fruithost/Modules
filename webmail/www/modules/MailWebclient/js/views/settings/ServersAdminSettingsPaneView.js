'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	CServerPairPropertiesView = require('modules/%ModuleName%/js/views/settings/CServerPairPropertiesView.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CServersAdminSettingsPaneView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);

	this.visible = ko.observable(true);
	
	this.oServerPairPropertiesView = new CServerPairPropertiesView('server_edit', true);
	
	this.tenants = ModulesManager.run('AdminPanelWebclient', 'getTenantsObservable');
	this.tenantOptions = ko.computed(function () {
		return _.union([{Name: 'system-wide', Id: 0}], this.tenants());
	}, this);
	this.selectedTenantId = ko.observable(this.getSelectedTenantId());
	
	this.servers = this.oServerPairPropertiesView.servers;
	this.servers.subscribe(function () {
		_.each(this.servers(), function (oServer) {
			if (oServer.iTenantId === 0 || !Settings.EnableMultiTenant)
			{
				oServer.sTenantHint = '';
			}
			else
			{
				var oTenant = _.find(this.tenants(), function (oTmpTenant) {
					return oTmpTenant.Id === oServer.iTenantId;
				});
				oServer.sTenantHint = oTenant ? ' ' + TextUtils.i18n('%MODULENAME%/LABEL_HINT_SERVERS_TENANTNAME', {'TENANTNAME': oTenant.Name}) : '';
			}
		}.bind(this));
		if (!this.editedServer())
		{
			this.routeServerList();
		}
		if (!this.serversRetrieved())
		{
			this.revert();
		}
	}, this);
	this.serversRetrieved = this.oServerPairPropertiesView.serversRetrieved;
	this.createMode = ko.observable(false);
	this.editedServerId = ko.observable(0);
	this.editedServer = ko.computed(function () {
		return _.find(this.servers(), _.bind(function (oServer) {
			return oServer.iId === this.editedServerId();
		}, this));
	}, this);
	
	this.updateSavedState();
	this.oServerPairPropertiesView.currentValues.subscribe(function () {
		this.updateSavedState();
	}, this);
}

_.extendOwn(CServersAdminSettingsPaneView.prototype, CAbstractSettingsFormView.prototype);

CServersAdminSettingsPaneView.prototype.ViewTemplate = '%ModuleName%_Settings_ServersAdminSettingsPaneView';

CServersAdminSettingsPaneView.prototype.getSelectedTenantId = function ()
{
	if (this.tenants().length < 2)
	{
		return 0;
	}
	var koSelectedId = ModulesManager.run('AdminPanelWebclient', 'getKoSelectedTenantId');
	return _.isFunction(koSelectedId) ? koSelectedId() : 0;
};

/**
 * Sets routing to create server mode.
 */
CServersAdminSettingsPaneView.prototype.routeCreateServer = function ()
{
	ModulesManager.run('AdminPanelWebclient', 'setAddHash', [['create']]);
};

/**
 * Sets routing to edit server mode.
 * @param {number} iId Server identifier.
 */
CServersAdminSettingsPaneView.prototype.routeEditServer = function (iId)
{
	ModulesManager.run('AdminPanelWebclient', 'setAddHash', [[iId]]);
};

/**
 * Sets routing to only server list mode.
 */
CServersAdminSettingsPaneView.prototype.routeServerList = function ()
{
	ModulesManager.run('AdminPanelWebclient', 'setAddHash', [[]]);
};

/**
 * Executes when routing was changed.
 * @param {array} aParams Routing parameters.
 */
CServersAdminSettingsPaneView.prototype.onRouteChild = function (aParams)
{
	var
		bCreate = Types.isNonEmptyArray(aParams) && aParams[0] === 'create',
		iEditServerId = !bCreate && Types.isNonEmptyArray(aParams) ? Types.pInt(aParams[0]) : 0
	;
	
	this.createMode(bCreate);
	this.editedServerId(iEditServerId);
	
	this.oServerPairPropertiesView.serverInit(bCreate);
	
	this.revert();
};

CServersAdminSettingsPaneView.prototype.onShow = function ()
{
	this.selectedTenantId(this.getSelectedTenantId());
	this.oServerPairPropertiesView.requestServers();
};

/**
 * Shows popup to confirm server deletion and sends request to delete on server.
 * @param {number} iId
 */
CServersAdminSettingsPaneView.prototype.deleteServer = function (iId)
{
	var
		fCallBack = _.bind(function (bDelete) {
			if (bDelete)
			{
				Ajax.send('DeleteServer', { 'ServerId': iId, 'TenantId': oServerToDelete.iTenantId }, function (oResponse) {
					if (!oResponse.Result)
					{
						Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_DELETE_MAIL_SERVER'));
					}
					this.oServerPairPropertiesView.requestServers();
				}, this);
			}
		}, this),
		oServerToDelete = _.find(this.servers(), _.bind(function (oServer) {
			return oServer.iId === iId;
		}, this))
	;
	if (oServerToDelete && oServerToDelete.bAllowToDelete)
	{
		Popups.showPopup(ConfirmPopup, [TextUtils.i18n('%MODULENAME%/CONFIRM_REMOVE_SERVER'), fCallBack, oServerToDelete.sName]);
	}
};

/**
 * Sends request to server for server creating or updating.
 */
CServersAdminSettingsPaneView.prototype.save = function ()
{
	if (this.oServerPairPropertiesView.validateBeforeSave())
	{
		var
			sMethod = this.createMode() ? 'CreateServer' : 'UpdateServer'
		;
		this.isSaving(true);
		Ajax.send(sMethod, this.getParametersForSave(), function (oResponse) {
			this.isSaving(false);
			this.oServerPairPropertiesView.requestServers();
			if (this.createMode())
			{
				this.routeServerList();
			}
			else
			{
				if (oResponse.Result)
				{
					Screens.showReport(TextUtils.i18n('COREWEBCLIENT/REPORT_SETTINGS_UPDATE_SUCCESS'));
				}
				else
				{
					Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_SAVING_SETTINGS_FAILED'));
				}
			}
		}, this);
	}
};

/**
 * Returns list of current values to further comparing of states.
 * @returns {Array}
 */
CServersAdminSettingsPaneView.prototype.getCurrentValues = function ()
{
	return this.oServerPairPropertiesView.getCurrentValues();
};

/**
 * Reverts fields values to empty or edited server.
 */
CServersAdminSettingsPaneView.prototype.revertGlobalValues = function ()
{
	this.oServerPairPropertiesView.setServerId(this.editedServerId());
};

/**
 * Returns parameters for creating or updating on server.
 * @returns {Object}
 */
CServersAdminSettingsPaneView.prototype.getParametersForSave = function ()
{
	var oParameters = this.oServerPairPropertiesView.getParametersForSave();
	if (this.createMode())
	{
		oParameters.TenantId = this.selectedTenantId();
	}
	else
	{
		oParameters.TenantId = this.editedServer().iTenantId;
	}
	return oParameters;
};

/**
 * Detemines if pane could be visible for specified entity type.
 * @param {string} sEntityType
 * @param {number} iEntityId
 */
CServersAdminSettingsPaneView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === '');
};

module.exports = new CServersAdminSettingsPaneView();
