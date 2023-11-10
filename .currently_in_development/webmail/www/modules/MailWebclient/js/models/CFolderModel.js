'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	moment = require('moment'),
	
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	Storage = require('%PathToCoreWebclientModule%/js/Storage.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	
	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	MailCache = null,
	MessagesDictionary = require('modules/%ModuleName%/js/MessagesDictionary.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CMessageModel = require('modules/%ModuleName%/js/models/CMessageModel.js'),
	CUidListModel = require('modules/%ModuleName%/js/models/CUidListModel.js')
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
		MailCache = require('modules/%ModuleName%/js/Cache.js');
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
					aSenders.push(TextUtils.i18n('%MODULENAME%/LABEL_ME_SENDER'));
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
	this.name(TextUtils.i18n('%MODULENAME%/LABEL_FOLDER_STARRED'));
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
	
		App.broadcastEvent('%ModuleName%::ParseFolder::after', this);
		
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
			return this.isTemplateStorage() ? TextUtils.i18n('%MODULENAME%/ACTION_TURN_TEMPLATE_FOLDER_OFF') : TextUtils.i18n('%MODULENAME%/ACTION_TURN_TEMPLATE_FOLDER_ON');
		}
		return '';
	}, this);
	
	this.alwaysRefreshButtonHint = ko.computed(function () {
		if (Settings.AllowAlwaysRefreshFolders)
		{
			return this.isAlwaysRefresh() ? TextUtils.i18n('%MODULENAME%/ACTION_TURN_ALWAYS_REFRESH_OFF') : TextUtils.i18n('%MODULENAME%/ACTION_TURN_ALWAYS_REFRESH_ON');
		}
		return '';
	}, this);
	
	this.subscribeButtonHint = ko.computed(function () {
		if (this.canSubscribe())
		{
			return this.subscribed() ? TextUtils.i18n('%MODULENAME%/ACTION_HIDE_FOLDER') : TextUtils.i18n('%MODULENAME%/ACTION_SHOW_FOLDER');
		}
		return '';
	}, this);
	
	this.deleteButtonHint = ko.computed(function () {
		return this.canDelete() ? TextUtils.i18n('%MODULENAME%/ACTION_DELETE_FOLDER') : '';
	}, this);
	
	this.usedAs = ko.computed(function () {
		switch (this.type())
		{
			case Enums.FolderTypes.Inbox:
				return TextUtils.i18n('%MODULENAME%/LABEL_USED_AS_INBOX');
			case Enums.FolderTypes.Sent:
				return TextUtils.i18n('%MODULENAME%/LABEL_USED_AS_SENT');
			case Enums.FolderTypes.Drafts:
				return TextUtils.i18n('%MODULENAME%/LABEL_USED_AS_DRAFTS');
			case Enums.FolderTypes.Trash:
				return TextUtils.i18n('%MODULENAME%/LABEL_USED_AS_TRASH');
			case Enums.FolderTypes.Spam:
				return TextUtils.i18n('%MODULENAME%/LABEL_USED_AS_SPAM');
		}
		return '';
	}, this);

	this.displayName = ko.computed(function () {
		if (this.bIsUnifiedInbox)
		{
			return TextUtils.i18n('%MODULENAME%/LABEL_FOLDER_ALL_INBOXES');
		}
		switch (this.type())
		{
			case Enums.FolderTypes.Inbox:
				return TextUtils.i18n('%MODULENAME%/LABEL_FOLDER_INBOX');
			case Enums.FolderTypes.Sent:
				return TextUtils.i18n('%MODULENAME%/LABEL_FOLDER_SENT');
			case Enums.FolderTypes.Drafts:
				return TextUtils.i18n('%MODULENAME%/LABEL_FOLDER_DRAFTS');
			case Enums.FolderTypes.Trash:
				return TextUtils.i18n('%MODULENAME%/LABEL_FOLDER_TRASH');
			case Enums.FolderTypes.Spam:
				return TextUtils.i18n('%MODULENAME%/LABEL_FOLDER_SPAM');
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
		sWarning = TextUtils.i18n('%MODULENAME%/CONFIRM_EMPTY_FOLDER'),
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
		sWarning = TextUtils.i18n('%MODULENAME%/CONFIRM_DELETE_FOLDER'),
		fCallBack = _.bind(this.deleteAfterConfirm, this)
	;
	
	if (this.canDelete())
	{
		Popups.showPopup(ConfirmPopup, [sWarning, fCallBack]);
	}
	else
	{
		App.broadcastEvent('%ModuleName%::AttemptDeleteNonemptyFolder');
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
				Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_DELETE_FOLDER'));
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
					Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_SUBSCRIBE_FOLDER'));
				}
				else
				{
					Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_UNSUBSCRIBE_FOLDER'));
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
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_RENAME_FOLDER'));
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
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_SETUP_SPECIAL_FOLDERS'));
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
