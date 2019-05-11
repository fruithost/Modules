'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	MainTab = App.isNewTab() && window.opener ? window.opener.MainTabMailMethods : null,
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	CoreAjax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CAccountModel = require('modules/%ModuleName%/js/models/CAccountModel.js'),
	CFetcherModel = require('modules/%ModuleName%/js/models/CFetcherModel.js'),
	CIdentityModel = require('modules/%ModuleName%/js/models/CIdentityModel.js')
;

/**
 * @constructor
 */
function CAccountListModel()
{
	this.collection = ko.observableArray([]);
}

/**
 * @param {string} sHash
 */
CAccountListModel.prototype.getAccountByHash = function (sHash)
{
	return _.find(this.collection(), function (oAcct) {
		return oAcct.hash() === sHash;
	}, this);
};

/**
 * @param {string} sNewCurrentHash
 */
CAccountListModel.prototype.changeCurrentAccountByHash = function (sNewCurrentHash)
{
	var oAccount = this.getAccountByHash(sNewCurrentHash);
	
	if (oAccount && oAccount.id() !== this.currentId())
	{
		this.changeCurrentAccount(oAccount.id(), false);
	}
};

/**
 * Changes current account. Sets hash to show new account data.
 * 
 * @param {number} iNewCurrentId
 * @param {boolean} bPassToMail
 */
CAccountListModel.prototype.changeCurrentAccount = function (iNewCurrentId, bPassToMail)
{
	var
		oCurrentAccount = this.getCurrent(),
		oNewCurrentAccount = this.getAccount(iNewCurrentId)
	;

	if (oNewCurrentAccount && this.currentId() !== iNewCurrentId)
	{
		if (oCurrentAccount)
		{
			oCurrentAccount.isCurrent(false);
		}
		this.currentId(iNewCurrentId);
		oNewCurrentAccount.isCurrent(true);
	}
	else if (!oCurrentAccount)
	{
		this.currentId(0);
	}
	
	if (bPassToMail)
	{
		Routing.setHash(LinksUtils.getMailbox());
	}
};

/**
 * @param {string} sNewEditedHash
 */
CAccountListModel.prototype.changeEditedAccountByHash = function (sNewEditedHash)
{
	var oAccount = this.getAccountByHash(sNewEditedHash);
	
	if (oAccount && oAccount.id() !== this.editedId())
	{
		this.changeEditedAccount(oAccount.id());
	}
};

/**
 * Changes editable account.
 * 
 * @param {number} iNewEditedId
 */
CAccountListModel.prototype.changeEditedAccount = function (iNewEditedId)
{
	var
		oEditedAccount = this.getEdited(),
		oNewEditedAccount = this.getAccount(iNewEditedId)
	;
	
	if (oNewEditedAccount && this.editedId() !== iNewEditedId)
	{
		if (oEditedAccount)
		{
			oEditedAccount.isEdited(false);
		}
		this.editedId(iNewEditedId);
		oNewEditedAccount.isEdited(true);
	}
	else if (!oEditedAccount)
	{
		this.editedId(0);
	}
};

CAccountListModel.prototype.getDefaultFriendlyName = function()
{
	var
		oCurrAccount = this.getCurrent(),
		oDefIdentity = _.find(oCurrAccount && oCurrAccount.identities() || [], function (oIdnt) {
			return oIdnt.isDefault();
		}) || oCurrAccount
	;
	
	return oDefIdentity ? oDefIdentity.friendlyName() || oDefIdentity.email() : '';
};

/**
 * @param {type} sHash
 * @returns {Object}
 */
CAccountListModel.prototype.getIdentityByHash = function(sHash)
{
	var oIdentity = null;
	
	_.each(this.collection(), function (oAccount) {
		if (!oIdentity)
		{
			oIdentity = _.find(oAccount.identities() || [], function (oIdnt) {
				return oIdnt.hash() === sHash;
			});
		}
	}, this);
	
	return oIdentity;
};

/**
 * @param {type} sHash
 * @returns {Object}
 */
CAccountListModel.prototype.getFetcherByHash = function(sHash)
{
	var oFoundFetcher = null;
	
	_.each(this.collection(), function (oAccount) {
		if (!oFoundFetcher)
		{
			oFoundFetcher = _.find(oAccount.fetchers(), function (oFetcher) {
				return oFetcher.hash() === sHash;
			});
		}
	}, this);
	
	return oFoundFetcher;
};

/**
 * Fills the collection of accounts.
 * @param {Array} aAccounts
 */
CAccountListModel.prototype.parse = function (aAccounts)
{
	if (_.isArray(aAccounts))
	{
		this.collection(_.map(aAccounts, function (oRawAccount)
		{
			return new CAccountModel(oRawAccount);
		}));
		this.initObservables(this.collection().length > 0 ? this.collection()[0].id() : 0);
	}
};

/**
 * @param {int} iCurrentId
 */
CAccountListModel.prototype.initObservables = function (iCurrentId)
{
	var oCurrAccount = this.getAccount(iCurrentId);
	if (oCurrAccount)
	{
		oCurrAccount.isCurrent(true);
		oCurrAccount.isEdited(true);
	}

	this.currentId = ko.observable(iCurrentId);
	this.editedId = ko.observable(iCurrentId);
};

/**
 * @return {boolean}
 */
CAccountListModel.prototype.hasAccount = function ()
{
	return this.collection().length > 0;
};

/**
 * @param {number} iId
 * 
 * @return {Object|undefined}
 */
CAccountListModel.prototype.getAccount = function (iId)
{
	var oAccount = _.find(this.collection(), function (oAcct) {
		return oAcct.id() === iId;
	}, this);
	
	/**	@type {Object|undefined} */
	return oAccount;
};

/**
 * @return {Object|undefined}
 */
CAccountListModel.prototype.getDefault = function ()
{
	var oAccount = _.find(this.collection(), function (oAcct) {
		return oAcct.bDefault;
	}, this);
	
	return oAccount;
};

/**
 * @return {Object|undefined}
 */
CAccountListModel.prototype.getCurrent = function ()
{
	return this.getAccount(this.currentId());
};

/**
 * @return {Object|undefined}
 */
CAccountListModel.prototype.getEdited = function ()
{
	return this.getAccount(this.editedId());
};

/**
 * @param {number=} iAccountId
 * @return {string}
 */
CAccountListModel.prototype.getEmail = function (iAccountId)
{
	iAccountId = iAccountId || this.currentId();
	
	var
		sEmail = '',
		oAccount = this.getAccount(iAccountId)
	;
	
	if (oAccount)
	{
		sEmail = oAccount.email();
	}
	
	return sEmail;
};

/**
 * @param {Object} oAccount
 */
CAccountListModel.prototype.addAccount = function (oAccount)
{
	this.collection.push(oAccount);
};

/**
 * @param {number} iId
 */
CAccountListModel.prototype.deleteAccount = function (iId)
{
	this.collection.remove(function (oAcct) { return oAcct.id() === iId; });
	
	var iFirstAccId = this.collection().length > 0 ? this.collection()[0].id() : 0;
	this.changeCurrentAccount(iFirstAccId, false);
	this.changeEditedAccount(iFirstAccId);
};

/**
 * @param {number} iId
 * 
 * @return {boolean}
 */
CAccountListModel.prototype.hasAccountWithId = function (iId)
{
	var oAccount = _.find(this.collection(), function (oAcct) {
		return oAcct.id() === iId;
	}, this);

	return !!oAccount;
};

CAccountListModel.prototype.populateFetchersIdentities = function ()
{
	this.populateFetchers();
	this.populateIdentities();
};

CAccountListModel.prototype.populateFetchers = function ()
{
	if (Settings.AllowFetchers)
	{
		CoreAjax.send(Settings.FetchersServerModuleName, 'GetFetchers', { 'AccountID': this.editedId() }, this.onGetFetchersResponse, this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAccountListModel.prototype.onGetFetchersResponse = function (oResponse, oRequest)
{
	var oFetchers = {};
	
	if (Types.isNonEmptyArray(oResponse.Result))
	{
		_.each(oResponse.Result, function (oData) {
			var oFetcher = new CFetcherModel();
			oFetcher.parse(oData);
			if (!oFetchers[oFetcher.accountId()])
			{
				oFetchers[oFetcher.accountId()] = [];
			}
			oFetchers[oFetcher.accountId()].push(oFetcher);
		});
	}
	
	_.each(this.collection(), function (oAccount) {
		var aFetchers = Types.isNonEmptyArray(oFetchers[oAccount.id()]) ? oFetchers[oAccount.id()] : [];
		oAccount.fetchers(aFetchers);
	}, this);
};

/**
 * @param {function} fAfterPopulateIdentities
 */
CAccountListModel.prototype.populateIdentities = function (fAfterPopulateIdentities)
{
	if (Settings.AllowIdentities && this.collection().length >= 1)
	{
		Ajax.send('GetIdentities', null, function (oResponse, oRequest) {
			this.onGetIdentitiesResponse(oResponse, oRequest);
			if (_.isFunction(fAfterPopulateIdentities))
			{
				fAfterPopulateIdentities();
			}
		}, this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAccountListModel.prototype.onGetIdentitiesResponse = function (oResponse, oRequest)
{
	var oIdentities = {};
	
	if (Types.isNonEmptyArray(oResponse.Result))
	{
		_.each(oResponse.Result, function (oIdentityData) {
			var
				oIdentity = new CIdentityModel(),
				iAccountId = -1
			;

			oIdentity.parse(oIdentityData);
			iAccountId = oIdentity.accountId();
			if (!oIdentities[iAccountId])
			{
				oIdentities[iAccountId] = [];
			}
			oIdentities[iAccountId].push(oIdentity);
		});
	}

	_.each(this.collection(), function (oAccount) {
		var
			aIdentities = oIdentities[oAccount.id()],
			oIdentity = new CIdentityModel()
		;

		if (!Types.isNonEmptyArray(aIdentities))
		{
			aIdentities = [];
		}

		oIdentity.parse({
			'@Object': 'Object/Aurora\\Modules\\Mail\\Classes\\Identity',
			AccountPart: true,
			Default: !_.find(aIdentities, function(oIdentity){ return oIdentity.isDefault(); }),
			Email: oAccount.email(),
			FriendlyName: oAccount.friendlyName(),
			IdAccount: oAccount.id(),
			EntityId: oAccount.id() * 100000,
			Signature: oAccount.signature(),
			UseSignature: oAccount.useSignature()
		});
		aIdentities.unshift(oIdentity);

		oAccount.identities(aIdentities);
	});
};

/**
 * @param {Object} oSrcAccounts
 */
CAccountListModel.prototype.populateIdentitiesFromSourceAccount = function (oSrcAccounts)
{
	if (oSrcAccounts)
	{
		_.each(this.collection(), function (oAccount) {
			var oSrcAccount = oSrcAccounts.getAccount(oAccount.id());
			if (oSrcAccount)
			{
				oAccount.fetchers(oSrcAccount.fetchers());
				oAccount.identities(oSrcAccount.identities());
				oAccount.signature(oSrcAccount.signature());
				oAccount.useSignature(oSrcAccount.useSignature());
			}
		});
	}
};

CAccountListModel.prototype.getAccountsEmails = function ()
{
	return _.uniq(_.map(this.collection(), function (oAccount) {
		return oAccount.email();
	}));
};

CAccountListModel.prototype.getAllFullEmails = function ()
{
	var aFullEmails = [];
	
	_.each(this.collection(), function (oAccount) {
		if (oAccount)
		{
			if (Types.isNonEmptyArray(oAccount.identities()))
			{
				_.each(oAccount.identities(), function (oIdentity) {
					aFullEmails.push(oIdentity.fullEmail());
				});
			}
			else
			{
				aFullEmails.push(oAccount.fullEmail());
			}
			
			_.each(oAccount.fetchers(), function (oFetcher) {
				if (oFetcher.isEnabled() && oFetcher.isOutgoingEnabled() && oFetcher.fullEmail() !== '')
				{
					aFullEmails.push(oFetcher.fullEmail());
				}
			});
		}
	});
	
	return aFullEmails;
};

CAccountListModel.prototype.getCurrentFetchersAndFiltersFolderNames = function ()
{
	var
		oAccount = this.getCurrent(),
		aFolders = []
	;
	
	if (oAccount)
	{
		if (oAccount.filters())
		{
			_.each(oAccount.filters().collection(), function (oFilter) {
				aFolders.push(oFilter.folder());
			}, this);
		}

		_.each(oAccount.fetchers(), function (oFetcher) {
			aFolders.push(oFetcher.folder());
		}, this);
	}
	
	return aFolders;
};

/**
 * @param {Array} aEmails
 * @returns {string}
 */
CAccountListModel.prototype.getAttendee = function (aEmails)
{
	var
		aAccountsEmails = [],
		sAttendee = ''
	;
	
	_.each(this.collection(), function (oAccount) {
		if (oAccount.isCurrent())
		{
			aAccountsEmails = _.union([oAccount.email()], oAccount.getFetchersIdentitiesEmails(), aAccountsEmails);
		}
		else
		{
			aAccountsEmails = _.union(aAccountsEmails, [oAccount.email()], oAccount.getFetchersIdentitiesEmails());
		}
	});
	
	aAccountsEmails = _.uniq(aAccountsEmails);
	
	_.each(aAccountsEmails, _.bind(function (sAccountEmail) {
		if (sAttendee === '')
		{
			var sFoundEmail = _.find(aEmails, function (sEmail) {
				return (sEmail === sAccountEmail);
			});
			if (sFoundEmail === sAccountEmail)
			{
				sAttendee = sAccountEmail;
			}
		}
	}, this));
	
	return sAttendee;
};

var AccountList = new CAccountListModel();

if (window.auroraAppData.Mail && _.isArray(window.auroraAppData.Mail.Accounts))
{
	AccountList.parse(window.auroraAppData.Mail.Accounts);
}
else
{
	AccountList.parse([]);
}

if (MainTab)
{
	AccountList.populateIdentitiesFromSourceAccount(MainTab.getAccountList());
}

module.exports = AccountList;
