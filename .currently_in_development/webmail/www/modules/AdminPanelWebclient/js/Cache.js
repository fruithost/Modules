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
			Ajax.send(Settings.ServerModuleName, 'GetTenants');
		}
	});
	this.bTenantsChanged = false;
}

CCache.prototype.init = function (oAppData) {
	App.subscribeEvent('ReceiveAjaxResponse::after', this.onAjaxResponse.bind(this));
	
	var oAppDataSection = oAppData['%ModuleName%'];
	this.parseTenants(oAppDataSection ? oAppDataSection.Tenants : []);
};

CCache.prototype.onAjaxResponse = function (oParams) {
	if (oParams.Response.Module === Settings.ServerModuleName)
	{
		switch (oParams.Response.Method)
		{
			case 'CreateTables':
				Ajax.send(Settings.ServerModuleName, 'GetTenants');
				break;
			case 'CreateTenant':
			case 'DeleteTenants':
				// Can not request tenants immidiately because it will abort paged GetTenants request for tenants screen.
				this.bTenantsChanged = true;
				break;
			case 'GetTenants':
				var
					sSearch = Types.pString(oParams.Request.Parameters.Search),
					iOffset = Types.pInt(oParams.Request.Parameters.Offset),
					iLimit = Types.pInt(oParams.Request.Parameters.Limit)
				;
				if (sSearch === '' && iOffset === 0 && iLimit === 0)
				{
					this.parseTenants(oParams.Response.Result);
				}
				else if (this.bTenantsChanged)
				{
					Ajax.send(Settings.ServerModuleName, 'GetTenants');
				}
				this.bTenantsChanged = false;
				break;
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
