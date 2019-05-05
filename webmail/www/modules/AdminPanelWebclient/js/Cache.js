'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	CoreSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js');
;

function CCache()
{
	this.tenants = ko.observableArray([]);
	this.selectedTenantId = ko.observable(0);
	this.selectedTenant = ko.computed(function () {
		return _.find(this.tenants(), function (oTenant) {
			return oTenant.Id === this.selectedTenantId();
		}.bind(this)) || { Name: '' };
	}, this);
	CoreSettings.dbSettingsChanged.subscribe(function () {
		if (CoreSettings.dbSettingsChanged())
		{
			Ajax.send(Settings.ServerModuleName, 'GetEntityList', { Type: 'Tenant' });
		}
	});
}

CCache.prototype.init = function (oAppData) {
	App.subscribeEvent('ReceiveAjaxResponse::after', this.onAjaxResponse.bind(this));
	
	var oAppDataSection = oAppData[Settings.ServerModuleName];
	this.parseTenants(oAppDataSection ? oAppDataSection.Tenants : []);
};

CCache.prototype.onAjaxResponse = function (oParams) {
	if (oParams.Response.Module === Settings.ServerModuleName && oParams.Response.Method === 'GetEntityList' && oParams.Request.Parameters.Type === 'Tenant')
	{
		var
			sSearch = Types.pString(oParams.Request.Parameters.Search),
			iOffset = Types.pInt(oParams.Request.Parameters.Offset)
		;
		if (sSearch === '' && iOffset === 0)
		{
			this.parseTenants(oParams.Response.Result);
		}
	}
};

CCache.prototype.setSelectedTenant = function (iId)
{
	if (_.find(this.tenants(), function (oTenant) { return oTenant.Id === iId; }))
	{
		this.selectedTenantId(iId);
	}
};

CCache.prototype.parseTenants = function (oResult)
{
	var
		iSelectedId = this.selectedTenantId(),
		bHasSelected = false,
		aTenantsData = oResult && _.isArray(oResult.Items) ? oResult.Items : [],
		aTenants = []
	;

	_.each(aTenantsData, function (oTenantData) {
		var oTenant = {
			Name: oTenantData.Name,
			Id: Types.pInt(oTenantData.Id)
		};
		if (oTenant.Id === iSelectedId)
		{
			bHasSelected = true;
		}
		aTenants.push(oTenant);
	});

	if (!bHasSelected)
	{
		this.selectedTenantId(aTenants.length > 0 ? aTenants[0].Id : 0);
	}
	
	this.tenants(aTenants);
};

module.exports = new CCache();
