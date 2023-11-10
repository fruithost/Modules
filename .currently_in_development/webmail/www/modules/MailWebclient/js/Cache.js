'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	moment = require('moment'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Pulse = require('%PathToCoreWebclientModule%/js/Pulse.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	WindowOpener = require('%PathToCoreWebclientModule%/js/WindowOpener.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	
	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	MessagesDictionary = require('modules/%ModuleName%/js/MessagesDictionary.js'),
	Prefetcher = null,
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CFolderModel = require('modules/%ModuleName%/js/models/CFolderModel.js'),
	CFolderListModel = require('modules/%ModuleName%/js/models/CFolderListModel.js'),
	CUidListModel = require('modules/%ModuleName%/js/models/CUidListModel.js'),
	
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
	Prefetcher = require('modules/%ModuleName%/js/Prefetcher.js');
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
		'Name': TextUtils.i18n('%MODULENAME%/LABEL_FOLDER_ALL_INBOXES'),
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
		var ComposeUtils = require('modules/%ModuleName%/js/utils/Compose.js');
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
				Popups.showPopup(ConfirmPopup, [TextUtils.i18n('%MODULENAME%/CONFIRM_MESSAGE_FOR_DELETE_IS_EDITED'), 
					_.bind(function (bOk) {
						if (bOk)
						{
							this.closeComposesWithDraftUids(aUids);
							fMoveMessages();
						}
						this.disableComposeAutosave(false);
					}, this), 
					'', TextUtils.i18n('%MODULENAME%/ACTION_CLOSE_DELETE_DRAFT')
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
			title: TextUtils.i18n('%MODULENAME%/INFO_NEW_MESSAGES_PLURAL', {
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
				aBody.push(TextUtils.i18n('%MODULENAME%/LABEL_SUBJECT') + ': ' + oResponse.Result.New[0].Subject);
			}
			
			sFrom = (_.map(oResponse.Result.New[0].From, function(oFrom) {
				return oFrom.DisplayName !== '' ? oFrom.DisplayName : oFrom.Email;
			})).join(', ');
			if (Types.isNonEmptyString(sFrom))
			{
				aBody.push(TextUtils.i18n('%MODULENAME%/LABEL_FROM') + ': ' + sFrom);
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
		sConfirm = bToFolderTrash ? TextUtils.i18n('%MODULENAME%/CONFIRM_MESSAGES_DELETE_WITHOUT_TRASH') :
			TextUtils.i18n('%MODULENAME%/CONFIRM_MESSAGES_MARK_SPAM_WITHOUT_SPAM'),
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
				Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_MOVING_MESSAGES'));
			}
		}
		else
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_DELETING_MESSAGES'));
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
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_COPYING_MESSAGES'));
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
