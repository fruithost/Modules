'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CEditUserView()
{
	this.id = ko.observable(0);
	this.publicId = ko.observable('');
	this.bAllowMakeTenant = Settings.EnableMultiTenant && App.getUserRole() === Enums.UserRole.SuperAdmin;
	this.tenantAdminSelected = ko.observable(false);
	this.writeSeparateLog = ko.observable(false);
	
	this.sHeading = TextUtils.i18n('%MODULENAME%/HEADING_CREATE_USER');
	this.sActionCreate = TextUtils.i18n('COREWEBCLIENT/ACTION_CREATE');
	this.sActionCreateInProgress = TextUtils.i18n('COREWEBCLIENT/ACTION_CREATE_IN_PROGRESS');
	
	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
}

CEditUserView.prototype.ViewTemplate = '%ModuleName%_EditUserView';
CEditUserView.prototype.ViewConstructorName = 'CEditUserView';

CEditUserView.prototype.getCurrentValues = function ()
{
	return [
		this.id(),
		this.publicId(),
		this.tenantAdminSelected(),
		this.writeSeparateLog()
	];
};

CEditUserView.prototype.clearFields = function ()
{
	this.id(0);
	this.publicId('');
	this.tenantAdminSelected(false);
	this.writeSeparateLog(false);
};

CEditUserView.prototype.parse = function (iEntityId, oResult)
{
	if (oResult)
	{
		this.id(iEntityId);
		this.publicId(oResult.PublicId);
		this.tenantAdminSelected(oResult.Role === Enums.UserRole.TenantAdmin);
		this.writeSeparateLog(!!oResult.WriteSeparateLog);
	}
	else
	{
		this.clearFields();
	}
};

CEditUserView.prototype.isValidSaveData = function ()
{
	var bValid = $.trim(this.publicId()) !== '';
	if (!bValid)
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_USER_NAME_EMPTY'));
	}
	return bValid;
};

CEditUserView.prototype.getParametersForSave = function ()
{
	return {
		UserId: this.id(),
		PublicId: $.trim(this.publicId()),
		Role: this.tenantAdminSelected() ? Enums.UserRole.TenantAdmin : Enums.UserRole.NormalUser,
		WriteSeparateLog: this.writeSeparateLog(),
		Forced: true
	};
};

CEditUserView.prototype.saveEntity = function (aParents, oRoot)
{
	_.each(aParents, function (oParent) {
		if (_.isFunction(oParent.createEntity))
		{
			oParent.createEntity();
		}
		else if (_.isFunction(oParent.save))
		{
			oParent.save(oRoot);
		}
	});
};

module.exports = new CEditUserView();
