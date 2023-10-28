'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	ErrorsUtils = require('modules/%ModuleName%/js/utils/Errors.js'),
	
	Enums = require('modules/%ModuleName%/js/Enums.js'),
	OpenPgp = require('modules/%ModuleName%/js/OpenPgp.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

function CMessageControlsView()
{
	this.sText = '';
	this.sAccountEmail = '';
	this.sFromEmail = '';
	
	this.oEncryptionKey = null;
	
	this.isEncryptedMessage = ko.observable(false);
	this.visibleDecryptControl = ko.observable(false);
	this.visibleVerifyControl = ko.observable(false);
}

CMessageControlsView.prototype.ViewTemplate = '%ModuleName%_MessageControlsView';

CMessageControlsView.prototype.reset = function ()
{
	this.sText = '';
	this.sAccountEmail = '';
	this.sFromEmail = '';
	
	this.isEncryptedMessage(false);
	this.visibleDecryptControl(false);
	this.visibleVerifyControl(false);
};

/**
 * Assigns message pane external interface.
 * 
 * @param {Object} oMessagePane Message pane external interface.
 * @param {Function} oMessagePane.changeText(sText) Function changes displaying text in message pane and in message too so exactly this text will be shown next time.
 */
CMessageControlsView.prototype.assignMessagePaneExtInterface = function (oMessagePane)
{
	this.oMessagePane = oMessagePane;
};

/**
 * Receives properties of the message that is displaying in the message pane. 
 * It is called every time the message is changing in the message pane.
 * Receives null if there is no message in the pane.
 * 
 * @param {Object|null} oMessageProps Information about message in message pane.
 * @param {Boolean} oMessageProps.bPlain **true**, if displaying message is plain.
 * @param {String} oMessageProps.sRawText Raw plain text of message.
 * @param {String} oMessageProps.sText Prepared for displaying plain text of message.
 * @param {String} oMessageProps.sAccountEmail Email of account that received message.
 * @param {String} oMessageProps.sFromEmail Message sender email.
 */
CMessageControlsView.prototype.doAfterPopulatingMessage = function (oMessageProps)
{
	if (oMessageProps && oMessageProps.bPlain)
	{
		this.sText = oMessageProps.sRawText;
		this.sAccountEmail = oMessageProps.sAccountEmail;
		this.sFromEmail = oMessageProps.sFromEmail;

		if (Settings.enableOpenPgp())
		{
			this.isEncryptedMessage(oMessageProps.sText.indexOf('-----BEGIN PGP MESSAGE-----') !== -1);
			this.visibleVerifyControl(oMessageProps.sText.indexOf('-----BEGIN PGP SIGNED MESSAGE-----') !== -1);
			if (this.isEncryptedMessage())
			{
				OpenPgp.getEncryptionKeyFromArmoredMessage(this.sText)
					.then(oEncryptionKey => {
						if (oEncryptionKey)
						{
							this.visibleDecryptControl(true);
							this.oEncryptionKey = oEncryptionKey;
						}
						else
						{
							this.visibleDecryptControl(false);
						}
					});
			}
			this.visibleDecryptControl(this.isEncryptedMessage());
		}
		else
		{
			this.visibleDecryptControl(false);
		}
		if ((this.visibleVerifyControl() || this.visibleDecryptControl()) && this.oMessagePane)
		{
			this.oMessagePane.changeText('<pre>' + TextUtils.encodeHtml(this.sText) + '</pre>');
		}
	}
	else
	{
		this.reset();
	}
};

CMessageControlsView.prototype.decryptMessage = function ()
{
	var
		fOkHandler = _.bind(function (oRes) {
			if (oRes && oRes.result && !oRes.errors && this.oMessagePane)
			{
				this.oMessagePane.changeText('<pre>' + TextUtils.encodeHtml(oRes.result) + '</pre>');

				this.isEncryptedMessage(false);
				this.visibleDecryptControl(false);

				if (!oRes.notices)
				{
					Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_MESSAGE_SUCCESSFULLY_DECRYPTED_AND_VERIFIED'));
				}
				else
				{
					Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_MESSAGE_SUCCESSFULLY_DECRYPTED_BUT_NOT_VERIFIED'));
				}
			}
		}, this),
		fErrorHandler = function (oRes) {
			if (oRes && (oRes.errors || oRes.notices))
			{
				var bNoSignDataNotice = ErrorsUtils.showPgpErrorByCode(oRes, Enums.PgpAction.DecryptVerify);
				if (bNoSignDataNotice)
				{
					Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_MESSAGE_SUCCESSFULLY_DECRYPTED_AND_NOT_SIGNED'));
				}
			}
		}
	;
	
	OpenPgp.decryptAndVerify(this.sText, this.oEncryptionKey, this.sFromEmail, '', fOkHandler, fErrorHandler);
};

CMessageControlsView.prototype.verifyMessage = function ()
{
	var
		fOkHandler = _.bind(function (oRes) {
			if (oRes && oRes.result && !(oRes.errors || oRes.notices) && this.oMessagePane)
			{
				this.oMessagePane.changeText('<pre>' + TextUtils.encodeHtml(oRes.result) + '</pre>');

				this.visibleVerifyControl(false);

				Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_MESSAGE_SUCCESSFULLY_VERIFIED'));
			}
		}, this),
		fErrorHandler = function (oRes) {
			if (oRes && (oRes.errors || oRes.notices))
			{
				ErrorsUtils.showPgpErrorByCode(oRes, Enums.PgpAction.Verify);
			}
		}
	;
	
	OpenPgp.verify(this.sText, this.sFromEmail, fOkHandler, fErrorHandler);
};

module.exports = new CMessageControlsView();
