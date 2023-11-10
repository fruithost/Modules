'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js')
;

function GetAdditionalFieldValue (oField, sValue)
{
	switch (oField.FieldType)
	{
		case 'bool': return Types.pBool(sValue);
		case 'int': return Types.pInt(sValue);
		default: return Types.pString(sValue);
	}
};

function ParseAdditionalFields(sEntityType)
{
	var aAdditionalFields = Types.pArray(window.auroraAppData && window.auroraAppData.additional_entity_fields_to_edit);
	return _.filter(aAdditionalFields, function (oField) {
		oField.value = ko.observable(GetAdditionalFieldValue(oField, ''));
		return oField.Entity === sEntityType;
	});
}

/**
 * @constructor
 */
function CEditTenantView()
{
	this.bAllowEditWebDomain = App.getUserRole() === Enums.UserRole.SuperAdmin;
	this.id = ko.observable(0);
	this.name = ko.observable('');
	this.description = ko.observable('');
	this.webDomain = ko.observable('');
	this.siteName = ko.observable('');
	
	this.sHeading = TextUtils.i18n('%MODULENAME%/HEADING_CREATE_TENANT');
	this.sActionCreate = TextUtils.i18n('COREWEBCLIENT/ACTION_CREATE');
	this.sActionCreateInProgress = TextUtils.i18n('COREWEBCLIENT/ACTION_CREATE_IN_PROGRESS');
	
	this.aAdditionalFields = ParseAdditionalFields('Tenant');
}

CEditTenantView.prototype.ViewTemplate = '%ModuleName%_EditTenantView';

CEditTenantView.prototype.getCurrentValues = function ()
{
	var aFieldsValues = [
		this.id(),
		this.name(),
		this.description(),
		this.webDomain(),
		this.siteName()
	];
	
	_.each(this.aAdditionalFields, function (oField) {
		aFieldsValues.push(oField.value());
	});
	
	return aFieldsValues;
};

CEditTenantView.prototype.clearFields = function ()
{
	this.id(0);
	this.name('');
	this.description('');
	this.webDomain('');
	this.siteName('');
	
	_.each(this.aAdditionalFields, function (oField) {
		oField.value(GetAdditionalFieldValue(oField, ''));
	});
};

CEditTenantView.prototype.parse = function (iEntityId, oResult)
{
	if (oResult)
	{
		this.id(iEntityId);
		this.name(oResult.Name);
		this.description(oResult.Description);
		this.webDomain(oResult.WebDomain);
		this.siteName(oResult.SiteName);
		
		_.each(this.aAdditionalFields, function (oField) {
			oField.value(GetAdditionalFieldValue(oField, oResult[oField.FieldName]));
			oField.EnableOnCreate = Types.pBool(oField.EnableOnCreate, true);
			oField.EnableOnEdit = Types.pBool(oField.EnableOnEdit, true);
		});
	}
	else
	{
		this.clearFields();
	}
};

CEditTenantView.prototype.isValidSaveData = function ()
{
	if ($.trim(this.name()) === '')
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_TENANT_NAME_EMPTY'));
		return false;
	}
	if ((/[\\\/\:\*\?\\\"\<\>\|]/gi).test(this.name()))
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_TENANT_NAME_INVALID'));
		return false;
	}
	return true;
};

CEditTenantView.prototype.getParametersForSave = function ()
{
	var oParameters = {
		TenantId: this.id(),
		Name: this.name(),
		Description: this.description(),
		WebDomain: this.webDomain(),
		SiteName: this.siteName()
	};
	
	_.each(this.aAdditionalFields, function (oField) {
		var mValue = oField.value();
		if (oField.FieldType === 'int')
		{
			mValue = Types.pInt(mValue);
		}
		oParameters[oField.FieldName] = mValue;
	});
	
	return oParameters;
};

module.exports = new CEditTenantView();
