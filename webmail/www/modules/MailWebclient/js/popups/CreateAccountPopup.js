'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	ValidationUtils = require('%PathToCoreWebclientModule%/js/utils/Validation.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	CAccountModel = require('modules/%ModuleName%/js/models/CAccountModel.js'),
	
	CServerPairPropertiesView = require('modules/%ModuleName%/js/views/settings/CServerPairPropertiesView.js')
;

/**
 * @constructor
 */
function CCreateAccountPopup()
{
	CAbstractPopup.call(this);
	
	this.loading = ko.observable(false);

	this.friendlyName = ko.observable('');
	this.email = ko.observable('');
	this.email.focused = ko.observable(false);
	this.incomingLogin = ko.observable('');
	this.incomingLogin.focused = ko.observable(false);
	this.incomingPassword = ko.observable('');
	this.incomingPassword.focused = ko.observable(false);
	
	this.oServerPairPropertiesView = new CServerPairPropertiesView('acc_create');
	
	this.email.focused.subscribe(function () {
		if (!this.email.focused() && $.trim(this.incomingLogin()) === '')
		{
			this.incomingLogin(this.email());
		}
	}, this);
	
	this.aRequiredFields = [this.email, this.incomingLogin, this.incomingPassword].concat(this.oServerPairPropertiesView.aRequiredFields);
}

_.extendOwn(CCreateAccountPopup.prototype, CAbstractPopup.prototype);

CCreateAccountPopup.prototype.PopupTemplate = '%ModuleName%_Settings_CreateAccountPopup';

CCreateAccountPopup.prototype.init = function ()
{
	this.friendlyName('');
	this.email('');
	this.incomingLogin('');
	this.incomingLogin.focused(false);
	this.incomingPassword('');

	this.oServerPairPropertiesView.fullInit();
};

/**
 * @param {Function=} fCallback
 */
CCreateAccountPopup.prototype.onOpen = function (fCallback, sFriendlyName, sEmail, sIncomingPassword)
{
	this.fCallback = fCallback;
	
	this.init();
	this.friendlyName(sFriendlyName);
	this.email(sEmail);
	this.incomingLogin(sEmail);
	this.incomingPassword(sIncomingPassword);
	this.focusFieldToEdit();
};

CCreateAccountPopup.prototype.focusFieldToEdit = function ()
{
	var koFirstEmptyField = _.find(this.aRequiredFields, function (koField) {
		return koField() === '';
	});
	
	if (koFirstEmptyField)
	{
		koFirstEmptyField.focused(true);
	}
	else if (this.aRequiredFields.length > 0)
	{
		this.aRequiredFields[0].focused(true);
	}
};

CCreateAccountPopup.prototype.onClose = function ()
{
	this.init();
};

CCreateAccountPopup.prototype.save = function ()
{
	if (ValidationUtils.checkIfFieldsEmpty(this.aRequiredFields, TextUtils.i18n('%MODULENAME%/ERROR_REQUIRED_FIELDS_EMPTY')))
	{
		var
			oParameters = {
				'FriendlyName': this.friendlyName(),
				'Email': $.trim(this.email()),
				'IncomingLogin': $.trim(this.incomingLogin()),
				'IncomingPassword': $.trim(this.incomingPassword()),
				'Server': this.oServerPairPropertiesView.getParametersForSave()
			}
		;

		this.loading(true);

		Ajax.send('CreateAccount', oParameters, this.onAccountCreateResponse, this);
	}
	else
	{
		this.loading(false);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CCreateAccountPopup.prototype.onAccountCreateResponse = function (oResponse, oRequest)
{
	this.loading(false);

	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_CREATE_ACCOUNT'));
	}
	else
	{
		var
			iAccountId = Types.pInt(oResponse.Result.AccountID),
			oAccount = new CAccountModel(oResponse.Result)
		;
		
		AccountList.addAccount(oAccount);
		AccountList.populateIdentities();
		AccountList.changeEditedAccount(iAccountId);
		if (AccountList.collection().length === 1)
		{
			AccountList.changeCurrentAccount(iAccountId);
		}
		
		if (this.fCallback)
		{
			this.fCallback(iAccountId);
		}
		
		this.closePopup();
	}
};

module.exports = new CCreateAccountPopup();
