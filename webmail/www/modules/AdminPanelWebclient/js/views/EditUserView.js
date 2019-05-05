'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js')
;

/**
 * @constructor
 */
function CEditUserView()
{
	this.id = ko.observable(0);
	this.publicId = ko.observable('');
	this.aRoles = [
		{text: TextUtils.i18n('%MODULENAME%/LABEL_ADMINISTRATOR'), value: Enums.UserRole.SuperAdmin},
		{text: TextUtils.i18n('%MODULENAME%/LABEL_USER'), value: Enums.UserRole.NormalUser},
		{text: TextUtils.i18n('%MODULENAME%/LABEL_GUEST'), value: Enums.UserRole.Customer}
	];
	this.role = ko.observable(Enums.UserRole.NormalUser);
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
		this.role(),
		this.writeSeparateLog()
	];
};

CEditUserView.prototype.clearFields = function ()
{
	this.id(0);
	this.publicId('');
	this.role(Enums.UserRole.NormalUser);
	this.writeSeparateLog(false);
};

CEditUserView.prototype.parse = function (iEntityId, oResult)
{
	if (oResult)
	{
		this.id(iEntityId);
		this.publicId(oResult.PublicId);
		this.role(oResult.Role);
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
		Id: this.id(),
		PublicId: $.trim(this.publicId()),
		Role: this.role(),
		WriteSeparateLog: this.writeSeparateLog()
	};
};

CEditUserView.prototype.saveEntity = function (aParents, oRoot)
{
	_.each(aParents, function (oParent) {
		if (oParent.constructor.name === 'CEntitiesView' && _.isFunction(oParent.createEntity))
		{
			oParent.createEntity();
		}
		if (oParent.constructor.name === 'CCommonSettingsPaneView' && _.isFunction(oParent.save))
		{
			oParent.save(oRoot);
		}
	});
};

module.exports = new CEditUserView();
