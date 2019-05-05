'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 * 
 * @param {Object} oParent
 * @param {boolean} bCreate
 */
function CIdentitySettingsFormView(oParent, bCreate)
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.identity = ko.observable(null);
	
	this.oParent = oParent;
	this.bCreate = bCreate;

	this.disableCheckbox = ko.observable(false);

	this.isDefault = ko.observable(false);
	this.email = ko.observable('');
	this.accountPart = ko.observable(false);
	this.friendlyName = ko.observable('');
	this.friendlyNameHasFocus = ko.observable(false);
}

_.extendOwn(CIdentitySettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CIdentitySettingsFormView.prototype.ViewTemplate = '%ModuleName%_Settings_IdentitySettingsFormView';
CIdentitySettingsFormView.prototype.ViewConstructorName = 'CIdentitySettingsFormView';

/**
 * @param {Object} oIdentity
 */
CIdentitySettingsFormView.prototype.onShow = function (oIdentity)
{
	this.identity(oIdentity && !oIdentity.FETCHER ? oIdentity : null);
	this.populate();
};

CIdentitySettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.friendlyName(),
		this.email()
	];
};

CIdentitySettingsFormView.prototype.getParametersForSave = function ()
{
	if (this.identity())
	{
		var
			oParameters = {
				'AccountID': this.identity().accountId(),
				'Default': this.isDefault(),
				'FriendlyName': this.friendlyName(),
				'AccountPart': this.identity().bAccountPart
			}
		;

		if (!this.identity().bAccountPart)
		{
			_.extendOwn(oParameters, {
				'Email': $.trim(this.email())
			});

			if (!this.bCreate)
			{
				oParameters.EntityId = this.identity().id();
			}
		}

		return oParameters;
	}
	
	return {};
};

CIdentitySettingsFormView.prototype.save = function ()
{
	if ($.trim(this.email()) === '')
	{
		Screens.showError(Utils.i18n('%MODULENAME%/ERROR_IDENTITY_FIELDS_BLANK'));
	}
	else
	{
		this.isSaving(true);

		this.updateSavedState();

		Ajax.send(this.bCreate ? 'CreateIdentity' : 'UpdateIdentity', this.getParametersForSave(), this.onResponse, this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CIdentitySettingsFormView.prototype.onResponse = function (oResponse, oRequest)
{
	this.isSaving(false);

	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_IDENTITY_ADDING'));
	}
	else
	{
		var
			oParameters = oRequest.Parameters,
			iAccountId = Types.pInt(oParameters.AccountID),
			oAccount = 0 < iAccountId ? AccountList.getAccount(iAccountId) : null
		;
		
		AccountList.populateIdentities(function () {
			var
				oCurrAccount = AccountList.getCurrent(),
				aCurrIdentities = oCurrAccount.identities(),
				oCreatedIdentity = _.find(aCurrIdentities, function (oIdentity) {
					return oIdentity.id() === oResponse.Result;
				})
			;
			if (oCreatedIdentity) {
				ModulesManager.run('SettingsWebclient', 'setAddHash', [['identity', oCreatedIdentity.hash()]]);
			}
		});
		
		if (this.bCreate && _.isFunction(this.oParent.closePopup))
		{
			this.oParent.closePopup();
		}

		if (oParameters.AccountPart && oAccount)
		{
			oAccount.updateFriendlyName(oParameters.FriendlyName);
		}

		this.disableCheckbox(this.isDefault());
		
		Screens.showReport(TextUtils.i18n('COREWEBCLIENT/REPORT_SETTINGS_UPDATE_SUCCESS'));
	}
};

CIdentitySettingsFormView.prototype.populate = function ()
{
	var oIdentity = this.identity();
	
	if (oIdentity)
	{
		this.isDefault(oIdentity.isDefault());
		this.email(oIdentity.email());
		this.accountPart(oIdentity.bAccountPart);
		this.friendlyName(oIdentity.friendlyName());

		this.disableCheckbox(oIdentity.isDefault());

		setTimeout(function () {
			this.updateSavedState();
		}.bind(this), 1);
	}
};

CIdentitySettingsFormView.prototype.remove = function ()
{
	if (this.identity() && !this.identity().bAccountPart)
	{
		var oParameters = {
			'AccountID': this.identity().accountId(),
			'EntityId': this.identity().id()
		};

		Ajax.send('DeleteIdentity', oParameters, this.onAccountIdentityDeleteResponse, this);

		if (!this.bCreate && _.isFunction(this.oParent.onRemoveIdentity))
		{
			this.oParent.onRemoveIdentity();
		}
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CIdentitySettingsFormView.prototype.onAccountIdentityDeleteResponse = function (oResponse, oRequest)
{
	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_IDENTITY_DELETING'));
	}
	AccountList.populateIdentities();
};

CIdentitySettingsFormView.prototype.cancel = function ()
{
	if (_.isFunction(this.oParent.cancelPopup))
	{
		this.oParent.cancelPopup();
	}
};

module.exports = CIdentitySettingsFormView;
