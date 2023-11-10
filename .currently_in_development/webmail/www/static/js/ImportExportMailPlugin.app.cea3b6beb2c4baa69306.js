(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[8],{

/***/ "2ug6":
/*!**********************************************************!*\
  !*** ./modules/MailWebclient/js/models/CAccountModel.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),

	AddressUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Address.js */ "Ol7c"),
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),

	Ajax = null,
	Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ "JFZZ"),
	App = null,
	UserSettings = __webpack_require__(/*! modules/CoreWebclient/js/Settings.js */ "hPb3"),

	Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh"),
	ConfirmPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/ConfirmPopup.js */ "20Ah"),

	CFiltersModel = __webpack_require__(/*! modules/MailWebclient/js/models/CFiltersModel.js */ "SbmC"),
	CServerModel = __webpack_require__(/*! modules/MailWebclient/js/models/CServerModel.js */ "gAbd"),

	AccountList = null,
	Cache = null,
	Settings = __webpack_require__(/*! modules/MailWebclient/js/Settings.js */ "p2hp")
;

/**
 * @constructor
 * @param {object} oData
 */
function CAccountModel(oData)
{
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5");
	Ajax = __webpack_require__(/*! modules/MailWebclient/js/Ajax.js */ "UN2P");

	this.id = ko.observable(Types.pInt(oData.AccountID));
	this.email = ko.observable(Types.pString(oData.Email));
	this.friendlyName = ko.observable(Types.pString(oData.FriendlyName));
	this.incomingLogin = ko.observable(Types.pString(oData.IncomingLogin));
	this.passwordMightBeIncorrect = ko.observable(false);
	this.passwordMightBeIncorrect.subscribe(function () {
		if (!this.passwordMightBeIncorrect())
		{
			this.requireCache();
			Cache.getFolderList(this.id());
		}
	}, this);
	var sSignature = Types.pString(oData.Signature);
	if (sSignature.indexOf('<') !== 0) {
		sSignature = '<div>' + sSignature + '</div>';
	}
	this.signature = ko.observable(sSignature);
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

	this.fetchers = ko.observableArray([]);
	this.identities = ko.observable(null);
	this.aliases = ko.observableArray([]);

	this.allowAutoresponder = ko.observable(Types.pBool(oData.AllowAutoresponder, false));
	this.autoresponder = ko.observable(null);
	this.allowForward = ko.observable(Types.pBool(oData.AllowForward, false));
	this.forward = ko.observable(null);
	this.allowFilters = ko.observable(Types.pBool(oData.AllowFilters, false));
	this.filters = ko.observable(null);
	this.enableAllowBlockLists = ko.observable(Types.pBool(oData.EnableAllowBlockLists));

	// This property is not sent by Mail module but other modules can add it to response with 'Mail::Account::ToResponseArray' event
	this.allowManageFolders = ko.observable(Types.pBool(oData.AllowManageFolders, true));

	this.quota = ko.observable(0);
	this.usedSpace = ko.observable(0);
	this.quotaRecieved = ko.observable(false);

	this.fullEmail = ko.computed(function () {
		return AddressUtils.getFullEmail(this.friendlyName(), this.email());
	}, this);

	this.bDefault = Settings.AllowDefaultAccountForUser && this.email() === App.getUserPublicId();

	this.aExtend = Types.pObject(oData.Extend);

	this.includeInUnifiedMailbox = ko.observable(Settings.AllowUnifiedInbox && !!oData.IncludeInUnifiedMailbox);
	this.showUnifiedMailboxLabel = ko.observable(Settings.AllowUnifiedInbox && !!oData.ShowUnifiedMailboxLabel);
	this.unifiedMailboxLabelText = ko.observable(Types.pString(oData.UnifiedMailboxLabelText));
	this.unifiedMailboxLabelColor = ko.observable(Types.pString(oData.UnifiedMailboxLabelColor));
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
	this.includeInUnifiedMailbox(!!oData.IncludeInUnifiedMailbox);
	this.showUnifiedMailboxLabel(!!oData.ShowUnifiedMailboxLabel);
	this.unifiedMailboxLabelText(Types.pString(oData.UnifiedMailboxLabelText));
	this.unifiedMailboxLabelColor(Types.pString(oData.UnifiedMailboxLabelColor));
};

CAccountModel.prototype.requireAccounts = function ()
{
	if (AccountList === null)
	{
		AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm");
	}
};

CAccountModel.prototype.requireCache = function ()
{
	if (Cache === null)
	{
		Cache = __webpack_require__(/*! modules/MailWebclient/js/Cache.js */ "4+IO");
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
		Popups.showPopup(ConfirmPopup, [TextUtils.i18n('MAILWEBCLIENT/CONFIRM_REMOVE_ACCOUNT'), fCallBack, this.email()]);
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
		Api.showErrorByCode(oResponse, TextUtils.i18n('MAILWEBCLIENT/ERROR_REMOVE_ACCOUNT'));
	}
	else
	{
		var ComposeUtils = __webpack_require__(/*! modules/MailWebclient/js/utils/Compose.js */ "h1OO");
		if (_.isFunction(ComposeUtils.closeComposePopup))
		{
			ComposeUtils.closeComposePopup(oRequest.Parameters.AccountID);
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


/***/ }),

/***/ "4+IO":
/*!*******************************************!*\
  !*** ./modules/MailWebclient/js/Cache.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	moment = __webpack_require__(/*! moment */ "wd/R"),
	
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
	
	Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ "JFZZ"),
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	Pulse = __webpack_require__(/*! modules/CoreWebclient/js/Pulse.js */ "TKFr"),
	Routing = __webpack_require__(/*! modules/CoreWebclient/js/Routing.js */ "QaF5"),
	UserSettings = __webpack_require__(/*! modules/CoreWebclient/js/Settings.js */ "hPb3"),
	WindowOpener = __webpack_require__(/*! modules/CoreWebclient/js/WindowOpener.js */ "ZCBP"),
	
	Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh"),
	ConfirmPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/ConfirmPopup.js */ "20Ah"),
	
	LinksUtils = __webpack_require__(/*! modules/MailWebclient/js/utils/Links.js */ "4M/5"),
	
	AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm"),
	Ajax = __webpack_require__(/*! modules/MailWebclient/js/Ajax.js */ "UN2P"),
	MessagesDictionary = __webpack_require__(/*! modules/MailWebclient/js/MessagesDictionary.js */ "xzvH"),
	Prefetcher = null,
	Settings = __webpack_require__(/*! modules/MailWebclient/js/Settings.js */ "p2hp"),
	
	CFolderModel = __webpack_require__(/*! modules/MailWebclient/js/models/CFolderModel.js */ "qGK3"),
	CFolderListModel = __webpack_require__(/*! modules/MailWebclient/js/models/CFolderListModel.js */ "5aTH"),
	CUidListModel = __webpack_require__(/*! modules/MailWebclient/js/models/CUidListModel.js */ "lPfU"),
	
	MainTab = App.isNewTab() && window.opener && window.opener.MainTabMailMethods
;

/**
 * @constructor
 */
function CMailCache()
{
	this.currentAccountId = AccountList.currentId;

	this.currentAccountId.subscribe(function (iCurrAccountId) {
		var
			oAccount = AccountList.getAccount(iCurrAccountId),
			oFolderList = this.oFolderListItems[iCurrAccountId]
		;
		if (oAccount)
		{
			oAccount.quotaRecieved(false);
			
			this.messagesLoadingError(false);
			
			if (oFolderList)
			{
				this.folderList(oFolderList);
			}
			else
			{
				this.messagesLoading(true);
				this.folderList(new CFolderListModel());
				this.messages([]);
				this.currentMessage(null);
				this.getFolderList(iCurrAccountId);
			}
		}
		else
		{
			this.folderList(new CFolderListModel());
		}
	}, this);
	
	this.editedAccountId = AccountList.editedId;
	this.editedAccountId.subscribe(function (iEditedAccountId) {
		var oFolderList = this.oFolderListItems[iEditedAccountId];
		
		if (oFolderList)
		{
			this.editedFolderList(oFolderList);
		}
		else
		{
			this.editedFolderList(new CFolderListModel());
			if (this.currentAccountId() !== iEditedAccountId)
			{
				this.getFolderList(iEditedAccountId);
			}
		}
	}, this);
	
	this.oFolderListItems = {};

	this.quotaChangeTrigger = ko.observable(false);
	
	this.checkMailStarted = ko.observable(false);
	this.checkMailStartedAccountId = ko.observable(0);
	
	this.folderList = ko.observable(new CFolderListModel());
	this.folderListLoading = ko.observableArray([]);
	
	this.oUnifiedInbox = new CFolderModel(0, true);
	this.getCurrentFolder = ko.computed(function ()
	{
		if (this.oUnifiedInbox.selected())
		{
			return this.oUnifiedInbox;
		}
		return this.folderList().currentFolder();
	}, this);

	this.getCurrentFolderFullname = ko.computed(function ()
	{
		if (this.oUnifiedInbox.selected())
		{
			return this.oUnifiedInbox.fullName();
		}
		return this.folderList().currentFolderFullName();
	}, this);

	this.getCurrentFolderType = ko.computed(function ()
	{
		if (this.oUnifiedInbox.selected())
		{
			return this.oUnifiedInbox.type();
		}
		return this.folderList().currentFolderType();
	}, this);
	
	this.editedFolderList = ko.observable(new CFolderListModel());

	this.newMessagesCount = ko.computed(function () {
		if (this.oUnifiedInbox.selected())
		{
			return this.oUnifiedInbox.unseenMessageCount();
		}
		else
		{
			var oInbox = this.folderList().inboxFolder();
			return oInbox ? oInbox.unseenMessageCount() : 0;
		}
	}, this);

	this.messages = ko.observableArray([]);
	this.messages.subscribe(function () {
		if (this.messages().length > 0)
		{
			this.messagesLoadingError(false);
		}
		if (this.currentMessage()) {
			var
				oCurrMessage = _.find(this.messages(), function (oMessage) {
					return oMessage.sUniq === this.currentMessage().sUniq;
				}.bind(this)),
				oFolder = oCurrMessage ? this.getFolderByFullName(oCurrMessage.accountId(), oCurrMessage.folder()) : null
			;
			if (oFolder && !oCurrMessage) {
				oFolder.getCompletelyFilledMessage(this.currentMessage().uid(), null, null, true);
			}
		}
	}, this);
	
	this.uidList = ko.observable(new CUidListModel());
	this.page = ko.observable(1);
	
	this.messagesLoading = ko.observable(false);
	this.messagesLoadingError = ko.observable(false);
	
	this.currentMessage = ko.observable(null);
	
	this.nextMessageUid = ko.observable('');
	this.prevMessageUid = ko.observable('');

	this.savingDraftUid = ko.observable('');
	this.editedDraftUid = ko.observable('');
	this.disableComposeAutosave = ko.observable(false);
	
	this.aResponseHandlers = [];

	this.iAutoCheckMailTimer = -1;
	
	this.waitForUnseenMessages = ko.observable(true);
	
	this.iSetMessagesSeenCount = 0;
	
	App.subscribeEvent('ReceiveAjaxResponse::after', _.bind(function (oParams) {
		// restart autorefresh after restoring Internet connection
		if (!this.checkMailStarted() && oParams.Response.Method === 'Ping' && oParams.Response.Module === 'Core' && oParams.Response.Result)
		{
			this.executeCheckMail();
		}
	}, this));
}

CMailCache.prototype.requirePrefetcher = function ()
{
	Prefetcher = __webpack_require__(/*! modules/MailWebclient/js/Prefetcher.js */ "cPXi");
};

/**
 * @public
 */
CMailCache.prototype.init = function ()
{
	Ajax.registerOnAllRequestsClosedHandler(function () {
		// Delay not to reset these flags between two related requests (e.g. 'GetRelevantFoldersInformation' and 'GetMessages')
		_.delay(function () {
			if (!Ajax.hasOpenedRequests())
			{
				MailCache.checkMailStarted(false);
				MailCache.folderListLoading.removeAll();
			}
		}, 10);
		if (!Ajax.hasOpenedRequests())
		{
			// All messages can not be selected from message list if message saving is done
			MailCache.savingDraftUid('');
		}
	});
	
	if (MainTab)
	{
		this.oFolderListItems = MainTab.getFolderListItems();
		this.uidList(MainTab.getUidList());
		
		if (window.name)
		{
			var iAccountId = Types.pInt(window.name);
			
			if (iAccountId === 0)
			{
				iAccountId = MainTab.getComposedMessageAccountId(window.name);
			}
			
			if (iAccountId !== 0)
			{
				this.currentAccountId(iAccountId);
			}
		}
		this.currentAccountId.valueHasMutated();
		this.initPrevNextSubscribes();
	}
	else
	{
		this.currentAccountId.valueHasMutated();
		this.initPrevNextSubscribes();
	}
	
	this.oUnifiedInbox.parse({
		'@Object': 'Object/Folder',
		'Name': TextUtils.i18n('MAILWEBCLIENT/LABEL_FOLDER_ALL_INBOXES'),
		'FullNameRaw': '__unified__inbox__',
		'FullNameHash': '',
		'Delimiter': '/',
		'Type': Enums.FolderTypes.AllInboxes,
		'AlwaysRefresh': true,
		'IsSubscribed': true,
		'IsSelectable': true,
		'Exists': true,
		'SubFolders': []
	}, '', '');
};

CMailCache.prototype.initPrevNextSubscribes = function ()
{
	this.bInThreadLevel = false;
	
	this.currentMessage.subscribe(this.calcNextMessageUid, this);
	this.uidList.subscribe(this.calcNextMessageUid, this);
	
	this.currentMessage.subscribe(this.calcPrevMessageUid, this);
	this.uidList.subscribe(this.calcPrevMessageUid, this);
};

CMailCache.prototype.calcNextMessageUid = function ()
{
	var
		sCurrentUid = '',
		sNextUid = '',
		oFolder = null,
		oParentMessage = null,
		bThreadLevel = false
	;
	
	if (this.currentMessage() && _.isFunction(this.currentMessage().uid))
	{
		bThreadLevel = this.currentMessage().threadPart() && this.currentMessage().threadParentUid() !== '';
		oFolder = this.getFolderByFullName(this.currentMessage().accountId(), this.currentMessage().folder());
		sCurrentUid = this.oUnifiedInbox.selected() ? this.currentMessage().unifiedUid() : this.currentMessage().uid();
		if (this.bInThreadLevel || bThreadLevel)
		{
			this.bInThreadLevel = !!MainTab;
			if (bThreadLevel)
			{
				oParentMessage = oFolder.getMessageByUid(this.currentMessage().threadParentUid());
				if (oParentMessage)
				{
					_.each(oParentMessage.threadUids(), function (sUid, iIndex, aCollection) {
						if (sUid === sCurrentUid && iIndex > 0)
						{
							sNextUid = aCollection[iIndex - 1];
						}
					});
					if (!Types.isNonEmptyString(sNextUid))
					{
						sNextUid = oParentMessage.uid();
					}
				}
			}
		}
		else
		{
			_.each(this.uidList().collection(), function (sUid, iIndex, aCollection) {
				if (sUid === sCurrentUid && iIndex > 0)
				{
					sNextUid = aCollection[iIndex - 1] || '';
				}
			});
			if (sNextUid === '' && MainTab)
			{
				this.requirePrefetcher();
				Prefetcher.prefetchNextPage(sCurrentUid);
			}
		}
	}
	this.nextMessageUid(sNextUid);
};

CMailCache.prototype.calcPrevMessageUid = function ()
{
	var
		sCurrentUid = '',
		sPrevUid = '',
		oFolder = null,
		oParentMessage = null,
		bThreadLevel = false
	;

	if (this.currentMessage() && _.isFunction(this.currentMessage().uid))
	{
		bThreadLevel = this.currentMessage().threadPart() && this.currentMessage().threadParentUid() !== '';
		oFolder = this.getFolderByFullName(this.currentMessage().accountId(), this.currentMessage().folder());
		sCurrentUid = this.oUnifiedInbox.selected() ? this.currentMessage().unifiedUid() : this.currentMessage().uid();
		if (this.bInThreadLevel || bThreadLevel)
		{
			this.bInThreadLevel = true;
			if (bThreadLevel)
			{
				oParentMessage = oFolder.getMessageByUid(this.currentMessage().threadParentUid());
				if (oParentMessage)
				{
					_.each(oParentMessage.threadUids(), function (sUid, iIndex, aCollection) {
						if (sUid === sCurrentUid && (iIndex + 1) < aCollection.length)
						{
							sPrevUid = aCollection[iIndex + 1] || '';
						}
					});
				}
			}
			else if (this.currentMessage().threadCount() > 0)
			{
				sPrevUid = this.currentMessage().threadUids()[0];
			}
		}
		else
		{
			_.each(this.uidList().collection(), function (sUid, iIndex, aCollection) {
				if (sUid === sCurrentUid && (iIndex + 1) < aCollection.length)
				{
					sPrevUid = aCollection[iIndex + 1] || '';
				}
			});
			if (sPrevUid === '' && MainTab)
			{
				this.requirePrefetcher();
				Prefetcher.prefetchPrevPage(sCurrentUid);
			}
		}
	}
	
	this.prevMessageUid(sPrevUid);
};

/**
 * @param {number} iAccountId
 * @param {string} sFolderFullName
 */
CMailCache.prototype.getFolderByFullName = function (iAccountId, sFolderFullName)
{
	if (sFolderFullName === this.oUnifiedInbox.fullName())
	{
		return this.oUnifiedInbox;
	}
	
	var oFolderList = this.oFolderListItems[iAccountId];
	
	if (oFolderList)
	{
		return oFolderList.getFolderByFullName(sFolderFullName);
	}
	
	return null;
};

CMailCache.prototype.checkCurrentFolderList = function ()
{
	var
		oCurrAccount = AccountList.getCurrent(),
		oFolderList = oCurrAccount ? this.oFolderListItems[oCurrAccount.id()] : null
	;
	
	if (oCurrAccount && !oFolderList && !this.messagesLoading())
	{
		this.messagesLoading(true);
		this.messagesLoadingError(false);
		this.getFolderList(oCurrAccount.id());
	}
};

/**
 * @param {number} iAccountID
 */
CMailCache.prototype.getFolderList = function (iAccountID)
{
	var oAccount = AccountList.getAccount(iAccountID);
	
	if (oAccount)
	{
		this.folderListLoading.push(iAccountID);

		Ajax.send('GetFolders', { 'AccountID': iAccountID }, this.onGetFoldersResponse, this);
	}
	else if (iAccountID === this.currentAccountId())
	{
		this.messagesLoading(false);
	}
};

/**
 * @param {number} iAccountId
 * @param {string} sFullName
 * @param {string} sUid
 * @param {string} sReplyType
 */
CMailCache.prototype.markMessageReplied = function (iAccountId, sFullName, sUid, sReplyType)
{
	var oFolder = this.getFolderByFullName(iAccountId, sFullName);
	if (oFolder)
	{
		oFolder.markMessageReplied(sUid, sReplyType);
	}
};

/**
 * @param {Object} oMessage
 */
CMailCache.prototype.hideThreads = function (oMessage)
{
	var oAccount = AccountList.getCurrent();
	if (oAccount && oAccount.threadingIsAvailable() && oMessage.folder() === this.getCurrentFolderFullname() && !oMessage.threadOpened())
	{
		this.getCurrentFolder().hideThreadMessages(oMessage);
	}
};

/**
 * @param {string} sFolderFullName
 */
CMailCache.prototype.showOpenedThreads = function (sFolderFullName)
{
	this.messages(this.getMessagesWithThreads(sFolderFullName, this.uidList(), this.messages()));
};

/**
 * @param {Object} oUidList
 * @returns {Boolean}
 */
CMailCache.prototype.useThreadingInCurrentList = function (oUidList)
{
	oUidList = oUidList || this.uidList();
	
	var
		oAccount = AccountList.getCurrent(),
		oCurrFolder = this.getCurrentFolder(),
		bFolderWithoutThreads = oCurrFolder && oCurrFolder.withoutThreads(),
		bNotSearchOrFilters = oUidList.search() === '' && oUidList.filters() === ''
	;
	
	return oAccount && oAccount.threadingIsAvailable() && !bFolderWithoutThreads && bNotSearchOrFilters;
};

/**
 * @param {string} sFolderFullName
 * @param {Object} oUidList
 * @param {Array} aOrigMessages
 */
CMailCache.prototype.getMessagesWithThreads = function (sFolderFullName, oUidList, aOrigMessages)
{
	var
		aExtMessages = [],
		aMessages = [],
		oCurrFolder = this.getCurrentFolder()
	;

	if (oCurrFolder && (sFolderFullName === oCurrFolder.fullName() || this.oUnifiedInbox.selected() && sFolderFullName === 'INBOX') && this.useThreadingInCurrentList(oUidList))
	{
		aMessages = _.filter(aOrigMessages, function (oMess) {
			return !oMess.threadPart();
		});

		_.each(aMessages, function (oMess) {
			var aThreadMessages = [];
			aExtMessages.push(oMess);
			if (oMess.threadCount() > 0)
			{
				if (oMess.threadOpened())
				{
					var oFolder = this.getFolderByFullName(oMess.accountId(), oMess.folder());
					aThreadMessages = oFolder.getThreadMessages(oMess);
					aExtMessages = _.union(aExtMessages, aThreadMessages);
				}
				oCurrFolder.computeThreadData(oMess);
			}
		}, this);
		
		return aExtMessages;
	}
	
	return aOrigMessages;
};

/**
 * @param {Object} oUidList
 * @param {number} iOffset
 * @param {boolean} bFillMessages
 */
CMailCache.prototype.setMessagesFromUidList = function (oUidList, iOffset, bFillMessages)
{
	var
		aUids = oUidList.getUidsForOffset(iOffset),
		aMessages = _.map(aUids, function (sUid) {
			var
				iAccountId = oUidList.iAccountId,
				sFullName = oUidList.sFullName;
			;
			if (sFullName === this.oUnifiedInbox.fullName())
			{
				var aParts = sUid.split(':');
				iAccountId = Types.pInt(aParts[0]);
				sFullName = 'INBOX';
				sUid = aParts[1];
			}
			return MessagesDictionary.get([iAccountId, sFullName, sUid]);
		}, this),
		iMessagesCount = aMessages.length
	;
	
	if (bFillMessages)
	{
		this.messages(this.getMessagesWithThreads(this.getCurrentFolderFullname(), oUidList, aMessages));
		
		if ((iOffset + iMessagesCount < oUidList.resultCount()) &&
			(iMessagesCount < Settings.MailsPerPage) &&
			(oUidList.filters() !== Enums.FolderFilter.Unseen || this.waitForUnseenMessages()))
		{
			this.messagesLoading(true);
		}

		if (this.currentMessage() && (this.currentMessage().deleted() ||
			this.currentMessage().folder() !== this.getCurrentFolderFullname() && !this.oUnifiedInbox.selected()))
		{
			this.currentMessage(null);
		}
	}

	return aUids;
};

CMailCache.prototype.getNamesOfFoldersToRefresh = function (iAccountId)
{
	var
		oFolderList = this.oFolderListItems[iAccountId],
		aFolders = oFolderList ? oFolderList.getNamesOfFoldersToRefresh() : [],
		aFoldersFromAccount = AccountList.getCurrentFetchersAndFiltersFolderNames()
	;
	
	aFolders = _.uniq(_.compact(_.union(aFolders, aFoldersFromAccount)));
	
	return aFolders;
};

/**
 * Checks if LIST-STATUS command should be used if it's supported by IMAP server.
 * @param {int} iAccountId
 * @param {int} iFoldersToRequestCount
 */
CMailCache.prototype.getUseListStatusIfPossibleValue = function (iAccountId, iFoldersToRequestCount)
{
	var
		oFolderList = this.oFolderListItems[iAccountId],
		iFoldersCount = oFolderList ? oFolderList.getFoldersCount() : 0
	;
	return iFoldersCount < 100 || iFoldersToRequestCount > 50;
};

/**
 * @param {boolean} bAbortPrevious
 */
CMailCache.prototype.executeCheckMail = function (bAbortPrevious)
{
	clearTimeout(this.iAutoCheckMailTimer);
	
	var
		iCurrentAccountId = this.currentAccountId(),
		aFolders = [],
		aAccountsData = [],
		bCurrentAccountCheckmailStarted = this.checkMailStarted() && (this.checkMailStartedAccountId() === iCurrentAccountId),
		bCheckmailAllowed = bAbortPrevious ||
							!Ajax.hasOpenedRequests('GetRelevantFoldersInformation') ||
							!Ajax.hasOpenedRequests('GetUnifiedRelevantFoldersInformation') ||
							!bCurrentAccountCheckmailStarted,
		oParameters = null
	;
	
	if (App.getUserRole() !== Enums.UserRole.Anonymous && bCheckmailAllowed)
	{
		if (AccountList.unifiedInboxReady())
		{
			_.each(AccountList.collection(), function (oAccount) {
				if (iCurrentAccountId === oAccount.id() || oAccount.includeInUnifiedMailbox())
				{
					aFolders = this.getNamesOfFoldersToRefresh(oAccount.id());
					if (aFolders.length > 0)
					{
						aAccountsData.push({
							'AccountID': oAccount.id(),
							'Folders': aFolders,
							'UseListStatusIfPossible': this.getUseListStatusIfPossibleValue(oAccount.id(), aFolders.length)
						});
					}
				}
			}, this);
			if (aAccountsData.length > 0)
			{
				oParameters = {
					'AccountsData': aAccountsData
				};

				this.checkMailStarted(true);
				this.checkMailStartedAccountId(iCurrentAccountId);
				Ajax.send('GetUnifiedRelevantFoldersInformation', oParameters, this.onGetRelevantFoldersInformationResponse, this);
			}
		}
		else
		{
			aFolders = this.getNamesOfFoldersToRefresh(this.currentAccountId());
			if (aFolders.length > 0)
			{
				oParameters = {
					'AccountID': iCurrentAccountId,
					'Folders': aFolders,
					'UseListStatusIfPossible': this.getUseListStatusIfPossibleValue(iCurrentAccountId, aFolders.length)
				};

				this.checkMailStarted(true);
				this.checkMailStartedAccountId(iCurrentAccountId);
				Ajax.send('GetRelevantFoldersInformation', oParameters, this.onGetRelevantFoldersInformationResponse, this);
			}
		}
	}
};

CMailCache.prototype.setAutocheckmailTimer = function ()
{
	clearTimeout(this.iAutoCheckMailTimer);
	
	if (!App.isNewTab() && UserSettings.AutoRefreshIntervalMinutes > 0)
	{
		this.iAutoCheckMailTimer = setTimeout(function () {
			if (!MailCache.isSearchExecuting())
			{
				MailCache.checkMessageFlags();
				MailCache.executeCheckMail(false);
			}
		}, UserSettings.AutoRefreshIntervalMinutes * 60 * 1000);
	}
};

CMailCache.prototype.isSearchExecuting = function ()
{
	var
		oRequest = Ajax.getOpenedRequest('GetMessages'),
		oParameters = oRequest && oRequest.Parameters
	;
	return oParameters && oParameters.Search !== '';
};

CMailCache.prototype.checkMessageFlags = function ()
{
	var
		oInbox = this.folderList().inboxFolder(),
		aUids = oInbox ? oInbox.getFlaggedMessageUids() : [],
		oParameters = {
			'Folder': this.folderList().inboxFolderFullName(),
			'Uids': aUids
		}
	;
	
	if (aUids.length > 0)
	{
		Ajax.send('GetMessagesFlags', oParameters, this.onGetMessagesFlagsResponse, this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CMailCache.prototype.onGetMessagesFlagsResponse = function (oResponse, oRequest)
{
	var
		oParameters = oRequest.Parameters,
		oFolderList = this.oFolderListItems[oParameters.AccountID],
		oInbox = (oFolderList) ? oFolderList.inboxFolder() : null
	;
	
	if (oInbox)
	{
		if (oResponse.Result)
		{
			_.each(oResponse.Result, function (aFlags, sUid) {
				if (_.indexOf(aFlags, '\\flagged') === -1)
				{
					oInbox.setMessageUnflaggedByUid(sUid);
				}
			});
		}
		oInbox.removeFlaggedMessageListsFromCache();
		this.requirePrefetcher();
		Prefetcher.prefetchStarredMessageList();
	}
};

/**
 * @param {string} sFolder
 * @param {number} iPage
 * @param {string} sSearch
 * @param {string=} sFilter
 * @param {string} sSortBy
 * @param {int} iSortOrder
 */
CMailCache.prototype.changeCurrentMessageList = function (sFolder, iPage, sSearch, sFilter, sSortBy, iSortOrder)
{
	this.requestCurrentMessageList(sFolder, iPage, sSearch, sFilter, sSortBy, iSortOrder, true);
};

/**
 * @param {string} sFolder
 * @param {number} iPage
 * @param {string} sSearch
 * @param {string} sFilter
 * @param {string} sSortBy
 * @param {int} iSortOrder
 * @param {boolean} bFillMessages
 */
CMailCache.prototype.requestCurrentMessageList = function (sFolder, iPage, sSearch, sFilter, sSortBy, iSortOrder, bFillMessages)
{
	var
		oRequestData = this.requestMessageList(sFolder, iPage, sSearch, sFilter || '', sSortBy, iSortOrder, true, (bFillMessages || false))
	;
	if (oRequestData)
	{
		var
			iCheckmailIntervalMilliseconds = UserSettings.AutoRefreshIntervalMinutes * 60 * 1000,
			iFolderUpdateDiff = oRequestData.Folder.oRelevantInformationLastMoment ? moment().diff(oRequestData.Folder.oRelevantInformationLastMoment) : iCheckmailIntervalMilliseconds + 1
		;

		this.uidList(oRequestData.UidList);
		this.page(iPage);

		this.messagesLoading(oRequestData.RequestStarted);
		this.messagesLoadingError(false);

		if (!oRequestData.RequestStarted && iCheckmailIntervalMilliseconds > 0 && iFolderUpdateDiff > iCheckmailIntervalMilliseconds)
		{
			this.executeCheckMail(true);
		}
	}
};

/**
 * @param {string} sFolder
 * @param {number} iPage
 * @param {string} sSearch
 * @param {string} sFilters
 * @param {string} sSortBy
 * @param {int} iSortOrder
 * @param {boolean} bCurrent
 * @param {boolean} bFillMessages
 * @param {boolean} bDoNotRequest
 */
CMailCache.prototype.requestMessageList = function (sFolder, iPage, sSearch, sFilters, sSortBy, iSortOrder, bCurrent, bFillMessages, bDoNotRequest)
{
	// Parameter is true if method was called only to update last access time of messages for specified page.
	// This case is used for Prefetcher work.
	bDoNotRequest = Types.pBool(bDoNotRequest, false);

	var oFolder = this.getFolderByFullName(this.currentAccountId(), sFolder);
	if (!oFolder)
	{
		Utils.log('requestMessageList, error: folder not found ', JSON.stringify({
			'currentAccountId': this.currentAccountId(),
			'sFolder': sFolder,
			'iPage': iPage,
			'sSearch': sSearch,
			'sFilters': sFilters,
			'sSortBy': sSortBy,
			'iSortOrder': iSortOrder,
			'bCurrent': bCurrent,
			'bFillMessages': bFillMessages
		}));
		return null;
	}
	var
		bFolderWithoutThreads = oFolder && oFolder.withoutThreads(),
		oAccount = AccountList.getCurrent(),
		bUseThreading = oAccount && oAccount.threadingIsAvailable() && !bFolderWithoutThreads && sSearch === '' && sFilters === '',
		oUidList = (oFolder) ? oFolder.getUidList(sSearch, sFilters, sSortBy, iSortOrder) : null,
		bCacheIsEmpty = oUidList && oUidList.resultCount() === -1,
		iOffset = (iPage - 1) * Settings.MailsPerPage,
		oParameters = {
			'Folder': sFolder,
			'Offset': iOffset,
			'Limit': Settings.MailsPerPage,
			'Search': sSearch,
			'Filters': sFilters,
			'SortBy': sSortBy,
			'SortOrder': iSortOrder,
			'UseThreading': bUseThreading
		},
		bStartRequest = false,
		bDataExpected = false,
		fCallBack = bCurrent ? this.onCurrentGetMessagesResponse : this.onGetMessagesResponse,
		aUids = []
	;
	
	if (sFolder === this.getTemplateFolder() && iOffset === 0 && Settings.MailsPerPage < Settings.MaxTemplatesCountOnCompose &&
			sSearch === '' && sFilters === '' && sSortBy === Settings.MessagesSortBy.DefaultSortBy && iSortOrder === Settings.MessagesSortBy.DefaultSortOrder)
	{
		oParameters.Limit = Settings.MaxTemplatesCountOnCompose;
	}

	if (oFolder.type() === Enums.FolderTypes.Inbox && sFilters === '')
	{
		oParameters['InboxUidnext'] = oFolder.sUidNext;
	}
	else
	{
		oParameters['InboxUidnext'] = '';
	}
	
	if (bCacheIsEmpty 
			&& oUidList.iAccountId === this.uidList().iAccountId
			&& oUidList.sFullName === this.uidList().sFullName
			&& oUidList.search() === this.uidList().search()
			&& oUidList.filters() === this.uidList().filters()
			&& oUidList.sortBy() === this.uidList().sortBy()
			&& oUidList.sortOrder() === this.uidList().sortOrder())
	{
		oUidList = this.uidList();
	}
	if (oUidList)
	{
		aUids = this.setMessagesFromUidList(oUidList, iOffset, bFillMessages);
		oFolder.updateLastAccessTime(aUids);
	}
	
	if (oUidList)
	{
		bDataExpected = 
			(bCacheIsEmpty) ||
			((iOffset + aUids.length < oUidList.resultCount()) && (aUids.length < Settings.MailsPerPage))
		;
		bStartRequest = !bDoNotRequest && (oFolder.hasChanges() || bDataExpected);
	}
	
	if (bStartRequest)
	{
		if (oParameters.Folder === this.oUnifiedInbox.fullName())
		{
			delete oParameters.Folder;
			Ajax.send('GetUnifiedMailboxMessages', oParameters, fCallBack, this);
		}
		else
		{
			Ajax.send('GetMessages', oParameters, fCallBack, this);
		}
	}
	else
	{
		this.waitForUnseenMessages(false);
	}
	
	return {UidList: oUidList, RequestStarted: bStartRequest, DataExpected: bDataExpected, Folder: oFolder};
};

CMailCache.prototype.executeEmptyTrash = function ()
{
	var oFolder = this.folderList().trashFolder();
	if (oFolder)
	{
		oFolder.emptyFolder();
	}
};

CMailCache.prototype.executeEmptySpam = function ()
{
	var oFolder = this.folderList().spamFolder();
	if (oFolder)
	{
		oFolder.emptyFolder();
	}
};

/**
 * @param {Object} oFolder
 */
CMailCache.prototype.onClearFolder = function (oFolder)
{
	if (oFolder && oFolder.selected())
	{
		this.messages.removeAll();
		this.currentMessage(null);
		var oUidList = (oFolder) ? oFolder.getUidList(this.uidList().search(), this.uidList().filters(), this.uidList().sortBy(), this.uidList().sortOrder()) : null;
		if (oUidList)
		{
			this.uidList(oUidList);
		}
		else
		{
			this.uidList(new CUidListModel());
		}
		
		// GetRelevantFoldersInformation-request aborted during folder cleaning, not to get the wrong information.
		// So here indicates that chekmail is over.
		this.checkMailStarted(false);
		this.setAutocheckmailTimer();
	}
};

CMailCache.prototype.getOpenedDraftUids = function ()
{
	var
		aOpenedWins = WindowOpener.getOpenedWindows(),
		aDraftUids = _.map(aOpenedWins, function (oWin) {
			return oWin.SlaveTabMailMethods ? oWin.SlaveTabMailMethods.getEditedDraftUid() : '';
		})
	;

	if (Popups.hasOpenedMinimizedPopups())
	{
		aDraftUids.push(this.editedDraftUid());
	}

	return _.uniq(_.compact(aDraftUids));
};

/*
 * @param {array} aUids
 */
CMailCache.prototype.closeComposesWithDraftUids = function (aUids)
{
	var aOpenedWins = WindowOpener.getOpenedWindows();
	
	_.each(aOpenedWins, function (oWin) {
		if (oWin.SlaveTabMailMethods && -1 !== $.inArray(oWin.SlaveTabMailMethods.getEditedDraftUid(), aUids))
		{
			oWin.close();
		}
	});

	if (-1 !== $.inArray(this.editedDraftUid(), aUids))
	{
		var ComposeUtils = __webpack_require__(/*! modules/MailWebclient/js/utils/Compose.js */ "h1OO");
		if (_.isFunction(ComposeUtils.closeComposePopup))
		{
			ComposeUtils.closeComposePopup();
		}
	}
};

/**
 * @param {object} oFromFolder
 * @param {object} oToFolder
 * @param {Array} aUids
 */
CMailCache.prototype.moveMessagesToFolder = function (oFromFolder, oToFolder, aUids)
{
	if (Types.isNonEmptyArray(aUids))
	{
		var
			bDraftsFolder = oFromFolder && oFromFolder.type() === Enums.FolderTypes.Drafts,
			aOpenedDraftUids = bDraftsFolder && this.getOpenedDraftUids(),
			bTryToDeleteEditedDraft = bDraftsFolder && _.find(aUids, _.bind(function (sUid) {
				return -1 !== $.inArray(sUid, aOpenedDraftUids);
			}, this)),
			oParameters = {
				'AccountID': oFromFolder ? oFromFolder.iAccountId : 0,
				'Folder': oFromFolder ? oFromFolder.fullName() : '',
				'ToFolder': oToFolder.fullName(),
				'Uids': aUids.join(',')
			},
			oDiffs = null,
			fMoveMessages = _.bind(function () {
				if (this.uidList().filters() === Enums.FolderFilter.Unseen && this.uidList().resultCount() > Settings.MailsPerPage)
				{
					this.waitForUnseenMessages(true);
				}
				
				oDiffs = oFromFolder.markDeletedByUids(aUids);
				oToFolder.addMessagesCountsDiff(oDiffs.MinusDiff, oDiffs.UnseenMinusDiff);
				this.setUnifiedInboxUnseenChanges(oToFolder.iAccountId, oToFolder.fullName(), oDiffs.MinusDiff, oDiffs.UnseenMinusDiff);

				oToFolder.recivedAnim(true);

				this.excludeDeletedMessages();

				oToFolder.markHasChanges();
				
				Ajax.send('MoveMessages', oParameters, this.onMoveMessagesResponse, this);
			}, this)
		;

		if (oFromFolder && oToFolder)
		{
			if (bTryToDeleteEditedDraft)
			{
				this.disableComposeAutosave(true);
				Popups.showPopup(ConfirmPopup, [TextUtils.i18n('MAILWEBCLIENT/CONFIRM_MESSAGE_FOR_DELETE_IS_EDITED'), 
					_.bind(function (bOk) {
						if (bOk)
						{
							this.closeComposesWithDraftUids(aUids);
							fMoveMessages();
						}
						this.disableComposeAutosave(false);
					}, this), 
					'', TextUtils.i18n('MAILWEBCLIENT/ACTION_CLOSE_DELETE_DRAFT')
				]);
			}
			else
			{
				fMoveMessages();
			}
		}
	}
};

CMailCache.prototype.copyMessagesToFolder = function (sToFolderFullName, aUids)
{
	if (aUids.length > 0)
	{
		var
			oCurrFolder = this.getCurrentFolder(),
			oToFolder = this.getFolderByFullName(this.currentAccountId(), sToFolderFullName),
			oParameters = {
				'Folder': oCurrFolder ? oCurrFolder.fullName() : '',
				'ToFolder': sToFolderFullName,
				'Uids': aUids.join(',')
			}
		;

		if (oCurrFolder && oToFolder)
		{
			oToFolder.recivedAnim(true);

			oToFolder.markHasChanges();

			Ajax.send('CopyMessages', oParameters, this.onCopyMessagesResponse, this);
		}
	}
};

CMailCache.prototype.excludeDeletedMessages = function ()
{
	_.delay(_.bind(function () {
		var iOffset = (this.page() - 1) * Settings.MailsPerPage;
		this.setMessagesFromUidList(this.uidList(), iOffset, true);
	}, this), 500);
};

/**
 * @param {number} iAccountID
 * @param {string} sFolderFullName
 * @param {string} sDraftUid
 */
CMailCache.prototype.removeOneMessageFromCacheForFolder = function (iAccountID, sFolderFullName, sDraftUid)
{
	var oFolder = this.getFolderByFullName(iAccountID, sFolderFullName);
	
	if (oFolder && oFolder.type() === Enums.FolderTypes.Drafts)
	{
		if (this.currentMessage() && this.currentMessage().folder() === sFolderFullName && this.currentMessage().uid() === sDraftUid)
		{
			this.currentMessage(null);
		}
		oFolder.markDeletedByUids([sDraftUid]);
		oFolder.commitDeleted([sDraftUid]);
	}
};

/**
 * @param {number} iAccountID
 * @param {string} sFolderFullName
 */
CMailCache.prototype.startMessagesLoadingWhenDraftSaving = function (iAccountID, sFolderFullName)
{
	var oFolder = this.getFolderByFullName(iAccountID, sFolderFullName);

	if ((oFolder && oFolder.type() === Enums.FolderTypes.Drafts) && oFolder.selected())
	{
		this.messagesLoading(true);
	}
};

/**
 * @param {number} iAccountID
 * @param {string} sFolderFullName
 */
CMailCache.prototype.removeMessagesFromCacheForFolder = function (iAccountID, sFolderFullName)
{
	var
		oFolder = this.getFolderByFullName(iAccountID, sFolderFullName),
		sCurrFolderFullName = this.getCurrentFolderFullname()
	;
	if (oFolder)
	{
		oFolder.markHasChanges();
		if (this.currentAccountId() === iAccountID && sFolderFullName === sCurrFolderFullName)
		{
			this.requestCurrentMessageList(sCurrFolderFullName, this.page(), this.uidList().search(), '', this.uidList().sortBy(), this.uidList().sortOrder(), true);
		}
	}
};

/**
 * @param {Array} aUids
 */
CMailCache.prototype.deleteMessages = function (aUids)
{
	var
		oCurrFolder = this.getCurrentFolder()
	;

	if (oCurrFolder)
	{
		this.deleteMessagesFromFolder(oCurrFolder, aUids);
	}
};

/**
 * @param {Object} oFolder
 * @param {Array} aUids
 */
CMailCache.prototype.deleteMessagesFromFolder = function (oFolder, aUids)
{
	var oParameters = {
		'AccountID': oFolder.iAccountId,
		'Folder': oFolder.fullName(),
		'Uids': aUids.join(',')
	};

	oFolder.markDeletedByUids(aUids);

	this.excludeDeletedMessages();

	Ajax.send('DeleteMessages', oParameters, this.onMoveMessagesResponse, this);
};

/**
 * @param {boolean} bAlwaysForSender
 */
CMailCache.prototype.showExternalPictures = function (bAlwaysForSender)
{
	var
		oCurrMsg = this.currentMessage(),
		aFrom = oCurrMsg ? oCurrMsg.oFrom.aCollection : [],
		oFolder = oCurrMsg ? this.getFolderByFullName(oCurrMsg.accountId(), oCurrMsg.folder()) : null
	;
		
	if (oFolder)
	{
		if (bAlwaysForSender && aFrom.length > 0)
		{
			oFolder.alwaysShowExternalPicturesForSender(aFrom[0].sEmail);
		}
		else
		{
			oFolder.showExternalPictures(oCurrMsg.uid());
		}
	}
};

/**
 * @param {string|null} sUid
 * @param {string} sFolder
 */
CMailCache.prototype.setCurrentFolder = function (sFolder, sFilters)
{
	if (!AccountList.unifiedInboxAllowed() && sFolder === this.oUnifiedInbox.fullName())
	{
		sFolder = this.folderList().inboxFolderFullName();
	}
	this.oUnifiedInbox.selected(sFolder === this.oUnifiedInbox.fullName());
	this.folderList().setCurrentFolder(sFolder, sFilters);
};

CMailCache.prototype.getMessageUid = function (oMessage)
{
	if (this.oUnifiedInbox.selected())
	{
		return oMessage.unifiedUid();
	}
	else
	{
		return oMessage.uid();
	}
};

/**
 * @param {number} iAccountId
 * @param {string} sFolder
 * @param {string|null} sUid
 */
CMailCache.prototype.setCurrentMessage = function (iAccountId, sFolder, sUid)
{
	var
		oFolder = this.getFolderByFullName(iAccountId, sFolder),
		oMessage = null
	;
	
	if (oFolder && sUid && oFolder.fullName() === sFolder)
	{
		oMessage = MessagesDictionary.get([oFolder.iAccountId, oFolder.fullName(), sUid]);
	}
	
	if (oMessage && !oMessage.deleted())
	{
		this.currentMessage(oMessage);
		if (Settings.MarkMessageSeenWhenViewing && !this.currentMessage().seen())
		{
			this.executeGroupOperation('SetMessagesSeen', [this.getMessageUid(this.currentMessage())], 'seen', true);
		}
		oFolder.getCompletelyFilledMessage(sUid, this.onCurrentMessageResponse, this);
	}
	else
	{
		this.currentMessage(null);
		if (App.isNewTab() && oFolder)
		{
			oFolder.getCompletelyFilledMessage(sUid, this.onCurrentMessageResponse, this);
		}
	}
};

/**
 * @param {Object} oMessage
 * @param {string} sUid
 * @param {Object} oResponse
 */
CMailCache.prototype.onCurrentMessageResponse = function (oMessage, sUid, oResponse)
{
	var sCurrentUid = this.currentMessage() && this.currentMessage().uid ? this.currentMessage().uid() : '';
	if (oMessage === null && MainTab && oResponse)
	{
		Api.showErrorByCode(oResponse, '', true);
	}
	if (oMessage === null && sCurrentUid === sUid)
	{
		this.currentMessage(null);
	}
	else if (oMessage && sCurrentUid === sUid)
	{
		this.currentMessage.valueHasMutated();
	}
	else if (App.isNewTab() && oMessage && this.currentMessage() === null)
	{
		this.currentMessage(oMessage);
	}
};

/**
 * @param {int} iAccountId
 * @param {string} sFullName
 * @param {string} sUid
 * @param {Function} fResponseHandler
 * @param {Object} oContext
 */
CMailCache.prototype.getMessage = function (iAccountId, sFullName, sUid, fResponseHandler, oContext)
{
	var oFolder = this.getFolderByFullName(iAccountId, sFullName);
	if (oFolder)
	{
		oFolder.getCompletelyFilledMessage(sUid, fResponseHandler, oContext);
	}
};

CMailCache.prototype.setUnifiedInboxUnseenChanges = function (iAccountId, sFolderFullName, iDiff, iUnseenDiff)
{
	if (AccountList.unifiedInboxReady())
	{
		var oInbox  = this.oUnifiedInbox.getUnifiedInbox(iAccountId);
		if (oInbox && oInbox.fullName() === sFolderFullName)
		{
			this.oUnifiedInbox.addMessagesCountsDiff(iDiff, iUnseenDiff);
			this.oUnifiedInbox.markHasChanges();
		}
	}
};

CMailCache.prototype.getUidsSeparatedByAccounts = function (aUids)
{
	var oUidsByAccounts = {};
	
	_.each(aUids, function (sUnifiedUid) {
		var
			aParts = sUnifiedUid.split(':'),
			iAccountId = Types.pInt(aParts[0]),
			sUid = Types.pString(aParts[1])
		;

		if (sUid !== '')
		{
			if (!oUidsByAccounts[iAccountId])
			{
				oUidsByAccounts[iAccountId] = {
					'AccountId': iAccountId,
					'Uids': []
				};
			}
			oUidsByAccounts[iAccountId].Uids.push(sUid);
		}
	});

	return oUidsByAccounts;
};

/**
 * @param {string} sMethod
 * @param {Array} aUids
 * @param {string} sField
 * @param {boolean} bSetAction
 */
CMailCache.prototype.executeGroupOperation = function (sMethod, aUids, sField, bSetAction)
{
	if (this.oUnifiedInbox.selected() && aUids.length > 0)
	{
		var oUidsByAccounts = this.getUidsSeparatedByAccounts(aUids);
		
		_.each(oUidsByAccounts, function (oData) {
			var
				aUidsByAccount = oData.Uids,
				iAccountId = oData.AccountId,
				oInbox = this.oUnifiedInbox.getUnifiedInbox(iAccountId)
			;
			if (oInbox)
			{
				this.executeGroupOperationForFolder(sMethod, oInbox, aUidsByAccount, sField, bSetAction);
			}
		}, this);
	}
	else if (this.oUnifiedInbox.selected() && aUids.length === 0)
	{
		_.each(AccountList.unifiedMailboxAccounts(), function (oAccount) {
			var oInbox  = this.oUnifiedInbox.getUnifiedInbox(oAccount.id());
			if (oInbox)
			{
				this.executeGroupOperationForFolder(sMethod, oInbox, aUids, sField, bSetAction);
			}
		}, this);
	}
	else
	{
		var oCurrFolder = this.getCurrentFolder();
		if (oCurrFolder)
		{
			this.executeGroupOperationForFolder(sMethod, oCurrFolder, aUids, sField, bSetAction);
		}
	}
};

/**
 * @param {string} sMethod
 * @param {object} oFolder
 * @param {Array} aUids
 * @param {string} sField
 * @param {boolean} bSetAction
 */
CMailCache.prototype.executeGroupOperationForFolder = function (sMethod, oFolder, aUids, sField, bSetAction)
{
	var
		iAccountId = oFolder.iAccountId,
		oFolderList = this.oFolderListItems[iAccountId],
		oParameters = {
			'AccountID': iAccountId,
			'Folder': oFolder.fullName(),
			'Uids': aUids.join(','),
			'SetAction': bSetAction
		},
		iOffset = (this.page() - 1) * Settings.MailsPerPage,
		iUidsCount = aUids.length,
		iStarredCount = oFolderList.oStarredFolder ? oFolderList.oStarredFolder.messageCount() : 0,
		oStarredUidList = oFolder.getUidList('', Enums.FolderFilter.Flagged, Settings.MessagesSortBy.DefaultSortBy, Settings.MessagesSortBy.DefaultSortOrder),
		fCallback = (sMethod === 'SetMessagesSeen') ? this.onSetMessagesSeenResponse : function () {}
	;

	if (sMethod === 'SetMessagesSeen')
	{
		this.iSetMessagesSeenCount++;
	}
	Ajax.send(sMethod, oParameters, fCallback, this);

	oFolder.executeGroupOperation(sField, aUids, bSetAction);

	if (oFolder.type() === Enums.FolderTypes.Inbox && sField === 'flagged')
	{
		if (this.uidList().filters() === Enums.FolderFilter.Flagged)
		{
			if (!bSetAction)
			{
				this.uidList().deleteUids(aUids);
				if (oFolderList.oStarredFolder)
				{
					oFolderList.oStarredFolder.messageCount(oStarredUidList.resultCount());
				}
			}
		}
		else
		{
			oFolder.removeFlaggedMessageListsFromCache();
			if (this.uidList().search() === '' && oFolderList.oStarredFolder)
			{
				if (bSetAction)
				{
					oFolderList.oStarredFolder.messageCount(iStarredCount + iUidsCount);
				}
				else
				{
					oFolderList.oStarredFolder.messageCount((iStarredCount - iUidsCount > 0) ? iStarredCount - iUidsCount : 0);
				}
			}
		}
	}

	if (sField === 'seen')
	{
		oFolder.removeUnseenMessageListsFromCache();
	}

	if (this.uidList().filters() !== Enums.FolderFilter.Unseen || this.waitForUnseenMessages())
	{
		this.setMessagesFromUidList(this.uidList(), iOffset, true);
	}
};

/**
 * private
 */

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CMailCache.prototype.onSetMessagesSeenResponse = function (oResponse, oRequest)
{
	this.iSetMessagesSeenCount--;
	if (this.iSetMessagesSeenCount < 0)
	{
		this.iSetMessagesSeenCount = 0;
	}
	if (this.getCurrentFolder() && this.iSetMessagesSeenCount === 0 && (this.uidList().filters() !== Enums.FolderFilter.Unseen || this.waitForUnseenMessages()))
	{
		this.requestCurrentMessageList(this.getCurrentFolder().fullName(), this.page(), this.uidList().search(), this.uidList().filters(), this.uidList().sortBy(), this.uidList().sortOrder(), false);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CMailCache.prototype.onGetFoldersResponse = function (oResponse, oRequest)
{
	var
		oParameters = oRequest.Parameters,
		oFolderList = new CFolderListModel(),
		iAccountId = oParameters.AccountID,
		oFolderListOld = this.oFolderListItems[iAccountId],
		oNamedFolderListOld = oFolderListOld ? oFolderListOld.oNamedCollection : {}
	;		

	if (oResponse.Result === false)
	{
		Api.showErrorByCode(oResponse);
		
		if (oParameters.AccountID === this.currentAccountId() && this.messages().length === 0)
		{
			this.messagesLoading(false);
			this.messagesLoadingError(true);
		}
	}
	else
	{
		oFolderList.parse(iAccountId, oResponse.Result, oNamedFolderListOld);
		if (oFolderListOld)
		{
			oFolderList.oStarredFolder.messageCount(oFolderListOld.oStarredFolder.messageCount());
		}
		
		this.__oldFolderList = this.oFolderListItems[iAccountId];
		this.oFolderListItems[iAccountId] = oFolderList;
		
		// Destroy the old folder list to free up used memory.
		if (this.__oldFolderList)
		{
			this.__oldFolderList.destroyFolders();
			Utils.destroyObjectWithObservables(this, '__oldFolderList');
		}

		if (this.currentAccountId() === iAccountId)
		{
			this.folderList(oFolderList);
		}
		if (this.editedAccountId() === iAccountId)
		{
			this.editedFolderList(oFolderList);
		}

		this.requirePrefetcher();
		if (!Prefetcher.prefetchFolderLists())
		{
			setTimeout(_.bind(this.getAllFoldersRelevantInformation, this, iAccountId), 2000);
		}
	}
	
	this.folderListLoading.remove(iAccountId);
};

/**
 * @param {number} iAccountId
 */
CMailCache.prototype.getAllFoldersRelevantInformation = function (iAccountId)
{
	if (AccountList.unifiedInboxReady())
	{
		var aAccountsData = [];
		_.each(AccountList.collection(), function (oAccount) {
			var aFolders = [];
			if (oAccount.id() === iAccountId)
			{
				aFolders = oFolderList ? oFolderList.getFoldersWithoutCountInfo() : [];
			}
			else if (oAccount.includeInUnifiedMailbox())
			{
				aFolders = this.getNamesOfFoldersToRefresh(iAccountId);
			}
			if (aFolders.length > 0)
			{
				aAccountsData.push({
					'AccountID': oAccount.id(),
					'Folders': aFolders,
					'UseListStatusIfPossible': this.getUseListStatusIfPossibleValue(oAccount.id(), aFolders.length)
				});
			}
		}, this);
		if (aAccountsData.length > 0)
		{
			oParameters = {
				'AccountsData': aAccountsData
			};

			Ajax.send('GetUnifiedRelevantFoldersInformation', oParameters, this.onGetRelevantFoldersInformationResponse, this);
		}
	}
	else
	{
		var
			oFolderList = this.oFolderListItems[iAccountId],
			aFolders = oFolderList ? oFolderList.getFoldersWithoutCountInfo() : [],
			oParameters = {
				'AccountID': iAccountId,
				'Folders': aFolders,
				'UseListStatusIfPossible': this.getUseListStatusIfPossibleValue(iAccountId, aFolders.length)
			}
		;

		if (aFolders.length > 0)
		{
			Ajax.send('GetRelevantFoldersInformation', oParameters, this.onGetRelevantFoldersInformationResponse, this);
		}
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CMailCache.prototype.onGetRelevantFoldersInformationResponse = function (oResponse, oRequest)
{
	var
		bCheckMailStarted = false,
		oParameters = oRequest.Parameters,
		iAccountId = oParameters.AccountID,
		oResult = oResponse.Result
	;
	
	if (oResult === false)
	{
		Api.showErrorByCode(oResponse);
		if (Ajax.hasOpenedRequests('GetRelevantFoldersInformation') || Ajax.hasOpenedRequests('GetUnifiedRelevantFoldersInformation'))
		{
			bCheckMailStarted = true;
		}
	}
	else
	{
		if (oResult.Unified && oResult.Accounts)
		{
			_.each(oResult.Accounts, function (oAccountData) {
				this.onGetRelevantFoldersInformationResponseForAccount(oAccountData.AccountId, oAccountData.Counts);
			}, this);
			var
				bSameFolder = this.oUnifiedInbox.selected(),
				aData = oResult.Unified,
				iCount = aData[0],
				iUnseenCount = aData[1],
				sUidNext = aData[2],
				sHash = aData[3],
				bFolderHasChanges = this.oUnifiedInbox.setRelevantInformation(sUidNext, sHash, iCount, iUnseenCount, bSameFolder)
			;
			if (bSameFolder && bFolderHasChanges && this.uidList().filters() !== Enums.FolderFilter.Unseen)
			{
				this.requestCurrentMessageList(this.getCurrentFolder().fullName(), this.page(), this.uidList().search(), this.uidList().filters(), this.uidList().sortBy(), this.uidList().sortOrder(), false);
				bCheckMailStarted = true;
			}
		}
		else if (oResult.Counts)
		{
			bCheckMailStarted = bCheckMailStarted || this.onGetRelevantFoldersInformationResponseForAccount(iAccountId, oResult.Counts);
		}
	}
	
	this.checkMailStarted(bCheckMailStarted);
	if (!this.checkMailStarted())
	{
		this.setAutocheckmailTimer();
	}
};

CMailCache.prototype.onGetRelevantFoldersInformationResponseForAccount = function (iAccountId, oCounts)
{
	var
		bCheckMailStarted = false,
		oFolderList = this.oFolderListItems[iAccountId],
		bSameAccount = this.currentAccountId() === iAccountId,
		sCurrentFolderName = this.getCurrentFolderFullname()
	;
	if (oFolderList)
	{
		_.each(oCounts, function(aData, sFullName) {
			if (_.isArray(aData) && aData.length > 3)
			{
				var
					iCount = aData[0],
					iUnseenCount = aData[1],
					sUidNext = aData[2],
					sHash = aData[3],
					bFolderHasChanges = false,
					bSameFolder = false,
					oFolder = null
				;

				oFolder = this.getFolderByFullName(iAccountId, sFullName);
				if (oFolder)
				{
					bSameFolder = bSameAccount && oFolder.fullName() === sCurrentFolderName;
					bFolderHasChanges = oFolder.setRelevantInformation(sUidNext, sHash, iCount, iUnseenCount, bSameFolder);
					if (bSameFolder && bFolderHasChanges && this.uidList().filters() !== Enums.FolderFilter.Unseen)
					{
						this.requestCurrentMessageList(oFolder.fullName(), this.page(), this.uidList().search(), this.uidList().filters(), this.uidList().sortBy(), this.uidList().sortOrder(), false);
						bCheckMailStarted = true;
					}
				}
			}
		}, this);

		oFolderList.countsCompletelyFilled(true);
	}
	return bCheckMailStarted;
};

/**
 * @param {Object} oResponse
 */
CMailCache.prototype.showNotificationsForNewMessages = function (oResponse)
{
	var
		sCurrentFolderName = this.getCurrentFolderFullname(),
		iNewLength = 0,
		sUid = '',
		oParameters = {},
		sFrom = '',
		aBody = []
	;
	
	if (oResponse.Result.New && oResponse.Result.New.length > 0)
	{
		iNewLength = oResponse.Result.New.length;
		sUid = oResponse.Result.New[0].Uid;
		var iAccountId = oResponse.Result.New[0].AccountId;
		if (sCurrentFolderName === this.oUnifiedInbox.fullName())
		{
			sUid = iAccountId + ':' + sUid;
		}
		
		oParameters = {
			action:'show',
			icon: 'static/styles/images/logo_140x140.png',
			title: TextUtils.i18n('MAILWEBCLIENT/INFO_NEW_MESSAGES_PLURAL', {
				'COUNT': iNewLength
			}, null, iNewLength),
			timeout: 5000,
			callback: function () {
				window.focus();
				Routing.setHash(LinksUtils.getMailbox(sCurrentFolderName, 1, sUid, '', ''));
			}
		};

		if (iNewLength === 1)
		{
			if (Types.isNonEmptyString(oResponse.Result.New[0].Subject))
			{
				aBody.push(TextUtils.i18n('MAILWEBCLIENT/LABEL_SUBJECT') + ': ' + oResponse.Result.New[0].Subject);
			}
			
			sFrom = (_.map(oResponse.Result.New[0].From, function(oFrom) {
				return oFrom.DisplayName !== '' ? oFrom.DisplayName : oFrom.Email;
			})).join(', ');
			if (Types.isNonEmptyString(sFrom))
			{
				aBody.push(TextUtils.i18n('MAILWEBCLIENT/LABEL_FROM') + ': ' + sFrom);
			}
			
			oParameters.body = aBody.join('\r\n');
		}

		Utils.desktopNotify(oParameters);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CMailCache.prototype.onCurrentGetMessagesResponse = function (oResponse, oRequest)
{
	this.checkMailStarted(false);

	if (!oResponse.Result)
	{
		Utils.log('onCurrentGetMessagesResponse, error ', JSON.stringify(oRequest).substr(0, 300), JSON.stringify(oResponse).substr(0, 300));
		Api.showErrorByCode(oResponse);
		if (this.messagesLoading() === true && (this.messages().length === 0 || oResponse.ErrorCode !== Enums.Errors.NotDisplayedError))
		{
			this.messagesLoadingError(true);
		}
		this.messagesLoading(false);
		this.setAutocheckmailTimer();
	}
	else
	{
		this.messagesLoadingError(false);
		this.parseMessageList(oResponse, oRequest);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CMailCache.prototype.onGetMessagesResponse = function (oResponse, oRequest)
{
	if (oResponse && oResponse.Result)
	{
		this.parseMessageList(oResponse, oRequest);
	}
	else
	{
		Utils.log('onGetMessagesResponse, error ', JSON.stringify(oRequest).substr(0, 300), JSON.stringify(oResponse).substr(0, 300));
	}
};

CMailCache.prototype.parseAndCacheMessages = function (aMessagesCollection, oFolder, bTrustThreadInfo, aNewFolderMessages)
{
	if (oFolder.fullName() === this.oUnifiedInbox.fullName())
	{
		var
			oFolders = {},
			oInbox = null
		;
		_.each(aMessagesCollection, function (oRawMessage) {
			var
				aParts = oRawMessage.UnifiedUid.split(':'),
				iAccountId = Types.pInt(aParts[0])
			;
			oInbox = oFolders[iAccountId];
			if (!oInbox)
			{
				var oFolderList = this.oFolderListItems[iAccountId];
				oInbox = oFolderList ? oFolderList.inboxFolder() : null;
			}
			if (oInbox)
			{
				var oFolderMessage = oInbox.parseAndCacheMessage(oRawMessage, false, bTrustThreadInfo);
				aNewFolderMessages.push(oFolderMessage);
			}
		}, this);
	}
	else
	{
		_.each(aMessagesCollection, function (oRawMessage) {
			var oFolderMessage = oFolder.parseAndCacheMessage(oRawMessage, false, bTrustThreadInfo);
			aNewFolderMessages.push(oFolderMessage);
		}, this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CMailCache.prototype.parseMessageList = function (oResponse, oRequest)
{
	if (oRequest.Parameters && !Types.isNonEmptyString(oRequest.Parameters.Folder))
	{
		oRequest.Parameters.Folder = this.oUnifiedInbox.fullName();
	}
	
	var
		oResult = oResponse.Result,
		oParameters = oRequest.Parameters,
		iAccountId = oParameters.AccountID,
		oFolder = null,
		oUidList = null,
		bTrustThreadInfo = oParameters.UseThreading,
		bHasFolderChanges = false,
		bCurrentFolder = (this.currentAccountId() === iAccountId
				|| oParameters.Folder === this.oUnifiedInbox.fullName())
				&& this.getCurrentFolderFullname() === oParameters.Folder,
		bCurrentList = bCurrentFolder &&
				this.uidList().search() === oResult.Search &&
				this.uidList().filters() === oResult.Filters &&
				this.uidList().sortBy() === oParameters.SortBy &&
				this.uidList().sortOrder() === oParameters.SortOrder,
		bCurrentPage = this.page() === ((oParameters.Offset / Settings.MailsPerPage) + 1), // !!!
		aNewFolderMessages = []
	;
	
	this.showNotificationsForNewMessages(oResponse);
	
	if (oResult !== false && oResult['@Object'] === 'Collection/MessageCollection')
	{
		oFolder = this.getFolderByFullName(iAccountId, oParameters.Folder);
		
		// perform before getUidList, because in case of a mismatch the uid list will be pre-cleaned
		oFolder.setRelevantInformation(oResult.UidNext.toString(), oResult.FolderHash, 
			oResult.MessageCount, oResult.MessageUnseenCount, bCurrentFolder && !bCurrentList);
		bHasFolderChanges = oFolder.hasChanges();
		oFolder.removeAllMessageListsFromCacheIfHasChanges();
		oUidList = oFolder.getUidList(oResult.Search, oResult.Filters, oParameters.SortBy, oParameters.SortOrder);
		oUidList.setUidsAndCount(oParameters.Offset, oResult);
		this.parseAndCacheMessages(oResult['@Collection'], oFolder, bTrustThreadInfo, aNewFolderMessages);
		
		if (bCurrentList)
		{
			this.uidList(oUidList);
			if (bCurrentPage && (oUidList.filters() !== Enums.FolderFilter.Unseen || this.waitForUnseenMessages()))
			{
				this.messagesLoading(false);
				this.waitForUnseenMessages(false);
				this.setMessagesFromUidList(oUidList, oParameters.Offset, true);
				if (!this.messagesLoading())
				{
					this.setAutocheckmailTimer();
				}
			}
		}
		
		if (bHasFolderChanges && bCurrentFolder && (!bCurrentList || !bCurrentPage) && this.uidList().filters() !== Enums.FolderFilter.Unseen)
		{
			this.requestCurrentMessageList(this.getCurrentFolderFullname(), this.page(), this.uidList().search(), this.uidList().filters(), this.uidList().sortBy(), this.uidList().sortOrder(), false);
		}
		
		if (oFolder.type() === Enums.FolderTypes.Inbox && oUidList.filters() === Enums.FolderFilter.Flagged &&
			oUidList.search() === '' && this.folderList().oStarredFolder)
		{
			this.folderList().oStarredFolder.messageCount(oUidList.resultCount());
			this.folderList().oStarredFolder.hasExtendedInfo(true);
		}
	}
};

CMailCache.prototype.increaseStarredCount = function ()
{
	if (this.folderList().oStarredFolder)
	{
		this.folderList().oStarredFolder.increaseCountIfHasNotInfo();
	}
};

CMailCache.prototype.removeMessageFromCurrentList = function (iAccountId, sFolder, sUid)
{
	var
		oFolder = this.getFolderByFullName(iAccountId, sFolder),
		oMessage = oFolder ? oFolder.getMessageByUid(sUid) : null
	;
	if (oMessage)
	{
		this.messages(_.filter(this.messages(), function (oTempMessage) {
			return oTempMessage.uid() !== sUid;
		}));
		Routing.replaceHashWithoutMessageUid(sUid);
		oFolder.markHasChanges();
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CMailCache.prototype.onMoveMessagesResponse = function (oResponse, oRequest)
{
	var
		oResult = oResponse.Result,
		oParameters = oRequest.Parameters,
		aUids = oParameters.Uids.split(','),
		oFolder = this.getFolderByFullName(oParameters.AccountID, oParameters.Folder),
		oToFolder = this.getFolderByFullName(oParameters.AccountID, oParameters.ToFolder),
		bToFolderTrash = (oToFolder && (oToFolder.type() === Enums.FolderTypes.Trash)),
		bToFolderSpam = (oToFolder && (oToFolder.type() === Enums.FolderTypes.Spam)),
		oDiffs = null,
		sConfirm = bToFolderTrash ? TextUtils.i18n('MAILWEBCLIENT/CONFIRM_MESSAGES_DELETE_WITHOUT_TRASH') :
			TextUtils.i18n('MAILWEBCLIENT/CONFIRM_MESSAGES_MARK_SPAM_WITHOUT_SPAM'),
		fDeleteMessages = _.bind(function (bResult) {
			if (bResult && oFolder)
			{
				this.deleteMessagesFromFolder(oFolder, aUids);
			}
		}, this),
		oCurrFolder = this.getCurrentFolder(),
		sCurrFolderFullName = oCurrFolder ? oCurrFolder.fullName() : '',
		bFillMessages = false
	;
	
	if (oResult === false)
	{
		if (oFolder)
		{
			oDiffs = oFolder.revertDeleted(aUids);
		}
		if (oToFolder)
		{
			if (oDiffs)
			{
				oToFolder.addMessagesCountsDiff(-oDiffs.PlusDiff, -oDiffs.UnseenPlusDiff);
			}
			if (oResponse.ErrorCode === Enums.MailErrors.CannotMoveMessageQuota && (bToFolderTrash || bToFolderSpam))
			{
				if (Types.isNonEmptyString(oResponse.ErrorMessage))
				{
					sConfirm += ' (' + oResponse.ErrorMessage + ')';
				}
				Popups.showPopup(ConfirmPopup, [sConfirm, fDeleteMessages]);
			}
			else
			{
				Api.showErrorByCode(oResponse, TextUtils.i18n('MAILWEBCLIENT/ERROR_MOVING_MESSAGES'));
			}
		}
		else
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('MAILWEBCLIENT/ERROR_DELETING_MESSAGES'));
		}
		bFillMessages = true;
	}
	else if (oFolder)
	{
		this.messages(_.filter(this.messages(), function (oMessage) {
			return _.indexOf(aUids, oMessage && oMessage.uid && oMessage.uid()) === -1;
		}));
		oFolder.commitDeleted(aUids);
		_.each(aUids, function (sUid) {
			Routing.replaceHashWithoutMessageUid(sUid);
		});
	}

	if (oFolder && sCurrFolderFullName === oFolder.fullName() || oToFolder && sCurrFolderFullName === oToFolder.fullName() ||
		oCurrFolder.bIsUnifiedInbox && (oFolder && oFolder.type() === Enums.FolderTypes.Inbox || oToFolder && oToFolder.type() === Enums.FolderTypes.Inbox))
	{
		oCurrFolder.markHasChanges();
		switch (this.uidList().filters())
		{
			case Enums.FolderFilter.Flagged:
				break;
			case Enums.FolderFilter.Unseen:
				if (this.waitForUnseenMessages())
				{
					this.requestCurrentMessageList(sCurrFolderFullName, this.page(), this.uidList().search(), this.uidList().filters(), this.uidList().sortBy(), this.uidList().sortOrder(), bFillMessages);
				}
				break;
			default:
				this.requestCurrentMessageList(sCurrFolderFullName, this.page(), this.uidList().search(), this.uidList().filters(), this.uidList().sortBy(), this.uidList().sortOrder(), bFillMessages);
				break;
		}
	}
	else if (oFolder && sCurrFolderFullName !== oFolder.fullName())
	{
		this.requirePrefetcher();
		Prefetcher.startFolderPrefetch(oFolder);
	}
	else if (oToFolder && sCurrFolderFullName !== oToFolder.fullName())
	{
		this.requirePrefetcher();
		Prefetcher.startFolderPrefetch(oToFolder);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CMailCache.prototype.onCopyMessagesResponse = function (oResponse, oRequest)
{
	var
		oResult = oResponse.Result,
		oParameters = oRequest.Parameters,
		oFolder = this.getFolderByFullName(oParameters.AccountID, oParameters.Folder),
		oToFolder = this.getFolderByFullName(oParameters.AccountID, oParameters.ToFolder),
		oCurrFolder = this.getCurrentFolder(),
		sCurrFolderFullName = oCurrFolder.fullName()
	;

	if (oResult === false)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('MAILWEBCLIENT/ERROR_COPYING_MESSAGES'));
	}

	if (sCurrFolderFullName === oFolder.fullName() || oToFolder && sCurrFolderFullName === oToFolder.fullName())
	{
		oCurrFolder.markHasChanges();
		this.requestCurrentMessageList(sCurrFolderFullName, this.page(), this.uidList().search(), '', this.uidList().sortBy(), this.uidList().sortOrder(), false);
	}
	else if (sCurrFolderFullName !== oFolder.fullName())
	{
		this.requirePrefetcher();
		Prefetcher.startFolderPrefetch(oFolder);
	}
	else if (oToFolder && sCurrFolderFullName !== oToFolder.fullName())
	{
		this.requirePrefetcher();
		Prefetcher.startFolderPrefetch(oToFolder);
	}
};

/**
 * @param {string} sSearch
 */
CMailCache.prototype.searchMessagesInCurrentFolder = function (sSearch)
{
	var
		sFolder = this.getCurrentFolderFullname() || 'INBOX',
		sUid = this.currentMessage() ? this.currentMessage().uid() : '',
		sFilters = this.uidList().filters()
	;
	
	Routing.setHash(LinksUtils.getMailbox(sFolder, 1, sUid, sSearch, sFilters));
};

/**
 * @param {string} sSearch
 */
CMailCache.prototype.searchMessagesInInbox = function (sSearch)
{
	Routing.setHash(LinksUtils.getMailbox(this.folderList().inboxFolderFullName() || 'INBOX', 1, '', sSearch, ''));
};

CMailCache.prototype.getFolderHash = function (sFolder)
{
	return Routing.buildHashFromArray(LinksUtils.getMailbox(sFolder, 1, '', '', ''));
};

CMailCache.prototype.countMessages = function (oCountedFolder)
{
	var aSubfoldersMessagesCount = [],
		fCountRecursively = function(oFolder)
		{

			_.each(oFolder.subfolders(), function(oSubFolder, iKey) {
				if(oSubFolder.subscribed())
				{
					aSubfoldersMessagesCount.push(oSubFolder.unseenMessageCount());
					if (oSubFolder.subfolders().length && oSubFolder.subscribed())
					{
						fCountRecursively(oSubFolder);
					}
				}
			}, this);
		}
	;

	if (oCountedFolder.expanded() || oCountedFolder.bNamespace)
	{
		oCountedFolder.subfoldersMessagesCount(0);
	}
	else
	{
		fCountRecursively(oCountedFolder);
		oCountedFolder.subfoldersMessagesCount(
			_.reduce(aSubfoldersMessagesCount, function(memo, num){ return memo + num; }, 0)
		);
	}

};

CMailCache.prototype.changeDatesInMessages = function () {
	MessagesDictionary.updateMomentDates();
};

/**
 * Clears messages cache for specified account.
 * @param {number} iAccountId
 */
CMailCache.prototype.clearMessagesCache = function (iAccountId)
{
	var oFolderList = this.oFolderListItems[iAccountId];
	
	_.each(oFolderList.collection(), function (oFolder) {
		oFolder.markHasChanges();
		oFolder.removeAllMessageListsFromCacheIfHasChanges();
	}, this);
	
	if (iAccountId === this.currentAccountId())
	{
		this.messages([]);
	}
};


CMailCache.prototype.getTemplateFolder = function ()
{
	var
		oFolderList = this.folderList(),
		sFolder = '',
		sCurrentFolder = oFolderList.currentFolder() ? oFolderList.currentFolder().fullName() : ''
	;
	if (Types.isNonEmptyArray(this.getCurrentTemplateFolders()))
	{
		if (-1 !== $.inArray(sCurrentFolder, this.getCurrentTemplateFolders()))
		{
			sFolder = sCurrentFolder;
		}
		else
		{
			sFolder = _.find(this.getCurrentTemplateFolders(), function (sTempFolder) {
				return !!oFolderList.oNamedCollection[sTempFolder];
			});
		}
	}
	return typeof(sFolder) === 'string' ? sFolder : '';
};

CMailCache.prototype.getCurrentTemplateFolders = function ()
{
	return Settings.AllowTemplateFolders ? this.folderList().aTemplateFolders : [];
};

CMailCache.prototype.changeTemplateFolder = function (sFolderName, bTemplate)
{
	if (Settings.AllowTemplateFolders)
	{
		this.folderList().changeTemplateFolder(sFolderName, bTemplate);
	}
};

var MailCache = new CMailCache();

Pulse.registerDayOfMonthFunction(_.bind(MailCache.changeDatesInMessages, MailCache));

UserSettings.timeFormat.subscribe(MailCache.changeDatesInMessages, MailCache);
UserSettings.dateFormat.subscribe(MailCache.changeDatesInMessages, MailCache);

module.exports = MailCache;


/***/ }),

/***/ "4M/5":
/*!*************************************************!*\
  !*** ./modules/MailWebclient/js/utils/Links.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	Routing = __webpack_require__(/*! modules/CoreWebclient/js/Routing.js */ "QaF5"),
	
	MailCache = null,
	Settings = __webpack_require__(/*! modules/MailWebclient/js/Settings.js */ "p2hp"),
	
	LinksUtils = {}
;

/**
 * @param {string} sTemp
 * 
 * @return {boolean}
 */
function IsPageParam(sTemp)
{
	return ('p' === sTemp.substr(0, 1) && (/^[1-9][\d]*$/).test(sTemp.substr(1)));
};

/**
 * @param {string} sTemp
 * 
 * @return {boolean}
 */
function IsMsgParam(sTemp)
{
	return ('msg' === sTemp.substr(0, 3) && (/^[1-9][\d:]*$/).test(sTemp.substr(3)));
};

/**
 * @param {string} sTemp
 * 
 * @return {boolean}
 */
function IsServerParam(sTemp)
{
	return ('s' === sTemp.substr(0, 1) && (/^[1-9][\d]*$/).test(sTemp.substr(1)));
};

/**
 * @param {string=} sFolder = 'INBOX'
 * @param {number=} iPage = 1
 * @param {string=} sUid = ''
 * @param {string=} sSearch = ''
 * @param {string=} sFilters = ''
 * @param {string=} sSortBy = ''
 * @param {string=} iSortOrder = 0
 * @param {string=} sCustom = ''
 * @return {Array}
 */
LinksUtils.getMailbox = function (sFolder, iPage, sUid, sSearch, sFilters, sSortBy, iSortOrder, sCustom)
{
	var
		AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm"),
		oCurrAccount = AccountList.getCurrent(),
		aResult = [Settings.HashModuleName, oCurrAccount ? oCurrAccount.hash() : '']
	;
	
	iPage = Types.pInt(iPage, 1);
	sUid = Types.pString(sUid);
	sSearch = Types.pString(sSearch);
	sFilters = Types.pString(sFilters);
	sSortBy = Types.pString(sSortBy, Settings.MessagesSortBy.DefaultSortBy);
	iSortOrder = Types.pInt(iSortOrder, Settings.MessagesSortBy.DefaultSortOrder);
	sCustom = Types.pString(sCustom);

	if (Types.isNonEmptyString(sFolder))
	{
		aResult.push(sFolder);
	}
	
	if ('' !== sFilters)
	{
		aResult.push('filter:' + sFilters);
	}
	
	if ('' !== sSortBy && Settings.MessagesSortBy.DefaultSortBy !== sSortBy)
	{
		aResult.push('sortby:' + sSortBy);
	}
	
	if (Settings.MessagesSortBy.DefaultSortOrder !== iSortOrder)
	{
		aResult.push('sortorder:' + iSortOrder);
	}
	
	if (1 < iPage)
	{
		aResult.push('p' + iPage);
	}

	if ('' !== sUid)
	{
		aResult.push('msg' + sUid);
	}

	if ('' !== sSearch)
	{
		aResult.push(sSearch);
	}
	
	if ('' !== sCustom)
	{
		aResult.push('custom:' + sCustom);
	}
	
	return aResult;
};

/**
 * Requires MailCache. It cannot be required earlier because it is not initialized yet.
 */
LinksUtils.requireMailCache = function ()
{
	if (MailCache === null)
	{
		MailCache = __webpack_require__(/*! modules/MailWebclient/js/Cache.js */ "4+IO");
	}
};

/**
 * @param {Array} aParamsToParse
 * 
 * @return {Object}
 */
LinksUtils.parseMailbox = function (aParamsToParse)
{
	this.requireMailCache();
	
	var
		bMailtoCompose = aParamsToParse.length > 0 && aParamsToParse[0] === 'compose' && aParamsToParse[1] === 'to',
		aParams = bMailtoCompose ? [] : aParamsToParse,
		sAccountHash = '',
		sFolder = '',
		sInboxFullName = MailCache.folderList().inboxFolderFullName() || 'INBOX',
		iPage = 1,
		sUid = '',
		sSearch = '',
		sFilters = '',
		sSortBy = Settings.MessagesSortBy.DefaultSortBy,
		iSortOrder = Settings.MessagesSortBy.DefaultSortOrder,
		sCustom = '',
		sTemp = '',
		iIndex = 0
	;
	
	if (Types.isNonEmptyArray(aParams))
	{
		sAccountHash = Types.pString(aParams[iIndex]);
		iIndex++;
	}

	if (Types.isNonEmptyArray(aParams))
	{
		sFolder = Types.pString(aParams[iIndex]);
		iIndex++;

		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (sTemp === 'filter:' + Enums.FolderFilter.Flagged)
			{
				sFilters = Enums.FolderFilter.Flagged;
				iIndex++;
			}
			if (sTemp === 'filter:' + Enums.FolderFilter.Unseen)
			{
				sFilters = Enums.FolderFilter.Unseen;
				iIndex++;
			}
		}

		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (sTemp.substr(0, 7) === 'sortby:')
			{
				if (Settings.MessagesSortBy.Allow)
				{
					sSortBy = sTemp.substr(7);
				}
				iIndex++;
			}
		}

		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (sTemp.substr(0, 10) === 'sortorder:')
			{
				if (Settings.MessagesSortBy.Allow)
				{
					iSortOrder = Types.pEnum(Types.pInt(sTemp.substr(10)), Enums.SortOrder, Settings.MessagesSortBy.DefaultSortOrder);
				}
				iIndex++;
			}
		}
		
		if (!_.find(Settings.MessagesSortBy.List, function(oSortData) { return oSortData.SortBy === sSortBy; }))
		{
			sSortBy = Settings.MessagesSortBy.DefaultSortBy;
			iSortOrder = Settings.MessagesSortBy.DefaultSortOrder;
		}

		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (IsPageParam(sTemp))
			{
				iPage = Types.pInt(sTemp.substr(1));
				if (iPage <= 0)
				{
					iPage = 1;
				}
				iIndex++;
			}
		}
		
		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (IsMsgParam(sTemp))
			{
				sUid = sTemp.substr(3);
				iIndex++;
			}
		}

		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if ('custom:' !== sTemp.substr(0, 7))
			{
				sSearch = sTemp;
				iIndex++;
			}
		}
		
		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if ('custom:' === sTemp.substr(0, 7))
			{
				sCustom = sTemp.substr(7);
			}
		}
	}
	
	return {
		'MailtoCompose': bMailtoCompose,
		'AccountHash': sAccountHash,
		'Folder': sFolder === '' ? sInboxFullName : sFolder,
		'Page': iPage,
		'Uid': sUid,
		'Search': sSearch,
		'Filters': sFilters,
		'SortBy': sSortBy,
		'SortOrder': iSortOrder,
		'Custom': sCustom
	};
};

/**
 * @param {string} sFolder
 * @param {string} sUid
 * @return {Array}
 */
LinksUtils.getViewMessage = function (iAccountId, sFolder, sUid)
{
	var
		AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm"),
		oAccount = AccountList.getAccount(iAccountId),
		sAccountHash = oAccount ? oAccount.hash() : ''
	;
	return [Settings.HashModuleName + '-view', sAccountHash, sFolder, 'msg' + sUid];
};

/**
 * @return {Array}
 */
LinksUtils.getCompose = function ()
{
	var
		AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm"),
		oCurrAccount = AccountList.getCurrent(),
		sAccountHash = oCurrAccount ? oCurrAccount.hash() : ''
	;
	return [Settings.HashModuleName + '-compose', sAccountHash];
};

/**
 * @param {string} sType
 * @param {int} iAccountId
 * @param {string} sFolder
 * @param {string} sUid
 * 
 * @return {Array}
 */
LinksUtils.getComposeFromMessage = function (sType, iAccountId, sFolder, sUid)
{
	var
		AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm"),
		oAccount = AccountList.getAccount(iAccountId),
		sAccountHash = oAccount ? oAccount.hash() : ''
	;
	return [Settings.HashModuleName + '-compose', sAccountHash, sType, sFolder, sUid];
};

/**
 * @param {string} sTo
 * 
 * @return {Array}
 */
LinksUtils.getComposeWithToField = function (sTo)
{
	var
		AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm"),
		oCurrAccount = AccountList.getCurrent(),
		sAccountHash = oCurrAccount ? oCurrAccount.hash() : ''
	;
	return [Settings.HashModuleName + '-compose', sAccountHash, 'to', sTo];
};

LinksUtils.getComposeWithData = function (oData)
{
	var
		AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm"),
		oCurrAccount = AccountList.getCurrent(),
		sAccountHash = oCurrAccount ? oCurrAccount.hash() : ''
	;
	return [Settings.HashModuleName + '-compose', sAccountHash, 'data', oData];
};

/**
 * @param {string} sType
 * @param {Object} oObject
 * @returns {Array}
 */
LinksUtils.getComposeWithObject = function (sType, oObject)
{
	var
		AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm"),
		oCurrAccount = AccountList.getCurrent(),
		sAccountHash = oCurrAccount ? oCurrAccount.hash() : ''
	;
	return [Settings.HashModuleName + '-compose', sAccountHash, sType, oObject];
};

/**
 * @param {int} iAccountId
 * @param {string} sFolderName
 * @param {string} sUid
 * @param {object} oObject
 * @returns {Array}
 */
LinksUtils.getComposeWithEmlObject = function (iAccountId, sFolderName, sUid, oObject)
{
	var
		AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm"),
		oAccount = AccountList.getAccount(iAccountId),
		sAccountHash = oAccount ? oAccount.hash() : ''
	;
	return [Settings.HashModuleName + '-compose', sAccountHash, Enums.ReplyType.ForwardAsAttach, sFolderName, sUid, oObject];
};

/**
 * @param {array} aParams
 * @returns {object}
 */
LinksUtils.parseCompose = function (aParams)
{
	var
		sAccountHash = (aParams.length > 0) ? aParams[0] : '',
		sRouteType = (aParams.length > 1) ? aParams[1] : '',
		oObject = ((sRouteType === Enums.ReplyType.ForwardAsAttach || sRouteType === 'attachments' || sRouteType === 'data') && aParams.length > 2) ? 
					(sRouteType === Enums.ReplyType.ForwardAsAttach ? aParams[4] : aParams[2]) : null,
		oToAddr = (sRouteType === 'to' && aParams.length > 2) ? LinksUtils.parseToAddr(aParams[2]) : null,
		bMessage = ((sRouteType === Enums.ReplyType.Reply || sRouteType === Enums.ReplyType.ReplyAll 
					|| sRouteType === Enums.ReplyType.Resend || sRouteType === Enums.ReplyType.Forward 
					|| sRouteType === 'drafts' || sRouteType === Enums.ReplyType.ForwardAsAttach) && aParams.length > 2),
		sFolderName = bMessage ? aParams[2] : '',
		sUid = bMessage ? aParams[3] : ''
	;
	
	return {
		'AccountHash': sAccountHash,
		'RouteType': sRouteType,
		'ToAddr': oToAddr,
		'Object': oObject,
		'MessageFolderName': sFolderName,
		'MessageUid': sUid
	};
};

/**
 * @param {?} mToAddr
 * @returns {Object}
 */
LinksUtils.parseToAddr = function (mToAddr)
{
	var
		sToAddr = Types.pString(mToAddr),
		bHasMailTo = sToAddr.indexOf('mailto:') !== -1,
		aMailto = [],
		aMessageParts = [],
		sSubject = '',
		sCcAddr = '',
		sBccAddr = '',
		sBody = ''
	;
	
	if (bHasMailTo)
	{
		aMailto = sToAddr.replace(/^mailto:/, '').split('?');
		sToAddr = aMailto[0];
		if (aMailto.length === 2)
		{
			aMessageParts = aMailto[1].split('&');
			_.each(aMessageParts, function (sPart) {
				var aParts = sPart.split('=');
				if (aParts.length === 2)
				{
					switch (aParts[0].toLowerCase())
					{
						case 'subject': sSubject = decodeURIComponent(aParts[1]); break;
						case 'cc': sCcAddr = decodeURIComponent(aParts[1]); break;
						case 'bcc': sBccAddr = decodeURIComponent(aParts[1]); break;
						case 'body': sBody = decodeURIComponent(aParts[1]); break;
					}
				}
			});
		}
	}
	
	return {
		'to': sToAddr,
		'hasMailto': bHasMailTo,
		'subject': sSubject,
		'cc': sCcAddr,
		'bcc': sBccAddr,
		'body': sBody
	};
};

/**
 * @param {array} aParams
 * @returns {Object}
 */
LinksUtils.parseMailServers = function (aParams)
{
	var
		iIndex = 0,
		sTemp = '',
		iPage = 1,
		sSearch = '',
		bCreate = false,
		iEditServerId = 0
	;
	
	if (Types.isNonEmptyArray(aParams))
	{
		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (IsPageParam(sTemp))
			{
				iPage = Types.pInt(sTemp.substr(1));
				if (iPage <= 0)
				{
					iPage = 1;
				}
				iIndex++;
			}
		}
		
		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (!IsServerParam(sTemp) && sTemp !== 'create')
			{
				sSearch = sTemp;
				iIndex++;
			}
		}
		
		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (IsServerParam(sTemp))
			{
				iEditServerId = Types.pInt(sTemp.substr(1), iEditServerId);
				if (iEditServerId <= 0)
				{
					iEditServerId = 1;
				}
				iIndex++;
			}
		}
		
		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			bCreate = sTemp === 'create';
		}
	}
	
	return {
		'Page': iPage,
		'Search': sSearch,
		'Create': bCreate,
		'EditServerId': iEditServerId
	};
};

module.exports = LinksUtils;


/***/ }),

/***/ "5H03":
/*!*******************************************************************************!*\
  !*** ./modules/MailWebclient/js/popups/ConfirmAnotherMessageComposedPopup.js ***!
  \*******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	
	CAbstractPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/CAbstractPopup.js */ "czxF")
;

/**
 * @constructor
 */
function CConfirmAnotherMessageComposedPopup()
{
	CAbstractPopup.call(this);
	
	this.fConfirmCallback = null;
	this.shown = false;
}

_.extendOwn(CConfirmAnotherMessageComposedPopup.prototype, CAbstractPopup.prototype);

CConfirmAnotherMessageComposedPopup.prototype.PopupTemplate = 'MailWebclient_ConfirmAnotherMessageComposedPopup';

/**
 * @param {Function} fConfirmCallback
 */
CConfirmAnotherMessageComposedPopup.prototype.onOpen = function (fConfirmCallback)
{
	this.fConfirmCallback = $.isFunction(fConfirmCallback) ? fConfirmCallback : null;
	this.shown = true;
};

CConfirmAnotherMessageComposedPopup.prototype.onClose = function ()
{
	this.shown = false;
};

CConfirmAnotherMessageComposedPopup.prototype.onDiscardClick = function ()
{
	if (this.shown && this.fConfirmCallback)
	{
		this.fConfirmCallback(Enums.AnotherMessageComposedAnswer.Discard);
	}

	this.closePopup();
};

CConfirmAnotherMessageComposedPopup.prototype.onSaveAsDraftClick = function ()
{
	if (this.shown && this.fConfirmCallback)
	{
		this.fConfirmCallback(Enums.AnotherMessageComposedAnswer.SaveAsDraft);
	}

	this.closePopup();
};

CConfirmAnotherMessageComposedPopup.prototype.cancelPopup = function ()
{
	if (this.fConfirmCallback)
	{
		this.fConfirmCallback(Enums.AnotherMessageComposedAnswer.Cancel);
	}

	this.closePopup();
};

CConfirmAnotherMessageComposedPopup.prototype.onEnterHandler = function ()
{
	this.onSaveAsDraftClick();
};

module.exports = new CConfirmAnotherMessageComposedPopup();

/***/ }),

/***/ "5aTH":
/*!*************************************************************!*\
  !*** ./modules/MailWebclient/js/models/CFolderListModel.js ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
	
	Storage = __webpack_require__(/*! modules/CoreWebclient/js/Storage.js */ "gcBV"),
	
	MailCache = null,
	Settings = __webpack_require__(/*! modules/MailWebclient/js/Settings.js */ "p2hp"),
	CFolderModel = __webpack_require__(/*! modules/MailWebclient/js/models/CFolderModel.js */ "qGK3")
;

/**
 * @constructor
 */
function CFolderListModel()
{
	this.iAccountId = 0;
	this.initialized = ko.observable(false);

	this.bExpandFolders = false;
	this.expandNames = ko.observableArray([]);
	this.collection = ko.observableArray([]);
	this.options = ko.observableArray([]);
	this.sNamespaceFolder = '';
	this.oStarredFolder = null;

	this.oNamedCollection = {};
	this.aLinedCollection = [];

	var
		self = this,
		fSetSystemType = function (iType) {
			return function (oFolder) {
				if (oFolder)
				{
					oFolder.type(iType);
				}
			};
		},
		fFullNameHelper = function (fFolder) {
			return {
				'read': function () {
					this.collection();
					return fFolder() ? fFolder().fullName() : '';
				},
				'write': function (sValue) {
					fFolder(this.getFolderByFullName(sValue));
				},
				'owner': self
			};
		}
	;

	this.currentFolder = ko.observable(null);

	this.inboxFolder = ko.observable(null);
	this.sentFolder = ko.observable(null);
	this.draftsFolder = ko.observable(null);
	this.spamFolder = ko.observable(null);
	this.trashFolder = ko.observable(null);
	this.aTemplateFolders = [];
	
	this.countsCompletelyFilled = ko.observable(false);

	this.inboxFolder.subscribe(fSetSystemType(Enums.FolderTypes.User), this, 'beforeChange');
	this.sentFolder.subscribe(fSetSystemType(Enums.FolderTypes.User), this, 'beforeChange');
	this.draftsFolder.subscribe(fSetSystemType(Enums.FolderTypes.User), this, 'beforeChange');
	this.spamFolder.subscribe(fSetSystemType(Enums.FolderTypes.User), this, 'beforeChange');
	this.trashFolder.subscribe(fSetSystemType(Enums.FolderTypes.User), this, 'beforeChange');
	
	this.inboxFolder.subscribe(fSetSystemType(Enums.FolderTypes.Inbox));
	this.sentFolder.subscribe(fSetSystemType(Enums.FolderTypes.Sent));
	this.draftsFolder.subscribe(fSetSystemType(Enums.FolderTypes.Drafts));
	this.spamFolder.subscribe(fSetSystemType(Enums.FolderTypes.Spam));
	this.trashFolder.subscribe(fSetSystemType(Enums.FolderTypes.Trash));
	
	this.inboxFolderFullName = ko.computed(fFullNameHelper(this.inboxFolder));
	this.sentFolderFullName = ko.computed(fFullNameHelper(this.sentFolder));
	this.draftsFolderFullName = ko.computed(fFullNameHelper(this.draftsFolder));
	this.spamFolderFullName = ko.computed(fFullNameHelper(this.spamFolder));
	this.trashFolderFullName = ko.computed(fFullNameHelper(this.trashFolder));
	
	this.currentFolderFullName = ko.computed(fFullNameHelper(this.currentFolder));
	this.currentFolderType = ko.computed(function () {
		return this.currentFolder() ? this.currentFolder().type() : Enums.FolderTypes.User;
	}, this);
	
	this.sDelimiter = '';
}

/**
 * Requires MailCache. It cannot be required earlier because it is not initialized yet.
 */
CFolderListModel.prototype.requireMailCache = function ()
{
	if (MailCache === null)
	{
		MailCache = __webpack_require__(/*! modules/MailWebclient/js/Cache.js */ "4+IO");
	}
};

CFolderListModel.prototype.getFoldersCount = function ()
{
	return this.aLinedCollection.length;
};

CFolderListModel.prototype.getTotalMessageCount = function ()
{
	var iCount = 0;
	
	_.each(this.oNamedCollection, function (oFolder) {
		iCount += oFolder.messageCount();
	}, this);
	
	return iCount;
};

/**
 * @returns {Array}
 */
CFolderListModel.prototype.getFoldersWithoutCountInfo = function ()
{
	var aFolders = _.compact(_.map(this.oNamedCollection, function(oFolder, sFullName) {
		if (oFolder.canBeSelected() && !oFolder.hasExtendedInfo())
		{
			return sFullName;
		}
		
		return null;
	}));
	
	return aFolders;
};

CFolderListModel.prototype.getNamesOfFoldersToRefresh = function ()
{
	var aFolders = [this.inboxFolderFullName(), this.spamFolderFullName(), this.currentFolderFullName()];
	
	_.each(this.oNamedCollection, function (oFolder) {
		if (oFolder.isAlwaysRefresh())
		{
			aFolders.push(oFolder.fullName());
		}
	});
	
	return _.uniq(aFolders);
};

/**
 * @param {string} sFolderFullName
 * @param {string} sFilters
 */
CFolderListModel.prototype.setCurrentFolder = function (sFolderFullName, sFilters)
{
	this.requireMailCache();
	
	var
		oFolder = this.getFolderByFullName(sFolderFullName)
	;
	
	if (oFolder === null || !oFolder.canBeSelected())
	{
		oFolder = this.inboxFolder();
	}
	
	if (oFolder !== null)
	{
		if (this.currentFolder())
		{
			this.currentFolder().selected(false);
			if (this.oStarredFolder)
			{
				this.oStarredFolder.selected(false);
			}
		}
		
		if (sFolderFullName === MailCache.oUnifiedInbox.fullName())
		{
			this.currentFolder(null);
		}
		else
		{
			this.currentFolder(oFolder);
			if (sFilters === Enums.FolderFilter.Flagged)
			{
				if (this.oStarredFolder)
				{
					this.oStarredFolder.selected(true);
				}
			}
			else
			{
				this.currentFolder().selected(true);
			}
		}
	}
};

/**
 * Returns a folder, found by the full name.
 * 
 * @param {string} sFolderFullName
 * @returns {CFolderModel|null}
 */
CFolderListModel.prototype.getFolderByFullName = function (sFolderFullName)
{
	var oFolder = this.oNamedCollection[sFolderFullName];
	
	return oFolder ? oFolder : null;
};

CFolderListModel.prototype.renameFolder = function (sFullName, sNewFullName, sNewFullNameHash)
{
	var oFolder = this.oNamedCollection[sFullName];
	oFolder.fullName(sNewFullName);
	oFolder.fullNameHash(sNewFullNameHash);
	this.oNamedCollection[sNewFullName] = oFolder;
	delete this.oNamedCollection[sFullName];
};

CFolderListModel.prototype.changeTemplateFolder = function (sFolderName, bTemplate)
{
	if (Settings.AllowTemplateFolders)
	{
		if (bTemplate)
		{
			this.aTemplateFolders.push(sFolderName);
		}
		else
		{
			this.aTemplateFolders = _.without(this.aTemplateFolders, sFolderName);
		}
	}
};

/**
 * Calls a recursive parsing of the folder tree.
 * 
 * @param {number} iAccountId
 * @param {Object} oData
 * @param {Object} oNamedFolderListOld
 */
CFolderListModel.prototype.parse = function (iAccountId, oData, oNamedFolderListOld)
{
	var
		sNamespace = Types.pString(oData.Namespace),
		aCollection = oData.Folders['@Collection']
	;
	if (sNamespace.length > 0)
	{
		this.sNamespaceFolder = sNamespace.substring(0, sNamespace.length - 1);
	}
	
	this.iAccountId = iAccountId;
	this.initialized(true);

	this.bExpandFolders = Settings.FoldersExpandedByDefault && !Storage.hasData('folderAccordion');
	if (!Storage.hasData('folderAccordion'))
	{
		Storage.setData('folderAccordion', []);
	}
	
	this.oNamedCollection = {};
	this.aLinedCollection = [];
	this.collection(this.parseRecursively(aCollection, oNamedFolderListOld));
};

/**
 * Destroys all the remaining folders before the list will be destroyed itself.
 */
CFolderListModel.prototype.destroyFolders = function ()
{
	Utils.destroyObjectWithObservables(this, 'oStarredFolder');
	this.collection.removeAll();
	this.aLinedCollection = [];
	for (var sKey in this.oNamedCollection)
	{
		Utils.destroyObjectWithObservables(this.oNamedCollection, sKey);
	}
};

/**
 * Recursively parses the folder tree.
 * 
 * @param {Array} aRawCollection
 * @param {Object} oNamedFolderListOld
 * @param {number=} iLevel
 * @param {string=} sParentFullName
 * @returns {Array}
 */
CFolderListModel.prototype.parseRecursively = function (aRawCollection, oNamedFolderListOld, iLevel, sParentFullName)
{
	var
		aParsedCollection = [],
		iIndex = 0,
		iLen = 0,
		oFolder = null,
		oFolderOld = null,
		sFolderFullName = '',
		oSubFolders = null,
		aSubfolders = []
	;

	sParentFullName = sParentFullName || '';
	
	if (iLevel === undefined)
	{
		iLevel = -1;
	}

	iLevel++;
	if (_.isArray(aRawCollection))
	{
		for (iLen = aRawCollection.length; iIndex < iLen; iIndex++)
		{
			sFolderFullName = Types.pString(aRawCollection[iIndex].FullNameRaw);
			oFolderOld = oNamedFolderListOld[sFolderFullName];
			
			// Do not create a new folder object if possible. A new object will use memory that is difficult to free.
			oFolder = oFolderOld ? oFolderOld : new CFolderModel(this.iAccountId);
			oSubFolders = oFolder.parse(aRawCollection[iIndex], sParentFullName, this.sNamespaceFolder);
			
			// Remove from the old folder list reference to the folder. The remaining folders will be destroyed.
			delete oNamedFolderListOld[sFolderFullName];

			if (this.bExpandFolders && oSubFolders !== null)
			{
				oFolder.expanded(true);
				this.expandNames().push(Types.pString(aRawCollection[iIndex].Name));
			}

			oFolder.setDisplayedLevel(iLevel);

			switch (oFolder.type())
			{
				case Enums.FolderTypes.Inbox:
					this.inboxFolder(oFolder);
					this.sDelimiter = oFolder.sDelimiter;
					break;
				case Enums.FolderTypes.Sent:
					this.sentFolder(oFolder);
					break;
				case Enums.FolderTypes.Drafts:
					this.draftsFolder(oFolder);
					break;
				case Enums.FolderTypes.Trash:
					this.trashFolder(oFolder);
					break;
				case Enums.FolderTypes.Spam:
					this.spamFolder(oFolder);
					break;
				case Enums.FolderTypes.Template:
					this.aTemplateFolders.push(oFolder.fullName());
					break;
			}

			this.oNamedCollection[oFolder.fullName()] = oFolder;
			this.aLinedCollection.push(oFolder);
			aParsedCollection.push(oFolder);
			
			if (oSubFolders === null && oFolder.type() === Enums.FolderTypes.Inbox)
			{
				this.createStarredFolder(oFolder.fullName(), iLevel);
				if (this.oStarredFolder)
				{
					aParsedCollection.push(this.oStarredFolder);
				}
			}
			else if (oSubFolders !== null)
			{
				if(oFolder.bNamespace && oFolder.type() === Enums.FolderTypes.Inbox)
				{
					aSubfolders = this.parseRecursively(oSubFolders['@Collection'], oNamedFolderListOld, iLevel - 1, oFolder.fullName());
				}
				else
				{
					aSubfolders = this.parseRecursively(oSubFolders['@Collection'], oNamedFolderListOld, iLevel, oFolder.fullName());
				}
				if(oFolder.type() === Enums.FolderTypes.Inbox)
				{
					this.createStarredFolder(oFolder.fullName(), iLevel);
					if (oFolder.bNamespace)
					{
						if (this.oStarredFolder)
						{
							aSubfolders.unshift(this.oStarredFolder);
						}
					}
					else
					{
						if (this.oStarredFolder)
						{
							aParsedCollection.push(this.oStarredFolder);
						}
					}
				}
				oFolder.subfolders(aSubfolders);
			}
		}

		if (this.bExpandFolders)
		{
			Storage.setData('folderAccordion', this.expandNames());
		}
	}

	return aParsedCollection;
};

/**
 * @param {string} sFullName
 * @param {number} iLevel
 */
CFolderListModel.prototype.createStarredFolder = function (sFullName, iLevel)
{
	this.oStarredFolder = new CFolderModel(this.iAccountId);
	this.oStarredFolder.initStarredFolder(iLevel, sFullName);
};

CFolderListModel.prototype.repopulateLinedCollection = function ()
{
	var self = this;
	
	function fPopuplateLinedCollection(aFolders)
	{
		_.each(aFolders, function (oFolder) {
			self.aLinedCollection.push(oFolder);
			if (oFolder.subfolders().length > 0)
			{
				fPopuplateLinedCollection(oFolder.subfolders());
			}
		});
	}
	
	this.aLinedCollection = [];
	
	fPopuplateLinedCollection(this.collection());
	
	return this.aLinedCollection;
};

/**
 * @param {string} sFirstItem
 * @param {boolean=} bEnableSystem = false
 * @param {boolean=} bHideInbox = false
 * @param {boolean=} bIgnoreCanBeSelected = false
 * @param {boolean=} bIgnoreUnsubscribed = false
 * @returns {Array}
 */
CFolderListModel.prototype.getOptions = function (sFirstItem, bEnableSystem, bHideInbox, bIgnoreCanBeSelected, bIgnoreUnsubscribed)
{
	bEnableSystem = !!bEnableSystem;
	bHideInbox = !!bHideInbox;
	bIgnoreCanBeSelected = !!bIgnoreCanBeSelected;
	bIgnoreUnsubscribed = !!bIgnoreUnsubscribed;
	
	var
		sDeepPrefix = '\u00A0\u00A0\u00A0\u00A0',
		aCollection = []
	;
	
	_.each(this.aLinedCollection, function (oFolder) {
		if (oFolder && !oFolder.bVirtual && (!bHideInbox || Enums.FolderTypes.Inbox !== oFolder.type()) && (!bIgnoreUnsubscribed || oFolder.subscribed()))
		{
			var sPrefix = (new Array(oFolder.getDisplayedLevel() + 1)).join(sDeepPrefix);
			aCollection.push({
				'name': oFolder.name(),
				'fullName': oFolder.fullName(),
				'displayName': sPrefix + oFolder.name(),
				'translatedDisplayName': sPrefix + oFolder.displayName(),
				'disable': !bEnableSystem && oFolder.isSystem() || !bIgnoreCanBeSelected && !oFolder.canBeSelected()
			});
		}
	});
	
	if (sFirstItem !== '')
	{
		aCollection.unshift({
			'name': sFirstItem,
			'fullName': '',
			'displayName': sFirstItem,
			'translatedDisplayName': sFirstItem,
			'disable': false
		});
	}

	return aCollection;
};

module.exports = CFolderListModel;


/***/ }),

/***/ "5hOJ":
/*!*******************************************************!*\
  !*** ./modules/CoreWebclient/js/models/CDateModel.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	moment = __webpack_require__(/*! moment */ "wd/R"),
			
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
	
	UserSettings = __webpack_require__(/*! modules/CoreWebclient/js/Settings.js */ "hPb3")
;

/**
 * @constructor
 */
function CDateModel()
{
	this.iTimeStampInUTC = 0;
	this.oMoment = null;
}

/**
 * @param {number} iTimeStampInUTC
 */
CDateModel.prototype.parse = function (iTimeStampInUTC)
{
	this.iTimeStampInUTC = iTimeStampInUTC;
	this.oMoment = moment.unix(this.iTimeStampInUTC);
};

/**
 * @param {number} iYear
 * @param {number} iMonth
 * @param {number} iDay
 */
CDateModel.prototype.setDate = function (iYear, iMonth, iDay)
{
	this.oMoment = moment([iYear, iMonth, iDay]);
};

/**
 * @return {string}
 */
CDateModel.prototype.getTimeFormat = function ()
{
	return (UserSettings.timeFormat() === window.Enums.TimeFormat.F24) ? 'HH:mm' : 'hh:mm A';
};

/**
 * @return {string}
 */
CDateModel.prototype.getFullDate = function ()
{
	return this.getDate() + ' ' + this.getTime();	
};

/**
 * @return {string}
 */
CDateModel.prototype.getMidDate = function ()
{
	return this.getShortDate(true);
};

/**
 * @param {boolean=} bTime = false
 * 
 * @return {string}
 */
CDateModel.prototype.getShortDate = function (bTime)
{
	var
		sResult = '',
		oMomentNow = null
	;

	if (this.oMoment)
	{
		oMomentNow = moment();

		if (oMomentNow.format('L') === this.oMoment.format('L'))
		{
			sResult = this.oMoment.format(this.getTimeFormat());
		}
		else
		{
			if (oMomentNow.clone().subtract(1, 'days').format('L') === this.oMoment.format('L'))
			{
				sResult = TextUtils.i18n('COREWEBCLIENT/LABEL_YESTERDAY');
			}
			else
			{
				if (UserSettings.UserSelectsDateFormat)
				{
					sResult = this.oMoment.format(Utils.getDateFormatForMoment(UserSettings.dateFormat()));
				}
				else
				{
					if (oMomentNow.year() === this.oMoment.year())
					{
						sResult = this.oMoment.format('MMM D');
					}
					else
					{
						sResult = this.oMoment.format('MMM D, YYYY');
					}
				}
			}

			if (!!bTime)
			{
				sResult += ', ' + this.oMoment.format(this.getTimeFormat());
			}
		}
	}

	return sResult;
};

/**
 * @return {string}
 */
CDateModel.prototype.getDate = function ()
{
	var sFormat = 'ddd, MMM D, YYYY';
	
	if (UserSettings.UserSelectsDateFormat)
	{
		sFormat = 'ddd, ' + Utils.getDateFormatForMoment(UserSettings.dateFormat());
	}
	
	return (this.oMoment) ? this.oMoment.format(sFormat) : '';
};

/**
 * @return {string}
 */
CDateModel.prototype.getTime = function ()
{
	return (this.oMoment) ? this.oMoment.format(this.getTimeFormat()): '';
};

/**
 * @return {number}
 */
CDateModel.prototype.getTimeStampInUTC = function ()
{
	return this.iTimeStampInUTC;
};

module.exports = CDateModel;


/***/ }),

/***/ "Aai/":
/*!***********************************************************************!*\
  !*** ./modules/ImportExportMailPlugin/js/popups/ImportExportPopup.js ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),

	Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),

	Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ "o0Bx"),
	CJua = __webpack_require__(/*! modules/CoreWebclient/js/CJua.js */ "mjrp"),
	Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ "SQrT"),
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ "JFZZ"),

	CAbstractPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/CAbstractPopup.js */ "czxF"),
	MailCache = __webpack_require__(/*! modules/MailWebclient/js/Cache.js */ "4+IO"),
	Settings = __webpack_require__(/*! modules/ImportExportMailPlugin/js/Settings.js */ "RGpW")
;

/**
 * @constructor
 */
function ImportExportPopup()
{
	CAbstractPopup.call(this);

	this.zipFile = ko.observable(null);
	this.status = ko.observable('');
	this.iAutoReloadTimer = -1;
	this.opened = ko.observable(false);
	this.options = ko.observableArray([]);
	this.selectedFolder = ko.observable('');
	this.uploaderButton = ko.observable(null);
	// file uploader
	this.oJua = null;

	this.defaultOptionsAfterRender = Utils.defaultOptionsAfterRender;
	this.exportButtonText = ko.observable(TextUtils.i18n('IMPORTEXPORTMAILPLUGIN/POPUP_ACTION_EXPORT'));
	this.importButtonText = ko.observable(TextUtils.i18n('IMPORTEXPORTMAILPLUGIN/POPUP_ACTION_IMPORT'));
	this.processing = ko.computed(function() {
		return (this.status() !== 'ready' && this.status() !== 'error' && this.status() !== '');
	}, this);
	this.status.subscribe(function(bValue) {
		if (bValue === 'ready')
		{
			if (!this.opened())
			{
				this.openPopup({});
			}
			this.exportButtonText(TextUtils.i18n('IMPORTEXPORTMAILPLUGIN/POPUP_ACTION_DOWNLOAD_ZIP'));
			clearTimeout(this.iAutoReloadTimer);
		}
		else if (bValue === 'error')
		{
			Screens.showError(TextUtils.i18n('IMPORTEXPORTMAILPLUGIN/POPUP_ERROR_GENERATE_ZIP'));
			this.exportButtonText(TextUtils.i18n('IMPORTEXPORTMAILPLUGIN/POPUP_ACTION_EXPORT'));
			clearTimeout(this.iAutoReloadTimer);
		}
	}, this);
}

_.extendOwn(ImportExportPopup.prototype, CAbstractPopup.prototype);

ImportExportPopup.prototype.PopupTemplate = 'ImportExportMailPlugin_ImportExportPopup';

ImportExportPopup.prototype.onOpen = function ()
{
	var oFolderList = MailCache.oFolderListItems[MailCache.editedAccountId()];
	this.options(oFolderList ? oFolderList.getOptions('', true, false, false) : []);
};

ImportExportPopup.prototype.onShow = function ()
{
	this.opened(true);
	this.initUploader();
};

ImportExportPopup.prototype.onCancelClick = function ()
{
	this.opened(false);
	this.closeCommand();
};

ImportExportPopup.prototype.exportMail = function ()
{
	if (this.status() === '')
	{
		this.status('prepare');
		Ajax.send(
			Settings.ModuleName,
			'ExportMailPrepare',
			{},
			this.onExportMailResponse,
			this
		);
		this.setAutoReloadTimer();
	}
	else if (this.status() === 'ready')
	{
		this.Download();
	}
};

ImportExportPopup.prototype.setAutoReloadTimer = function ()
{
	var self = this;
	clearTimeout(this.iAutoReloadTimer);

	this.iAutoReloadTimer = setTimeout(function () {
		self.Status();
	}, 10 * 1000);
};

ImportExportPopup.prototype.Status = function ()
{
	this.setAutoReloadTimer();
	if (this.status() !== '')
	{
		Ajax.send(
			Settings.ModuleName,
			'ExportMailStatus',
			{
				'Zip': this.zipFile()
			},
			this.onStatusResponse,
			this
		);
	}
};

ImportExportPopup.prototype.onExportMailResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	if (oResult && this.status() === 'prepare' && oResult.Zip)
	{
		this.zipFile(oResult.Zip);
		this.exportButtonText(TextUtils.i18n('IMPORTEXPORTMAILPLUGIN/POPUP_GENERATING_ZIP'));
		Ajax.send(
			Settings.ModuleName,
			'ExportMailGenerate',
			{
				'AccountId': MailCache.editedAccountId(),
				'Folder': this.selectedFolder(),
				'Zip': this.zipFile()
			}
		);
	}
};

ImportExportPopup.prototype.onStatusResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	if (oResult && oResult.Status)
	{
		this.status(oResult.Status);
	}
};

ImportExportPopup.prototype.Download = function ()
{
	if (this.status() === 'ready')
	{
		this.status('');
		this.exportButtonText(TextUtils.i18n('IMPORTEXPORTMAILPLUGIN/POPUP_ACTION_EXPORT'));
		window.location.href = '?transfer-mail/export/' + this.zipFile();
	}
};

ImportExportPopup.prototype.initUploader = function ()
{
	var self = this;

	if (this.uploaderButton())
	{
		this.oJua = new CJua({
			'action': '?/Api/',
			'name': 'jua-uploader',
			'queueSize': 2,
			'clickElement': this.uploaderButton(),
			'disableAjaxUpload': false,
			'disableFolderDragAndDrop': true,
			'disableDragAndDrop': true,
			'hidden': _.extendOwn({
				'Module': Settings.ModuleName,
				'Method': 'ImportMail',
				'Parameters':  function () {
					return JSON.stringify({
						'AccountId': MailCache.editedAccountId(),
						'Folder': self.selectedFolder()
					});
				}
			}, App.getCommonRequestParameters())
		});

		this.oJua.bEnableButton = true;
		this.oJua
			.on('onSelect', _.bind(this.onFileUploadSelect, this))
			.on('onStart', _.bind(this.onFileUploadStart, this))
			.on('onComplete', _.bind(this.onFileUploadComplete, this))
		;
	}
};

ImportExportPopup.prototype.onFileUploadSelect = function (sFileUid, oFileData)
{
	if (Settings.UploadSizeLimitMb > 0 && oFileData.Size/(1024*1024) > Settings.UploadSizeLimitMb)
	{
		Screens.showError(TextUtils.i18n('IMPORTEXPORTMAILPLUGIN/ERROR_SIZE_LIMIT', {'SIZE': Settings.UploadSizeLimitMb}));
		return false;
	}
};

ImportExportPopup.prototype.onFileUploadStart = function ()
{
	this.status('upload');
	this.importButtonText(TextUtils.i18n('IMPORTEXPORTMAILPLUGIN/POPUP_IMPORTING_ZIP'));
};

ImportExportPopup.prototype.onFileUploadComplete = function (sFileUid, bResponseReceived, oResponse)
{
	var bError = !bResponseReceived || !oResponse || !oResponse.Result || false;

	this.status('');
	this.importButtonText(TextUtils.i18n('IMPORTEXPORTMAILPLUGIN/POPUP_ACTION_IMPORT'));
	if (!bError)
	{
		Screens.showReport(TextUtils.i18n('IMPORTEXPORTMAILPLUGIN/INFO_UPLOAD_COMPLETED'));
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('IMPORTEXPORTMAILPLUGIN/UNKNOWN_ERROR'));
	}
};

module.exports = new ImportExportPopup();


/***/ }),

/***/ "Aqrs":
/*!*********************************************************!*\
  !*** ./modules/MailWebclient/js/models/CFilterModel.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV")
;

/**
 * @param {number} iAccountID
 * @constructor
 */
function CFilterModel(iAccountID)
{
	this.iAccountId = iAccountID;
	
	this.enable = ko.observable(true).extend({'reversible': true});
	
	this.field = ko.observable('').extend({'reversible': true}); //map to Field
	this.condition = ko.observable('').extend({'reversible': true});
	this.filter = ko.observable('').extend({'reversible': true});
	this.action = ko.observable('').extend({'reversible': true});
	this.folder = ko.observable('').extend({'reversible': true});
	this.email = ko.observable('').extend({'reversible': true});
}

/**
 * @param {Object} oData
 */
CFilterModel.prototype.parse = function (oData)
{
	this.enable(!!oData.Enable);

	this.field(Types.pInt(oData.Field));
	this.condition(Types.pInt(oData.Condition));
	this.filter(Types.pString(oData.Filter));
	this.action(Types.pInt(oData.Action));
	this.folder(Types.pString(oData.FolderFullName));
	this.email(Types.pString(oData.Email));
	this.commit();
};

CFilterModel.prototype.revert = function ()
{
	this.enable.revert();
	this.field.revert();
	this.condition.revert();
	this.filter.revert();
	this.action.revert();
	this.folder.revert();
	this.email.revert();
};

CFilterModel.prototype.commit = function ()
{
	this.enable.commit();
	this.field.commit();
	this.condition.commit();
	this.filter.commit();
	this.action.commit();
	this.folder.commit();
	this.email.commit();
};

CFilterModel.prototype.toString = function ()
{
	var aState = [
		this.enable(),
		this.field(),
		this.condition(),
		this.filter(),
		this.action(),
		this.folder(),
		this.email()
	];
	
	return aState.join(':');	
};

module.exports = CFilterModel;


/***/ }),

/***/ "Cq+9":
/*!***************************************************!*\
  !*** ./modules/MailWebclient/js/utils/Sending.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {

var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ "JFZZ"),
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	Routing = __webpack_require__(/*! modules/CoreWebclient/js/Routing.js */ "QaF5"),
	Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ "SQrT"),
	
	CAddressModel = __webpack_require__(/*! modules/CoreWebclient/js/models/CAddressModel.js */ "cyfa"),
	CAddressListModel = __webpack_require__(/*! modules/CoreWebclient/js/models/CAddressListModel.js */ "KARm"),
	
	MessageUtils = __webpack_require__(/*! modules/MailWebclient/js/utils/Message.js */ "zu1m"),
	
	AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm"),
	Ajax = __webpack_require__(/*! modules/MailWebclient/js/Ajax.js */ "UN2P"),
	MailCache = __webpack_require__(/*! modules/MailWebclient/js/Cache.js */ "4+IO"),
	Settings = __webpack_require__(/*! modules/MailWebclient/js/Settings.js */ "p2hp"),
	
	MainTab = App.isNewTab() && window.opener && window.opener.MainTabMailMethods,
	
	SendingUtils = {
		sReplyText: '',
		sReplyDraftUid: '',
		oPostponedMailData: null
	}
;

/**
 * @param {string} sText
 * @param {string} sDraftUid
 */
SendingUtils.setReplyData = function (sText, sDraftUid)
{
	this.sReplyText = sText;
	this.sReplyDraftUid = sDraftUid;
};

/**
 * @param {string} sMethod
 * @param {Object} oParameters
 * @param {boolean} bShowLoading
 * @param {Function} fSendMessageResponseHandler
 * @param {Object} oSendMessageResponseContext
 * @param {boolean=} bPostponedSending = false
 * @param {boolean=} bAddToSentFolder = true
 */
SendingUtils.send = function (sMethod, oParameters, bShowLoading, fSendMessageResponseHandler, oSendMessageResponseContext, bPostponedSending, bAddToSentFolder)
{
	bAddToSentFolder = (typeof bAddToSentFolder === 'boolean') ? bAddToSentFolder : true;

	var
		iAccountID = oParameters.AccountID,
		oAccount = AccountList.getAccount(iAccountID),
		oFolderList = MailCache.oFolderListItems[iAccountID],
		sLoadingMessage = '',
		sSentFolder = oFolderList ? oFolderList.sentFolderFullName() : '',
		sDraftFolder = oFolderList ? oFolderList.draftsFolderFullName() : '',
		sCurrEmail = oAccount ? oAccount.email() : '',
		bSelfRecipient = (oParameters.To.indexOf(sCurrEmail) > -1 || oParameters.Cc.indexOf(sCurrEmail) > -1 || 
			oParameters.Bcc.indexOf(sCurrEmail) > -1)
	;
	
	if (oAccount.bSaveRepliesToCurrFolder && !bSelfRecipient && Types.isNonEmptyArray(oParameters.DraftInfo, 3))
	{
		sSentFolder = oParameters.DraftInfo[2];
	}
	
	oParameters.Method = sMethod;
	oParameters.ShowReport = bShowLoading;
	
	switch (sMethod)
	{
		case 'SendMessage':
			sLoadingMessage = TextUtils.i18n('COREWEBCLIENT/INFO_SENDING');
			if (bAddToSentFolder)
			{
				if (!Types.isNonEmptyString(oParameters.SentFolder))
				{
					oParameters.SentFolder = sSentFolder;
				}
				if (oParameters.DraftUid !== '')
				{
					oParameters.DraftFolder = sDraftFolder;
					if (MainTab)
					{
						MainTab.removeOneMessageFromCacheForFolder(oParameters.AccountID, oParameters.DraftFolder, oParameters.DraftUid);
						MainTab.replaceHashWithoutMessageUid(oParameters.DraftUid);
					}
					else
					{
						MailCache.removeOneMessageFromCacheForFolder(oParameters.AccountID, oParameters.DraftFolder, oParameters.DraftUid);
						Routing.replaceHashWithoutMessageUid(oParameters.DraftUid);
					}
				}
			}
			else
			{
				delete oParameters.SentFolder;
				delete oParameters.DraftUid;
				delete oParameters.DraftFolder;
			}
			break;
		case 'SaveMessage':
			sLoadingMessage = TextUtils.i18n('MAILWEBCLIENT/INFO_SAVING');
			if (typeof oParameters.DraftFolder === 'undefined')
			{
				oParameters.DraftFolder = sDraftFolder;
			}
			
			// Message with this uid will not be selected from message list
			MailCache.savingDraftUid(oParameters.DraftUid);
			if (MainTab)
			{
				MainTab.startMessagesLoadingWhenDraftSaving(oParameters.AccountID, oParameters.DraftFolder);
				MainTab.replaceHashWithoutMessageUid(oParameters.DraftUid);
			}
			else
			{
				MailCache.startMessagesLoadingWhenDraftSaving(oParameters.AccountID, oParameters.DraftFolder);
				Routing.replaceHashWithoutMessageUid(oParameters.DraftUid);
			}
			break;
	}
	
	if (bShowLoading)
	{
		Screens.showLoading(sLoadingMessage);
	}
	
	if (bPostponedSending)
	{
		this.postponedMailData = {
			'Parameters': oParameters,
			'SendMessageResponseHandler': fSendMessageResponseHandler,
			'SendMessageResponseContext': oSendMessageResponseContext
		};
	}
	else
	{
		Ajax.send(sMethod, oParameters, fSendMessageResponseHandler, oSendMessageResponseContext);
	}
};

/**
 * @param {string} sDraftUid
 */
SendingUtils.sendPostponedMail = function (sDraftUid)
{
	var
		oData = this.postponedMailData,
		oParameters = oData.Parameters,
		iAccountID = oParameters.AccountID,
		oFolderList = MailCache.oFolderListItems[iAccountID],
		sDraftFolder = oFolderList ? oFolderList.draftsFolderFullName() : ''
	;
	
	if (sDraftUid !== '')
	{
		oParameters.DraftUid = sDraftUid;
		oParameters.DraftFolder = sDraftFolder;
		if (MainTab)
		{
			MainTab.removeOneMessageFromCacheForFolder(oParameters.AccountID, oParameters.DraftFolder, oParameters.DraftUid);
			MainTab.replaceHashWithoutMessageUid(oParameters.DraftUid);
		}
		else
		{
			MailCache.removeOneMessageFromCacheForFolder(oParameters.AccountID, oParameters.DraftFolder, oParameters.DraftUid);
			Routing.replaceHashWithoutMessageUid(oParameters.DraftUid);
		}
	}
	
	if (this.postponedMailData)
	{
		Ajax.send(oParameters.Method, oParameters, oData.SendMessageResponseHandler, oData.SendMessageResponseContext);
		this.postponedMailData = null;
	}
};

/**
 * @param {string} sMethod
 * @param {string} sText
 * @param {string} sDraftUid
 * @param {Function} fSendMessageResponseHandler
 * @param {Object} oSendMessageResponseContext
 * @param {boolean} bRequiresPostponedSending
 */
SendingUtils.sendReplyMessage = function (sMethod, sText, sDraftUid, fSendMessageResponseHandler, 
														oSendMessageResponseContext, bRequiresPostponedSending)
{
	var
		oParameters = null,
		oMessage = MailCache.currentMessage(),
		aRecipients = [],
		oFetcherOrIdentity = null
	;

	if (oMessage)
	{
		aRecipients = oMessage.oTo.aCollection.concat(oMessage.oCc.aCollection);
		oFetcherOrIdentity = this.getFirstFetcherOrIdentityByRecipientsOrDefault(aRecipients, oMessage.accountId());

		oParameters = this.getReplyDataFromMessage(oMessage, Enums.ReplyType.ReplyAll, oMessage.accountId(), oFetcherOrIdentity, false, sText, sDraftUid);

		oParameters.AccountID = oMessage.accountId();

		if (oFetcherOrIdentity)
		{
			oParameters.IdentityID = oFetcherOrIdentity && oFetcherOrIdentity.IDENTITY ? oFetcherOrIdentity.id() : '';
			oParameters.AliasID = oFetcherOrIdentity && oFetcherOrIdentity.ALIAS ? oFetcherOrIdentity.id() : '';
			oParameters.FetcherID = oFetcherOrIdentity && oFetcherOrIdentity.FETCHER ? oFetcherOrIdentity.id() : '';
		}

		oParameters.Bcc = '';
		oParameters.Importance = Enums.Importance.Normal;
		oParameters.SendReadingConfirmation = false;
		oParameters.IsQuickReply = true;
		oParameters.IsHtml = true;

		oParameters.Attachments = this.convertAttachmentsForSending(oParameters.Attachments);

		this.send(sMethod, oParameters, false, fSendMessageResponseHandler, oSendMessageResponseContext, bRequiresPostponedSending);
	}
};

/**
 * @param {Array} aAttachments
 * 
 * @return {Object}
 */
SendingUtils.convertAttachmentsForSending = function (aAttachments)
{
	var oAttachments = {};
	
	_.each(aAttachments, function (oAttach) {
		oAttachments[oAttach.tempName()] = [
			oAttach.fileName(),
			oAttach.linked() ? oAttach.cid() : '',
			oAttach.inline() ? '1' : '0',
			oAttach.linked() ? '1' : '0',
			oAttach.contentLocation()
		];
	});
	
	return oAttachments;
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 * @param {boolean} bRequiresPostponedSending
 * 
 * @return {Object}
 */
SendingUtils.onSendOrSaveMessageResponse = function (oResponse, oRequest, bRequiresPostponedSending)
{
	var
		oParameters = oRequest.Parameters,
		bResult = !!oResponse.Result,
		sFullName, sUid, sReplyType
	;

	if (!bRequiresPostponedSending)
	{
		Screens.hideLoading();
	}
	
	switch (oRequest.Method)
	{
		case 'SaveMessage':
			// All messages can not be selected from message list if message saving is done
			MailCache.savingDraftUid('');
			if (!bResult)
			{
				if (oParameters.ShowReport)
				{
					if (-1 !== $.inArray(oRequest.Parameters.DraftFolder, MailCache.getCurrentTemplateFolders()))
					{
						Api.showErrorByCode(oResponse, TextUtils.i18n('MAILWEBCLIENT/ERROR_TEMPLATE_SAVING'));
					}
					else
					{
						Api.showErrorByCode(oResponse, TextUtils.i18n('MAILWEBCLIENT/ERROR_MESSAGE_SAVING'));
					}
				}
			}
			else
			{
				if (oParameters.ShowReport && !bRequiresPostponedSending)
				{
					if (-1 !== $.inArray(oRequest.Parameters.DraftFolder, MailCache.getCurrentTemplateFolders()))
					{
						Screens.showReport(TextUtils.i18n('MAILWEBCLIENT/REPORT_TEMPLATE_SAVED'));
					}
					else
					{
						Screens.showReport(TextUtils.i18n('MAILWEBCLIENT/REPORT_MESSAGE_SAVED'));
					}
				}

				if (!oResponse.Result.NewUid)
				{
					Settings.AllowAutosaveInDrafts = false;
				}
			}
			break;
		case 'SendMessage':
			if (!bResult)
			{
				Api.showErrorByCode(oResponse, TextUtils.i18n('MAILWEBCLIENT/ERROR_MESSAGE_SENDING'));
			}
			else
			{
				if (oParameters.IsQuickReply)
				{
					Screens.showReport(TextUtils.i18n('MAILWEBCLIENT/REPORT_MESSAGE_SENT'));
				}
				else
				{
					if (MainTab)
					{
						MainTab.showReport(TextUtils.i18n('MAILWEBCLIENT/REPORT_MESSAGE_SENT'));
					}
					else
					{
						Screens.showReport(TextUtils.i18n('MAILWEBCLIENT/REPORT_MESSAGE_SENT'));
					}
				}

				if (_.isArray(oParameters.DraftInfo) && oParameters.DraftInfo.length === 3)
				{
					sReplyType = oParameters.DraftInfo[0];
					sUid = oParameters.DraftInfo[1];
					sFullName = oParameters.DraftInfo[2];
					MailCache.markMessageReplied(oParameters.AccountID, sFullName, sUid, sReplyType);
				}
			}
			
			if (oParameters.SentFolder)
			{
				if (MainTab)
				{
					MainTab.removeMessagesFromCacheForFolder(oParameters.AccountID, oParameters.SentFolder);
				}
				else
				{
					MailCache.removeMessagesFromCacheForFolder(oParameters.AccountID, oParameters.SentFolder);
				}
			}
			
			break;
	}

	if (oParameters.DraftFolder && !bRequiresPostponedSending)
	{
		if (MainTab)
		{
			MainTab.removeMessagesFromCacheForFolder(oParameters.AccountID, oParameters.DraftFolder);
		}
		else
		{
			MailCache.removeMessagesFromCacheForFolder(oParameters.AccountID, oParameters.DraftFolder);
		}
	}
	
	return {Method: oRequest.Method, Result: bResult, NewUid: oResponse.Result ? oResponse.Result.NewUid : ''};
};

SendingUtils.getReplytoAddresses = function (oMessage)
{
	var oReplytoAddresses = oMessage.oReplyTo;
	if (oReplytoAddresses.getFull() === '' || oMessage.oFrom.getFirstEmail() === oReplytoAddresses.getFirstEmail() && oReplytoAddresses.getFirstName() === '')
	{
		oReplytoAddresses = oMessage.oFrom;
	}
	return oReplytoAddresses;
};

/**
 * @param {Object} oMessage
 * @param {string} sReplyType
 * @param {number} iAccountId
 * @param {Object} oFetcherOrIdentity
 * @param {boolean} bPasteSignatureAnchor
 * @param {string} sText
 * @param {string} sDraftUid
 * 
 * @return {Object}
 */
SendingUtils.getReplyDataFromMessage = function (oMessage, sReplyType, iAccountId,
													oFetcherOrIdentity, bPasteSignatureAnchor, sText, sDraftUid)
{
	var
		oReplyData = {
			DraftInfo: [],
			DraftUid: '',
			To: '',
			Cc: '',
			Bcc: '',
			Subject: '',
			Attachments: [],
			InReplyTo: oMessage.messageId(),
			References: this.getReplyReferences(oMessage)
		},
		aAttachmentsLink = [],
		oReplytoAddresses = this.getReplytoAddresses(oMessage),
		sToAddr = oReplytoAddresses.getFull()
	;
	
	if (!sText || sText === '')
	{
		sText = this.sReplyText;
		this.sReplyText = '';
	}
	
	if (sReplyType === 'forward')
	{
		oReplyData.Text = sText + this.getForwardMessageBody(oMessage, iAccountId, oFetcherOrIdentity);
	}
	else if (sReplyType === 'resend')
	{
		oReplyData.Text = oMessage.getConvertedHtml();
		oReplyData.Cc = oMessage.cc();
		oReplyData.Bcc = oMessage.bcc();
	}
	else
	{
		oReplyData.Text = sText + GetReplyMessageBody.call(this, oMessage, iAccountId, oFetcherOrIdentity, bPasteSignatureAnchor);
	}
	
	if (sDraftUid)
	{
		oReplyData.DraftUid = sDraftUid;
	}
	else
	{
		oReplyData.DraftUid = this.sReplyDraftUid;
		this.sReplyDraftUid = '';
	}

	switch (sReplyType)
	{
		case Enums.ReplyType.Reply:
			oReplyData.DraftInfo = [Enums.ReplyType.Reply, oMessage.uid(), oMessage.folder()];
			oReplyData.To = sToAddr;
			oReplyData.Subject = this.getReplySubject(oMessage.subject(), true);
			aAttachmentsLink = _.filter(oMessage.attachments(), function (oAttach) {
				return oAttach.linked();
			});
			break;
		case Enums.ReplyType.ReplyAll:
			oReplyData.DraftInfo = [Enums.ReplyType.ReplyAll, oMessage.uid(), oMessage.folder()];
			oReplyData.To = sToAddr;
			oReplyData.Cc = this.getReplyAllCcAddr(oMessage, iAccountId, oFetcherOrIdentity);
			oReplyData.Subject = this.getReplySubject(oMessage.subject(), true);
			aAttachmentsLink = _.filter(oMessage.attachments(), function (oAttach) {
				return oAttach.linked();
			});
			break;
		case Enums.ReplyType.Resend:
			oReplyData.DraftInfo = [Enums.ReplyType.Resend, oMessage.uid(), oMessage.folder(), oMessage.cc(), oMessage.bcc()];
			oReplyData.To = oMessage.oTo.getFull();
			oReplyData.Subject = oMessage.subject();
			aAttachmentsLink = oMessage.attachments();
			break;
		case Enums.ReplyType.ForwardAsAttach:
		case Enums.ReplyType.Forward:
			oReplyData.DraftInfo = [Enums.ReplyType.Forward, oMessage.uid(), oMessage.folder()];
			oReplyData.Subject = this.getReplySubject(oMessage.subject(), false);
			aAttachmentsLink = oMessage.attachments();
			break;
	}
	
	_.each(aAttachmentsLink, function (oAttachLink) {
		if (oAttachLink.getCopy)
		{
			var oCopy = oAttachLink.getCopy();
			oReplyData.Attachments.push(oCopy);
		}
	});

	return oReplyData;
};

/**
 * Prepares and returns references for reply message.
 *
 * @param {Object} oMessage
 * 
 * @return {string}
 */
SendingUtils.getReplyReferences = function (oMessage)
{
	var
		sRef = oMessage.references(),
		sInR = oMessage.messageId(),
		sPos = sRef.indexOf(sInR)
	;

	if (sPos === -1)
	{
		sRef += ' ' + sInR;
	}

	return sRef;
};

/**
 * @param {Object} oMessage
 * @param {number} iAccountId
 * @param {Object} oFetcherOrIdentity
 * @param {boolean} bPasteSignatureAnchor
 * 
 * @return {string}
 */
function GetReplyMessageBody(oMessage, iAccountId, oFetcherOrIdentity, bPasteSignatureAnchor)
{
	var
		sReplyTitle = TextUtils.i18n('MAILWEBCLIENT/TEXT_REPLY_MESSAGE', {
			'DATE': oMessage.oDateModel.getDate(),
			'TIME': oMessage.oDateModel.getTime(),
			'SENDER': TextUtils.encodeHtml(oMessage.oFrom.getFull())
		}),
		sReplyBody = '<br /><br />' + this.getSignatureText(iAccountId, oFetcherOrIdentity, bPasteSignatureAnchor) + '<br /><br />' +
			'<div data-anchor="reply-title">' + sReplyTitle + '</div><blockquote>' + oMessage.getConvertedHtml() + '</blockquote>'
	;

	return sReplyBody;
}

/**
 * @param {number} iAccountId
 * @param {Object} oFetcherOrIdentity
 * 
 * @return {string}
 */
SendingUtils.getClearSignature = function (iAccountId, oFetcherOrIdentity)
{
	var
		oAccount = AccountList.getAccount(iAccountId),
		sSignature = ''
	;

	if (oFetcherOrIdentity && oFetcherOrIdentity.accountId() === iAccountId && oFetcherOrIdentity.useSignature())
	{
		sSignature = oFetcherOrIdentity.signature();
	}
	else if (oAccount && oAccount.useSignature())
	{
		sSignature = oAccount.signature();
	}

	return sSignature;
};

/**
 * @param {number} iAccountId
 * @param {Object} oFetcherOrIdentity
 * @param {boolean} bPasteSignatureAnchor
 * 
 * @return {string}
 */
SendingUtils.getSignatureText = function (iAccountId, oFetcherOrIdentity, bPasteSignatureAnchor)
{
	var sSignature = this.getClearSignature(iAccountId, oFetcherOrIdentity);

	if (bPasteSignatureAnchor)
	{
		return '<div data-anchor="signature">' + sSignature + '</div>';
	}

	return '<div>' + sSignature + '</div>';
};

/**
 * @param {Array} aRecipients
 * @param {number} iAccountId
 * 
 * @return Object
 */
SendingUtils.getFirstFetcherOrIdentityByRecipientsOrDefault = function (aRecipients, iAccountId)
{
	var
		oAccount = AccountList.getAccount(iAccountId),
		aList = this.getAccountFetchersIdentitiesList(oAccount),
		aEqualEmailList = [],
		oFoundFetcherOrIdentity = null
	;

	_.each(aRecipients, function (oAddr) {
		if (!oFoundFetcherOrIdentity)
		{
			aEqualEmailList = _.filter(aList, function (oItem) {
				return oAddr.sEmail === oItem.email;
			});
			
			switch (aEqualEmailList.length)
			{
				case 0:
					break;
				case 1:
					oFoundFetcherOrIdentity = aEqualEmailList[0];
					break;
				default:
					oFoundFetcherOrIdentity = _.find(aEqualEmailList, function (oItem) {
						return oAddr.sEmail === oItem.email && oAddr.sName === oItem.name;
					});
					
					if (!oFoundFetcherOrIdentity)
					{
						oFoundFetcherOrIdentity = _.find(aEqualEmailList, function (oItem) {
							return oItem.isDefault;
						});
						if (!oFoundFetcherOrIdentity)
						{
							oFoundFetcherOrIdentity = aEqualEmailList[0];
						}
					}
					break;
			}
		}
	});
	
	if (!oFoundFetcherOrIdentity)
	{
		oFoundFetcherOrIdentity = _.find(aList, function (oItem) {
			return oItem.isDefault;
		});
	}
	
	return oFoundFetcherOrIdentity && oFoundFetcherOrIdentity.result;
};

/**
 * @param {Object} oAccount
 * @returns {Array}
 */
SendingUtils.getAccountFetchersIdentitiesList = function (oAccount)
{
	var aList = [];
	
	if (oAccount)
	{
		_.each(oAccount.fetchers(), function (oFetcher) {
			aList.push({
				'email': oFetcher.email(),
				'name': oFetcher.userName(),
				'isDefault': false,
				'result': oFetcher
			});
		});
		
		_.each(oAccount.identities(), function (oIdnt) {
			aList.push({
				'email': oIdnt.email(),
				'name': oIdnt.friendlyName(),
				'isDefault': oIdnt.isDefault(),
				'result': oIdnt
			});
		});
		
		_.each(oAccount.aliases(), function (oAlias) {
			aList.push({
				'email': oAlias.email(),
				'name': oAlias.friendlyName(),
				'isDefault': false,
				'result': oAlias
			});
		});
	}

	return aList;
};

/**
 * @param {Object} oMessage
 * @param {number} iAccountId
 * @param {Object} oFetcherOrIdentity
 * 
 * @return {string}
 */
SendingUtils.getForwardMessageBody = function (oMessage, iAccountId, oFetcherOrIdentity)
{
	var
		sCcAddr = TextUtils.encodeHtml(oMessage.oCc.getFull()),
		sCcPart = (sCcAddr !== '') ? TextUtils.i18n('MAILWEBCLIENT/TEXT_FORWARD_MESSAGE_CCPART', {'CCADDR': sCcAddr}) : '',
		sForwardTitle = TextUtils.i18n('MAILWEBCLIENT/TEXT_FORWARD_MESSAGE', {
			'FROMADDR': TextUtils.encodeHtml(oMessage.oFrom.getFull()),
			'TOADDR': TextUtils.encodeHtml(oMessage.oTo.getFull()),
			'CCPART': sCcPart,
			'FULLDATE': oMessage.oDateModel.getFullDate(),
			'SUBJECT': TextUtils.encodeHtml(oMessage.subject())
		}),
		sForwardBody = '<br /><br />' + this.getSignatureText(iAccountId, oFetcherOrIdentity, true) + '<br /><br />' + 
			'<div data-anchor="reply-title">' + sForwardTitle + '</div><br /><br />' + oMessage.getConvertedHtml()
	;

	return sForwardBody;
};

SendingUtils.hasReplyAllCcAddrs = function (oMessage)
{
	var
		iAccountId = oMessage.accountId(),
		aRecipients = oMessage.oTo.aCollection.concat(oMessage.oCc.aCollection),
		oFetcherOrIdentity = this.getFirstFetcherOrIdentityByRecipientsOrDefault(aRecipients, oMessage.accountId()),
		sCcAddrs = this.getReplyAllCcAddr(oMessage, iAccountId, oFetcherOrIdentity)
	;
	return sCcAddrs !== '';
};

/**
 * Prepares and returns cc address for reply message.
 *
 * @param {Object} oMessage
 * @param {number} iAccountId
 * @param {Object} oFetcherOrIdentity
 * 
 * @return {string}
 */
SendingUtils.getReplyAllCcAddr = function (oMessage, iAccountId, oFetcherOrIdentity)
{
	var
		oAddressList = new CAddressListModel(),
		aAddrCollection = _.union(oMessage.oTo.aCollection, oMessage.oCc.aCollection, 
			oMessage.oBcc.aCollection),
		oCurrAccount = _.find(AccountList.collection(), function (oAccount) {
			return oAccount.id() === iAccountId;
		}, this),
		oCurrAccAddress = new CAddressModel(),
		oFetcherAddress = new CAddressModel(),
		oReplytoAddresses = this.getReplytoAddresses(oMessage)
	;
	
	oCurrAccAddress.sEmail = oCurrAccount.email();
	oFetcherAddress.sEmail = oFetcherOrIdentity ? oFetcherOrIdentity.email() : '';
	oAddressList.addCollection(aAddrCollection);
	oAddressList.excludeCollection(_.union(oReplytoAddresses.aCollection, [oCurrAccAddress, oFetcherAddress]));

	return oAddressList.getFull();
};

/**
 * Obtains a subject of the message, which is the answer (reply or forward):
 * - adds the prefix "Re" of "Fwd" if the language is English, otherwise - their translation
 * - joins "Re" and "Fwd" prefixes if it is allowed for application in settings
 * 
 * @param {string} sSubject Subject of the message, the answer to which is composed
 * @param {boolean} bReply If **true** the prefix will be "Re", otherwise - "Fwd"
 *
 * @return {string}
 */
SendingUtils.getReplySubject = function (sSubject, bReply)
{
	var
		sRePrefix = TextUtils.i18n('MAILWEBCLIENT/TEXT_REPLY_PREFIX'),
		sFwdPrefix = TextUtils.i18n('MAILWEBCLIENT/TEXT_FORWARD_PREFIX'),
		sPrefix = bReply ? sRePrefix : sFwdPrefix,
		sReSubject = sPrefix + ': ' + sSubject
	;
	
	if (Settings.JoinReplyPrefixes)
	{
		sReSubject = MessageUtils.joinReplyPrefixesInSubject(sReSubject, sRePrefix, sFwdPrefix);
	}
	
	return sReSubject;
};

/**
 * @param {string} sPlain
 * 
 * @return {string}
 */
SendingUtils.getHtmlFromText = function (sPlain)
{
	return sPlain
		.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;')
		.replace(/\r/g, '').replace(/\n/g, '<br />')
	;
};

module.exports = SendingUtils;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! jquery */ "EVdn")))

/***/ }),

/***/ "GdT1":
/*!*******************************************************************!*\
  !*** ./modules/MailWebclient/js/views/CComposeViewAutoEncrypt.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {

var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),

	AddressUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Address.js */ "Ol7c"),
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	
	ModulesManager = __webpack_require__(/*! modules/CoreWebclient/js/ModulesManager.js */ "OgeD"),
	
	Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh"),
	ConfirmPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/ConfirmPopup.js */ "20Ah"),
	
	SendingUtils = __webpack_require__(/*! modules/MailWebclient/js/utils/Sending.js */ "Cq+9")
;

function CComposeViewAutoEncrypt()
{
	this.recipientsInfo = ko.observable({});
	this.autoEncryptSignMessage = ko.observable(false);
}

CComposeViewAutoEncrypt.prototype.setAutoEncryptSubscribes = function ()
{
	this.hasRecipientsWithKey = ko.computed(function () {
		return !!_.find(this.recipientsInfo(), function (oRecipientInfo) {
			return oRecipientInfo.hasKey && (oRecipientInfo.encryptMessage || oRecipientInfo.signMessage) && _.indexOf(this.recipientEmails(), oRecipientInfo.email) !== -1;
		}.bind(this));
	}, this).extend({ throttle: 10 });
	this.allowAtoEncryptSignMessage = ko.computed(function () {
		return this.hasRecipientsWithKey() && !this.messageSignedOrEncrypted();
	}, this);
	this.allowAtoEncryptSignMessage.subscribe(function () {
		this.autoEncryptSignMessage(this.allowAtoEncryptSignMessage());
	}, this);

	this.recipientEmails.subscribe(function () {
		var
			aInfoKeys = _.keys(this.recipientsInfo()),
			aDiff = _.difference(this.recipientEmails(), aInfoKeys)
		;
		if (aDiff.length > 0)
		{
			ModulesManager.run('ContactsWebclient', 'getContactsByEmails', [aDiff, function (oContacts) {
				_.each(_.values(oContacts), function (oContact) {
					if (oContact)
					{
						this.recipientsInfo()[oContact.email()] = {
							email: oContact.email(),
							encryptMessage: oContact.pgpEncryptMessages(),
							hasKey: typeof oContact.publicPgpKey() === 'string' && oContact.publicPgpKey() !== '',
							id: oContact.uuid(),
							label: oContact.email(),
							name: oContact.displayName(),
							sharedToAll: oContact.sharedToAll(),
							signMessage: oContact.pgpSignMessages(),
							storage: oContact.storage(),
							team: oContact.team(),
							value: oContact.email()
						};
					}
				}.bind(this));
				$(this.toAddrDom()).inputosaurus('refresh');
				$(this.ccAddrDom()).inputosaurus('refresh');
				$(this.bccAddrDom()).inputosaurus('refresh');
				this.recipientsInfo.valueHasMutated();
			}.bind(this)]);
		}
	}, this);
};

CComposeViewAutoEncrypt.prototype.getInputosaurusMethods = function ()
{
	return {
		addRecipientInfo: function (oRecipientInfo) {
			var oRecipient = AddressUtils.getEmailParts(oRecipientInfo.value);
			this.recipientsInfo()[oRecipient.email] = oRecipientInfo;
			this.recipientsInfo.valueHasMutated();
		}.bind(this),
		getRecipientPgpKeyHtml: function (sFullEmail) {
			var
				oRecipient = AddressUtils.getEmailParts(sFullEmail),
				oRecipientInfo = this.recipientsInfo()[oRecipient.email],
				bHasKey = !!oRecipientInfo && !!oRecipientInfo.hasKey,
				sKeyHtml = '',
				sEncryptTitle = null,
				sSignTitle = null
			;
			if (bHasKey)
			{
				sKeyHtml += '<span class="address_capsule_key address_capsule_key_unset"></span>';
				if (oRecipientInfo.encryptMessage)
				{
					sEncryptTitle = TextUtils.i18n('MAILWEBCLIENT/HINT_MESSAGE_ENCRYPT_WITH_KEY');
					sKeyHtml += '<span class="address_capsule_key address_capsule_key_encrypt" title="' + sEncryptTitle + '"></span>';
				}
				else
				{
					sKeyHtml += '<span class="address_capsule_key address_capsule_key_not_encrypt"></span>';
				}
				if (oRecipientInfo.signMessage)
				{
					sSignTitle = TextUtils.i18n('MAILWEBCLIENT/HINT_MESSAGE_SIGN_WITH_KEY');
					sKeyHtml += '<span class="address_capsule_key address_capsule_key_sign" title="' + sSignTitle + '"></span>';
				}
			}
			return sKeyHtml;
		}.bind(this)
	};
};

CComposeViewAutoEncrypt.prototype.groupAllRecipients = function (aRecipients)
{
	var
		aRecipientsSimple = [],
		aRecipientsEncrypt = [],
		aRecipientsSign = [],
		aRecipientsSignEncrypt = [],
		iSendingCount = 0
	;
	_.each(aRecipients, function (sRecipient) {
		var oRecipientInfo = this.recipientsInfo()[sRecipient];
		if (oRecipientInfo && oRecipientInfo.hasKey)
		{
			if (oRecipientInfo.encryptMessage)
			{
				if (oRecipientInfo.signMessage)
				{
					aRecipientsSignEncrypt.push(sRecipient);
				}
				else
				{
					aRecipientsEncrypt.push(sRecipient);
				}
			}
			else if (oRecipientInfo.signMessage)
			{
				aRecipientsSign.push(sRecipient);
			}
			else
			{
				aRecipientsSimple.push(sRecipient);
			}
		}
		else
		{
			aRecipientsSimple.push(sRecipient);
		}
	}.bind(this));
	
	if (aRecipientsSimple.length > 0)
	{
		iSendingCount++;
	}
	if (aRecipientsEncrypt.length > 0)
	{
		iSendingCount++;
	}
	if (aRecipientsSign.length > 0)
	{
		iSendingCount++;
	}
	if (aRecipientsSignEncrypt.length > 0)
	{
		iSendingCount++;
	}
	
	return {
		simple: aRecipientsSimple,
		encrypt: aRecipientsEncrypt,
		sign: aRecipientsSign,
		signEncrypt: aRecipientsSignEncrypt,
		simpleCount: aRecipientsSimple.length,
		encryptCount: aRecipientsEncrypt.length,
		signCount: aRecipientsSign.length,
		signEncryptCount: aRecipientsSignEncrypt.length,
		groupCount: iSendingCount
	};
};

CComposeViewAutoEncrypt.prototype.confirmNotAllRecipientsEncryptSign = function (oRecipients, fCallBack)
{
	var sConfirm = null;
	if (oRecipients.simpleCount > 0)
	{
		if (oRecipients.encryptCount > 0 || oRecipients.signEncryptCount > 0)
		{
			sConfirm = TextUtils.i18n('MAILWEBCLIENT/CONFIRM_ENCRYPT_NOT_ALL_RECIPIENTS');
		}
		else if (oRecipients.signCount > 0)
		{
			sConfirm = TextUtils.i18n('MAILWEBCLIENT/CONFIRM_SIGN_NOT_ALL_RECIPIENTS');
		}
	}
	else
	{
		if (oRecipients.signCount > 0 && (oRecipients.encryptCount > 0 || oRecipients.signEncryptCount > 0))
		{
			sConfirm = TextUtils.i18n('MAILWEBCLIENT/CONFIRM_ENCRYPT_NOT_ALL_RECIPIENTS');
		}
		else if (oRecipients.signCount === 0 && oRecipients.encryptCount > 0 && oRecipients.signEncryptCount > 0)
		{
			sConfirm = TextUtils.i18n('MAILWEBCLIENT/CONFIRM_SIGN_NOT_ALL_RECIPIENTS');
		}
	}
	
	if (sConfirm !== null)
	{
		Popups.showPopup(ConfirmPopup, [sConfirm, fCallBack, '', TextUtils.i18n('MAILWEBCLIENT/ACTION_PROCEED_SENDING')]);
	}
	else
	{
		fCallBack(true);
	}
};

CComposeViewAutoEncrypt.prototype.proceedEncryptSignAndSend = function (oRecipients, sFromEmail, sPassword)
{
	var
		sData = this.oHtmlEditor.getPlainText(),
		oSendParameters = this.getSendSaveParameters(true),
		aInfoToSend = [],
		fOkCallback = function (aRecipients, bAddToSentFolder, sRes, bEncrypt) {
			var oCloneSendParameters = _.clone(oSendParameters);
			oCloneSendParameters.Text = sRes;
			oCloneSendParameters.IsHtml = false;
			oCloneSendParameters.Recipients = aRecipients;
			fContinueSending(oCloneSendParameters, bAddToSentFolder);
		},
		fContinueSending = _.bind(function (oSendParameters, bAddToSentFolder) {
			aInfoToSend.push({
				oSendParameters: oSendParameters,
				bAddToSentFolder: bAddToSentFolder
			});
			if (aInfoToSend.length === oRecipients.groupCount)
			{
				this.sending(true);
				this.requiresPostponedSending(!this.allowStartSending());
				this.backToListOnSendOrSave(true);
				_.each(aInfoToSend, function (oInfoToSend) {
					SendingUtils.send('SendMessage', oInfoToSend.oSendParameters, true, this.onSendOrSaveMessageResponse, 
							this, this.requiresPostponedSending(), oInfoToSend.bAddToSentFolder);
				}.bind(this));
			}
		}, this)
	;
	if (oRecipients.simpleCount > 0)
	{
		var oCloneSendParameters = _.clone(oSendParameters);
		oCloneSendParameters.Recipients = oRecipients.simple;
		fContinueSending(oCloneSendParameters, oRecipients.signCount === 0 && oRecipients.encryptCount === 0 && oRecipients.signEncryptCount === 0);
	}
	if (oRecipients.signCount > 0)
	{
		ModulesManager.run('OpenPgpWebclient', 'encryptSign', [false, true, sData, oRecipients.sign, 
			fOkCallback.bind(this, oRecipients.sign, oRecipients.encryptCount === 0 && oRecipients.signEncryptCount === 0), sFromEmail, sPassword]);
	}
	if (oRecipients.encryptCount > 0)
	{
		ModulesManager.run('OpenPgpWebclient', 'encryptSign', [true, false, sData, oRecipients.encrypt,
			fOkCallback.bind(this, oRecipients.encrypt, oRecipients.signEncryptCount === 0), sFromEmail]);
	}
	if (oRecipients.signEncryptCount > 0)
	{
		ModulesManager.run('OpenPgpWebclient', 'encryptSign', [true, true, sData, oRecipients.signEncrypt, 
			fOkCallback.bind(this, oRecipients.signEncrypt, true), sFromEmail, sPassword]);
	}
};

CComposeViewAutoEncrypt.prototype.encryptSignAndSend = function ()
{
	var
		sFromEmail = this.selectedFetcherOrIdentity().email(),
		aRecipients = this.recipientEmails(),
		oRecipients = this.groupAllRecipients(aRecipients)
	;
	this.confirmNotAllRecipientsEncryptSign(oRecipients, function (bProceed) {
		if (bProceed)
		{
			if (oRecipients.signCount > 0 || oRecipients.signEncryptCount > 0)
			{
				ModulesManager.run('OpenPgpWebclient', 'getPrivateKeyPassword', [sFromEmail, function (sPassword) {
					this.proceedEncryptSignAndSend(oRecipients, sFromEmail, sPassword);
				}.bind(this)]);
			}
			else
			{
				this.proceedEncryptSignAndSend(oRecipients, sFromEmail);
			}
		}
	}.bind(this));
};

module.exports = CComposeViewAutoEncrypt;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! jquery */ "EVdn")))

/***/ }),

/***/ "KARm":
/*!**************************************************************!*\
  !*** ./modules/CoreWebclient/js/models/CAddressListModel.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	
	CAddressModel = __webpack_require__(/*! modules/CoreWebclient/js/models/CAddressModel.js */ "cyfa")
;

/**
 * @constructor
 */
function CAddressListModel()
{
	this.aCollection = [];
}

/**
 * @param {object} oData
 */
CAddressListModel.prototype.parse = function (oData)
{
	var aCollection = oData ? oData['@Collection'] : [];
	
	this.aCollection = [];
	
	if (_.isArray(aCollection))
	{
		this.aCollection = _.map(aCollection, function (oItem) {
			var oAddress = new CAddressModel();
			oAddress.parse(oItem);
			return oAddress;
		});
	}
};

/**
 * @param {Array} aCollection
 */
CAddressListModel.prototype.addCollection = function (aCollection)
{
	_.each(aCollection, function (oAddress) {
		var oFoundAddress = _.find(this.aCollection, function (oThisAddress) {
			return oAddress.sEmail === oThisAddress.sEmail;
		});
		
		if (!oFoundAddress)
		{
			this.aCollection.push(oAddress);
		}
	}, this);
};

/**
 * @param {Array} aCollection
 */
CAddressListModel.prototype.excludeCollection = function (aCollection)
{
	_.each(aCollection, function (oAddress) {
		this.aCollection = _.filter(this.aCollection, function (oThisAddress) {
			return oAddress.sEmail.toLowerCase() !== oThisAddress.sEmail.toLowerCase();
		});
	}, this);
};

/**
 * @return {string}
 */
CAddressListModel.prototype.getFirstEmail = function ()
{
	if (this.aCollection.length > 0)
	{
		return this.aCollection[0].getEmail();
	}
	
	return '';
};

/**
 * @return {string}
 */
CAddressListModel.prototype.getFirstName = function ()
{
	if (this.aCollection.length > 0)
	{
		return this.aCollection[0].getName();
	}
	
	return '';
};

/**
 * @return {string}
 */
CAddressListModel.prototype.getFirstDisplay = function ()
{
	if (this.aCollection.length > 0)
	{
		return this.aCollection[0].getDisplay();
	}
	
	return '';
};

/**
 * @param {string=} sMeReplacement
 * @param {string=} sMyAccountEmail
 * 
 * @return {string}
 */
CAddressListModel.prototype.getDisplay = function (sMeReplacement, sMyAccountEmail)
{
	var aAddresses = _.map(this.aCollection, function (oAddress) {
		if (sMeReplacement && sMyAccountEmail === oAddress.sEmail)
		{
			return sMeReplacement;
		}
		return oAddress.getDisplay(sMeReplacement);
	});
	
	return aAddresses.join(', ');
};

/**
 * @return {string}
 */
CAddressListModel.prototype.getFull = function ()
{
	var aAddresses = _.map(this.aCollection, function (oAddress) {
		return oAddress.getFull();
	});
	
	return aAddresses.join(', ');
};

/**
 * @return {Array}
 */
CAddressListModel.prototype.getEmails = function ()
{
	var aEmails = _.map(this.aCollection, function (oAddress) {
		return oAddress.getEmail();
	});
	
	return aEmails;
};

module.exports = CAddressListModel;

/***/ }),

/***/ "LlUn":
/*!******************************************************!*\
  !*** ./modules/ImportExportMailPlugin/js/manager.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	ModulesManager = __webpack_require__(/*! modules/CoreWebclient/js/ModulesManager.js */ "OgeD"),
	Settings = __webpack_require__(/*! modules/ImportExportMailPlugin/js/Settings.js */ "RGpW")
;

module.exports = function (oAppData) {
	Settings.init(oAppData);

	if (!ModulesManager.isModuleAvailable('Mail') || !ModulesManager.isModuleAvailable('MailWebclient'))
	{
		return null;
	}

	return {
		getImportExportPopup: function () {
			return __webpack_require__(/*! modules/ImportExportMailPlugin/js/popups/ImportExportPopup.js */ "Aai/");
		}
	};
};


/***/ }),

/***/ "MHRZ":
/*!*********************************************************!*\
  !*** ./modules/MailWebclient/js/popups/ComposePopup.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	
	Browser = __webpack_require__(/*! modules/CoreWebclient/js/Browser.js */ "HLSX"),
	
	Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh"),
	CAbstractPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/CAbstractPopup.js */ "czxF"),
	ConfirmAnotherMessageComposedPopup = __webpack_require__(/*! modules/MailWebclient/js/popups/ConfirmAnotherMessageComposedPopup.js */ "5H03"),
	
	CComposeView = __webpack_require__(/*! modules/MailWebclient/js/views/CComposeView.js */ "NTez")
;

/**
 * @constructor
 * @extends CComposePopup
 */
function CComposePopup()
{
	CAbstractPopup.call(this);
	
	CComposeView.call(this);
	
	this.minimized = ko.observable(false);
	
	this.fPreventBackspace = function (ev) {
		var
			bBackspace = ev.which === $.ui.keyCode.BACKSPACE,
			bInput = ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA',
			bEditableDiv = ev.target.tagName === 'DIV' && $(ev.target).attr('contenteditable') === 'true'
		;
		
		if (bBackspace && !bInput && !bEditableDiv)
		{
			ev.preventDefault();
			ev.stopPropagation();
		}
	};
	
	this.minimized.subscribe(function () {
		if (this.minimized())
		{
			this.preventBackspaceOff();
		}
		else if (this.shown())
		{
			this.preventBackspaceOn();
		}
	}, this);
	
	this.minimizedTitle = ko.computed(function () {
		return this.subject() || TextUtils.i18n('MAILWEBCLIENT/HEADING_MINIMIZED_NEW_MESSAGE');
	}, this);
}

_.extendOwn(CComposePopup.prototype, CAbstractPopup.prototype);

_.extendOwn(CComposePopup.prototype, CComposeView.prototype);

CComposePopup.prototype.PopupTemplate = 'MailWebclient_ComposePopup';

CComposePopup.prototype.preventBackspaceOn = function ()
{
	$(document).on('keydown', this.fPreventBackspace);
};

CComposePopup.prototype.preventBackspaceOff = function ()
{
	$(document).off('keydown', this.fPreventBackspace);
};

CComposePopup.prototype.onClose = function ()
{
	this.preventBackspaceOff();
};

/**
 * @param {Array} aParams
 */
CComposePopup.prototype.onOpen = function (aParams)
{
	aParams = aParams || [];
	
	if (aParams.length === 1 && aParams[0] === 'close')
	{
		this.closePopup();
	}
	else
	{
		var
			bOpeningSameDraft = aParams.length === 3 && aParams[0] === 'drafts' && aParams[2] === this.draftUid(),
			bWasMinimized = this.minimized()
		;
		
		this.maximize();
		if (this.shown() || bWasMinimized)
		{
			if (aParams.length > 0 && !bOpeningSameDraft)
			{
				if (this.hasUnsavedChanges())
				{
					this.disableAutosave(true);
					Popups.showPopup(ConfirmAnotherMessageComposedPopup, [_.bind(function (sAnswer) {
						switch (sAnswer)
						{
							case Enums.AnotherMessageComposedAnswer.Discard:
								this.onRoute(aParams);
								break;
							case Enums.AnotherMessageComposedAnswer.SaveAsDraft:
								if (this.hasUnsavedChanges())
								{
									this.executeSave(true, false);
								}
								this.onRoute(aParams);
								break;
							case Enums.AnotherMessageComposedAnswer.Cancel:
								break;
						}
						this.disableAutosave(false);
					}, this)]);
				}
				else
				{
					this.onRoute(aParams);
				}
			}
			else if (!bWasMinimized)
			{
				this.onRoute(aParams);
			}

			this.oHtmlEditor.clearUndoRedo();
		}
		else
		{
			this.onRoute(aParams);
		}
		this.preventBackspaceOn();
	}
};

CComposePopup.prototype.minimize = function ()
{
	this.minimized(true);
	if (this.$popupDom)
	{
		this.$popupDom.addClass('minimized');
	}
};

CComposePopup.prototype.maximize = function ()
{
	this.minimized(false);
	if (this.$popupDom)
	{
		this.$popupDom.removeClass('minimized');
	}
};

CComposePopup.prototype.saveAndClose = function ()
{
	if (this.hasUnsavedChanges())
	{
		this.saveCommand();
	}

	// closePopup method will remove the entire popup so click event for span.item.save_and_close won't be fired and tooltip won't be hidden.
	// So we postpone it for a bit.
	setTimeout(this.closePopup.bind(this), 0);
};

CComposePopup.prototype.cancelPopup = function ()
{
	if (this.hasUnsavedChanges())
	{
		this.minimize();
	}
	else
	{
		this.closePopup();
	}
};

/**
 * @param {Object} oEvent
 */
CComposePopup.prototype.onEscHandler = function (oEvent)
{
	var
		bHtmlEditorHasOpenedPopup = this.oHtmlEditor.hasOpenedPopup(),
		bOnFileInput = !Browser.ie && oEvent.target && (oEvent.target.tagName.toLowerCase() === 'input') && (oEvent.target.type.toLowerCase() === 'file')
	;
	
	if (bOnFileInput)
	{
		oEvent.target.blur();
	}
	
	if (Popups.hasOnlyOneOpenedPopup() && !bHtmlEditorHasOpenedPopup && !bOnFileInput)
	{
		this.minimize();
	}
	
	if (bHtmlEditorHasOpenedPopup)
	{
		this.oHtmlEditor.closeAllPopups();
	}
};

module.exports = new CComposePopup();


/***/ }),

/***/ "NTez":
/*!********************************************************!*\
  !*** ./modules/MailWebclient/js/views/CComposeView.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),

	AddressUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Address.js */ "Ol7c"),
	FilesUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Files.js */ "QFUI"),
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),

	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	Browser = __webpack_require__(/*! modules/CoreWebclient/js/Browser.js */ "HLSX"),
	CJua = __webpack_require__(/*! modules/CoreWebclient/js/CJua.js */ "mjrp"),
	ModulesManager = __webpack_require__(/*! modules/CoreWebclient/js/ModulesManager.js */ "OgeD"),
	Routing = __webpack_require__(/*! modules/CoreWebclient/js/Routing.js */ "QaF5"),
	Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ "SQrT"),
	UserSettings = __webpack_require__(/*! modules/CoreWebclient/js/Settings.js */ "hPb3"),
	WindowOpener = __webpack_require__(/*! modules/CoreWebclient/js/WindowOpener.js */ "ZCBP"),

	CAbstractScreenView = __webpack_require__(/*! modules/CoreWebclient/js/views/CAbstractScreenView.js */ "xcwT"),

	Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh"),
	AlertPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/AlertPopup.js */ "1grR"),
	SelectFilesPopup = ModulesManager.run('FilesWebclient', 'getSelectFilesPopup'),

	LinksUtils = __webpack_require__(/*! modules/MailWebclient/js/utils/Links.js */ "4M/5"),
	SendingUtils = __webpack_require__(/*! modules/MailWebclient/js/utils/Sending.js */ "Cq+9"),

	AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm"),
	CoreAjax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ "o0Bx"),
	Ajax = __webpack_require__(/*! modules/MailWebclient/js/Ajax.js */ "UN2P"),
	MailCache = __webpack_require__(/*! modules/MailWebclient/js/Cache.js */ "4+IO"),
	MainTabExtMethods = __webpack_require__(/*! modules/MailWebclient/js/MainTabExtMethods.js */ "dKfC"),
	SenderSelector = __webpack_require__(/*! modules/MailWebclient/js/SenderSelector.js */ "UvKh"),
	Settings = __webpack_require__(/*! modules/MailWebclient/js/Settings.js */ "p2hp"),

	CMessageModel = __webpack_require__(/*! modules/MailWebclient/js/models/CMessageModel.js */ "Nfk5"),
	CAttachmentModel = __webpack_require__(/*! modules/MailWebclient/js/models/CAttachmentModel.js */ "XTZw"),

	CComposeViewAutoEncrypt = __webpack_require__(/*! modules/MailWebclient/js/views/CComposeViewAutoEncrypt.js */ "GdT1"),
	CHtmlEditorView = __webpack_require__(/*! modules/MailWebclient/js/views/CHtmlEditorView.js */ "a28q"),

	MainTab = App.isNewTab() && window.opener && window.opener.MainTabMailMethods,

	$html = $('html')
;

/**
 * @constructor
 */
function CComposeView()
{
	CAbstractScreenView.call(this, 'MailWebclient');
	CComposeViewAutoEncrypt.call(this);

	this.browserTitle = ko.computed(function () {
		return AccountList.getEmail() + ' - ' + TextUtils.i18n('MAILWEBCLIENT/HEADING_COMPOSE_BROWSER_TAB');
	});

	var self = this;

	this.toAddrDom = ko.observable();
	this.toAddrDom.subscribe(function () {
		this.initInputosaurus(this.toAddrDom, this.toAddr, this.lockToAddr, 'to');
	}, this);
	this.ccAddrDom = ko.observable();
	this.ccAddrDom.subscribe(function () {
		this.initInputosaurus(this.ccAddrDom, this.ccAddr, this.lockCcAddr, 'cc');
	}, this);
	this.bccAddrDom = ko.observable();
	this.bccAddrDom.subscribe(function () {
		this.initInputosaurus(this.bccAddrDom, this.bccAddr, this.lockBccAddr, 'bcc');
	}, this);

	this.folderList = MailCache.folderList;
	this.folderList.subscribe(function () {
		this.getMessageOnRoute();
	}, this);

	this.bNewTab = App.isNewTab();
	this.bDemo = UserSettings.IsDemo;

	this.sending = ko.observable(false);
	this.saving = ko.observable(false);

	this.oHtmlEditor = new CHtmlEditorView(false, this);

	this.visibleBcc = ko.observable(false);
	this.visibleBcc.subscribe(function () {
		$html.toggleClass('screen-compose-bcc', this.visibleCc());
		_.defer(_.bind(function () {
			$(this.bccAddrDom()).inputosaurus('resizeInput');
		}, this));
	}, this);
	this.visibleCc = ko.observable(false);
	this.visibleCc.subscribe(function () {
		$html.toggleClass('screen-compose-cc', this.visibleCc());
		_.defer(_.bind(function () {
			$(this.ccAddrDom()).inputosaurus('resizeInput');
		}, this));
	}, this);

	this.sendReadingConfirmation = ko.observable(false).extend({'reversible': true});

	this.composeUploaderButton = ko.observable(null);
	this.composeUploaderButton.subscribe(function () {
		this.initUploader();
	}, this);
	this.composeUploaderDropPlace = ko.observable(null);
	this.composeUploaderBodyDragOver = ko.observable(false);
	this.composeUploaderDragOver = ko.observable(false);
	this.allowDragNDrop = ko.observable(false);
	this.uploaderBodyDragOver = ko.computed(function () {
		return this.allowDragNDrop() && this.composeUploaderBodyDragOver();
	}, this);
	this.uploaderDragOver = ko.computed(function () {
		return this.allowDragNDrop() && this.composeUploaderDragOver();
	}, this);

	this.selectedImportance = ko.observable(Enums.Importance.Normal).extend({'reversible': true});

	this.senderAccountId = SenderSelector.senderAccountId;
	this.senderList = SenderSelector.senderList;
	this.visibleFrom = ko.computed(function () {
		return App.isNewTab() || this.senderList().length > 1 || this.senderAccountId() !== MailCache.currentAccountId();
	}, this);
	this.selectedSender = SenderSelector.selectedSender;
	this.selectedFetcherOrIdentity = SenderSelector.selectedFetcherOrIdentity;
	this.selectedFetcherOrIdentity.subscribe(function () {
		if (!this.oHtmlEditor.isEditing())
		{
			this.oHtmlEditor.clearUndoRedo();
			this.oHtmlEditor.commit();
		}
	}, this);

	this.signature = ko.observable('');
	this.prevSignature = ko.observable(null);
	ko.computed(function () {
		var sSignature = SendingUtils.getClearSignature(this.senderAccountId(), this.selectedFetcherOrIdentity());

		if (this.prevSignature() === null)
		{
			this.prevSignature(sSignature);
			this.signature(sSignature);
		}
		else
		{
			this.prevSignature(this.signature());
			this.signature(sSignature);
			this.oHtmlEditor.changeSignatureContent(this.signature(), this.prevSignature());
		}
	}, this);

	this.lockToAddr = ko.observable(false);
	this.toAddr = ko.observable('').extend({'reversible': true});
	this.toAddr.subscribe(function () {
		if (!this.lockToAddr())
		{
			$(this.toAddrDom()).val(this.toAddr());
			$(this.toAddrDom()).inputosaurus('refresh');
		}
	}, this);
	this.lockCcAddr = ko.observable(false);
	this.ccAddr = ko.observable('').extend({'reversible': true});
	this.ccAddr.subscribe(function () {
		if (!this.lockCcAddr())
		{
			$(this.ccAddrDom()).val(this.ccAddr());
			$(this.ccAddrDom()).inputosaurus('refresh');
		}
	}, this);
	this.lockBccAddr = ko.observable(false);
	this.bccAddr = ko.observable('').extend({'reversible': true});
	this.bccAddr.subscribe(function () {
		if (!this.lockBccAddr())
		{
			$(this.bccAddrDom()).val(this.bccAddr());
			$(this.bccAddrDom()).inputosaurus('refresh');
		}
	}, this);
	this.recipientEmails = ko.computed(function () {
		var
			aRecip = [this.toAddr(), this.ccAddr(), this.bccAddr()].join(',').split(','),
			aEmails = []
		;
		_.each(aRecip, function (sRecip) {
			var
				sTrimmedRecip = $.trim(sRecip),
				oRecip = null
			;
			if (sTrimmedRecip !== '')
			{
				oRecip = AddressUtils.getEmailParts(sTrimmedRecip);
				if (oRecip.email)
				{
					aEmails.push(oRecip.email);
				}
			}
		});
		return aEmails;
	}, this);
	this.subject = ko.observable('').extend({'reversible': true});
	this.plainText = ko.observable(false);
	this.textBody = ko.observable('');
	this.textBody.subscribe(function (value) {
		this.oHtmlEditor.setText(this.textBody(), this.plainText());
		this.oHtmlEditor.commit();
	}, this);

	this.focusedField = ko.observable();
	this.oHtmlEditor.textFocused.subscribe(function (val) {
		if (this.oHtmlEditor.textFocused())
		{
			this.focusedField('text');
		}
	}, this);
	this.subjectFocused = ko.observable(false);
	this.subjectFocused.subscribe(function () {
		if (this.subjectFocused())
		{
			this.focusedField('subject');
		}
	}, this);

    this.templateUid = ko.observable('');
	this.templateFolderName = ko.observable(MailCache.getTemplateFolder());

	this.draftUid = ko.observable('');
	this.draftUid.subscribe(function () {
		MailCache.editedDraftUid(this.draftUid());
	}, this);
	this.draftInfo = ko.observableArray([]);
	this.routeType = ko.observable('');
	this.routeParams = ko.observableArray([]);
	this.inReplyTo = ko.observable('');
	this.references = ko.observable('');

	this.bUploadStatus = false;
	this.iUploadAttachmentsTimer = 0;
	this.messageUploadAttachmentsStarted = ko.observable(false);

	this.messageUploadAttachmentsStarted.subscribe(function (bValue) {
		window.clearTimeout(self.iUploadAttachmentsTimer);
		if (bValue)
		{
			self.iUploadAttachmentsTimer = window.setTimeout(function () {
				self.bUploadStatus = true;
				Screens.showLoading(TextUtils.i18n('MAILWEBCLIENT/INFO_ATTACHMENTS_LOADING'));
			}, 4000);
		}
		else
		{
			if (self.bUploadStatus)
			{
				self.iUploadAttachmentsTimer = window.setTimeout(function () {
					self.bUploadStatus = false;
					Screens.hideLoading();
				}, 1000);
			}
			else
			{
				Screens.hideLoading();
			}
		}
	}, this);

	this.attachments = ko.observableArray([]);
	this.attachmentsChanged = ko.observable(false);
	this.attachments.subscribe(function () {
		this.attachmentsChanged(true);
	}, this);
	this.notUploadedAttachments = ko.computed(function () {
		return _.filter(this.attachments(), function (oAttach) {
			return !oAttach.uploaded();
		});
	}, this);

	this.allAttachmentsUploaded = ko.computed(function () {
		return this.notUploadedAttachments().length === 0 && !this.messageUploadAttachmentsStarted();
	}, this);

	this.notInlineAttachments = ko.computed(function () {
		return _.filter(this.attachments(), function (oAttach) {
			return !oAttach.linked();
		});
	}, this);
	this.notInlineAttachments.subscribe(function () {
		$html.toggleClass('screen-compose-attachments', this.notInlineAttachments().length > 0);
	}, this);

	this.allowStartSending = ko.computed(function() {
		return !this.saving();
	}, this);
	this.allowStartSending.subscribe(function () {
		if (this.allowStartSending() && this.requiresPostponedSending())
		{
			SendingUtils.sendPostponedMail(this.draftUid());
			this.requiresPostponedSending(false);
		}
	}, this);
	this.requiresPostponedSending = ko.observable(false);

	// file uploader
	this.oJua = null;

	this.isDraftsCleared = ko.observable(false);

	this.backToListOnSendOrSave = ko.observable(false);

	this.composeShown = ko.computed(function () {
		return !!this.opened && this.opened() || !!this.shown && this.shown();
	}, this);

	this.toolbarControllers = ko.observableArray([]);
	this.messageRowControllers = ko.observableArray([])
	this.allControllers = ko.computed(function () {
		return _.union(this.toolbarControllers(), this.messageRowControllers());
	}, this);
	this.disableHeadersEdit = ko.computed(function () {
		var bDisableHeadersEdit = false;

		_.each(this.allControllers(), function (oController) {
			bDisableHeadersEdit = bDisableHeadersEdit || !!oController.disableHeadersEdit && oController.disableHeadersEdit();
		});

		return bDisableHeadersEdit;
	}, this);
	this.disableFromEdit = ko.computed(function () {
		var bDisableFromEdit = false;

		_.each(this.allControllers(), function (oController) {
			bDisableFromEdit = bDisableFromEdit || !!oController.disableFromEdit && oController.disableFromEdit();
		});

		return bDisableFromEdit;
	}, this);
	this.messageSignedOrEncrypted = ko.computed(function () {
		var bSignedOrEncrypted = false;

		_.each(this.allControllers(), function (oController) {
			if (_.isFunction(oController.pgpEncrypted) && _.isFunction(oController.pgpSecured))
			{
				bSignedOrEncrypted = bSignedOrEncrypted || oController.pgpEncrypted() || oController.pgpSecured();
			}
		});

		return bSignedOrEncrypted;
	}, this);
	ko.computed(function () {
		var bDisableBodyEdit = false;

		_.each(this.allControllers(), function (oController) {
			bDisableBodyEdit = bDisableBodyEdit || !!oController.disableBodyEdit && oController.disableBodyEdit();
		});
		this.oHtmlEditor.setDisableEdit(bDisableBodyEdit);
	}, this);

	this.draftFolderIsAvailable = ko.computed(function () {
		return !!MailCache.folderList().draftsFolder();
	}, this);
	this.disableAutosave = ko.observable(false);
	// Autosave interval is automatically cleared when compose is not shown or message is sending/saving or
	// it's disabled by compose screen or one of controllers. After changins these parameters autosave
	// interval might be started again.
	if (Settings.AllowAutosaveInDrafts && Settings.AutoSaveIntervalSeconds > 0)
	{
		this.iAutosaveInterval = -1;
		ko.computed(function () {
			var bAllowAutosave = this.draftFolderIsAvailable() && this.composeShown() && !this.sending() && !this.saving() && !this.disableAutosave() && !MailCache.disableComposeAutosave();
			_.each(this.allControllers(), function (oController) {
				bAllowAutosave = bAllowAutosave && !(!!oController.disableAutosave && oController.disableAutosave());
			});

			window.clearInterval(this.iAutosaveInterval);

			if (bAllowAutosave)
			{
				this.iAutosaveInterval = window.setInterval(_.bind(this.executeSave, this, true), Settings.AutoSaveIntervalSeconds * 1000);
			}
		}, this);
	}

	this.backToListCommand = Utils.createCommand(this, this.executeBackToList);
	this.sendCommand = Utils.createCommand(this, this.executeSend, this.isEnableSending);
	this.saveCommand = Utils.createCommand(this, this.executeSaveCommand, this.isEnableSaving);
	this.visibleSaveTemplateControl = ko.observable(false);
	this.saveTemplateCommand = Utils.createCommand(this, this.executeTemplateSaveCommand, this.isEnableSaving);

	this.messageFields = ko.observable(null);
	this.bottomPanel = ko.observable(null);

	this.sHotkeysHintsViewTemplate = !Browser.mobileDevice ? 'MailWebclient_Compose_HotkeysHintsView' : '';
	this.sPopupButtonsViewTemplate = !App.isNewTab() ? 'MailWebclient_Compose_PopupButtonsView' : '';

	this.aHotkeys = [
		{ value: 'Ctrl+S', action: TextUtils.i18n('MAILWEBCLIENT/LABEL_SAVE_HOTKEY'), visible: this.draftFolderIsAvailable },
		{ value: 'Ctrl+Z', action: TextUtils.i18n('MAILWEBCLIENT/LABEL_UNDO_HOTKEY'), visible: ko.observable(true) },
		{ value: 'Ctrl+Y', action: TextUtils.i18n('MAILWEBCLIENT/LABEL_REDO_HOTKEY'), visible: ko.observable(true) },
		{ value: 'Ctrl+K', action: TextUtils.i18n('MAILWEBCLIENT/LABEL_LINK_HOTKEY'), visible: ko.observable(true) },
		{ value: 'Ctrl+B', action: TextUtils.i18n('MAILWEBCLIENT/LABEL_BOLD_HOTKEY'), visible: ko.observable(true) },
		{ value: 'Ctrl+I', action: TextUtils.i18n('MAILWEBCLIENT/LABEL_ITALIC_HOTKEY'), visible: ko.observable(true) },
		{ value: 'Ctrl+U', action: TextUtils.i18n('MAILWEBCLIENT/LABEL_UNDERLINE_HOTKEY'), visible: ko.observable(true) }
	];

	if (Settings.AllowQuickSendOnCompose)
	{
		this.aHotkeys.unshift({ value: 'Ctrl+Enter', action: TextUtils.i18n('MAILWEBCLIENT/LABEL_SEND_HOTKEY'), visible: ko.observable(true) });
	}

	this.bAllowFiles = !!SelectFilesPopup;

	this.ignoreHasUnsavedChanges = ko.observable(false);
	this.changedInPreviousWindow = ko.observable(false);

	this.hasUnsavedChanges = ko.computed(function () {
		return !this.ignoreHasUnsavedChanges() && this.isChanged() && this.isEnableSaving();
	}, this);

	this.saveAndCloseTooltip = ko.computed(function () {
		return this.draftFolderIsAvailable() && this.hasUnsavedChanges() ? TextUtils.i18n('MAILWEBCLIENT/ACTION_SAVE_CLOSE') : TextUtils.i18n('MAILWEBCLIENT/ACTION_CLOSE');
	}, this);

	this.splitterDom = ko.observable();

	this.headersCompressed = ko.observable(false);
	this.allowCcBccSwitchers = ko.computed(function () {
		return !this.disableHeadersEdit() && !this.headersCompressed();
	}, this);

	this.registerOwnToolbarControllers();

	this.setAutoEncryptSubscribes();

	App.broadcastEvent('MailWebclient::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
}

_.extendOwn(CComposeView.prototype, CAbstractScreenView.prototype);
_.extendOwn(CComposeView.prototype, CComposeViewAutoEncrypt.prototype);

CComposeView.prototype.ViewTemplate = App.isNewTab() ? 'MailWebclient_ComposeScreenView' : 'MailWebclient_ComposeView';
CComposeView.prototype.ViewConstructorName = 'CComposeView';

/**
 * Determines if sending a message is allowed.
 */
CComposeView.prototype.isEnableSending = function ()
{
	var
		bRecipientIsEmpty = this.toAddr().length === 0 && this.ccAddr().length === 0 && this.bccAddr().length === 0,
		bFoldersLoaded = this.folderList() && this.folderList().iAccountId !== 0
	;

	return bFoldersLoaded && !this.sending() && !bRecipientIsEmpty && this.allAttachmentsUploaded();
};

/**
 * Determines if saving a message is allowed.
 */
CComposeView.prototype.isEnableSaving = function ()
{
	var bFoldersLoaded = this.folderList() && this.folderList().iAccountId !== 0;

	return this.composeShown() && bFoldersLoaded && !this.sending() && !this.saving();
};

/**
 * @param {Object} koAddrDom
 * @param {Object} koAddr
 * @param {Object} koLockAddr
 * @param {string} sFocusedField
 */
CComposeView.prototype.initInputosaurus = function (koAddrDom, koAddr, koLockAddr, sFocusedField)
{
	if (koAddrDom() && $(koAddrDom()).length > 0)
	{
		var oOptions = {
			width: 'auto',
			parseOnBlur: true,
			autoCompleteSource: ModulesManager.run('ContactsWebclient', 'getSuggestionsAutocompleteCallback', ['all', '', /*bWithGroups*/true]) || function () {},
			autoCompleteDeleteItem: ModulesManager.run('ContactsWebclient', 'getSuggestionsAutocompleteDeleteHandler') || function () {},
			autoCompleteAppendTo: $(koAddrDom()).closest('td'),
			change : _.bind(function (ev) {
				koLockAddr(true);
				this.setRecipient(koAddr, ev.target.value);
				koLockAddr(false);
			}, this),
			copy: _.bind(function (sVal) {
				this.inputosaurusBuffer = sVal;
			}, this),
			paste: _.bind(function () {
				var sInputosaurusBuffer = this.inputosaurusBuffer || '';
				this.inputosaurusBuffer = '';
				return sInputosaurusBuffer;
			}, this),
			focus: _.bind(this.focusedField, this, sFocusedField),
			mobileDevice: Browser.mobileDevice
		};
		$(koAddrDom()).inputosaurus(_.extendOwn(oOptions, this.getInputosaurusMethods()));
	}
};

/**
 * Colapse from to table.
 */
CComposeView.prototype.changeHeadersCompressed = function ()
{
	this.headersCompressed(!this.headersCompressed());
};

/**
 * Executes after applying bindings.
 */
CComposeView.prototype.onBind = function ()
{
	ModulesManager.run('SessionTimeoutWeblient', 'registerFunction', [_.bind(this.executeSave, this, false)]);

	if (!App.isMobile())
	{
		this.hotKeysBind();
	}
};

CComposeView.prototype.hotKeysBind = function ()
{
	(this.$popupDom || this.$viewDom).on('keydown', $.proxy(function(ev) {

		if (ev && ev.ctrlKey && !ev.altKey && !ev.shiftKey)
		{
			var
				nKey = ev.keyCode,
				bComputed = this.composeShown() && (!this.minimized || !this.minimized()) && ev && ev.ctrlKey
			;

			if (bComputed && nKey === Enums.Key.s)
			{
				ev.preventDefault();
				ev.returnValue = false;

				if (this.isEnableSaving())
				{
					this.saveCommand();
				}
			}
			else if (Settings.AllowQuickSendOnCompose && bComputed && nKey === Enums.Key.Enter && this.toAddr() !== '')
			{
				this.sendCommand();
			}
		}

	},this));
};

CComposeView.prototype.getMessageOnRoute = function ()
{
	var
		oParams = LinksUtils.parseCompose(this.routeParams()),
		oAccount = AccountList.getAccountByHash(oParams.AccountHash)
	;

	if (oAccount && this.routeType() !== '' && oParams.MessageFolderName && oParams.MessageUid)
	{
		MailCache.getMessage(oAccount.id(), oParams.MessageFolderName, oParams.MessageUid, this.onMessageResponse, this);
	}
};

/**
 * Executes if the view model shows. Requests a folder list from the server to know the full names
 * of the folders Drafts and Sent Items.
 */
CComposeView.prototype.onShow = function ()
{
	// onShow is called before onRoute so reset is called here before anything else
	this.reset();

	var sFocusedField = this.focusedField();

	$(this.splitterDom()).trigger('resize');
	$(this.bottomPanel()).trigger('resize');

//	if (!this.oHtmlEditor.isInitialized())
//	{
		// Crea $container must be recreated because compose popup is destroyed after it is closed
		this.oHtmlEditor.init(this.textBody(), this.plainText(), '7');
		this.oHtmlEditor.commit();
//	}

	this.initUploader();

	this.backToListOnSendOrSave(false);

	this.focusedField(sFocusedField);//oHtmlEditor initialization puts focus on it and changes the variable focusedField

	$html.addClass('screen-compose');

	if (this.oJua)
	{
		this.oJua.setDragAndDropEnabledStatus(true);
	}

	this.visibleSaveTemplateControl(MailCache.getCurrentTemplateFolders().length > 0);
};

CComposeView.prototype.reset = function ()
{
	this.plainText(false);
	this.textBody('');

	this.bUploadStatus = false;
	window.clearTimeout(this.iUploadAttachmentsTimer);
	this.messageUploadAttachmentsStarted(false);

	this.templateUid('');
	this.templateFolderName(MailCache.getTemplateFolder());
	this.draftUid('');
	this.draftInfo.removeAll();
	this.setDataFromMessage(new CMessageModel());

	this.isDraftsCleared(false);

	this.ignoreHasUnsavedChanges(false);
};

/**
 * Executes if routing was changed.
 *
 * @param {Array} aParams
 */
CComposeView.prototype.onRoute = function (aParams)
{
	this.setDataFromMessage(new CMessageModel()); // clear before filling up

	var oParams = LinksUtils.parseCompose(aParams);

	if (App.isNewTab())
	{
		// should be the first action to set right account id in new tab
		AccountList.changeCurrentAccountByHash(oParams.AccountHash);
	}

	this.routeType(oParams.RouteType);
	switch (this.routeType())
	{
		case Enums.ReplyType.ForwardAsAttach:
			this.routeParams(aParams);
			this.fillDefault(oParams);
		case Enums.ReplyType.Reply:
		case Enums.ReplyType.ReplyAll:
		case Enums.ReplyType.Resend:
		case Enums.ReplyType.Forward:
		case 'drafts':
			this.routeParams(aParams);
			if (this.folderList().iAccountId !== 0)
			{
				this.getMessageOnRoute();
			}
			break;
		case 'data':
			var oData = oParams.Object;

			if (oData)
			{
				if (oData.to)
				{
					this.setRecipient(this.toAddr, oData.to);
				}
				if (oData.subject)
				{
					this.subject(oData.subject);
				}
				if (!oData.isHtml)
				{
					this.plainText(true);
				}
				if (oData.selectedSenderId)
				{
					this.selectedSender(oData.selectedSenderId);
				}
				var sBody = '<div></div>';
				if (oData.body)
				{
					sBody = oData.isHtml ? '<div>' + oData.body + '</div>' : oData.body;
					this.textBody(sBody);
				}
				if (oData.replyToMessage)
				{
					var oReplyData = SendingUtils.getReplyDataFromMessage(oData.replyToMessage, Enums.ReplyType.Reply, App.currentAccountId(), null, true);

					this.plainText(false);
					this.draftInfo(oReplyData.DraftInfo);
					this.draftUid(oReplyData.DraftUid);
					this.setRecipient(this.toAddr, oReplyData.To);
					this.setRecipient(this.ccAddr, oReplyData.Cc);
					this.setRecipient(this.bccAddr, oReplyData.Bcc);
					this.subject(oReplyData.Subject);
					this.textBody(oReplyData.Text);
					this.attachments(oReplyData.Attachments);
					this.inReplyTo(oReplyData.InReplyTo);
					this.references(oReplyData.References);

					this.requestAttachmentsTempName();
				}
				if (oData.attachments)
				{
					this.addAttachments(oData.attachments);
				}
				this.triggerToolbarControllersAfterPopulatingMessage(true, !oData.isHtml, sBody);
				this.commit(true);
			}

			break;
		default:
			this.routeParams(aParams);
			this.fillDefault(oParams);
			break;
	}
};

CComposeView.prototype.fillDefault = function (oParams)
{
	var
		sSignature = SendingUtils.getSignatureText(this.senderAccountId(), this.selectedFetcherOrIdentity(), true),
		oComposedMessage = MainTab ? MainTab.getComposedMessage(window.name) : null,
		oToAddr = oParams.ToAddr
	;

	if (oComposedMessage)
	{
		this.setMessageDataInNewTab(oComposedMessage);
		if (this.changedInPreviousWindow())
		{
			_.defer(_.bind(this.executeSave, this, true));
		}
	}
	else if (sSignature !== '')
	{
		this.textBody('<br /><br />' + sSignature + '<br />');
	}

	if (oToAddr)
	{
		this.setRecipient(this.toAddr, oToAddr.to);
		if (oToAddr.hasMailto)
		{
			this.subject(oToAddr.subject);
			this.setRecipient(this.ccAddr, oToAddr.cc);
			this.setRecipient(this.bccAddr, oToAddr.bcc);
			if (oToAddr.body !== '')
			{
				this.textBody('<div>' + oToAddr.body + '</div>');
			}
		}
	}

	if (this.routeType() === Enums.ReplyType.ForwardAsAttach && oParams.Object)
	{
		this.addMessageAsAttachment(oParams.Object);
	}

	if (this.routeType() === 'attachments' && oParams.Object)
	{
		this.addAttachments(oParams.Object);
	}

	_.defer(_.bind(function () {
		this.focusAfterFilling();
	}, this));

	this.visibleCc(this.ccAddr() !== '');
	this.visibleBcc(this.bccAddr() !== '');
	this.commit(true);
};

CComposeView.prototype.focusToAddr = function ()
{
	$(this.toAddrDom()).inputosaurus('focus');
};

CComposeView.prototype.focusCcAddr = function ()
{
	$(this.ccAddrDom()).inputosaurus('focus');
};

CComposeView.prototype.focusBccAddr = function ()
{
	$(this.bccAddrDom()).inputosaurus('focus');
};

CComposeView.prototype.focusAfterFilling = function ()
{
	switch (this.focusedField())
	{
		case 'to':
			this.focusToAddr();
			break;
		case 'cc':
			this.visibleCc(true);
			this.focusCcAddr();
			break;
		case 'bcc':
			this.visibleBcc(true);
			this.focusBccAddr();
			break;
		case 'subject':
			this.subjectFocused(true);
			break;
		case 'text':
			this.oHtmlEditor.setFocus();
			break;
		default:
			if (this.toAddr().length === 0)
			{
				this.focusToAddr();
			}
			else if (this.subject().length === 0)
			{
				this.subjectFocused(true);
			}
			else
			{
				this.oHtmlEditor.setFocus();
			}
			break;
	}
};

/**
 * Executes if view model was hidden.
 */
CComposeView.prototype.onHide = function ()
{
	if (!_.isFunction(this.closePopup) && this.hasUnsavedChanges())
	{
		this.executeSave(true);
	}

	this.headersCompressed(false);

	this.routeParams([]);

	this.subjectFocused(false);
	this.focusedField('');

	this.messageUploadAttachmentsStarted(false);

	$html.removeClass('screen-compose').removeClass('screen-compose-cc').removeClass('screen-compose-bcc').removeClass('screen-compose-attachments');

	if (this.oJua)
	{
		this.oJua.setDragAndDropEnabledStatus(false);
	}

	this.recipientsInfo({});
	this.recipientsInfo.valueHasMutated();
};

/**
 * @param {Object} koRecipient
 * @param {string} sRecipient
 */
CComposeView.prototype.setRecipient = function (koRecipient, sRecipient)
{
	if (koRecipient() === sRecipient)
	{
		koRecipient.valueHasMutated();
	}
	else
	{
		koRecipient(sRecipient);
	}
};

/**
 * @param {Object} oMessage
 */
CComposeView.prototype.onMessageResponse = function (oMessage)
{
	var oReplyData = null;

	if (oMessage === null)
	{
		this.setDataFromMessage(new CMessageModel());
	}
	else
	{
		switch (this.routeType())
		{
			case Enums.ReplyType.Reply:
			case Enums.ReplyType.ReplyAll:
				SenderSelector.setFetcherOrIdentityByReplyMessage(oMessage);

				oReplyData = SendingUtils.getReplyDataFromMessage(oMessage, this.routeType(), this.senderAccountId(), this.selectedFetcherOrIdentity(), true);

				this.draftInfo(oReplyData.DraftInfo);
				this.draftUid(oReplyData.DraftUid);
				this.setRecipient(this.toAddr, oReplyData.To);
				this.setRecipient(this.ccAddr, oReplyData.Cc);
				this.setRecipient(this.bccAddr, oReplyData.Bcc);
				this.subject(oReplyData.Subject);
				this.textBody(oReplyData.Text);
				this.attachments(oReplyData.Attachments);
				this.inReplyTo(oReplyData.InReplyTo);
				this.references(oReplyData.References);
				break;

			case Enums.ReplyType.ForwardAsAttach:
				oReplyData = SendingUtils.getReplyDataFromMessage(oMessage, this.routeType(), this.senderAccountId(), this.selectedFetcherOrIdentity(), true);
				this.draftInfo(oReplyData.DraftInfo);
				this.draftUid(oReplyData.DraftUid);
				this.inReplyTo(oReplyData.InReplyTo);
				this.references(oReplyData.References);
				break;

			case Enums.ReplyType.Forward:
				SenderSelector.setFetcherOrIdentityByReplyMessage(oMessage);

				oReplyData = SendingUtils.getReplyDataFromMessage(oMessage, this.routeType(), this.senderAccountId(), this.selectedFetcherOrIdentity(), true);

				this.draftInfo(oReplyData.DraftInfo);
				this.draftUid(oReplyData.DraftUid);
				this.setRecipient(this.toAddr, oReplyData.To);
				this.setRecipient(this.ccAddr, oReplyData.Cc);
				this.subject(oReplyData.Subject);
				this.textBody(oReplyData.Text);
				this.attachments(oReplyData.Attachments);
				this.inReplyTo(oReplyData.InReplyTo);
				this.references(oReplyData.References);
				break;

			case Enums.ReplyType.Resend:
				this.setDataFromMessage(oMessage);
				break;

			case 'drafts':
				if (-1 !== $.inArray(oMessage.folder(), MailCache.getCurrentTemplateFolders()))
				{
					this.templateUid(oMessage.uid());
					this.templateFolderName(oMessage.folder());
				}
				else
				{
					var
						oFolderList = MailCache.oFolderListItems[oMessage.accountId()],
						sDraftFolder = oFolderList ? oFolderList.draftsFolderFullName() : ''
					;
					if (sDraftFolder === oMessage.folder())
					{
						this.draftUid(oMessage.uid());
					}
				}
				this.setDataFromMessage(oMessage);
				break;
		}

		if (this.routeType() !== Enums.ReplyType.ForwardAsAttach && this.attachments().length > 0)
		{
			this.requestAttachmentsTempName();
		}

		this.routeType('');
	}

	this.visibleCc(this.ccAddr() !== '');
	this.visibleBcc(this.bccAddr() !== '');
	this.commit(true);

	_.defer(_.bind(function () {
		this.focusAfterFilling();
	}, this));

	if (oMessage)
	{
		var oParams = {
			AccountId: oMessage.accountId(),
			FolderFullName: oMessage.folder(),
			MessageUid: oMessage.uid(),
			Compose: this
		};
		if (this.allAttachmentsUploaded())
		{
			App.broadcastEvent('MailWebclient::ComposeMessageLoaded', oParams);
		}
		else
		{
			var oSubscription = this.allAttachmentsUploaded.subscribe(function () {
				if (this.allAttachmentsUploaded())
				{
					App.broadcastEvent('MailWebclient::ComposeMessageLoaded', oParams);
				}
				oSubscription.dispose();
			}, this);
		}
	}
};

/**
 * @param {Object} oMessage
 */
CComposeView.prototype.setDataFromMessage = function (oMessage)
{
	var
		sTextBody = '',
		oFetcherOrIdentity = SendingUtils.getFirstFetcherOrIdentityByRecipientsOrDefault(oMessage.oFrom.aCollection, oMessage.accountId())
	;

	SenderSelector.changeSenderAccountId(oMessage.accountId(), oFetcherOrIdentity);

	if (oMessage.isPlain())
	{
		sTextBody = oMessage.textRaw();
	}
	else
	{
		sTextBody = oMessage.getConvertedHtml();
	}
	this.draftInfo(oMessage.draftInfo());
	this.inReplyTo(oMessage.inReplyTo());
	this.references(oMessage.references());
	this.setRecipient(this.toAddr, oMessage.oTo.getFull());
	this.setRecipient(this.ccAddr, oMessage.oCc.getFull());
	this.setRecipient(this.bccAddr, oMessage.oBcc.getFull());
	this.subject(oMessage.subject());
	this.attachments(oMessage.attachments());
	this.plainText(oMessage.isPlain());
	this.textBody(sTextBody);
	this.selectedImportance(oMessage.importance());
	this.sendReadingConfirmation(oMessage.readingConfirmationAddressee() !== '');

	var bDraft = !!oMessage.folderObject() && (oMessage.folderObject().type() === Enums.FolderTypes.Drafts);
	this.triggerToolbarControllersAfterPopulatingMessage(bDraft, oMessage.isPlain(), oMessage.textRaw(), oMessage.sensitivity());
};

CComposeView.prototype.triggerToolbarControllersAfterPopulatingMessage = function (bDraft, bPlain, sRawText, iSensitivity)
{
	_.each(this.allControllers(), function (oController) {
		if (_.isFunction(oController.doAfterPopulatingMessage))
		{
			oController.doAfterPopulatingMessage({
				bDraft: bDraft,
				bPlain: bPlain,
				sRawText: sRawText,
				iSensitivity: iSensitivity
			});
		}
	}.bind(this));
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CComposeView.prototype.onDataAsAttachmentUpload = function (oResponse, oRequest)
{
	var
		oParameters = oRequest.Parameters,
		oResult = oResponse.Result,
		sHash = oParameters.Hash,
		oAttachment = _.find(this.attachments(), function (oAttach) {
			return oAttach.hash() === sHash;
		})
	;

	this.messageUploadAttachmentsStarted(false);

	if (oAttachment)
	{
		if (oResult && oResult.Attachment)
		{
			oAttachment.parseFromUpload(oResult.Attachment);
		}
		else
		{
			oAttachment.errorFromUpload();
		}
	}
};

CComposeView.prototype.addAttachments = function (aFiles)
{
	_.each(aFiles, _.bind(function (oFileData) {
		var oAttach = new CAttachmentModel(this.senderAccountId());
		oAttach.parseFromUpload(oFileData);
		this.attachments.push(oAttach);
	}, this));
};

/**
 * @param {Array} aFiles
 */
CComposeView.prototype.addFilesAsAttachment = function (aFiles)
{
	var
		oAttach = null,
		aHashes = []
	;

	_.each(aFiles, function (oFile) {
		oAttach = new CAttachmentModel(this.senderAccountId());
		oAttach.fileName(oFile.fileName());
		oAttach.hash(oFile.hash());
		oAttach.thumbUrlInQueue(oFile.thumbUrlInQueue());
		oAttach.uploadStarted(true);

		this.attachments.push(oAttach);

		aHashes.push(oFile.hash());
	}, this);

	if (aHashes.length > 0)
	{
		this.messageUploadAttachmentsStarted(true);

		CoreAjax.send('Files', 'GetFilesForUpload', { 'Hashes': aHashes }, this.onFilesUpload, this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CComposeView.prototype.onFilesUpload = function (oResponse, oRequest)
{
	var
		oParameters = oRequest.Parameters,
		aResult = oResponse.Result,
		aHashes = oParameters.Hashes
	;

	this.messageUploadAttachmentsStarted(false);
	if (_.isArray(aResult))
	{
		_.each(aResult, function (oFileData) {
			var oAttachment = _.find(this.attachments(), function (oAttach) {
				return oAttach.hash() === oFileData.Hash;
			});

			if (oAttachment)
			{
				oAttachment.parseFromUpload(oFileData);
				oAttachment.hash(oFileData.NewHash);
			}
		}, this);
	}
	else
	{
		_.each(aHashes, function (sHash) {
			var oAttachment = _.find(this.attachments(), function (oAttach) {
				return oAttach.hash() === sHash;
			});

			if (oAttachment)
			{
				oAttachment.errorFromUpload();
			}
		}, this);
	}
};

/**
 * @param {Object} oMessage
 */
CComposeView.prototype.addMessageAsAttachment = function (oMessage)
{
	var
		oAttach = new CAttachmentModel(oMessage.accountId()),
		oParameters = null
	;

	if (oMessage)
	{
		oAttach.fileName(oMessage.subject() + '.eml');
		oAttach.uploadStarted(true);

		this.attachments.push(oAttach);

		oParameters = {
			'AccountID': oMessage.accountId(),
			'MessageFolder': oMessage.folder(),
			'MessageUid': oMessage.uid(),
			'FileName': oAttach.fileName()
		};

		this.messageUploadAttachmentsStarted(true);

		Ajax.send('SaveMessageAsTempFile', oParameters, this.onSaveMessageAsTempFile, this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CComposeView.prototype.onSaveMessageAsTempFile = function (oResponse, oRequest)
{
	var
		oResult = oResponse.Result,
		sFileName = oRequest.Parameters.FileName,
		oAttach = null
	;

	this.messageUploadAttachmentsStarted(false);

	if (oResult)
	{
		oAttach = _.find(this.attachments(), function (oAttach) {
			return oAttach.fileName() === sFileName && oAttach.uploadStarted();
		});

		if (oAttach)
		{
			oAttach.parseFromUpload(oResult, oRequest.Parameters.MessageFolder, oRequest.Parameters.MessageUid);
		}
	}
	else
	{
		oAttach = _.find(this.attachments(), function (oAttach) {
			return oAttach.fileName() === sFileName && oAttach.uploadStarted();
		});

		if (oAttach)
		{
			oAttach.errorFromUpload();
		}
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CComposeView.prototype.onContactVCardUpload = function (oResponse, oRequest)
{
	var
		oParameters = oRequest.Parameters,
		oResult = oResponse.Result,
		oAttach = null
	;

	this.messageUploadAttachmentsStarted(false);

	if (oResult)
	{
		oAttach = _.find(this.attachments(), function (oAttach) {
			return oAttach.fileName() === oResult.Name && oAttach.uploadStarted();
		});

		if (oAttach)
		{
			oAttach.parseFromUpload(oResult);
		}
	}
	else
	{
		oAttach = _.find(this.attachments(), function (oAttach) {
			return oAttach.fileName() === oParameters.Name && oAttach.uploadStarted();
		});

		if (oAttach)
		{
			oAttach.errorFromUpload();
		}
	}
};

CComposeView.prototype.requestAttachmentsTempName = function ()
{
	var
		aHash = _.map(this.attachments(), function (oAttach) {
			oAttach.uploadUid(oAttach.hash());
			oAttach.uploadStarted(true);
			return oAttach.hash();
		})
	;

	if (aHash.length > 0)
	{
		this.messageUploadAttachmentsStarted(true);
		Ajax.send('SaveAttachmentsAsTempFiles', { 'AccountID': this.senderAccountId(), 'Attachments': aHash }, this.onMessageUploadAttachmentsResponse, this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CComposeView.prototype.onMessageUploadAttachmentsResponse = function (oResponse, oRequest)
{
	var aHashes = oRequest.Parameters.Attachments;

	this.messageUploadAttachmentsStarted(false);

	if (oResponse.Result)
	{
		_.each(oResponse.Result, _.bind(this.setAttachTempNameByHash, this));
	}
	else
	{
		_.each(aHashes, function (sHash) {
			var oAttachment = _.find(this.attachments(), function (oAttach) {
				return oAttach.hash() === sHash;
			});

			if (oAttachment)
			{
				oAttachment.errorFromUpload();
			}
		}, this);
		Screens.showError(TextUtils.i18n('MAILWEBCLIENT/ERROR_UPLOAD_FORWARD_ATTACHMENTS'));
	}
};

/**
 * @param {string} sHash
 * @param {string} sTempName
 */
CComposeView.prototype.setAttachTempNameByHash = function (sHash, sTempName)
{
	_.each(this.attachments(), function (oAttach) {
		if (oAttach.hash() === sHash)
		{
			oAttach.tempName(sTempName);
			oAttach.uploadStarted(false);
		}
	});
};

/**
 * @param {Object} oParameters
 */
CComposeView.prototype.setMessageDataInNewTab = function (oParameters)
{
	this.templateUid(oParameters.templateUid);
	this.templateFolderName(oParameters.templateFolderName);
	this.draftInfo(oParameters.draftInfo);
	this.draftUid(oParameters.draftUid);
	this.inReplyTo(oParameters.inReplyTo);
	this.references(oParameters.references);
	this.setRecipient(this.toAddr, oParameters.toAddr);
	this.setRecipient(this.ccAddr, oParameters.ccAddr);
	this.setRecipient(this.bccAddr, oParameters.bccAddr);
	this.subject(oParameters.subject);
	this.attachments(_.map(oParameters.attachments, function (oRawAttach) {
		var oAttach = new CAttachmentModel(oParameters.senderAccountId);
		oAttach.parse(oRawAttach);
		return oAttach;
	}, this));
	this.plainText(oParameters.plainText);
	this.textBody(oParameters.textBody);
	this.selectedImportance(oParameters.selectedImportance);
	this.sendReadingConfirmation(oParameters.sendReadingConfirmation);
	this.changedInPreviousWindow(oParameters.changedInPreviousWindow);

	_.each(this.allControllers(), function (oController) {
		if (_.isFunction(oController.doAfterApplyingMainTabParameters))
		{
			oController.doAfterApplyingMainTabParameters(oParameters);
		}
	});

	SenderSelector.changeSenderAccountId(oParameters.senderAccountId, oParameters.selectedFetcherOrIdentity);
	this.focusedField(oParameters.focusedField);
};

/**
 * @param {boolean=} bOnlyCurrentWindow = false
 */
CComposeView.prototype.commit = function (bOnlyCurrentWindow)
{
	this.toAddr.commit();
	this.ccAddr.commit();
	this.bccAddr.commit();
	this.subject.commit();
	this.selectedImportance.commit();
	this.sendReadingConfirmation.commit();
	_.each(this.allControllers(), function (oController) {
		if (_.isFunction(oController.commit))
		{
			oController.commit();
		}
	});
	this.oHtmlEditor.commit();
	this.attachmentsChanged(false);
	if (!bOnlyCurrentWindow)
	{
		this.changedInPreviousWindow(false);
	}
};

CComposeView.prototype.isChanged = function ()
{
	var
		bToAddrChanged = this.toAddr.changed(),
		bCcAddrChanged = this.ccAddr.changed(),
		bBccAddrChanged = this.bccAddr.changed(),
		bSubjectChanged = this.subject.changed(),
		bImportanceChanged = this.selectedImportance.changed(),
		bReadConfChanged = this.sendReadingConfirmation.changed(),
		bControllersChanged = false,
		bHtmlChanged = this.oHtmlEditor.textChanged(),
		bAttachmentsChanged = this.attachmentsChanged(),
		bChangedInPreviousWindow = this.changedInPreviousWindow()
    ;

	_.each(this.allControllers(), function (oController) {
		if (_.isFunction(oController.isChanged))
		{
			bControllersChanged = bControllersChanged || oController.isChanged();
		}
	});

	return bToAddrChanged || bCcAddrChanged || bBccAddrChanged || bSubjectChanged ||
			bImportanceChanged || bReadConfChanged || bControllersChanged || bHtmlChanged ||
			bAttachmentsChanged || bChangedInPreviousWindow;
};

CComposeView.prototype.executeBackToList = function ()
{
	if (App.isNewTab())
	{
		window.close();
	}
	else if (!!this.shown && this.shown())
	{
		Routing.setPreviousHash();
	}
	this.backToListOnSendOrSave(false);
};

/**
 * Creates new attachment for upload.
 *
 * @param {string} sFileUid
 * @param {Object} oFileData
 */
CComposeView.prototype.onFileUploadSelect = function (sFileUid, oFileData)
{
	var oAttach;

	if (FilesUtils.showErrorIfAttachmentSizeLimit(oFileData.FileName, Types.pInt(oFileData.Size)))
	{
		return false;
	}
	oAttach = new CAttachmentModel(this.senderAccountId());
	oAttach.onUploadSelect(sFileUid, oFileData);
	this.attachments.push(oAttach);

	return true;
};

/**
 * Returns attachment found by uid.
 *
 * @param {string} sFileUid
 */
CComposeView.prototype.getAttachmentByUid = function (sFileUid)
{
	return _.find(this.attachments(), function (oAttach) {
		return oAttach.uploadUid() === sFileUid;
	});
};

/**
 * Finds attachment by uid. Calls it's function to start upload.
 *
 * @param {string} sFileUid
 */
CComposeView.prototype.onFileUploadStart = function (sFileUid)
{
	var oAttach = this.getAttachmentByUid(sFileUid);

	if (oAttach)
	{
		oAttach.onUploadStart();
	}
};

/**
 * Finds attachment by uid. Calls it's function to progress upload.
 *
 * @param {string} sFileUid
 * @param {number} iUploadedSize
 * @param {number} iTotalSize
 */
CComposeView.prototype.onFileUploadProgress = function (sFileUid, iUploadedSize, iTotalSize)
{
	var oAttach = this.getAttachmentByUid(sFileUid);

	if (oAttach)
	{
		oAttach.onUploadProgress(iUploadedSize, iTotalSize);
	}
};

/**
 * Finds attachment by uid. Calls it's function to complete upload.
 *
 * @param {string} sFileUid
 * @param {boolean} bResponseReceived
 * @param {Object} oResult
 */
CComposeView.prototype.onFileUploadComplete = function (sFileUid, bResponseReceived, oResult)
{
	var oAttach = this.getAttachmentByUid(sFileUid);

	if (oAttach)
	{
		oAttach.onUploadComplete(sFileUid, bResponseReceived, oResult);
	}
};

/**
 * Finds attachment by uid. Calls it's function to cancel upload.
 *
 * @param {string} sFileUid
 */
CComposeView.prototype.onFileRemove = function (sFileUid)
{
	var oAttach = this.getAttachmentByUid(sFileUid);

	if (this.oJua)
	{
		this.oJua.cancel(sFileUid);
	}

	this.attachments.remove(oAttach);
};

/**
 * Initializes file uploader.
 */
CComposeView.prototype.initUploader = function ()
{
	// this.oJua must be re-initialized because compose popup is destroyed after it is closed
	if (this.composeShown() && this.composeUploaderButton())
	{
		this.oJua = new CJua({
			'action': '?/Api/',
			'name': 'jua-uploader',
			'queueSize': 2,
			'clickElement': this.composeUploaderButton(),
			'hiddenElementsPosition': UserSettings.IsRTL ? 'right' : 'left',
			'dragAndDropElement': this.composeUploaderDropPlace(),
			'disableAjaxUpload': false,
			'disableFolderDragAndDrop': false,
			'disableDragAndDrop': false,
			'hidden': _.extendOwn({
				'Module': Settings.ServerModuleName,
				'Method': 'UploadAttachment',
				'Parameters':  function () {
					return JSON.stringify({
						'AccountID': MailCache.currentAccountId()
					});
				}
			}, App.getCommonRequestParameters())
		});

		this.oJua
			.on('onDragEnter', _.bind(this.composeUploaderDragOver, this, true))
			.on('onDragLeave', _.bind(this.composeUploaderDragOver, this, false))
			.on('onBodyDragEnter', _.bind(this.composeUploaderBodyDragOver, this, true))
			.on('onBodyDragLeave', _.bind(this.composeUploaderBodyDragOver, this, false))
			.on('onProgress', _.bind(this.onFileUploadProgress, this))
			.on('onSelect', _.bind(this.onFileUploadSelect, this))
			.on('onStart', _.bind(this.onFileUploadStart, this))
			.on('onComplete', _.bind(this.onFileUploadComplete, this))
		;

		this.allowDragNDrop(this.oJua.isDragAndDropSupported());
	}
};

/**
 * @param {boolean} bRemoveSignatureAnchor
 * @param {boolean} bSaveTemplate
 */
CComposeView.prototype.getSendSaveParameters = function (bRemoveSignatureAnchor, bSaveTemplate)
{
	var
		oAttachments = SendingUtils.convertAttachmentsForSending(this.attachments()),
		oParameters = null
	;

	_.each(this.oHtmlEditor.getUploadedImagesData(), function (oAttach) {
		oAttachments[oAttach.TempName] = [oAttach.Name, oAttach.CID, '1', '1'];
	});

	oParameters = {
		'AccountID': this.senderAccountId(),
		'IdentityID': this.selectedFetcherOrIdentity() && this.selectedFetcherOrIdentity().IDENTITY ? this.selectedFetcherOrIdentity().id() : '',
		'AliasID': this.selectedFetcherOrIdentity() && this.selectedFetcherOrIdentity().ALIAS ? this.selectedFetcherOrIdentity().id() : '',
		'FetcherID': this.selectedFetcherOrIdentity() && this.selectedFetcherOrIdentity().FETCHER ? this.selectedFetcherOrIdentity().id() : '',
		'DraftInfo': this.draftInfo(),
		'DraftUid': this.draftUid(),
		'To': this.toAddr(),
		'Cc': this.ccAddr(),
		'Bcc': this.bccAddr(),
		'Subject': this.subject(),
		'Text': this.plainText() ? this.oHtmlEditor.getPlainText() : this.oHtmlEditor.getText(bRemoveSignatureAnchor),
		'IsHtml': !this.plainText(),
		'Importance': this.selectedImportance(),
		'SendReadingConfirmation': this.sendReadingConfirmation(),
		'Attachments': oAttachments,
		'InReplyTo': this.inReplyTo(),
		'References': this.references()
	};

	_.each(this.allControllers(), function (oController) {
		if (_.isFunction(oController.doAfterPreparingSendMessageParameters))
		{
			oController.doAfterPreparingSendMessageParameters(oParameters);
		}
	});

	if (this.templateFolderName() !== '' && bSaveTemplate)
	{
		oParameters.DraftFolder = this.templateFolderName();
		oParameters.DraftUid = this.templateUid();
	}

	return oParameters;
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CComposeView.prototype.onSendOrSaveMessageResponse = function (oResponse, oRequest)
{
	var
		oResData = SendingUtils.onSendOrSaveMessageResponse(oResponse, oRequest, this.requiresPostponedSending()),
		oParameters = oRequest.Parameters
	;

	this.commit();

	switch (oResData.Method)
	{
		case 'SaveMessage':
            if (oResData.Result && oParameters.DraftUid === this.templateUid() && oParameters.DraftFolder === this.templateFolderName())
            {
				this.templateUid(Types.pString(oResData.NewUid));
                if (this.composeShown() && this instanceof CComposeView)// it is screen, not popup
                {
					Routing.replaceHashDirectly(LinksUtils.getComposeFromMessage('drafts', MailCache.currentAccountId(), oParameters.DraftFolder, this.templateUid()));
                }
            }
			else if (oResData.Result && oParameters.DraftUid === this.draftUid())
			{
				this.draftUid(Types.pString(oResData.NewUid));
				if (this.composeShown() && this instanceof CComposeView)// it is screen, not popup
				{
					Routing.replaceHashDirectly(LinksUtils.getComposeFromMessage('drafts', MailCache.currentAccountId(), oParameters.DraftFolder, this.draftUid()));
				}
			}
			this.saving(false);
			break;
		case 'SendMessage':
			if (oResData.Result)
			{
				if (this.backToListOnSendOrSave())
				{
					if (_.isFunction(this.closePopup))
					{
						this.closePopup();
					}
					else
					{
						this.executeBackToList();
					}
				}
			}
			this.sending(false);
			break;
	}
};

CComposeView.prototype.verifyDataForSending = function ()
{
	var
		aToIncorrect = AddressUtils.getIncorrectEmailsFromAddressString(this.toAddr()),
		aCcIncorrect = AddressUtils.getIncorrectEmailsFromAddressString(this.ccAddr()),
		aBccIncorrect = AddressUtils.getIncorrectEmailsFromAddressString(this.bccAddr()),
		aIncorrect = _.union(aToIncorrect, aCcIncorrect, aBccIncorrect),
		aEncodedIncorrect = _.map(aIncorrect, function (sIncorrect) {
			return TextUtils.encodeHtml(sIncorrect);
		}),
		sWarning = TextUtils.i18n('MAILWEBCLIENT/ERROR_INPUT_CORRECT_EMAILS') + aEncodedIncorrect.join(', ')
	;

	if (aIncorrect.length > 0)
	{
		Popups.showPopup(AlertPopup, [sWarning]);
		return false;
	}

	return true;
};

/**
 * @param {mixed} mParam
 */
CComposeView.prototype.executeSend = function (mParam)
{
	var
		bCancelSend = false,
		fContinueSending = _.bind(function () {
			this.sending(true);
			this.requiresPostponedSending(!this.allowStartSending());

			SendingUtils.send('SendMessage', this.getSendSaveParameters(true), true, this.onSendOrSaveMessageResponse, this, this.requiresPostponedSending());

			this.backToListOnSendOrSave(true);
		}, this)
	;

	if (this.autoEncryptSignMessage())
	{
		this.encryptSignAndSend();
	}
	else if (this.isEnableSending() && this.verifyDataForSending())
	{
		_.each(this.allControllers(), function (oController) {
			if (_.isFunction(oController.doBeforeSend))
			{
				bCancelSend = bCancelSend || oController.doBeforeSend(fContinueSending);
			}
		});

		if (!bCancelSend)
		{
			fContinueSending();
		}
	}
};

CComposeView.prototype.executeSaveCommand = function ()
{
	if (this.draftFolderIsAvailable())
	{
		this.executeSave(false);
	}
};

CComposeView.prototype.executeTemplateSaveCommand = function ()
{
    this.executeSave(false, true, true);
};

/**
 * @param {boolean=} bAutosave = false
 * @param {boolean=} bWaitResponse = true
 * @param {boolean=} bSaveTemplate = false
 */
CComposeView.prototype.executeSave = function (bAutosave, bWaitResponse, bSaveTemplate)
{
	bAutosave = !!bAutosave;
	bWaitResponse = (bWaitResponse === undefined) ? true : bWaitResponse;
	bSaveTemplate = !!bSaveTemplate;

	var
		fOnSaveMessageResponse = bWaitResponse ? this.onSendOrSaveMessageResponse : SendingUtils.onSendOrSaveMessageResponse,
		oContext = bWaitResponse ? this : SendingUtils,
		fSave = _.bind(function (bSave) {
			if (bSave)
			{
				this.saving(bWaitResponse);
				SendingUtils.send('SaveMessage', this.getSendSaveParameters(false, bSaveTemplate), !bAutosave, fOnSaveMessageResponse, oContext);
			}
		}, this),
		bCancelSaving = false
	;

	if (this.isEnableSaving())
	{
		if (!bAutosave || this.isChanged())
		{
			if (!bAutosave)
			{
				_.each(this.allControllers(), function (oController) {
					if (_.isFunction(oController.doBeforeSave))
					{
						bCancelSaving = bCancelSaving || oController.doBeforeSave(fSave);
					}
				}, this);
			}
			if (!bCancelSaving)
			{
				fSave(true);
			}
		}

		this.backToListOnSendOrSave(true);
	}
};

/**
 * Changes visibility of bcc field.
 */
CComposeView.prototype.changeBccVisibility = function ()
{
	this.visibleBcc(!this.visibleBcc());

	if (this.visibleBcc())
	{
		this.focusBccAddr();
	}
	else
	{
		this.focusToAddr();
	}

};

/**
 * Changes visibility of bcc field.
 */
CComposeView.prototype.changeCcVisibility = function ()
{
	this.visibleCc(!this.visibleCc());

	if (this.visibleCc())
	{
		this.focusCcAddr();
	}
	else
	{
		this.focusToAddr();
	}
};

CComposeView.prototype.getMessageDataForNewTab = function ()
{
	var
		aAttachments = _.map(this.attachments(), function (oAttach)
		{
			return {
				'@Object': 'Object/Aurora\\Modules\\Mail\\Classes\\Attachment',
				'FileName': oAttach.fileName(),
				'TempName': oAttach.tempName(),
				'MimeType': oAttach.mimeType(),
				'MimePartIndex': oAttach.mimePartIndex(),
				'EstimatedSize': oAttach.size(),
				'CID': oAttach.cid(),
				'ContentLocation': oAttach.contentLocation(),
				'IsInline': oAttach.inline(),
				'IsLinked': oAttach.linked(),
				'Hash': oAttach.hash()
			};
		}),
		oParameters = null
	;

	oParameters = {
		accountId: this.senderAccountId(),
        templateUid: this.templateUid(),
		templateFolderName: this.templateFolderName(),
		draftInfo: this.draftInfo(),
		draftUid: this.draftUid(),
		inReplyTo: this.inReplyTo(),
		references: this.references(),
		senderAccountId: this.senderAccountId(),
		selectedFetcherOrIdentity: this.selectedFetcherOrIdentity(),
		toAddr: this.toAddr(),
		ccAddr: this.ccAddr(),
		bccAddr: this.bccAddr(),
		subject: this.subject(),
		attachments: aAttachments,
		plainText: this.plainText(),
		textBody: this.plainText() ? this.oHtmlEditor.getPlainText() : this.oHtmlEditor.getText(),
		selectedImportance: this.selectedImportance(),
		sendReadingConfirmation: this.sendReadingConfirmation(),
		changedInPreviousWindow: this.isChanged(),
		focusedField: this.focusedField()
	};

	_.each(this.allControllers(), function (oController) {
		if (_.isFunction(oController.doAfterPreparingMainTabParameters))
		{
			oController.doAfterPreparingMainTabParameters(oParameters);
		}
	});

	return oParameters;
};

CComposeView.prototype.openInNewWindow = function ()
{
	var
		sWinName = 'id' + Math.random().toString(),
		oMessageParametersFromCompose = {},
		oWin = null,
		sHash = Routing.buildHashFromArray(LinksUtils.getCompose())
	;

	this.ignoreHasUnsavedChanges(true);
	oMessageParametersFromCompose = this.getMessageDataForNewTab();

	if (this.draftUid().length > 0 && !this.isChanged())
	{
		sHash = Routing.buildHashFromArray(LinksUtils.getComposeFromMessage('drafts', MailCache.currentAccountId(), MailCache.folderList().draftsFolderFullName(), this.draftUid(), true));
		oWin = WindowOpener.openTab('?message-newtab' + sHash);
	}
    else if (this.templateUid().length > 0 && !this.isChanged())
    {
		sHash = Routing.buildHashFromArray(LinksUtils.getComposeFromMessage('drafts', MailCache.currentAccountId(), this.templateFolderName(), this.templateUid(), true));
		oWin = WindowOpener.openTab('?message-newtab' + sHash);
    }
	else if (!this.isChanged())
	{
		if (this.routeParams().length > 0)
		{
			sHash = Routing.buildHashFromArray(_.union([Settings.HashModuleName + '-compose'], this.routeParams()));
		}
		oWin = WindowOpener.openTab('?message-newtab' + sHash);
	}
	else
	{
		MainTabExtMethods.passComposedMessage(sWinName, oMessageParametersFromCompose);
		oWin = WindowOpener.openTab('?message-newtab' + sHash, sWinName);
	}

	this.commit();

	if (_.isFunction(this.closePopup))
	{
		this.closePopup();
	}
	else
	{
		this.executeBackToList();
	}
};

CComposeView.prototype.onShowFilesPopupClick = function ()
{
	if (this.bAllowFiles)
	{
		Popups.showPopup(SelectFilesPopup, [_.bind(this.addFilesAsAttachment, this)]);
	}
};

CComposeView.prototype.registerOwnToolbarControllers = function ()
{
	this.registerToolbarController({
		ViewTemplate: 'MailWebclient_Compose_BackButtonView',
		sId: 'back',
		bOnlyMobile: true,
		backToListCommand: this.backToListCommand
	});
	this.registerToolbarController({
		ViewTemplate: 'MailWebclient_Compose_SendButtonView',
		sId: 'send',
		bAllowMobile: true,
		sendCommand: this.sendCommand,
		toolbarControllers: ko.computed(function () {
			return _.filter(this.toolbarControllers(), function (oController) {
				return oController.bSendButton;
			})
		}, this)
	});
	this.registerToolbarController({
		ViewTemplate: 'MailWebclient_Compose_SaveButtonView',
		sId: 'save',
		bAllowMobile: true,
		visible: this.draftFolderIsAvailable,
		saveCommand: this.saveCommand
	});
	this.registerToolbarController({
		ViewTemplate: 'MailWebclient_Compose_SaveTemplateButtonView',
		sId: 'save-template',
		bAllowMobile: false,
		visible: this.visibleSaveTemplateControl,
		saveTemplateCommand: this.saveTemplateCommand
	});
	this.registerToolbarController({
		ViewTemplate: 'MailWebclient_Compose_ImportanceDropdownView',
		sId: 'importance',
		selectedImportance: this.selectedImportance
	});
	this.registerToolbarController({
		ViewTemplate: 'MailWebclient_Compose_ConfirmationCheckboxView',
		sId: 'confirmation',
		sendReadingConfirmation: this.sendReadingConfirmation
	});
};

/**
 * @param {Object} oController
 */
CComposeView.prototype.registerToolbarController = function (oController)
{
	var
		bAllowRegister = App.isMobile() ? oController.bAllowMobile : !oController.bOnlyMobile,
		iLastIndex = Settings.ComposeToolbarOrder.length
	;

	if (bAllowRegister)
	{
		oController.bSendButton = !!oController.bSendButton;
		this.toolbarControllers.push(oController);
		this.toolbarControllers(_.sortBy(this.toolbarControllers(), function (oContr) {
			var iIndex = _.indexOf(Settings.ComposeToolbarOrder, oContr.sId);
			return iIndex !== -1 ? iIndex : iLastIndex;
		}));
		if (_.isFunction(oController.assignComposeExtInterface))
		{
			oController.assignComposeExtInterface(this.getExtInterface());
		}
	}
};

CComposeView.prototype.registerMessageRowController = function (oController)
{
	var bAllowRegister = App.isMobile() ? oController.bAllowMobile : !oController.bOnlyMobile;
	if (bAllowRegister)
	{
		this.messageRowControllers.push(oController);
		if (_.isFunction(oController.assignComposeExtInterface))
		{
			oController.assignComposeExtInterface(this.getExtInterface());
		}
	}
};

/**
 * @returns {Object}
 */
CComposeView.prototype.getExtInterface = function ()
{
	return {
		isHtml: _.bind(function () {
			return !this.plainText();
		}, this),
		hasAttachments: _.bind(function () {
			return this.notInlineAttachments().length > 0;
		}, this),
		getPlainText: _.bind(this.oHtmlEditor.getPlainText, this.oHtmlEditor),
		koTextChange: this.oHtmlEditor.textChanged,
		getFromEmail: _.bind(function () {
			return this.selectedFetcherOrIdentity() ? this.selectedFetcherOrIdentity().email() : AccountList.getEmail();
		}, this),
		getRecipientEmails: _.bind(function () {
			return this.recipientEmails();
		}, this),
		getSelectedSender: _.bind(this.selectedSender, this),
		saveSilently: _.bind(this.executeSave, this, true),
		setPlainTextMode: _.bind(this.plainText, this, true),
		setPlainText: _.bind(function (sText) {
			this.textBody(sText);
		}, this),
		setHtmlTextMode: _.bind(this.plainText, this, false),
		setHtmlText: _.bind(function (sHtml) {
			this.textBody(sHtml);
		}, this),
		undoHtml: _.bind(this.oHtmlEditor.undoAndClearRedo, this.oHtmlEditor),
		getSubject: _.bind(function () {
			return this.subject();
		}, this),
		koSubject: this.subject,
		getAutoEncryptSignMessage: function () {
			return this.autoEncryptSignMessage();
		}.bind(this),
		getRecipientsEmpty: function () {
			return this.toAddr().length === 0 && this.ccAddr().length === 0 && this.bccAddr().length === 0;
		}.bind(this),
		getSendSaveParameters: function () {
			return this.getSendSaveParameters();
		}.bind(this),
		isEnableSending: function () {
			return this.isEnableSending();
		}.bind(this),
		isEnableSaving: function () {
			return this.isEnableSaving();
		}.bind(this),
		getDraftFolderFullName: function (iAccountID) {
			var oFolderList = MailCache.oFolderListItems[iAccountID];
			return oFolderList ? oFolderList.draftsFolderFullName() : '';
		},
		koAllAttachmentsUploaded: this.allAttachmentsUploaded,
		clearFolderCache: function (iAccountId, sDraftFolder) {
			if (MainTab)
			{
				MainTab.removeMessagesFromCacheForFolder(iAccountId, sDraftFolder);
			}
			else
			{
				MailCache.removeMessagesFromCacheForFolder(iAccountId, sDraftFolder);
			}
		},
		commitAndClose: function () {
			this.commit();
			if (_.isFunction(this.closePopup))
			{
				this.closePopup();
			}
			else
			{
				this.executeBackToList();
			}
		}.bind(this)
	};
};

module.exports = CComposeView;


/***/ }),

/***/ "Nfk5":
/*!**********************************************************!*\
  !*** ./modules/MailWebclient/js/models/CMessageModel.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	moment = __webpack_require__(/*! moment */ "wd/R"),

	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	UrlUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Url.js */ "ZP6a"),

	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ "SQrT"),

	CAddressListModel = __webpack_require__(/*! modules/CoreWebclient/js/models/CAddressListModel.js */ "KARm"),
	CDateModel = __webpack_require__(/*! modules/CoreWebclient/js/models/CDateModel.js */ "5hOJ"),

	MessageUtils = __webpack_require__(/*! modules/MailWebclient/js/utils/Message.js */ "zu1m"),

	AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm"),
	MailCache = null,
	MessagesDictionary = __webpack_require__(/*! modules/MailWebclient/js/MessagesDictionary.js */ "xzvH"),
	Settings = __webpack_require__(/*! modules/MailWebclient/js/Settings.js */ "p2hp"),

	CAttachmentModel = __webpack_require__(/*! modules/MailWebclient/js/models/CAttachmentModel.js */ "XTZw")
;

/**
 * @constructor
 */
function CMessageModel()
{
	this.accountId = ko.observable(AccountList.currentId());
	this.accountEmail = ko.computed(function () {
		var oAccount = AccountList.getAccount(this.accountId());
		return oAccount ? oAccount.email() : '';
	}, this);
	this.showUnifiedMailboxLabel = ko.observable('');
	this.unifiedMailboxLabelText = ko.observable('');
	this.unifiedMailboxLabelColor = ko.observable('');
	ko.computed(function () {
		var oAccount = this.accountId ? AccountList.getAccount(this.accountId()) : null;
		if (oAccount)
		{
			this.showUnifiedMailboxLabel(oAccount.showUnifiedMailboxLabel());
			this.unifiedMailboxLabelText(oAccount.unifiedMailboxLabelText() || oAccount.email());
			this.unifiedMailboxLabelColor(oAccount.unifiedMailboxLabelColor());
		}
	}, this);
	this.folder = ko.observable('');
	this.uid = ko.observable('');
	this.unifiedUid = ko.observable('');
	this.sUniq = '';

	this.subject = ko.observable('');
	this.emptySubject = ko.computed(function () {
		return ($.trim(this.subject()) === '');
	}, this);
	this.subjectForDisplay = ko.computed(function () {
		return this.emptySubject() ? TextUtils.i18n('MAILWEBCLIENT/LABEL_NO_SUBJECT') : this.subject();
	}, this);
	this.messageId = ko.observable('');
	this.size = ko.observable(0);
	this.friendlySize = ko.computed(function () {
		return TextUtils.getFriendlySize(this.size());
	}, this);
	this.textSize = ko.observable(0);
	this.oDateModel = new CDateModel();
	this.fullDate = ko.observable('');
	this.oFrom = new CAddressListModel();
	this.fullFrom = ko.observable('');
	this.oTo = new CAddressListModel();
	this.to = ko.observable('');
	this.fromOrToText = ko.observable('');
	this.oCc = new CAddressListModel();
	this.cc = ko.observable('');
	this.oBcc = new CAddressListModel();
	this.bcc = ko.observable('');
	this.oReplyTo = new CAddressListModel();

	this.seen = ko.observable(false);

	this.flagged = ko.observable(false);
	this.partialFlagged = ko.observable(false);
	this.answered = ko.observable(false);
	this.forwarded = ko.observable(false);
	this.hasAttachments = ko.observable(false);
	this.hasIcalAttachment = ko.observable(false);
	this.hasVcardAttachment = ko.observable(false);

	this.folderObject = ko.computed(function () {
		this.requireMailCache();
		return MailCache.getFolderByFullName(this.accountId(), this.folder());
	}, this);
	this.threadsAllowed = ko.computed(function () {
		var
			oAccount = AccountList.getAccount(this.accountId()),
			oFolder = this.folderObject(),
			bFolderWithoutThreads = oFolder && (oFolder.type() === Enums.FolderTypes.Drafts ||
				oFolder.type() === Enums.FolderTypes.Spam || oFolder.type() === Enums.FolderTypes.Trash)
		;
		return oAccount && oAccount.threadingIsAvailable() && !bFolderWithoutThreads;
	}, this);
	this.otherSendersAllowed = ko.computed(function () {
		var oFolder = this.folderObject();
		return oFolder && (oFolder.type() !== Enums.FolderTypes.Drafts) && (oFolder.type() !== Enums.FolderTypes.Sent);
	}, this);

	this.threadPart = ko.observable(false);
	this.threadPart.subscribe(function () {
		if (this.threadPart())
		{
			this.partialFlagged(false);
		}
	}, this);
	this.threadParentUid = ko.observable('');

	this.threadUids = ko.observableArray([]);
	this.threadCount = ko.computed(function () {
		return this.threadUids().length;
	}, this);
	this.threadUnreadCount = ko.observable(0);
	this.threadOpened = ko.observable(false);
	this.threadLoading = ko.observable(false);
	this.threadLoadingVisible = ko.computed(function () {
		return this.threadsAllowed() && this.threadOpened() && this.threadLoading();
	}, this);
	this.threadCountVisible = ko.computed(function () {
		return this.threadsAllowed() && this.threadCount() > 0 && !this.threadLoading();
	}, this);
	this.threadCountHint = ko.computed(function () {
		if (this.threadCount() > 0)
		{
			if (this.threadOpened())
			{
				return  TextUtils.i18n('MAILWEBCLIENT/ACTION_FOLD_THREAD');
			}
			else
			{
				if (this.threadUnreadCount() > 0)
				{
					return  TextUtils.i18n('MAILWEBCLIENT/ACTION_UNFOLD_THREAD_WITH_UNREAD', {}, null, this.threadUnreadCount());
				}
				else
				{
					return  TextUtils.i18n('MAILWEBCLIENT/ACTION_UNFOLD_THREAD');
				}
			}
		}
		return '';
	}, this);
	this.threadCountForLoad = ko.observable(5);
	this.threadNextLoadingVisible = ko.observable(false);
	this.threadNextLoadingLinkVisible = ko.observable(false);
	this.threadFunctionLoadNext = null;
	this.threadShowAnimation = ko.observable(false);
	this.threadHideAnimation = ko.observable(false);

	this.importance = ko.observable(Enums.Importance.Normal);
	this.draftInfo = ko.observableArray([]);
	this.hash = ko.observable('');
	this.sDownloadAsEmlUrl = '';

	this.completelyFilled = ko.observable(false);
	this.iLastAccessTime = 0;
	this.updateLastAccessTime();

	this.checked = ko.observable(false);
	this.checked.subscribe(function (bChecked) {
		this.requireMailCache();
		if (!this.threadOpened() && MailCache.useThreadingInCurrentList())
		{
			var
				oFolder = MailCache.getFolderByFullName(this.accountId(), this.folder())
			;
			_.each(this.threadUids(), function (sUid) {
				var oMessage = MessagesDictionary.get([oFolder.iAccountId, oFolder.fullName(), sUid]);
				if (oMessage)
				{
					oMessage.checked(bChecked);
				}
			});
		}
	}, this);
	this.selected = ko.observable(false);
	this.deleted = ko.observable(false); // temporary removal until it was confirmation from the server to delete

	this.truncated = ko.observable(false);
	this.inReplyTo = ko.observable('');
	this.references = ko.observable('');
	this.readingConfirmationAddressee = ko.observable('');
	this.sensitivity = ko.observable(Enums.Sensitivity.Nothing);
	this.isPlain = ko.observable(false);
	this.text = ko.observable('');
	this.textBodyForNewWindow = ko.observable('');
	this.$text = null;
	this.rtl = ko.observable(false);
	this.hasExternals = ko.observable(false);
	this.isExternalsShown = ko.observable(false);
	this.isExternalsAlwaysShown = ko.observable(false);
	this.foundCids = ko.observableArray([]);
	this.attachments = ko.observableArray([]);
	this.safety = ko.observable(false);
	this.sourceHeaders = ko.observable('');

	this.date = ko.observable('');

	this.textRaw = ko.observable('');

	this.domMessageForPrint = ko.observable(null);

	this.notInlineAttachments = ko.computed(function () {
		return _.filter(this.attachments(), function (oAttach) {
			return !oAttach.linked();
		});
	}, this);

	this.Custom = {};

	this.customLabels = ko.observableArray([]);
}

CMessageModel.prototype.setCustomLabel = function (sId, sText, sCssClass)
{
	if (Types.isString(sId) && Types.isNonEmptyString(sText) && Types.isString(sCssClass))
	{
		var oCustomLabel = _.find(this.customLabels(), function (oCustomLabel) {
			return oCustomLabel.id === sId;
		});
		if (oCustomLabel)
		{
			oCustomLabel.text = sText;
			oCustomLabel.cssClass = sCssClass;
		}
		else
		{
			this.customLabels.push({
				id: sId,
				text: sText,
				cssClass: sCssClass,
			});
		}
	}
}

CMessageModel.prototype.removeCustomLabel = function (sId)
{
	this.customLabels(_.filter(this.customLabels(), function (oCustomLabel) {
		return oCustomLabel.id !== sId;
	}));
}

CMessageModel.prototype.requireMailCache = function ()
{
	if (MailCache === null)
	{
		MailCache = __webpack_require__(/*! modules/MailWebclient/js/Cache.js */ "4+IO");
	}
};

/**
 * Updates last access time of the message and last access time of all messages in thread.
 */
CMessageModel.prototype.updateLastAccessTime = function ()
{
	this.iLastAccessTime = moment().unix();
	_.each(this.threadUids(), function (sUid) {
		var oMessage = MessagesDictionary.get([this.accountId(), this.folder(), sUid]);
		if (oMessage)
		{
			oMessage.updateLastAccessTime();
		}
	}, this);
};

/**
 * @param {Object} oWin
 */
CMessageModel.prototype.viewMessage = function (oWin)
{
	var
		oDomText = this.getDomText(UrlUtils.getAppPath()),
		sHtml = ''
	;

	this.textBodyForNewWindow(oDomText.html());
	sHtml = $(this.domMessageForPrint()).html();

	if (oWin)
	{
		$(oWin.document.body).html(sHtml);
		oWin.focus();
		_.each(this.attachments(), function (oAttach) {
			var oLink = $(oWin.document.body).find("[data-hash='download-" + oAttach.hash() + "']");
			if (oAttach.hasAction('download'))
			{
				oLink.on('click', _.bind(oAttach.executeAction, oAttach, 'download'));
			}
			else
			{
				oLink.hide();
			}

			oLink = $(oWin.document.body).find("[data-hash='view-" + oAttach.hash() + "']");
			if (oAttach.hasAction('view'))
			{
				oLink.on('click', _.bind(oAttach.executeAction, oAttach, 'view'));
			}
			else
			{
				oLink.hide();
			}
		}, this);
	}
};

/**
 * Fields accountId, folder, oTo & oFrom should be filled.
 */
CMessageModel.prototype.fillFromOrToText = function ()
{
	this.requireMailCache();
	var oFolder = MailCache.getFolderByFullName(this.accountId(), this.folder());

	if (oFolder && (oFolder.type() === Enums.FolderTypes.Drafts || oFolder.type() === Enums.FolderTypes.Sent))
	{
		var
			sMeRecipientReplacement = Settings.UseMeRecipientForMessages ? TextUtils.i18n('MAILWEBCLIENT/LABEL_ME_RECIPIENT') : null,
			sToDisplay = this.oTo.getDisplay(sMeRecipientReplacement, this.accountEmail()),
			sCcDisplay = this.oCc.getDisplay(sMeRecipientReplacement, this.accountEmail()),
			sBccDisplay = this.oBcc.getDisplay(sMeRecipientReplacement, this.accountEmail()),
			aDisplay = []
		;
		if (Types.isNonEmptyString(sToDisplay)) {
			aDisplay.push(sToDisplay);
		}
		if (Types.isNonEmptyString(sCcDisplay)) {
			aDisplay.push(sCcDisplay);
		}
		if (Types.isNonEmptyString(sBccDisplay)) {
			aDisplay.push(sBccDisplay);
		}
		this.fromOrToText(aDisplay);
	}
	else
	{
		var sMeSenderReplacement = Settings.UseMeRecipientForMessages ? TextUtils.i18n('MAILWEBCLIENT/LABEL_ME_SENDER') : null;
		this.fromOrToText(this.oFrom.getDisplay(sMeSenderReplacement, this.accountEmail()));
	}
};

/**
 * @param {Array} aChangedThreadUids
 * @param {number} iLoadedMessagesCount
 */
CMessageModel.prototype.changeThreadUids = function (aChangedThreadUids, iLoadedMessagesCount)
{
	this.threadUids(aChangedThreadUids);
	this.threadLoading(iLoadedMessagesCount < Math.min(this.threadUids().length, this.threadCountForLoad()));
};

/**
 * @param {Function} fLoadNext
 */
CMessageModel.prototype.showNextLoadingLink = function (fLoadNext)
{
	if (this.threadNextLoadingLinkVisible())
	{
		this.threadNextLoadingVisible(true);
		this.threadFunctionLoadNext = fLoadNext;
	}
};

CMessageModel.prototype.increaseThreadCountForLoad = function ()
{
	this.threadCountForLoad(this.threadCountForLoad() + 5);
	this.requireMailCache();
	MailCache.showOpenedThreads(this.folder());
};

CMessageModel.prototype.loadNextMessages = function ()
{
	if (this.threadFunctionLoadNext)
	{
		this.threadFunctionLoadNext();
		this.threadNextLoadingLinkVisible(false);
		this.threadFunctionLoadNext = null;
	}
};

/**
 * @param {number} iShowThrottle
 * @param {string} sParentUid
 */
CMessageModel.prototype.markAsThreadPart = function (iShowThrottle, sParentUid)
{
	var self = this;

	this.threadPart(true);
	this.threadParentUid(sParentUid);
	this.threadUids([]);
	this.threadNextLoadingVisible(false);
	this.threadNextLoadingLinkVisible(true);
	this.threadFunctionLoadNext = null;
	this.threadHideAnimation(false);

	setTimeout(function () {
		self.threadShowAnimation(true);
	}, iShowThrottle);
};

/**
 * @param {AjaxMessageResponse} oData
 * @param {number} iAccountId
 * @param {boolean} bThreadPart
 * @param {boolean} bTrustThreadInfo
 */
CMessageModel.prototype.parse = function (oData, iAccountId, bThreadPart, bTrustThreadInfo)
{
	var
		sHtml = '',
		sPlain = ''
	;

	if (bTrustThreadInfo)
	{
		this.threadPart(bThreadPart);
	}
	if (!this.threadPart())
	{
		this.threadParentUid('');
	}

	if (oData['@Object'] === 'Object/MessageListItem')
	{
		this.seen(!!oData.IsSeen);
		this.flagged(!!oData.IsFlagged);
		this.answered(!!oData.IsAnswered);
		this.forwarded(!!oData.IsForwarded);

		if (oData.Custom)
		{
			this.Custom = oData.Custom;
		}
	}

	if (oData['@Object'] === 'Object/Message' || oData['@Object'] === 'Object/MessageListItem')
	{
		this.Custom.Sensitivity = oData.Sensitivity;

		this.accountId(iAccountId);
		this.folder(oData.Folder);
		this.uid(Types.pString(oData.Uid));
		if (Types.isNonEmptyString(oData.UnifiedUid))
		{
			this.unifiedUid(oData.UnifiedUid);
		}
		if (Types.isNonEmptyString(oData.UnifiedUid))
		{
			var aParts = oData.UnifiedUid.split(':');
			this.accountId(Types.pInt(aParts[0]));
		}
		this.sUniq = this.accountId() + this.folder() + this.uid();

		this.subject(Types.pString(oData.Subject));
		this.messageId(Types.pString(oData.MessageId));
		this.size(oData.Size);
		this.textSize(oData.TextSize);
		this.oDateModel.parse(oData.TimeStampInUTC);
		this.oFrom.parse(oData.From);
		this.oTo.parse(oData.To);
		this.oCc.parse(oData.Cc);
		this.oBcc.parse(oData.Bcc);
		this.oReplyTo.parse(oData.ReplyTo);
		this.fillFromOrToText();

		this.fullDate(this.oDateModel.getFullDate());
		this.fullFrom(this.oFrom.getFull());
		this.to(this.oTo.getFull());
		this.cc(this.oCc.getFull());
		this.bcc(this.oBcc.getFull());

		this.hasAttachments(!!oData.HasAttachments);
		this.hasIcalAttachment(!!oData.HasIcalAttachment);
		this.hasVcardAttachment(!!oData.HasVcardAttachment);

		if (oData['@Object'] === 'Object/MessageListItem' && bTrustThreadInfo)
		{
			this.threadUids(_.map(oData.Threads, function (iUid) {
				return iUid.toString();
			}, this));
		}

		this.importance(Types.pInt(oData.Importance));
		if (!Enums.has('Importance', this.importance()))
		{
			this.importance(Enums.Importance.Normal);
		}
		this.sensitivity(Types.pInt(oData.Sensitivity));
		if (!Enums.has('Sensitivity', this.sensitivity()))
		{
			this.sensitivity(Enums.Sensitivity.Nothing);
		}
		if (_.isArray(oData.DraftInfo))
		{
			this.draftInfo(oData.DraftInfo);
		}
		this.hash(Types.pString(oData.Hash));
		this.sDownloadAsEmlUrl = Types.pString(oData.DownloadAsEmlUrl);

		if (oData['@Object'] === 'Object/Message')
		{
			this.truncated(oData.Truncated);
			this.inReplyTo(oData.InReplyTo);
			this.references(oData.References);
			this.readingConfirmationAddressee(Types.pString(oData.ReadingConfirmationAddressee));
			sHtml = Types.pString(oData.Html);
			sPlain = Types.pString(oData.Plain);
			if (sHtml !== '')
			{
				this.textRaw(oData.HtmlRaw);
				this.text(sHtml);
				this.isPlain(false);
			}
			else
			{
				this.textRaw(oData.PlainRaw);
				this.text(sPlain !== '' ? '<div>' + sPlain + '</div>' : '');
				this.isPlain(true);
			}
			this.$text = null;
			this.isExternalsShown(false);
			this.rtl(oData.Rtl);
			this.hasExternals(!!oData.HasExternals);
			this.foundCids(oData.FoundedCIDs);
			this.parseAttachments(oData.Attachments, iAccountId);
			this.safety(oData.Safety);
			this.sourceHeaders(oData.Headers);

			this.aExtend = oData.Extend;
			this.completelyFilled(true);

			App.broadcastEvent('MailWebclient::ParseMessage::after', {
				msg: this
			});
		}
		else
		{
			App.broadcastEvent('MailWebclient::ParseMessageListItem::after', {
				msg: this
			});
		}

		this.updateMomentDate();
	}
};

CMessageModel.prototype.changeText = function (sNewText)
{
	this.text(sNewText);
	this.$text = null;
};

CMessageModel.prototype.updateMomentDate = function ()
{
	this.date(this.oDateModel.getShortDate(moment().clone().subtract(1, 'days').format('L') ===
		moment.unix(this.oDateModel.getTimeStampInUTC()).format('L')));
};

/**
 * @param {string=} sAppPath = ''
 * @param {boolean=} bForcedShowPictures
 *
 * return {Object}
 */
CMessageModel.prototype.getDomText = function (sAppPath, bForcedShowPictures)
{
	var $text = this.$text;

	sAppPath = sAppPath || '';

	if (this.$text === null || sAppPath !== '')
	{
		if (this.completelyFilled())
		{
			this.$text = $(this.text());

			this.showInlinePictures(sAppPath);
			if (this.safety() === true)
			{
				this.alwaysShowExternalPicturesForSender();
			}
			else if (bForcedShowPictures && this.isExternalsShown() || this.isExternalsAlwaysShown())
			{
				this.showExternalPictures();
			}

			$text = this.$text;
		}
		else
		{
			$text = $('');
		}
	}

	//returns a clone, because it uses both in the parent window and the new
	return $text.clone();
};

/**
 * @param {string=} sAppPath = ''
 * @param {boolean=} bForcedShowPictures
 *
 * return {string}
 */
CMessageModel.prototype.getConvertedHtml = function (sAppPath, bForcedShowPictures)
{
	var oDomText = this.getDomText(sAppPath, bForcedShowPictures);
	return (oDomText.length > 0) ? oDomText.wrap('<p>').parent().html() : '';
};

/**
 * Parses attachments.
 *
 * @param {object} oData
 * @param {number} iAccountId
 */
CMessageModel.prototype.parseAttachments = function (oData, iAccountId)
{
	var aCollection = oData ? oData['@Collection'] : [];

	this.attachments([]);

	if (Types.isNonEmptyArray(aCollection))
	{
		this.attachments(_.map(aCollection, function (oRawAttach) {
			var oAttachment = new CAttachmentModel(iAccountId);
			oAttachment.setMessageData(this.folder(), this.uid());
			oAttachment.parse(oRawAttach, this.folder(), this.uid());
			return oAttachment;
		}, this));
	}
};

/**
 * Parses an array of email addresses.
 *
 * @param {Array} aData
 * @return {Array}
 */
CMessageModel.prototype.parseAddressArray = function (aData)
{
	var
		aAddresses = []
	;

	if (_.isArray(aData))
	{
		aAddresses = _.map(aData, function (oRawAddress) {
			var oAddress = new CAddressModel();
			oAddress.parse(oRawAddress);
			return oAddress;
		});
	}

	return aAddresses;
};

/**
 * Displays embedded images, which have cid on the list.
 *
 * @param {string} sAppPath
 */
CMessageModel.prototype.showInlinePictures = function (sAppPath)
{
	var aAttachments = _.map(this.attachments(), function (oAttachment) {
		return {
			CID: oAttachment.cid(),
			ContentLocation: oAttachment.contentLocation(),
			ViewLink: oAttachment.getActionUrl('view')
		};
	});

	MessageUtils.showInlinePictures(this.$text, aAttachments, this.foundCids(), sAppPath);
};

/**
 * Displays external images.
 */
CMessageModel.prototype.showExternalPictures = function ()
{
	MessageUtils.showExternalPictures(this.$text);

	this.isExternalsShown(true);
};

/**
 * Sets a flag that external images are always displayed.
 */
CMessageModel.prototype.alwaysShowExternalPicturesForSender = function ()
{
	this.isExternalsAlwaysShown(true);
	if (this.completelyFilled() && !this.isExternalsShown())
	{
		this.showExternalPictures();
	}
};

CMessageModel.prototype.openThread = function ()
{
	if (this.threadCountVisible())
	{
		var sFolder = this.folder();

		this.threadOpened(!this.threadOpened());
		this.requireMailCache();
		if (this.threadOpened())
		{
			MailCache.showOpenedThreads(sFolder);
		}
		else
		{
			MailCache.hideThreads(this);
			setTimeout(function () {
				MailCache.showOpenedThreads(sFolder);
			}, 500);
		}
	}
};

/**
 * @returns {Array}
 */
CMessageModel.prototype.getAttachmentsHashes = function ()
{
	var
		aNotInlineAttachments = _.filter(this.attachments(), function (oAttach) {
			return !oAttach.linked();
		}),
		aHashes = _.map(aNotInlineAttachments, function (oAttach) {
			return oAttach.hash();
		})
	;

	return aHashes;
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CMessageModel.prototype.onSaveAttachmentsToFilesResponse = function (oResponse, oRequest)
{
	var
		oParameters = oRequest.Parameters,
		iSavedCount = 0,
		iTotalCount = oParameters.Attachments.length
	;

	if (oResponse.Result)
	{
		_.each(oParameters.Attachments, function (sHash) {
			if (oResponse.Result[sHash] !== undefined)
			{
				iSavedCount++;
			}
		});
	}

	if (iSavedCount === 0)
	{
		Screens.showError(TextUtils.i18n('MAILWEBCLIENT/ERROR_CANT_SAVE_ATTACHMENTS_TO_FILES'));
	}
	else if (iSavedCount < iTotalCount)
	{
		Screens.showError(TextUtils.i18n('MAILWEBCLIENT/ERROR_SOME_ATTACHMENTS_WERE_NOT_SAVED', {
			'SAVED_COUNT': iSavedCount,
			'TOTAL_COUNT': iTotalCount
		}));
	}
	else
	{
		Screens.showReport(TextUtils.i18n('MAILWEBCLIENT/REPORT_ATTACHMENTS_SAVED_TO_FILES'));
	}
};

CMessageModel.prototype.downloadAllAttachmentsSeparately = function ()
{
	_.each(this.attachments(), function (oAttach) {
		if (!oAttach.linked())
		{
			oAttach.executeAction('download');
		}
	});
};

/**
 * Uses for logging.
 *
 * @returns {Object}
 */
CMessageModel.prototype.toJSON = function ()
{
	return {
		uid: this.uid(),
		unifiedUid: this.unifiedUid(),
		accountId: this.accountId(),
		to: this.to(),
		subject: this.subject(),
		threadPart: this.threadPart(),
		threadUids: this.threadUids(),
		threadOpened: this.threadOpened()
	};
};

CMessageModel.prototype.getHeaderValue = function (sHeaderName) {
	var
		reg = new RegExp(sHeaderName + ':\s*(.+)(\n|$)', 'gm'),
		aResult = reg.exec(this.sourceHeaders())
	;
	return $.trim(Types.pString(aResult && aResult[1]));
}

module.exports = CMessageModel;


/***/ }),

/***/ "Olic":
/*!*********************************************************!*\
  !*** ./modules/MailWebclient/js/utils/ScreenCompose.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	Routing = __webpack_require__(/*! modules/CoreWebclient/js/Routing.js */ "QaF5"),
	
	LinksUtils = __webpack_require__(/*! modules/MailWebclient/js/utils/Links.js */ "4M/5"),
	
	ScreenComposeUtils = {}
;

ScreenComposeUtils.composeMessage = function ()
{
	Routing.setHash(LinksUtils.getCompose());
};

/**
 * @param {int} iAccountId
 * @param {string} sFolder
 * @param {string} sUid
 */
ScreenComposeUtils.composeMessageFromDrafts = function (iAccountId, sFolder, sUid)
{
	var aParams = LinksUtils.getComposeFromMessage('drafts', iAccountId, sFolder, sUid);
	Routing.setHash(aParams);
};

/**
 * @param {string} sReplyType
 * @param {int} iAccountId
 * @param {string} sFolder
 * @param {string} sUid
 */
ScreenComposeUtils.composeMessageAsReplyOrForward = function (sReplyType, iAccountId, sFolder, sUid)
{
	var aParams = LinksUtils.getComposeFromMessage(sReplyType, iAccountId, sFolder, sUid);
	Routing.setHash(aParams);
};

/**
 * @param {string} sToAddresses
 */
ScreenComposeUtils.composeMessageToAddresses = function (sToAddresses)
{
	var aParams = LinksUtils.getComposeWithToField(sToAddresses);
	Routing.setHash(aParams);
};

ScreenComposeUtils.composeMessageWithData = function (oData)
{
	var aParams = LinksUtils.getComposeWithData(oData);
	aParams.shift();
	aParams.shift();
	Routing.goDirectly(LinksUtils.getCompose(), aParams);
};

/**
 * @param {Object} oMessage
 */
ScreenComposeUtils.composeMessageWithEml = function (oMessage)
{
	var aParams = LinksUtils.getComposeWithEmlObject(oMessage.accountId(), oMessage.folder(), oMessage.uid(), oMessage);
	aParams.shift();
	aParams.shift();
	Routing.goDirectly(LinksUtils.getCompose(), aParams);
};

/**
 * @param {Array} aFileItems
 */
ScreenComposeUtils.composeMessageWithAttachments = function (aFileItems)
{
	var aParams = LinksUtils.getComposeWithObject('attachments', aFileItems);
	aParams.shift();
	aParams.shift();
	Routing.goDirectly(LinksUtils.getCompose(), aParams);
};

module.exports = ScreenComposeUtils;

/***/ }),

/***/ "QFUI":
/*!*************************************************!*\
  !*** ./modules/CoreWebclient/js/utils/Files.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	
	Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh"),
	AlertPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/AlertPopup.js */ "1grR"),
	
	UserSettings = __webpack_require__(/*! modules/CoreWebclient/js/Settings.js */ "hPb3"),
	
	FilesUtils = {}
;

/**
 * Gets link for download by hash.
 *
 * @param {string} sModuleName Name of module that owns the file.
 * @param {string} sHash Hash of the file.
 * @param {string} sPublicHash Hash of shared folder if the file is displayed by public link.
 * 
 * @return {string}
 */
FilesUtils.getDownloadLink = function (sModuleName, sHash, sPublicHash)
{
	return sHash.length > 0 ? '?/Download/' + sModuleName + '/DownloadFile/' + sHash + '/' + (sPublicHash ? '0/' + sPublicHash : '') : '';
};

/**
 * Gets link for view by hash in iframe.
 *
 * @param {number} iAccountId
 * @param {string} sUrl
 *
 * @return {string}
 */
FilesUtils.getIframeWrappwer = function (iAccountId, sUrl)
{
	return '?/Raw/Iframe/' + iAccountId + '/' + window.encodeURIComponent(sUrl) + '/';
};

FilesUtils.thumbQueue = (function () {

	var
		oImages = {},
		oImagesIncrements = {},
		iNumberOfImages = 2
	;

	return function (sSessionUid, sImageSrc, fImageSrcObserver)
	{
		if(sImageSrc && fImageSrcObserver)
		{
			if(!(sSessionUid in oImagesIncrements) || oImagesIncrements[sSessionUid] > 0) //load first images
			{
				if(!(sSessionUid in oImagesIncrements)) //on first image
				{
					oImagesIncrements[sSessionUid] = iNumberOfImages;
					oImages[sSessionUid] = [];
				}
				oImagesIncrements[sSessionUid]--;

				fImageSrcObserver(sImageSrc); //load image
			}
			else //create queue
			{
				oImages[sSessionUid].push({
					imageSrc: sImageSrc,
					imageSrcObserver: fImageSrcObserver,
					messageUid: sSessionUid
				});
			}
		}
		else //load images from queue (fires load event)
		{
			if(oImages[sSessionUid] && oImages[sSessionUid].length)
			{
				oImages[sSessionUid][0].imageSrcObserver(oImages[sSessionUid][0].imageSrc);
				oImages[sSessionUid].shift();
			}
		}
	};
}());

/**
 * @param {string} sFileName
 * @param {number} iSize
 * @returns {Boolean}
 */
FilesUtils.showErrorIfAttachmentSizeLimit = function (sFileName, iSize)
{
	var
		sWarning = TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_SIZE_DETAILED', {
			'FILENAME': sFileName,
			'MAXSIZE': TextUtils.getFriendlySize(UserSettings.AttachmentSizeLimit)
		})
	;
	
	if (UserSettings.AttachmentSizeLimit > 0 && iSize > UserSettings.AttachmentSizeLimit)
	{
		Popups.showPopup(AlertPopup, [sWarning]);
		return true;
	}
	
	return false;
};

module.exports = FilesUtils;


/***/ }),

/***/ "RGpW":
/*!*******************************************************!*\
  !*** ./modules/ImportExportMailPlugin/js/Settings.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),

	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV")
;

module.exports = {
	ModuleName: 'ImportExportMailPlugin',
	UploadSizeLimitMb: 0,

	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var oAppDataSection = oAppData[this.ModuleName] || {};

		if (!_.isEmpty(oAppDataSection))
		{
			this.UploadSizeLimitMb = Types.pInt(oAppDataSection.UploadSizeLimitMb, this.UploadSizeLimitMb);
		}
	}
};


/***/ }),

/***/ "SbmC":
/*!**********************************************************!*\
  !*** ./modules/MailWebclient/js/models/CFiltersModel.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	CFilterModel = __webpack_require__(/*! modules/MailWebclient/js/models/CFilterModel.js */ "Aqrs")
;

/**
 * @constructor
 */
function CFiltersModel()
{
	this.iAccountId = 0;
	this.collection = ko.observableArray([]);
}

/**
 * @param {number} iAccountId
 * @param {Object} oData
 */
CFiltersModel.prototype.parse = function (iAccountId, oData)
{
	var 
		iIndex = 0,
		iLen = oData.length,
		oSieveFilter = null
	;

	this.iAccountId = iAccountId;
	
	if (_.isArray(oData))
	{
		for (iLen = oData.length; iIndex < iLen; iIndex++)
		{	
			oSieveFilter =  new CFilterModel(iAccountId);
			oSieveFilter.parse(oData[iIndex]);
			this.collection.push(oSieveFilter);
		}
	}
};

module.exports = CFiltersModel;

/***/ }),

/***/ "TCxV":
/*!********************************************************!*\
  !*** ./modules/MailWebclient/js/utils/PopupCompose.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh"),
	
	LinksUtils = __webpack_require__(/*! modules/MailWebclient/js/utils/Links.js */ "4M/5"),
	
	PopupComposeUtils = {}
;

function GetComposePopup()
{
	return __webpack_require__(/*! modules/MailWebclient/js/popups/ComposePopup.js */ "MHRZ");
}

PopupComposeUtils.composeMessage = function ()
{
	Popups.showPopup(GetComposePopup());
};

/**
 * @param {int} iAccountId
 * @param {string} sFolder
 * @param {string} sUid
 */
PopupComposeUtils.composeMessageFromDrafts = function (iAccountId, sFolder, sUid)
{
	var aParams = LinksUtils.getComposeFromMessage('drafts', iAccountId, sFolder, sUid);
	aParams.shift();
	Popups.showPopup(GetComposePopup(), [aParams]);
};

/**
 * @param {string} sReplyType
 * @param {int} iAccountId
 * @param {string} sFolder
 * @param {string} sUid
 */
PopupComposeUtils.composeMessageAsReplyOrForward = function (sReplyType, iAccountId, sFolder, sUid)
{
	var aParams = LinksUtils.getComposeFromMessage(sReplyType, iAccountId, sFolder, sUid);
	aParams.shift();
	Popups.showPopup(GetComposePopup(), [aParams]);
};

/**
 * @param {string} sToAddresses
 */
PopupComposeUtils.composeMessageToAddresses = function (sToAddresses)
{
	var aParams = LinksUtils.getComposeWithToField(sToAddresses);
	aParams.shift();
	Popups.showPopup(GetComposePopup(), [aParams]);
};

PopupComposeUtils.composeMessageWithData = function (oData)
{
	var aParams = LinksUtils.getComposeWithData(oData);
	aParams.shift();
	Popups.showPopup(GetComposePopup(), [aParams]);
};

/**
 * @param {Object} oMessage
 */
PopupComposeUtils.composeMessageWithEml = function (oMessage)
{
	var aParams = LinksUtils.getComposeWithEmlObject(oMessage.accountId(), oMessage.folder(), oMessage.uid(), oMessage);
	aParams.shift();
	Popups.showPopup(GetComposePopup(), [aParams]);
};

/**
 * @param {Array} aFileItems
 */
PopupComposeUtils.composeMessageWithAttachments = function (aFileItems)
{
	var aParams = LinksUtils.getComposeWithObject('attachments', aFileItems);
	aParams.shift();
	Popups.showPopup(GetComposePopup(), [aParams]);
};

PopupComposeUtils.closeComposePopup = function (iAccountId)
{
	var ComposePopup = GetComposePopup();
	if (ComposePopup.opened() && (!iAccountId || ComposePopup.senderAccountId() === iAccountId))
	{
		Popups.showPopup(ComposePopup, [['close']]);
	}
};

module.exports = PopupComposeUtils;

/***/ }),

/***/ "UN2P":
/*!******************************************!*\
  !*** ./modules/MailWebclient/js/Ajax.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ "o0Bx"),
	
	Settings = __webpack_require__(/*! modules/MailWebclient/js/Settings.js */ "p2hp")
;

Ajax.registerAbortRequestHandler(Settings.ServerModuleName, function (oRequest, oOpenedRequest) {
	var
		oParameters = oRequest.Parameters,
		oOpenedParameters = oOpenedRequest.Parameters
	;
	
	switch (oRequest.Method)
	{
		case 'MoveMessages':
		case 'DeleteMessages':
			return	oOpenedRequest.Method === 'GetMessage' || 
					oOpenedRequest.Method === 'GetMessages' && oOpenedParameters.Folder === oParameters.Folder;
		case 'GetMessages':
		case 'SetMessagesSeen':
		case 'SetMessageFlagged':
			return oOpenedRequest.Method === 'GetMessages' && oOpenedParameters.Folder === oParameters.Folder;
		case 'SetAllMessagesSeen':
			return (oOpenedRequest.Method === 'GetMessages' || oOpenedRequest.Method === 'GetMessages') &&
					oOpenedParameters.Folder === oParameters.Folder;
		case 'ClearFolder':
			// GetRelevantFoldersInformation-request aborted during folder cleaning, not to get the wrong information.
			return	oOpenedRequest.Method === 'GetRelevantFoldersInformation' || 
					oOpenedRequest.Method === 'GetUnifiedRelevantFoldersInformation' || 
					oOpenedRequest.Method === 'GetMessages' && oOpenedParameters.Folder === oParameters.Folder;
		case 'GetRelevantFoldersInformation':
			return oOpenedRequest.Method === 'GetRelevantFoldersInformation' && oParameters.AccountID === oOpenedParameters.AccountID ||
					oOpenedRequest.Method === 'GetUnifiedRelevantFoldersInformation';
		case 'GetMessagesFlags':
			return oOpenedRequest.Method === 'GetMessagesFlags';
	}
	
	return false;
});

module.exports = {
	getOpenedRequest: function (sMethod) {
		Ajax.getOpenedRequest('Mail', sMethod);
	},
	hasOpenedRequests: function (sMethod) {
		return Ajax.hasOpenedRequests('Mail', sMethod || '');
	},
	hasInternetConnectionProblem: function () {
		return Ajax.hasInternetConnectionProblem();
	},
	registerOnAllRequestsClosedHandler: Ajax.registerOnAllRequestsClosedHandler,
	send: function (sMethod, oParameters, fResponseHandler, oContext) {
		var
			MailCache = __webpack_require__(/*! modules/MailWebclient/js/Cache.js */ "4+IO"),
			iTimeout = (sMethod === 'GetMessagesBodies') ? 100000 : undefined,
			fBaseResponseHandler = function (oResponse, oRequest) {
				if (!oResponse.Result && oResponse.ErrorCode === 4002)
				{
					var
						AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm"),
						iAccountId = Types.pInt(oRequest.Parameters.AccountID),
						oAccount = AccountList.getAccount(iAccountId)
					;
					oAccount.passwordMightBeIncorrect(true);
				}
				if (_.isFunction(fResponseHandler))
				{
					fResponseHandler.apply(oContext, [oResponse, oRequest]);
				}
			}
		;
		if (oParameters && !oParameters.AccountID)
		{
			oParameters.AccountID = MailCache.currentAccountId();
		}
		Ajax.send(Settings.ServerModuleName, sMethod, oParameters, fBaseResponseHandler, null, iTimeout);
	}
};


/***/ }),

/***/ "UvKh":
/*!****************************************************!*\
  !*** ./modules/MailWebclient/js/SenderSelector.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
			
	SendingUtils = __webpack_require__(/*! modules/MailWebclient/js/utils/Sending.js */ "Cq+9"),
	AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm")
;

function CSenderSelector()
{
	this.senderList = ko.observableArray([]);
	
	this.senderAccountId = ko.observable(AccountList.currentId());
	this.selectedFetcherOrIdentity = ko.observable(null);
	this.lockSelectedSender = ko.observable(false);
	this.selectedSender = ko.observable('');
	this.selectedSender.subscribe(function () {
		if (!this.lockSelectedSender())
		{
			var
				oAccount = AccountList.getAccount(this.senderAccountId()),
				sId = this.selectedSender(),
				oFetcherOrIdentity = null
			;
			
			if (Types.isNonEmptyString(sId))
			{
				if (sId.indexOf('fetcher') === 0)
				{
					sId = sId.replace('fetcher', '');
					oFetcherOrIdentity = _.find(oAccount.fetchers(), function (oFetcher) {
						return oFetcher.id() === Types.pInt(sId);
					});
				}
				else if (sId.indexOf('alias') === 0)
				{
					sId = sId.replace('alias', '');
					oFetcherOrIdentity = _.find(oAccount.aliases(), function (oAlias) {
						return oAlias.id() === Types.pInt(sId);
					});
				}
				else
				{
					oFetcherOrIdentity = _.find(oAccount.identities(), function (oIdnt) {
						return oIdnt.id() === Types.pInt(sId);
					});
				}
			}
			
			if (oFetcherOrIdentity)
			{
				this.selectedFetcherOrIdentity(oFetcherOrIdentity);
			}
		}
	}, this);
}

CSenderSelector.prototype.changeSelectedSender = function (oFetcherOrIdentity)
{
	if (oFetcherOrIdentity)
	{
		var sSelectedSenderId = Types.pString(oFetcherOrIdentity.id());

		if (oFetcherOrIdentity.FETCHER)
		{
			sSelectedSenderId = 'fetcher' + sSelectedSenderId;
		}
		else if (oFetcherOrIdentity.ALIAS)
		{
			sSelectedSenderId = 'alias' + sSelectedSenderId;
		}

		if (_.find(this.senderList(), function (oItem) {return oItem.id === sSelectedSenderId;}))
		{
			this.lockSelectedSender(true);
			this.selectedSender(sSelectedSenderId);
			this.selectedFetcherOrIdentity(oFetcherOrIdentity);
			this.lockSelectedSender(false);
		}
	}
};

/**
 * @param {number} iId
 * @param {string=} oFetcherOrIdentity
 */
CSenderSelector.prototype.changeSenderAccountId = function (iId, oFetcherOrIdentity)
{
	var bChanged = false;
	if (this.senderAccountId() !== iId)
	{
		if (AccountList.hasAccountWithId(iId))
		{
			this.senderAccountId(iId);
			bChanged = true;
		}
		else if (!AccountList.hasAccountWithId(this.senderAccountId()))
		{
			this.senderAccountId(AccountList.currentId());
			bChanged = true;
		}
	}
	
	if (bChanged || this.senderList().length === 0)
	{
		this.fillSenderList(oFetcherOrIdentity);
		bChanged = true;
	}
		
	if (!bChanged && oFetcherOrIdentity)
	{
		this.changeSelectedSender(oFetcherOrIdentity);
	}
};

/**
 * @param {string=} oFetcherOrIdentity
 */
CSenderSelector.prototype.fillSenderList = function (oFetcherOrIdentity)
{
	var
		aSenderList = [],
		oAccount = AccountList.getAccount(this.senderAccountId())
	;

	if (oAccount)
	{
		if (_.isArray(oAccount.identities()))
		{
			_.each(oAccount.identities(), function (oIdentity) {
				aSenderList.push({fullEmail: oIdentity.fullEmail(), id: Types.pString(oIdentity.id())});
			}, this);
		}

		if (oAccount.identitiesSubscribtion)
		{
			oAccount.identitiesSubscribtion.dispose();
		}
		oAccount.identitiesSubscribtion = oAccount.identities.subscribe(function () {
			this.fillSenderList(oFetcherOrIdentity);
			this.changeSelectedSender(oAccount.getDefaultIdentity());
		}, this);

		_.each(oAccount.fetchers(), function (oFetcher) {
			var sFullEmail = oFetcher.fullEmail();
			if (oFetcher.isEnabled() && oFetcher.isOutgoingEnabled() && sFullEmail.length > 0)
			{
				aSenderList.push({fullEmail: sFullEmail, id: 'fetcher' + oFetcher.id()});
			}
		}, this);
		
		if (oAccount.fetchersSubscribtion)
		{
			oAccount.fetchersSubscribtion.dispose();
		}
		oAccount.fetchersSubscribtion = oAccount.fetchers.subscribe(function () {
			this.fillSenderList(oFetcherOrIdentity);
		}, this);

		_.each(oAccount.aliases(), function (oAlias) {
			var sFullEmail = oAlias.fullEmail();
			if (sFullEmail.length > 0)
			{
				aSenderList.push({fullEmail: sFullEmail, id: 'alias' + oAlias.id()});
			}
		}, this);
	}

	this.senderList(aSenderList);

	this.changeSelectedSender(oFetcherOrIdentity);
};

/**
 * @param {Object} oMessage
 */
CSenderSelector.prototype.setFetcherOrIdentityByReplyMessage = function (oMessage)
{
	var
		aRecipients = oMessage.oTo.aCollection.concat(oMessage.oCc.aCollection),
		oFetcherOrIdentity = SendingUtils.getFirstFetcherOrIdentityByRecipientsOrDefault(aRecipients, oMessage.accountId())
	;
	
	if (oFetcherOrIdentity)
	{
		if (oFetcherOrIdentity.accountId() !== this.senderAccountId())
		{
			this.changeSenderAccountId(oFetcherOrIdentity.accountId(), oFetcherOrIdentity);
		}
		else
		{
			this.changeSelectedSender(oFetcherOrIdentity);
		}
	}
};

module.exports = new CSenderSelector();


/***/ }),

/***/ "XTZw":
/*!*************************************************************!*\
  !*** ./modules/MailWebclient/js/models/CAttachmentModel.js ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	WindowOpener = __webpack_require__(/*! modules/CoreWebclient/js/WindowOpener.js */ "ZCBP"),
	
	CAbstractFileModel = __webpack_require__(/*! modules/CoreWebclient/js/models/CAbstractFileModel.js */ "cGGv"),
	
	Ajax = __webpack_require__(/*! modules/MailWebclient/js/Ajax.js */ "UN2P")
;

/**
 * @constructor
 * @extends CCommonFileModel
 */
function CAttachmentModel(iAccountId)
{
	this.iAccountId = iAccountId || App.currentAccountId();
	this.folderName = ko.observable('');
	this.messageUid = ko.observable('');
	
	this.cid = ko.observable('');
	this.contentLocation = ko.observable('');
	this.inline = ko.observable(false);
	this.linked = ko.observable(false);
	this.mimePartIndex = ko.observable('');

	this.messagePart = ko.observable(null);
	
	CAbstractFileModel.call(this);
	
	this.content = ko.observable('');
	
	this.isMessageType = ko.computed(function () {
		this.mimeType();
		this.mimePartIndex();
		return (this.mimeType() === 'message/rfc822');
	}, this);
}

_.extendOwn(CAttachmentModel.prototype, CAbstractFileModel.prototype);

/**
 * Method is used in other modules
 * @returns {CAttachmentModel}
 */
CAttachmentModel.prototype.getNewInstance = function ()
{
	return new CAttachmentModel(this.iAccountId);
};

CAttachmentModel.prototype.getCopy = function ()
{
	var oCopy = new CAttachmentModel(this.iAccountId);
	
	oCopy.copyProperties(this);
	
	return oCopy;
};

CAttachmentModel.prototype.copyProperties = function (oSource)
{
	this.folderName(oSource.folderName());
	this.messageUid(oSource.messageUid());
	this.cid(oSource.cid());
	this.contentLocation(oSource.contentLocation());
	this.inline(oSource.inline());
	this.linked(oSource.linked());
	this.mimePartIndex(oSource.mimePartIndex());
	this.messagePart(oSource.messagePart());
	this.content(oSource.content());

	this.fileName(oSource.fileName());
	this.tempName(oSource.tempName());
	this.size(oSource.size());
	this.hash(oSource.hash());
	this.mimeType(oSource.mimeType());
	this.thumbnailSrc(oSource.thumbnailSrc());
	this.thumbnailLoaded(oSource.thumbnailLoaded());
	this.statusText(oSource.statusText());
	this.uploaded(oSource.uploaded());
	this.oActionsData = oSource.oActionsData;
	this.actions(oSource.actions());
	this.thumbUrlInQueue(oSource.thumbUrlInQueue());
};

/**
 * Parses attachment data from server.
 *
 * @param {AjaxAttachmenResponse} oData
 */
CAttachmentModel.prototype.additionalParse = function (oData)
{
	this.content(Types.pString(oData.Content));
	this.mimePartIndex(Types.pString(oData.MimePartIndex));
	if (this.isMessageType() && this.mimePartIndex() === '')
	{
		this.actions(_.without(this.actions(), 'view'));
	}
	
	this.cid(Types.pString(oData.CID));
	this.contentLocation(Types.pString(oData.ContentLocation));
	this.inline(!!oData.IsInline);
	this.linked(!!oData.IsLinked);

	App.broadcastEvent('MailWebclient::ParseFile::after', this);
};

/**
 * @param {string} sFolderName
 * @param {string} sMessageUid
 */
CAttachmentModel.prototype.setMessageData = function (sFolderName, sMessageUid)
{
	this.folderName(sFolderName);
	this.messageUid(sMessageUid);
};

/**
 * @param {Object} oResult
 * @param {Object} oRequest
 */
CAttachmentModel.prototype.onGetMessageResponse = function (oResult, oRequest)
{
	var
		oParameters = oRequest.Parameters,
		oResult = oResult.Result,
		CMessageModel = __webpack_require__(/*! modules/MailWebclient/js/models/CMessageModel.js */ "Nfk5"),
		oMessage = new CMessageModel()
	;
	
	if (oResult && this.oNewWindow)
	{
		oResult.TimeStampInUTC = oResult.ReceivedOrDateTimeStampInUTC;
		oMessage.parse(oResult, oParameters.AccountID, false, true);
		this.messagePart(oMessage);
		this.messagePart().viewMessage(this.oNewWindow);
		this.oNewWindow = undefined;
	}
};

/**
 * Starts viewing attachment on click.
 */
CAttachmentModel.prototype.viewFile = function ()
{
	if (this.isMessageType())
	{
		this.viewMessageFile();
	}
	else
	{
		this.viewCommonFile();
	}
};

/**
 * Starts viewing attachment on click.
 */
CAttachmentModel.prototype.viewMessageFile = function ()
{
	var
		oWin = null,
		sLoadingText = '<div style="margin: 30px; text-align: center; font: normal 14px Tahoma;">' + 
			TextUtils.i18n('COREWEBCLIENT/INFO_LOADING') + '</div>'
	;
	
	oWin = WindowOpener.open('', this.fileName());
	if (oWin)
	{
		if (this.messagePart())
		{
			this.messagePart().viewMessage(oWin);
		}
		else
		{
			$(oWin.document.body).html(sLoadingText);
			this.oNewWindow = oWin;

			Ajax.send('GetMessage', {
				'AccountID': this.iAccountId,
				'Folder': this.folderName(),
				'Uid': this.messageUid(),
				'Rfc822MimeIndex': this.mimePartIndex()
			}, this.onGetMessageResponse, this);
		}
		
		oWin.focus();
	}
};

/**
 * @param {Object} oResponse
 * @param {string} sFileUid
 */
CAttachmentModel.prototype.fillDataAfterUploadComplete = function (oResponse, sFileUid)
{
	this.cid(Types.pString(sFileUid));
	if (oResponse && oResponse.Result && oResponse.Result.Attachment)
	{
		this.tempName(Types.pString(oResponse.Result.Attachment.TempName));
		this.mimeType(Types.pString(oResponse.Result.Attachment.MimeType));
		this.size(Types.pInt(oResponse.Result.Attachment.Size));
		this.hash(Types.pString(oResponse.Result.Attachment.Hash));
		this.parseActions(oResponse.Result.Attachment);
	}
};

/**
 * Parses contact attachment data from server.
 *
 * @param {Object} oData
 * @param {string} sMessageFolder
 * @param {string} sMessageUid
 */
CAttachmentModel.prototype.parseFromUpload = function (oData, sMessageFolder, sMessageUid)
{
	this.setMessageData(sMessageFolder, sMessageUid);

	this.fileName(Types.pString(oData.Name));
	this.tempName(oData.TempName ? Types.pString(oData.TempName) : this.fileName());
	this.mimeType(Types.pString(oData.MimeType));
	this.size(Types.pInt(oData.Size));

	this.hash(Types.pString(oData.Hash));
	this.parseActions(oData);

	this.uploadUid(this.hash());
	this.uploaded(true);
	
	this.uploadStarted(false);
};

CAttachmentModel.prototype.parseActions = function (oData)
{
	this.thumbUrlInQueue(Types.pString(oData.ThumbnailUrl) !== '' ? Types.pString(oData.ThumbnailUrl) + '/' + Math.random() : '');
	this.commonParseActions(oData);
	
	if (this.isMessageType())
	{
		if (this.folderName() !== '' && this.messageUid() !== '')
		{
			if (!this.hasAction('view'))
			{
				this.actions.unshift('view');
			}
			this.otherTemplates.push({
				name: 'MailWebclient_PrintMessageView',
				data: this.messagePart
			});
		}
		else
		{
			this.actions(_.without(this.actions(), 'view'));
		}
	}
	else
	{
		this.commonExcludeActions();
	}
};

CAttachmentModel.prototype.errorFromUpload = function ()
{
	this.uploaded(true);
	this.uploadError(true);
	this.uploadStarted(false);
	this.statusText(TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_UNKNOWN'));
};

module.exports = CAttachmentModel;


/***/ }),

/***/ "a28q":
/*!***********************************************************!*\
  !*** ./modules/MailWebclient/js/views/CHtmlEditorView.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	AddressUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Address.js */ "Ol7c"),
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	Browser = __webpack_require__(/*! modules/CoreWebclient/js/Browser.js */ "HLSX"),
	CJua = __webpack_require__(/*! modules/CoreWebclient/js/CJua.js */ "mjrp"),
	UserSettings = __webpack_require__(/*! modules/CoreWebclient/js/Settings.js */ "hPb3"),
	
	Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh"),
	AlertPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/AlertPopup.js */ "1grR"),
	
	CAttachmentModel = __webpack_require__(/*! modules/MailWebclient/js/models/CAttachmentModel.js */ "XTZw"),
	CCrea = __webpack_require__(/*! modules/MailWebclient/js/CCrea.js */ "sWkr"),
	MailCache = __webpack_require__(/*! modules/MailWebclient/js/Cache.js */ "4+IO"),
	Settings = __webpack_require__(/*! modules/MailWebclient/js/Settings.js */ "p2hp"),
	
	CColorPickerView = __webpack_require__(/*! modules/MailWebclient/js/views/CColorPickerView.js */ "jDNX")
;

/**
 * @constructor
 * @param {boolean} bInsertImageAsBase64
 * @param {Object=} oParent
 */
function CHtmlEditorView(bInsertImageAsBase64, oParent)
{
	this.oParent = oParent;
	
	this.creaId = 'creaId' + Math.random().toString().replace('.', '');
	this.textFocused = ko.observable(false);
	this.workareaDom = ko.observable();
	this.uploaderAreaDom = ko.observable();
	this.editorUploaderBodyDragOver = ko.observable(false);
	
	this.htmlEditorDom = ko.observable();
	this.toolbarDom = ko.observable();
	this.colorPickerDropdownDom = ko.observable();
	this.insertLinkDropdownDom = ko.observable();
	this.insertImageDropdownDom = ko.observable();

    this.isFWBold = ko.observable(false);
    this.isFSItalic = ko.observable(false);
    this.isTDUnderline = ko.observable(false);
    this.isTDStrikeThrough = ko.observable(false);
    this.isEnumeration = ko.observable(false);
    this.isBullets = ko.observable(false);

	this.isEnable = ko.observable(true);
	this.isEnable.subscribe(function () {
		if (this.oCrea)
		{
			this.oCrea.setEditable(this.isEnable());
		}
	}, this);

	this.bInsertImageAsBase64 = bInsertImageAsBase64;
	this.bAllowFileUpload = !(bInsertImageAsBase64 && window.File === undefined);
	this.bAllowInsertImage = Settings.AllowInsertImage;
	this.lockFontSubscribing = ko.observable(false);
	this.bAllowImageDragAndDrop = !Browser.ie10AndAbove;

	this.aFonts = ['Arial', 'Arial Black', 'Courier New', 'Tahoma', 'Times New Roman', 'Verdana'];
	this.sDefaultFont = Settings.DefaultFontName;
	this.correctFontFromSettings();
	this.selectedFont = ko.observable('');
	this.selectedFont.subscribe(function () {
		if (this.oCrea && !this.lockFontSubscribing() && !this.inactive())
		{
			this.oCrea.fontName(this.selectedFont());
		}
	}, this);

	this.iDefaultSize = Settings.DefaultFontSize;
	this.selectedSize = ko.observable(0);
	this.selectedSize.subscribe(function () {
		if (this.oCrea && !this.lockFontSubscribing() && !this.inactive())
		{
			this.oCrea.fontSize(this.selectedSize());
		}
	}, this);

	this.visibleInsertLinkPopup = ko.observable(false);
	this.linkForInsert = ko.observable('');
	this.linkFocused = ko.observable(false);
	this.visibleLinkPopup = ko.observable(false);
	this.linkPopupDom = ko.observable(null);
	this.linkHrefDom = ko.observable(null);
	this.linkHref = ko.observable('');
	this.visibleLinkHref = ko.observable(false);

	this.visibleImagePopup = ko.observable(false);
	this.visibleImagePopup.subscribe(function () {
		this.onImageOut();
	}, this);
	this.imagePopupTop = ko.observable(0);
	this.imagePopupLeft = ko.observable(0);
	this.imageSelected = ko.observable(false);
	
	this.tooltipText = ko.observable('');
	this.tooltipPopupTop = ko.observable(0);
	this.tooltipPopupLeft = ko.observable(0);

	this.visibleInsertImagePopup = ko.observable(false);
	this.imageUploaderButton = ko.observable(null);
	this.aUploadedImagesData = [];
	this.imagePathFromWeb = ko.observable('');
	this.visibleTemplatePopup = ko.observable(false);

	this.visibleFontColorPopup = ko.observable(false);
	this.oFontColorPickerView = new CColorPickerView(TextUtils.i18n('MAILWEBCLIENT/LABEL_TEXT_COLOR'), this.setTextColorFromPopup, this);
	this.oBackColorPickerView = new CColorPickerView(TextUtils.i18n('MAILWEBCLIENT/LABEL_BACKGROUND_COLOR'), this.setBackColorFromPopup, this);

	this.inactive = ko.observable(false);
	this.sPlaceholderText = '';
	
	this.bAllowChangeInputDirection = UserSettings.IsRTL || Settings.AllowChangeInputDirection;
	this.disableEdit = ko.observable(false);
	
	this.textChanged = ko.observable(false);

	this.actualTextСhanged = ko.observable(false);
	
	this.templates = ko.observableArray([]);
	
	if (Settings.AllowInsertTemplateOnCompose) {
		App.subscribeEvent('MailWebclient::ParseMessagesBodies::after', _.bind(function (oParameters) {
			if (oParameters.AccountID === MailCache.currentAccountId() && oParameters.Folder === MailCache.getTemplateFolder())
			{
				this.fillTemplates();
			}
		}, this));
	}
}

CHtmlEditorView.prototype.ViewTemplate = 'MailWebclient_HtmlEditorView';

CHtmlEditorView.prototype.setInactive = function (bInactive)
{
	this.inactive(bInactive);
	if (this.inactive())
	{
		this.setPlaceholder();
	}
	else
	{
		this.removePlaceholder();
	}
};

CHtmlEditorView.prototype.setPlaceholder = function ()
{
	var sText = this.removeAllTags(this.getText());
	if (sText === '' || sText === '&nbsp;')
	{
		this.setText('<span>' + this.sPlaceholderText + '</span>');
		if (this.oCrea)
		{
			this.oCrea.setBlur();
		}
	}
};

CHtmlEditorView.prototype.removePlaceholder = function ()
{
	var sText = this.oCrea ? this.removeAllTags(this.oCrea.getText(false)) : '';
	if (sText === this.sPlaceholderText)
	{
		this.setText('');
		if (this.oCrea)
		{
			this.oCrea.setFocus(true);
		}
	}
};

CHtmlEditorView.prototype.hasOpenedPopup = function ()
{
	return this.visibleInsertLinkPopup() || this.visibleLinkPopup() || this.visibleImagePopup() 
			|| this.visibleInsertImagePopup() || this.visibleFontColorPopup() || this.visibleTemplatePopup();
};
	
CHtmlEditorView.prototype.setDisableEdit = function (bDisableEdit)
{
	this.disableEdit(!!bDisableEdit);
};

CHtmlEditorView.prototype.correctFontFromSettings = function ()
{
	var
		sDefaultFont = this.sDefaultFont,
		bFound = false
	;
	
	_.each(this.aFonts, function (sFont) {
		if (sFont.toLowerCase() === sDefaultFont.toLowerCase())
		{
			sDefaultFont = sFont;
			bFound = true;
		}
	});
	
	if (bFound)
	{
		this.sDefaultFont = sDefaultFont;
	}
	else
	{
		this.aFonts.push(sDefaultFont);
	}
};

/**
 * @param {Object} $link
 */
CHtmlEditorView.prototype.showLinkPopup = function ($link)
{
	var
		$workarea = $(this.workareaDom()),
		$composePopup = $workarea.closest('.panel.compose'),
		oWorkareaPos = $workarea.position(),
		oPos = $link.position(),
		iHeight = $link.height(),
		iLeft = Math.round(oPos.left + oWorkareaPos.left),
		iTop = Math.round(oPos.top + iHeight + oWorkareaPos.top)
	;

	this.linkHref($link.attr('href') || $link.text());
	$(this.linkPopupDom()).css({
		'left': iLeft,
		'top': iTop
	});
	$(this.linkHrefDom()).css({
		'left': iLeft,
		'top': iTop
	});
	
	if (!Browser.firefox && $composePopup.length === 1)
	{
		$(this.linkPopupDom()).css({
			'max-width': ($composePopup.width() - iLeft - 40) + 'px',
			'white-space': 'pre-line',
			'word-wrap': 'break-word'
		});
	}
	
	this.visibleLinkPopup(true);
};

CHtmlEditorView.prototype.hideLinkPopup = function ()
{
	this.visibleLinkPopup(false);
};

CHtmlEditorView.prototype.showChangeLink = function ()
{
	this.visibleLinkHref(true);
	this.hideLinkPopup();
};

CHtmlEditorView.prototype.changeLink = function ()
{
	this.oCrea.changeLink(this.linkHref());
	this.hideChangeLink();
};

CHtmlEditorView.prototype.hideChangeLink = function ()
{
	this.visibleLinkHref(false);
};

/**
 * @param {jQuery} $image
 * @param {Object} oEvent
 */
CHtmlEditorView.prototype.showImagePopup = function ($image, oEvent)
{
	var
		$workarea = $(this.workareaDom()),
		oWorkareaPos = $workarea.position(),
		oWorkareaOffset = $workarea.offset()
	;
	
	this.imagePopupLeft(Math.round(oEvent.pageX + oWorkareaPos.left - oWorkareaOffset.left));
	this.imagePopupTop(Math.round(oEvent.pageY + oWorkareaPos.top - oWorkareaOffset.top));

	this.visibleImagePopup(true);
};

CHtmlEditorView.prototype.hideImagePopup = function ()
{
	this.visibleImagePopup(false);
};

CHtmlEditorView.prototype.resizeImage = function (sSize)
{
	var oParams = {
		'width': 'auto',
		'height': 'auto'
	};
	
	switch (sSize)
	{
		case Enums.HtmlEditorImageSizes.Small:
			oParams.width = '300px';
			break;
		case Enums.HtmlEditorImageSizes.Medium:
			oParams.width = '600px';
			break;
		case Enums.HtmlEditorImageSizes.Large:
			oParams.width = '1200px';
			break;
		case Enums.HtmlEditorImageSizes.Original:
			oParams.width = 'auto';
			break;
	}
	
	this.oCrea.changeCurrentImage(oParams);
	
	this.visibleImagePopup(false);
};

CHtmlEditorView.prototype.onImageOver = function (oEvent)
{
	if (oEvent.target.nodeName === 'IMG' && !this.visibleImagePopup())
	{
		this.imageSelected(true);
		
		this.tooltipText(TextUtils.i18n('MAILWEBCLIENT/ACTION_CLICK_TO_EDIT_IMAGE'));
		
		var 
			self = this,
			$workarea = $(this.workareaDom())
		;
		
		$workarea.bind('mousemove.image', function (oEvent) {

			var
				oWorkareaPos = $workarea.position(),
				oWorkareaOffset = $workarea.offset()
			;

			self.tooltipPopupTop(Math.round(oEvent.pageY + oWorkareaPos.top - oWorkareaOffset.top));
			self.tooltipPopupLeft(Math.round(oEvent.pageX + oWorkareaPos.left - oWorkareaOffset.left));
		});
	}
	
	return true;
};

CHtmlEditorView.prototype.onImageOut = function (oEvent)
{
	if (this.imageSelected())
	{
		this.imageSelected(false);
		
		var $workarea = $(this.workareaDom());
		$workarea.unbind('mousemove.image');
	}
	
	return true;
};

CHtmlEditorView.prototype.commit = function ()
{
	this.textChanged(false);
};

/**
 * @param {string} sText
 * @param {boolean} bPlain
 * @param {string} sTabIndex
 * @param {string} sPlaceholderText
 */
CHtmlEditorView.prototype.init = function (sText, bPlain, sTabIndex, sPlaceholderText)
{
	this.sPlaceholderText = sPlaceholderText || '';
	
	if (this.oCrea)
	{
		this.oCrea.$container = $('#' + this.oCrea.oOptions.creaId);
		// in case if knockoutjs destroyed dom element with html editor
		if (this.oCrea.$container.children().length === 0)
		{
			this.oCrea.start(this.isEnable());
			// this.editorUploader must be re-initialized because compose popup is destroyed after it is closed
			this.initEditorUploader();
		}
	}
	else
	{
		$(document.body).on('click', _.bind(function (oEvent) {
			var oParent = $(oEvent.target).parents('span.dropdown_helper');
			if (oParent.length === 0)
			{
				this.closeAllPopups(true);
			}
		}, this));

		this.initEditorUploader();
		
		this.oCrea = new CCrea({
			'creaId': this.creaId,
			'fontNameArray': this.aFonts,
			'defaultFontName': this.sDefaultFont,
			'defaultFontSize': this.iDefaultSize,
			'alwaysTryUseImageWhilePasting': Settings.AlwaysTryUseImageWhilePasting,
			'isRtl': UserSettings.IsRTL,
			'enableDrop': false,
			'onChange': _.bind(function () {
				if (this.oCrea.bEditing)
				{
					this.textChanged(true);
					this.actualTextСhanged.valueHasMutated();
				}
			}, this),
			'onCursorMove': _.bind(this.setFontValuesFromText, this),
			'onFocus': _.bind(this.onCreaFocus, this),
			'onBlur': _.bind(this.onCreaBlur, this),
			'onUrlIn': _.bind(this.showLinkPopup, this),
			'onUrlOut': _.bind(this.hideLinkPopup, this),
			'onImageSelect': _.bind(this.showImagePopup, this),
			'onImageBlur': _.bind(this.hideImagePopup, this),
			'onItemOver': (Browser.mobileDevice || App.isMobile()) ? null : _.bind(this.onImageOver, this),
			'onItemOut': (Browser.mobileDevice || App.isMobile()) ? null : _.bind(this.onImageOut, this),
			'openInsertLinkDialog': _.bind(this.insertLink, this),
			'onUrlClicked': true
		});
		this.oCrea.start(this.isEnable());
	}

	this.oCrea.setTabIndex(sTabIndex);
	this.clearUndoRedo();
	this.setText(sText, bPlain);
	this.setFontValuesFromText();
	this.aUploadedImagesData = [];
	this.selectedFont(this.sDefaultFont);
	this.selectedSize(this.iDefaultSize);
		
	if (Settings.AllowInsertTemplateOnCompose) {
		this.fillTemplates();
	}
};

/**
 * Fills template list if there is template folder in account.
 * Messages of template folder are requested in Prefetcher.
 */
CHtmlEditorView.prototype.fillTemplates = function ()
{
	var
		oFolderList = MailCache.folderList(),
		sTemplateFolder = MailCache.getTemplateFolder(),
		oTemplateFolder = sTemplateFolder ? oFolderList.getFolderByFullName(sTemplateFolder) : null,
		oUidList = oTemplateFolder ? oTemplateFolder.getUidList('', '', Settings.MessagesSortBy.DefaultSortBy, Settings.MessagesSortBy.DefaultSortOrder) : null,
		aTemplates = []
	;
	
	if (oUidList)
	{
		var aUids = oUidList.collection();
		if (aUids.length > Settings.MaxTemplatesCountOnCompose)
		{
			aUids = aUids.splice(Settings.MaxTemplatesCountOnCompose);
		}
		_.each(aUids, function (sUid) {
			var oMessage = oTemplateFolder.getMessageByUid(sUid);
			if (oMessage.text() !== '')
			{
				aTemplates.push({
					subject: oMessage.subject(),
					text: oMessage.text()
				});
			}
		});
	}
	this.templates(aTemplates);
};

CHtmlEditorView.prototype.toggleTemplatePopup = function (oViewModel, oEvent)
{
	if (this.visibleTemplatePopup())
	{
		this.visibleTemplatePopup(false);
	}
	else
	{
		oEvent.stopPropagation();
		this.closeAllPopups();
		this.visibleTemplatePopup(true);
	}
};

CHtmlEditorView.prototype.insertTemplate = function (sHtml, oEvent)
{
	oEvent.stopPropagation();
	this.insertHtml(sHtml);
};

CHtmlEditorView.prototype.isInitialized = function ()
{
	return !!this.oCrea;
};

CHtmlEditorView.prototype.setFocus = function ()
{
	if (this.oCrea)
	{
		this.oCrea.setFocus(false);
	}
};

/**
 * @param {string} sNewSignatureContent
 * @param {string} sOldSignatureContent
 */
CHtmlEditorView.prototype.changeSignatureContent = function (sNewSignatureContent, sOldSignatureContent)
{
	if (this.oCrea && !this.disableEdit())
	{
		this.oCrea.changeSignatureContent(sNewSignatureContent, sOldSignatureContent);
	}
};

CHtmlEditorView.prototype.setFontValuesFromText = function ()
{
	this.lockFontSubscribing(true);
    this.isFWBold(this.oCrea.getIsBold());
    this.isFSItalic(this.oCrea.getIsItalic());
    this.isTDUnderline(this.oCrea.getIsUnderline());
    this.isTDStrikeThrough(this.oCrea.getIsStrikeThrough());
    this.isEnumeration(this.oCrea.getIsEnumeration());
    this.isBullets(this.oCrea.getIsBullets());
	this.selectedFont(this.oCrea.getFontName());
	this.selectedSize(this.oCrea.getFontSizeInNumber().toString());
	this.lockFontSubscribing(false);
};

CHtmlEditorView.prototype.isUndoAvailable = function ()
{
	if (this.oCrea)
	{
		return this.oCrea.isUndoAvailable();
	}

	return false;
};

CHtmlEditorView.prototype.getPlainText = function ()
{
	if (this.oCrea)
	{
		return this.oCrea.getPlainText();
	}

	return '';
};

/**
 * @param {boolean=} bRemoveSignatureAnchor = false
 */
CHtmlEditorView.prototype.getText = function (bRemoveSignatureAnchor)
{
	var
		sText = this.oCrea ? this.oCrea.getText(bRemoveSignatureAnchor) : ''
	;
	return (this.sPlaceholderText !== '' && this.removeAllTags(sText) === this.sPlaceholderText) ? '' : sText;
};


CHtmlEditorView.prototype.getEditableArea = function ()
{
	return this.oCrea.$editableArea;
};

/**
 * @param {string} sText
 * @param {boolean} bPlain
 */
CHtmlEditorView.prototype.setText = function (sText, bPlain)
{
	if (this.oCrea && !this.disableEdit())
	{
		if (bPlain)
		{
			this.oCrea.setPlainText(sText);
		}
		else
		{
			this.oCrea.setText(sText);
		}
		if (this.inactive() && sText === '')
		{
			this.setPlaceholder();
		}
	}
};

CHtmlEditorView.prototype.undoAndClearRedo = function ()
{
	if (this.oCrea)
	{
		this.oCrea.undo();
		this.oCrea.clearRedo();
	}
};

CHtmlEditorView.prototype.clearUndoRedo = function ()
{
	if (this.oCrea)
	{
		this.oCrea.clearUndoRedo();
	}
};

CHtmlEditorView.prototype.isEditing = function ()
{
	return this.oCrea ? this.oCrea.bEditing : false;
};

/**
 * @param {string} sText
 */
CHtmlEditorView.prototype.removeAllTags = function (sText)
{
	return sText.replace(/<style>.*<\/style>/g, '').replace(/<[^>]*>/g, '');
};

CHtmlEditorView.prototype.onCreaFocus = function ()
{
	if (this.oCrea)
	{
		this.closeAllPopups();
		this.textFocused(true);
	}
};

CHtmlEditorView.prototype.onCreaBlur = function ()
{
	if (this.oCrea)
	{
		this.textFocused(false);
	}
};

CHtmlEditorView.prototype.onEscHandler = function ()
{
	if (!Popups.hasOpenedMaximizedPopups())
	{
		this.closeAllPopups();
	}
};

/**
 * @param {boolean} bWithoutLinkPopup
 */
CHtmlEditorView.prototype.closeAllPopups = function (bWithoutLinkPopup)
{
	bWithoutLinkPopup = !!bWithoutLinkPopup;
	if (!bWithoutLinkPopup)
	{
		this.visibleLinkPopup(false);
	}
	this.visibleInsertLinkPopup(false);
	this.visibleImagePopup(false);
	this.visibleInsertImagePopup(false);
	this.visibleFontColorPopup(false);
	this.visibleTemplatePopup(false);
};

/**
 * @param {string} sHtml
 */
CHtmlEditorView.prototype.insertHtml = function (sHtml)
{
	if (this.oCrea)
	{
		if (!this.oCrea.isFocused())
		{
			this.oCrea.setFocus(true);
		}
		
		this.oCrea.insertHtml(sHtml, false);
	}
};

/**
 * @param {Object} oViewModel
 * @param {Object} oEvent
 */
CHtmlEditorView.prototype.insertLink = function (oViewModel, oEvent)
{
	if (!this.inactive() && !this.visibleInsertLinkPopup())
	{
		if (oEvent && _.isFunction(oEvent.stopPropagation))
		{
			oEvent.stopPropagation();
		}
		this.linkForInsert(this.oCrea.getSelectedText());
		this.closeAllPopups();
		this.visibleInsertLinkPopup(true);
		this.linkFocused(true);
	}
};

/**
 * @param {Object} oCurrentViewModel
 * @param {Object} event
 */
CHtmlEditorView.prototype.insertLinkFromPopup = function (oCurrentViewModel, event)
{
	if (this.linkForInsert().length > 0)
	{
		if (AddressUtils.isCorrectEmail(this.linkForInsert()))
		{
			this.oCrea.insertEmailLink(this.linkForInsert());
		}
		else
		{
			this.oCrea.insertLink(this.linkForInsert());
		}
	}
	
	this.closeInsertLinkPopup(oCurrentViewModel, event);
	
	return false;
};

/**
 * @param {Object} oCurrentViewModel
 * @param {Object} event
 */
CHtmlEditorView.prototype.closeInsertLinkPopup = function (oCurrentViewModel, event)
{
	this.visibleInsertLinkPopup(false);
	if (event)
	{
		event.stopPropagation();
	}
};

CHtmlEditorView.prototype.textColor = function (oViewModel, oEvent)
{
	if (!this.inactive())
	{
		this.closeAllPopups();
		if (!this.visibleFontColorPopup())
		{
			oEvent.stopPropagation();
			this.visibleFontColorPopup(true);
			this.oFontColorPickerView.onShow();
			this.oBackColorPickerView.onShow();
		}
	}
};

/**
 * @param {string} sColor
 * @return string
 */
CHtmlEditorView.prototype.colorToHex = function (sColor)
{
	if (sColor.substr(0, 1) === '#')
	{
		return sColor;
	}

	/*jslint bitwise: true*/
	var
		aDigits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(sColor),
		iRed = Types.pInt(aDigits[2]),
		iGreen = Types.pInt(aDigits[3]),
		iBlue = Types.pInt(aDigits[4]),
		iRgb = iBlue | (iGreen << 8) | (iRed << 16),
		sRgb = iRgb.toString(16)
	;
	/*jslint bitwise: false*/

	while (sRgb.length < 6)
	{
		sRgb = '0' + sRgb;
	}

	return aDigits[1] + '#' + sRgb;
};

/**
 * @param {string} sColor
 */
CHtmlEditorView.prototype.setTextColorFromPopup = function (sColor)
{
	this.oCrea.textColor(this.colorToHex(sColor));
	this.closeAllPopups();
};

/**
 * @param {string} sColor
 */
CHtmlEditorView.prototype.setBackColorFromPopup = function (sColor)
{
	this.oCrea.backgroundColor(this.colorToHex(sColor));
	this.closeAllPopups();
};

CHtmlEditorView.prototype.insertImage = function (oViewModel, oEvent)
{
	if (!this.inactive() && Settings.AllowInsertImage && !this.visibleInsertImagePopup())
	{
		oEvent.stopPropagation();
		this.imagePathFromWeb('');
		this.closeAllPopups();
		this.visibleInsertImagePopup(true);
		this.initUploader();
	}

	return true;
};

/**
 * @param {Object} oCurrentViewModel
 * @param {Object} event
 */
CHtmlEditorView.prototype.insertWebImageFromPopup = function (oCurrentViewModel, event)
{
	if (Settings.AllowInsertImage && this.imagePathFromWeb().length > 0)
	{
		this.oCrea.insertImage(this.imagePathFromWeb());
	}

	this.closeInsertImagePopup(oCurrentViewModel, event);
};

/**
 * @param {string} sUid
 * @param oAttachmentData
 */
CHtmlEditorView.prototype.insertComputerImageFromPopup = function (sUid, oAttachmentData)
{
	var
		iAccountId = _.isFunction(this.oParent && this.oParent.senderAccountId) ? this.oParent.senderAccountId() : MailCache.currentAccountId(),
		oAttachment = new CAttachmentModel(iAccountId),
		sViewLink = '',
		bResult = false
	;
	
	oAttachment.parse(oAttachmentData);
	sViewLink = oAttachment.getActionUrl('view');
	
	if (Settings.AllowInsertImage && sViewLink.length > 0)
	{
		bResult = this.oCrea.insertImage(sViewLink);
		if (bResult)
		{
			$(this.oCrea.$editableArea)
				.find('img[src="' + sViewLink + '"]')
				.attr('data-x-src-cid', sUid)
			;

			oAttachmentData.CID = sUid;
			this.aUploadedImagesData.push(oAttachmentData);
		}
	}

	this.closeInsertImagePopup();
};

CHtmlEditorView.prototype.getUploadedImagesData = function ()
{
	return this.aUploadedImagesData;
};

/**
 * @param {?=} oCurrentViewModel
 * @param {?=} event
 */
CHtmlEditorView.prototype.closeInsertImagePopup = function (oCurrentViewModel, event)
{
	this.visibleInsertImagePopup(false);
	if (event)
	{
		event.stopPropagation();
	}
};

/**
 * Initializes file uploader.
 */
CHtmlEditorView.prototype.initUploader = function ()
{
	// this.oJua must be re-initialized because compose popup is destroyed after it is closed
	if (this.imageUploaderButton())
	{
		this.oJua = new CJua({
			'action': '?/Api/',
			'name': 'jua-uploader',
			'queueSize': 2,
			'clickElement': this.imageUploaderButton(),
			'hiddenElementsPosition': UserSettings.IsRTL ? 'right' : 'left',
			'disableMultiple': true,
			'disableAjaxUpload': false,
			'disableDragAndDrop': true,
			'hidden': _.extendOwn({
				'Module': Settings.ServerModuleName,
				'Method': 'UploadAttachment',
				'Parameters':  function () {
					return JSON.stringify({
						'AccountID': MailCache.currentAccountId()
					});
				}
			}, App.getCommonRequestParameters())
		});

		if (this.bInsertImageAsBase64)
		{
			this.oJua
				.on('onSelect', _.bind(this.onEditorDrop, this))
			;
		}
		else
		{
			this.oJua
				.on('onSelect', _.bind(this.onFileUploadSelect, this))
				.on('onComplete', _.bind(this.onFileUploadComplete, this))
			;
		}
	}
};

/**
 * Initializes file uploader for editor.
 */
CHtmlEditorView.prototype.initEditorUploader = function ()
{
	// this.editorUploader must be re-initialized because compose popup is destroyed after it is closed
	if (Settings.AllowInsertImage && this.uploaderAreaDom())
	{
		var
			fBodyDragEnter = null,
			fBodyDragOver = null
		;

		if (this.oParent && this.oParent.composeUploaderDragOver && this.oParent.onFileUploadProgress &&
				this.oParent.onFileUploadStart && this.oParent.onFileUploadComplete)
		{
			fBodyDragEnter = _.bind(function () {
				this.editorUploaderBodyDragOver(true);
				this.oParent.composeUploaderDragOver(true);
			}, this);

			fBodyDragOver = _.bind(function () {
				this.editorUploaderBodyDragOver(false);
				this.oParent.composeUploaderDragOver(false);
			}, this);

			this.editorUploader = new CJua({
				'action': '?/Api/',
				'name': 'jua-uploader',
				'queueSize': 1,
				'dragAndDropElement': this.bAllowImageDragAndDrop ? this.uploaderAreaDom() : null,
				'disableMultiple': true,
				'disableAjaxUpload': false,
				'disableDragAndDrop': !this.bAllowImageDragAndDrop,
				'hidden': _.extendOwn({
					'Module': Settings.ServerModuleName,
					'Method': 'UploadAttachment',
					'Parameters':  function () {
						return JSON.stringify({
							'AccountID': MailCache.currentAccountId()
						});
					}
				}, App.getCommonRequestParameters())
			});

			this.editorUploader
				.on('onDragEnter', _.bind(this.oParent.composeUploaderDragOver, this.oParent, true))
				.on('onDragLeave', _.bind(this.oParent.composeUploaderDragOver, this.oParent, false))
				.on('onBodyDragEnter', fBodyDragEnter)
				.on('onBodyDragLeave', fBodyDragOver)
				.on('onProgress', _.bind(this.oParent.onFileUploadProgress, this.oParent))
				.on('onSelect', _.bind(this.onEditorDrop, this))
				.on('onStart', _.bind(this.oParent.onFileUploadStart, this.oParent))
				.on('onComplete', _.bind(this.oParent.onFileUploadComplete, this.oParent))
			;
		}
		else
		{
			fBodyDragEnter = _.bind(this.editorUploaderBodyDragOver, this, true);
			fBodyDragOver = _.bind(this.editorUploaderBodyDragOver, this, false);

			this.editorUploader = new CJua({
				'queueSize': 1,
				'dragAndDropElement': this.bAllowImageDragAndDrop ? this.uploaderAreaDom() : null,
				'disableMultiple': true,
				'disableAjaxUpload': false,
				'disableDragAndDrop': !this.bAllowImageDragAndDrop
			});

			this.editorUploader
				.on('onBodyDragEnter', fBodyDragEnter)
				.on('onBodyDragLeave', fBodyDragOver)
				.on('onSelect', _.bind(this.onEditorDrop, this))
			;
		}
	}
};

CHtmlEditorView.prototype.isDragAndDropSupported = function ()
{
	return this.editorUploader ? this.editorUploader.isDragAndDropSupported() : false;
};

CHtmlEditorView.prototype.onEditorDrop = function (sUid, oData) {
	var 
		oReader = null,
		oFile = null,
		self = this,
		bCreaFocused = false,
		hash = Math.random().toString(),
		sId = ''
	;
	
	if (oData && oData.File && (typeof oData.File.type === 'string'))
	{
		if (Settings.AllowInsertImage && 0 === oData.File.type.indexOf('image/'))
		{
			oFile = oData.File;
			if (Settings.ImageUploadSizeLimit > 0 && oFile.size > Settings.ImageUploadSizeLimit)
			{
				Popups.showPopup(AlertPopup, [TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_SIZE')]);
			}
			else
			{
				oReader = new window.FileReader();
				bCreaFocused = this.oCrea.isFocused();
				if (!bCreaFocused)
				{
					this.oCrea.setFocus(true);
				}

				sId = oFile.name + '_' + hash;
				this.oCrea.insertHtml('<img id="' + sId + '" src="./static/styles/images/wait.gif" />', true);
				if (!bCreaFocused)
				{
					this.oCrea.fixFirefoxCursorBug();
				}

				oReader.onload = function (oEvent) {
					self.oCrea.changeImageSource(sId, oEvent.target.result);
				};

				oReader.readAsDataURL(oFile);
			}
		}
		else
		{
			if (this.oParent && this.oParent.onFileUploadSelect)
			{
				this.oParent.onFileUploadSelect(sUid, oData);
				return true;
			}
			else if (!Browser.ie10AndAbove)
			{
				Popups.showPopup(AlertPopup, [TextUtils.i18n('MAILWEBCLIENT/ERROR_NOT_IMAGE_CHOOSEN')]);
			}
		}
	}
	
	return false;
};

/**
 * @param {Object} oFile
 */
CHtmlEditorView.prototype.isFileImage = function (oFile)
{
	if (typeof oFile.Type === 'string')
	{
		return (-1 !== oFile.Type.indexOf('image'));
	}
	else
	{
		var
			iDotPos = oFile.FileName.lastIndexOf('.'),
			sExt = oFile.FileName.substr(iDotPos + 1),
			aImageExt = ['jpg', 'jpeg', 'gif', 'tif', 'tiff', 'png']
		;

		return (-1 !== $.inArray(sExt, aImageExt));
	}
};

/**
 * @param {string} sUid
 * @param {Object} oFile
 */
CHtmlEditorView.prototype.onFileUploadSelect = function (sUid, oFile)
{
	if (!this.isFileImage(oFile))
	{
		Popups.showPopup(AlertPopup, [TextUtils.i18n('MAILWEBCLIENT/ERROR_NOT_IMAGE_CHOOSEN')]);
		return false;
	}
	
	this.closeInsertImagePopup();
	return true;
};

/**
 * @param {string} sUid
 * @param {boolean} bResponseReceived
 * @param {Object} oData
 */
CHtmlEditorView.prototype.onFileUploadComplete = function (sUid, bResponseReceived, oData)
{
	var sError = '';
	
	if (oData && oData.Result)
	{
		if (oData.Result.Error)
		{
			sError = oData.Result.Error === 'size' ?
				TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_SIZE') :
				TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_UNKNOWN');

			Popups.showPopup(AlertPopup, [sError]);
		}
		else
		{
			this.oCrea.setFocus(true);
			this.insertComputerImageFromPopup(sUid, oData.Result.Attachment);
		}
	}
	else
	{
		Popups.showPopup(AlertPopup, [TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_UNKNOWN')]);
	}
};

CHtmlEditorView.prototype.undo = function ()
{
	if (!this.inactive())
	{
		this.oCrea.undo();
	}
	return false;
};

CHtmlEditorView.prototype.redo = function ()
{
	if (!this.inactive())
	{
		this.oCrea.redo();
	}
	return false;
};

CHtmlEditorView.prototype.bold = function ()
{
	if (!this.inactive())
	{
		this.oCrea.bold();
		this.isFWBold(!this.isFWBold());
	}
	return false;
};

CHtmlEditorView.prototype.italic = function ()
{
	if (!this.inactive())
	{
		this.oCrea.italic();
		this.isFSItalic(!this.isFSItalic());
	}
	return false;
};

CHtmlEditorView.prototype.underline = function ()
{
	if (!this.inactive())
	{
		this.oCrea.underline();
		this.isTDUnderline(!this.isTDUnderline());
	}
	return false;
};

CHtmlEditorView.prototype.strikeThrough = function ()
{
	if (!this.inactive())
	{
		this.oCrea.strikeThrough();
		this.isTDStrikeThrough(!this.isTDStrikeThrough());
	}
	return false;
};

CHtmlEditorView.prototype.numbering = function ()
{
	if (!this.inactive())
	{
		this.oCrea.numbering();
        this.isBullets(false);
        this.isEnumeration(!this.isEnumeration());
	}
    return false;
};

CHtmlEditorView.prototype.bullets = function ()
{
    if (!this.inactive())
	{
        this.oCrea.bullets();
        this.isEnumeration(false);
        this.isBullets(!this.isBullets());
    }
	return false;
};

CHtmlEditorView.prototype.removeFormat = function ()
{
	if (!this.inactive())
	{
		this.oCrea.removeFormat();
	}
	return false;
};

CHtmlEditorView.prototype.setRtlDirection = function ()
{
	if (!this.inactive())
	{
		this.oCrea.setRtlDirection();
	}
	return false;
};

CHtmlEditorView.prototype.setLtrDirection = function ()
{
	if (!this.inactive())
	{
		this.oCrea.setLtrDirection();
	}
	return false;
};

module.exports = CHtmlEditorView;


/***/ }),

/***/ "bBfe":
/*!**********************************************************!*\
  !*** ./modules/MailWebclient/js/models/CFetcherModel.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	AddressUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Address.js */ "Ol7c"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd")
;

/**
 * @constructor
 */
function CFetcherModel()
{
	this.FETCHER = true; // constant
	
	this.id = ko.observable(0);
	this.accountId = ko.observable(0);
	this.hash = ko.computed(function () {
		return Utils.getHash(this.accountId() + 'fetcher' + this.id());
	}, this);
	this.isEnabled = ko.observable(false);
	this.isLocked = ko.observable(false).extend({'autoResetToFalse': 1000});
	this.email = ko.observable('');
	this.userName = ko.observable('');
	this.folder = ko.observable('');
	this.useSignature = ko.observable(false);
	this.signature = ko.observable('');
	this.incomingServer = ko.observable('');
	this.incomingPort = ko.observable(0);
	this.incomingUseSsl = ko.observable(false);
	this.incomingLogin = ko.observable('');
	this.leaveMessagesOnServer = ko.observable('');
	this.isOutgoingEnabled = ko.observable(false);
	this.outgoingServer = ko.observable('');
	this.outgoingPort = ko.observable(0);
	this.outgoingUseSsl = ko.observable(false);
	this.outgoingUseAuth = ko.observable(false);
	
	this.iCheckIntervalMinutes = 0;
	
	this.fullEmail = ko.computed(function () {
		return AddressUtils.getFullEmail(this.userName(), this.email());
	}, this);
}

/**
 * @param {Object} oData
 */
CFetcherModel.prototype.parse = function (oData)
{
	this.id(Types.pInt(oData.EntityId));
	this.accountId(Types.pInt(oData.IdAccount));
	this.isEnabled(!!oData.IsEnabled);
	this.isLocked(!!oData.IsLocked);
	this.email(Types.pString(oData.Email));
	this.userName(Types.pString(oData.Name));
	this.folder(Types.pString(oData.Folder));
	this.useSignature(!!oData.UseSignature);
	var sSignature = Types.pString(oData.Signature);
	if (sSignature.indexOf('<') !== 0) {
		sSignature = '<div>' + sSignature + '</div>';
	}
	this.signature = ko.observable(sSignature);
	this.incomingServer(Types.pString(oData.IncomingServer));
	this.incomingPort(Types.pInt(oData.IncomingPort));
	this.incomingUseSsl(!!oData.IncomingUseSsl);
	this.incomingLogin(Types.pString(oData.IncomingLogin));
	this.leaveMessagesOnServer(!!oData.LeaveMessagesOnServer);
	this.isOutgoingEnabled(!!oData.IsOutgoingEnabled);
	this.outgoingServer(Types.pString(oData.OutgoingServer));
	this.outgoingPort(Types.pInt(oData.OutgoingPort));
	this.outgoingUseSsl(!!oData.OutgoingUseSsl);
	this.outgoingUseAuth(!!oData.OutgoingUseAuth);
	this.iCheckIntervalMinutes = Types.pInt(oData.CheckInterval, 0);
};

module.exports = CFetcherModel;


/***/ }),

/***/ "cGGv":
/*!***************************************************************!*\
  !*** ./modules/CoreWebclient/js/models/CAbstractFileModel.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	FilesUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Files.js */ "QFUI"),
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	UrlUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Url.js */ "ZP6a"),
	Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
	
	WindowOpener = __webpack_require__(/*! modules/CoreWebclient/js/WindowOpener.js */ "ZCBP"),
	
	aViewMimeTypes = [
		'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
		'text/html', 'text/plain', 'text/css',
		'text/rfc822-headers', 'message/delivery-status',
		'application/x-httpd-php', 'application/javascript'
	],
	
	aViewExtensions = []
;

if ($('html').hasClass('pdf'))
{
	aViewMimeTypes.push('application/pdf');
	aViewMimeTypes.push('application/x-pdf');
}

/**
 * @constructor
 */
function CAbstractFileModel()
{
	this.id = ko.observable('');
	this.index = ko.observable(0);
	this.fileName = ko.observable('');
	this.tempName = ko.observable('');
	this.displayName = ko.observable('');
	this.extension = ko.observable('');
	
	this.fileName.subscribe(function (sFileName) {
		this.id(sFileName);
		this.displayName(sFileName);
		this.extension(Utils.getFileExtension(sFileName));
	}, this);
	
	this.size = ko.observable(0);
	this.friendlySize = ko.computed(function () {
		return this.size() > 0 ? TextUtils.getFriendlySize(this.size()) : '';
	}, this);
	
	this.hash = ko.observable('');
	
	this.thumbUrlInQueue = ko.observable('');
	this.thumbUrlInQueueSubscribtion = this.thumbUrlInQueue.subscribe(function () {
		this.getInThumbQueue();
	}, this);

	this.thumbnailSrc = ko.observable('');
	this.thumbnailLoaded = ko.observable(false);
	this.thumbnailSessionUid = ko.observable('');

	this.mimeType = ko.observable('');
	this.uploadUid = ko.observable('');
	this.uploaded = ko.observable(false);
	this.uploadError = ko.observable(false);
	this.downloading = ko.observable(false);
	this.isViewMimeType = ko.computed(function () {
		return (-1 !== $.inArray(this.mimeType(), aViewMimeTypes));
	}, this);
	this.bHasHtmlEmbed = false;
	
	this.otherTemplates = ko.observableArray([]);

	// Some modules can override this field if it is necessary to manage it.
	this.visibleCancelButton = ko.observable(true);
	
	this.statusText = ko.observable('');
	this.statusTooltip = ko.computed(function () {
		return this.uploadError() ? this.statusText() : '';
	}, this);
	this.progressPercent = ko.observable(0);
	this.visibleProgress = ko.observable(false);
	
	this.uploadStarted = ko.observable(false);
	this.uploadStarted.subscribe(function () {
		if (this.uploadStarted())
		{
			this.uploaded(false);
			this.visibleProgress(true);
			this.progressPercent(20);
		}
		else
		{
			this.progressPercent(100);
			this.visibleProgress(false);
			this.uploaded(true);
		}
	}, this);
	
	this.downloading.subscribe(function () {
		if (this.downloading())
		{
			this.visibleProgress(true);
		}
		else
		{
			this.visibleProgress(false);
			this.progressPercent(0);
		}
	}, this);
	
	this.allowDrag = ko.observable(false);
	this.allowUpload = ko.observable(false);
	this.allowPublicLink = ko.observable(false);
	this.bIsSecure = ko.observable(false);
	this.isShared = ko.observable(false);
	
	this.sHeaderText = '';

	this.oActionsData = {
		'view': {
			'Text': TextUtils.i18n('COREWEBCLIENT/ACTION_VIEW_FILE'),
			'HandlerName': 'viewFile'
		},
		'download': {
			'Text': TextUtils.i18n('COREWEBCLIENT/ACTION_DOWNLOAD_FILE'),
			'HandlerName': 'downloadFile',
			'Tooltip': ko.computed(function () {
				var sTitle = TextUtils.i18n('COREWEBCLIENT/INFO_CLICK_TO_DOWNLOAD_FILE', {
					'FILENAME': this.fileName(),
					'SIZE': this.friendlySize()
				});

				if (this.friendlySize() === '')
				{
					sTitle = sTitle.replace(' ()', '');
				}

				return sTitle;
			}, this)
		}
	};
	
	this.allowActions = ko.observable(true);
	
	this.iconAction = ko.observable('download');
	
	this.cssClasses = ko.computed(function () {
		return this.getCommonClasses().join(' ');
	}, this);
	
	this.actions = ko.observableArray([]);
	
	this.firstAction = ko.computed(function () {
		if (this.actions().length > 1)
		{
			return this.actions()[0];
		}
		return '';
	}, this);
	
	this.secondAction = ko.computed(function () {
		if (this.actions().length === 1)
		{
			return this.actions()[0];
		}
		if (this.actions().length > 1)
		{
			return this.actions()[1];
		}
		return '';
	}, this);
	
	this.subFiles = ko.observableArray([]);
	this.subFilesExpanded = ko.observable(false);
	
	this.sUploadSubFolder = '';
	this.bIsHidden = false;
}

CAbstractFileModel.prototype.addAction = function (sAction, bMain, oActionData)
{
	if (bMain)
	{
		this.actions.unshift(sAction);
	}
	else
	{
		this.actions.push(sAction);
	}
	this.actions(_.compact(this.actions()));
	if (oActionData)
	{
		this.oActionsData[sAction] = oActionData;
	}
};

CAbstractFileModel.prototype.removeAction = function (sAction)
{
	this.actions(_.without(this.actions(), sAction));
};

CAbstractFileModel.prototype.getMainAction = function ()
{
	return this.actions()[0];
};

CAbstractFileModel.prototype.hasAction = function (sAction)
{
	return _.indexOf(this.actions(), sAction) !== -1;
};

/**
 * Returns button text for specified action.
 * @param {string} sAction
 * @returns string
 */
CAbstractFileModel.prototype.getActionText = function (sAction)
{
	if (this.hasAction(sAction) && this.oActionsData[sAction] && (typeof this.oActionsData[sAction].Text === 'string' || _.isFunction(this.oActionsData[sAction].Text)))
	{
		return _.isFunction(this.oActionsData[sAction].Text) ? this.oActionsData[sAction].Text() : this.oActionsData[sAction].Text;
	}
	return '';
};

CAbstractFileModel.prototype.getActionUrl = function (sAction)
{
	return (this.hasAction(sAction) && this.oActionsData[sAction]) ? (this.oActionsData[sAction].Url || '') : '';
};

/**
 * Executes specified action.
 * @param {string} sAction
 */
CAbstractFileModel.prototype.executeAction = function (sAction)
{
	var oData = this.hasAction(sAction) && this.oActionsData[sAction];
	if (oData)
	{
		if (_.isFunction(oData.Handler)) {
			oData.Handler();
		}
		else if (typeof oData.HandlerName === 'string' && _.isFunction(this[oData.HandlerName]))
		{
			this[oData.HandlerName]();
		}
	}
};

/**
 * Returns tooltip for specified action.
 * @param {string} sAction
 * @returns string
 */
CAbstractFileModel.prototype.getTooltip = function (sAction)
{
	var mTootip = this.hasAction(sAction) && this.oActionsData[sAction] ? this.oActionsData[sAction].Tooltip : '';
	if (typeof mTootip === 'string')
	{
		return mTootip;
	}
	if (_.isFunction(mTootip))
	{
		return mTootip();
	}
	return '';
};

/**
 * Returns list of css classes for file.
 * @returns array
 */
CAbstractFileModel.prototype.getCommonClasses = function ()
{
	var aClasses = [];

	if ((this.allowUpload() && !this.uploaded()) || this.downloading())
	{
		aClasses.push('incomplete');
	}
	if (this.uploadError())
	{
		aClasses.push('fail');
	}
	else
	{
		aClasses.push('success');
	}

	return aClasses;
};

/**
 * Parses attachment data from server.
 * @param {AjaxAttachmenResponse} oData
 */
CAbstractFileModel.prototype.parse = function (oData)
{
	this.fileName(Types.pString(oData.FileName));
	this.tempName(Types.pString(oData.TempName));
	if (this.tempName() === '')
	{
		this.tempName(this.fileName());
	}

	this.mimeType(Types.pString(oData.MimeType));
	this.size(oData.EstimatedSize ? Types.pInt(oData.EstimatedSize) : Types.pInt(oData.SizeInBytes));

	this.hash(Types.pString(oData.Hash));

	this.parseActions(oData);

	this.uploadUid(this.hash());
	this.uploaded(true);

	if ($.isFunction(this.additionalParse))
	{
		this.additionalParse(oData);
	}
};

CAbstractFileModel.prototype.parseActions = function (oData)
{
	this.thumbUrlInQueue(Types.pString(oData.ThumbnailUrl) !== '' ? Types.pString(oData.ThumbnailUrl) + '/' + Math.random() : '');
	this.commonParseActions(oData);
	this.commonExcludeActions();
};

CAbstractFileModel.prototype.commonExcludeActions = function ()
{
	if (!this.isViewSupported())
	{
		this.actions(_.without(this.actions(), 'view'));
	}
};

CAbstractFileModel.prototype.commonParseActions = function (oData)
{
	_.each (oData.Actions, function (oData, sAction) {
		if (!this.oActionsData[sAction])
		{
			this.oActionsData[sAction] = {};
		}
		this.oActionsData[sAction].Url = Types.pString(oData.url);
		this.actions.push(sAction);
	}, this);
};

CAbstractFileModel.addViewExtensions = function (aAddViewExtensions)
{
	if (_.isArray(aAddViewExtensions))
	{
		aViewExtensions = _.union(aViewExtensions, aAddViewExtensions);
	}
};

CAbstractFileModel.prototype.isViewSupported = function ()
{
	return (-1 !== $.inArray(this.mimeType(), aViewMimeTypes) || -1 !== $.inArray(this.extension(), aViewExtensions));
};

CAbstractFileModel.prototype.getInThumbQueue = function ()
{
	if(this.thumbUrlInQueue() !== '' && (!this.linked || this.linked && !this.linked()))
	{
		this.thumbnailSessionUid(Date.now().toString());
		FilesUtils.thumbQueue(this.thumbnailSessionUid(), this.thumbUrlInQueue(), this.thumbnailSrc);
	}
};

/**
 * Starts downloading attachment on click.
 */
CAbstractFileModel.prototype.downloadFile = function (bNotBroadcastEvent)
{
	//todo: UrlUtils.downloadByUrl in nessesary context in new window
	var 
		sDownloadLink = this.getActionUrl('download'),
		oParams = {
			'File': this,
			'CancelDownload': false
		}
	;
	if (sDownloadLink.length > 0 && sDownloadLink !== '#')
	{
		if (!bNotBroadcastEvent)
		{
			App.broadcastEvent('AbstractFileModel::FileDownload::before', oParams);
		}
		if (!oParams.CancelDownload)
		{
			if (_.isFunction(oParams.CustomDownloadHandler))
			{
				oParams.CustomDownloadHandler();
			}
			else
			{
				UrlUtils.downloadByUrl(sDownloadLink, this.extension() === 'eml');
			}
		}
	}
};

/**
 * Can be overridden.
 * Starts viewing attachment on click.
 * @param {Object} oViewModel
 * @param {Object} oEvent
 */
CAbstractFileModel.prototype.viewFile = function (oViewModel, oEvent)
{
	Utils.calmEvent(oEvent);
	this.viewCommonFile();
};

/**
 * Starts viewing attachment on click.
 * @param {string=} sUrl
 */
CAbstractFileModel.prototype.viewCommonFile = function (sUrl)
{
	var 
		oWin = null,
		oParams = null
	;
	
	if (!Types.isNonEmptyString(sUrl))
	{
		sUrl = UrlUtils.getAppPath() + this.getActionUrl('view');
	}

	if (sUrl.length > 0 && sUrl !== '#')
	{
		oParams = {sUrl: sUrl, index: this.index(), bBreakView: false};
		
		App.broadcastEvent('AbstractFileModel::FileView::before', oParams);
		
		if (!oParams.bBreakView)
		{
			oWin = WindowOpener.open(sUrl, sUrl, false);

			if (oWin)
			{
				oWin.focus();
			}
		}
	}
};

/**
 * @param {Object} oAttachment
 * @param {*} oEvent
 * @return {boolean}
 */
CAbstractFileModel.prototype.eventDragStart = function (oAttachment, oEvent)
{
	var oLocalEvent = oEvent.originalEvent || oEvent;
	if (oAttachment && oLocalEvent && oLocalEvent.dataTransfer && oLocalEvent.dataTransfer.setData)
	{
		oLocalEvent.dataTransfer.setData('DownloadURL', this.generateTransferDownloadUrl());
	}

	return true;
};

/**
 * @return {string}
 */
CAbstractFileModel.prototype.generateTransferDownloadUrl = function ()
{
	var sLink = this.getActionUrl('download');
	if ('http' !== sLink.substr(0, 4))
	{
		sLink = UrlUtils.getAppPath() + sLink;
	}

	return this.mimeType() + ':' + this.fileName() + ':' + sLink;
};

/**
 * Fills attachment data for upload.
 *
 * @param {string} sFileUid
 * @param {Object} oFileData
 * @param {bool} bOnlyUploadStatus
 */
CAbstractFileModel.prototype.onUploadSelect = function (sFileUid, oFileData, bOnlyUploadStatus)
{
	if (!bOnlyUploadStatus)
	{
		this.fileName(Types.pString(oFileData['FileName']));
		this.mimeType(Types.pString(oFileData['Type']));
		this.size(Types.pInt(oFileData['Size']));
	}
	
	this.uploadUid(sFileUid);
	this.uploaded(false);
	this.statusText('');
	this.progressPercent(0);
	this.visibleProgress(false);
	
	// if uploading file is from uploading folder it should be hidden in files list.
	this.sUploadSubFolder = Types.pString(oFileData.Folder);
	this.bIsHidden = this.sUploadSubFolder !== '';
};

/**
 * Starts progress.
 */
CAbstractFileModel.prototype.onUploadStart = function ()
{
	this.visibleProgress(true);
};

/**
 * Fills progress upload data.
 *
 * @param {number} iUploadedSize
 * @param {number} iTotalSize
 */
CAbstractFileModel.prototype.onUploadProgress = function (iUploadedSize, iTotalSize)
{
	if (iTotalSize > 0)
	{
		this.progressPercent(Math.ceil(iUploadedSize / iTotalSize * 100));
		this.visibleProgress(true);
	}
};

/**
 * Fills progress download data.
 *
 * @param {number} iDownloadedSize
 * @param {number} iTotalSize
 */
CAbstractFileModel.prototype.onDownloadProgress = function (iDownloadedSize, iTotalSize)
{
	if (iTotalSize > 0)
	{
		this.progressPercent(Math.ceil(iDownloadedSize / iTotalSize * 100));
		this.visibleProgress(this.progressPercent() < 100);
	}
};

/**
 * Fills data when upload has completed.
 *
 * @param {string} sFileUid
 * @param {boolean} bResponseReceived
 * @param {Object} oResponse
 */
CAbstractFileModel.prototype.onUploadComplete = function (sFileUid, bResponseReceived, oResponse)
{
	var
		bError = !bResponseReceived || !oResponse || !!oResponse.ErrorCode || !oResponse.Result || !!oResponse.Result.Error || false,
		sError = (oResponse && oResponse.ErrorCode && oResponse.ErrorCode === Enums.Errors.CanNotUploadFileLimit) ?
			TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_SIZE') :
			TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_UNKNOWN')
	;

	this.progressPercent(0);
	this.visibleProgress(false);
	
	this.uploaded(true);
	this.uploadError(bError);
	this.statusText(bError ? sError : TextUtils.i18n('COREWEBCLIENT/REPORT_UPLOAD_COMPLETE'));

	if (!bError)
	{
		this.fillDataAfterUploadComplete(oResponse, sFileUid);
		
		setTimeout((function (self) {
			return function () {
				self.statusText('');
			};
		})(this), 3000);
	}
};

/**
 * Should be overriden.
 * 
 * @param {Object} oResult
 * @param {string} sFileUid
 */
CAbstractFileModel.prototype.fillDataAfterUploadComplete = function (oResult, sFileUid)
{
};

/**
 * @param {Object} oAttachmentModel
 * @param {Object} oEvent
 */
CAbstractFileModel.prototype.onImageLoad = function (oAttachmentModel, oEvent)
{
	if(this.thumbUrlInQueue() !== '' && !this.thumbnailLoaded())
	{
		this.thumbnailLoaded(true);
		FilesUtils.thumbQueue(this.thumbnailSessionUid());
	}
};

/**
 * Signalise that file download was stoped.
 */
CAbstractFileModel.prototype.stopDownloading = function ()
{
	this.downloading(false);
};

/**
 * Signalise that file download was started.
 */
CAbstractFileModel.prototype.startDownloading = function ()
{
	this.downloading(true);
};

module.exports = CAbstractFileModel;


/***/ }),

/***/ "cPXi":
/*!************************************************!*\
  !*** ./modules/MailWebclient/js/Prefetcher.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),

	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	UserSettings = __webpack_require__(/*! modules/CoreWebclient/js/Settings.js */ "hPb3"),
	
	AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm"),
	Ajax = __webpack_require__(/*! modules/MailWebclient/js/Ajax.js */ "UN2P"),
	Settings = __webpack_require__(/*! modules/MailWebclient/js/Settings.js */ "p2hp"),
	MailCache = __webpack_require__(/*! modules/MailWebclient/js/Cache.js */ "4+IO"),

	Prefetcher = {},
	bFetchersIdentitiesPrefetched = false
;

Prefetcher.prefetchFolderLists = function ()
{
	if (AccountList.unifiedInboxAllowed() && !AccountList.unifiedInboxReady())
	{
		var oAccount = _.find(AccountList.collection(), function (oAcct) {
			return oAcct.includeInUnifiedMailbox() && !MailCache.oFolderListItems[oAcct.id()];
		}, this);
		if (oAccount)
		{
			MailCache.getFolderList(oAccount.id());
			return true;
		}
		else
		{
			AccountList.unifiedInboxReady(true);
		}
	}
	return false;
};

Prefetcher.prefetchFetchersIdentities = function ()
{
	if (!App.isNewTab() && !bFetchersIdentitiesPrefetched && (Settings.AllowFetchers || Settings.AllowIdentities))
	{
		AccountList.populateFetchersIdentities();
		bFetchersIdentitiesPrefetched = true;
		
		return true;
	}
	return false;
};

Prefetcher.prefetchAccountFilters = function ()
{
	var
		oAccount = AccountList.getCurrent(),
		bFiltersRequested = false
	;
	
	if (oAccount && oAccount.allowFilters() && !oAccount.filters())
	{
		oAccount.requestFilters();
		bFiltersRequested = true;
	}
	
	return bFiltersRequested;
};

/**
 * Prefetches message list with specified parameters. Checks if this list have already prefetched earlier.
 * @param {Object} oFolder
 * @param {number} iPage
 * @param {string} sSearch
 * @param {string} sFilters
 * @returns {Boolean}
 */
Prefetcher.prefetchMessageList = function (oFolder, iPage, sSearch, sFilters)
{
	var
		oParams = {
			page: iPage,
			search: sSearch,
			filters: sFilters
		},
		bDoNotRequest = oFolder.hasListBeenRequested(oParams),
		oRequestData = null
	;

	oRequestData = MailCache.requestMessageList(oFolder.fullName(), oParams.page, oParams.search, oParams.filters,
										Settings.MessagesSortBy.DefaultSortBy, Settings.MessagesSortBy.DefaultSortOrder,
										false, false, bDoNotRequest);

	return !bDoNotRequest && !!oRequestData && oRequestData.RequestStarted;
};

Prefetcher.prefetchStarredMessageList = function ()
{
	var
		oFolderList = MailCache.folderList(),
		oInbox = oFolderList ? oFolderList.inboxFolder() : null,
		bRequestStarted = false
	;

	if (oInbox)
	{
		bRequestStarted = this.prefetchMessageList(oInbox, 1, '', Enums.FolderFilter.Flagged);
	}
	
	return bRequestStarted;
};

Prefetcher.prefetchUnseenMessageList = function ()
{
	var
		oFolderList = MailCache.folderList(),
		oInbox = oFolderList ? oFolderList.inboxFolder() : null,
		bRequestStarted = false
	;

	if (oInbox)
	{
		bRequestStarted = this.prefetchMessageList(oInbox, 1, '', Enums.FolderFilter.Unseen);
	}

	return bRequestStarted;
};

/**
 * @param {string} sCurrentUid
 */
Prefetcher.prefetchNextPage = function (sCurrentUid)
{
	var
		oUidList = MailCache.uidList(),
		iIndex = _.indexOf(oUidList.collection(), sCurrentUid),
		iPage = Math.ceil(iIndex/Settings.MailsPerPage) + 1
	;
	this.startPagePrefetch(iPage - 1);
};

/**
 * @param {string} sCurrentUid
 */
Prefetcher.prefetchPrevPage = function (sCurrentUid)
{
	var
		oUidList = MailCache.uidList(),
		iIndex = _.indexOf(oUidList.collection(), sCurrentUid),
		iPage = Math.ceil((iIndex + 1)/Settings.MailsPerPage) + 1
	;
	this.startPagePrefetch(iPage);
};

/**
 * @param {number} iPage
 */
Prefetcher.startPagePrefetch = function (iPage)
{
	var
		oCurrFolder = MailCache.getCurrentFolder(),
		oUidList = MailCache.uidList(),
		iOffset = (iPage - 1) * Settings.MailsPerPage,
		bPageExists = iPage > 0 && iOffset < oUidList.resultCount(),
		bRequestStarted = false
	;
	
	if (oCurrFolder && !oCurrFolder.hasChanges() && bPageExists)
	{
		bRequestStarted = this.prefetchMessageList(oCurrFolder, iPage, oUidList.search(), '');
	}
	
	return bRequestStarted;
};

Prefetcher.startUnifiedInboxPrefetch = function ()
{
	if (AccountList.unifiedInboxReady())
	{
		return this.startFolderPrefetch(MailCache.oUnifiedInbox);
	}
	return false;
};

Prefetcher.startOtherFoldersPrefetch = function ()
{
	var
		oFolderList = MailCache.folderList(),
		sCurrFolder = oFolderList.currentFolderFullName(),
		aFoldersFromAccount = MailCache.getNamesOfFoldersToRefresh(MailCache.currentAccountId()),
		aSystemFolders = oFolderList ? [oFolderList.inboxFolderFullName(), oFolderList.sentFolderFullName(), oFolderList.draftsFolderFullName(), oFolderList.spamFolderFullName()] : [],
		aOtherFolders = (aFoldersFromAccount.length < 5) ? this.getOtherFolderNames(5 - aFoldersFromAccount.length) : [],
		aFolders = _.uniq(_.compact(_.union(aSystemFolders, aFoldersFromAccount, aOtherFolders))),
		bPrefetchStarted = false
	;

	_.each(aFolders, _.bind(function (sFolder) {
		if (!bPrefetchStarted && sCurrFolder !== sFolder)
		{
			bPrefetchStarted = this.startFolderPrefetch(oFolderList.getFolderByFullName(sFolder));
		}
	}, this));

	return bPrefetchStarted;
};

/**
 * @param {number} iCount
 * @returns {Array}
 */
Prefetcher.getOtherFolderNames = function (iCount)
{
	var
		oInbox = MailCache.folderList().inboxFolder(),
		aInboxSubFolders = oInbox ? oInbox.subfolders() : [],
		aOtherFolders = _.filter(MailCache.folderList().collection(), function (oFolder) {
			return !oFolder.isSystem();
		}, this),
		aFolders = _.first(_.union(aInboxSubFolders, aOtherFolders), iCount)
	;
	
	return _.map(aFolders, function (oFolder) {
		return oFolder.fullName();
	});
};

/**
 * @param {Object} oFolder
 */
Prefetcher.startFolderPrefetch = function (oFolder)
{
	var bRequestStarted = false;

	if (oFolder)
	{
		bRequestStarted = this.prefetchMessageList(oFolder, 1, '', '');
	}

	return bRequestStarted;
};

Prefetcher.startThreadListPrefetch = function ()
{
	var
		bPrefetchStarted = false,
		oUidsForLoad = {},
		oFolders = {},
		oCurrFolder = MailCache.getCurrentFolder()
	;

	_.each(MailCache.messages(), function (oCacheMess) {
		if (oCacheMess.threadCount() > 0)
		{
			var
				iAccountId = oCacheMess.accountId(),
				oFolder = oCurrFolder.bIsUnifiedInbox ? oCurrFolder.getUnifiedInbox(iAccountId) : oCurrFolder
			;
			if (!_.isArray(oUidsForLoad[iAccountId]))
			{
				oUidsForLoad[iAccountId] = [];
				oFolders[iAccountId] = oFolder;
			}
			_.each(oCacheMess.threadUids(), function (sThreadUid) {
				if (!oFolder.hasThreadUidBeenRequested(sThreadUid))
				{
					oUidsForLoad[iAccountId].push(sThreadUid);
				}
			});
		}
	}, this);

	_.each(oUidsForLoad, function (aUidsForLoad, iAccountId) {
		var oFolder = oFolders[iAccountId];
		if (oFolder && aUidsForLoad.length > 0)
		{
			aUidsForLoad = aUidsForLoad.slice(0, Settings.MailsPerPage);
			oFolder.addRequestedThreadUids(aUidsForLoad);
			oFolder.loadThreadMessages(aUidsForLoad);
			bPrefetchStarted = true;
		}
	});

	return bPrefetchStarted;
};

Prefetcher.startMessagesPrefetch = function (oFolder)
{
	var
		oPrefetchFolder = oFolder ? oFolder : MailCache.getCurrentFolder(),
		bPrefetchStarted = false
	;

	if (oPrefetchFolder)
	{
		if (oPrefetchFolder.bIsUnifiedInbox)
		{
			_.each(AccountList.unifiedMailboxAccounts(), function (oAccount) {
				var oInbox  = MailCache.oUnifiedInbox.getUnifiedInbox(oAccount.id());
				if (oInbox)
				{
					bPrefetchStarted = bPrefetchStarted || this.startMessagesPrefetchForFolder(oInbox, MailCache.oUnifiedInbox.selected());
				}
			}, this);
		}
		else
		{
			bPrefetchStarted = this.startMessagesPrefetchForFolder(oPrefetchFolder, oPrefetchFolder.selected());
		}
	}

	return bPrefetchStarted;
};

Prefetcher.startMessagesPrefetchForFolder = function (oPrefetchFolder, bFolderSelected)
{
	var
		iAccountId = oPrefetchFolder.iAccountId,
		iTotalSize = 0,
		iMaxSize = Settings.MaxMessagesBodiesSizeToPrefetch,
		aUids = [],
		oParameters = null,
		iJsonSizeOf1Message = 2048,
		fFillUids = function (oMsg) {
			if (oMsg && _.isFunction(oMsg.uid))
			{
				var
					bFromThisAccount = oMsg.accountId() === iAccountId,
					bNotFilled = (!oMsg.deleted() && !oMsg.completelyFilled()),
					bUidNotAdded = !_.find(aUids, function (sUid) {
						return sUid === oMsg.uid();
					}, this),
					bHasNotBeenRequested = !oPrefetchFolder.hasUidBeenRequested(oMsg.uid()),
					iTextSize = oMsg.textSize() < Settings.MessageBodyTruncationThreshold ? oMsg.textSize() : Settings.MessageBodyTruncationThreshold
				;

				if (iTotalSize < iMaxSize && bFromThisAccount && bNotFilled && bUidNotAdded && bHasNotBeenRequested)
				{
					aUids.push(oMsg.uid());
					iTotalSize += iTextSize + iJsonSizeOf1Message;
				}
			}
		}
	;

	if (oPrefetchFolder)
	{
		if (bFolderSelected)
		{
			_.each(MailCache.messages(), fFillUids);
		}
		oPrefetchFolder.doForAllMessages(fFillUids);

		if (aUids.length > 0)
		{
			oPrefetchFolder.addRequestedUids(aUids);

			oParameters = {
				'AccountID': iAccountId,
				'Folder': oPrefetchFolder.fullName(),
				'Uids': aUids,
				'MessageBodyTruncationThreshold': Settings.MessageBodyTruncationThreshold
			};

			Ajax.send('GetMessagesBodies', oParameters, this.onGetMessagesBodiesResponse, this);
			return true;
		}
	}

	return false;
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
Prefetcher.onGetMessagesBodiesResponse = function (oResponse, oRequest)
{
	var
		oParameters = oRequest.Parameters,
		oFolder = MailCache.getFolderByFullName(oParameters.AccountID, oParameters.Folder)
	;
	
	if (_.isArray(oResponse.Result))
	{
		_.each(oResponse.Result, function (oRawMessage) {
			oFolder.parseAndCacheMessage(oRawMessage, false, false);
		});
		App.broadcastEvent('MailWebclient::ParseMessagesBodies::after', { AccountID: oParameters.AccountID, Folder: oParameters.Folder });
	}
};

Prefetcher.prefetchAccountQuota = function ()
{
	var
		oAccount = AccountList.getCurrent(),
		bNeedQuotaRequest = oAccount && !oAccount.quotaRecieved()
	;
	
	if (UserSettings.ShowQuotaBar && bNeedQuotaRequest)
	{
		oAccount.updateQuotaParams();
		return true;
	}
	
	return false;
};

/**
 * Prefetches templates folder.
 */
Prefetcher.prefetchTemplateFolder = function ()
{
	var
		oFolderList = MailCache.folderList(),
		sTemplateFolder = MailCache.getTemplateFolder()
	;

	if (sTemplateFolder !== '')
	{
		return this.startFolderPrefetch(oFolderList.getFolderByFullName(sTemplateFolder));
	}
	
	return false;
};

/**
 * Prefetches template messages bodies.
 */
Prefetcher.prefetchTemplateMessages = function ()
{
	var
		oFolderList = MailCache.folderList(),
		sTemplateFolder = MailCache.getTemplateFolder(),
		oTemplateFolder = sTemplateFolder ? oFolderList.getFolderByFullName(sTemplateFolder) : null
	;

	if (oTemplateFolder)
	{
		return this.startMessagesPrefetch(oTemplateFolder);
	}
};

module.exports = {
	startMin: function () {
		var bPrefetchStarted = false;
		
		bPrefetchStarted = Prefetcher.prefetchFetchersIdentities();
		
		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchFolderLists();
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchTemplateFolder();
		}
		
		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchTemplateMessages();
		}
	
		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchAccountFilters();
		}
		
		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchStarredMessageList();
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchAccountQuota();
		}
		
		return bPrefetchStarted;
	},
	startAll: function () {
		var bPrefetchStarted = false;
		
		bPrefetchStarted = Prefetcher.prefetchFetchersIdentities();
		
		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchFolderLists();
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchTemplateFolder();
		}
		
		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchTemplateMessages();
		}
	
		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchAccountFilters();
		}
		
		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.startMessagesPrefetch();
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.startThreadListPrefetch();
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchStarredMessageList();
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.startPagePrefetch(MailCache.page() + 1);
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.startPagePrefetch(MailCache.page() - 1);
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchUnseenMessageList();
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchAccountQuota();
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.startUnifiedInboxPrefetch();
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.startOtherFoldersPrefetch();
		}
		
		return bPrefetchStarted;
	},
	prefetchStarredMessageList: function () {
		Prefetcher.prefetchStarredMessageList();
	},
	prefetchFolderLists: function () {
		return Prefetcher.prefetchFolderLists();
	},
	startFolderPrefetch: function (oFolder) {
		Prefetcher.startFolderPrefetch(oFolder);
	},
	prefetchNextPage: function (sCurrentUid) {
		Prefetcher.prefetchNextPage(sCurrentUid);
	},
	prefetchPrevPage: function (sCurrentUid) {
		Prefetcher.prefetchPrevPage(sCurrentUid);
	}
};


/***/ }),

/***/ "cleQ":
/*!********************************************************!*\
  !*** ./modules/MailWebclient/js/models/CAliasModel.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	ko = __webpack_require__(/*! knockout */ "0h2I"),

	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
	AddressUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Address.js */ "Ol7c")
;

/**
 * @constructor
 */
function CAliasModel()
{
	this.ALIAS = true; // constant

	this.email = ko.observable('');
	this.friendlyName = ko.observable('');
	this.fullEmail = ko.computed(function () {
		return AddressUtils.getFullEmail(this.friendlyName(), this.email());
	}, this);
	this.accountId = ko.observable(-1);
	this.id = ko.observable(-1);
	this.signature = ko.observable('');
	this.useSignature = ko.observable(false);
	this.hash = ko.computed(function () {
		return Utils.getHash(this.accountId() + 'alias' + this.id());
	}, this);
}

/**
 * @param {Object} oData
 */
CAliasModel.prototype.parse = function (oData)
{
	if (oData['@Object'] === 'Object/Aurora\\Modules\\CpanelIntegrator\\Classes\\Alias')
	{
		this.email(Types.pString(oData.Email));
		this.friendlyName(Types.pString(oData.FriendlyName));
		this.accountId(Types.pInt(oData.IdAccount));
		this.id(Types.pInt(oData.EntityId));
		var sSignature = Types.pString(oData.Signature);
		if (sSignature.indexOf('<') !== 0) {
			sSignature = '<div>' + sSignature + '</div>';
		}
		this.signature = ko.observable(sSignature);
		this.useSignature(!!oData.UseSignature);
	}
};

module.exports = CAliasModel;


/***/ }),

/***/ "cyfa":
/*!**********************************************************!*\
  !*** ./modules/CoreWebclient/js/models/CAddressModel.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	AddressUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Address.js */ "Ol7c"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV")
;

/**
 * @constructor
 */
function CAddressModel()
{
	this.sName = '';
	/** @type {string} */
	this.sEmail = '';
	
	this.sDisplay = '';
	this.sFull = '';
	
	this.loaded = ko.observable(false);
	this.found = ko.observable(false);
}

/**
 * @param {Object} oData
 */
CAddressModel.prototype.parse = function (oData)
{
	if (oData !== null)
	{
		this.sName = Types.pString(oData.DisplayName);
		this.sEmail = Types.pString(oData.Email);
		this.sDisplay = (this.sName.length > 0) ? this.sName : this.sEmail;
		this.sFull = AddressUtils.getFullEmail(this.sName, this.sEmail);
	}
};

/**
 * @return {string}
 */
CAddressModel.prototype.getEmail = function ()
{
	return this.sEmail;
};

/**
 * @return {string}
 */
CAddressModel.prototype.getName = function ()
{
	return this.sName;
};

/**
 * @return {string}
 */
CAddressModel.prototype.getDisplay = function ()
{
	return this.sDisplay;
};

/**
 * @return {string}
 */
CAddressModel.prototype.getFull = function ()
{
	return this.sFull;
};

module.exports = CAddressModel;


/***/ }),

/***/ "dKfC":
/*!*******************************************************!*\
  !*** ./modules/MailWebclient/js/MainTabExtMethods.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ "SQrT"),
	Routing = __webpack_require__(/*! modules/CoreWebclient/js/Routing.js */ "QaF5"),
	
	MailUtils = __webpack_require__(/*! modules/MailWebclient/js/utils/Mail.js */ "jxK9"),
	AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm"),
	MailCache = __webpack_require__(/*! modules/MailWebclient/js/Cache.js */ "4+IO"),
	
	aComposedMessages = [],
	aReplyData = []
;

if (App.isNewTab())
{
	var SlaveTabMailMethods = {
		getEditedDraftUid: function () {
			return MailCache.editedDraftUid();
		}
	};
	
	window.SlaveTabMailMethods = SlaveTabMailMethods;
	
	module.exports = {};
}
else
{
	var MainTabMailMethods = {
		showReport: function (sText) {
			Screens.showReport(sText);
		},
		getAccountList: function () {
			return AccountList;
		},
		getFolderListItems: function () {
			return MailCache.oFolderListItems;
		},
		getUidList: function () {
			return MailCache.uidList();
		},
		getComposedMessageAccountId: function (sWindowName) {
			var oComposedMessage = aComposedMessages[sWindowName];
			return oComposedMessage ? oComposedMessage.accountId : 0;
		},
		getComposedMessage: function (sWindowName) {
			var oComposedMessage = aComposedMessages[sWindowName];
			delete aComposedMessages[sWindowName];
			return oComposedMessage;
		},
		removeOneMessageFromCacheForFolder: function (iAccountId, sDraftFolder, sDraftUid) {
			MailCache.removeOneMessageFromCacheForFolder(iAccountId, sDraftFolder, sDraftUid);
		},
		replaceHashWithoutMessageUid: function (sDraftUid) {
			Routing.replaceHashWithoutMessageUid(sDraftUid);
		},
		startMessagesLoadingWhenDraftSaving: function (iAccountId, sDraftFolder) {
			MailCache.startMessagesLoadingWhenDraftSaving(iAccountId, sDraftFolder);
		},
		removeMessagesFromCacheForFolder: function (iAccountID, sSentFolder) {
			MailCache.removeMessagesFromCacheForFolder(iAccountID, sSentFolder);
		},
		searchMessagesInCurrentFolder: function (sSearch) {
			MailCache.searchMessagesInCurrentFolder(sSearch);
		},
		getReplyData: function (sUniq) {
			var oReplyData = aReplyData[sUniq];
			delete aReplyData[sUniq];
			return oReplyData;
		},
		deleteMessage: function (sUid, fAfterDelete) {
			MailUtils.deleteMessages([sUid], fAfterDelete);
		}
	};

	window.MainTabMailMethods = MainTabMailMethods;

	module.exports = {
		passReplyData: function (sUniq, oReplyData) {
			aReplyData[sUniq] = oReplyData;
		},
		passComposedMessage: function (sWinName, oComposedMessage) {
			aComposedMessages[sWinName] = oComposedMessage;
		}
	};
}


/***/ }),

/***/ "gAbd":
/*!*********************************************************!*\
  !*** ./modules/MailWebclient/js/models/CServerModel.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV")
;

function CServerModel(oServer)
{
	this.iId = oServer ? Types.pInt(oServer.EntityId) || Types.pInt(oServer.ServerId) : 0;
	this.iTenantId = oServer ? Types.pInt(oServer.TenantId) : 0;
	this.sName = oServer ? Types.pString(oServer.Name) : '';
	this.sIncomingServer = oServer ? Types.pString(oServer.IncomingServer) : '';
	this.iIncomingPort = oServer ? Types.pInt(oServer.IncomingPort) : 143;
	this.bIncomingUseSsl = oServer ? !!oServer.IncomingUseSsl : false;
	this.sOutgoingServer = oServer ? Types.pString(oServer.OutgoingServer) : '';
	this.iOutgoingPort = oServer ? Types.pInt(oServer.OutgoingPort) : 25;
	this.bOutgoingUseSsl = oServer ? !!oServer.OutgoingUseSsl : false;
	this.sDomains = oServer ? Types.pString(oServer.Domains) : '';
	this.sSmtpAuthType = oServer ? Types.pString(oServer.SmtpAuthType) : window.Enums.SmtpAuthType.UseUserCredentials;
	this.sSmtpLogin = oServer ? Types.pString(oServer.SmtpLogin) : '';
	this.sSmtpPassword = oServer ? Types.pString(oServer.SmtpPassword) : '';
	this.bEnableSieve = oServer ? !!oServer.EnableSieve : false;
	this.iSievePort = oServer && oServer.SievePort ? Types.pInt(oServer.SievePort) : 4190;
	this.bEnableThreading = oServer ? !!oServer.EnableThreading : false;
	this.bUseFullEmailAddressAsLogin = oServer ? !!oServer.UseFullEmailAddressAsLogin : true;
	this.bSetExternalAccessServers = Types.pBool(oServer && oServer.SetExternalAccessServers, false);
	this.sExternalAccessImapServer = Types.pString(oServer && oServer.ExternalAccessImapServer, '');
	this.iExternalAccessImapPort = Types.pInt(oServer && oServer.ExternalAccessImapPort, 143);
	this.iExternalAccessImapAlterPort = Types.pInt(oServer && oServer.ExternalAccessImapAlterPort, 0);
	this.sExternalAccessPop3Server = Types.pString(oServer && oServer.ExternalAccessPop3Server, '');
	this.iExternalAccessPop3Port = Types.pInt(oServer && oServer.ExternalAccessPop3Port, 110);
	this.iExternalAccessPop3AlterPort = Types.pInt(oServer && oServer.ExternalAccessPop3AlterPort, 0);
	this.sExternalAccessSmtpServer = Types.pString(oServer && oServer.ExternalAccessSmtpServer, '');
	this.iExternalAccessSmtpPort = Types.pInt(oServer && oServer.ExternalAccessSmtpPort, 25);
	this.iExternalAccessSmtpAlterPort = Types.pInt(oServer && oServer.ExternalAccessSmtpAlterPort, 0);
	this.bAllowToDelete = Types.pBool(oServer && oServer.AllowToDelete, true);
	this.bAllowEditDomains = Types.pBool(oServer && oServer.AllowEditDomains, true);
	this.sOwnerType = oServer ? Types.pString(oServer.OwnerType) : '';

	this.bOauthEnable = Types.pBool(oServer && oServer.OAuthEnable, false);
	this.sOauthName = Types.pString(oServer && oServer.OAuthName, '');
	this.sOauthType = Types.pString(oServer && oServer.OAuthType, '');
	this.sOauthIconUrl = Types.pString(oServer && oServer.OAuthIconUrl, '');
}

module.exports = CServerModel;


/***/ }),

/***/ "h1OO":
/*!***************************************************!*\
  !*** ./modules/MailWebclient/js/utils/Compose.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	ComposeUtils = (App.isMobile() || App.isNewTab()) ? __webpack_require__(/*! modules/MailWebclient/js/utils/ScreenCompose.js */ "Olic") : __webpack_require__(/*! modules/MailWebclient/js/utils/PopupCompose.js */ "TCxV")
;

module.exports = ComposeUtils;

/***/ }),

/***/ "jDNX":
/*!************************************************************!*\
  !*** ./modules/MailWebclient/js/views/CColorPickerView.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	$ = __webpack_require__(/*! jquery */ "EVdn")
;

/**
 * @constructor
 * @param {string} sCaption
 * @param {Function} fPickHandler
 * @param {Object} oPickContext
 */
function CColorPickerView(sCaption, fPickHandler, oPickContext)
{
	this.aGreyColors = ['rgb(0, 0, 0)', 'rgb(68, 68, 68)', 'rgb(102, 102, 102)', 'rgb(153, 153, 153)',
		'rgb(204, 204, 204)', 'rgb(238, 238, 238)', 'rgb(243, 243, 243)', 'rgb(255, 255, 255)'];
	
	this.aBrightColors = ['rgb(255, 0, 0)', 'rgb(255, 153, 0)', 'rgb(255, 255, 0)', 'rgb(0, 255, 0)', 
		'rgb(0, 255, 255)', 'rgb(0, 0, 255)', 'rgb(153, 0, 255)', 'rgb(255, 0, 255)'];
	
	this.aColorLines = [
		['rgb(244, 204, 204)', 'rgb(252, 229, 205)', 'rgb(255, 242, 204)', 'rgb(217, 234, 211)', 
				'rgb(208, 224, 227)', 'rgb(207, 226, 243)', 'rgb(217, 210, 233)', 'rgb(234, 209, 220)'],
		['rgb(234, 153, 153)', 'rgb(249, 203, 156)', 'rgb(255, 229, 153)', 'rgb(182, 215, 168)', 
				'rgb(162, 196, 201)', 'rgb(159, 197, 232)', 'rgb(180, 167, 214)', 'rgb(213, 166, 189)'],
		['rgb(224, 102, 102)', 'rgb(246, 178, 107)', 'rgb(255, 217, 102)', 'rgb(147, 196, 125)', 
				'rgb(118, 165, 175)', 'rgb(111, 168, 220)', 'rgb(142, 124, 195)', 'rgb(194, 123, 160)'],
		['rgb(204, 0, 0)', 'rgb(230, 145, 56)', 'rgb(241, 194, 50)', 'rgb(106, 168, 79)', 
				'rgb(69, 129, 142)', 'rgb(61, 133, 198)', 'rgb(103, 78, 167)', 'rgb(166, 77, 121)'],
		['rgb(153, 0, 0)', 'rgb(180, 95, 6)', 'rgb(191, 144, 0)', 'rgb(56, 118, 29)', 
				'rgb(19, 79, 92)', 'rgb(11, 83, 148)', 'rgb(53, 28, 117)', 'rgb(116, 27, 71)'],
		['rgb(102, 0, 0)', 'rgb(120, 63, 4)', 'rgb(127, 96, 0)', 'rgb(39, 78, 19)', 
				'rgb(12, 52, 61)', 'rgb(7, 55, 99)', 'rgb(32, 18, 77)', 'rgb(76, 17, 48)']
	];
	
	this.caption = sCaption;
	this.pickHandler = fPickHandler;
	this.pickContext = oPickContext;
	
	this.colorPickerDom = ko.observable(null);
}

CColorPickerView.prototype.ViewTemplate = 'MailWebclient_ColorPickerView';

CColorPickerView.prototype.onShow = function ()
{
	$(this.colorPickerDom()).find('span.color-item').on('click', _.bind(function (oEv)
	{
		oEv.stopPropagation();
		this.setColorFromPopup($(oEv.target).data('color'));
	}, this));
};

/**
 * @param {string} sColor
 */
CColorPickerView.prototype.setColorFromPopup = function (sColor)
{
	this.pickHandler.call(this.pickContext, sColor);
};

module.exports = CColorPickerView;

/***/ }),

/***/ "jonm":
/*!*************************************************!*\
  !*** ./modules/MailWebclient/js/AccountList.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	MainTab = App.isNewTab() && window.opener ? window.opener.MainTabMailMethods : null,
	Routing = __webpack_require__(/*! modules/CoreWebclient/js/Routing.js */ "QaF5"),
	CoreAjax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ "o0Bx"),
	
	Ajax = __webpack_require__(/*! modules/MailWebclient/js/Ajax.js */ "UN2P"),
	LinksUtils = __webpack_require__(/*! modules/MailWebclient/js/utils/Links.js */ "4M/5"),
	Settings = __webpack_require__(/*! modules/MailWebclient/js/Settings.js */ "p2hp"),
	
	CAccountModel = __webpack_require__(/*! modules/MailWebclient/js/models/CAccountModel.js */ "2ug6"),
	CFetcherModel = __webpack_require__(/*! modules/MailWebclient/js/models/CFetcherModel.js */ "bBfe"),
	CAliasModel = __webpack_require__(/*! modules/MailWebclient/js/models/CAliasModel.js */ "cleQ"),
	CIdentityModel = __webpack_require__(/*! modules/MailWebclient/js/models/CIdentityModel.js */ "vsma")
;

/**
 * @constructor
 */
function CAccountListModel()
{
	this.collection = ko.observableArray([]);

	this.unifiedMailboxAccounts = ko.computed(function () {
		if (Settings.AllowUnifiedInbox)
		{
			return _.filter(this.collection(), function (oAccount) {
				return oAccount.includeInUnifiedMailbox();
			});
		}
		return [];
	}, this);
	this.unifiedInboxAllowed = ko.computed(function () {
		return this.unifiedMailboxAccounts().length > 1;
	}, this);
	this.unifiedInboxReady = ko.observable(false);
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
 * @param {type} sHash
 * @returns {Object}
 */
CAccountListModel.prototype.getAliasByHash = function(sHash)
{
	var oAlias = null;
	
	_.each(this.collection(), function (oAccount) {
		if (!oAlias)
		{
			oAlias = _.find(oAccount.aliases() || [], function (oAlias) {
				return oAlias.hash() === sHash;
			});
		}
	}, this);
	
	return oAlias;
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
	this.populateAliases();
};

CAccountListModel.prototype.populateFetchers = function ()
{
	if (Settings.AllowFetchers)
	{
		CoreAjax.send(Settings.FetchersServerModuleName, 'GetFetchers', { 'AccountID': this.editedId() }, this.onGetFetchersResponse, this);
	}
};

CAccountListModel.prototype.populateAliases = function (fAfterPopulateAliases)
{
	if (Settings.AllowAliases) {
		CoreAjax.send(
			Settings.AliasesServerModuleName,
			'GetAliases',
			{ 'AccountID': this.editedId() },
			function (oResponse, oRequest) {
				this.onGetAliasesResponse(oResponse, oRequest);
				if (_.isFunction(fAfterPopulateAliases))
				{
					fAfterPopulateAliases();
				}
			},
			this
		);
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
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAccountListModel.prototype.onGetAliasesResponse = function (oResponse, oRequest)
{
	var oAliases = {};

	if (oResponse.Result && Types.isNonEmptyArray(oResponse.Result.ObjAliases))
	{
		_.each(oResponse.Result.ObjAliases, function (oData) {
			var oAlias = new CAliasModel();
			oAlias.parse(oData);
			if (!oAliases[oAlias.accountId()])
			{
				oAliases[oAlias.accountId()] = [];
			}
			oAliases[oAlias.accountId()].push(oAlias);
		});
	}
	
	_.each(this.collection(), function (oAccount) {
		var aAliases = Types.isNonEmptyArray(oAliases[oAccount.id()]) ? oAliases[oAccount.id()] : [];
		oAccount.aliases(aAliases);
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


/***/ }),

/***/ "jxK9":
/*!************************************************!*\
  !*** ./modules/MailWebclient/js/utils/Mail.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
			
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	UrlUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Url.js */ "ZP6a"),
	
	Storage = __webpack_require__(/*! modules/CoreWebclient/js/Storage.js */ "gcBV"),
	UserSettings = __webpack_require__(/*! modules/CoreWebclient/js/Settings.js */ "hPb3"),
	
	Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh"),
	ConfirmPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/ConfirmPopup.js */ "20Ah"),

	AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm"),
	MailCache = __webpack_require__(/*! modules/MailWebclient/js/Cache.js */ "4+IO"),
	
	MailUtils = {}
;

/**
 * Moves the specified messages in the current folder to the Trash or delete permanently 
 * if the current folder is Trash or Spam.
 * 
 * @param {Array} aUids
 * @param {Function=} fAfterDelete
 */
MailUtils.deleteMessages = function (aUids, fAfterDelete)
{
	if (!$.isFunction(fAfterDelete))
	{
		fAfterDelete = function () {};
	}
	
	var
		oFolderList = MailCache.folderList(),
		sCurrFolder = oFolderList.currentFolderFullName(),
		oTrash = oFolderList.trashFolder(),
		bInTrash =(oTrash && sCurrFolder === oTrash.fullName()),
		oSpam = oFolderList.spamFolder(),
		bInSpam = (oSpam && sCurrFolder === oSpam.fullName()),
		fDeleteMessages = function (bResult) {
			if (bResult)
			{
				MailCache.deleteMessages(aUids);
				fAfterDelete();
			}
		}
	;

	if (bInSpam || bInTrash)
	{
		Popups.showPopup(ConfirmPopup, [
			TextUtils.i18n('MAILWEBCLIENT/CONFIRM_DELETE_MESSAGES_PLURAL', {}, null, aUids.length), 
			fDeleteMessages, '', TextUtils.i18n('COREWEBCLIENT/ACTION_DELETE')
		]);
	}
	else
	{
		if (MailCache.oUnifiedInbox.selected())
		{
			MailUtils.deleteMessagesFromUnifiedInbox(aUids, fAfterDelete);
		}
		else
		{
			if (oTrash)
			{
				MailCache.moveMessagesToFolder(oFolderList.currentFolder(), oTrash, aUids);
				fAfterDelete();
			}
			else
			{
				Popups.showPopup(ConfirmPopup, [TextUtils.i18n('MAILWEBCLIENT/CONFIRM_MESSAGES_DELETE_NO_TRASH_FOLDER'), fDeleteMessages]);
			}
		}
	}
};

MailUtils.deleteMessagesFromUnifiedInbox = function (aUids, fAfterDelete)
{
	var
		bMoved = false,
		bDeleteAsked = false,
		oUidsByAccounts = MailCache.getUidsSeparatedByAccounts(aUids),
		fDeleteMessages = function (oAccInbox, aUidsByAccount, bResult) {
			if (bResult)
			{
				MailCache.deleteMessagesFromFolder(oAccInbox, aUidsByAccount);
				fAfterDelete();
			}
		}
	;

	_.each(oUidsByAccounts, function (oData) {
		var
			aUidsByAccount = oData.Uids,
			iAccountId = oData.AccountId,
			oFolderList = MailCache.oFolderListItems[iAccountId],
			oAccount = AccountList.getAccount(iAccountId),
			oAccTrash = oFolderList ? oFolderList.trashFolder() : null,
			oAccInbox = oFolderList ? oFolderList.inboxFolder() : null
		;
		if (oAccInbox)
		{
			if (oAccTrash)
			{
				MailCache.moveMessagesToFolder(oAccInbox, oAccTrash, aUidsByAccount);
				bMoved = true;
			}
			else
			{
				Popups.showPopup(ConfirmPopup, [
					TextUtils.i18n('MAILWEBCLIENT/CONFIRM_MESSAGES_DELETE_NO_TRASH_FOLDER'),
					fDeleteMessages.bind(null, oAccInbox, aUidsByAccount),
					oAccount ? oAccount.fullEmail() : ''
				]);
				bDeleteAsked = true;
			}
		}
	});

	if (bMoved && !bDeleteAsked)
	{
		fAfterDelete();
	}
};

MailUtils.isAvailableRegisterMailto = function ()
{
	return window.navigator && $.isFunction(window.navigator.registerProtocolHandler);
};

MailUtils.registerMailto = function (bRegisterOnce)
{
	if (MailUtils.isAvailableRegisterMailto() && (!bRegisterOnce || Storage.getData('MailtoAsked') !== true))
	{
		window.navigator.registerProtocolHandler(
			'mailto',
			UrlUtils.getAppPath() + '#mail/compose/to/%s',
			UserSettings.SiteName !== '' ? UserSettings.SiteName : 'WebMail'
		);

		Storage.setData('MailtoAsked', true);
	}
};

module.exports = MailUtils;


/***/ }),

/***/ "lPfU":
/*!**********************************************************!*\
  !*** ./modules/MailWebclient/js/models/CUidListModel.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	MailCache = null,
	MessagesDictionary = __webpack_require__(/*! modules/MailWebclient/js/MessagesDictionary.js */ "xzvH"),
	Settings = __webpack_require__(/*! modules/MailWebclient/js/Settings.js */ "p2hp")
;

/**
 * @constructor
 * 
 * !!!Attention!!!
 * It is not used underscore, because the collection may contain undefined-elements.
 * They have their own importance. But all underscore-functions removes them automatically.
 */
function CUidListModel()
{
	this.iAccountId = 0;
	this.sFullName = '';
	this.search = ko.observable('');
	this.filters = ko.observable('');
	this.sortBy = ko.observable(Settings.MessagesSortBy.DefaultSortBy);
	this.sortOrder = ko.observable(Settings.MessagesSortBy.DefaultSortOrder);
	
	this.resultCount = ko.observable(-1);
	this.collection = ko.observableArray([]);
	this.threadUids = {};
}

/**
 * Requires MailCache. It cannot be required earlier because it is not initialized yet.
 */
CUidListModel.prototype.requireMailCache = function ()
{
	if (MailCache === null)
	{
		MailCache = __webpack_require__(/*! modules/MailWebclient/js/Cache.js */ "4+IO");
	}
};

/**
 * @param {string} sUid
 * @param {Array} aThreadUids
 */
CUidListModel.prototype.addThreadUids = function (sUid, aThreadUids)
{
	if (-1 !== _.indexOf(this.collection(), sUid))
	{
		this.threadUids[sUid] = aThreadUids;
	}
};

/**
 * @param {int} iOffset
 * @param {Object} oResult
 */
CUidListModel.prototype.setUidsAndCount = function (iOffset, oResult)
{
	if (oResult['@Object'] === 'Collection/MessageCollection')
	{
		_.each(oResult.Uids, function (sUid, iIndex) {
			
			this.collection()[iIndex + iOffset] = sUid.toString();

		}, this);

		this.resultCount(oResult.MessageResultCount);
	}
};

/**
 * @param {number} iOffset
 */
CUidListModel.prototype.getUidsForOffset = function (iOffset)
{
	this.requireMailCache();
	
	var
		iIndex = 0,
		iLen = this.collection().length,
		sUid = '',
		iAccountId = this.iAccountId,
		sFullName = this.sFullName,
		iExistsCount = 0,
		aUids = [],
		oMsg = null
	;
	
	for(; iIndex < iLen; iIndex++)
	{
		if (iIndex >= iOffset && iExistsCount < Settings.MailsPerPage)
		{
			sUid = this.collection()[iIndex];
			var sUidForDict = sUid;
			if (sUid !== undefined && this.sFullName === MailCache.oUnifiedInbox.fullName())
			{
				var aParts = sUid.split(':');
				iAccountId = Types.pInt(aParts[0]);
				sFullName = 'INBOX';
				sUidForDict = aParts[1];
			}
			oMsg = (sUid === undefined) ? null : MessagesDictionary.get([iAccountId, sFullName, sUidForDict]);

			if (oMsg && !oMsg.deleted() || sUid === undefined)
			{
				iExistsCount++;
				if (sUid !== undefined)
				{
					aUids.push(sUid);
				}
			}
		}
	}
	
	return aUids;
};

/**
 * @param {Array} aUids
 */
CUidListModel.prototype.deleteUids = function (aUids)
{
	var
		iIndex = 0,
		iLen = this.collection().length,
		sUid = '',
		aNewCollection = [],
		iDiff = 0
	;
	
	for (; iIndex < iLen; iIndex++)
	{
		sUid = this.collection()[iIndex];
		if (_.indexOf(aUids, sUid) === -1)
		{
			aNewCollection.push(sUid);
		}
		else
		{
			iDiff++;
		}
	}
	
	this.collection(aNewCollection);
	this.resultCount(this.resultCount() - iDiff);
};

/**
 * Clears data when cache should be cleared.
 */
CUidListModel.prototype.clearData = function ()
{
	this.resultCount(-1);
	this.collection([]);
	this.threadUids = {};
};

module.exports = CUidListModel;


/***/ }),

/***/ "mjrp":
/*!******************************************!*\
  !*** ./modules/CoreWebclient/js/CJua.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	_ = __webpack_require__(/*! underscore */ "F/us"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),

	queue = __webpack_require__(/*! modules/CoreWebclient/js/vendors/queue.js */ "w+bY"),
	
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	UserSettings = __webpack_require__(/*! modules/CoreWebclient/js/Settings.js */ "hPb3"),
	
	Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh"),
	AlertPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/AlertPopup.js */ "1grR"),
	
	iDefLimit = UserSettings.MultipleFilesUploadLimit;
;
/**
 * @param {*} mValue
 * @return {boolean}
 */
function isUndefined(mValue)
{
	return 'undefined' === typeof mValue;
}

/**
 * @param {*} oParent
 * @param {*} oDescendant
 *
 * @return {boolean}
 */
function contains(oParent, oDescendant)
{
	var bResult = false;
	if (oParent && oDescendant)
	{
		if (oParent === oDescendant)
		{
			bResult = true;
		}
		else if (oParent.contains)
		{
			bResult = oParent.contains(oDescendant);
		}
		else
		{
			/*jshint bitwise: false*/
			bResult = oDescendant.compareDocumentPosition ?
				!!(oDescendant.compareDocumentPosition(oParent) & 8) : false;
			/*jshint bitwise: true*/
		}
	}

	return bResult;
}

function mainClearTimeout(iTimer)
{
	if (0 < iTimer)
	{
		clearTimeout(iTimer);
	}

	iTimer = 0;
}

/**
 * @param {Event} oEvent
 * @return {?Event}
 */
function getEvent(oEvent)
{
	oEvent = (oEvent && (oEvent.originalEvent ?
		oEvent.originalEvent : oEvent)) || window.event;

	return oEvent.dataTransfer ? oEvent : null;
}

/**
 * @param {Object} oValues
 * @param {string} sKey
 * @param {?} mDefault
 * @return {?}
 */
function getValue(oValues, sKey, mDefault)
{
	return (!oValues || !sKey || isUndefined(oValues[sKey])) ? mDefault : oValues[sKey];
}

/**
 * @param {Object} oOwner
 * @param {string} sPublicName
 * @param {*} mObject
 */
function setValue(oOwner, sPublicName, mObject)
{
	oOwner[sPublicName] = mObject;
}

/**
 * @param {Function} fFunction
 * @param {Object=} oScope
 * @return {Function}
 */
function scopeBind(fFunction, oScope)
{
	return function () {
		return fFunction.apply(isUndefined(oScope) ? null : oScope,
			Array.prototype.slice.call(arguments));
	};
}

/**
 * @param {number=} iLen
 * @return {string}
 */
function fakeMd5(iLen)
{
	var
		sResult = '',
		sLine = '0123456789abcdefghijklmnopqrstuvwxyz'
	;

	iLen = isUndefined(iLen) ? 32 : Types.pInt(iLen);

	while (sResult.length < iLen)
	{
		sResult += sLine.substr(Math.round(Math.random() * sLine.length), 1);
	}

	return sResult;
}

/**
 * @return {string}
 */
function getNewUid()
{
	return 'jua-uid-' + fakeMd5(16) + '-' + (new Date()).getTime().toString();
}

/**
 * @param {*} oFile
 * @param {string=} sPath
 * @return {Object}
 */
function getDataFromFile(oFile, sPath)
{
	var
		sFileName = isUndefined(oFile.fileName) ? (isUndefined(oFile.name) ? null : oFile.name) : oFile.fileName,
		iSize = isUndefined(oFile.fileSize) ? (isUndefined(oFile.size) ? null : oFile.size) : oFile.fileSize,
		sType = isUndefined(oFile.type) ? null : oFile.type
	;

	return {
		'FileName': sFileName,
		'Size': iSize,
		'Type': sType,
		'Folder': isUndefined(sPath) ? '' : sPath,
		'File' : oFile
	};
}

/**
 * @param {*} aItems
 * @param {Function} fFileCallback
 * @param {boolean=} bEntry = false
 * @param {boolean=} bAllowFolderDragAndDrop = true
 * @param {number=} iLimit = 20
 * @param {Function=} fLimitCallback
 */
function getDataFromFiles(aItems, fFileCallback, bEntry, bAllowFolderDragAndDrop, iLimit, fLimitCallback)
{
	var
		iInputLimit = 0,
		iLen = 0,
		iIndex = 0,
		oItem = null,
		oEntry = null,
		bUseLimit = false,
		bCallLimit = false,
		fTraverseFileTree = function (oItem, sPath, fCallback, fLimitCallbackProxy) {

			if (oItem && !isUndefined(oItem['name']))
			{
				sPath = sPath || '';
				if (oItem['isFile'])
				{
					oItem.file(function (oFile) {
						if (!bUseLimit || 0 <= --iLimit)
						{
							fCallback(getDataFromFile(oFile, sPath));
						}
						else if (bUseLimit && !bCallLimit)
						{
							if (0 > iLimit && fLimitCallback)
							{
								bCallLimit = true;
								fLimitCallback(iInputLimit);
							}
						}
					});
				}
				else if (bAllowFolderDragAndDrop && oItem['isDirectory'] && oItem['createReader'])
				{
					var
						oDirReader = oItem['createReader'](),
						iIndex = 0,
						iLen = 0
					;

					if (oDirReader && oDirReader['readEntries'])
					{
						oDirReader['readEntries'](function (aEntries) {
							if (aEntries && Types.isNonEmptyArray(aEntries))
							{
								for (iIndex = 0, iLen = aEntries.length; iIndex < iLen; iIndex++)
								{
									fTraverseFileTree(aEntries[iIndex], sPath + oItem['name'] + '/', fCallback, fLimitCallbackProxy);
								}
							}
						});
					}
				}
			}
		}
	;

	bAllowFolderDragAndDrop = isUndefined(bAllowFolderDragAndDrop) ? true : !!bAllowFolderDragAndDrop;

	bEntry = isUndefined(bEntry) ? false : !!bEntry;
	iLimit = isUndefined(iLimit) ? iDefLimit : Types.pInt(iLimit);
	iInputLimit = iLimit;
	bUseLimit = 0 < iLimit;

	aItems = aItems && 0 < aItems.length ? aItems : null;
	if (aItems)
	{
		for (iIndex = 0, iLen = aItems.length; iIndex < iLen; iIndex++)
		{
			oItem = aItems[iIndex];
			if (oItem)
			{
				if (bEntry)
				{
					if ('file' === oItem['kind'] && oItem['webkitGetAsEntry'])
					{
						oEntry = oItem['webkitGetAsEntry']();
						if (oEntry)
						{
							fTraverseFileTree(oEntry, '', fFileCallback, fLimitCallback);
						}
					}
				}
				else
				{
					if (!bUseLimit || 0 <= --iLimit)
					{
						fFileCallback(getDataFromFile(oItem));
					}
					else if (bUseLimit && !bCallLimit)
					{
						if (0 > iLimit && fLimitCallback)
						{
							bCallLimit = true;
							fLimitCallback(iInputLimit);
						}
					}
				}
			}
		}
	}
}

/**
 * @param {*} oInput
 * @param {Function} fFileCallback
 * @param {number=} iLimit = 20
 * @param {Function=} fLimitCallback
 */
function getDataFromInput(oInput, fFileCallback, iLimit, fLimitCallback)
{
	var aFiles = oInput && oInput.files && 0 < oInput.files.length ? oInput.files : null;
	if (aFiles)
	{
		getDataFromFiles(aFiles, fFileCallback, false, false, iLimit, fLimitCallback);
	}
	else
	{
		fFileCallback({
			'FileName': oInput.value.split('\\').pop().split('/').pop(),
			'Size': null,
			'Type': null,
			'Folder': '',
			'File' : null
		});
	}
}

function eventContainsFiles(oEvent)
{
	var bResult = false;
	if (oEvent && oEvent.dataTransfer && oEvent.dataTransfer.types && oEvent.dataTransfer.types.length)
	{
		var
			iIindex = 0,
			iLen = oEvent.dataTransfer.types.length
		;

		for (; iIindex < iLen; iIindex++)
		{
			if (oEvent.dataTransfer.types[iIindex].toLowerCase() === 'files')
			{
				bResult = true;
				break;
			}
		}
	}

	return bResult;
}

/**
 * @param {Event} oEvent
 * @param {Function} fFileCallback
 * @param {number=} iLimit = 20
 * @param {Function=} fLimitCallback
 * @param {boolean=} bAllowFolderDragAndDrop = true
 */
function getDataFromDragEvent(oEvent, fFileCallback, iLimit, fLimitCallback, bAllowFolderDragAndDrop)
{
	var
		aItems = null,
		aFiles = null
	;

	oEvent = getEvent(oEvent);
	if (oEvent)
	{
		aItems = (oEvent.dataTransfer ? getValue(oEvent.dataTransfer, 'items', null) : null) || getValue(oEvent, 'items', null);
		if (aItems && 0 < aItems.length && aItems[0] && aItems[0]['webkitGetAsEntry'])
		{
			getDataFromFiles(aItems, fFileCallback, true, bAllowFolderDragAndDrop, iLimit, fLimitCallback);
		}
		else if (eventContainsFiles(oEvent))
		{
			aFiles = (getValue(oEvent, 'files', null) || (oEvent.dataTransfer ?
				getValue(oEvent.dataTransfer, 'files', null) : null));

			if (aFiles && 0 < aFiles.length)
			{
				getDataFromFiles(aFiles, fFileCallback, false, false, iLimit, fLimitCallback);
			}
		}
	}
}

function createNextLabel()
{
	return $('<label style="' +
'position: absolute; background-color:#fff; right: 0px; top: 0px; left: 0px; bottom: 0px; margin: 0px; padding: 0px; cursor: pointer;' +
	'"></label>').css({
		'opacity': 0
	});
}

/**
 * @param {string} sInputPos
 * @param {string=} sAccept = ''
 * @return {?Object}
 */
function createNextInput(sInputPos, sAccept)
{
	if (sAccept !== '')
	{
		sAccept = ' accept="' + sAccept + '"';
	}
	return $('<input type="file" tabindex="-1" hidefocus="hidefocus" style="position: absolute; ' + sInputPos + ': -9999px;"' + sAccept + ' />');
}

/**
 * @param {string=} sName
 * @param {boolean=} bMultiple = true
 * @param {string=} sInputPos = 'left'
 * @param {string=} sAccept = ''
 * @return {?Object}
 */
function getNewInput(sName, bMultiple, sInputPos, sAccept)
{
	sName = isUndefined(sName) ? '' : sName.toString();
	sInputPos = isUndefined(sInputPos) ? 'left' : sInputPos.toString();
	sAccept = isUndefined(sAccept) ? '' : sAccept.toString();

	var oLocal = createNextInput(sInputPos, sAccept);
	if (0 < sName.length)
	{
		oLocal.attr('name', sName);
	}

	if (isUndefined(bMultiple) ? true : bMultiple)
	{
		oLocal.prop('multiple', true);
	}

	return oLocal;
}

/**
 * @param {?} mStringOrFunction
 * @param {Array=} aFunctionParams
 * @return {string}
 */
function getStringOrCallFunction(mStringOrFunction, aFunctionParams)
{
	return Types.pString(_.isFunction(mStringOrFunction) ? 
		mStringOrFunction.apply(null, _.isArray(aFunctionParams) ? aFunctionParams : []) :
		mStringOrFunction);
}

/**
 * @constructor
 * @param {CJua} oJua
 * @param {Object} oOptions
 */
function AjaxDriver(oJua, oOptions)
{
	this.oXhrs = {};
	this.oUids = {};
	this.oJua = oJua;
	this.oOptions = oOptions;
}

/**
 * @type {Object}
 */
AjaxDriver.prototype.oXhrs = {};

/**
 * @type {Object}
 */
AjaxDriver.prototype.oUids = {};

/**
 * @type {?CJua}
 */
AjaxDriver.prototype.oJua = null;

/**
 * @type {Object}
 */
AjaxDriver.prototype.oOptions = {};

/**
 * @return {boolean}
 */
AjaxDriver.prototype.isDragAndDropSupported = function ()
{
	return true;
};

/**
 * @param {string} sUid
 */
AjaxDriver.prototype.regTaskUid = function (sUid)
{
	this.oUids[sUid] = true;
};

/**
 * @param {string} sUid
 * @param {object} oFileInfo
 * @param {object} oParsedHiddenParameters
 * @param {function} fCallback
 * @param {boolean} bSkipCompleteFunction
 * @param {boolean} bUseResponce
 * @param {number} iProgressOffset
 * @returns {Boolean}
 */
AjaxDriver.prototype.uploadTask = function (sUid, oFileInfo, oParsedHiddenParameters, fCallback, bSkipCompleteFunction, bUseResponce, iProgressOffset)
{
	if (false === this.oUids[sUid] || !oFileInfo || !oFileInfo['File'])
	{
		fCallback(null, sUid);
		return false;
	}

	try
	{
		var
			self = this,
			oXhr = new XMLHttpRequest(),
			oFormData = new FormData(),
			sAction = getValue(this.oOptions, 'action', ''),
			aHidden = _.clone(getValue(this.oOptions, 'hidden', {})),
			fStartFunction = this.oJua.getEvent('onStart'),
			fCompleteFunction = this.oJua.getEvent('onComplete'),
			fProgressFunction = this.oJua.getEvent('onProgress')
		;

		oXhr.open('POST', sAction, true);
		oXhr.setRequestHeader('Authorization', 'Bearer ' + $.cookie('AuthToken'));
		oXhr.setRequestHeader('X-Client', 'WebClient');
		
		if (fProgressFunction && oXhr.upload)
		{
			oXhr.upload.onprogress = function (oEvent) {
				if (oEvent && oEvent.lengthComputable && !isUndefined(oEvent.loaded) && !isUndefined(oEvent.total))
				{
					if (typeof iProgressOffset === 'undefined')
					{
						fProgressFunction(sUid, oEvent.loaded, oEvent.total);
					}
					else
					{
						fProgressFunction(sUid, (iProgressOffset + oEvent.loaded) > oFileInfo.Size ? oFileInfo.Size : iProgressOffset + oEvent.loaded, oFileInfo.Size);
					}
				}
			};
		}

		oXhr.onreadystatechange = function () {
			if (4 === oXhr.readyState && 200 === oXhr.status)
			{
				if (fCompleteFunction && !bSkipCompleteFunction)
				{
					var
						bResult = false,
						oResult = null
					;

					try
					{
						oResult = $.parseJSON(oXhr.responseText);
						bResult = true;
					}
					catch (oException)
					{
						oResult = null;
					}

					fCompleteFunction(sUid, bResult, oResult);
				}

				if (!isUndefined(self.oXhrs[sUid]))
				{
					self.oXhrs[sUid] = null;
				}

				if (bUseResponce)
				{
					fCallback(oXhr.responseText, sUid);
				}
				else
				{
					fCallback(null, sUid);
				}
			}
			else
			{
				if (4 === oXhr.readyState)
				{
					fCompleteFunction(sUid, false, null);
					fCallback(null, sUid);
				}
			}
		};

		if (fStartFunction)
		{
			fStartFunction(sUid);
		}

		oFormData.append('jua-post-type', 'ajax');
		oFormData.append(getValue(this.oOptions, 'name', 'juaFile'), oFileInfo['File'], oFileInfo['FileName']);
		
		//extending jua hidden parameters with file hidden parameters
		oParsedHiddenParameters =  _.extend(oParsedHiddenParameters, oFileInfo.Hidden || {});
		aHidden.Parameters = JSON.stringify(oParsedHiddenParameters);
		$.each(aHidden, function (sKey, mValue) {
			oFormData.append(sKey, getStringOrCallFunction(mValue, [oFileInfo]));
		});

		oXhr.send(oFormData);

		this.oXhrs[sUid] = oXhr;
		return true;
	}
	catch (oError)
	{
		if (window.console)
		{
			window.console.error(oError);
		}
	}

	fCallback(null, sUid);
	return false;
};

AjaxDriver.prototype.generateNewInput = function (oClickElement)
{
	var
		self = this,
		oLabel = null,
		oInput = null
	;

	if (oClickElement)
	{
		oInput = getNewInput('', !getValue(this.oOptions, 'disableMultiple', false), getValue(this.oOptions, 'hiddenElementsPosition', 'left'), getValue(this.oOptions, 'accept', ''));
		oLabel = createNextLabel();
		oLabel.append(oInput);

		$(oClickElement).append(oLabel);

		oInput
			.on('click', function (event) {

				if (!self.oJua.bEnableButton)
				{
					event.preventDefault();
					return;
				}
				var fOn = self.oJua.getEvent('onDialog');
				if (fOn)
				{
					fOn();
				}
			})
			.on('change', function () {
				getDataFromInput(this, function (oFile) {
						self.oJua.addNewFile(oFile);
						self.generateNewInput(oClickElement);

						setTimeout(function () {
							oLabel.remove();
						}, 10);
					},
					getValue(self.oOptions, 'multipleSizeLimit', iDefLimit),
					self.oJua.getEvent('onLimitReached')
				);
			})
		;
	}
};

AjaxDriver.prototype.cancel = function (sUid)
{
	this.oUids[sUid] = false;
	if (this.oXhrs[sUid])
	{
		try
		{
			if (this.oXhrs[sUid].abort)
			{
				this.oXhrs[sUid].abort();
			}
		}
		catch (oError)
		{
		}

		this.oXhrs[sUid] = null;
	}
};

/**
 * @constructor
 * @param {CJua} oJua
 * @param {Object} oOptions
 */
function IframeDriver(oJua, oOptions)
{
	this.oUids = {};
	this.oForms = {};
	this.oJua = oJua;
	this.oOptions = oOptions;
}

/**
 * @type {Object}
 */
IframeDriver.prototype.oUids = {};

/**
 * @type {Object}
 */
IframeDriver.prototype.oForms = {};

/**
 * @type {?CJua}
 */
IframeDriver.prototype.oJua = null;

/**
 * @type {Object}
 */
IframeDriver.prototype.oOptions = {};

/**
 * @return {boolean}
 */
IframeDriver.prototype.isDragAndDropSupported = function ()
{
	return false;
};

/**
 * @param {string} sUid
 */
IframeDriver.prototype.regTaskUid = function (sUid)
{
	this.oUids[sUid] = true;
};

/**
 * @param {string} sUid
 * @param {object} oFileInfo
 * @param {object} oParsedHiddenParameters
 * @param {function} fCallback
 * @param {boolean} bSkipCompleteFunction
 * @param {boolean} bUseResponce
 * @param {number} iProgressOffset
 * @returns {Boolean}
 */
IframeDriver.prototype.uploadTask = function (sUid, oFileInfo, oParsedHiddenParameters, fCallback, bSkipCompleteFunction, bUseResponce, iProgressOffset)
{
	if (false === this.oUids[sUid])
	{
		fCallback(null, sUid);
		return false;
	}

	var
		oForm = this.oForms[sUid],
		aHidden = _.clone(getValue(this.oOptions, 'hidden', {})),
		fStartFunction = this.oJua.getEvent('onStart'),
		fCompleteFunction = this.oJua.getEvent('onComplete')
	;

	if (oForm)
	{
		oForm.append($('<input type="hidden" />').attr('name', 'jua-post-type').val('iframe'));
		
		//extending jua hidden parameters with file hidden parameters
		oParsedHiddenParameters =  _.extend(oParsedHiddenParameters, oFileInfo.Hidden || {});
		aHidden.Parameters = JSON.stringify(oParsedHiddenParameters);
		$.each(aHidden, function (sKey, sValue) {
			oForm.append($('<input type="hidden" />').attr('name', sKey).val(getStringOrCallFunction(sValue, [oFileInfo])));
		});

		oForm.trigger('submit');
		if (fStartFunction)
		{
			fStartFunction(sUid);
		}

		oForm.find('iframe').on('load', function (oEvent) {

			var
				bResult = false,
				oIframeDoc = null,
				oResult = {}
			;

			if (fCompleteFunction)
			{
				try
				{
					oIframeDoc = this.contentDocument ? this.contentDocument: this.contentWindow.document;
					oResult = $.parseJSON(oIframeDoc.body.innerHTML);
					bResult = true;
				}
				catch (oErr)
				{
					oResult = {};
				}

				fCompleteFunction(sUid, bResult, oResult);
			}

			fCallback(null, sUid);

			window.setTimeout(function () {
				oForm.remove();
			}, 100);
		});
	}
	else
	{
		fCallback(null, sUid);
	}

	return true;
};

IframeDriver.prototype.generateNewInput = function (oClickElement)
{
	var
		self = this,
		sUid = '',
		oInput = null,
		oIframe = null,
		sAction = getValue(this.oOptions, 'action', ''),
		oForm = null,
		sPos = getValue(this.oOptions, 'hiddenElementsPosition', 'left')
	;

	if (oClickElement)
	{
		sUid = getNewUid();

		oInput = getNewInput(getValue(this.oOptions, 'name', 'juaFile'), !getValue(this.oOptions, 'disableMultiple', false), getValue(this.oOptions, 'hiddenElementsPosition', 'left'), getValue(this.oOptions, 'accept', ''));

		oForm = $('<form action="' + sAction + '" target="iframe-' + sUid + '" ' +
' method="POST" enctype="multipart/form-data" style="display: block; cursor: pointer;"></form>');

		oIframe = $('<iframe name="iframe-' + sUid + '" tabindex="-1" src="javascript:void(0);" ' +
' style="position: absolute; top: -1000px; ' + sPos + ': -1000px; cursor: pointer;" />').css({'opacity': 0});

		oForm.append(createNextLabel().append(oInput)).append(oIframe);

		$(oClickElement).append(oForm);

		this.oForms[sUid] = oForm;

		oInput
			.on('click', function (event) {
				if (!self.oJua.bEnableButton)
				{
					event.preventDefault();
					return;
				}
				var fOn = self.oJua.getEvent('onDialog');
				if (fOn)
				{
					fOn();
				}
			})
			.on('change', function () {
				getDataFromInput(this, function (oFile) {
						if (oFile)
						{
							var sPos = getValue(self.oOptions, 'hiddenElementsPosition', 'left');

							oForm.css({
								'position': 'absolute',
								'top': -1000
							});

							oForm.css(sPos, -1000);

							self.oJua.addFile(sUid, oFile);
							self.generateNewInput(oClickElement);
						}

					},
					getValue(self.oOptions, 'multipleSizeLimit', iDefLimit),
					self.oJua.getEvent('onLimitReached')
				);
			})
		;
	}
};

IframeDriver.prototype.cancel = function (sUid)
{
	this.oUids[sUid] = false;
	if (this.oForms[sUid])
	{
		this.oForms[sUid].remove();
		this.oForms[sUid] = false;
	}
};

/**
 * @constructor
 * @param {Object=} oOptions
 */
function CJua(oOptions)
{
	oOptions = isUndefined(oOptions) ? {} : oOptions;

	var self = this;

	self.bEnableDnD = true;
	self.bEnableButton = true;

	self.oEvents = {
		'onDialog': null,
		'onSelect': null,
		'onStart': null,
		'onComplete': null,
		'onCompleteAll': null,
		'onProgress': null,
		'onDragEnter': null,
		'onDragLeave': null,
		'onDrop': null,
		'onBodyDragEnter': null,
		'onBodyDragLeave': null,
		'onLimitReached': function () {
			Popups.showPopup(AlertPopup, [TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_NUMBER_LIMIT_PLURAL', {
				'NUMBERLIMIT': iDefLimit
			}, null, iDefLimit)]);
		}
	};

	self.oOptions = _.extend({
		'action': '',
		'name': '',
		'hidden': {},
		'queueSize': 10,
		'clickElement': false,
		'dragAndDropElement': false,
		'dragAndDropBodyElement': false,
		'disableAjaxUpload': false,
		'disableFolderDragAndDrop': true,
		'disableDragAndDrop': false,
		'disableMultiple': false,
		'disableDocumentDropPrevent': false,
		'disableAutoUploadOnDrop': false,
		'multipleSizeLimit': iDefLimit,
		'hiddenElementsPosition': 'left'
	}, oOptions);
	
	self.oQueue = queue(Types.pInt(getValue(self.oOptions, 'queueSize', 10)));
	if (self.runEvent('onCompleteAll'))
	{
		self.oQueue.await(function () {
			self.runEvent('onCompleteAll');
		});
	}

	self.oDriver = self.isAjaxUploaderSupported() && !getValue(self.oOptions, 'disableAjaxUpload', false) ?
		new AjaxDriver(self, self.oOptions) : new IframeDriver(self, self.oOptions);

	self.oClickElement = getValue(self.oOptions, 'clickElement', null);

	if (self.oClickElement)
	{
		$(self.oClickElement).css({
			'position': 'relative',
			'overflow': 'hidden'
		});

		if ('inline' === $(this.oClickElement).css('display'))
		{
			$(this.oClickElement).css('display', 'inline-block');
		}

		this.oDriver.generateNewInput(this.oClickElement);
	}

	if (this.oDriver.isDragAndDropSupported() && getValue(this.oOptions, 'dragAndDropElement', false) &&
		!getValue(this.oOptions, 'disableAjaxUpload', false))
	{
		(function (self) {
			var
				$doc = $(document),
				oBigDropZone = $(getValue(self.oOptions, 'dragAndDropBodyElement', false) || $doc),
				oDragAndDropElement = getValue(self.oOptions, 'dragAndDropElement', false),
				fHandleDragOver = function (oEvent) {
					if (self.bEnableDnD && oEvent)
					{
						oEvent = getEvent(oEvent);
						if (oEvent && oEvent.dataTransfer && eventContainsFiles(oEvent))
						{
							try
							{
								var sEffect = oEvent.dataTransfer.effectAllowed;

								mainClearTimeout(self.iDocTimer);

								oEvent.dataTransfer.dropEffect = (sEffect === 'move' || sEffect === 'linkMove') ? 'move' : 'copy';

								oEvent.stopPropagation();
								oEvent.preventDefault();

								oBigDropZone.trigger('dragover', oEvent);
							}
							catch (oExc) {}
						}
					}
				},
				fHandleDrop = function (oEvent) {
					if (self.bEnableDnD && oEvent)
					{
						oEvent = getEvent(oEvent);
						if (oEvent && eventContainsFiles(oEvent))
						{
							oEvent.preventDefault();

							getDataFromDragEvent(
								oEvent,
								function (oFile) {
									if (oFile)
									{
										if (getValue(self.oOptions, 'disableAutoUploadOnDrop', false)) {
											self.runEvent('onDrop', [
												oFile,
												oEvent,
												function () {
													self.addNewFile(oFile);
													mainClearTimeout(self.iDocTimer);
												}
											]);
										}
										else
										{
											self.runEvent('onDrop', [oFile, oEvent]);
											self.addNewFile(oFile);
											mainClearTimeout(self.iDocTimer);
										}
									}
								},
								getValue(self.oOptions, 'multipleSizeLimit', iDefLimit),
								self.getEvent('onLimitReached'),
								!getValue(self.oOptions, 'disableFolderDragAndDrop', true)
							);
						}
					}

					self.runEvent('onDragLeave', [oEvent]);
				},
				fHandleDragEnter = function (oEvent) {
					if (self.bEnableDnD && oEvent)
					{
						oEvent = getEvent(oEvent);
						if (oEvent && eventContainsFiles(oEvent))
						{
							mainClearTimeout(self.iDocTimer);

							oEvent.preventDefault();
							self.runEvent('onDragEnter', [oDragAndDropElement, oEvent]);
						}
					}
				},
				fHandleDragLeave = function (oEvent) {
					if (self.bEnableDnD && oEvent)
					{
						oEvent = getEvent(oEvent);
						if (oEvent)
						{
							var oRelatedTarget = document['elementFromPoint'] ? document['elementFromPoint'](oEvent['clientX'], oEvent['clientY']) : null;
							if (oRelatedTarget && contains(this, oRelatedTarget))
							{
								return;
							}

							mainClearTimeout(self.iDocTimer);
							self.runEvent('onDragLeave', [oDragAndDropElement, oEvent]);
						}

						return;
					}
				}
			;

			if (oDragAndDropElement)
			{
				if (!getValue(self.oOptions, 'disableDocumentDropPrevent', false))
				{
					$doc.on('dragover', function (oEvent) {
						if (self.bEnableDnD && oEvent)
						{
							oEvent = getEvent(oEvent);
							if (oEvent && oEvent.dataTransfer && eventContainsFiles(oEvent))
							{
								try
								{
									oEvent.dataTransfer.dropEffect = 'none';
									oEvent.preventDefault();
								}
								catch (oExc) {}
							}
						}
					});
				}

				if (oBigDropZone && oBigDropZone[0])
				{
					oBigDropZone
						.on('dragover', function (oEvent) {
							if (self.bEnableDnD && oEvent)
							{
								mainClearTimeout(self.iDocTimer);
							}
						})
						.on('dragenter', function (oEvent) {
							if (self.bEnableDnD && oEvent)
							{
								oEvent = getEvent(oEvent);
								if (oEvent && eventContainsFiles(oEvent))
								{
									mainClearTimeout(self.iDocTimer);
									oEvent.preventDefault();

									self.runEvent('onBodyDragEnter', [oEvent]);
								}
							}
						})
						.on('dragleave', function (oEvent) {
							if (self.bEnableDnD && oEvent)
							{
								oEvent = getEvent(oEvent);
								if (oEvent)
								{
									mainClearTimeout(self.iDocTimer);
									self.iDocTimer = setTimeout(function () {
										self.runEvent('onBodyDragLeave', [oEvent]);
									}, 200);
								}
							}
						})
						.on('drop', function (oEvent) {
							if (self.bEnableDnD && oEvent)
							{
								oEvent = getEvent(oEvent);
								if (oEvent)
								{
									var bFiles = eventContainsFiles(oEvent);
									if (bFiles)
									{
										oEvent.preventDefault();
									}

									self.runEvent('onBodyDragLeave', [oEvent]);

									return !bFiles;
								}
							}

							return false;
						})
					;
				}

				$(oDragAndDropElement)
					.bind('dragenter', fHandleDragEnter)
					.bind('dragover', fHandleDragOver)
					.bind('dragleave', fHandleDragLeave)
					.bind('drop', fHandleDrop)
				;
			}

		}(self));
	}
	else
	{
		self.bEnableDnD = false;
	}

	setValue(self, 'on', self.on);
	setValue(self, 'cancel', self.cancel);
	setValue(self, 'isDragAndDropSupported', self.isDragAndDropSupported);
	setValue(self, 'isAjaxUploaderSupported', self.isAjaxUploaderSupported);
	setValue(self, 'setDragAndDropEnabledStatus', self.setDragAndDropEnabledStatus);
}

/**
 * @type {boolean}
 */
CJua.prototype.bEnableDnD = true;

/**
 * @type {number}
 */
CJua.prototype.iDocTimer = 0;

/**
 * @type {Object}
 */
CJua.prototype.oOptions = {};

/**
 * @type {Object}
 */
CJua.prototype.oEvents = {};

/**
 * @type {?Object}
 */
CJua.prototype.oQueue = null;

/**
 * @type {?Object}
 */
CJua.prototype.oDriver = null;

/**
 * @param {string} sName
 * @param {Function} fFunc
 */
CJua.prototype.on = function (sName, fFunc)
{
	this.oEvents[sName] = fFunc;
	return this;
};

/**
 * @param {string} sName
 * @param {string=} aArgs
 */
CJua.prototype.runEvent = function (sName, aArgs)
{
	if (this.oEvents[sName])
	{
		this.oEvents[sName].apply(null, aArgs || []);
	}
};

/**
 * @param {string} sName
 */
CJua.prototype.getEvent = function (sName)
{
	return this.oEvents[sName] || null;
};

/**
 * @param {string} sUid
 */
CJua.prototype.cancel = function (sUid)
{
	this.oDriver.cancel(sUid);
};

/**
 * @return {boolean}
 */
CJua.prototype.isAjaxUploaderSupported = function ()
{
	return (function () {
		var oInput = document.createElement('input');
		oInput.type = 'file';
		return !!('XMLHttpRequest' in window && 'multiple' in oInput && 'FormData' in window && (new XMLHttpRequest()).upload && true);
	}());
};

/**
 * @param {boolean} bEnabled
 */
CJua.prototype.setDragAndDropEnabledStatus = function (bEnabled)
{
	this.bEnableDnD = !!bEnabled;
};

/**
 * @return {boolean}
 */
CJua.prototype.isDragAndDropSupported = function ()
{
	return this.oDriver.isDragAndDropSupported();
};

/**
 * @param {Object} oFileInfo
 */
CJua.prototype.addNewFile = function (oFileInfo)
{
	this.addFile(getNewUid(), oFileInfo);
};

/**
 * @param {string} sUid
 * @param {Object} oFileInfo
 */
CJua.prototype.addFile = function (sUid, oFileInfo)
{
	var
		fOnSelect = this.getEvent('onSelect'),
		fOnChunkReadyCallback = null,
		bBreakUpload = false,
		aHidden = getValue(this.oOptions, 'hidden', {}),
		fCompleteFunction = this.getEvent('onComplete'),
		fRegularUploadFileCallback = _.bind(function (sUid, oFileInfo) {
			var
				aHidden = getValue(this.oOptions, 'hidden', {}),
				oParsedHiddenParameters = JSON.parse(getStringOrCallFunction(aHidden.Parameters, [oFileInfo]))
			;
			this.oDriver.regTaskUid(sUid);
			this.oQueue.defer(scopeBind(this.oDriver.uploadTask, this.oDriver), sUid, oFileInfo, oParsedHiddenParameters);
		}, this),
		fCancelFunction = this.getEvent('onCancel')
	;
	if (oFileInfo && (!fOnSelect || (false !== fOnSelect(sUid, oFileInfo))))
	{
		// fOnChunkReadyCallback runs when chunk ready for uploading
		fOnChunkReadyCallback = _.bind(function (sUid, oFileInfo, fProcessNextChunkCallback, iCurrChunk, iChunkNumber, iProgressOffset) {
			var fOnUploadCallback = null;
			// fOnUploadCallback runs when server have responded for upload
			fOnUploadCallback = function (sResponse, sFileUploadUid)
			{
				var oResponse = null;
				
				try
				{ // Suppress exceptions in the connection failure case 
					oResponse = $.parseJSON(sResponse);
				}
				catch (err)
				{
				}

				if (oResponse && oResponse.Result && !oResponse.Result.Error && !oResponse.ErrorCode)
				{//if response contains result and have no errors
					fProcessNextChunkCallback(sUid, fOnChunkReadyCallback);
				}
				else if (oResponse && oResponse.Result && oResponse.Result.Error)
				{
					App.broadcastEvent('Jua::FileUploadingError');
					fCompleteFunction(sFileUploadUid, false, {ErrorCode: oResponse.Result.Error});
				}
				else if (oResponse && oResponse.ErrorCode)
				{
					App.broadcastEvent('Jua::FileUploadingError');
					fCompleteFunction(sFileUploadUid, false, {ErrorCode: oResponse.ErrorCode});
				}
				else
				{
					App.broadcastEvent('Jua::FileUploadingError');
					fCompleteFunction(sFileUploadUid, false);
				}
			};
			
			var
				aHidden = getValue(this.oOptions, 'hidden', {}),
				oParsedHiddenParameters = JSON.parse(getStringOrCallFunction(aHidden.Parameters, [oFileInfo]))
			;
			this.oDriver.regTaskUid(sUid);
			this.oDriver.uploadTask(sUid, oFileInfo, oParsedHiddenParameters, fOnUploadCallback, iCurrChunk < iChunkNumber, true, iProgressOffset);
		}, this);
		var
			isUploadAvailable = ko.observable(true),
			oParsedHiddenParameters = JSON.parse(getStringOrCallFunction(aHidden.Parameters, [oFileInfo]))
		;
		App.broadcastEvent('Jua::FileUpload::isUploadAvailable', {
			isUploadAvailable: isUploadAvailable,
			sModuleName: aHidden.Module,
			sUid: sUid,
			oFileInfo: oFileInfo
		});
		if (isUploadAvailable())
		{
			bBreakUpload = App.broadcastEvent('Jua::FileUpload::before', {
				sUid: sUid,
				oFileInfo: oFileInfo,
				fOnChunkReadyCallback: fOnChunkReadyCallback,
				sModuleName: aHidden.Module,
				fRegularUploadFileCallback: fRegularUploadFileCallback,
				fCancelFunction: fCancelFunction,
				sStorageType: oParsedHiddenParameters.Type
			});

			if (bBreakUpload === false)
			{
				fRegularUploadFileCallback(sUid, oFileInfo);
			}
		}
		else if(_.isFunction(fCancelFunction))
		{
			fCancelFunction(sUid);
		}
	}
	else
	{
		this.oDriver.cancel(sUid);
	}
};

/**
 * @param {string} sName
 * @param {mixed} mValue
 */
CJua.prototype.setOption = function (sName, mValue)
{
	this.oOptions[sName] = mValue;
};

module.exports = CJua;


/***/ }),

/***/ "p2hp":
/*!**********************************************!*\
  !*** ./modules/MailWebclient/js/Settings.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	_ = __webpack_require__(/*! underscore */ "F/us"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5")
;

module.exports = {
	ServerModuleName: 'Mail',
	HashModuleName: 'mail',
	FetchersServerModuleName: 'MtaConnector',
	AliasesServerModuleName: 'CpanelIntegrator',
	
	// from Core module
	EnableMultiTenant: false,
	
	// from Mail module
	AllowAddAccounts: false,
	AllowAutosaveInDrafts: true,
	AllowChangeMailQuotaOnMailServer: false,
	AllowDefaultAccountForUser: true,
	AllowEditDomainsInServer: true,
	AllowFetchers: false,
	AllowIdentities: false,
	AllowAliases: false,
	OnlyUserEmailsInIdentities: false,
	AllowInsertImage: true,
	AllowMultiAccounts: false,
	AutoSaveIntervalSeconds: 60,
	AllowTemplateFolders: false,
	AllowInsertTemplateOnCompose: false,
	MaxTemplatesCountOnCompose: 100,
	AllowAlwaysRefreshFolders: false,
	AutocreateMailAccountOnNewUserFirstLogin: false,
	IgnoreImapSubscription: false,
	ImageUploadSizeLimit: 0,
	AllowUnifiedInbox: true,

	// from MailWebclient module
	AllowAppRegisterMailto: false,
	AllowChangeInputDirection: true,
	FoldersExpandedByDefault: false,
	AllowSpamFolder: true,
	AllowAddNewFolderOnMainScreen: false,
	ComposeToolbarOrder: ['back', 'send', 'save', 'importance', 'MailSensitivity', 'confirmation', 'OpenPgp'],
	DefaultFontName: 'Tahoma',
	DefaultFontSize: 3,
	AlwaysTryUseImageWhilePasting: true,
	JoinReplyPrefixes: true,
	MailsPerPage: 20,
	MaxMessagesBodiesSizeToPrefetch: 50000,
	MessageBodyTruncationThreshold: 650000, // in bytes
	MessagesSortBy: {},
	ShowEmailAsTabName: true,
	AllowShowMessagesCountInFolderList: false,
	showMessagesCountInFolderList: ko.observable(false),
	AllowSearchMessagesBySubject: false,
	PrefixesToRemoveBeforeSearchMessagesBySubject: [],
	AllowHorizontalLayout: false,
	HorizontalLayout: false,
	HorizontalLayoutByDefault: false,
	DisableRtlRendering: false,
	AllowQuickReply: false,
	AllowQuickSendOnCompose: false,
	MarkMessageSeenWhenViewing: true,
	MarkMessageSeenWhenAnswerForward: false,
	UserLoginPartInAccountDropdown: false,
	UseMeRecipientForMessages: true,

	userMailAccountsCount: ko.observable(0),
	mailAccountsEmails: ko.observableArray([]),
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var
			oCoreDataSection = oAppData['Core'],
			oAppDataMailSection = oAppData[this.ServerModuleName],
			oAppDataMailWebclientSection = oAppData['MailWebclient'],
			oAppDataFetchersSection = oAppData[this.FetchersServerModuleName],
			oAppDataAliasesSection = oAppData[this.AliasesServerModuleName]
		;

		if (!_.isEmpty(oCoreDataSection))
		{
			this.EnableMultiTenant = Types.pBool(oCoreDataSection.EnableMultiTenant, this.EnableMultiTenant);
		}
		
		if (!_.isEmpty(oAppDataMailSection))
		{
			this.AllowAddAccounts = Types.pBool(oAppDataMailSection.AllowAddAccounts, this.AllowAddAccounts);
			this.AllowAutosaveInDrafts = Types.pBool(oAppDataMailSection.AllowAutosaveInDrafts, this.AllowAutosaveInDrafts);
			this.AllowChangeMailQuotaOnMailServer = Types.pBool(oAppDataMailSection.AllowChangeMailQuotaOnMailServer, this.AllowChangeMailQuotaOnMailServer);
			this.AllowDefaultAccountForUser = Types.pBool(oAppDataMailSection.AllowDefaultAccountForUser, this.AllowDefaultAccountForUser);
			this.AllowEditDomainsInServer = Types.pBool(oAppDataMailSection.AllowEditDomainsInServer, this.AllowEditDomainsInServer);
			this.AllowIdentities = Types.pBool(oAppDataMailSection.AllowIdentities, this.AllowIdentities);
			this.OnlyUserEmailsInIdentities = Types.pBool(oAppDataMailSection.OnlyUserEmailsInIdentities, this.OnlyUserEmailsInIdentities);
			this.AllowInsertImage = Types.pBool(oAppDataMailSection.AllowInsertImage, this.AllowInsertImage);
			this.AllowMultiAccounts = Types.pBool(oAppDataMailSection.AllowMultiAccounts, this.AllowMultiAccounts);
			this.AutoSaveIntervalSeconds = Types.pNonNegativeInt(oAppDataMailSection.AutoSaveIntervalSeconds, this.AutoSaveIntervalSeconds);
			this.AllowTemplateFolders = Types.pBool(oAppDataMailSection.AllowTemplateFolders, this.AllowTemplateFolders);
			this.AllowInsertTemplateOnCompose = Types.pBool(oAppDataMailSection.AllowInsertTemplateOnCompose, this.AllowInsertTemplateOnCompose);
			this.MaxTemplatesCountOnCompose = Types.pPositiveInt(oAppDataMailSection.MaxTemplatesCountOnCompose, this.MaxTemplatesCountOnCompose);
			this.AllowAlwaysRefreshFolders = Types.pBool(oAppDataMailSection.AllowAlwaysRefreshFolders, this.AllowAlwaysRefreshFolders);
			this.AutocreateMailAccountOnNewUserFirstLogin = Types.pBool(oAppDataMailSection.AutocreateMailAccountOnNewUserFirstLogin, this.AutocreateMailAccountOnNewUserFirstLogin);
			this.IgnoreImapSubscription = Types.pBool(oAppDataMailSection.IgnoreImapSubscription, this.IgnoreImapSubscription);
			this.ImageUploadSizeLimit = Types.pNonNegativeInt(oAppDataMailSection.ImageUploadSizeLimit, this.ImageUploadSizeLimit);
			this.AllowUnifiedInbox = Types.pBool(oAppDataMailSection.AllowUnifiedInbox, this.AllowUnifiedInbox);
			window.Enums.SmtpAuthType = Types.pObject(oAppDataMailSection.SmtpAuthType);

			this.MessagesSortBy = _.clone(Types.pObject(oAppDataMailSection.MessagesSortBy, this.MessagesSortBy));
			this.MessagesSortBy.Allow = Types.pBool(this.MessagesSortBy.Allow, false);
			this.MessagesSortBy.List = Types.pArray(this.MessagesSortBy.List, []);
			this.MessagesSortBy.DefaultSortBy = Types.pString(this.MessagesSortBy.DefaultSortBy, 'arrival');
			var sOrder = Types.pString(this.MessagesSortBy.DefaultSortOrder, 'desc');
			this.MessagesSortBy.DefaultSortOrder = sOrder === 'desc' ? Enums.SortOrder.Desc : Enums.SortOrder.Asc;
		}
			
		if (!_.isEmpty(oAppDataMailWebclientSection))
		{
			this.AllowAppRegisterMailto = Types.pBool(oAppDataMailWebclientSection.AllowAppRegisterMailto, this.AllowAppRegisterMailto);
			this.AllowChangeInputDirection = Types.pBool(oAppDataMailWebclientSection.AllowChangeInputDirection, this.AllowChangeInputDirection);
			this.FoldersExpandedByDefault = Types.pBool(oAppDataMailWebclientSection.FoldersExpandedByDefault, this.FoldersExpandedByDefault);
			this.AllowSpamFolder = Types.pBool(oAppDataMailWebclientSection.AllowSpamFolder, this.AllowSpamFolder);
			this.AllowAddNewFolderOnMainScreen = Types.pBool(oAppDataMailWebclientSection.AllowAddNewFolderOnMainScreen, this.AllowAddNewFolderOnMainScreen);
			this.ComposeToolbarOrder = Types.pArray(oAppDataMailWebclientSection.ComposeToolbarOrder, this.ComposeToolbarOrder);
			this.DefaultFontName = Types.pString(oAppDataMailWebclientSection.DefaultFontName, this.DefaultFontName);
			this.DefaultFontSize = Types.pPositiveInt(oAppDataMailWebclientSection.DefaultFontSize, this.DefaultFontSize);
			this.AlwaysTryUseImageWhilePasting = Types.pBool(oAppDataMailWebclientSection.AlwaysTryUseImageWhilePasting, this.AlwaysTryUseImageWhilePasting);
			this.JoinReplyPrefixes = Types.pBool(oAppDataMailWebclientSection.JoinReplyPrefixes, this.JoinReplyPrefixes);
			this.MailsPerPage = Types.pPositiveInt(oAppDataMailWebclientSection.MailsPerPage, this.MailsPerPage);
			this.MaxMessagesBodiesSizeToPrefetch = Types.pNonNegativeInt(oAppDataMailWebclientSection.MaxMessagesBodiesSizeToPrefetch, this.MaxMessagesBodiesSizeToPrefetch);
			this.MessageBodyTruncationThreshold = Types.pNonNegativeInt(oAppDataMailWebclientSection.MessageBodyTruncationThreshold, this.MessageBodyTruncationThreshold);
			
			this.ShowEmailAsTabName = Types.pBool(oAppDataMailWebclientSection.ShowEmailAsTabName, this.ShowEmailAsTabName);
			this.AllowShowMessagesCountInFolderList = Types.pBool(oAppDataMailWebclientSection.AllowShowMessagesCountInFolderList, this.AllowShowMessagesCountInFolderList);
			this.showMessagesCountInFolderList(Types.pBool(oAppDataMailWebclientSection.ShowMessagesCountInFolderList, this.showMessagesCountInFolderList()));
			this.AllowSearchMessagesBySubject = Types.pBool(oAppDataMailWebclientSection.AllowSearchMessagesBySubject, this.AllowSearchMessagesBySubject);
			this.PrefixesToRemoveBeforeSearchMessagesBySubject = Types.pArray(oAppDataMailWebclientSection.PrefixesToRemoveBeforeSearchMessagesBySubject, this.PrefixesToRemoveBeforeSearchMessagesBySubject);
			this.AllowHorizontalLayout = Types.pBool(oAppDataMailWebclientSection.AllowHorizontalLayout, this.AllowHorizontalLayout);
			this.HorizontalLayout = this.AllowHorizontalLayout && Types.pBool(oAppDataMailWebclientSection.HorizontalLayout, this.HorizontalLayout);
			this.HorizontalLayoutByDefault = this.AllowHorizontalLayout && Types.pBool(oAppDataMailWebclientSection.HorizontalLayoutByDefault, this.HorizontalLayoutByDefault);
			this.DisableRtlRendering = Types.pBool(oAppDataMailWebclientSection.DisableRtlRendering, this.DisableRtlRendering);
			this.AllowQuickReply = Types.pBool(oAppDataMailWebclientSection.AllowQuickReply, this.AllowQuickReply);
			this.AllowQuickSendOnCompose = Types.pBool(oAppDataMailWebclientSection.AllowQuickSendOnCompose, this.AllowQuickSendOnCompose);
			this.MarkMessageSeenWhenViewing = Types.pBool(oAppDataMailWebclientSection.MarkMessageSeenWhenViewing, this.MarkMessageSeenWhenViewing);
			this.MarkMessageSeenWhenAnswerForward = Types.pBool(oAppDataMailWebclientSection.MarkMessageSeenWhenAnswerForward, this.MarkMessageSeenWhenAnswerForward);
			this.UserLoginPartInAccountDropdown = Types.pBool(oAppDataMailWebclientSection.UserLoginPartInAccountDropdown, this.UserLoginPartInAccountDropdown);
			this.UseMeRecipientForMessages = Types.pBool(oAppDataMailWebclientSection.UseMeRecipientForMessages, this.UseMeRecipientForMessages);
		}
		
		if (!_.isEmpty(oAppDataFetchersSection))
		{
			this.AllowFetchers = Types.pBool(oAppDataFetchersSection.AllowFetchers, this.AllowFetchers);
		}
		if (!_.isEmpty(oAppDataAliasesSection))
		{
			this.AllowAliases = Types.pBool(oAppDataAliasesSection.AllowAliases, this.AllowAliases);
		}
		
		App.registerUserAccountsCount(this.userMailAccountsCount);
		App.registerAccountsWithPass(this.mailAccountsEmails);
	},
	
	/**
	 * Updates new settings values after saving on server.
	 * 
	 * @param {number} iMailsPerPage
	 * @param {boolean} bAllowAutosaveInDrafts
	 * @param {boolean} bAllowChangeInputDirection
	 * @param {boolean} bShowMessagesCountInFolderList
	 */
	update: function (iMailsPerPage, bAllowAutosaveInDrafts, bAllowChangeInputDirection, bShowMessagesCountInFolderList)
	{
		this.AllowAutosaveInDrafts = Types.pBool(bAllowAutosaveInDrafts, this.AllowAutosaveInDrafts);
		
		this.AllowChangeInputDirection = Types.pBool(bAllowChangeInputDirection, this.AllowChangeInputDirection);
		this.MailsPerPage = Types.pPositiveInt(iMailsPerPage, this.MailsPerPage);
		this.showMessagesCountInFolderList(Types.pBool(bShowMessagesCountInFolderList, this.showMessagesCountInFolderList()));
	},
	
	/**
	 * Updates new admin settings values after saving on server.
	 * 
	 * @param {boolean} bAutocreateMailAccountOnNewUserFirstLogin
	 * @param {boolean} bAllowAddAccounts
	 * @param {boolean} bHorizontalLayoutByDefault
	 */
	updateAdmin: function (bAutocreateMailAccountOnNewUserFirstLogin, bAllowAddAccounts, bHorizontalLayoutByDefault)
	{
		this.AutocreateMailAccountOnNewUserFirstLogin = Types.pBool(bAutocreateMailAccountOnNewUserFirstLogin, this.AutocreateMailAccountOnNewUserFirstLogin);
		this.AllowAddAccounts = Types.pBool(bAllowAddAccounts, this.AllowAddAccounts);
		this.HorizontalLayoutByDefault = Types.pBool(bHorizontalLayoutByDefault, this.HorizontalLayoutByDefault);
	},
	
	disableEditDomainsInServer: function ()
	{
		this.AllowEditDomainsInServer = false;
	}
};


/***/ }),

/***/ "qGK3":
/*!*********************************************************!*\
  !*** ./modules/MailWebclient/js/models/CFolderModel.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	moment = __webpack_require__(/*! moment */ "wd/R"),
	
	Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	Ajax = __webpack_require__(/*! modules/MailWebclient/js/Ajax.js */ "UN2P"),
	Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ "JFZZ"),
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	Routing = __webpack_require__(/*! modules/CoreWebclient/js/Routing.js */ "QaF5"),
	Storage = __webpack_require__(/*! modules/CoreWebclient/js/Storage.js */ "gcBV"),
	
	Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh"),
	ConfirmPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/ConfirmPopup.js */ "20Ah"),
	
	LinksUtils = __webpack_require__(/*! modules/MailWebclient/js/utils/Links.js */ "4M/5"),
	
	AccountList = __webpack_require__(/*! modules/MailWebclient/js/AccountList.js */ "jonm"),
	MailCache = null,
	MessagesDictionary = __webpack_require__(/*! modules/MailWebclient/js/MessagesDictionary.js */ "xzvH"),
	Settings = __webpack_require__(/*! modules/MailWebclient/js/Settings.js */ "p2hp"),
	
	CMessageModel = __webpack_require__(/*! modules/MailWebclient/js/models/CMessageModel.js */ "Nfk5"),
	CUidListModel = __webpack_require__(/*! modules/MailWebclient/js/models/CUidListModel.js */ "lPfU")
;

/**
 * @constructor
 * @param {number} iAccountId
 */
function CFolderModel(iAccountId, bIsUnifiedInbox)
{
	this.iAccountId = iAccountId;
	this.bIsUnifiedInbox = !!bIsUnifiedInbox;
	this.oUnifiedInboxes = {};
	this.bNamespace = false;
	this.iDisplayedLevel = 0;

	this.bIgnoreImapSubscription = Settings.IgnoreImapSubscription;
	this.bAllowTemplateFolders = Settings.AllowTemplateFolders;
	this.isTemplateStorage = ko.observable(false);
	this.bAllowAlwaysRefreshFolders = Settings.AllowAlwaysRefreshFolders;
	this.isAlwaysRefresh = ko.observable(false);
	
	/** From server **/
	this.sDelimiter = '';
	this.bExists = true;
	/** Extended **/
	this.sUidNext = '';
	this.sHash = '';
	this.messageCount = ko.observable(0);
	this.unseenMessageCount = ko.observable(0);
	this.iRealUnseenMessageCount = 0;
	this.hasExtendedInfo = ko.observable(false);
	/** Extended **/
	this.fullName = ko.observable('');
	this.fullNameHash = ko.observable('');
	this.parentFullName = ko.observable('');
	this.bSelectable = true;
	this.subscribed = ko.observable(true);
	this.name = ko.observable('');
	this.nameForEdit = ko.observable('');
	this.subfolders = ko.observableArray([]);
	this.subfoldersMessagesCount = ko.observable(0);
	this.type = ko.observable(Enums.FolderTypes.User);
	/** From server **/
	
	this.bVirtual = false;	// Indicates if the folder does not exist on mail server and uses as place for filtered message list.
							// At the moment the application supports only one type of virtual folders - for starred messages.
	this.selected = ko.observable(false); // Indicates if the folder is selected on mail screen.
	this.expanded = ko.observable(false); // Indicates if subfolders are shown on mail screen.
	this.recivedAnim = ko.observable(false).extend({'autoResetToFalse': 500}); // Starts the animation for displaying moving messages to the folder on mail screen.

	this.edited = ko.observable(false); // Indicates if the folder name is edited now on settings screen.

	this.aMessagesDictionaryUids = [];
	
	this.oUids = {};

	this.aResponseHandlers = [];
	
	this.aRequestedUids = [];
	this.aRequestedThreadUids = [];
	this.requestedLists = [];
	
	this.hasChanges = ko.observable(false);
	
	this.oRelevantInformationLastMoment = null;
	
	this.bSubscribtionsInitialized = false;

	this.disableMoveTo = ko.observable(this.bVirtual || this.bIsUnifiedInbox);
	this.disableMoveFrom = ko.observable(this.bIsUnifiedInbox);
}

CFolderModel.prototype.setDisableMoveTo = function (bDisable)
{
	this.disableMoveTo(this.bVirtual || this.bIsUnifiedInbox || bDisable);
};

CFolderModel.prototype.setDisableMoveFrom = function (bDisable)
{
	this.disableMoveFrom(this.bIsUnifiedInbox || bDisable);
};

CFolderModel.prototype.requireMailCache = function ()
{
	if (MailCache === null)
	{
		MailCache = __webpack_require__(/*! modules/MailWebclient/js/Cache.js */ "4+IO");
	}
};

/**
 * @param {number} iLevel
 */
CFolderModel.prototype.setDisplayedLevel = function (iLevel)
{
	this.iDisplayedLevel = iLevel;
};

CFolderModel.prototype.getDisplayedLevel = function ()
{
	return this.iDisplayedLevel;
};

CFolderModel.prototype.getUnifiedInbox = function (iAccountId)
{
	var oInbox = this.oUnifiedInboxes[iAccountId];
	if (!oInbox)
	{
		this.requireMailCache();
		var oFolderList = MailCache.oFolderListItems[iAccountId];
		oInbox = oFolderList ? oFolderList.inboxFolder() : null;
		this.oUnifiedInboxes[iAccountId] = oInbox;
	}
	return oInbox;
};

/**
 * @param {string} sUid
 * @returns {Object}
 */
CFolderModel.prototype.getMessageByUid = function (sUid)
{
	if (this.bIsUnifiedInbox)
	{
		var
			aParts = sUid.split(':'),
			iAccountId = aParts.length === 2 ? Types.pInt(aParts[0]) : this.iAccountId,
			sActualUid = aParts.length === 2 ? Types.pString(aParts[1]) : sUid,
			oInbox = this.getUnifiedInbox(iAccountId)
		;
		return oInbox ? MessagesDictionary.get([iAccountId, oInbox.fullName(), sActualUid]) : null;
	}
	else
	{
		return MessagesDictionary.get([this.iAccountId, this.fullName(), sUid]);
	}
};

/**
 * Removes message uid from the dictionary.
 * @param {string} sUid
 * @returns {Object}
 */
CFolderModel.prototype.removeMessageFromDict = function (sUid)
{
	MessagesDictionary.remove([this.iAccountId, this.fullName(), sUid]);
	this.aMessagesDictionaryUids = _.without(this.aMessagesDictionaryUids, sUid);
	this.aRequestedUids = _.without(this.aRequestedUids, sUid);
	this.aRequestedThreadUids = _.without(this.aRequestedThreadUids, sUid);
};

/**
 * Update last access time for messages with specified uids.
 * @param {array} aUids
 */
CFolderModel.prototype.updateLastAccessTime = function (aUids) {
	_.each(aUids, function (sUid) {
		var oMessage = this.getMessageByUid(sUid);
		if (oMessage)
		{
			oMessage.updateLastAccessTime();
		}
	}, this);
};

/**
 * Executes some function for all uids of messages from the folder in the dictionary.
 * Removes invalid uids from lists.
 * @param {function} fDoForAllMessages
 */
CFolderModel.prototype.doForAllMessages = function (fDoForAllMessages) {
	var aInvalidUids = [];
	
	_.each(this.aMessagesDictionaryUids, function (sUidInDict) {
		var oMessage = this.getMessageByUid(sUidInDict);
		if (oMessage)
		{
			fDoForAllMessages(oMessage);
		}
		else
		{
			aInvalidUids.push(sUidInDict);
		}
	}, this);
	
	if (aInvalidUids.length > 0)
	{
		this.aMessagesDictionaryUids = _.difference(this.aMessagesDictionaryUids, aInvalidUids);
		this.aRequestedUids = _.difference(this.aRequestedUids, aInvalidUids);
		this.aRequestedThreadUids = _.difference(this.aRequestedThreadUids, aInvalidUids);
	}
};

/**
 * @returns {Array}
 */
CFolderModel.prototype.getFlaggedMessageUids = function ()
{
	var aUids = [];
	
	this.doForAllMessages(function (oMessage) {
		if (oMessage.flagged())
		{
			aUids.push(oMessage.uid());
		}
	});
	
	return aUids;
};

/**
 * @param {string} sUid
 */
CFolderModel.prototype.setMessageUnflaggedByUid = function (sUid)
{
	var oMessage = this.getMessageByUid(sUid);
	if (oMessage)
	{
		oMessage.flagged(false);
	}
};

/**
 * @param {Object} oMessage
 */
CFolderModel.prototype.hideThreadMessages = function (oMessage)
{
	_.each(oMessage.threadUids(), function (sThreadUid) {
		var oThreadMessage = this.getMessageByUid(sThreadUid);
		if (oThreadMessage)
		{
			if (!oThreadMessage.deleted())
			{
				oThreadMessage.threadShowAnimation(false);
				oThreadMessage.threadHideAnimation(true);
				
				setTimeout(function () {
					oThreadMessage.threadHideAnimation(false);
				}, 1000);
			}
		}
	}, this);
};

/**
 * @param {Object} oMessage
 */
CFolderModel.prototype.getThreadMessages = function (oMessage)
{
	var
		aLoadedMessages = [],
		aUidsForLoad = [],
		aChangedThreadUids = [],
		iCount = 0,
		oLastMessage = null,
		iShowThrottle = 50
	;

	_.each(oMessage.threadUids(), function (sThreadUid) {
		if (iCount < oMessage.threadCountForLoad())
		{
			var oThreadMessage = this.getMessageByUid(sThreadUid);
			if (oThreadMessage)
			{
				if (!oThreadMessage.deleted())
				{
					oThreadMessage.markAsThreadPart(iShowThrottle, oMessage.uid());
					if (!oThreadMessage.unifiedUid())
					{
						oThreadMessage.unifiedUid(oThreadMessage.accountId() + ':' + oThreadMessage.uid());
					}
					aLoadedMessages.push(oThreadMessage);
					aChangedThreadUids.push(oThreadMessage.uid());
					iCount++;
					oLastMessage = oThreadMessage;
				}
			}
			else
			{
				aUidsForLoad.push(sThreadUid);
				aChangedThreadUids.push(sThreadUid);
				iCount++;
			}
		}
		else
		{
			aChangedThreadUids.push(sThreadUid);
		}
	}, this);
	
	if (!oMessage.threadLoading())
	{
		this.loadThreadMessages(aUidsForLoad);
	}
	
	oMessage.changeThreadUids(aChangedThreadUids, aLoadedMessages.length);
	
	if (oLastMessage && aLoadedMessages.length < oMessage.threadUids().length)
	{
		oLastMessage.showNextLoadingLink(_.bind(oMessage.increaseThreadCountForLoad, oMessage));
	}
	
	this.addThreadUidsToUidLists(oMessage.uid(), oMessage.threadUids());
	
	return aLoadedMessages;
};

/**
 * @param {Object} oMessage
 */
CFolderModel.prototype.computeThreadData = function (oMessage)
{
	var
		iUnreadCount = 0,
		bPartialFlagged = false,
		aSenders = [],
		aEmails = [],
		sMainEmail = oMessage.oFrom.getFirstEmail()
	;
	
	_.each(oMessage.threadUids(), function (sThreadUid) {
		var
			oInbox = this.bIsUnifiedInbox ? this.getUnifiedInbox(oMessage.accountId()) : null,
			oThreadMessage = oInbox ? oInbox.getMessageByUid(sThreadUid) : this.getMessageByUid(sThreadUid),
			sThreadEmail = ''
		;
		
		if (oThreadMessage && !oThreadMessage.deleted())
		{
			if (!oThreadMessage.seen())
			{
				iUnreadCount++;
			}
			if (oThreadMessage.flagged())
			{
				bPartialFlagged = true;
			}
			
			sThreadEmail = oThreadMessage.oFrom.getFirstEmail();
			if ((sThreadEmail !== sMainEmail) && (-1 === $.inArray(sThreadEmail, aEmails)))
			{
				aEmails.push(sThreadEmail);
				if (sThreadEmail === AccountList.getEmail())
				{
					aSenders.push(TextUtils.i18n('MAILWEBCLIENT/LABEL_ME_SENDER'));
				}
				else
				{
					aSenders.push(oThreadMessage.oFrom.getFirstDisplay());
				}
			}
		}
	}, this);
	
	oMessage.threadUnreadCount(iUnreadCount);
	oMessage.partialFlagged(bPartialFlagged);
};

/**
 * 
 * @param {string} sUid
 * @param {Array} aThreadUids
 */
CFolderModel.prototype.addThreadUidsToUidLists = function (sUid, aThreadUids)
{
	_.each(this.oUids, function (oUidList) {
		oUidList.addThreadUids(sUid, aThreadUids);
	});
};

/**
 * @param {Array} aUidsForLoad
 */
CFolderModel.prototype.loadThreadMessages = function (aUidsForLoad)
{
	if (aUidsForLoad.length > 0)
	{
		var oParameters = {
			'AccountID': this.iAccountId,
			'Folder': this.fullName(),
			'Uids': aUidsForLoad
		};

		Ajax.send('GetMessagesByUids', oParameters, this.onGetMessagesByUidsResponse, this);
	}
};

/**
 * @param {Array} aMessages
 */
CFolderModel.prototype.getThreadCheckedUidsFromList = function (aMessages)
{
	var aThreadUids = [];
	
	_.each(aMessages, function (oMessage) {
		if (oMessage.threadCount() > 0 && !oMessage.threadOpened())
		{
			_.each(oMessage.threadUids(), function (sUid) {
				var
					oInbox = this.bIsUnifiedInbox ? this.getUnifiedInbox(oMessage.accountId()) : null,
					oThreadMessage = oInbox ? oInbox.getMessageByUid(sUid) : this.getMessageByUid(sUid)
				;
				if (oThreadMessage && !oThreadMessage.deleted() && oThreadMessage.checked())
				{
					aThreadUids.push(this.bIsUnifiedInbox ? oThreadMessage.unifiedUid() : oThreadMessage.uid());
				}
			}, this);
		}
	}, this);
	
	return aThreadUids;
};

/**
 * @param {Object} oRawMessage
 * @param {boolean} bThreadPart
 * @param {boolean} bTrustThreadInfo
 */
CFolderModel.prototype.parseAndCacheMessage = function (oRawMessage, bThreadPart, bTrustThreadInfo)
{
	var
		sUid = oRawMessage.Uid.toString(),
		bNewMessage = false,
		oMessage = this.getMessageByUid(sUid)
	;

	if (!oMessage)
	{
		bNewMessage = true;
		oMessage = new CMessageModel();
	}
	
	oMessage.parse(oRawMessage, this.iAccountId, bThreadPart, bTrustThreadInfo);
	if (this.type() === Enums.FolderTypes.Inbox && bNewMessage && oMessage.flagged())
	{
		this.requireMailCache();
		MailCache.increaseStarredCount();
	}
	
	MessagesDictionary.set([oMessage.accountId(), oMessage.folder(), sUid], oMessage);
	if (bNewMessage)
	{
		this.aRequestedUids = _.without(this.aRequestedUids, sUid);
		if (-1 === _.indexOf(this.aMessagesDictionaryUids, sUid))
		{
			this.aMessagesDictionaryUids.push(sUid);
		}
	}
	
	return oMessage;
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CFolderModel.prototype.onGetMessagesByUidsResponse = function (oResponse, oRequest)
{
	var oResult = oResponse.Result;
	
	if (oResult && oResult['@Object'] === 'Collection/MessageCollection')
	{
		_.each(oResult['@Collection'], function (oRawMessage) {
			this.parseAndCacheMessage(oRawMessage, true, true);
		}, this);
		
		this.requireMailCache();
		MailCache.showOpenedThreads(this.fullName());
	}
};

/**
 * Adds uids of requested messages.
 * 
 * @param {Array} aUids
 */
CFolderModel.prototype.addRequestedUids = function (aUids)
{
	this.aRequestedUids = _.union(this.aRequestedUids, aUids);
};

/**
 * @param {string} sUid
 */
CFolderModel.prototype.hasUidBeenRequested = function (sUid)
{
	return _.indexOf(this.aRequestedUids, sUid) !== -1;
};

/**
 * Adds uids of requested thread message headers.
 * 
 * @param {Array} aUids
 */
CFolderModel.prototype.addRequestedThreadUids = function (aUids)
{
	this.aRequestedThreadUids = _.union(this.aRequestedThreadUids, aUids);
};

/**
 * @param {string} sUid
 */
CFolderModel.prototype.hasThreadUidBeenRequested = function (sUid)
{
	return _.indexOf(this.aRequestedThreadUids, sUid) !== -1;
};

/**
 * @param {Object} oParams
 */
CFolderModel.prototype.hasListBeenRequested = function (oParams)
{
	var
		aFoundParams = _.where(this.requestedLists, oParams),
		bHasParams = aFoundParams.length > 0
	;
	
	if (!bHasParams)
	{
		this.requestedLists.push(oParams);
	}
	return bHasParams;
};

/**
 * @param {string} sUid
 * @param {string} sReplyType
 */
CFolderModel.prototype.markMessageReplied = function (sUid, sReplyType)
{
	var
		oMessage = this.getMessageByUid(sUid),
		oFolder = oMessage ? MailCache.getFolderByFullName(oMessage.accountId(), oMessage.folder()) : null;
	;
	
	if (oMessage)
	{
		switch (sReplyType)
		{
			case Enums.ReplyType.Reply:
			case Enums.ReplyType.ReplyAll:
				oMessage.answered(true);
				if (Settings.MarkMessageSeenWhenAnswerForward && oFolder && !oMessage.seen())
				{
					MailCache.executeGroupOperationForFolder('SetMessagesSeen', oFolder, [MailCache.getMessageUid(oMessage)], 'seen', true);
				}
				break;
			case Enums.ReplyType.Forward:
			case Enums.ReplyType.ForwardAsAttach:
				oMessage.forwarded(true);
				if (Settings.MarkMessageSeenWhenAnswerForward && oFolder && !oMessage.seen())
				{
					MailCache.executeGroupOperationForFolder('SetMessagesSeen', oFolder, [MailCache.getMessageUid(oMessage)], 'seen', true);
				}
				break;
		}
	}
};

CFolderModel.prototype.removeAllMessages = function ()
{
	var
		oUidListsToRemove = this.oUids,
		aMessagesUidsToRemove = this.aMessagesDictionaryUids,
		oUidList = null
	;
	
	this.aMessagesDictionaryUids = [];
	this.aRequestedUids = [];
	this.aRequestedThreadUids = [];
	this.requestedLists = [];
	this.oUids = {};

	this.messageCount(0);
	this.unseenMessageCount(0);
	this.iRealUnseenMessageCount = 0;
	
	oUidList = this.getUidList('', '', Settings.MessagesSortBy.DefaultSortBy, Settings.MessagesSortBy.DefaultSortOrder);
	oUidList.resultCount(0);
	
	if (MailCache.currentMessage() && MailCache.currentMessage().accountId() === this.iAccountId 
			&& MailCache.currentMessage().folder() === this.fullName())
	{
		Utils.log('removeAllMessages, the current message is in the list to remove', MailCache.currentMessage() ? {'accountId': MailCache.currentMessage().accountId(),'folder': MailCache.currentMessage().folder(),'uid': MailCache.currentMessage().uid()} : null);
		aMessagesUidsToRemove = _.without(aMessagesUidsToRemove, MailCache.currentMessage().uid());
	}
	_.each(aMessagesUidsToRemove, function (sUid) {
		this.removeMessageFromDict(sUid);
	}, this);
	aMessagesUidsToRemove = null;

	_.each(oUidListsToRemove, function (oUidList) {
		// clear the UID list because it is outdated
		// Do not remove it from the cache to prevent the creation of a new oUidList object
		// because the old oUidList object will remain in the browser's memory
		oUidList.clearData();
	});
	oUidListsToRemove = null;
};

CFolderModel.prototype.removeAllMessageListsFromCacheIfHasChanges = function ()
{
	if (this.hasChanges())
	{
		this.oUids = {};
		this.requestedLists = [];
		this.aRequestedThreadUids = [];
		this.hasChanges(false);
	}
};

CFolderModel.prototype.removeFlaggedMessageListsFromCache = function ()
{
	_.each(this.oUids, function (oUidList) {
		if (oUidList.filters() === Enums.FolderFilter.Flagged)
		{
			// clear the UID list because it is outdated
			// Do not remove it from the cache to prevent the creation of a new oUidList object
			// because the old oUidList object will remain in the browser's memory
			oUidList.clearData();
		}
	}, this);
};

CFolderModel.prototype.removeUnseenMessageListsFromCache = function ()
{
	_.each(this.oUids, function (oUidList) {
		if (oUidList.filters() === Enums.FolderFilter.Unseen)
		{
			// clear the UID list because it is outdated
			// Do not remove it from the cache to prevent the creation of a new oUidList object
			// because the old oUidList object will remain in the browser's memory
			oUidList.clearData();
		}
	}, this);
};

/**
 * @param {string} sUidNext
 * @param {string} sHash
 * @param {number} iMsgCount
 * @param {number} iMsgUnseenCount
 * @param {boolean} bNotApplyInfoToUI
 */
CFolderModel.prototype.setRelevantInformation = function (sUidNext, sHash, iMsgCount, iMsgUnseenCount, bNotApplyInfoToUI)
{
	var bHasChanges = this.hasExtendedInfo() && (this.sHash !== sHash
			|| this.iRealUnseenMessageCount !== iMsgUnseenCount
			|| this.unseenMessageCount() !== iMsgUnseenCount);
	
	// If different, either new messages appeared or some messages were deleted
	this.sHash = sHash;
	this.iRealUnseenMessageCount = iMsgUnseenCount;
	
	// New info of the folder shouldn't be applied to UI for current message list before the list is received from the server.
	if (!this.hasExtendedInfo() || !bNotApplyInfoToUI)
	{
		// If sUidNext is always updated, some of desktop notifications are shown twice
		this.sUidNext = sUidNext;
		
		// If messages counts are always updated, new message appears in the list with significant delay
		this.messageCount(iMsgCount);
		this.unseenMessageCount(iMsgUnseenCount);
		
		// Fix for folder count summing
		if (iMsgUnseenCount === 0)
		{
			this.unseenMessageCount.valueHasMutated();
		}
	}
	
	this.hasExtendedInfo(true);

	if (bHasChanges)
	{
		this.markHasChanges();
	}
	
	// Date and time of last updating of the folder information.
	this.oRelevantInformationLastMoment = moment();
	
	return bHasChanges;
};

CFolderModel.prototype.increaseCountIfHasNotInfo = function ()
{
	if (!this.hasExtendedInfo())
	{
		this.messageCount(this.messageCount() + 1);
	}
};

CFolderModel.prototype.markHasChanges = function ()
{
	this.hasChanges(true);
};

/**
 * @param {number} iDiff
 * @param {number} iUnseenDiff
 */
CFolderModel.prototype.addMessagesCountsDiff = function (iDiff, iUnseenDiff)
{
	var
		iCount = this.messageCount() + iDiff,
		iUnseenCount = this.unseenMessageCount() + iUnseenDiff
	;

	if (iCount < 0)
	{
		iCount = 0;
	}
	this.messageCount(iCount);

	if (iUnseenCount < 0)
	{
		iUnseenCount = 0;
	}
	if (iUnseenCount > iCount)
	{
		iUnseenCount = iCount;
	}
	this.unseenMessageCount(iUnseenCount);
};

/**
 * @param {Array} aUids
 */
CFolderModel.prototype.markDeletedByUids = function (aUids)
{
	var
		iMinusDiff = 0,
		iUnseenMinusDiff = 0
	;

	_.each(aUids, function (sUid) {
		var oMessage = this.getMessageByUid(sUid);

		if (oMessage)
		{
			iMinusDiff++;
			if (!oMessage.seen())
			{
				iUnseenMinusDiff++;
			}
			oMessage.deleted(true);
		}

	}, this);

	this.addMessagesCountsDiff(-iMinusDiff, -iUnseenMinusDiff);
	
	MailCache.setUnifiedInboxUnseenChanges(this.iAccountId, this.fullName(), -iMinusDiff, -iUnseenMinusDiff);
	return {MinusDiff: iMinusDiff, UnseenMinusDiff: iUnseenMinusDiff};
};

/**
 * @param {Array} aUids
 */
CFolderModel.prototype.revertDeleted = function (aUids)
{
	var
		iPlusDiff = 0,
		iUnseenPlusDiff = 0
	;

	_.each(aUids, function (sUid) {
		var oMessage = this.getMessageByUid(sUid);

		if (oMessage && oMessage.deleted())
		{
			iPlusDiff++;
			if (!oMessage.seen())
			{
				iUnseenPlusDiff++;
			}
			oMessage.deleted(false);
		}

	}, this);

	this.addMessagesCountsDiff(iPlusDiff, iUnseenPlusDiff);

	return {PlusDiff: iPlusDiff, UnseenPlusDiff: iUnseenPlusDiff};
};

/**
 * @param {Array} aUids
 */
CFolderModel.prototype.commitDeleted = function (aUids)
{
	_.each(aUids, _.bind(function (sUid) {
		var bCurrentMessageIsBeingDeleted = MailCache.currentMessage() && MailCache.currentMessage().accountId() === this.iAccountId 
				&& MailCache.currentMessage().folder() === this.fullName()
				&& MailCache.currentMessage().uid() === sUid;
		if (bCurrentMessageIsBeingDeleted)
		{
			Utils.log('commitDeleted, the current message is to remove', MailCache.currentMessage() ? {'accountId': MailCache.currentMessage().accountId(),'folder': MailCache.currentMessage().folder(),'uid': MailCache.currentMessage().uid()} : null);
		}
		else
		{
			this.removeMessageFromDict(sUid);
		}
		this.aMessagesDictionaryUids = _.without(this.aMessagesDictionaryUids, sUid);
		this.aRequestedUids = _.without(this.aRequestedUids, sUid);
		this.aRequestedThreadUids = _.without(this.aRequestedThreadUids, sUid);
	}, this));
	
	_.each(this.oUids, function (oUidList) {
		oUidList.deleteUids(aUids);
	});
};

/**
 * @param {string} sSearch
 * @param {string} sFilters
 * @param {string} sSortBy
 * @param {number} iSortOrder
 */
CFolderModel.prototype.getUidList = function (sSearch, sFilters, sSortBy, iSortOrder)
{
	var
		sIndex = JSON.stringify([sSearch, sFilters, sSortBy, iSortOrder]),
		oUidList = null
	;
	
	if (this.oUids[sIndex] === undefined)
	{
		oUidList = new CUidListModel();
		oUidList.iAccountId = this.iAccountId;
		oUidList.sFullName = this.fullName();
		oUidList.search(sSearch);
		oUidList.filters(sFilters);
		oUidList.sortBy(sSortBy);
		oUidList.sortOrder(iSortOrder);
		this.oUids[sIndex] = oUidList;
	}
	
	return this.oUids[sIndex];
};

/**
 * @param {number} iLevel
 * @param {string} sFullName
 */
CFolderModel.prototype.initStarredFolder = function (iLevel, sFullName)
{
	this.bVirtual = true;
	this.setDisplayedLevel(iLevel);
	this.fullName(sFullName);
	this.name(TextUtils.i18n('MAILWEBCLIENT/LABEL_FOLDER_STARRED'));
	this.type(Enums.FolderTypes.Starred);
	this.initSubscriptions('');
	this.initComputedFields(true);
};

/**
 * @param {Object} oData
 * @param {string} sParentFullName
 * @param {string} sNamespaceFolder
 */
CFolderModel.prototype.parse = function (oData, sParentFullName, sNamespaceFolder)
{
	var
		sName = '',
		iType = Enums.FolderTypes.User,
		aFolders = Storage.getData('folderAccordion') || []
	;

	if (oData['@Object'] === 'Object/Folder')
	{
		sName = Types.pString(oData.Name);
		
		this.name(sName);
		this.nameForEdit(sName);
		this.fullName(Types.pString(oData.FullNameRaw));
		this.fullNameHash(Types.pString(oData.FullNameHash));
		this.parentFullName(Types.pString(sParentFullName));
		this.sDelimiter = oData.Delimiter;
		
		iType = Types.pInt(oData.Type);
		if (!Settings.AllowTemplateFolders && iType === Enums.FolderTypes.Template)
		{
			iType = Enums.FolderTypes.User;
		}
		if (Settings.AllowSpamFolder || iType !== Enums.FolderTypes.Spam)
		{
			this.type(iType);
		}
		this.isTemplateStorage(this.type() === Enums.FolderTypes.Template);
		this.bNamespace = (sNamespaceFolder === this.fullName());
		this.isAlwaysRefresh(Settings.AllowAlwaysRefreshFolders && !!oData.AlwaysRefresh);
		
		this.subscribed(Settings.IgnoreImapSubscription ? true : oData.IsSubscribed);
		this.bSelectable = oData.IsSelectable;
		this.bExists = oData.Exists;
		
		if (oData.Extended)
		{
			this.setRelevantInformation(oData.Extended.UidNext.toString(), oData.Extended.Hash, 
				oData.Extended.MessageCount, oData.Extended.MessageUnseenCount, false);
		}

		if (_.find(aFolders, function (sFolder) { return sFolder === this.name(); }, this))
		{
			this.expanded(true);
		}

		this.initSubscriptions(sParentFullName);
		this.initComputedFields();
	
		App.broadcastEvent('MailWebclient::ParseFolder::after', this);
		
		return oData.SubFolders;
	}

	return null;
};

/**
 * @param {string} sParentFullName
 */
CFolderModel.prototype.initSubscriptions = function (sParentFullName)
{
	if (!this.bSubscribtionsInitialized)
	{
		this.requireMailCache();
		this.unseenMessageCount.subscribe(function () {
			_.delay(_.bind(function () {
				MailCache.countMessages(this);
			},this), 1000);
		}, this);

		this.subscribed.subscribe(function () {
			if (sParentFullName)
			{
				var oParentFolder = MailCache.folderList().getFolderByFullName(sParentFullName);
				if(oParentFolder)
				{
					MailCache.countMessages(oParentFolder);
				}
			}
		}, this);

		this.edited.subscribe(function (bEdited) {
			if (bEdited === false)
			{
				this.nameForEdit(this.name());
			}
		}, this);

		this.hasChanges.subscribe(function () {
			this.requestedLists = [];
		}, this);

		this.bSubscribtionsInitialized = true;
	}
};

CFolderModel.prototype.initComputedFields = function ()
{
	this.routingHash = ko.computed(function () {
		// At the moment the application supports only one type of virtual folders - for starred messages.
		if (this.bVirtual)
		{
			return Routing.buildHashFromArray(LinksUtils.getMailbox(this.fullName(), 1, '', '', Enums.FolderFilter.Flagged));
		}
		else
		{
			return Routing.buildHashFromArray(LinksUtils.getMailbox(this.fullName()));
		}
	}, this);
	
	this.isSystem = ko.computed(function () {
		return this.type() !== Enums.FolderTypes.User;
	}, this);

	this.withoutThreads = ko.computed(function () {
		return	this.type() === Enums.FolderTypes.Drafts || 
				this.type() === Enums.FolderTypes.Spam ||
				this.type() === Enums.FolderTypes.Trash;
	}, this);

	this.enableEmptyFolder = ko.computed(function () {
		return (this.type() === Enums.FolderTypes.Spam ||
				this.type() === Enums.FolderTypes.Trash) &&
				this.messageCount() > 0;
	}, this);

	this.virtualEmpty = ko.computed(function () {
		return this.bVirtual && this.messageCount() === 0;
	}, this);
	
	// indicates if folder has at least one subscribed subfolder
	this.hasSubscribedSubfolders = ko.computed(function () {
		return _.any(this.subfolders(), function (oFolder) {
			return oFolder.subscribed();
		});
	}, this);

	// indicates if folder can be expanded, i.e. folder is not namespace and has at least one subscribed subfolder
	this.canExpand = ko.computed(function () {
		return !this.bNamespace && this.hasSubscribedSubfolders();
	}, this);
	
	this.unseenMessagesCountToShow = ko.computed(function () {
		return (!App.isMobile() && this.canExpand()) ? this.unseenMessageCount() + this.subfoldersMessagesCount() : this.unseenMessageCount();
	}, this);

	this.showTotalInsteadUnseenCount = ko.observable(false);

	this.showUnseenMessagesCount = ko.computed(function () {
		return this.unseenMessagesCountToShow() > 0 && this.type() !== Enums.FolderTypes.Drafts && !this.showTotalInsteadUnseenCount();
	}, this);
	
	this.showMessagesCount = ko.computed(function () {
		return this.messageCount() > 0 && (this.type() === Enums.FolderTypes.Drafts || this.showTotalInsteadUnseenCount() || Settings.AllowShowMessagesCountInFolderList && Settings.showMessagesCountInFolderList());
	}, this);
	
	this.visible = ko.computed(function () {
		return this.subscribed() || this.isSystem() || this.hasSubscribedSubfolders();
	}, this);

	this.canBeSelected = ko.computed(function () {
		return this.bExists && this.bSelectable && this.subscribed();
	}, this);
	
	this.canSubscribe = ko.computed(function () {
		return !Settings.IgnoreImapSubscription && !this.isSystem() && this.bExists && this.bSelectable;
	}, this);
	
	this.canDelete = ko.computed(function () {
		return (!this.isSystem() && this.hasExtendedInfo() && this.messageCount() === 0 && this.subfolders().length === 0);
	}, this);

	this.canRename = this.canSubscribe;

	this.visibleTemplateTrigger = ko.computed(function () {
		return Settings.AllowTemplateFolders && (this.bSelectable && !this.isSystem() || this.isTemplateStorage());
	}, this);

	this.templateButtonHint = ko.computed(function () {
		if (this.visibleTemplateTrigger())
		{
			return this.isTemplateStorage() ? TextUtils.i18n('MAILWEBCLIENT/ACTION_TURN_TEMPLATE_FOLDER_OFF') : TextUtils.i18n('MAILWEBCLIENT/ACTION_TURN_TEMPLATE_FOLDER_ON');
		}
		return '';
	}, this);
	
	this.alwaysRefreshButtonHint = ko.computed(function () {
		if (Settings.AllowAlwaysRefreshFolders)
		{
			return this.isAlwaysRefresh() ? TextUtils.i18n('MAILWEBCLIENT/ACTION_TURN_ALWAYS_REFRESH_OFF') : TextUtils.i18n('MAILWEBCLIENT/ACTION_TURN_ALWAYS_REFRESH_ON');
		}
		return '';
	}, this);
	
	this.subscribeButtonHint = ko.computed(function () {
		if (this.canSubscribe())
		{
			return this.subscribed() ? TextUtils.i18n('MAILWEBCLIENT/ACTION_HIDE_FOLDER') : TextUtils.i18n('MAILWEBCLIENT/ACTION_SHOW_FOLDER');
		}
		return '';
	}, this);
	
	this.deleteButtonHint = ko.computed(function () {
		return this.canDelete() ? TextUtils.i18n('MAILWEBCLIENT/ACTION_DELETE_FOLDER') : '';
	}, this);
	
	this.usedAs = ko.computed(function () {
		switch (this.type())
		{
			case Enums.FolderTypes.Inbox:
				return TextUtils.i18n('MAILWEBCLIENT/LABEL_USED_AS_INBOX');
			case Enums.FolderTypes.Sent:
				return TextUtils.i18n('MAILWEBCLIENT/LABEL_USED_AS_SENT');
			case Enums.FolderTypes.Drafts:
				return TextUtils.i18n('MAILWEBCLIENT/LABEL_USED_AS_DRAFTS');
			case Enums.FolderTypes.Trash:
				return TextUtils.i18n('MAILWEBCLIENT/LABEL_USED_AS_TRASH');
			case Enums.FolderTypes.Spam:
				return TextUtils.i18n('MAILWEBCLIENT/LABEL_USED_AS_SPAM');
		}
		return '';
	}, this);

	this.displayName = ko.computed(function () {
		if (this.bIsUnifiedInbox)
		{
			return TextUtils.i18n('MAILWEBCLIENT/LABEL_FOLDER_ALL_INBOXES');
		}
		switch (this.type())
		{
			case Enums.FolderTypes.Inbox:
				return TextUtils.i18n('MAILWEBCLIENT/LABEL_FOLDER_INBOX');
			case Enums.FolderTypes.Sent:
				return TextUtils.i18n('MAILWEBCLIENT/LABEL_FOLDER_SENT');
			case Enums.FolderTypes.Drafts:
				return TextUtils.i18n('MAILWEBCLIENT/LABEL_FOLDER_DRAFTS');
			case Enums.FolderTypes.Trash:
				return TextUtils.i18n('MAILWEBCLIENT/LABEL_FOLDER_TRASH');
			case Enums.FolderTypes.Spam:
				return TextUtils.i18n('MAILWEBCLIENT/LABEL_FOLDER_SPAM');
		}
		return this.name();
	}, this);

	this.setDisableMoveTo(false);
	this.setDisableMoveFrom(false);
};

CFolderModel.prototype.setShowTotalInsteadUnseenCount = function (bShowTotalInsteadUnseenCount)
{
	this.showTotalInsteadUnseenCount(bShowTotalInsteadUnseenCount);
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CFolderModel.prototype.onGetMessageResponse = function (oResponse, oRequest)
{
	var
		oResult = oResponse.Result,
		oParameters = oRequest.Parameters,
		oHand = null,
		sUid = oResult ? oResult.Uid.toString() : oParameters.Uid.toString(),
		oMessage = this.getMessageByUid(sUid),
		bSelected = oMessage ? oMessage.selected() : false,
		bPassResponse = false
	;
	
	if (!oResult)
	{
		if (bSelected)
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_UNKNOWN'));
		}
		Routing.replaceHashWithoutMessageUid(oMessage.uid());
		Routing.replaceHashWithoutMessageUid(oMessage.unifiedUid());
		if (oMessage && !oMessage.deleted())
		{
			this.removeMessageFromDict(sUid);
		}
		
		oMessage = null;
		bPassResponse = true;
	}
	else
	{
		oMessage = this.parseAndCacheMessage(oResult, false, false);
	}

	oHand = this.aResponseHandlers[sUid];
	if (oHand)
	{
		oHand.handler.call(oHand.context, oMessage, sUid, bPassResponse ? oResponse : null);
		delete this.aResponseHandlers[sUid];
	}
};

/**
 * @param {string} sUid
 * @param {Function} fResponseHandler
 * @param {Object} oContext
 */
CFolderModel.prototype.getCompletelyFilledMessage = function (sUid, fResponseHandler, oContext, bForceAjaxRequest)
{
	var
		oMessage = this.getMessageByUid(sUid),
		oParameters = {
			'AccountID': oMessage ? oMessage.accountId() : 0,
			'Folder': this.fullName(),
			'Uid': sUid,
			'MessageBodyTruncationThreshold': Settings.MessageBodyTruncationThreshold
		}
	;

	if (sUid.length > 0)
	{
		if (!oMessage || !oMessage.completelyFilled() || oMessage.truncated() || bForceAjaxRequest)
		{
			if (fResponseHandler && oContext)
			{
				this.aResponseHandlers[sUid] = {handler: fResponseHandler, context: oContext};
			}
			
			Ajax.send('GetMessage', oParameters, this.onGetMessageResponse, this);
		}
		else if (fResponseHandler && oContext)
		{
			fResponseHandler.call(oContext, oMessage, sUid);
		}
	}
};

/**
 * @param {string} sUid
 */
CFolderModel.prototype.showExternalPictures = function (sUid)
{
	var oMessage = this.getMessageByUid(sUid);

	if (oMessage !== undefined)
	{
		oMessage.showExternalPictures();
	}
};

/**
 * @param {string} sEmail
 */
CFolderModel.prototype.alwaysShowExternalPicturesForSender = function (sEmail)
{
	this.doForAllMessages(function (oMessage) {
		var aFrom = oMessage.oFrom.aCollection;
		if (aFrom.length > 0 && aFrom[0].sEmail === sEmail)
		{
			oMessage.alwaysShowExternalPicturesForSender();
		}
	});
};

/**
 * @param {string} sField
 * @param {Array} aUids
 * @param {boolean} bSetAction
 */
CFolderModel.prototype.executeGroupOperation = function (sField, aUids, bSetAction)
{
	var iUnseenDiff = 0;

	this.doForAllMessages(function (oMessage) {
		if (aUids.length > 0)
		{
			_.each(aUids, function (sUid) {
				if (oMessage.uid() === sUid && oMessage[sField]() !== bSetAction)
				{
					oMessage[sField](bSetAction);
					iUnseenDiff++;
				}
			});
		}
		else
		{
			oMessage[sField](bSetAction);
		}
	});

	if (aUids.length === 0)
	{
		iUnseenDiff = (bSetAction) ? this.unseenMessageCount() : this.messageCount() - this.unseenMessageCount();
	}

	if (sField === 'seen' && iUnseenDiff > 0)
	{
		if (bSetAction)
		{
			this.addMessagesCountsDiff(0, -iUnseenDiff);
			MailCache.setUnifiedInboxUnseenChanges(this.iAccountId, this.fullName(), 0, -iUnseenDiff);
		}
		else
		{
			this.addMessagesCountsDiff(0, iUnseenDiff);
			MailCache.setUnifiedInboxUnseenChanges(this.iAccountId, this.fullName(), 0, iUnseenDiff);
		}
		this.markHasChanges();
		
		this.requireMailCache();
	}
};

CFolderModel.prototype.emptyFolder = function ()
{
	var
		sWarning = TextUtils.i18n('MAILWEBCLIENT/CONFIRM_EMPTY_FOLDER'),
		fCallBack = _.bind(this.clearFolder, this)
	;
	
	if (this.enableEmptyFolder())
	{
		Popups.showPopup(ConfirmPopup, [sWarning, fCallBack]);
	}
};

/**
 * @param {boolean} bOkAnswer
 */
CFolderModel.prototype.clearFolder = function (bOkAnswer)
{
	if (this.enableEmptyFolder() && bOkAnswer)
	{
		Ajax.send('ClearFolder', { 'Folder': this.fullName() });

		this.requireMailCache();
		MailCache.onClearFolder(this);
		
		// remove all messages from cache should be done after clearing current message in MailCache
		this.removeAllMessages();
	}
};

/**
 * @param {Object} oFolder
 * @param {Object} oEvent
 */
CFolderModel.prototype.onAccordion = function (oFolder, oEvent)
{
	var
		bExpanded = !this.expanded(),
		aFolders = Storage.getData('folderAccordion') || []
	;

	if (bExpanded)
	{
		aFolders.push(this.name());
	}
	else
	{
		// remove current folder from expanded folders
		aFolders = _.reject(aFolders, function (sFolder) { return sFolder === this.name(); }, this);
	}

	Storage.setData('folderAccordion', aFolders);
	this.expanded(bExpanded);

	this.requireMailCache();
	MailCache.countMessages(this);
	
	if (oEvent)
	{
		oEvent.stopPropagation();
	}
};

CFolderModel.prototype.executeUnseenFilter = function ()
{
	var bNotChanged = false;
	
	if (this.unseenMessagesCountToShow() > this.unseenMessageCount())
	{
		this.onAccordion();
	}
	
	if (this.unseenMessageCount() > 0)
	{
		this.requireMailCache();
		MailCache.waitForUnseenMessages(true);
		bNotChanged = Routing.setHash(LinksUtils.getMailbox(this.fullName(), 1, '', '', Enums.FolderFilter.Unseen));

		if (bNotChanged)
		{
			MailCache.changeCurrentMessageList(this.fullName(), 1, '', Enums.FolderFilter.Unseen, Settings.MessagesSortBy.DefaultSortBy, Settings.MessagesSortBy.DefaultSortOrder);
		}
		return false;
	}
	
	return true;
};

CFolderModel.prototype.onDeleteClick = function ()
{
	var
		sWarning = TextUtils.i18n('MAILWEBCLIENT/CONFIRM_DELETE_FOLDER'),
		fCallBack = _.bind(this.deleteAfterConfirm, this)
	;
	
	if (this.canDelete())
	{
		Popups.showPopup(ConfirmPopup, [sWarning, fCallBack]);
	}
	else
	{
		App.broadcastEvent('MailWebclient::AttemptDeleteNonemptyFolder');
	}
};

/**
 * @param {boolean} bOkAnswer
 */
CFolderModel.prototype.deleteAfterConfirm = function (bOkAnswer)
{
	if (bOkAnswer)
	{
		var
			oFolderList = MailCache.editedFolderList(),
			sFolderFullName = this.fullName(),
			fRemoveFolder = function (oFolder) {
				if (sFolderFullName === oFolder.fullName())
				{
					return true;
				}
				oFolder.subfolders.remove(fRemoveFolder);
				return false;
			}
		;

		oFolderList.collection.remove(fRemoveFolder);

		Ajax.send('DeleteFolder', {
			'AccountID': AccountList.editedId(),
			'Folder': this.fullName()
		}, function (oResponse) {
			if (!oResponse.Result)
			{
				Api.showErrorByCode(oResponse, TextUtils.i18n('MAILWEBCLIENT/ERROR_DELETE_FOLDER'));
				MailCache.getFolderList(AccountList.editedId());
			}
		}, this);
	}
};

CFolderModel.prototype.onSubscribeClick = function ()
{
	if (this.canSubscribe())
	{
		var
			oParameters = {
				'AccountID': AccountList.editedId(),
				'Folder': this.fullName(),
				'SetAction': !this.subscribed()
			}
		;

		this.subscribed(!this.subscribed());
		
		Ajax.send('SubscribeFolder', oParameters, function (oResponse) {
			if (!oResponse.Result)
			{
				if (this.subscribed())
				{
					Api.showErrorByCode(oResponse, TextUtils.i18n('MAILWEBCLIENT/ERROR_SUBSCRIBE_FOLDER'));
				}
				else
				{
					Api.showErrorByCode(oResponse, TextUtils.i18n('MAILWEBCLIENT/ERROR_UNSUBSCRIBE_FOLDER'));
				}
				MailCache.getFolderList(AccountList.editedId());
			}
		}, this);
	}
};

CFolderModel.prototype.afterMove = function (aParents)
{
	_.each(aParents, function (oParent) {
		if (_.isFunction(oParent.afterMove))
		{
			oParent.afterMove();
		}
	});
};

CFolderModel.prototype.cancelNameEdit = function ()
{
	this.edited(false);
};

CFolderModel.prototype.applyNameEdit = function ()
{
	if (this.name() !== this.nameForEdit())
	{
		var
			oParameters = {
				'AccountID': AccountList.editedId(),
				'PrevFolderFullNameRaw': this.fullName(),
				'NewFolderNameInUtf8': this.nameForEdit()
			}
		;

		Ajax.send('RenameFolder', oParameters, _.bind(this.onResponseFolderRename, this), this);
		this.name(this.nameForEdit());
	}
	
	this.edited(false);
};

CFolderModel.prototype.onResponseFolderRename = function (oResponse, oRequest)
{
	if (!oResponse || !oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('MAILWEBCLIENT/ERROR_RENAME_FOLDER'));
		MailCache.getFolderList(AccountList.editedId());
	}
	else if (oResponse && oResponse.Result && oResponse.Result.FullName)
	{
		var oFolderList = MailCache.editedFolderList();
		oFolderList.renameFolder(this.fullName(), oResponse.Result.FullName, oResponse.Result.FullNameHash);
	}
};

CFolderModel.prototype.triggerTemplateState = function ()
{
	if (this.visibleTemplateTrigger())
	{
		if (this.isTemplateStorage())
		{
			this.type(Enums.FolderTypes.User);
			this.isTemplateStorage(false);
		}
		else
		{
			this.type(Enums.FolderTypes.Template);
			this.isTemplateStorage(true);
		}
		MailCache.changeTemplateFolder(this.fullName(), this.isTemplateStorage());

		var
			oParameters = {
				'FolderFullName': this.fullName(),
				'SetTemplate': this.isTemplateStorage()
			}
		;

		Ajax.send('SetTemplateFolderType', oParameters, this.onSetTemplateFolderType, this);
	}
};

CFolderModel.prototype.onSetTemplateFolderType = function (oResponse)
{
	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('MAILWEBCLIENT/ERROR_SETUP_SPECIAL_FOLDERS'));
		MailCache.getFolderList(AccountList.editedId());
	}
};

CFolderModel.prototype.triggerAlwaysRefreshState = function ()
{
	if (Settings.AllowAlwaysRefreshFolders)
	{
		this.isAlwaysRefresh(!this.isAlwaysRefresh());

		var
			oParameters = {
				'AccountID': this.iAccountId,
				'FolderFullName': this.fullName(),
				'AlwaysRefresh': this.isAlwaysRefresh()
			}
		;

		Ajax.send('SetAlwaysRefreshFolder', oParameters, this.onSetAlwaysRefreshFolder, this);
	}
};

CFolderModel.prototype.onSetAlwaysRefreshFolder = function (oResponse)
{
	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse);
		MailCache.getFolderList(AccountList.editedId());
	}
};

module.exports = CFolderModel;


/***/ }),

/***/ "sWkr":
/*!*******************************************!*\
  !*** ./modules/MailWebclient/js/CCrea.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
    _ = __webpack_require__(/*! underscore */ "F/us"),
    $ = __webpack_require__(/*! jquery */ "EVdn"),

    Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),

    App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
    Browser = __webpack_require__(/*! modules/CoreWebclient/js/Browser.js */ "HLSX")
;

/**
 * @constructor
 *
 * @param {Object} oOptions
 */
function CCrea(oOptions)
{
    this.oOptions = _.extend({
        'creaId': 'creaId',
        'fontNameArray': ['Tahoma'],
        'defaultFontName': 'Tahoma',
        'defaultFontSize': 3,
		'alwaysTryUseImageWhilePasting': true,
        'dropableArea': null,
        'isRtl': false,
        'onChange': function () {},
        'onCursorMove': function () {},
        'onFocus': function () {},
        'onBlur': function () {},
        'onUrlIn': function () {},
        'onUrlOut': function () {},
        'onImageSelect': function () {},
        'onImageBlur': function () {},
        'onItemOver':  null,
        'onItemOut':  null,
        'openInsertLinkDialog':  function () {},
        'onUrlClicked': false
    }, (typeof oOptions === 'undefined') ? {} : oOptions);
}

/**
 * @type {Object}
 */
CCrea.prototype.oOptions = {};

/**
 * @type {Object}
 */
CCrea.prototype.$container = null;

/**
 * @type {Object}
 */
CCrea.prototype.$editableArea = null;

CCrea.prototype.aEditableAreaHtml = [];

CCrea.prototype.iUndoRedoPosition = 0;

CCrea.prototype.bEditable = false;

CCrea.prototype.bFocused = false;

CCrea.prototype.bEditing = false;

/**
 * @type {Array}
 */
CCrea.prototype.aSizes = [
    {inNumber: 1, inPixels: 10},
    {inNumber: 2, inPixels: 13},
    {inNumber: 3, inPixels: 16},
    {inNumber: 4, inPixels: 18},
    {inNumber: 5, inPixels: 24},
    {inNumber: 6, inPixels: 32},
    {inNumber: 7, inPixels: 48}
];

CCrea.prototype.bInUrl = false;

CCrea.prototype.oCurrLink = null;

CCrea.prototype.oCurrImage = null;

CCrea.prototype.bInImage = false;

CCrea.prototype.sBasicFontName = '';
CCrea.prototype.sBasicFontSize = '';
CCrea.prototype.sBasicDirection = '';

/**
 * Creates editable area.
 *
 * @param {boolean} bEditable
 */
CCrea.prototype.start = function (bEditable)
{
    function isValidURL(sUrl)
    {
        var oRegExp = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;

        return oRegExp.test(sUrl);
    }

    function isCorrectEmail(sValue)
    {
        return !!(sValue.match(/^[A-Z0-9\"!#\$%\^\{\}`~&'\+\-=_\.]+@[A-Z0-9\.\-]+$/i));
    }

	this.aRanges = null; // if this.aRanges is not null first focus doesn't work properly, then insert image doesn't work
    this.$container = $('#' + this.oOptions.creaId);
    this.$editableArea = $('<div></div>').addClass('crea-content-editable')
        .prop('contentEditable', 'true').appendTo(this.$container);

    var self = this;

    this.$editableArea.on('focus', function () {
        self.bFocused = true;
    });
    this.$editableArea.on('blur', function () {
        self.bFocused = false;
        //self.editableSave(); //Undo/Redo fix
    });

    this.$editableArea.on('click', 'img', function (ev) {
        var oImage = $(this);
        self.bInImage = true;
        self.oCurrImage = oImage;
        self.oOptions.onImageSelect(oImage, ev);
        ev.stopPropagation();
    });
    this.$editableArea.on('click', function (ev) {
        self.bInImage = false;
        self.oCurrImage = null;
        self.oOptions.onImageBlur();
    });

    if (self.oOptions.onItemOver !== null)
    {
        this.$editableArea.on('mouseover', function (ev) {
            self.oOptions.onItemOver(ev);
        });
    }
    if (self.oOptions.onItemOver !== null)
    {
        this.$editableArea.on('mouseout', function (ev) {
            self.oOptions.onItemOut(ev);
        });
    }

    this.$editableArea.on('cut paste', function () {
        self.bEditing = true;
        self.editableSave();
        _.defer(function () {
            self.editableSave();
        });
    });
    this.$editableArea.on('paste', function (oEvent) {
        oEvent = oEvent.originalEvent || oEvent;

        if (oEvent.clipboardData)
        {
            var
                sText = oEvent.clipboardData.getData('text/plain'),
                sHtml = oEvent.clipboardData.getData('text/html'),
                aHtml
            ;

            if (self.oOptions.alwaysTryUseImageWhilePasting && self.pasteImage(oEvent))
            {
                oEvent.preventDefault();
            }
            else
            {
                if (isValidURL(sText))
                {
                    oEvent.preventDefault();
                    self.execCom('insertHTML', '<a href="' + sText + '">' + sText + '</a>');
                }
                else if (isCorrectEmail(sText))
                {
                    oEvent.preventDefault();
                    self.execCom('insertHTML', '<a href="mailto:' + sText + '">' + sText + '</a>');
                }
                else if (sHtml !== '')
                {
                    oEvent.preventDefault();

                    aHtml = sHtml.split(/<!--StartFragment-->|<!--EndFragment-->/gi);
                    if (aHtml.length === 3)
                    {
                        sHtml = aHtml[1];
                    }

                    self.execCom('insertHTML', sHtml);
                }
            }
        }
    });
    this.$editableArea.on('keydown', function(oEvent) {
        var
            iKey = oEvent.keyCode || oEvent.which || oEvent.charCode || 0,
            bCtrlKey = oEvent.ctrlKey || oEvent.metaKey,
            bAltKey =  oEvent.altKey,
            bShiftKey = oEvent.shiftKey,
            sLink = ''
        ;

        self.bEditing = true;

        if((bShiftKey && bCtrlKey && iKey === Enums.Key.z) || (bCtrlKey && iKey === Enums.Key.y))
        {
            oEvent.preventDefault();

            self.editableRedo();
        }
        else if(bCtrlKey && !bAltKey && iKey === Enums.Key.z)
        {
            oEvent.preventDefault();

            self.editableUndo();
        }
        else if (bCtrlKey && (iKey === Enums.Key.k || iKey === Enums.Key.b || iKey === Enums.Key.i || iKey === Enums.Key.u))
        {
            oEvent.preventDefault();
            switch (iKey)
            {
                case Enums.Key.k:
                    sLink = self.getSelectedText();
                    if (isValidURL(sLink))
                    {
                        self.insertLink(sLink);
                    }
                    else if (isCorrectEmail(sLink))
                    {
                        self.insertLink('mailto:' + sLink);
                    }
                    else
                    {
                        self.oOptions.openInsertLinkDialog();
                    }
                    break;
                case Enums.Key.b:
                    self.bold();
                    break;
                case Enums.Key.i:
                    self.italic();
                    break;
                case Enums.Key.u:
                    self.underline();
                    break;
            }
        }
        else if (!bAltKey && !bShiftKey && !bCtrlKey)
        {
            if (iKey === Enums.Key.Del || iKey === Enums.Key.Backspace)
            {
                self.editableSave();
            }
        }
    });
    this.$editableArea.on('keyup', function(oEvent) {
        var
            iKey = oEvent.keyCode || oEvent.which || oEvent.charCode || 0,
            bCtrlKey = oEvent.ctrlKey || oEvent.metaKey,
            bAltKey =  oEvent.altKey,
            bShiftKey = oEvent.shiftKey
        ;
        if (!bAltKey && !bShiftKey && !bCtrlKey)
        {
            if (iKey === Enums.Key.Space || iKey === Enums.Key.Enter || iKey === Enums.Key.Del || iKey === Enums.Key.Backspace)
            {
                self.editableSave();
            }
            else
            {
                self.oOptions.onChange();
            }
        }
    });

    this.initContentEditable();
    this.setEditable(bEditable);
	
	App.broadcastEvent('MailWebclient::StartCrea::after', {'EditableArea': this.$editableArea, 'InsertHtmlHandler': this.insertHtml.bind(this)});
};

CCrea.prototype.clearUndoRedo = function ()
{
    this.aEditableAreaHtml = [];
    this.iUndoRedoPosition = 0;
    this.bEditing = false;
};

CCrea.prototype.isUndoAvailable = function ()
{
    return this.iUndoRedoPosition > 0;
};

CCrea.prototype.clearRedo = function ()
{
    this.aEditableAreaHtml = this.aEditableAreaHtml.slice(0, this.iUndoRedoPosition + 1);
};

CCrea.prototype.editableSave = function ()
{
    var
        sEditableHtml = this.$editableArea.html(),
        oLastSaved = _.last(this.aEditableAreaHtml),
        sLastSaved = oLastSaved ? oLastSaved[0] : ''
    ;

    if (sEditableHtml !== sLastSaved)
    {
        this.clearRedo();
        this.aEditableAreaHtml.push([sEditableHtml, this.getCaretPos(this.$editableArea[0])]);
        this.iUndoRedoPosition = this.aEditableAreaHtml.length - 1;
        this.oOptions.onChange();
    }
};

CCrea.prototype.editableUndo = function ()
{
    var
        sEditableHtml = this.$editableArea.html(),
        oCurrSaved = this.aEditableAreaHtml[this.iUndoRedoPosition],
        sCurrSaved = oCurrSaved ? oCurrSaved[0] : ''
    ;
    if (sEditableHtml !== sCurrSaved)
    {
        this.editableSave();
    }

    if (this.iUndoRedoPosition > 0)
    {
        this.iUndoRedoPosition--;
        this.$editableArea.html(this.aEditableAreaHtml[this.iUndoRedoPosition]);
        this.setCaretPos(this.$editableArea[0], this.aEditableAreaHtml[this.iUndoRedoPosition][1]);
    }
};

CCrea.prototype.editableRedo = function ()
{
    if (this.iUndoRedoPosition < (this.aEditableAreaHtml.length - 1))
    {
        this.iUndoRedoPosition++;
        this.$editableArea.html(this.aEditableAreaHtml[this.iUndoRedoPosition]);
        this.setCaretPos(this.$editableArea[0], this.aEditableAreaHtml[this.iUndoRedoPosition] ? this.aEditableAreaHtml[this.iUndoRedoPosition][1] : {});
    }
};

CCrea.prototype.getCaretPos = function (oContainerEl)
{
    var
        oSel = null,
        oRange = {},
        oPreSelectionRange = {},
        iStart = 0,
        oCaretPos = {}
    ;

    if (window.getSelection && document.createRange)
    {
        oSel = window.getSelection();
        if (oSel.rangeCount > 0)
        {
            oRange = oSel.getRangeAt(0);
            oPreSelectionRange = oRange.cloneRange();
            oPreSelectionRange.selectNodeContents(oContainerEl);
            oPreSelectionRange.setEnd(oRange.startContainer, oRange.startOffset);
            iStart = oPreSelectionRange.toString().length;
            oCaretPos = {
                start: iStart,
                end: iStart + oRange.toString().length
            };
        }
    }
    else if (document.selection && document.body.createTextRange)
    {
        oRange = document.selection.createRange();
        oPreSelectionRange = document.body.createTextRange();
        oPreSelectionRange.moveToElementText(oContainerEl);
        if (typeof(oPreSelectionRange.setEndPoint) === 'function')
        {
            oPreSelectionRange.setEndPoint("EndToStart", oRange);
        }
        iStart = oPreSelectionRange.text.length;
        oCaretPos = {
            start: iStart,
            end: iStart + oRange.text.length
        };
    }

    return oCaretPos;
};

CCrea.prototype.setCaretPos = function(oContainerEl, oSavedSel)
{
    if (window.getSelection && document.createRange)
    {
        var
            oNodeStack = [oContainerEl],
            oNode = {},
            oSel = {},
            bFoundStart = false,
            bStop = false,
            iCharIndex = 0,
            iNextCharIndex = 0,
            iChildNodes = 0,
            oRange = document.createRange()
        ;

        oRange.setStart(oContainerEl, 0);
        oRange.collapse(true);

        oNode = oNodeStack.pop();

        while (!bStop && oNode)
        {
            if (oNode.nodeType === 3)
            {
                iNextCharIndex = iCharIndex + oNode.length;
                if (!bFoundStart && oSavedSel.start >= iCharIndex && oSavedSel.start <= iNextCharIndex)
                {
                    oRange.setStart(oNode, oSavedSel.start - iCharIndex);
                    bFoundStart = true;
                }
                if (bFoundStart && oSavedSel.end >= iCharIndex && oSavedSel.end <= iNextCharIndex)
                {
                    oRange.setEnd(oNode, oSavedSel.end - iCharIndex);
                    bStop = true;
                }
                iCharIndex = iNextCharIndex;
            }
            else
            {
                iChildNodes = oNode.childNodes.length;
                while (iChildNodes--)
                {
                    oNodeStack.push(oNode.childNodes[iChildNodes]);
                }
            }
            oNode = oNodeStack.pop();
        }

        oSel = window.getSelection();
        oSel.removeAllRanges();
        oSel.addRange(oRange);
    }
    else if (document.selection && document.body.createTextRange)
    {
        var oTextRange = document.body.createTextRange();

        oTextRange.moveToElementText(oContainerEl);
        oTextRange.collapse(true);
        oTextRange.moveEnd("character", oSavedSel.end);
        oTextRange.moveStart("character", oSavedSel.start);
        oTextRange.select();
    }
};

/**
 * Sets tab index.
 *
 * @param {string} sTabIndex
 */
CCrea.prototype.setTabIndex = function (sTabIndex)
{
    if (sTabIndex)
    {
        this.$editableArea.attr('tabindex', sTabIndex);
    }
};

/**
 * Initializes properties.
 */
CCrea.prototype.initContentEditable = function ()
{
    this.$editableArea.bind({
        'mousemove': _.bind(this.storeSelectionPosition, this),
        'mouseup': _.bind(this.onCursorMove, this),
        'keydown': _.bind(this.onButtonPressed, this),
        'keyup': _.bind(this.onCursorMove, this),
        'click': _.bind(this.onClickWith, this),
        'focus': this.oOptions.onFocus,
        'blur': this.oOptions.onBlur
    });

    if (window.File && window.FileReader && window.FileList)
    {
        if (this.oOptions.enableDrop) {
            this.$editableArea.bind({
                'dragover': _.bind(this.onDragOver, this),
                'dragleave': _.bind(this.onDragLeave, this),
                'drop': _.bind(this.onFileSelect, this)
            });
        }
    }

    var self = this,
        lazyScroll = _.debounce(function () {
            self.oCurrLink = null;
            self.bInUrl = false;
            self.oOptions.onUrlOut();
        }, 300);
    $('html, body').on('scroll', lazyScroll);
};

/**
 * Starts cursor move handlers.
 * @param {Object} ev
 */
CCrea.prototype.onCursorMove = function (ev)
{
    var iKey = -1;
    if (window.event)
    {
        iKey = window.event.keyCode;
    }
    else if (ev)
    {
        iKey = ev.which;
    }

    if (iKey === 13) // Enter
    {
        this.breakQuotes(ev);
    }

    if (iKey === 17) // Cntr
    {
        this.$editableArea.find('a').css('cursor', 'inherit');
    }

    if (iKey === 8) // BackSpace
    {
        this.uniteWithNextQuote(ev);
    }

    if (iKey === 46 && Browser.chrome) // Delete
    {
        this.uniteWithPrevQuote(ev);
    }


    this.storeSelectionPosition();
    this.oOptions.onCursorMove();
};

/**
 * Starts when clicked.
 * @param {Object} oEvent
 */
CCrea.prototype.onClickWith = function (oEvent)
{
    if(oEvent.ctrlKey) {
        if (oEvent.target.nodeName === 'A'){
            window.open(oEvent.target.href,'_blank');
        }
    }
    this.checkAnchorNode();
};

/**
 * Starts when key pressed.
 * @param {Object} oEvent
 */
CCrea.prototype.onButtonPressed = function (oEvent)
{
    var iKey = -1;
    if (window.event)
    {
        iKey = window.event.keyCode;
    }
    else if (oEvent)
    {
        iKey = oEvent.which;
    }

    if (iKey === 17) // Cntr
    {
        this.$editableArea.find('a').css('cursor', 'pointer');
    }
};

/**
 * Starts cursor move handlers.
 * @param {Object} oEvent
 */
CCrea.prototype.onFileSelect = function (oEvent)
{
    oEvent = (oEvent && oEvent.originalEvent ?
            oEvent.originalEvent : oEvent) || window.event;

    if (oEvent)
    {
        oEvent.stopPropagation();
        oEvent.preventDefault();

        var
            oReader = null,
            oFile = null,
            aFiles = (oEvent.files || (oEvent.dataTransfer ? oEvent.dataTransfer.files : null)),
            self = this
        ;

        if (aFiles && 1 === aFiles.length && this.checkIsImage(aFiles[0]))
        {
            oFile = aFiles[0];

            oReader = new window.FileReader();
            oReader.onload = (function () {
                return function (oEvent) {
                    self.insertImage(oEvent.target.result);
                };
            }());

            oReader.readAsDataURL(oFile);
        }
    }
};

CCrea.prototype.onDragLeave = function ()
{
    this.$editableArea.removeClass('editorDragOver');
};

/**
 * @param {Object} oEvent
 */
CCrea.prototype.onDragOver = function (oEvent)
{
    oEvent.stopPropagation();
    oEvent.preventDefault();

    this.$editableArea.addClass('editorDragOver');
};

/**
 * @param {Object} oEvent
 * @returns {Boolean}
 */
CCrea.prototype.pasteImage = function (oEvent)
{
    var
        oClipboardItems = oEvent.clipboardData && oEvent.clipboardData.items,
        self = this,
        bImagePasted = false
    ;

    if (window.File && window.FileReader && window.FileList && oClipboardItems)
    {
        _.each(oClipboardItems, function (oItem) {
            if (self.checkIsImage(oItem) && oItem['getAsFile']) {
                var
                    oReader = null,
                    oFile = oItem['getAsFile']()
                ;
                if (oFile)
                {
                    oReader = new window.FileReader();
                    oReader.onload = (function () {
                        return function (oEvent) {
                            self.insertImage(oEvent.target.result);
                        };
                    }());

                    oReader.readAsDataURL(oFile);
                    bImagePasted = true;
                }
            }
        });
    }

    return bImagePasted;
};

/**
 * @param {Object} oItem
 * @return {boolean}
 */
CCrea.prototype.checkIsImage = function (oItem)
{
    return oItem && oItem.type && 0 === oItem.type.indexOf('image/');
};

/**
 * Sets plain text to rich editor.
 *
 * @param {string} sText
 */
CCrea.prototype.setPlainText = function (sText)
{
    if (typeof sText !== 'string')
    {
        sText = '';
    }

    if (this.$editableArea)
    {
        this.editableSave();
        this.$editableArea.empty().text(sText).css('white-space', 'pre');
        this.editableSave();
    }
};

/**
 * Sets text to rich editor.
 *
 * @param {string} sText
 */
CCrea.prototype.setText = function (sText)
{
    if (typeof sText !== 'string')
    {
        sText = '';
    }

    if (this.$editableArea)
    {
        if (sText.length === 0)
        {
            sText = '<br />';
        }

        var
            oText = $(sText),
            oOuter = $(sText),
            oChildren = oOuter.children(),
            oInner = oChildren.first(),
            bOuterWrapper = oOuter.length === 1 && oOuter.data('crea') === 'font-wrapper',
            bInnerWrapper = oOuter.length === 1 && oChildren.length === 1 &&
                oOuter.data('xDivType') === 'body' && oInner.data('crea') === 'font-wrapper'
        ;

        if (bOuterWrapper)
        {
            this.setBasicStyles(oOuter.css('font-family'), oOuter.css('font-size'), oOuter.css('direction'));
            oText = oOuter.contents();
        }
        else if (bInnerWrapper)
        {
            this.setBasicStyles(oInner.css('font-family'), oInner.css('font-size'), oInner.css('direction'));
            oText = oInner.contents();
        }
        else
        {
            this.setBasicStyles(this.oOptions.defaultFontName, this.convertFontSizeToPixels(this.oOptions.defaultFontSize), this.oOptions.isRtl ? 'rtl' : 'ltr');
        }

        this.$editableArea.empty().append(oText).css('white-space', 'normal');
		this.clearUndoRedo();
        this.editableSave();
    }
};

/**
 * @param {string} sFontName
 * @param {string} sFontSize
 * @param {string} sDirection
 */
CCrea.prototype.setBasicStyles = function (sFontName, sFontSize, sDirection)
{
    this.sBasicFontName = sFontName;
    this.sBasicFontSize = sFontSize;
    this.sBasicDirection = sDirection;

    this.$editableArea.css({
        'font-family': this.getFontNameWithFamily(this.sBasicFontName),
        'font-size': this.sBasicFontSize,
        'direction': this.sBasicDirection
    });
};

/**
 * Gets plain text from rich editor.
 *
 * @return {string}
 */
CCrea.prototype.getPlainText = function ()
{
    var sVal = '';

    if (this.$editableArea)
    {
        sVal = this.$editableArea.html()
            .replace(/([^>]{1})<div>/gi, '$1\n')
            .replace(/<style[^>]*>[^<]*<\/style>/gi, '\n')
            .replace(/<br *\/{0,1}>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<a [^>]*href="([^"]*?)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
        ;
    }

    return sVal;
};

/**
 * Gets text from rich editor.
 *
 * @param {boolean=} bRemoveSignatureAnchor = false
 * @return {string}
 */
CCrea.prototype.getText = function (bRemoveSignatureAnchor)
{
    var
        $Anchor = null,
        sVal = ''
    ;

    if (this.$editableArea && this.$editableArea.length > 0)
    {
        if (bRemoveSignatureAnchor)
        {
            $Anchor = this.$editableArea.find('div[data-anchor="signature"]');
            $Anchor.removeAttr('data-anchor');
        }

        sVal = this.$editableArea.html();
        sVal = '<div data-crea="font-wrapper" style="font-family: ' + this.getFontNameWithFamily(this.sBasicFontName) + '; font-size: ' + this.sBasicFontSize + '; direction: ' + this.sBasicDirection + '">' + sVal + '</div>';
    }

    return sVal;
};

/**
 * @param {string} sNewSignatureContent
 * @param {string} sOldSignatureContent
 */
CCrea.prototype.changeSignatureContent = function (sNewSignatureContent, sOldSignatureContent)
{
    var
        $Anchor = this.$editableArea.find('div[data-anchor="signature"]'),
        $NewSignature = $(sNewSignatureContent).closest('div[data-crea="font-wrapper"]'),
        $OldSignature = $(sOldSignatureContent).closest('div[data-crea="font-wrapper"]'),
        sClearOldSignature, sClearNewSignature,
        sAnchorHtml,
        $SignatureContainer,
        $SignatureBlockquoteParent,
        sFoundOldSignature,
        $AnchorBlockquoteParent
    ;

    /*** there is a signature container in the message ***/
    if ($Anchor.length > 0)
    {
        sAnchorHtml = $Anchor.html();
        /*** previous signature is empty -> append to the container a new signature ***/
        if (sOldSignatureContent === '')
        {
            $Anchor.html(sAnchorHtml + sNewSignatureContent);
        }
        /*** previous signature was found in the container -> replace it with a new ***/
        else if (sAnchorHtml.indexOf(sOldSignatureContent) !== -1)
        {
            $Anchor.html(sAnchorHtml.replace(sOldSignatureContent, sNewSignatureContent));
        }
        /*** new signature is found in the container -> do nothing ***/
        else if (sAnchorHtml.indexOf(sNewSignatureContent) !== -1)
        {
        }
        else
        {
            sClearOldSignature = ($NewSignature.length === 0 || $OldSignature.length === 0) ? sOldSignatureContent : $OldSignature.html();
            sClearNewSignature = ($NewSignature.length === 0 || $OldSignature.length === 0) ? sNewSignatureContent : $NewSignature.html();
            /*** found a previous signature without wrapper -> replace it with a new ***/
            if (sAnchorHtml.indexOf(sClearOldSignature) !== -1)
            {
                $Anchor.html(sAnchorHtml.replace(sClearOldSignature, sNewSignatureContent));
            }
            /*** found a new signature without wrapper -> do nothing ***/
            else if (sAnchorHtml.indexOf(sClearNewSignature) !== -1)
            {
            }
            else
            {
                /*** append the new signature to the end of the container ***/
                $Anchor.html(sAnchorHtml + sNewSignatureContent);
            }
        }
    }
    /*** there is NO signature container in the message ***/
    else
    {
        sFoundOldSignature = sOldSignatureContent;
		try
		{
			$SignatureContainer = this.$editableArea.find('*:contains("' + sFoundOldSignature + '")');
		}
		catch (oErr)
		{
			$SignatureContainer = $('');
		}
        if ($SignatureContainer.length === 0 && $OldSignature.length > 0)
        {
            sFoundOldSignature = $OldSignature.html();
			try
			{
				$SignatureContainer = this.$editableArea.find('*:contains("' + sFoundOldSignature + '")');
			}
			catch (oErr)
			{
				$SignatureContainer = $('');
			}
        }

        if ($SignatureContainer.length > 0)
        {
            $SignatureContainer = $($SignatureContainer[0]);
            $SignatureBlockquoteParent = $SignatureContainer.closest('blockquote');
        }

        if ($SignatureBlockquoteParent && $SignatureBlockquoteParent.length === 0)
        {
            $SignatureContainer.html($SignatureContainer.html().replace(sFoundOldSignature, sNewSignatureContent));
        }
        else
        {
            $Anchor = this.$editableArea.find('div[data-anchor="reply-title"]');
            $AnchorBlockquoteParent = ($Anchor.length > 0) ? $($Anchor[0]).closest('blockquote') : $Anchor;
            if ($Anchor.length === 0 || $AnchorBlockquoteParent.length > 0)
            {
                $Anchor = this.$editableArea.find('blockquote');
            }

            if ($Anchor.length > 0)
            {
                $($Anchor[0]).before($('<br /><div data-anchor="signature">' + sNewSignatureContent + '</div><br />'));
            }
            else
            {
                this.$editableArea.append($('<br /><div data-anchor="signature">' + sNewSignatureContent + '</div><br />'));
            }
        }
    }

    this.editableSave();
};

/**
 * @return {boolean}
 */
CCrea.prototype.isFocused = function ()
{
    return this.bFocused;
};

/**
 * Sets focus.
 * @param {boolean} bKeepCurrent
 */
CCrea.prototype.setFocus = function (bKeepCurrent)
{
    var
        aContents = this.$editableArea.contents(),
        iTextNodeType = 3,
        oTextNode = null,
        sText = ''
    ;

    this.$editableArea.focus();
    if (bKeepCurrent && _.isArray(this.aRanges) && this.aRanges.length > 0)
    {
        this.restoreSelectionPosition();
    }
    else if (aContents.length > 0)
    {
        if (aContents[0].nodeType === iTextNodeType)
        {
            oTextNode = $(aContents[0]);
        }
        else
        {
            oTextNode = $(document.createTextNode(''));
            $(aContents[0]).before(oTextNode);
        }

        sText = oTextNode.text();
        this.setCursorPosition(oTextNode[0], sText.length);
    }
};

CCrea.prototype.setBlur = function ()
{
    this.$editableArea.blur();
};

/**
 * @param {boolean} bEditable
 */
CCrea.prototype.setEditable = function (bEditable)
{
    if (bEditable)
    {
        this.enableContentEditable();
    }
    else
    {
        this.disableContentEditable();
    }
};

CCrea.prototype.disableContentEditable = function ()
{
    this.bEditable = false;
    this.$editableArea.prop('contentEditable', 'false');
};

CCrea.prototype.enableContentEditable = function ()
{
    this.$editableArea.prop('contentEditable', 'true');
    setTimeout(_.bind(function () {this.bEditable = true;}, this), 0);
};

CCrea.prototype.fixFirefoxCursorBug = function ()
{
    if (Browser.firefox)
    {
        this.disableContentEditable();

        setTimeout(_.bind(function () {this.enableContentEditable();}, this), 0);
    }
};

CCrea.prototype.setRtlDirection = function ()
{
    this.setBasicStyles(this.sBasicFontName, this.sBasicFontSize, 'rtl');
};

CCrea.prototype.setLtrDirection = function ()
{
    this.setBasicStyles(this.sBasicFontName, this.sBasicFontSize, 'ltr');
};

CCrea.prototype.pasteHtmlAtCaret = function (html)
{
    var sel, range;
    if (window.getSelection) {
        // IE9 and non-IE
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();

            // Range.createContextualFragment() would be useful here but is
            // only relatively recently standardized and is not supported in
            // some browsers (IE9, for one)
            var el = document.createElement("div");
            el.innerHTML = html;
            var frag = document.createDocumentFragment(), node, lastNode;
            while ( (node = el.firstChild) ) {
                lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);

            // Preserve the selection
            if (lastNode) {
                range = range.cloneRange();
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    } else if (document.selection && document.selection.type !== "Control") {
        // IE < 9
        range = document.selection.createRange();
        if (range && range.pasteHTML)
        {
            range.pasteHTML(html);
        }
    }
};

/**
 * Executes command.
 *
 * @param {string} sCmd
 * @param {string=} sParam
 * @param {boolean=} bDontAddToHistory
 * @return {boolean}
 */
CCrea.prototype.execCom = function (sCmd, sParam, bDontAddToHistory)
{
    var
        bRes = false,
        oRange
    ;

    if (this.bEditable)
    {
        this.editableSave();

        if (Browser.opera)
        {
            this.restoreSelectionPosition();
        }

        if ('insertHTML' === sCmd && Browser.ie)
        {
            this.pasteHtmlAtCaret(sParam);
        }
        else
        {
            if (typeof sParam === 'undefined')
            {
                bRes = window.document.execCommand(sCmd);
            }
            else
            {
                bRes = window.document.execCommand(sCmd, false, sParam);
            }
        }

        if (Browser.chrome)
        {
            // Chrome need to resave the selection after the operation.
            this.storeSelectionPosition();
            if (sCmd === 'insertHTML' && this.aRanges.length > 0)
            {
                // Chrome selects line after inserted text. Disable do it.
                oRange = this.aRanges[0];
                oRange.setEnd(oRange.startContainer, oRange.startOffset);
                this.restoreSelectionPosition();
            }
        }

        if (!bDontAddToHistory)
        {
            this.editableSave();
        }
    }
    return bRes;
};

/**
 * Inserts html.
 *
 * @param {string} sHtml
 * @param {boolean} bDontAddToHistory
 */
CCrea.prototype.insertHtml = function (sHtml, bDontAddToHistory)
{
    this.execCom('insertHTML', sHtml, bDontAddToHistory);
};

/**
 * @param {string} sId
 * @param {string} sSrc
 */
CCrea.prototype.changeImageSource = function (sId, sSrc)
{
    this.$editableArea.find('img[id="' + sId + '"]').attr('src', sSrc);
    this.editableSave();
};

/**
 * Inserts link.
 *
 * @param {string} sLink
 */
CCrea.prototype.insertEmailLink = function (sLink)
{
    this.restoreSelectionPosition();
    if (this.getSelectedText() === '')
    {
        this.execCom('insertHTML', '<a href="mailto:' + sLink + '">' + sLink + '</a>');
    }
    else
    {
        this.insertLink('mailto:' + sLink);
    }
};

/**
 * Inserts link.
 *
 * @param {string} sLink
 */
CCrea.prototype.insertLink = function (sLink)
{
    sLink = this.normaliseURL(sLink);
    this.restoreSelectionPosition(sLink);

    if (this.getSelectedText() === '' && Browser.ie)
    {
        this.execCom('insertHTML', '<a href="' + sLink + '">' + sLink + '</a>');
    }
    else
    {
        var sCmd = Browser.ie8AndBelow ? 'CreateLink' : 'createlink';
        this.execCom(sCmd, sLink);
    }

    this.changeFocusLink(sLink);
};

/**
 * Removes link.
 */
CCrea.prototype.removeLink = function ()
{
    var sCmd = Browser.ie8AndBelow ? 'Unlink' : 'unlink';
    this.execCom(sCmd);
};

/**
 * Inserts image.
 *
 * @param {string} sImage
 * @return {boolean}
 */
CCrea.prototype.insertImage = function (sImage)
{
    var sCmd = Browser.ie8AndBelow ? 'InsertImage' : 'insertimage';
    if (!this.isFocused())
    {
        this.setFocus(true);
    }
    else
    {
        this.restoreSelectionPosition();
    }

    return this.execCom(sCmd, sImage);
};

/**
 * Inserts ordered list.
 */
CCrea.prototype.numbering = function ()
{
    this.execCom('InsertOrderedList');
};

/**
 * Inserts unordered list.
 */
CCrea.prototype.bullets = function ()
{
    this.execCom('InsertUnorderedList');
};

/**
 * Inserts horizontal line.
 */
CCrea.prototype.horizontalLine = function ()
{
    this.execCom('InsertHorizontalRule');
};

/**
 * @param {string} sFontName
 */
CCrea.prototype.getFontNameWithFamily = function (sFontName)
{
    var sFamily = '';

    switch (sFontName)
    {
        case 'Arial':
        case 'Arial Black':
        case 'Tahoma':
        case 'Verdana':
            sFamily = ', sans-serif';
            break;
        case 'Courier New':
            sFamily = ', monospace';
            break;
        case 'Times New Roman':
            sFamily = ', serif';
            break;
    }

    return sFontName + sFamily;
};

/**
 * Sets font name.
 *
 * @param {string} sFontName
 */
CCrea.prototype.fontName = function (sFontName)
{
    var bFirstTime = !this.aRanges;



    this.setFocus(true);
    this.execCom('FontName', this.getFontNameWithFamily(sFontName));

    if (bFirstTime)
    {
        this.setBasicStyles(sFontName, this.sBasicFontSize, this.sBasicDirection);
    }
};

/**
 * Sets font size.
 *
 * @param {string} sFontSize
 */
CCrea.prototype.fontSize = function (sFontSize)
{
    var bFirstTime = !this.aRanges;

    this.setFocus(true);
    this.execCom('FontSize', sFontSize);

    if (bFirstTime)
    {
        this.setBasicStyles(this.sBasicFontName, this.convertFontSizeToPixels(sFontSize), this.sBasicDirection);
    }
};

/**
 * Sets bold style.
 */
CCrea.prototype.bold = function ()
{
    this.execCom('Bold');
    this.$editableArea.focus();
};

/**
 * Sets italic style.
 */
CCrea.prototype.italic = function ()
{
    this.execCom('Italic');
    this.$editableArea.focus();
};

/**
 * Sets underline style.
 */
CCrea.prototype.underline = function ()
{
    this.execCom('Underline');
    this.$editableArea.focus();
};

/**
 * Sets strikethrough style.
 */
CCrea.prototype.strikeThrough = function ()
{
    this.execCom('StrikeThrough');
    this.$editableArea.focus();
};

CCrea.prototype.undo = function ()
{
    this.editableUndo();
};

CCrea.prototype.redo = function ()
{
    this.editableRedo();
};

/**
 * Sets left justify.
 */
CCrea.prototype.alignLeft = function ()
{
    this.execCom('JustifyLeft');
};

/**
 * Sets center justify.
 */
CCrea.prototype.center = function ()
{
    this.execCom('JustifyCenter');
};

/**
 * Sets right justify.
 */
CCrea.prototype.alignRight = function ()
{
    this.execCom('JustifyRight');
};

/**
 * Sets full justify.
 */
CCrea.prototype.justify = function ()
{
    this.execCom('JustifyFull');
};

/**
 * Sets text color.
 *
 * @param {string} sFontColor
 */
CCrea.prototype.textColor = function (sFontColor)
{
    this.execCom('ForeColor', sFontColor);
    this.$editableArea.focus();
};

/**
 * Sets background color.
 *
 * @param {string} sBackColor
 */
CCrea.prototype.backgroundColor = function (sBackColor)
{
    var sCmd = Browser.ie ? 'BackColor' : 'hilitecolor';
    this.execCom(sCmd, sBackColor);
    this.$editableArea.focus();
};

/**
 * Removes format.
 */
CCrea.prototype.removeFormat = function ()
{
    this.execCom('removeformat');
    this.$editableArea.focus();
};

/**
 * Gets font name from selected text.
 *
 * @return {string}
 */
CCrea.prototype.getFontName = function ()
{
    if (this.bEditable)
    {
        var
            sFontName = window.document.queryCommandValue('FontName'),
            sValidFontName = this.sBasicFontName,
            sFoundFontName = ''
        ;

        if (typeof sFontName === 'string')
        {
            sFontName = sFontName.replace(/'/g, '');
            $.each(this.oOptions.fontNameArray, function (iIndex, sFont) {
                if (sFontName.indexOf(sFont) > -1 || sFontName.indexOf(sFont.toLowerCase()) > -1)
                {
                    sFoundFontName = sFont;
                }
            });

            if (sFoundFontName !== '')
            {
                sValidFontName = sFoundFontName;
            }
        }
    }

    return sValidFontName;
};

/**
 * Gets is font-weight bold.
 *
 * @return {boolean}
 */
CCrea.prototype.getIsBold = function ()
{
    if (this.bEditable)
    {
        var bIsBold = window.document.queryCommandState('bold');
    }

    return bIsBold;
};

/**
 * Gets is font-style italic.
 *
 * @return {boolean}
 */
CCrea.prototype.getIsItalic = function ()
{
    if (this.bEditable)
    {
        var bIsItalic = window.document.queryCommandState('italic');
    }

    return bIsItalic;
};

/**
 * Gets is text-decoration underline.
 *
 * @return {boolean}
 */
CCrea.prototype.getIsUnderline = function ()
{
    if (this.bEditable)
    {
        var bIsUnderline = window.document.queryCommandState('underline');
    }

    return bIsUnderline;
};

/**
 * Gets is ordered list active.
 *
 * @return {boolean}
 */
CCrea.prototype.getIsEnumeration = function ()
{
    if (this.bEditable)
    {
        var bIsEnumeration = window.document.queryCommandState('insertOrderedList');
    }

    return bIsEnumeration;
};

/**
 * Gets is unordered list active.
 *
 * @return {boolean}
 */
CCrea.prototype.getIsBullets = function ()
{
    if (this.bEditable)
    {
        var bIsBullets = window.document.queryCommandState('insertUnorderedList');
    }

    return bIsBullets;
};

/**
 * Gets is text-decoration strike-through.
 *
 * @return {boolean}
 */
CCrea.prototype.getIsStrikeThrough = function ()
{
    if (this.bEditable)
    {
        var bIsStrikeThrough = window.document.queryCommandState('StrikeThrough');
    }

    return bIsStrikeThrough;
};

/**
 * @param {number} iFontSizeInNumber
 *
 * @return {string}
 */
CCrea.prototype.convertFontSizeToPixels = function (iFontSizeInNumber)
{
    var iFontSizeInPixels = 0;

    $.each(this.aSizes, function (iIndex, oSize) {
        if (iFontSizeInPixels === 0 && iFontSizeInNumber <= oSize.inNumber)
        {
            iFontSizeInPixels = oSize.inPixels;
        }
    });

    return iFontSizeInPixels + 'px';
};

/**
 * @param {string} sFontSizeInPixels
 *
 * @return {number}
 */
CCrea.prototype.convertFontSizeToNumber = function (sFontSizeInPixels)
{
    var
        iFontSizeInPixels = Types.pInt(sFontSizeInPixels),
        iFontSizeInNumber = 0
    ;

    if (iFontSizeInPixels > 0)
    {
        $.each(this.aSizes, function (iIndex, oSize) {
            if (iFontSizeInNumber === 0 && iFontSizeInPixels <= oSize.inPixels)
            {
                iFontSizeInNumber = oSize.inNumber;
            }
        });
    }

    return iFontSizeInNumber;
};

/**
 * Gets font size from selected text.
 *
 * @return {number}
 */
CCrea.prototype.getFontSizeInNumber = function ()
{
    var
        sFontSizeInNumber = '',
        iFontSizeInNumber = 0
    ;

    if (this.bEditable)
    {
        sFontSizeInNumber = window.document.queryCommandValue('FontSize');
        iFontSizeInNumber = Types.pInt(sFontSizeInNumber);
    }

    if (isNaN(iFontSizeInNumber) || iFontSizeInNumber <= 0)
    {
        iFontSizeInNumber = this.convertFontSizeToNumber(this.sBasicFontSize);
    }

    return iFontSizeInNumber;
};

/**
 * @param {string} sHref
 */
CCrea.prototype.changeLink = function (sHref)
{
    var
        sNormHref = this.normaliseURL(sHref),
        oCurrLink = $(this.oCurrLink)
    ;

    if (this.oCurrLink)
    {
        if (oCurrLink.attr('href') === oCurrLink.text())
        {
            oCurrLink.text(sNormHref);
        }
        if (this.oCurrLink.tagName === 'A')
        {
            oCurrLink.attr('href', sNormHref);
        }
        else
        {
            oCurrLink.parent().attr('href', sNormHref);
        }

        this.oCurrLink = null;
        this.bInUrl = false;
    }
};

CCrea.prototype.removeCurrentLink = function ()
{
    if (this.oCurrLink && document.createRange && window.getSelection)
    {
        var
            oRange = document.createRange(),
            oSel = window.getSelection()
        ;

        oRange.selectNodeContents(this.oCurrLink);
        oSel.removeAllRanges();
        oSel.addRange(oRange);

        this.removeLink();
        this.oCurrLink = null;
        this.bInUrl = false;
        this.oOptions.onUrlOut();
    }
};

/**
 * Fix for FF - execCommand inserts broken link, if it is present not Latin.
 *
 * @param {string} sLink
 */
CCrea.prototype.changeFocusLink = function (sLink)
{
    var
        oSel = null,
        oFocusNode = null
    ;

    if (Browser.firefox && window.getSelection)
    {
        oSel = window.getSelection();
        oFocusNode = oSel.focusNode ? oSel.focusNode.parentElement : null;
        if (oFocusNode && oFocusNode.tagName === 'A')
        {
            $(oFocusNode).attr('href', sLink);
        }
    }
};

CCrea.prototype.removeCurrentImage = function ()
{
    if (this.oCurrImage)
    {
        this.oCurrImage.remove();
        this.oCurrImage = null;
        this.bInImage = false;
        this.oOptions.onImageBlur();
    }
	this.setFocus(true);
};

CCrea.prototype.changeCurrentImage = function (aParams)
{
    if (this.oCurrImage && aParams !== undefined)
    {
        var image = this.oCurrImage;
        $.each(aParams, function (key, value) {
            image.css(key, value);
        });
    }
	this.setFocus(true);
};

CCrea.prototype.showImageTooltip = function (aParams)
{
    if (this.oCurrImage && aParams !== undefined)
    {
        var image = this.oCurrImage;
        $.each(aParams, function (key, value) {
            image.css(key, value);
        });
    }
};

/**
 * @param {string} sText
 * @return {string}
 */
CCrea.prototype.normaliseURL = function (sText)
{
    return sText.search(/^https?:\/\/|^mailto:|^tel:/g) !== -1 ? sText : 'http://' + sText;
};

/**
 * @return {string}
 */
CCrea.prototype.getSelectedText = function ()
{
    var
        sText = '',
        oSel = null
    ;

    if (window.getSelection)
    {
        oSel = window.getSelection();
        if (oSel.rangeCount > 0)
        {
            sText = oSel.getRangeAt(0).toString();
        }
    }

    return sText;
};

/**
 * Stores selection position.
 */
CCrea.prototype.storeSelectionPosition = function ()
{
    var aNewRanges = this.getSelectionRanges();
    if (_.isArray(aNewRanges) && aNewRanges.length > 0)
    {
        this.aRanges = aNewRanges;
    }
};

/**
 * @return {Array}
 */
CCrea.prototype.editableIsActive = function ()
{
    return !!($(document.activeElement).hasClass('crea-content-editable') || $(document.activeElement).children().first().hasClass('crea-content-editable'));
};

/**
 * @return {Array}
 */
CCrea.prototype.getSelectionRanges = function ()
{
    var aRanges = [];

    if (window.getSelection && this.editableIsActive())
    {
        var
            oSel = window.getSelection(),
            oRange = null,
            iIndex = 0,
            iLen = oSel.rangeCount
        ;

        for (; iIndex < iLen; iIndex++)
        {
            oRange = oSel.getRangeAt(iIndex);
            aRanges.push(oRange);
        }
    }

    return aRanges;
};


CCrea.prototype.checkAnchorNode = function ()
{
    if (window.getSelection && this.editableIsActive())
    {
        var
            oSel = window.getSelection(),
            oCurrLink = null
        ;

        if (oSel.anchorNode && (oSel.anchorNode.parentElement || oSel.anchorNode.parentNode))
        {
            oCurrLink = oSel.anchorNode.parentElement || oSel.anchorNode.parentNode;

			if (oCurrLink.parentNode.tagName === 'A')
			{
				oCurrLink = oCurrLink.parentNode;
			}
			else if (oCurrLink.parentElement.tagName === 'A')
			{
				oCurrLink = oCurrLink.parentNode;
			}

            if (oCurrLink.tagName === 'A')
            {
                if (!this.bInUrl || oCurrLink !== this.oCurrLink)
                {
                    this.oCurrLink = oCurrLink;
                    this.bInUrl = true;
                    this.oOptions.onUrlIn($(oCurrLink));
                }
                else if (this.bInUrl && oCurrLink === this.oCurrLink)
                {
                    this.oCurrLink = null;
                    this.bInUrl = false;
                    this.oOptions.onUrlOut();
                }
            }
            else if (this.bInUrl)
            {
                this.oCurrLink = null;
                this.bInUrl = false;
                this.oOptions.onUrlOut();
            }
        }
    }
};

/**
 * Restores selection position.
 *
 * @param {string} sText
 */
CCrea.prototype.restoreSelectionPosition = function (sText)
{
    var
        sRangeText = '',
        oSel = null,
        oRange = null,
        oNode = null
    ;

    sRangeText = this.setSelectionRanges(this.aRanges);
    if (window.getSelection && _.isArray(this.aRanges))
    {
        sText = (sText !== undefined) ? sText : '';
        if (Browser.firefox && sRangeText === '' && sText !== '')
        {
            if (window.getSelection && window.getSelection().getRangeAt)
            {
                oSel = window.getSelection();
                if (oSel.getRangeAt && oSel.rangeCount > 0)
                {
                    oRange = oSel.getRangeAt(0);
                    oNode = oRange.createContextualFragment(sText);
                    oRange.insertNode(oNode);
                }
            }
            else if (document.selection && document.selection.createRange)
            {
                document.selection.createRange().pasteHTML(sText);
            }
        }
    }
};

/**
 * @param {Array} aRanges
 * @return {string}
 */
CCrea.prototype.setSelectionRanges = function (aRanges)
{
    var
        oSel = null,
        oRange = null,
        iIndex = 0,
        iLen = 0,
        sRangeText = ''
    ;

    if (window.getSelection && _.isArray(aRanges))
    {
        iLen = aRanges.length;

        oSel = window.getSelection();

        if (!Browser.ie10AndAbove)
        {
            oSel.removeAllRanges();
        }

        for (; iIndex < iLen; iIndex++)
        {
            oRange = aRanges[iIndex];
            if (oRange)
            {
                oSel.addRange(oRange);
                sRangeText += '' + oRange;
            }
        }

    }

    return sRangeText;
};

CCrea.prototype.uniteWithNextQuote = function ()
{
    var
        oSel = window.getSelection ? window.getSelection() : null,
        eFocused = oSel ? oSel.focusNode : null,
        eBlock = eFocused ? this.getLastBlockQuote(eFocused) : null,
        oNext = eBlock ? $(eBlock).next() : null,
        eNext = (oNext && oNext.length > 0 && oNext[0].tagName === 'BLOCKQUOTE') ? oNext[0] : null,
        aChildren = [],
        iIndex = 0,
        iLen = 0,
        eChild = null
    ;

    if (eBlock && eNext)
    {
        $('<br />').appendTo(eBlock);

        aChildren = $(eNext).contents();
        iLen = aChildren.length;

        for (iIndex = 0; iIndex < iLen; iIndex++)
        {
            eChild = aChildren[iIndex];
            $(eChild).appendTo(eBlock);
        }

        $(eNext).remove();
    }
};

CCrea.prototype.uniteWithPrevQuote = function ()
{
    var
        oSel = window.getSelection ? window.getSelection() : null,
        eFocused = oSel ? oSel.focusNode : null,
        eBlock = eFocused ? this.getLastBlockQuote(eFocused) : null
    ;

    this.getPrevAndUnite(eBlock);
    this.getPrevAndUnite(eBlock);
};

/**
 * @param {Object} eBlock
 */
CCrea.prototype.getPrevAndUnite = function (eBlock)
{
    var
        oPrev = eBlock ? $(eBlock).prev() : null,
        ePrev = (oPrev && oPrev.length > 0 && oPrev[0].tagName === 'BLOCKQUOTE') ? oPrev[0] : null,
        aChildren = [],
        iIndex = 0,
        iLen = 0,
        eChild = null
    ;

    if (eBlock && ePrev)
    {
        $('<br />').prependTo(eBlock);

        aChildren = $(ePrev).contents();
        iLen = aChildren.length;

        for (iIndex = iLen - 1; iIndex > 0; iIndex--)
        {
            eChild = aChildren[iIndex];
            $(eChild).prependTo(eBlock);
        }

        $(ePrev).remove();
    }
};

/**
 * @param {Object} eFocused
 * @return {Object}
 */
CCrea.prototype.getLastBlockQuote = function (eFocused)
{
    var
        eCurrent = eFocused,
        eBlock = null
    ;

    while (eCurrent && eCurrent.parentNode)
    {
        if (eCurrent.tagName === 'BLOCKQUOTE')
        {
            eBlock = eCurrent;
        }
        eCurrent = eCurrent.parentNode;
    }

    return eBlock;
};

/**
 * @param {Object} ev
 */
CCrea.prototype.breakQuotes = function (ev)
{
    var
        oSel = window.getSelection ? window.getSelection() : null,
        eFocused = oSel ? oSel.focusNode : null,
        eBlock = eFocused ? this.getLastBlockQuote(eFocused) : null
    ;

    if (eFocused && eBlock)
    {
        this.breakBlocks(eFocused, eBlock, oSel.focusOffset);
    }
};

/**
 * @param {Object} eStart
 * @param {number} iStartOffset
 */
CCrea.prototype.setCursorPosition = function (eStart, iStartOffset)
{
    if (document.createRange && window.getSelection)
    {
        var
            oRange = document.createRange(),
            oSel = window.getSelection()
        ;

        oSel.removeAllRanges();

        oRange.setStart(eStart, iStartOffset);
        oRange.setEnd(eStart, iStartOffset);
        oRange.collapse(true);

        oSel.addRange(oRange);

        this.aRanges = [oRange];
    }
};

/**
 * @param {Object} eNode
 * @return {Object}
 */
CCrea.prototype.cloneNode = function (eNode)
{
    var
        $clonedNode = null,
        sTagName = ''
    ;

    try
    {
        $clonedNode = $(eNode).clone();
    }
    catch (er)
    {
        sTagName = eNode.tagName;
        $clonedNode = $('<' + sTagName + '></' + sTagName + '>');
    }

    return $clonedNode;
};

/**
 * @param {Object} eFocused
 * @param {Object} eBlock
 * @param {number} iFocusOffset
 */
CCrea.prototype.breakBlocks = function (eFocused, eBlock, iFocusOffset)
{
    var
        eCurrent = eFocused,
        eCurChild = null,
        aChildren = [],
        iIndex = 0,
        iLen = 0,
        eChild = null,
        bBeforeCurrent = true,
        $firstParent = null,
        $secondParent = null,
        $first = null,
        $second = null,
        bLast = false,
        bContinue = true,
        $span = null
    ;

    while (bContinue && eCurrent.parentNode)
    {
        $first = $firstParent;
        $second = $secondParent;

        $firstParent = this.cloneNode(eCurrent).empty();
        $secondParent = this.cloneNode(eCurrent).empty();

        aChildren = $(eCurrent).contents();
        iLen = aChildren.length;
        bBeforeCurrent = true;

        if (eCurChild === null)
        {
            eCurChild = aChildren[iFocusOffset];
        }
        if (iLen === 0)
        {
            $firstParent = null;
        }

        for (iIndex = 0; iIndex < iLen; iIndex++)
        {
            eChild = aChildren[iIndex];
            if (eChild === eCurChild)
            {
                if ($first === null)
                {
                    if (!(iIndex === iFocusOffset && eChild.tagName === 'BR'))
                    {
                        $(eChild).appendTo($secondParent);
                    }
                }
                else
                {
                    if ($first.html().length > 0)
                    {
                        $first.appendTo($firstParent);
                    }

                    $second.appendTo($secondParent);
                }
                bBeforeCurrent = false;
            }
            else if (bBeforeCurrent)
            {
                $(eChild).appendTo($firstParent);
            }
            else
            {
                $(eChild).appendTo($secondParent);
            }
        }

        bLast = (eBlock === eCurrent);
        if (bLast)
        {
            bContinue = false;
        }

        eCurChild = eCurrent;
        eCurrent = eCurrent.parentNode;
    }

    if ($firstParent !== null && $secondParent !== null)
    {
        $firstParent.insertBefore($(eBlock));
        $span = $('<span>&nbsp;</span>').insertBefore($(eBlock));
        $('<br>').insertBefore($(eBlock));
        $secondParent.insertBefore($(eBlock));

        $(eBlock).remove();
        this.setCursorPosition($span[0], 0);
    }
};

module.exports = CCrea;


/***/ }),

/***/ "vsma":
/*!***********************************************************!*\
  !*** ./modules/MailWebclient/js/models/CIdentityModel.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	AddressUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Address.js */ "Ol7c"),
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd")
;

/**
 * @constructor
 */
function CIdentityModel()
{
	this.IDENTITY = true; // constant
	
	this.bAccountPart = false;
	this.isDefault = ko.observable(false);
	this.email = ko.observable('');
	this.friendlyName = ko.observable('');
	this.fullEmail = ko.computed(function () {
		return AddressUtils.getFullEmail(this.friendlyName(), this.email());
	}, this);
	this.accountId = ko.observable(-1);
	this.id = ko.observable(-1);
	this.signature = ko.observable('');
	this.useSignature = ko.observable(false);
	this.hash = ko.computed(function () {
		return Utils.getHash(this.accountId() + 'identity' + this.id());
	}, this);
}

/**
 * @param {Object} oData
 */
CIdentityModel.prototype.parse = function (oData)
{
	if (oData['@Object'] === 'Object/Aurora\\Modules\\Mail\\Classes\\Identity')
	{
		this.bAccountPart = !!oData.AccountPart;
		this.isDefault(!!oData.Default);
		this.email(Types.pString(oData.Email));
		this.friendlyName(Types.pString(oData.FriendlyName));
		this.accountId(Types.pInt(oData.IdAccount));
		this.id(Types.pInt(oData.EntityId));
		var sSignature = Types.pString(oData.Signature);
		if (sSignature.indexOf('<') !== 0) {
			sSignature = '<div>' + sSignature + '</div>';
		}
		this.signature = ko.observable(sSignature);
		this.useSignature(!!oData.UseSignature);
	}
};

module.exports = CIdentityModel;


/***/ }),

/***/ "w+bY":
/*!***************************************************!*\
  !*** ./modules/CoreWebclient/js/vendors/queue.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;!function(){function n(n){function e(){for(;i=a<c.length&&n>p;){var u=a++,e=c[u],o=t.call(e,1);o.push(l(u)),++p,e[0].apply(null,o)}}function l(n){return function(u,t){--p,null==s&&(null!=u?(s=u,a=d=0/0,o()):(c[n]=t,--d?i||e():o()))}}function o(){null!=s?m(s):f?m(s,c):m.apply(null,[s].concat(c))}var r,i,f,c=[],a=0,p=0,d=0,s=null,m=u;return n||(n=1/0),r={defer:function(){return s||(c.push(arguments),++d,e()),r},await:function(n){return m=n,f=!1,d||o(),r},awaitAll:function(n){return m=n,f=!0,d||o(),r}}}function u(){}var t=[].slice;n.version="1.0.7", true?!(__WEBPACK_AMD_DEFINE_RESULT__ = (function(){return n}).call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)):undefined}();


/***/ }),

/***/ "xzvH":
/*!********************************************************!*\
  !*** ./modules/MailWebclient/js/MessagesDictionary.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	CHECK_AND_CLEAR_DICT_EVERY_MINUTES = 30,
	DESTROY_NOT_USED_LAST_HOURS = 4
;

var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	moment = __webpack_require__(/*! moment */ "wd/R"),
	
	Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
	
	Settings = __webpack_require__(/*! modules/MailWebclient/js/Settings.js */ "p2hp"),
	
	MailCache = null
;

function GetMessagesLimitToStore()
{
	return Settings.MailsPerPage * 8 + 700;
}

function CMessagesDictionary()
{
	this.oMessages = {};
	
	// Clears dictionary from old messages every 30 minutes
	setInterval(this.checkAndClear.bind(this), 1000 * 60 * CHECK_AND_CLEAR_DICT_EVERY_MINUTES);
}

/**
 * Obtains message from dictionary.
 * @param {array} aKey
 * @returns {object}
 */
CMessagesDictionary.prototype.get = function (aKey)
{
	var sKey = JSON.stringify(aKey);
	return this.oMessages[sKey];
};

/**
 * Adds message to dictionary.
 * @param {array} aKey
 * @param {object} oMessage
 */
CMessagesDictionary.prototype.set = function (aKey, oMessage)
{
	var sKey = JSON.stringify(aKey);
	this.oMessages[sKey] = oMessage;
};

/**
 * Requires MailCache. It cannot be required earlier because it is not initialized yet.
 */
CMessagesDictionary.prototype.requireMailCache = function ()
{
	if (MailCache === null)
	{
		MailCache = __webpack_require__(/*! modules/MailWebclient/js/Cache.js */ "4+IO");
	}
};

/**
 * Checks the number of messages in the dictionary.
 * If the number is over 1000 destroys messages that have not been used for 4 hours.
 */
CMessagesDictionary.prototype.checkAndClear = function ()
{
	this.requireMailCache();
	
	// Do not check if the current folder has not been synchronized for the last 30 minutes.
	// This may be first moments after computer wakes up.
	var oIndicatorFolder = MailCache.getCurrentFolder();
	if (!oIndicatorFolder && MailCache.folderList())
	{
		oIndicatorFolder = MailCache.folderList().inboxFolder();
	}
	if (!oIndicatorFolder || moment().diff(oIndicatorFolder.oRelevantInformationLastMoment) > 1000 * 60 * CHECK_AND_CLEAR_DICT_EVERY_MINUTES)
	{
		return;
	}
	
	var
		iCount = _.size(this.oMessages),
		iPrevNow = moment().add(-DESTROY_NOT_USED_LAST_HOURS, 'hours').unix(),
		iMessagesLimitToStore = GetMessagesLimitToStore()
	;
	
	if (iCount > iMessagesLimitToStore)
	{
		Utils.log('checkAndClear', iCount, Settings.MailsPerPage, iMessagesLimitToStore);
		
		// Update last access time for messages on the current page.
		_.each(MailCache.messages(), function (oMessage) {
			oMessage.updateLastAccessTime();
		});
		
		// Update last access time for the current message.
		if (MailCache.currentMessage())
		{
			MailCache.currentMessage().updateLastAccessTime();
		}
		
		// Destroy old messages.
		_.each(this.oMessages, function (oMessage, sKey) {
			if (oMessage.iLastAccessTime !== 0 && oMessage.iLastAccessTime < iPrevNow)
			{
				Utils.destroyObjectWithObservables(this.oMessages, sKey);
			}
		}.bind(this));
		
		Utils.log('checkAndClear', _.size(this.oMessages));
	}
};

/**
 * Removes message from the dictionary.
 * @param {Array} aKey
 */
CMessagesDictionary.prototype.remove = function (aKey)
{
	var sKey = JSON.stringify(aKey);
	Utils.destroyObjectWithObservables(this.oMessages, sKey);
};

// Updates all messages dates if current date has been just changed.
CMessagesDictionary.prototype.updateMomentDates = function ()
{
	_.each(this.oMessages, function (oMessage) {
		oMessage.updateMomentDate();
	}, this);
};

module.exports = new CMessagesDictionary();


/***/ }),

/***/ "zu1m":
/*!***************************************************!*\
  !*** ./modules/MailWebclient/js/utils/Message.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
	
	MessageUtils = {}
;

/**
 * Displays embedded images, which have cid on the list.
 *
 * @param {object} $html JQuery element containing message body html
 * @param {array} aAttachments Array of objects having fields
 *		- CID
 *		- ContentLocation
 *		- ViewLink
 * @param {array} aFoundCids Array of string cids
 * @param {string=} sAppPath = '' Path to be connected to the ViewLink of every attachment
 */
MessageUtils.showInlinePictures = function ($html, aAttachments, aFoundCids, sAppPath)
{
	var
		fFindAttachmentByCid = function (sCid) {
			return _.find(aAttachments, function (oAttachment) {
				return oAttachment.CID === sCid;
			});
		},
		fFindAttachmentByContentLocation = function (sContentLocation) {
			return _.find(aAttachments, function (oAttachment) {
				return oAttachment.ContentLocation === sContentLocation;
			});
		}
	;

	if (typeof sAppPath !== 'string')
	{
		sAppPath = '';
	}

	if (aFoundCids.length > 0)
	{
		$('[data-x-src-cid]', $html).each(function () {
			var
				sCid = $(this).attr('data-x-src-cid'),
				oAttachment = fFindAttachmentByCid(sCid)
			;
			if (oAttachment && oAttachment.ViewLink.length > 0)
			{
				$(this).attr('src', sAppPath + oAttachment.ViewLink);
			}
		});

		$('[data-x-style-cid]', $html).each(function () {
			var
				sStyle = '',
				sName = $(this).attr('data-x-style-cid-name'),
				sCid = $(this).attr('data-x-style-cid'),
				oAttachment = fFindAttachmentByCid(sCid)
			;

			if (oAttachment && oAttachment.ViewLink.length > 0 && '' !== sName)
			{
				sStyle = $.trim($(this).attr('style'));
				sStyle = '' === sStyle ? '' : (';' === sStyle.substr(-1) ? sStyle + ' ' : sStyle + '; ');
				$(this).attr('style', sStyle + sName + ': url(\'' + oAttachment.ViewLink + '\')');
			}
		});
	}

	$('[data-x-src-location]', $html).each(function () {

		var
			sLocation = $(this).attr('data-x-src-location'),
			oAttachment = fFindAttachmentByContentLocation(sLocation)
		;

		if (!oAttachment)
		{
			oAttachment = fFindAttachmentByCid(sLocation);
		}

		if (oAttachment && oAttachment.ViewLink.length > 0)
		{
			$(this).attr('src', sAppPath + oAttachment.ViewLink);
		}
	});
};

/**
 * Displays external images.
 *
 * @param {object} $html JQuery element containing message body html
 */
MessageUtils.showExternalPictures = function ($html)
{
	$('[data-x-src]', $html).each(function () {
		$(this).attr('src', $(this).attr('data-x-src')).removeAttr('data-x-src');
	});

	$('[data-x-style-url]', $html).each(function () {
		var sStyle = $.trim($(this).attr('style'));
		sStyle = '' === sStyle ? '' : (';' === sStyle.substr(-1) ? sStyle + ' ' : sStyle + '; ');
		$(this).attr('style', sStyle + $(this).attr('data-x-style-url')).removeAttr('data-x-style-url');
	});
};

/**
 * Joins "Re" and "Fwd" prefixes in the message subject.
 * 
 * @param {string} sSubject The message subject.
 * @param {string} sRePrefix "Re" prefix translated into the language of the application.
 * @param {string} sFwdPrefix "Fwd" prefix translated into the language of the application.
 */
MessageUtils.joinReplyPrefixesInSubject = function (sSubject, sRePrefix, sFwdPrefix)
{
	var
		aRePrefixes = [sRePrefix.toUpperCase()],
		aFwdPrefixes = [sFwdPrefix.toUpperCase()],
		sPrefixes = _.union(aRePrefixes, aFwdPrefixes).join('|'),
		sReSubject = '',
		aParts = sSubject.split(':'),
		aResParts = [],
		sSubjectEnd = ''
	;

	_.each(aParts, function (sPart) {
		if (sSubjectEnd.length === 0)
		{
			var
				sPartUpper = $.trim(sPart.toUpperCase()),
				bRe = _.indexOf(aRePrefixes, sPartUpper) !== -1,
				bFwd = _.indexOf(aFwdPrefixes, sPartUpper) !== -1,
				iCount = 1,
				oLastResPart = (aResParts.length > 0) ? aResParts[aResParts.length - 1] : null
			;

			if (!bRe && !bFwd)
			{
				var oMatch = (new window.RegExp('^\\s?(' + sPrefixes + ')\\s?[\\[\\(]([\\d]+)[\\]\\)]$', 'gi')).exec(sPartUpper);
				if (oMatch && oMatch.length === 3)
				{
					bRe = _.indexOf(aRePrefixes, oMatch[1].toUpperCase()) !== -1;
					bFwd = _.indexOf(aFwdPrefixes, oMatch[1].toUpperCase()) !== -1;
					iCount = Types.pInt(oMatch[2]);
				}
			}

			if (bRe)
			{
				if (oLastResPart && oLastResPart.prefix === sRePrefix)
				{
					oLastResPart.count += iCount;
				}
				else
				{
					aResParts.push({prefix: sRePrefix, count: iCount});
				}
			}
			else if (bFwd)
			{
				if (oLastResPart && oLastResPart.prefix === sFwdPrefix)
				{
					oLastResPart.count += iCount;
				}
				else
				{
					aResParts.push({prefix: sFwdPrefix, count: iCount});
				}
			}
			else
			{
				sSubjectEnd = sPart;
			}
		}
		else
		{
			sSubjectEnd += ':' + sPart;
		}
	});

	_.each(aResParts, function (sResPart) {
		if (sResPart.count === 1)
		{
			sReSubject += sResPart.prefix + ': ';
		}
		else
		{
			sReSubject += sResPart.prefix + '[' + sResPart.count + ']: ';
		}
	});
	sReSubject += $.trim(sSubjectEnd);
	
	return sReSubject;
};

module.exports = MessageUtils;


/***/ })

}]);