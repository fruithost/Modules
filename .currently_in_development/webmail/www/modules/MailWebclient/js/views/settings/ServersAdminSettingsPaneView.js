'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	CPageSwitcherView = require('%PathToCoreWebclientModule%/js/views/CPageSwitcherView.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	
	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),
	
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
	this.visibleSearch = ko.observable(false);
	
	this.iServersPerPage = 10;
	this.oServerPairPropertiesView = new CServerPairPropertiesView('server_edit', true, this.iServersPerPage);
	this.totalServersCount = this.oServerPairPropertiesView.totalServersCount;
	
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
	
	this.oPageSwitcher = new CPageSwitcherView(0, this.iServersPerPage);
	this.oPageSwitcher.currentPage.subscribe(function () {
		this.routeServerList();
	}, this);
	this.iCurrentPage = 0;
	this.totalServersCount.subscribe(function () {
		this.oPageSwitcher.setCount(this.totalServersCount());
		if (this.searchValue() === '')
		{
			this.visibleSearch(this.totalServersCount() > this.iServersPerPage);
		}
	}, this);
	
	this.isSearchFocused = ko.observable(false);
	this.newSearchValue = ko.observable('');
	this.searchValue = ko.observable('');

	this.updateSavedState();
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

CServersAdminSettingsPaneView.prototype.routeSearch = function ()
{
	var aHash = ['p1', this.newSearchValue()];
	ModulesManager.run('AdminPanelWebclient', 'setAddHash', [aHash]);
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
	var
		aHash = [],
		iPage = this.oPageSwitcher.currentPage()
	;
	if (iPage > 1 || this.searchValue() !== '')
	{
		aHash.push('p' + iPage);
	}
	if (this.searchValue() !== '')
	{
		aHash.push(this.searchValue());
	}
	aHash.push('s' + iId);
	ModulesManager.run('AdminPanelWebclient', 'setAddHash', [aHash]);
};

/**
 * Sets routing to only server list mode.
 */
CServersAdminSettingsPaneView.prototype.routeServerList = function ()
{
	var
		aHash = [],
		iPage = this.oPageSwitcher.currentPage()
	;
	if (iPage > 1 || this.searchValue() !== '')
	{
		aHash.push('p' + iPage);
	}
	if (this.searchValue() !== '')
	{
		aHash.push(this.searchValue());
	}
	ModulesManager.run('AdminPanelWebclient', 'setAddHash', [aHash]);
};

/**
 * Executes when routing was changed.
 * @param {array} aParams Routing parameters.
 */
CServersAdminSettingsPaneView.prototype.onRouteChild = function (aParams)
{
	var oParams = LinksUtils.parseMailServers(aParams);
	this.newSearchValue(oParams.Search);
	this.createMode(oParams.Create);
	this.editedServerId(oParams.EditServerId);
	
	this.oServerPairPropertiesView.serverInit(oParams.Create);
	
	if (!oParams.Create)
	{
		if (oParams.Page !== this.oPageSwitcher.currentPage())
		{
			this.oPageSwitcher.setPage(oParams.Page, this.iServersPerPage);
		}
		if (this.oPageSwitcher.currentPage() !== this.iCurrentPage || this.newSearchValue() !== this.searchValue())
		{
			this.iCurrentPage = this.oPageSwitcher.currentPage();
			this.searchValue(this.newSearchValue());
			this.oServerPairPropertiesView.requestServers((this.oPageSwitcher.currentPage() - 1) * this.iServersPerPage, this.searchValue());
		}
	}
	
	this.revert();
};

CServersAdminSettingsPaneView.prototype.onShow = function ()
{
	this.iCurrentPage = 0; // to re-request server list
	this.selectedTenantId(this.getSelectedTenantId());
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
				Ajax.send('DeleteServer', { 'ServerId': iId, 'TenantId': oServerToDelete.iTenantId, 'DeletionConfirmedByAdmin': true }, function (oResponse) {
					if (!oResponse.Result)
					{
						Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_DELETE_MAIL_SERVER'));
					}
					if (iId === this.editedServerId())
					{
//						this.editedServerId(null);
						this.routeServerList();
					}
					this.oServerPairPropertiesView.requestServers((this.oPageSwitcher.currentPage() - 1) * this.iServersPerPage, this.searchValue());
				}, this);
			}
		}, this),
		oServerToDelete = _.find(this.servers(), _.bind(function (oServer) {
			return oServer.iId === iId;
		}, this)),
		oDeleteEntityParams = {
			'Type': 'Server',
			'Count': 1,
			'ConfirmText': TextUtils.i18n('%MODULENAME%/CONFIRM_REMOVE_SERVER')
		}
	;
	if (oServerToDelete && oServerToDelete.bAllowToDelete)
	{
		App.broadcastEvent('ConfirmDeleteEntity::before', oDeleteEntityParams);
		Popups.showPopup(ConfirmPopup, [oDeleteEntityParams.ConfirmText, fCallBack, oServerToDelete.sName]);
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
			this.oServerPairPropertiesView.requestServers((this.oPageSwitcher.currentPage() - 1) * this.iServersPerPage, this.searchValue());
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
