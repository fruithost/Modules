'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	UrlUtils = require('%PathToCoreWebclientModule%/js/utils/Url.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),

	App = require('%PathToCoreWebclientModule%/js/App.js'),
	MainTabExtMethods = require('modules/%ModuleName%/js/MainTabExtMethods.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Pulse = require('%PathToCoreWebclientModule%/js/Pulse.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	Storage = require('%PathToCoreWebclientModule%/js/Storage.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	WindowOpener = require('%PathToCoreWebclientModule%/js/WindowOpener.js'),

	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),

	ComposeUtils = require('modules/%ModuleName%/js/utils/Compose.js'),
	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),
	MailUtils = require('modules/%ModuleName%/js/utils/Mail.js'),
	SendingUtils = require('modules/%ModuleName%/js/utils/Sending.js'),

	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	MailCache  = require('modules/%ModuleName%/js/Cache.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),

	CAttachmentModel = require('modules/%ModuleName%/js/models/CAttachmentModel.js'),

	MainTab = App.isNewTab() && window.opener && window.opener.MainTabMailMethods
;

/**
 * @constructor
 */
function CMessagePaneView()
{
	CAbstractScreenView.call(this, '%ModuleName%');

	this.bNewTab = App.isNewTab();
	this.isLoading = ko.observable(false);

	this.bAllowSearchMessagesBySubject = Settings.AllowSearchMessagesBySubject;

	MailCache.folderList.subscribe(this.onFolderListSubscribe, this);
	this.messages = MailCache.messages;
	this.messages.subscribe(this.onMessagesSubscribe, this);
	this.currentMessage = MailCache.currentMessage;
	this.currentMessage.subscribe(this.onCurrentMessageSubscribe, this);
	UserSettings.timeFormat.subscribe(this.onCurrentMessageSubscribe, this);
	UserSettings.dateFormat.subscribe(this.onCurrentMessageSubscribe, this);
	this.displayedMessageUid = ko.observable('');

	this.browserTitle = ko.computed(function () {
		var
			oMessage = this.currentMessage(),
			sSubject = oMessage ? oMessage.subject() : '',
			sPrefix = sSubject ? sSubject + ' - ' : ''
		;
		return sPrefix + AccountList.getEmail() + ' - ' + TextUtils.i18n('%MODULENAME%/HEADING_MESSAGE_BROWSER_TAB');
	}, this);

	this.isCurrentMessage = ko.computed(function () {
		return !!this.currentMessage();
	}, this);

	this.isCurrentMessageLoaded = ko.computed(function () {
		return this.isCurrentMessage() && !this.isLoading();
	}, this);

	this.visibleNoMessageSelectedText = ko.computed(function () {
		return this.messages().length > 0 && !this.isCurrentMessage();
	}, this);

	this.prevMessageUid = MailCache.prevMessageUid;
	this.nextMessageUid = MailCache.nextMessageUid;

	this.isEnablePrevMessage = ko.computed(function () {
		return App.isNewTab() && Types.isNonEmptyString(this.prevMessageUid());
	}, this);
	this.isEnableNextMessage = ko.computed(function () {
		return App.isNewTab() && Types.isNonEmptyString(this.nextMessageUid());
	}, this);

	this.isEnableDelete = this.isCurrentMessage;
	this.isEnableReply = this.isCurrentMessageLoaded;
	this.isEnableReplyAll = this.isCurrentMessageLoaded;
	this.isEnableResend = this.isCurrentMessageLoaded;
	this.isEnableForward = this.isCurrentMessageLoaded;
	this.isEnablePrint = this.isCurrentMessageLoaded;
	this.isEnableSave = function () {
		return this.isCurrentMessage() && this.currentMessage().sDownloadAsEmlUrl !== '';
	};

	this.deleteCommand = Utils.createCommand(this, this.executeDeleteMessage, this.isEnableDelete);
	this.prevMessageCommand = Utils.createCommand(this, this.executePrevMessage, this.isEnablePrevMessage);
	this.nextMessageCommand = Utils.createCommand(this, this.executeNextMessage, this.isEnableNextMessage);
	this.replyCommand = Utils.createCommand(this, this.executeReply, this.isEnableReply);
	this.replyAllCommand = Utils.createCommand(this, this.executeReplyAll, this.isEnableReplyAll);
	this.resendCommand = Utils.createCommand(this, this.executeResend, this.isEnableResend);
	this.forwardCommand = Utils.createCommand(this, this.executeForward, this.isEnableForward);
	this.printCommand = Utils.createCommand(this, this.executePrint, this.isEnablePrint);
	this.saveCommand = Utils.createCommand(this, this.executeSave, this.isEnableSave);
	this.forwardAsAttachment = Utils.createCommand(this, this.executeForwardAsAttachment, this.isCurrentMessageLoaded);
	this.otherToolbarCommands = ko.observableArray([]);
	App.broadcastEvent('%ModuleName%::AddPreviewPaneToolbarCommand', {
		AddPreviewPaneToolbarCommand: _.bind(function (oCommand) {
			var oNewCommand = _.extend({
				'Text': '',
				'CssClass': '',
				'Handler': function () {},
				'Visible': true
			}, oCommand);
			oNewCommand.Command = Utils.createCommand(this, oNewCommand.Handler, this.isCurrentMessageLoaded);
			this.otherToolbarCommands.push(oNewCommand);
		}, this),
		View: this
	});

	this.moreCommand = Utils.createCommand(this, null, this.isCurrentMessageLoaded);
	this.moreSectionCommands = ko.observableArray([]);
	App.broadcastEvent('%ModuleName%::AddMoreSectionCommand', _.bind(function (oCommand) {
		var oNewCommand = _.extend({
			'Text': '',
			'CssClass': '',
			'Handler': function () {},
			'Visible': true
		}, oCommand);
		oNewCommand.Command = Utils.createCommand(this, oNewCommand.Handler, this.isCurrentMessageLoaded);
		this.moreSectionCommands.push(oNewCommand);
	}, this));

	this.visiblePicturesControl = ko.observable(false);
	this.visibleShowPicturesLink = ko.observable(false);

	this.visibleConfirmationControl = ko.computed(function () {
		return (this.currentMessage() && this.currentMessage().readingConfirmationAddressee() !== '' && this.currentMessage() && this.currentMessage().readingConfirmationAddressee() !== AccountList.getEmail());
	}, this);

	this.isCurrentNotDraftOrSent = ko.computed(function () {
		var oCurrFolder = MailCache.getCurrentFolder();
		return (oCurrFolder && oCurrFolder.fullName().length > 0 &&
			oCurrFolder.type() !== Enums.FolderTypes.Drafts &&
			oCurrFolder.type() !== Enums.FolderTypes.Sent);
	}, this);

	this.isCurrentSentFolder = ko.computed(function () {
		var oCurrFolder = MailCache.getCurrentFolder();
		return !!oCurrFolder && oCurrFolder.fullName().length > 0 && oCurrFolder.type() === Enums.FolderTypes.Sent;
	}, this);

	this.isCurrentNotDraftFolder = ko.computed(function () {
		var oCurrFolder = MailCache.getCurrentFolder();
		return !!oCurrFolder && oCurrFolder.fullName().length > 0 && oCurrFolder.type() !== Enums.FolderTypes.Drafts;
	}, this);

	this.topControllers = ko.observableArray();
	this.bodyControllers = ko.observableArray();
	this.bottomControllers = ko.observableArray();
	this.controllers = ko.computed(function () {
		return _.union(this.topControllers(), this.bodyControllers(), this.bottomControllers());
	}, this);

	this.disableAllSendTools = ko.computed(function () {
		var bDisable = false;
		_.each(this.controllers(), function (oController) {
			if (_.isFunction(oController.disableAllSendTools) && oController.disableAllSendTools())
			{
				bDisable = true;
			}
		});
		return bDisable;
	}, this);
	this.isVisibleReplyTool = ko.computed(function () {
		return !this.disableAllSendTools() && this.isCurrentNotDraftOrSent();
	}, this);
	this.isVisibleResendTool = ko.computed(function () {
		return !this.disableAllSendTools() && this.isCurrentSentFolder();
	}, this);
	this.isVisibleForwardTool = ko.computed(function () {
		return !this.disableAllSendTools() && this.isCurrentNotDraftFolder();
	}, this);

	this.accountId = ko.observable(0);
	this.folder = ko.observable('');
	this.uid = ko.observable('');
	this.folder.subscribe(function () {
		if (this.jqPanelHelper)
		{
			this.jqPanelHelper.trigger('resize', [null, 'min', null, true]);
		}
	}, this);
	this.subject = ko.observable('');
	this.emptySubject = ko.computed(function () {
		return ($.trim(this.subject()) === '');
	}, this);
	this.subjectForDisplay = ko.computed(function () {
		return this.emptySubject() ? TextUtils.i18n('%MODULENAME%/LABEL_NO_SUBJECT') : this.subject();
	}, this);
	this.importance = ko.observable(Enums.Importance.Normal);
	this.oFromAddr = ko.observable(null);
	this.from = ko.observable('');
	this.fromEmail = ko.observable('');
	this.fullFrom = ko.observable('');
	this.to = ko.observable('');
	this.aToAddr = ko.observableArray([]);
	this.cc = ko.observable('');
	this.aCcAddr = ko.observableArray([]);
	this.bcc = ko.observable('');
	this.aBccAddr = ko.observableArray([]);
	this.allRecipients = ko.observableArray([]);
	this.currentAccountEmail = ko.observable();
	this.sMeSender = Settings.UseMeRecipientForMessages ? TextUtils.i18n('%MODULENAME%/LABEL_ME_SENDER') : null;
	this.sMeRecipient = Settings.UseMeRecipientForMessages ? TextUtils.i18n('%MODULENAME%/LABEL_ME_RECIPIENT') : null;

	this.fullDate = ko.observable('');
	this.midDate = ko.observable('');

	this.textBody = ko.observable('');
	this.textBodyForNewWindow = ko.observable('');
	this.domTextBody = ko.observable(null);
	this.rtlMessage = ko.observable(false);

	this.contentHasFocus = ko.observable(false);

	App.broadcastEvent('%ModuleName%::RegisterMessagePaneController', _.bind(function (oController, sPlace) {
		this.registerController(oController, sPlace);
	}, this));

	this.fakeHeader = ko.computed(function () {
		var topControllersVisible = !!_.find(this.topControllers(), function (oController) {
			return !!oController.visible && oController.visible();
		});
		return !(this.visiblePicturesControl() || this.visibleConfirmationControl() || topControllersVisible);
	}, this);

	this.sAttachmentsSwitcherViewTemplate = App.isMobile() ? '%ModuleName%_Message_AttachmentsSwitcherView' : '';
	this.sQuickReplyViewTemplate = App.isMobile() || !Settings.AllowQuickReply ? '' : '%ModuleName%_Message_QuickReplyView';

	this.attachments = ko.observableArray([]);
	this.notInlineAttachments = ko.computed(function () {
		return _.filter(this.attachments(), function (oAttach) {
			return !oAttach.linked();
		});
	}, this);
	this.notInlineAttachmentsInString = ko.computed(function () {
		return _.map(this.notInlineAttachments(), function (oAttachment) {
			return oAttachment.fileName();
		}, this).join(', ');
	}, this);

	this.allAttachmentsDownloadMethods = ko.observableArray([]);
	this.visibleDownloadAllAttachmentsSeparately = ko.computed(function () {
		return this.notInlineAttachments().length > 1;
	}, this);
	this.visibleExtendedDownload = ko.computed(function () {
		return this.visibleDownloadAllAttachmentsSeparately() || this.allAttachmentsDownloadMethods().length > 0;
	}, this);
	App.broadcastEvent('%ModuleName%::AddAllAttachmentsDownloadMethod', _.bind(function (oMethod) {
		this.allAttachmentsDownloadMethods.push(oMethod);
	}, this));

	this.detailsVisible = ko.observable(Storage.getData('MessageDetailsVisible') === '1');
	this.detailsTooltip = ko.computed(function () {
		return this.detailsVisible() ? TextUtils.i18n('COREWEBCLIENT/ACTION_HIDE_DETAILS') : TextUtils.i18n('COREWEBCLIENT/ACTION_SHOW_DETAILS');
	}, this);

	this.hasNotInlineAttachments = ko.computed(function () {
		return this.notInlineAttachments().length > 0;
	}, this);

	this.hasBodyText = ko.computed(function () {
		return this.textBody().length > 0;
	}, this);

	this.visibleAddMenu = ko.observable(false);

	// Quick Reply Part

	this.replyText = ko.observable('');
	this.replyTextFocus = ko.observable(false);
	this.replyPaneVisible = ko.computed(function () {
		return this.currentMessage() && this.currentMessage().completelyFilled();
	}, this);
	this.replySendingStarted = ko.observable(false);
	this.replySavingStarted = ko.observable(false);
	this.replyAutoSavingStarted = ko.observable(false);
	this.requiresPostponedSending = ko.observable(false);
	this.replyAutoSavingStarted.subscribe(function () {
		if (!this.replyAutoSavingStarted() && this.requiresPostponedSending())
		{
			SendingUtils.sendPostponedMail(this.replyDraftUid());
			this.requiresPostponedSending(false);
		}
	}, this);
	this.hasReplyAllCcAddrs = ko.observable(false);
	this.placeholderText = ko.computed(function () {
		return this.hasReplyAllCcAddrs() ? TextUtils.i18n('%MODULENAME%/LABEL_QUICK_REPLY_ALL') : TextUtils.i18n('%MODULENAME%/LABEL_QUICK_REPLY');
	}, this);
	this.sendButtonText = ko.computed(function () {
		return this.hasReplyAllCcAddrs() ? TextUtils.i18n('%MODULENAME%/ACTION_SEND_ALL') : TextUtils.i18n('%MODULENAME%/ACTION_SEND');
	}, this);

	ko.computed(function () {
		if (!this.replyTextFocus() || this.replyAutoSavingStarted() || this.replySavingStarted() || this.replySendingStarted())
		{
			this.stopAutosaveTimer();
		}
		if (this.replyTextFocus() && !this.replyAutoSavingStarted() && !this.replySavingStarted() && !this.replySendingStarted())
		{
			this.startAutosaveTimer();
		}
	}, this);

	this.saveButtonText = ko.computed(function () {
		return this.replyAutoSavingStarted() ? TextUtils.i18n('%MODULENAME%/ACTION_SAVE_IN_PROGRESS') : TextUtils.i18n('%MODULENAME%/ACTION_SAVE');
	}, this);
	this.replyDraftUid = ko.observable('');
	this.replyLoadingText = ko.computed(function () {
		if (this.replySendingStarted())
		{
			return TextUtils.i18n('COREWEBCLIENT/INFO_SENDING');
		}
		else if (this.replySavingStarted())
		{
			return TextUtils.i18n('%MODULENAME%/INFO_SAVING');
		}
		return '';
	}, this);

	this.isEnableSendQuickReply = ko.computed(function () {
		return this.isCurrentMessageLoaded() && this.replyText() !== '' && !this.replySendingStarted();
	}, this);
	this.isEnableSaveQuickReply = ko.computed(function () {
		return this.isEnableSendQuickReply() && !this.replySavingStarted() && !this.replyAutoSavingStarted();
	}, this);

	this.saveQuickReplyCommand = Utils.createCommand(this, this.executeSaveQuickReply, this.isEnableSaveQuickReply);
	this.sendQuickReplyCommand = Utils.createCommand(this, this.executeSendQuickReply, this.isEnableSendQuickReply);

	this.domMessageHeader = ko.observable(null);
	this.domQuickReply = ko.observable(null);

	this.domMessageForPrint = ko.observable(null);

	// to have time to take action "Open full reply form" before the animation starts
	this.replyTextFocusThrottled = ko.observable(false).extend({'throttle': 50});

	this.replyTextFocus.subscribe(function () {
		this.replyTextFocusThrottled(this.replyTextFocus());
	}, this);

	this.isQuickReplyActive = ko.computed(function () {
		return this.replyText().length > 0 || this.replyTextFocusThrottled();
	}, this);

	//*** Quick Reply Part

	this.jqPanelHelper = null;

	this.visibleAttachments = ko.observable(false);
	this.showMessage = function () {
		this.visibleAttachments(false);
	};
	this.showAttachments = function () {
		this.visibleAttachments(true);
	};

	this.sDefaultFontName = Settings.DefaultFontName;

	Pulse.registerDayOfMonthFunction(_.bind(this.updateMomentDate, this));

	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': 'CMessagePaneView', 'View': this});
}

_.extendOwn(CMessagePaneView.prototype, CAbstractScreenView.prototype);

CMessagePaneView.prototype.ViewTemplate = App.isNewTab() ? '%ModuleName%_MessagePaneScreenView' : '%ModuleName%_MessagePaneView';
CMessagePaneView.prototype.ViewConstructorName = 'CMessagePaneView';

/**
 * @param {object} oData
 * @param {object} oEvent
 */
CMessagePaneView.prototype.resizeDblClick = function (oData, oEvent)
{
	if (oEvent.target.className !== '' && !!oEvent.target.className.search(/add_contact|icon|link|title|subject|link|date|from/))
	{
		Utils.calmEvent(oEvent);
		Utils.removeSelection();
		if (!this.jqPanelHelper)
		{
			this.jqPanelHelper = $('.MailLayout .panel_helper');
		}
		this.jqPanelHelper.trigger('resize', [5, 'min', true]);
	}
};

CMessagePaneView.prototype.notifySender = function ()
{
	if (this.currentMessage() && this.currentMessage().readingConfirmationAddressee() !== '')
	{
		var sText = TextUtils.i18n('%MODULENAME%/LABEL_RETURN_RECEIPT_MAIL_TEXT', {
			'EMAIL': AccountList.getEmail(),
			'SUBJECT': this.subject()
		}).replace(/\\r\\n/g, '\n');
		Ajax.send('SendMessage', {
			'To': this.currentMessage().readingConfirmationAddressee(),
			'Subject': TextUtils.i18n('%MODULENAME%/LABEL_RETURN_RECEIPT_MAIL_SUBJECT'),
			'Text': sText,
			'ConfirmFolder': this.currentMessage().folder(),
			'ConfirmUid': this.currentMessage().uid()
		});
		this.currentMessage().readingConfirmationAddressee('');
	}
};

CMessagePaneView.prototype.onFolderListSubscribe = function ()
{
	if (App.isNewTab())
	{
		this.onMessagesSubscribe();
	}
};

CMessagePaneView.prototype.onMessagesSubscribe = function ()
{
	if (!this.currentMessage() && this.uid() && this.uid().length > 0)
	{
		MailCache.setCurrentMessage(this.accountId(), this.folder(), this.uid());
	}
};

/**
 * @param {string} sUniq
 */
CMessagePaneView.prototype.passReplyDataToNewTab = function (sUniq)
{
	if (this.currentMessage() && this.currentMessage().sUniq === sUniq && this.replyText() !== '')
	{
		MainTabExtMethods.passReplyData(sUniq, {
			'ReplyText': this.replyText(),
			'ReplyDraftUid': this.replyDraftUid()
		});

		this.replyText('');
		this.replyDraftUid('');
	}
};

CMessagePaneView.prototype.onCurrentMessageSubscribe = function ()
{
	var
		oMessage = this.currentMessage(),
		oAccount = oMessage ? AccountList.getAccount(oMessage.accountId()) : null,
		oReplyData = null
	;

	if (MainTab && oMessage)
	{
		oReplyData = MainTab.getReplyData(oMessage.sUniq);
		if (oReplyData)
		{
			this.replyText(oReplyData.ReplyText);
			this.replyDraftUid(oReplyData.ReplyDraftUid);
		}
	}
	else if (!oMessage || oMessage.uid() !== this.displayedMessageUid())
	{
		this.replyText('');
		this.replyDraftUid('');
	}

	if (oMessage && this.uid() === oMessage.uid())
	{
		this.hasReplyAllCcAddrs(SendingUtils.hasReplyAllCcAddrs(oMessage));

		this.subject(oMessage.subject());
		this.importance(oMessage.importance());
		this.from(oMessage.oFrom.getDisplay());
		this.fromEmail(oMessage.oFrom.getFirstEmail());

		this.fullFrom(oMessage.oFrom.getFull());
		if (oMessage.oFrom.aCollection.length > 0)
		{
			this.oFromAddr(oMessage.oFrom.aCollection[0]);
		}
		else
		{
			this.oFromAddr(null);
		}

		this.to(oMessage.oTo.getFull());
		this.aToAddr(oMessage.oTo.aCollection);
		this.cc(oMessage.oCc.getFull());
		this.aCcAddr(oMessage.oCc.aCollection);
		this.bcc(oMessage.oBcc.getFull());
		this.aBccAddr(oMessage.oBcc.aCollection);

		this.currentAccountEmail(oAccount.email());
		this.allRecipients(_.uniq(_.union(this.aToAddr(), this.aCcAddr(), this.aBccAddr())));

		this.midDate(oMessage.oDateModel.getMidDate());
		this.fullDate(oMessage.oDateModel.getFullDate());

		this.isLoading(oMessage.uid() !== '' && !oMessage.completelyFilled());

		this.setMessageBody();

		if (!Settings.DisableRtlRendering)
		{
			this.rtlMessage(oMessage.rtl());
		}

		if (App.isNewTab())
		{
			/*jshint onevar: false*/
			var aAtachments = [];
			/*jshint onevar: true*/

			_.each(oMessage.attachments(), _.bind(function (oAttach) {
				var oCopy = new CAttachmentModel(oAttach.iAccountId);
				oCopy.copyProperties(oAttach);
				aAtachments.push(oCopy);
			}, this));

			this.attachments(aAtachments);
		}
		else
		{
			this.attachments(oMessage.attachments());
		}

		if (!oMessage.completelyFilled() || oMessage.truncated())
		{
			/*jshint onevar: false*/
			var oSubscribedField = !oMessage.completelyFilled() ? oMessage.completelyFilled : oMessage.truncated;
			/*jshint onevar: true*/
			if (App.isNewTab())
			{
				oMessage.completelyFilledNewTabSubscription = oSubscribedField.subscribe(this.onCurrentMessageSubscribe, this);
			}
			else
			{
				oMessage.completelyFilledSubscription = oSubscribedField.subscribe(this.onCurrentMessageSubscribe, this);
			}
		}
		else if (oMessage.completelyFilledSubscription)
		{
			oMessage.completelyFilledSubscription.dispose();
			oMessage.completelyFilledSubscription = undefined;
		}
		else if (oMessage.completelyFilledNewTabSubscription)
		{
			oMessage.completelyFilledNewTabSubscription.dispose();
			oMessage.completelyFilledNewTabSubscription = undefined;
		}
	}
	else
	{
		this.hasReplyAllCcAddrs(false);

		this.isLoading(false);
		$(this.domTextBody()).empty().data('displayed-message-uid', '');
		this.displayedMessageUid('');
		this.rtlMessage(false);

		// cannot use removeAll, because the attachments of messages are passed by reference
		// and the call to removeAll removes attachments from message in the cache too.
		this.attachments([]);
		this.visiblePicturesControl(false);
		this.visibleShowPicturesLink(false);
	}

	this.doAfterPopulatingMessage();
};

CMessagePaneView.prototype.updateMomentDate = function ()
{
	var oMessage = this.currentMessage();
	if (oMessage && oMessage.oDateModel)
	{
		this.midDate(oMessage.oDateModel.getMidDate());
		this.fullDate(oMessage.oDateModel.getFullDate());
	}
};

CMessagePaneView.prototype.setMessageBody = function ()
{
	if (this.currentMessage())
	{
		var
			oMessage = this.currentMessage(),
			sText = oMessage.text(),
			$body = $(this.domTextBody()),
			oDom = null,
			sHtml = '',
			sLen = sText.length,
			sMaxLen = 5000000,
			aCollapsedStatuses = []
		;

		this.textBody(sText);

		if ($body.data('displayed-message-uid') === oMessage.uid())
		{
			aCollapsedStatuses = this.getBlockquotesStatus();
		}

		$body.empty();

		if (oMessage.isPlain() || sLen > sMaxLen)
		{
			$body.html(sText);

			this.visiblePicturesControl(false);
		}
		else
		{
			oDom = oMessage.getDomText();
			sHtml = oDom.length > 0 ? oDom.html() : '';

			$body.append(sHtml);

			this.visiblePicturesControl(oMessage.hasExternals() && !oMessage.isExternalsAlwaysShown());
			this.visibleShowPicturesLink(!oMessage.isExternalsShown());

			if (!TextUtils.htmlStartsWithBlockquote(sHtml))
			{
				this.doHidingBlockquotes(aCollapsedStatuses);
			}
		}

		$body.data('displayed-message-uid', oMessage.uid());
		this.displayedMessageUid(oMessage.uid());
	}
};

CMessagePaneView.prototype.getBlockquotesStatus = function ()
{
	var aCollapsedStatuses = [];

	$($('blockquote', $(this.domTextBody())).get()).each(function () {
		var $blockquote = $(this);

		if ($blockquote.hasClass('blockquote_before_toggle'))
		{
			aCollapsedStatuses.push($blockquote.hasClass('collapsed'));
		}
	});

	return aCollapsedStatuses;
};

/**
 * @param {Array} aCollapsedStatuses
 */
CMessagePaneView.prototype.doHidingBlockquotes = function (aCollapsedStatuses)
{
	var
		iMinHeightForHide = 120,
		iHiddenHeight = 80,
		iStatusIndex = 0
	;

	$($('blockquote', $(this.domTextBody())).get()).each(function () {
		var
			$blockquote = $(this),
			$parentBlockquotes = $blockquote.parents('blockquote'),
			$switchButton = $('<span class="blockquote_toggle"></span>').html(TextUtils.i18n('%MODULENAME%/ACTION_SHOW_QUOTED_TEXT')),
			bHidden = true
		;
		if ($parentBlockquotes.length === 0)
		{
			if ($blockquote.height() > iMinHeightForHide)
			{
				$blockquote
					.addClass('blockquote_before_toggle')
					.after($switchButton)
					.wrapInner('<div class="blockquote_content"></div>')
				;
				$switchButton.bind('click', function () {
					if (bHidden)
					{
						$blockquote.height('auto');
						$switchButton.html(TextUtils.i18n('%MODULENAME%/ACTION_HIDE_QUOTED_TEXT'));
						bHidden = false;
					}
					else
					{
						$blockquote.height(iHiddenHeight);
						$switchButton.html(TextUtils.i18n('%MODULENAME%/ACTION_SHOW_QUOTED_TEXT'));
						bHidden = true;
					}

					$blockquote.toggleClass('collapsed', bHidden);
				});
				if (iStatusIndex < aCollapsedStatuses.length)
				{
					bHidden = aCollapsedStatuses[iStatusIndex];
					iStatusIndex++;
				}
				$blockquote.height(bHidden ? iHiddenHeight : 'auto').toggleClass('collapsed', bHidden);
			}
		}
	});
};

/**
 * @param {Array} aParams
 */
CMessagePaneView.prototype.onRoute = function (aParams)
{
	var
		oParams = LinksUtils.parseMailbox(aParams),
		iMessageAccountId = 0,
		sFolder = oParams.Folder,
		sUid = oParams.Uid
	;

	AccountList.changeCurrentAccountByHash(oParams.AccountHash);
	iMessageAccountId = MailCache.currentAccountId();

	if (sFolder === MailCache.oUnifiedInbox.fullName() && Types.isNonEmptyString(sUid))
	{
		var aParts = sUid.split(':');
		iMessageAccountId = Types.pInt(aParts[0]);
		sFolder = 'INBOX';
		sUid = Types.pString(aParts[1]);
	}

	if (this.replyText() !== '' && this.uid() !== sUid)
	{
		this.saveReplyMessage(false);
	}

	this.accountId(iMessageAccountId);
	this.uid(sUid);
	this.folder(sFolder);
	MailCache.setCurrentMessage(this.accountId(), this.folder(), this.uid());

	this.contentHasFocus(true);
};

CMessagePaneView.prototype.showPictures = function ()
{
	MailCache.showExternalPictures(false);
	this.visibleShowPicturesLink(false);
	this.setMessageBody();
};

CMessagePaneView.prototype.alwaysShowPictures = function ()
{
	var sEmail = this.currentMessage() ? this.currentMessage().oFrom.getFirstEmail() : '';

	if (sEmail.length > 0)
	{
		Ajax.send('SetEmailSafety', {'Email': sEmail});
	}

	MailCache.showExternalPictures(true);
	this.visiblePicturesControl(false);
	this.setMessageBody();
};

CMessagePaneView.prototype.openInNewWindow = function ()
{
	this.openMessageInNewWindowBound(this.currentMessage());
};

CMessagePaneView.prototype.getReplyHtmlText = function ()
{
	return '<div style="font-family: ' + this.sDefaultFontName + '; font-size: 16px">' + SendingUtils.getHtmlFromText(this.replyText()) + '</div>';
};

/**
 * @param {string} sReplyType
 */
CMessagePaneView.prototype.executeReplyOrForward = function (sReplyType)
{
	if (this.currentMessage())
	{
		SendingUtils.setReplyData(this.getReplyHtmlText(), this.replyDraftUid());

		this.replyText('');
		this.replyDraftUid('');

		ComposeUtils.composeMessageAsReplyOrForward(sReplyType, this.currentMessage().accountId(), this.currentMessage().folder(), this.currentMessage().uid());
	}
};

CMessagePaneView.prototype.executeDeleteMessage = function ()
{
	if (this.currentMessage())
	{
		if (MainTab)
		{
			MainTab.deleteMessage(this.currentMessage().uid(), function () { window.close(); });
		}
		else if (App.isMobile())
		{
			MailUtils.deleteMessages([this.currentMessage().uid()], App);
		}
	}
};

CMessagePaneView.prototype.executePrevMessage = function ()
{
	if (this.isEnablePrevMessage())
	{
		Routing.setHash(LinksUtils.getViewMessage(MailCache.currentAccountId(), MailCache.getCurrentFolderFullname(), this.prevMessageUid()));
	}
};

CMessagePaneView.prototype.executeNextMessage = function ()
{
	if (this.isEnableNextMessage())
	{
		Routing.setHash(LinksUtils.getViewMessage(MailCache.currentAccountId(), MailCache.getCurrentFolderFullname(), this.nextMessageUid()));
	}
};

CMessagePaneView.prototype.executeReply = function ()
{
	this.executeReplyOrForward(Enums.ReplyType.Reply);
};

CMessagePaneView.prototype.executeReplyAll = function ()
{
	this.executeReplyOrForward(Enums.ReplyType.ReplyAll);
};

CMessagePaneView.prototype.executeResend = function ()
{
	this.executeReplyOrForward(Enums.ReplyType.Resend);
};

CMessagePaneView.prototype.executeForward = function ()
{
	this.executeReplyOrForward(Enums.ReplyType.Forward);
};

CMessagePaneView.prototype.executePrint = function ()
{
	var
		oMessage = this.currentMessage(),
		oWin = oMessage ? WindowOpener.open('', this.subject() + '-print') : null,
		sHtml = ''
	;

	if (oMessage && oWin)
	{
		this.textBodyForNewWindow(oMessage.getConvertedHtml(UrlUtils.getAppPath(), true));
		sHtml = $(this.domMessageForPrint()).html();

		$(oWin.document.body).html(sHtml);
		oWin.print();
	}
};

CMessagePaneView.prototype.executeSave = function ()
{
	if (this.isEnableSave() && this.currentMessage())
	{
		UrlUtils.downloadByUrl(this.currentMessage().sDownloadAsEmlUrl, true);
	}
};

CMessagePaneView.prototype.executeForwardAsAttachment = function ()
{
	if (this.currentMessage())
	{
		ComposeUtils.composeMessageWithEml(this.currentMessage());
	}
};

CMessagePaneView.prototype.changeAddMenuVisibility = function ()
{
	var bVisibility = !this.visibleAddMenu();
	this.visibleAddMenu(bVisibility);
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CMessagePaneView.prototype.onSendOrSaveMessageResponse = function (oResponse, oRequest)
{
	var oResData = SendingUtils.onSendOrSaveMessageResponse(oResponse, oRequest, this.requiresPostponedSending());
	switch (oResData.Method)
	{
		case 'SendMessage':
			this.replySendingStarted(false);
			if (oResData.Result)
			{
				this.replyText('');
			}
			break;
		case 'SaveMessage':
			if (oResData.Result)
			{
				this.replyDraftUid(oResData.NewUid);
			}
			this.replySavingStarted(false);
			this.replyAutoSavingStarted(false);
			break;
	}
};

CMessagePaneView.prototype.executeSendQuickReply = function ()
{
	if (this.isEnableSendQuickReply())
	{
		this.replySendingStarted(true);
		this.requiresPostponedSending(this.replyAutoSavingStarted());
		SendingUtils.sendReplyMessage('SendMessage', this.getReplyHtmlText(), this.replyDraftUid(),
			this.onSendOrSaveMessageResponse, this, this.requiresPostponedSending());

		this.replyTextFocus(false);
	}
};

CMessagePaneView.prototype.executeSaveQuickReply = function ()
{
	this.saveReplyMessage(false);
};

/**
 * @param {Boolean} bAutosave
 */
CMessagePaneView.prototype.saveReplyMessage = function (bAutosave)
{
	if (this.isEnableSaveQuickReply())
	{
		if (bAutosave)
		{
			this.replyAutoSavingStarted(true);
		}
		else
		{
			this.replySavingStarted(true);
		}
		SendingUtils.sendReplyMessage('SaveMessage', this.getReplyHtmlText(), this.replyDraftUid(),
			this.onSendOrSaveMessageResponse, this);
	}
};

/**
 * Stops autosave.
 */
CMessagePaneView.prototype.stopAutosaveTimer = function ()
{
	window.clearTimeout(this.autoSaveTimer);
};

/**
 * Starts autosave.
 */
CMessagePaneView.prototype.startAutosaveTimer = function ()
{
	if (this.isEnableSaveQuickReply())
	{
		var fSave = _.bind(this.saveReplyMessage, this, true);
		this.stopAutosaveTimer();
		if (Settings.AllowAutosaveInDrafts)
		{
			this.autoSaveTimer = window.setTimeout(fSave, Settings.AutoSaveIntervalSeconds * 1000);
		}
	}
};

CMessagePaneView.prototype.executeAllAttachmentsDownloadMethod = function (fHandler)
{
	if (this.currentMessage())
	{
		fHandler(this.currentMessage().accountId(), this.currentMessage().getAttachmentsHashes());
	}
};

CMessagePaneView.prototype.downloadAllAttachmentsSeparately = function ()
{
	if (this.currentMessage())
	{
		this.currentMessage().downloadAllAttachmentsSeparately();
	}
};

CMessagePaneView.prototype.onShow = function ()
{
	this.bShown = true;
};

CMessagePaneView.prototype.onHide = function ()
{
	this.bShown = false;
	_.each(this.controllers(), _.bind(function (oController) {
		if ($.isFunction(oController.onHide))
		{
			oController.onHide();
		}
	}, this));
};

/**
 * @param {Object} $MailViewDom
 */
CMessagePaneView.prototype.onBind = function ($MailViewDom)
{
	ModulesManager.run('SessionTimeoutWeblient', 'registerFunction', [_.bind(function () {
		if (this.replyText() !== '')
		{
			this.saveReplyMessage(false);
		}
	}, this)]);

	this.$MailViewDom = _.isUndefined($MailViewDom) ? this.$viewDom : $MailViewDom;

	this.$MailViewDom.on('mousedown', 'a', function (oEvent) {
		if (oEvent && 3 !== oEvent['which'])
		{
			var sHref = $(this).attr('href');
			if (sHref && 'mailto:' === sHref.toString().toLowerCase().substr(0, 7))
			{
				ComposeUtils.composeMessageToAddresses(sHref.toString());
				return false;
			}
		}

		return true;
	});

	if (!App.isMobile())
	{
		this.hotKeysBind();
	}
};

CMessagePaneView.prototype.hotKeysBind = function ()
{
	$(document).on('keydown', $.proxy(function(ev) {

		var	bComputed = this.bShown && ev && !ev.ctrlKey && !ev.shiftKey &&
			!Utils.isTextFieldFocused() && this.isEnableReply();

		if (bComputed && ev.keyCode === Enums.Key.q)
		{
			ev.preventDefault();
			this.replyTextFocus(true);
		}
		else if (bComputed && ev.keyCode === Enums.Key.r)
		{
			ev.preventDefault();
			this.executeReply();
		}
	}, this));
};

CMessagePaneView.prototype.showSourceHeaders = function ()
{
	var
		oMessage = this.currentMessage(),
		oWin = oMessage && oMessage.completelyFilled() ? WindowOpener.open('', this.subject() + '-headers') : null
	;

	if (oWin)
	{
		$(oWin.document.body).html('<pre>' + TextUtils.encodeHtml(oMessage.sourceHeaders()) + '</pre>');
	}
};

CMessagePaneView.prototype.switchDetailsVisibility = function ()
{
	this.detailsVisible(!this.detailsVisible());
	Storage.setData('MessageDetailsVisible', this.detailsVisible() ? '1' : '0');
};

/**
 * @param {Object} oController
 * @param {string} sPlace
 */
CMessagePaneView.prototype.registerController = function (oController, sPlace) {
	switch (sPlace)
	{
		case 'BeforeMessageHeaders':
			this.topControllers.push(oController);
			break
		case 'BeforeMessageBody':
			this.bodyControllers.push(oController);
			break
		case 'AfterMessageBody':
			this.bottomControllers.push(oController);
			break;
	}

	if ($.isFunction(oController.assignMessagePaneExtInterface))
	{
		oController.assignMessagePaneExtInterface(this.getExtInterface());
	}
};

/**
 * @returns {Object}
 */
CMessagePaneView.prototype.getExtInterface = function ()
{
	return {
		changeText: _.bind(function (sText) {
			var oMessage = this.currentMessage();
			if (oMessage && this.isCurrentMessageLoaded())
			{
				oMessage.changeText(sText);
				this.setMessageBody();
			}
		}, this)
	};
};

CMessagePaneView.prototype.doAfterPopulatingMessage = function ()
{
	var
		oMessage = this.currentMessage(),
		bLoaded = oMessage && !this.isLoading(),
		oMessageProps = bLoaded ? {
			iAccountId: oMessage.accountId(),
			sFolderFullName: oMessage.folder(),
			sMessageUid: oMessage.uid(),
			aToEmails: oMessage.oTo.getEmails(),
			bPlain: oMessage.isPlain(),
			sRawText: oMessage.textRaw(),
			sText: oMessage.text(),
			sAccountEmail: AccountList.getEmail(oMessage.accountId()),
			sFromEmail: oMessage.oFrom.getFirstEmail(),
			iSensitivity: oMessage.sensitivity(),
			aExtend: oMessage.aExtend
		} : null
	;

	_.each(this.controllers(), _.bind(function (oController) {
		if ($.isFunction(oController.doAfterPopulatingMessage))
		{
			oController.doAfterPopulatingMessage(oMessageProps);
		}
	}, this));

	ModulesManager.run('ContactsWebclient', 'applyContactsCards', [this.$MailViewDom.find('span.address')]);
};

CMessagePaneView.prototype.searchBySubject = function ()
{
	if (Settings.AllowSearchMessagesBySubject && this.currentMessage())
	{
		var
			sFolder = this.currentMessage().folder(),
			iPage = 1,
			sUid = this.currentMessage().uid(),
			sSearch = '',
			sFilters = '',

			sSubject = this.currentMessage().subject(),
			aSubject = sSubject.split(':'),
			aPrefixes = Settings.PrefixesToRemoveBeforeSearchMessagesBySubject,
			aSearch = []
		;

		if (aPrefixes.length === 0)
		{
			sSearch = aSubject;
		}
		else
		{
			_.each(aSubject, function (sSubjPart) {
				if (aSearch.length > 0)
				{
					aSearch.push(sSubjPart);
				}
				else
				{
					var hasPrefix = false;
					var sTrimSubjPart = $.trim(sSubjPart);
					_.each(aPrefixes, function (sPref) {
						var re = new RegExp('^' + sPref + '(\\[\\d*\\]){0,1}$', 'i');
						hasPrefix = hasPrefix || re.test(sTrimSubjPart);
					});
					if (!hasPrefix) {
						aSearch.push(sSubjPart);
					}
				}
			});
			sSearch = $.trim(aSearch.join(':'));
		}

		Routing.setHash(LinksUtils.getMailbox(sFolder, iPage, sUid, sSearch, sFilters));
	}
};

module.exports = new CMessagePaneView();
