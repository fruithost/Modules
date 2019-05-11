'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	MailCache = null
;

function GetPlainText(sHtml)
{
	if (typeof(sHtml) !=='string')
	{
		return '';
	}
	
	var fReplacer = function (sMatch, sLink, sLinkName) {
		var sClearLink = sLink.replace(/(\w{3,4}:\/\/)(.*)/, '$2');
		return (sLink === sLinkName || sClearLink === sLinkName) ? sLink : sLinkName + ' (' + sLink + ')';
	};
	
	return sHtml
		.replace(/\r\n/g, ' ')
		.replace(/\n/g, ' ')
		.replace(/<style[^>]*>[^<]*<\/style>/gi, '\n')
		.replace(/<br *\/{0,1}>/gi, '\n')
		.replace(/<\/p>/gi, '\n')
		.replace(/(<\/div>)*$/, '')
		.replace(/<(\/div>)+/gi, '\n')
		.replace(/<a [^>]*href="([^"]*?)"[^>]*>(.*?)<\/a>/gi, fReplacer)
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
	;
};

/**
 * @constructor
 * @param {object} oMailCache
 * @param {function} fRouteMessageView
 */
function CMessagePaneView(oMailCache, fRouteMessageView)
{
	MailCache = oMailCache;
	this.fRouteMessageView = fRouteMessageView;
	this.currentMessage = MailCache.currentMessage;
	this.currentMessage.subscribe(this.onCurrentMessageSubscribe, this);
	this.messageText = ko.observable('');
	this.messageText.focused = ko.observable(false);
	ko.computed(function () {
		this.messageText();
		this.messageText.focused(true);
	}, this).extend({ throttle: 5 }); ;
	this.sMessageUid = '';
	this.sMessageText = '';
	this.isLoading = ko.observable(false);
	this.isSaving = ko.observable(false);
	this.createMode = ko.observable(false);
	this.saveButtonText = ko.computed(function () {
		return this.isSaving() ? TextUtils.i18n('COREWEBCLIENT/ACTION_SAVE_IN_PROGRESS') : TextUtils.i18n('COREWEBCLIENT/ACTION_SAVE');
	}, this);
	
	this.bBinded = false;
}

CMessagePaneView.prototype.ViewTemplate = '%ModuleName%_MessagePaneView';
CMessagePaneView.prototype.ViewConstructorName = 'CMessagePaneView';

CMessagePaneView.prototype.onShow = function ()
{
	this.bShown = true;
};

CMessagePaneView.prototype.onHide = function ()
{
	this.bShown = false;
};

/**
 * Checks if there are changes in message pane.
 * @returns {Boolean}
 */
CMessagePaneView.prototype.hasUnsavedChanges = function ()
{
	var oMessage = this.currentMessage();
	return (!oMessage || this.sMessageUid === oMessage.uid()) && this.sMessageText !== this.messageText();
};

/**
 * Discards changes in message pane.
 */
CMessagePaneView.prototype.discardChanges = function ()
{
	if (!this.currentMessage())
	{
		this.sMessageUid = '';
		this.sMessageText = '';
		this.messageText('');
	}
};

CMessagePaneView.prototype.getSubjectFromText = function (sText)
{
	var
		aText = sText.split(/\r\n|\n/i),
		sSubject = _.find(aText, function (sTextPart) {
			return $.trim(sTextPart) !== '';
		})
	;
	
	sSubject = $.trim(sSubject);
	if (sSubject.length > 50)
	{
		sSubject = sSubject.substring(0, 50);
	}
	
	return sSubject;
};

CMessagePaneView.prototype.onCurrentMessageSubscribe = function ()
{
	var oMessage = this.currentMessage();
	
	if (oMessage)
	{
		if (oMessage.isPlain())
		{
			this.messageText(oMessage.textRaw());
		}
		else
		{
			this.messageText(GetPlainText(oMessage.textRaw()));
		}
		this.sMessageUid = oMessage.uid();
		this.sMessageText = this.messageText();
		this.isLoading(oMessage.uid() !== '' && !oMessage.completelyFilled());
		if (!oMessage.completelyFilled())
		{
			var sbscr = oMessage.completelyFilled.subscribe(function () {
				this.onCurrentMessageSubscribe();
				sbscr.dispose();
			}, this);
		}
		this.isSaving(false);
	}
	else
	{
		this.sMessageUid = '';
		this.sMessageText = '';
		this.messageText('');
	}
};

/**
 * @param {Object} $MailViewDom
 */
CMessagePaneView.prototype.onBind = function ($MailViewDom)
{
	if (!this.bBinded)
	{
		ModulesManager.run('SessionTimeoutWeblient', 'registerFunction', [_.bind(function () {
			this.saveNote();
		}, this)]);

		$(document).on('keydown', $.proxy(function(ev) {
			if (ev.ctrlKey && ev.keyCode === Enums.Key.s)
			{
				ev.preventDefault();
				this.saveNote();
			}
		}, this));

		this.bBinded = true;
	}
};

CMessagePaneView.prototype.onRoute = function (aParams, oParams)
{
	MailCache.setCurrentMessage(oParams.Uid, oParams.Folder);
	if (oParams.Custom === 'create-note')
	{
		this.messageText('');
		this.createMode(true);
	}
	else
	{
		this.createMode(false);
	}
	this.isSaving(false);
};

CMessagePaneView.prototype.saveNote = function ()
{
	if (this.createMode())
	{
		this.saveNewNote();
	}
	else
	{
		this.saveEditedNote();
	}
};

CMessagePaneView.prototype.saveNewNote = function ()
{
	var
		oFolder = MailCache.getCurrentFolder(),
		oParameters = {
			'AccountId': MailCache.currentAccountId(),
			'FolderFullName': oFolder.fullName(),
			'Text': this.messageText().replace(/\n/g, '<br />').replace(/\r\n/g, '<br />'),
			'Subject': this.getSubjectFromText(this.messageText())
		}
	;
	this.isSaving(true);
	this.sMessageText = this.messageText();
	Ajax.send('%ModuleName%', 'SaveNote', oParameters, function (oResponse) {
		this.isSaving(false);
		if (oResponse.Result)
		{
			if (this.bShown)
			{
				var sbscr = MailCache.messagesLoading.subscribe(function () {
					if (this.bShown && !MailCache.messagesLoading() && !this.currentMessage())
					{
						this.fRouteMessageView(oParameters.FolderFullName, oResponse.Result);
						sbscr.dispose();
					}
				}, this);
			}
		}
		else
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_NOTE_SAVING'));
		}
		MailCache.executeCheckMail(true);
	}, this);
};

CMessagePaneView.prototype.saveEditedNote = function (oMessage)
{
	if (!oMessage)
	{
		oMessage = this.currentMessage();
	}
	if (oMessage)
	{
		var
			oParameters = {
				'AccountId': MailCache.currentAccountId(),
				'FolderFullName': oMessage.folder(),
				'MessageUid': oMessage.uid(),
				'Text': this.messageText().replace(/\n/g, '<br />').replace(/\r\n/g, '<br />'),
				'Subject': this.getSubjectFromText(this.messageText())
			},
			oFolder = MailCache.getFolderByFullName(MailCache.currentAccountId(), oMessage.folder())
		;
		oFolder.markDeletedByUids([oMessage.uid()]);
		MailCache.excludeDeletedMessages();
		this.isSaving(true);
		this.sMessageText = this.messageText();
		Ajax.send('%ModuleName%', 'SaveNote', oParameters, function (oResponse) {
			this.isSaving(false);
			if (oResponse.Result)
			{
				if (this.bShown)
				{
					var sbscr = MailCache.messagesLoading.subscribe(function () {
						if (this.bShown && !MailCache.messagesLoading() && !this.currentMessage())
						{
							this.fRouteMessageView(oParameters.FolderFullName, oResponse.Result);
							sbscr.dispose();
						}
					}, this);
				}
			}
			else
			{
				Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_NOTE_SAVING'));
			}
			MailCache.executeCheckMail(true);
		}, this);
	}
};

CMessagePaneView.prototype.cancel = function ()
{
	this.sMessageText = this.messageText();
	ModulesManager.run('MailWebclient', 'setCustomRouting', ['Notes', 1, '', '', '', '']);
};

module.exports = CMessagePaneView;
