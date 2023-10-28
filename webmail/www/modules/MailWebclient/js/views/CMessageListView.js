'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	DateUtils = require('%PathToCoreWebclientModule%/js/utils/Date.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Browser = require('%PathToCoreWebclientModule%/js/Browser.js'),
	CJua = require('%PathToCoreWebclientModule%/js/CJua.js'),
	CSelector = require('%PathToCoreWebclientModule%/js/CSelector.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CPageSwitcherView = require('%PathToCoreWebclientModule%/js/views/CPageSwitcherView.js'),
	
	ComposeUtils = require('modules/%ModuleName%/js/utils/Compose.js'),
	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),
	MailUtils = require('modules/%ModuleName%/js/utils/Mail.js'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	MailCache  = require('modules/%ModuleName%/js/Cache.js'),
	Settings  = require('modules/%ModuleName%/js/Settings.js')
;

require("jquery-ui/ui/widgets/datepicker");

/**
 * @constructor
 * 
 * @param {Function} fOpenMessageInNewWindowBound
 */
function CMessageListView(fOpenMessageInNewWindowBound)
{
	this.disableMoveMessages = ko.computed(function () {
		var oFolder = MailCache.getCurrentFolder();
		return oFolder ? oFolder.disableMoveFrom() : true;
	}, this);
	this.bVisibleSortByTool = Settings.MessagesSortBy.Allow && Settings.MessagesSortBy.List.length > 0;
	this.sSortBy = Settings.MessagesSortBy.DefaultSortBy;
	this.iSortOrder = Settings.MessagesSortBy.DefaultSortOrder;
	this.aSortList = [];
	_.each(Settings.MessagesSortBy.List, function (oItem) {
		this.aSortList.push({
			sText: TextUtils.i18n('%MODULENAME%/' + oItem.LangConst),
			sSortBy: oItem.SortBy,
			sortOrder: ko.observable(Settings.MessagesSortBy.DefaultSortBy),
			selected: ko.observable(oItem.SortBy === Settings.MessagesSortBy.DefaultSortOrder)
		});
	}.bind(this));

	this.uploaderArea = ko.observable(null);
	this.bDragActive = ko.observable(false);
	this.bDragActiveComp = ko.computed(function () {
		return this.bDragActive();
	}, this);

	this.openMessageInNewWindowBound = fOpenMessageInNewWindowBound;
	
	this.isFocused = ko.observable(false);

	this.messagesContainer = ko.observable(null);

	this.searchInput = ko.observable('');
	this.searchInputFrom = ko.observable('');
	this.searchInputTo = ko.observable('');
	this.searchInputSubject = ko.observable('');
	this.searchInputText = ko.observable('');
	this.searchSpan = ko.observable('');
	this.highlightTrigger = ko.observable('');

	this.currentMessage = MailCache.currentMessage;
	this.currentMessage.subscribe(function () {
		this.isFocused(false);
		this.selector.itemSelected(this.currentMessage());
	}, this);

	this.folderList = MailCache.folderList;
	this.folderList.subscribe(this.onFolderListSubscribe, this);
	this.folderFullName = ko.observable('');
	this.folderType = ko.observable(Enums.FolderTypes.User);
	this.filters = ko.observable('');

	this.uidList = MailCache.uidList;
	this.uidList.subscribe(function () {
		if (this.uidList().searchCountSubscription)
		{
			this.uidList().searchCountSubscription.dispose();
			this.uidList().searchCountSubscription = undefined;
		}
		this.uidList().searchCountSubscription = this.uidList().resultCount.subscribe(function () {
			if (this.uidList().resultCount() >= 0)
			{
				this.oPageSwitcher.setCount(this.uidList().resultCount());
			}
		}, this);
		
		if (this.uidList().resultCount() >= 0)
		{
			this.oPageSwitcher.setCount(this.uidList().resultCount());
		}
	}, this);

	this.useThreading = ko.computed(function () {
		var
			oAccount = AccountList.getCurrent(),
			oFolder = MailCache.getCurrentFolder(),
			bFolderWithoutThreads = oFolder && oFolder.withoutThreads(),
			bNotSearchOrFilters = this.uidList().search() === '' && this.uidList().filters() === ''
		;
		
		return oAccount && oAccount.threadingIsAvailable() && !bFolderWithoutThreads && bNotSearchOrFilters;
	}, this);

	this.collection = MailCache.messages;
	
	this._search = ko.observable('');
	this.search = ko.computed({
		'read': function () {
			return $.trim(this._search());
		},
		'write': this._search,
		'owner': this
	});

	this.isEmptyList = ko.computed(function () {
		return this.collection().length === 0;
	}, this);

	this.isNotEmptyList = ko.computed(function () {
		return this.collection().length !== 0;
	}, this);

	this.isSearch = ko.computed(function () {
		return this.search().length > 0;
	}, this);

	this.isUnseenFilter = ko.computed(function () {
		return this.filters() === Enums.FolderFilter.Unseen;
	}, this);

	this.isLoading = MailCache.messagesLoading;

	this.isError = MailCache.messagesLoadingError;

	this.visibleInfoLoading = ko.computed(function () {
		return !this.isSearch() && this.isLoading();
	}, this);
	this.visibleInfoSearchLoading = ko.computed(function () {
		return this.isSearch() && this.isLoading();
	}, this);
	this.visibleInfoSearchList = ko.computed(function () {
		return this.isSearch() && !this.isUnseenFilter() && !this.isLoading() && !this.isEmptyList();
	}, this);
	this.visibleInfoMessageListEmpty = ko.computed(function () {
		return !this.isLoading() && !this.isSearch() && (this.filters() === '') && this.isEmptyList() && !this.isError();
	}, this);
	this.visibleInfoStarredFolderEmpty = ko.computed(function () {
		return !this.isLoading() && !this.isSearch() && (this.filters() === Enums.FolderFilter.Flagged) && this.isEmptyList() && !this.isError();
	}, this);
	this.visibleInfoSearchEmpty = ko.computed(function () {
		return this.isSearch() && !this.isUnseenFilter() && this.isEmptyList() && !this.isError() && !this.isLoading();
	}, this);
	this.visibleInfoMessageListError = ko.computed(function () {
		return !this.isSearch() && this.isError();
	}, this);
	this.visibleInfoSearchError = ko.computed(function () {
		return this.isSearch() && this.isError();
	}, this);
	this.visibleInfoUnseenFilterList = ko.computed(function () {
		return this.isUnseenFilter() && (this.isLoading() || !this.isEmptyList());
	}, this);
	this.visibleInfoUnseenFilterEmpty = ko.computed(function () {
		return this.isUnseenFilter() && this.isEmptyList() && !this.isError() && !this.isLoading();
	}, this);

	this.searchText = ko.computed(function () {

		return TextUtils.i18n('%MODULENAME%/INFO_SEARCH_RESULT', {
			'SEARCH': this.calculateSearchStringForDescription(),
			'FOLDER': MailCache.getCurrentFolder() ? TextUtils.encodeHtml(MailCache.getCurrentFolder().displayName()) : ''
		});
		
	}, this);

	this.unseenFilterText = ko.computed(function () {

		if (this.search() === '')
		{
			return TextUtils.i18n('%MODULENAME%/INFO_UNREAD_MESSAGES', {
				'FOLDER': MailCache.getCurrentFolder() ? TextUtils.encodeHtml(MailCache.getCurrentFolder().displayName()) : ''
			});
		}
		else
		{
			return TextUtils.i18n('%MODULENAME%/INFO_UNREAD_MESSAGES_SEARCH_RESULT', {
				'SEARCH': this.calculateSearchStringForDescription(),
				'FOLDER': MailCache.getCurrentFolder() ? TextUtils.encodeHtml(MailCache.getCurrentFolder().displayName()) : ''
			});
		}
		
	}, this);

	this.unseenFilterEmptyText = ko.computed(function () {

		if (this.search() === '')
		{
			return TextUtils.i18n('%MODULENAME%/INFO_NO_UNREAD_MESSAGES');
		}
		else
		{
			return TextUtils.i18n('%MODULENAME%/INFO_NO_UNREAD_MESSAGES_FOUND');
		}
		
	}, this);

	this.isEnableGroupOperations = ko.observable(false).extend({'throttle': 250});

	this.selector = new CSelector(
		this.collection,
		_.bind(this.routeForMessage, this),
		_.bind(this.onDeletePress, this),
		_.bind(this.onMessageDblClick, this),
		_.bind(this.onEnterPress, this),
		null,
		false,
		false,
		false,
		false,
		false // don't select new item before routing executed
	);

	this.checkedUids = ko.computed(function () {
		var
			aChecked = this.selector.listChecked(),
			aCheckedUids = _.map(aChecked, function (oItem) {
				return MailCache.getMessageUid(oItem);
			}),
			oFolder = MailCache.getCurrentFolder(),
			aThreadCheckedUids = oFolder ? oFolder.getThreadCheckedUidsFromList(aChecked) : [],
			aUids = _.union(aCheckedUids, aThreadCheckedUids)
		;

		return aUids;
	}, this);
	
	this.checkedOrSelectedUids = ko.computed(function () {
		var aChecked = this.checkedUids();
		if (aChecked.length === 0 && MailCache.currentMessage() && _.isFunction(MailCache.currentMessage().deleted) && !MailCache.currentMessage().deleted())
		{
			aChecked = [MailCache.getMessageUid(MailCache.currentMessage())];
		}
		return aChecked;
	}, this);

	ko.computed(function () {
		this.isEnableGroupOperations(0 < this.selector.listCheckedOrSelected().length);
	}, this);

	this.checkAll = this.selector.koCheckAll();
	this.checkAllIncomplite = this.selector.koCheckAllIncomplete();

	this.pageSwitcherLocked = ko.observable(false);
	this.oPageSwitcher = new CPageSwitcherView(0, Settings.MailsPerPage);
	this.oPageSwitcher.currentPage.subscribe(function (iPage) {
		var
			sFolder = MailCache.getCurrentFolderFullname(),
			sUid = !App.isMobile() && this.currentMessage() ? this.currentMessage().uid() : '',
			sSearch = this.search()
		;
		
		if (!this.pageSwitcherLocked())
		{
			this.changeRoutingForMessageList(sFolder, iPage, sUid, sSearch, this.filters(), this.sSortBy, this.iSortOrder);
		}
	}, this);
	this.currentPage = ko.observable(0);
	
	// to the message list does not twitch
	if (Browser.firefox || Browser.ie)
	{
		this.listChangedThrottle = ko.observable(false).extend({'throttle': 10});
	}
	else
	{
		this.listChangedThrottle = ko.observable(false);
	}
	
	this.firstCompleteCollection = ko.observable(true);
	this.collection.subscribe(function () {
		if (this.collection().length > 0)
		{
			if (Types.isNonEmptyArray(this.aRouteParams))
			{
				this.onRoute(this.aRouteParams);
				this.aRouteParams = [];
			}
			else
			{
				this.firstCompleteCollection(false);
			}
		}
	}, this);
	this.listChanged = ko.computed(function () {
		return [
			this.firstCompleteCollection(),
			MailCache.currentAccountId(),
			this.folderFullName(),
			this.filters(),
			this.search(),
			this.oPageSwitcher.currentPage()
		];
	}, this);
	
	this.listChanged.subscribe(function() {
		this.listChangedThrottle(!this.listChangedThrottle());
	}, this);

	this.bAdvancedSearch = ko.observable(false);
	this.searchAttachmentsCheckbox = ko.observable(false);
	this.searchAttachments = ko.observable('');
	this.searchAttachments.subscribe(function(sText) {
		this.searchAttachmentsCheckbox(!!sText);
	}, this);
	
	this.searchAttachmentsFocus = ko.observable(false);
	this.searchFromFocus = ko.observable(false);
	this.searchSubjectFocus = ko.observable(false);
	this.searchToFocus = ko.observable(false);
	this.searchTextFocus = ko.observable(false);
	this.searchTrigger = ko.observable(null);
	this.searchDateStartFocus = ko.observable(false);
	this.searchDateEndFocus = ko.observable(false);
	this.searchDateStartDom = ko.observable(null);
	this.searchDateStart = ko.observable('');
	this.searchDateEndDom = ko.observable(null);
	this.searchDateEnd = ko.observable('');
	this.dateFormatDatePicker = 'yy.mm.dd';
	this.attachmentsPlaceholder = ko.computed(function () {
		return TextUtils.i18n('%MODULENAME%/LABEL_HAS_ATTACHMENTS');
	}, this);

	_.delay(_.bind(function(){
		this.createDatePickerObject(this.searchDateStartDom(), this.searchDateStart);
		this.createDatePickerObject(this.searchDateEndDom(), this.searchDateEnd);
	}, this), 1000);
	
	this.customMessageItemViewTemplate = ko.observable('');
	
	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this, 'MailCache': MailCache});
}

CMessageListView.prototype.ViewTemplate = '%ModuleName%_MessagesView';
CMessageListView.prototype.ViewConstructorName = 'CMessageListView';

CMessageListView.prototype.addNewAccount = function ()
{
	App.Api.createMailAccount(AccountList.getEmail());
};

CMessageListView.prototype.createDatePickerObject = function (oElement, value)
{
	$(oElement).datepicker({
		showOtherMonths: true,
		selectOtherMonths: true,
		monthNames: DateUtils.getMonthNamesArray(),
		dayNamesMin: TextUtils.i18n('COREWEBCLIENT/LIST_DAY_NAMES_MIN').split(' '),
		nextText: '',
		prevText: '',
		firstDay: Types.pInt(ModulesManager.run('CalendarWebclient', 'getWeekStartsOn')),
		showOn: 'focus',
		dateFormat: this.dateFormatDatePicker,
		onClose: function (sValue) {
			if (ko.isObservable(value)) {
				value(sValue);
			}
		}
	});

	$(oElement).mousedown(function() {
		$('#ui-datepicker-div').toggle();
	});
};

/**
 * @param {string} sFolder
 * @param {number} iPage
 * @param {string} sUid
 * @param {string} sSortBy
 * @param {string} iSortOrder
 */
CMessageListView.prototype.changeRoutingForMessageList = function (sFolder, iPage, sUid, sSearch, sFilters, sSortBy, iSortOrder)
{
	var bSame = Routing.setHash(LinksUtils.getMailbox(sFolder, iPage, sUid, sSearch, sFilters, sSortBy, iSortOrder));
	
	if (bSame && sSearch.length > 0 && this.search() === sSearch)
	{
		this.listChangedThrottle(!this.listChangedThrottle());
	}
};

/**
 * @param {CMessageModel} oMessage
 */
CMessageListView.prototype.onEnterPress = function (oMessage)
{
	if (oMessage.threadNextLoadingVisible())
	{
		oMessage.loadNextMessages();
	}
	else
	{
		oMessage.openThread();
	}
};

/**
 * @param {CMessageModel} oMessage
 */
CMessageListView.prototype.onMessageDblClick = function (oMessage)
{
	if (!this.isSavingDraft(oMessage))
	{
		var
			oFolder = this.folderList().getFolderByFullName(oMessage.folder()),
			bTemplateFolder = -1 !== $.inArray(oMessage.folder(), MailCache.getCurrentTemplateFolders()),
			oParams = { Message: oMessage, Cancel: false }
		;
		
		App.broadcastEvent('%ModuleName%::MessageDblClick::before', oParams);

		if (!oParams.Cancel)
		{
			if (oFolder.type() === Enums.FolderTypes.Drafts || bTemplateFolder)
			{
				ComposeUtils.composeMessageFromDrafts(oMessage.accountId(), oMessage.folder(), oMessage.uid());
			}
			else
			{
				this.openMessageInNewWindowBound(oMessage);
			}
		}
	}
};

CMessageListView.prototype.onFolderListSubscribe = function ()
{
	this.setCurrentFolder();
	this.requestMessageList();
};

/**
 * @param {Array} aParams
 */
CMessageListView.prototype.onShow = function (aParams)
{
	this.selector.useKeyboardKeys(true);
	this.oPageSwitcher.show();

	if (this.oJua)
	{
		this.oJua.setDragAndDropEnabledStatus(true);
	}
};

/**
 * @param {Array} aParams
 */
CMessageListView.prototype.onHide = function (aParams)
{
	this.selector.useKeyboardKeys(false);
	this.oPageSwitcher.hide();

	if (this.oJua)
	{
		this.oJua.setDragAndDropEnabledStatus(false);
	}
};

/**
 * @param {Array} aParams
 */
CMessageListView.prototype.onRoute = function (aParams)
{
	var
		oParams = LinksUtils.parseMailbox(aParams),
		sCurrentFolder = this.folderFullName() || this.folderList().inboxFolderFullName(),
		bRouteChanged = this.currentPage() !== oParams.Page ||
			sCurrentFolder !== oParams.Folder ||
			this.filters() !== oParams.Filters || (oParams.Filters === Enums.FolderFilter.Unseen && MailCache.waitForUnseenMessages()) ||
			this.search() !== oParams.Search || this.sSortBy !== oParams.SortBy || this.iSortOrder !== oParams.SortOrder,
		bMailsPerPageChanged = Settings.MailsPerPage !== this.oPageSwitcher.perPage()
	;
	
	this.pageSwitcherLocked(true);
	if (sCurrentFolder !== oParams.Folder || this.search() !== oParams.Search || this.filters() !== oParams.Filters)
	{
		this.oPageSwitcher.clear();
	}
	else
	{
		this.oPageSwitcher.setPage(oParams.Page, Settings.MailsPerPage);
	}
	this.pageSwitcherLocked(false);
	
	if (oParams.Page !== this.oPageSwitcher.currentPage())
	{
		if (this.folderList().iAccountId === 0)
		{
			this.aRouteParams = aParams;
		}
		else
		{
			Routing.replaceHash(LinksUtils.getMailbox(oParams.Folder, this.oPageSwitcher.currentPage(), oParams.Uid, oParams.Search, oParams.Filters));
		}
	}

	this.currentPage(this.oPageSwitcher.currentPage());
	this.folderFullName(oParams.Folder);
	this.filters(oParams.Filters);
	this.search(oParams.Search);
	this.searchInput(this.search());
	this.searchSpan.notifySubscribers();
	this.sSortBy = oParams.SortBy;
	this.iSortOrder = oParams.SortOrder;
	_.each(this.aSortList, function (oSortData) {
		if (oSortData.sSortBy === this.sSortBy)
		{
			oSortData.selected(true);
			oSortData.sortOrder(this.iSortOrder);
		}
		else
		{
			oSortData.selected(false);
		}
	}.bind(this));

	this.setCurrentFolder();
	
	if (bRouteChanged || bMailsPerPageChanged || this.collection().length === 0)
	{
		if (oParams.Filters === Enums.FolderFilter.Unseen)
		{
			MailCache.waitForUnseenMessages(true);
		}
		this.requestMessageList();
	}

	this.highlightTrigger.notifySubscribers(true);
};

CMessageListView.prototype.setCurrentFolder = function ()
{
	MailCache.setCurrentFolder(this.folderFullName(), this.filters());
	this.folderType(MailCache.getCurrentFolderType());
};

CMessageListView.prototype.requestMessageList = function ()
{
	var
		sFullName = MailCache.getCurrentFolderFullname(),
		iPage = this.oPageSwitcher.currentPage()
	;
	
	if (sFullName.length > 0)
	{
		MailCache.changeCurrentMessageList(sFullName, iPage, this.search(), this.filters(), this.sSortBy, this.iSortOrder);
	}
	else
	{
		MailCache.checkCurrentFolderList();
	}
};

CMessageListView.prototype.calculateSearchStringFromAdvancedForm  = function ()
{
	var
		sFrom = this.searchInputFrom(),
		sTo = this.searchInputTo(),
		sSubject = this.searchInputSubject(),
		sText = this.searchInputText(),
		bAttachmentsCheckbox = this.searchAttachmentsCheckbox(),
		sDateStart = this.searchDateStart(),
		sDateEnd = this.searchDateEnd(),
		aOutput = [],
		fEsc = function (sText) {

			sText = $.trim(sText).replace(/"/g, '\\"');
			
			if (-1 < sText.indexOf(' ') || -1 < sText.indexOf('"'))
			{
				sText = '"' + sText + '"';
			}
			
			return sText;
		}
	;

	if (sFrom !== '')
	{
		aOutput.push('from:' + fEsc(sFrom));
	}

	if (sTo !== '')
	{
		aOutput.push('to:' + fEsc(sTo));
	}

	if (sSubject !== '')
	{
		aOutput.push('subject:' + fEsc(sSubject));
	}
	
	if (sText !== '')
	{
		aOutput.push('text:' + fEsc(sText));
	}

	if (bAttachmentsCheckbox)
	{
		aOutput.push('has:attachments');
	}

	if (sDateStart !== '' || sDateEnd !== '')
	{
		aOutput.push('date:' + fEsc(sDateStart) + '/' + fEsc(sDateEnd));
	}

	return aOutput.join(' ');
};

CMessageListView.prototype.onSearchClick = function ()
{
	var
		sFolder = MailCache.getCurrentFolderFullname(),
		iPage = 1,
		sSearch = this.searchInput()
	;
	
	if (this.bAdvancedSearch())
	{
		sSearch = this.calculateSearchStringFromAdvancedForm();
		this.searchInput(sSearch);
		this.bAdvancedSearch(false);
	}
	this.changeRoutingForMessageList(sFolder, iPage, '', sSearch, this.filters());
};

CMessageListView.prototype.onRetryClick = function ()
{
	this.requestMessageList();
};

CMessageListView.prototype.onClearSearchClick = function ()
{
	var
		sFolder = MailCache.getCurrentFolderFullname(),
		sUid = this.currentMessage() ? this.currentMessage().uid() : '',
		sSearch = '',
		iPage = 1
	;

	this.clearAdvancedSearch();
	this.changeRoutingForMessageList(sFolder, iPage, sUid, sSearch, this.filters(), this.sSortBy, this.iSortOrder);
};

CMessageListView.prototype.onClearFilterClick = function ()
{
	var
		sFolder = MailCache.getCurrentFolderFullname(),
		sUid = this.currentMessage() ? this.currentMessage().uid() : '',
		sSearch = '',
		iPage = 1,
		sFilters = ''
	;

	this.clearAdvancedSearch();
	this.changeRoutingForMessageList(sFolder, iPage, sUid, sSearch, sFilters, this.sSortBy, this.iSortOrder);
};

CMessageListView.prototype.onStopSearchClick = function ()
{
	this.onClearSearchClick();
};

/**
 * @param {Object} oMessage
 */
CMessageListView.prototype.isSavingDraft = function (oMessage)
{
	var oFolder = MailCache.getCurrentFolder();
	
	return (oFolder.type() === Enums.FolderTypes.Drafts) && (oMessage.uid() === MailCache.savingDraftUid());
};

/**
 * @param {Object} oMessage
 */
CMessageListView.prototype.routeForMessage = function (oMessage)
{
	if (oMessage !== null && !this.isSavingDraft(oMessage))
	{
		var
			oFolder = MailCache.getCurrentFolder(),
			sFolder = MailCache.getCurrentFolderFullname(),
			iPage = this.oPageSwitcher.currentPage(),
			sUid = MailCache.getMessageUid(oMessage),
			sSearch = this.search()
		;
		
		if (sUid !== '')
		{
			if (App.isMobile() && oFolder.type() === Enums.FolderTypes.Drafts)
			{
				Routing.setHash(LinksUtils.getComposeFromMessage('drafts', oMessage.accountId(), oMessage.folder(), oMessage.uid()));
			}
			else
			{
				this.changeRoutingForMessageList(sFolder, iPage, sUid, sSearch, this.filters(), this.sSortBy, this.iSortOrder);
				if (App.isMobile() && MailCache.currentMessage() && sUid === MailCache.currentMessage().uid())
				{
					MailCache.currentMessage.valueHasMutated();
				}
			}
		}
	}
};

/**
 * @param {Object} $viewDom
 */
CMessageListView.prototype.onBind = function ($viewDom)
{
	var
		self = this,
		fStopPopagation = _.bind(function (oEvent) {
			if (oEvent && oEvent.stopPropagation)
			{
				oEvent.stopPropagation();
			}
		}, this)
	;

	$('.message_list', $viewDom)
		.on('click', function ()
		{
			self.isFocused(false);
		})
		.on('click', '.message_sub_list .item .flag', function (oEvent)
		{
			self.onFlagClick(ko.dataFor(this));
			if (oEvent && oEvent.stopPropagation)
			{
				oEvent.stopPropagation();
			}
		})
		.on('dblclick', '.message_sub_list .item .flag', fStopPopagation)
		.on('click', '.message_sub_list .item .thread-pin', fStopPopagation)
		.on('dblclick', '.message_sub_list .item .thread-pin', fStopPopagation)
	;

	this.selector.initOnApplyBindings(
		'.message_sub_list .item',
		'.message_sub_list .item.selected',
		'.message_sub_list .item .custom_checkbox',
		$('.message_list', $viewDom),
		$('.message_list_scroll.scroll-inner', $viewDom)
	);

	this.initUploader();
};

/**
 * Puts / removes the message flag by clicking on it.
 *
 * @param {Object} oMessage
 */
CMessageListView.prototype.onFlagClick = function (oMessage)
{
	if (!this.isSavingDraft(oMessage))
	{
		MailCache.executeGroupOperation('SetMessageFlagged', [MailCache.getMessageUid(oMessage)], 'flagged', !oMessage.flagged());
	}
};

/**
 * Marks the selected messages read.
 */
CMessageListView.prototype.executeMarkAsRead = function ()
{
	MailCache.executeGroupOperation('SetMessagesSeen', this.checkedOrSelectedUids(), 'seen', true);
};

/**
 * Marks the selected messages unread.
 */
CMessageListView.prototype.executeMarkAsUnread = function ()
{
	MailCache.executeGroupOperation('SetMessagesSeen', this.checkedOrSelectedUids(), 'seen', false);
};

/**
 * Marks Read all messages in a folder.
 */
CMessageListView.prototype.executeMarkAllRead = function ()
{
	MailCache.executeGroupOperation('SetAllMessagesSeen', [], 'seen', true);
};

/**
 * Moves the selected messages in the current folder in the specified.
 * 
 * @param {string} sToFolder
 */
CMessageListView.prototype.executeMoveToFolder = function (sToFolder)
{
	MailCache.moveMessagesToFolder(MailCache.getCurrentFolder(), MailCache.getFolderByFullName(MailCache.currentAccountId(), sToFolder), this.checkedOrSelectedUids());
};

CMessageListView.prototype.executeCopyToFolder = function (sToFolder)
{
	MailCache.copyMessagesToFolder(sToFolder, this.checkedOrSelectedUids());
};

/**
 * Calls for the selected messages delete operation. Called from the keyboard.
 * 
 * @param {Array} aMessages
 */
CMessageListView.prototype.onDeletePress = function (aMessages)
{
	var aUids = MailCache.oUnifiedInbox.selected() ?
				_.map(aMessages, function (oMessage) { return oMessage.unifiedUid(); }) :
				_.map(aMessages, function (oMessage) { return oMessage.uid(); });

	if (aUids.length > 0)
	{
		this.deleteMessages(aUids);
	}
};

/**
 * Calls for the selected messages delete operation. Called by the mouse click on the delete button.
 */
CMessageListView.prototype.executeDelete = function ()
{
	this.deleteMessages(this.checkedOrSelectedUids());
};

/**
 * @param {Array} aUids
 */
CMessageListView.prototype.deleteMessages = function (aUids)
{
	var
		sUidToOpenAfter = '',
		oMessageToOpenAfter = null
	;
	
	if (aUids.length === 1 && MailCache.currentMessage() && (aUids[0] === MailCache.currentMessage().uid() || aUids[0] === MailCache.currentMessage().unifiedUid()))
	{
		sUidToOpenAfter = MailCache.prevMessageUid();
		if (sUidToOpenAfter === '')
		{
			sUidToOpenAfter = MailCache.nextMessageUid();
		}
	}
	
	if (aUids.length > 0)
	{
		MailUtils.deleteMessages(aUids, function () {
			if (sUidToOpenAfter !== '')
			{
				oMessageToOpenAfter = _.find(this.collection(), function (oMessage) {
					return oMessage && _.isFunction(oMessage.uid) && (oMessage.uid() === sUidToOpenAfter || oMessage.unifiedUid() === sUidToOpenAfter);
				});
				if (oMessageToOpenAfter)
				{
					this.routeForMessage(oMessageToOpenAfter);
				}
			}
		}.bind(this));
	}
};

/**
 * Moves the selected messages from the current folder to the folder Spam.
 */
CMessageListView.prototype.executeSpam = function ()
{
	var aUids = this.checkedOrSelectedUids();
	if (MailCache.oUnifiedInbox.selected())
	{
		var oUidsByAccounts = MailCache.getUidsSeparatedByAccounts(aUids);

		_.each(oUidsByAccounts, function (oData) {
			var
				aUidsByAccount = oData.Uids,
				iAccountId = oData.AccountId,
				oFolderList = MailCache.oFolderListItems[iAccountId],
				oAccSpam = oFolderList ? oFolderList.spamFolder() : null,
				oAccInbox = oFolderList ? oFolderList.inboxFolder() : null
			;
			if (oAccInbox && oAccSpam && oAccInbox.fullName() !== oAccSpam.fullName())
			{
				MailCache.moveMessagesToFolder(oAccInbox, oAccSpam, aUidsByAccount);
			}
		});
	}
	else
	{
		var oSpamFolder = this.folderList().spamFolder();

		if (oSpamFolder && MailCache.getCurrentFolderFullname() !== oSpamFolder.fullName())
		{
			MailCache.moveMessagesToFolder(MailCache.getCurrentFolder(), oSpamFolder, aUids);
		}
	}
};

/**
 * Moves the selected messages from the Spam folder to folder Inbox.
 */
CMessageListView.prototype.executeNotSpam = function ()
{
	var
		oCurrentFolder = MailCache.getCurrentFolder(),
		oInbox = this.folderList().inboxFolder()
	;

	if (oInbox && oCurrentFolder && oCurrentFolder.fullName() !== oInbox.fullName())
	{
		MailCache.moveMessagesToFolder(oCurrentFolder, oInbox, this.checkedOrSelectedUids());
	}
};

CMessageListView.prototype.executeSort = function (sSortBy)
{
	_.each(this.aSortList, function (oSortData) {
		if (oSortData.sSortBy === sSortBy)
		{
			if (oSortData.selected())
			{
				oSortData.sortOrder(oSortData.sortOrder() === Enums.SortOrder.Asc ? Enums.SortOrder.Desc : Enums.SortOrder.Asc);
			}
			oSortData.selected(true);
			var
				sFolder = MailCache.getCurrentFolderFullname(),
				iPage = this.oPageSwitcher.currentPage(),
				sUid = '',
				sSearch = this.search()
			;
			
			this.changeRoutingForMessageList(sFolder, iPage, sUid, sSearch, this.filters(), oSortData.sSortBy, oSortData.sortOrder());
		}
		else
		{
			oSortData.selected(false);
		}
	}.bind(this));
};

CMessageListView.prototype.clearAdvancedSearch = function ()
{
	this.searchInputFrom('');
	this.searchInputTo('');
	this.searchInputSubject('');
	this.searchInputText('');
	this.bAdvancedSearch(false);
	this.searchAttachmentsCheckbox(false);
	this.searchAttachments('');
	this.searchDateStart('');
	this.searchDateEnd('');
};

CMessageListView.prototype.onAdvancedSearchClick = function ()
{
	this.bAdvancedSearch(!this.bAdvancedSearch());
};

CMessageListView.prototype.calculateSearchStringForDescription = function ()
{
	return '<span class="part">' + TextUtils.encodeHtml(this.search()) + '</span>';
};

CMessageListView.prototype.initUploader = function ()
{
	var self = this;

	if (this.uploaderArea())
	{
		this.oJua = new CJua({
			'action': '?/Api/',
			'name': 'jua-uploader',
			'queueSize': 2,
			'dragAndDropElement': this.uploaderArea(),
			'disableAjaxUpload': false,
			'disableFolderDragAndDrop': false,
			'disableDragAndDrop': false,
			'hidden': _.extendOwn({
				'Module': Settings.ServerModuleName,
				'Method': 'UploadMessage',
				'Parameters':  function () {
					return JSON.stringify({
						'AccountID': MailCache.currentAccountId(),
						'Folder': self.folderFullName()
					});
				}
			}, App.getCommonRequestParameters())
		});

		this.oJua
			.on('onDrop', _.bind(this.onFileDrop, this))
			.on('onComplete', _.bind(this.onFileUploadComplete, this))
			.on('onBodyDragEnter', _.bind(this.bDragActive, this, true))
			.on('onBodyDragLeave', _.bind(this.bDragActive, this, false))
		;
	}
};

CMessageListView.prototype.onFileDrop = function (oData)
{
	if (!(oData && oData.File && oData.File.type && oData.File.type.indexOf('message/') === 0))
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_FILE_NOT_EML'));
	}
};

CMessageListView.prototype.onFileUploadComplete = function (sFileUid, bResponseReceived, oResponse)
{
	var bSuccess = bResponseReceived && oResponse && !oResponse.ErrorCode;

	if (bSuccess)
	{
		MailCache.executeCheckMail(true);
	}
	else
	{
		Api.showErrorByCode(oResponse || {}, TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_FILE'));
	}
};

module.exports = CMessageListView;
