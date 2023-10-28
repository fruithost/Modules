'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	Browser = require('%PathToCoreWebclientModule%/js/Browser.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	CoreAjax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CHtmlEditorView = require('modules/%ModuleName%/js/views/CHtmlEditorView.js')
;

/**
 * @constructor
 */ 
function CSignatureSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.fetcherOrIdentity = ko.observable(null);
	
	this.useSignatureRadio = ko.observable(Enums.UseSignature.Off);
	this.signature = ko.observable('');

	this.oHtmlEditor = new CHtmlEditorView(true);
	this.oHtmlEditor.textFocused.subscribe(function () {
		if (this.oHtmlEditor.textFocused())
		{
			this.useSignatureRadio(Enums.UseSignature.On);
		}
	}, this);
	this.useSignatureRadio.subscribe(function () {
		this.oHtmlEditor.setInactive(this.useSignatureRadio() === Enums.UseSignature.Off);
	}, this);
	this.enableImageDragNDrop = ko.observable(false);

	this.enabled = ko.observable(true);
}

_.extendOwn(CSignatureSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CSignatureSettingsFormView.prototype.ViewTemplate = '%ModuleName%_Settings_SignatureSettingsFormView';
CSignatureSettingsFormView.prototype.ViewConstructorName = 'CSignatureSettingsFormView';

/**
 * @param {Object} oFetcherOrIdentity
 */
CSignatureSettingsFormView.prototype.onShow = function (oFetcherOrIdentity)
{
	this.fetcherOrIdentity(oFetcherOrIdentity || null);
	this.populate();
	_.defer(_.bind(this.init, this));
};

CSignatureSettingsFormView.prototype.init = function ()
{
	this.oHtmlEditor.setInactive(this.useSignatureRadio() === Enums.UseSignature.Off);
	this.oHtmlEditor.init(this.signature(), false, '', TextUtils.i18n('%MODULENAME%/LABEL_ENTER_SIGNATURE_HERE'));
	this.enableImageDragNDrop(this.oHtmlEditor.isDragAndDropSupported() && !Browser.ie10AndAbove);
};

CSignatureSettingsFormView.prototype.getCurrentValues = function ()
{
	if (this.oHtmlEditor.isInitialized())
	{
		this.signature(this.oHtmlEditor.getText());
	}
	return [
		this.useSignatureRadio(),
		this.signature()
	];
};

CSignatureSettingsFormView.prototype.revert = function ()
{
	this.populate();
};

CSignatureSettingsFormView.prototype.getParametersForSave = function ()
{
	this.signature(this.oHtmlEditor.getText());
	
	var
		oEditAccount = AccountList.getEdited(),
		iAccountId = this.fetcherOrIdentity() ? this.fetcherOrIdentity().accountId() : (oEditAccount ? oEditAccount.id() : 0),
		oParameters = {
			'AccountID': iAccountId,
			'UseSignature': this.useSignatureRadio() === Enums.UseSignature.On,
			'Signature': this.signature()
		}
	;
	
	if (this.fetcherOrIdentity())
	{
		if (this.fetcherOrIdentity().FETCHER)
		{
			_.extendOwn(oParameters, { 'FetcherId': this.fetcherOrIdentity().id() });
		}
		else if (this.fetcherOrIdentity().ALIAS)
		{
			_.extendOwn(oParameters, { 'AliasId': this.fetcherOrIdentity().id() });
		}
		else if (!this.fetcherOrIdentity().bAccountPart)
		{
			_.extendOwn(oParameters, { 'IdentityId': this.fetcherOrIdentity().id() });
		}
	}
	
	return oParameters;
};

/**
 * @param {Object} oParameters
 */
CSignatureSettingsFormView.prototype.applySavedValues = function (oParameters)
{
	if (oParameters.FetcherId)
	{
		AccountList.populateFetchers();
	}
	else if (oParameters.AliasId)
	{
		AccountList.populateAliases();
	}
	else if (!oParameters.IdentityId)
	{
		var oAccount = AccountList.getAccount(oParameters.AccountID);
		if (oAccount)
		{
			oAccount.useSignature(!!oParameters.UseSignature);
			oAccount.signature(oParameters.Signature);
		}
	}
	AccountList.populateIdentities();
};

CSignatureSettingsFormView.prototype.populate = function ()
{
	var
		oAccount = AccountList.getEdited(),
		oSignature = this.fetcherOrIdentity() || oAccount
	;
	
	if (oSignature)
	{
		this.useSignatureRadio(oSignature.useSignature() ? Enums.UseSignature.On : Enums.UseSignature.Off);
		this.signature(oSignature.signature());
		this.oHtmlEditor.setText(this.signature());
	}
	else if (oAccount)
	{
		Ajax.send('GetSignature', {'AccountID': oAccount.id()}, this.onGetSignatureResponse, this);
	}
	
	this.updateSavedState();
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CSignatureSettingsFormView.prototype.onGetSignatureResponse = function (oResponse, oRequest)
{
	if (oResponse && oResponse.Result)
	{
		var
			oParameters = oRequest.Parameters,
			iAccountId = Types.pInt(oParameters.AccountID),
			oAccount = AccountList.getAccount(iAccountId)
		;

		if (oAccount)
		{
			this.parseSignature(oResponse.Result);

			if (iAccountId === AccountList.editedId())
			{
				this.populate();
			}
		}
	}
};

CSignatureSettingsFormView.prototype.save = function ()
{
	this.isSaving(true);
	
	this.updateSavedState();
	
	if (this.fetcherOrIdentity() && this.fetcherOrIdentity().FETCHER)
	{
		CoreAjax.send(Settings.FetchersServerModuleName, 'UpdateSignature', this.getParametersForSave(), this.onResponse, this);
	}
	else if (this.fetcherOrIdentity() && this.fetcherOrIdentity().ALIAS)
	{
		CoreAjax.send(Settings.AliasesServerModuleName, 'UpdateSignature', this.getParametersForSave(), this.onResponse, this);
	}
	else
	{
		Ajax.send('UpdateSignature', this.getParametersForSave(), this.onResponse, this);
	}
};

/**
 * Parses the response from the server. If the settings are normally stored, then updates them. 
 * Otherwise an error message.
 * 
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CSignatureSettingsFormView.prototype.onResponse = function (oResponse, oRequest)
{
	this.isSaving(false);
	
	if (oResponse.Result)
	{
		this.applySavedValues(oRequest.Parameters);
		Screens.showReport(TextUtils.i18n('COREWEBCLIENT/REPORT_SETTINGS_UPDATE_SUCCESS'));
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_SAVING_SETTINGS_FAILED'));
	}
};

module.exports = new CSignatureSettingsFormView();
