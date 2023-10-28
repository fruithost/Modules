'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CMailQuotaAdminSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName, 'UpdateEntitySpaceLimits');
	
	this.bTenantAdmin = App.getUserRole() === Enums.UserRole.TenantAdmin;

	this.sEntityType = '';
	this.iEntityId = 0;
	
	this.tenantSpaceLimitMb = ko.observable('');
	this.userSpaceLimitMb = ko.observable('');
	this.allowChangeUserSpaceLimit = ko.observable('');
	this.allocatedTenantSpaceMb = ko.observable('');
}

_.extendOwn(CMailQuotaAdminSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CMailQuotaAdminSettingsFormView.prototype.ViewTemplate = '%ModuleName%_Settings_MailQuotaAdminSettingsFormView';

CMailQuotaAdminSettingsFormView.prototype.onRouteChild = function ()
{
	this.tenantSpaceLimitMb('');
	this.userSpaceLimitMb('');
	this.allowChangeUserSpaceLimit(false);
	this.allocatedTenantSpaceMb('');
	this.updateSavedState();
	
	this.requestPerTenantSettings();
	this.requestPerUserSettings();
};

CMailQuotaAdminSettingsFormView.prototype.requestPerTenantSettings = function ()
{
	if (this.sEntityType === 'Tenant' && Types.isPositiveNumber(this.iEntityId))
	{
		Ajax.send(Settings.ServerModuleName, 'GetEntitySpaceLimits', { 'Type': this.sEntityType, 'TenantId': this.iEntityId }, function (oResponse, oRequest) {
			if (oResponse.Result && oRequest.Parameters.TenantId === this.iEntityId)
			{
				this.tenantSpaceLimitMb(Types.pInt(oResponse.Result.TenantSpaceLimitMb));
				this.userSpaceLimitMb(Types.pInt(oResponse.Result.UserSpaceLimitMb));
				this.allowChangeUserSpaceLimit(Types.pBool(oResponse.Result.AllowChangeUserSpaceLimit));
				this.allocatedTenantSpaceMb(Types.pInt(oResponse.Result.AllocatedSpaceMb));
				this.updateSavedState();
			}
		}, this);
	}
};

CMailQuotaAdminSettingsFormView.prototype.requestPerUserSettings = function ()
{
	if (this.sEntityType === 'User' && Types.isPositiveNumber(this.iEntityId))
	{
		Ajax.send(Settings.ServerModuleName, 'GetEntitySpaceLimits', { 'Type': this.sEntityType, 'UserId': this.iEntityId }, function (oResponse, oRequest) {
			if (oResponse.Result && oRequest.Parameters.UserId === this.iEntityId)
			{
				this.userSpaceLimitMb(Types.pInt(oResponse.Result.UserSpaceLimitMb));
				this.allowChangeUserSpaceLimit(Types.pBool(oResponse.Result.AllowChangeUserSpaceLimit));
				this.updateSavedState();
			}
		}, this);
	}
};

CMailQuotaAdminSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.tenantSpaceLimitMb(),
		this.userSpaceLimitMb()
	];
};

CMailQuotaAdminSettingsFormView.prototype.getParametersForSave = function ()
{
	if (this.sEntityType === 'User')
	{
		return {
			'Type': 'User',
			'UserId': this.iEntityId,
			'UserSpaceLimitMb': Types.pInt(this.userSpaceLimitMb())
		};
	}
	if (this.sEntityType === 'Tenant')
	{
		return {
			'Type': 'Tenant',
			'TenantId': this.iEntityId,
			'TenantSpaceLimitMb': Types.pInt(this.tenantSpaceLimitMb()),
			'UserSpaceLimitMb': Types.pInt(this.userSpaceLimitMb())
		};
	}
	return {};
};

CMailQuotaAdminSettingsFormView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === 'User' || sEntityType === 'Tenant');
	this.sEntityType = sEntityType;
	this.iEntityId = iEntityId;
};

module.exports = new CMailQuotaAdminSettingsFormView();
