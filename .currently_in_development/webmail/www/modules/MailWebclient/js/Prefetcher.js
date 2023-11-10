'use strict';

var
	_ = require('underscore'),

	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	MailCache = require('modules/%ModuleName%/js/Cache.js'),

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
		App.broadcastEvent('%ModuleName%::ParseMessagesBodies::after', { AccountID: oParameters.AccountID, Folder: oParameters.Folder });
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
