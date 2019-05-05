'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	AddressUtils = require('%PathToCoreWebclientModule%/js/utils/Address.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Ajax = null,
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = null,
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	
	CFiltersModel = require('modules/%ModuleName%/js/models/CFiltersModel.js'),
	CServerModel = require('modules/%ModuleName%/js/models/CServerModel.js'),
	
	AccountList = null,
	Cache = null,
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 * @param {object} oData
 */
function CAccountModel(oData)
{
	App = require('%PathToCoreWebclientModule%/js/App.js');
	Ajax = require('modules/%ModuleName%/js/Ajax.js');
	
	this.id = ko.observable(Types.pInt(oData.AccountID));
	this.email = ko.observable(Types.pString(oData.Email));
	this.friendlyName = ko.observable(Types.pString(oData.FriendlyName));
	this.incomingLogin = ko.observable(Types.pString(oData.IncomingLogin));
	this.signature = ko.observable(Types.pString(oData.Signature));
	this.useSignature = ko.observable(!!oData.UseSignature);
	this.serverId = ko.observable(Types.pInt(oData.ServerId));
	this.oServer = new CServerModel(oData.Server);
	this.useToAuthorize = ko.observable(!!oData.UseToAuthorize);
	this.canBeUsedToAuthorize = ko.observable(!!oData.CanBeUsedToAuthorize);
	this.useThreading = ko.observable(!!oData.UseThreading);
	this.useThreading.subscribe(function () {
		this.requireCache();
		Cache.clearMessagesCache(this.id());
	}, this);
	this.bSaveRepliesToCurrFolder = !!oData.SaveRepliesToCurrFolder;
	
	this.isCurrent = ko.observable(false);
	this.isEdited = ko.observable(false);
	
	this.hash = ko.computed(function () {
		return Utils.getHash(this.id() + this.email());
	}, this);
	this.passwordSpecified = ko.observable(true);
	
	this.fetchers = ko.observableArray([]);
	this.identities = ko.observable(null);
	this.autoresponder = ko.observable(null);
	this.forward = ko.observable(null);
	this.filters = ko.observable(null);

	this.quota = ko.observable(0);
	this.usedSpace = ko.observable(0);
	this.quotaRecieved = ko.observable(false);

	this.fullEmail = ko.computed(function () {
		return AddressUtils.getFullEmail(this.friendlyName(), this.email());
	}, this);
	
	this.bDefault = Settings.AllowDefaultAccountForUser && this.email() === App.getUserPublicId();
	
	this.aExtend = Types.pObject(oData.Extend);
}

CAccountModel.prototype.threadingIsAvailable = function ()
{
	return this.oServer.bEnableThreading && this.useThreading();
};

CAccountModel.prototype.updateFromServer = function (oData)
{
	this.email(Types.pString(oData.Email));
	this.friendlyName(Types.pString(oData.FriendlyName));
	this.incomingLogin(Types.pString(oData.IncomingLogin));
	this.serverId(Types.pInt(oData.ServerId));
	this.oServer = new CServerModel(oData.Server);
	this.useToAuthorize(!!oData.UseToAuthorize);
	this.useThreading(!!oData.UseThreading);
	this.bSaveRepliesToCurrFolder = !!oData.SaveRepliesToCurrFolder;
};

CAccountModel.prototype.requireAccounts = function ()
{
	if (AccountList === null)
	{
		AccountList = require('modules/%ModuleName%/js/AccountList.js');
	}
};

CAccountModel.prototype.requireCache = function ()
{
	if (Cache === null)
	{
		Cache = require('modules/%ModuleName%/js/Cache.js');
	}
};

/**
 * @param {Object} oResult
 * @param {Object} oRequest
 */
CAccountModel.prototype.onGetQuotaResponse = function (oResult, oRequest)
{
	if (_.isArray(oResult.Result) && 1 < oResult.Result.length)
	{
		this.quota(Types.pInt(oResult.Result[1]));
		this.usedSpace(Types.pInt(oResult.Result[0]));
		
		this.requireCache();
		Cache.quotaChangeTrigger(!Cache.quotaChangeTrigger());
	}
	
	this.quotaRecieved(true);
};

CAccountModel.prototype.updateQuotaParams = function ()
{
	if (UserSettings.ShowQuotaBar)
	{
		Ajax.send('GetQuota', { 'AccountID': this.id() }, this.onGetQuotaResponse, this);
	}
};

/**
 * @param {string} sFriendlyName
 */
CAccountModel.prototype.updateFriendlyName = function (sFriendlyName)
{
	this.friendlyName(sFriendlyName);
};

CAccountModel.prototype.changeAccount = function()
{
	this.requireAccounts();
	AccountList.changeCurrentAccount(this.id(), true);
};

CAccountModel.prototype.getDefaultIdentity = function()
{
	return _.find(this.identities() || [], function (oIdentity) {
		return oIdentity.isDefault();
	});
};

/**
 * @returns {Array}
 */
CAccountModel.prototype.getFetchersIdentitiesEmails = function()
{
	var
		aIdentities = this.identities() || [],
		aEmails = []
	;
	
	_.each(this.fetchers(), function (oFetcher) {
		aEmails.push(oFetcher.email());
	});
	
	_.each(aIdentities, function (oIdentity) {
		aEmails.push(oIdentity.email());
	});
	
	return aEmails;
};

/**
 * Shows popup to confirm removing if it can be removed.
 */
CAccountModel.prototype.remove = function()
{
	var fCallBack = _.bind(this.confirmedRemove, this);
	
	if (!this.bDefault)
	{
		Popups.showPopup(ConfirmPopup, [TextUtils.i18n('%MODULENAME%/CONFIRM_REMOVE_ACCOUNT'), fCallBack, this.email()]);
	}
};

/**
 * Sends a request to the server for deletion account if received confirmation from the user.
 * 
 * @param {boolean} bOkAnswer
 */
CAccountModel.prototype.confirmedRemove = function(bOkAnswer)
{
	if (bOkAnswer)
	{
		Ajax.send('DeleteAccount', { 'AccountID': this.id() }, this.onAccountDeleteResponse, this);
	}
};

/**
 * Receives response from the server and removes account from js-application if removal operation on the server was successful.
 * 
 * @param {Object} oResponse Response obtained from the server.
 * @param {Object} oRequest Parameters has been transferred to the server.
 */
CAccountModel.prototype.onAccountDeleteResponse = function (oResponse, oRequest)
{
	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_REMOVE_ACCOUNT'));
	}
	else
	{
		var ComposeUtils = require('modules/%ModuleName%/js/utils/Compose.js');
		if (_.isFunction(ComposeUtils.closeComposePopup))
		{
			ComposeUtils.closeComposePopup();
		}
		
		this.requireAccounts();
		AccountList.deleteAccount(this.id());
	}
};

CAccountModel.prototype.requestFilters = function ()
{
	Ajax.send('GetFilters', { 'AccountID': this.id() }, this.onGetFiltersResponse, this);
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAccountModel.prototype.onGetFiltersResponse = function (oResponse, oRequest)
{
	var oFilters = new CFiltersModel();
	if (oResponse.Result)
	{
		oFilters.parse(this.id(), oResponse.Result);
	}
	this.filters(oFilters);
};

module.exports = CAccountModel;
