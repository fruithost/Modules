'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),

	AddressUtils = require('%PathToCoreWebclientModule%/js/utils/Address.js'),
	FilesUtils = require('%PathToCoreWebclientModule%/js/utils/Files.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),

	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Browser = require('%PathToCoreWebclientModule%/js/Browser.js'),
	CJua = require('%PathToCoreWebclientModule%/js/CJua.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	WindowOpener = require('%PathToCoreWebclientModule%/js/WindowOpener.js'),

	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),

	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	AlertPopup = require('%PathToCoreWebclientModule%/js/popups/AlertPopup.js'),
	SelectFilesPopup = ModulesManager.run('FilesWebclient', 'getSelectFilesPopup'),

	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),
	SendingUtils = require('modules/%ModuleName%/js/utils/Sending.js'),

	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	CoreAjax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	MailCache = require('modules/%ModuleName%/js/Cache.js'),
	MainTabExtMethods = require('modules/%ModuleName%/js/MainTabExtMethods.js'),
	SenderSelector = require('modules/%ModuleName%/js/SenderSelector.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),

	CMessageModel = require('modules/%ModuleName%/js/models/CMessageModel.js'),
	CAttachmentModel = require('modules/%ModuleName%/js/models/CAttachmentModel.js'),

	CComposeViewAutoEncrypt = require('modules/%ModuleName%/js/views/CComposeViewAutoEncrypt.js'),
	CHtmlEditorView = require('modules/%ModuleName%/js/views/CHtmlEditorView.js'),

	MainTab = App.isNewTab() && window.opener && window.opener.MainTabMailMethods,

	$html = $('html')
;

/**
 * @constructor
 */
function CComposeView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	CComposeViewAutoEncrypt.call(this);

	this.browserTitle = ko.computed(function () {
		return AccountList.getEmail() + ' - ' + TextUtils.i18n('%MODULENAME%/HEADING_COMPOSE_BROWSER_TAB');
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
				Screens.showLoading(TextUtils.i18n('%MODULENAME%/INFO_ATTACHMENTS_LOADING'));
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

	this.sHotkeysHintsViewTemplate = !Browser.mobileDevice ? '%ModuleName%_Compose_HotkeysHintsView' : '';
	this.sPopupButtonsViewTemplate = !App.isNewTab() ? '%ModuleName%_Compose_PopupButtonsView' : '';

	this.aHotkeys = [
		{ value: 'Ctrl+S', action: TextUtils.i18n('%MODULENAME%/LABEL_SAVE_HOTKEY'), visible: this.draftFolderIsAvailable },
		{ value: 'Ctrl+Z', action: TextUtils.i18n('%MODULENAME%/LABEL_UNDO_HOTKEY'), visible: ko.observable(true) },
		{ value: 'Ctrl+Y', action: TextUtils.i18n('%MODULENAME%/LABEL_REDO_HOTKEY'), visible: ko.observable(true) },
		{ value: 'Ctrl+K', action: TextUtils.i18n('%MODULENAME%/LABEL_LINK_HOTKEY'), visible: ko.observable(true) },
		{ value: 'Ctrl+B', action: TextUtils.i18n('%MODULENAME%/LABEL_BOLD_HOTKEY'), visible: ko.observable(true) },
		{ value: 'Ctrl+I', action: TextUtils.i18n('%MODULENAME%/LABEL_ITALIC_HOTKEY'), visible: ko.observable(true) },
		{ value: 'Ctrl+U', action: TextUtils.i18n('%MODULENAME%/LABEL_UNDERLINE_HOTKEY'), visible: ko.observable(true) }
	];

	if (Settings.AllowQuickSendOnCompose)
	{
		this.aHotkeys.unshift({ value: 'Ctrl+Enter', action: TextUtils.i18n('%MODULENAME%/LABEL_SEND_HOTKEY'), visible: ko.observable(true) });
	}

	this.bAllowFiles = !!SelectFilesPopup;

	this.ignoreHasUnsavedChanges = ko.observable(false);
	this.changedInPreviousWindow = ko.observable(false);

	this.hasUnsavedChanges = ko.computed(function () {
		return !this.ignoreHasUnsavedChanges() && this.isChanged() && this.isEnableSaving();
	}, this);

	this.saveAndCloseTooltip = ko.computed(function () {
		return this.draftFolderIsAvailable() && this.hasUnsavedChanges() ? TextUtils.i18n('%MODULENAME%/ACTION_SAVE_CLOSE') : TextUtils.i18n('%MODULENAME%/ACTION_CLOSE');
	}, this);

	this.splitterDom = ko.observable();

	this.headersCompressed = ko.observable(false);
	this.allowCcBccSwitchers = ko.computed(function () {
		return !this.disableHeadersEdit() && !this.headersCompressed();
	}, this);

	this.registerOwnToolbarControllers();

	this.setAutoEncryptSubscribes();

	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
}

_.extendOwn(CComposeView.prototype, CAbstractScreenView.prototype);
_.extendOwn(CComposeView.prototype, CComposeViewAutoEncrypt.prototype);

CComposeView.prototype.ViewTemplate = App.isNewTab() ? '%ModuleName%_ComposeScreenView' : '%ModuleName%_ComposeView';
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
			App.broadcastEvent('%ModuleName%::ComposeMessageLoaded', oParams);
		}
		else
		{
			var oSubscription = this.allAttachmentsUploaded.subscribe(function () {
				if (this.allAttachmentsUploaded())
				{
					App.broadcastEvent('%ModuleName%::ComposeMessageLoaded', oParams);
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
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_UPLOAD_FORWARD_ATTACHMENTS'));
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
		sWarning = TextUtils.i18n('%MODULENAME%/ERROR_INPUT_CORRECT_EMAILS') + aEncodedIncorrect.join(', ')
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
		ViewTemplate: '%ModuleName%_Compose_BackButtonView',
		sId: 'back',
		bOnlyMobile: true,
		backToListCommand: this.backToListCommand
	});
	this.registerToolbarController({
		ViewTemplate: '%ModuleName%_Compose_SendButtonView',
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
		ViewTemplate: '%ModuleName%_Compose_SaveButtonView',
		sId: 'save',
		bAllowMobile: true,
		visible: this.draftFolderIsAvailable,
		saveCommand: this.saveCommand
	});
	this.registerToolbarController({
		ViewTemplate: '%ModuleName%_Compose_SaveTemplateButtonView',
		sId: 'save-template',
		bAllowMobile: false,
		visible: this.visibleSaveTemplateControl,
		saveTemplateCommand: this.saveTemplateCommand
	});
	this.registerToolbarController({
		ViewTemplate: '%ModuleName%_Compose_ImportanceDropdownView',
		sId: 'importance',
		selectedImportance: this.selectedImportance
	});
	this.registerToolbarController({
		ViewTemplate: '%ModuleName%_Compose_ConfirmationCheckboxView',
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
