'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	ComposeMessageWithData = ModulesManager.run('MailWebclient', 'getComposeMessageWithData'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js')
;

/**
 * @constructor
 */
function SendKeyPopup()
{
	CAbstractPopup.call(this);

	this.bAllowSendEmails = _.isFunction(ComposeMessageWithData);
	this.sEmail = ko.observable('');
	this.oMessage = ko.observable(null);
	this.sSendKeyText = ko.observable('');
	this.oPublicKey = null;
	this.downloadLinkFilename = ko.observable('');
}

_.extendOwn(SendKeyPopup.prototype, CAbstractPopup.prototype);

SendKeyPopup.prototype.PopupTemplate = '%ModuleName%_SendKeyPopup';

/**
 * @param {string} oMessage
 * @param {object} oPublicKey
 */
SendKeyPopup.prototype.onOpen = function (oMessage, oPublicKey)
{
	this.oMessage(oMessage);
	this.sEmail(oMessage.oFrom.getFirstEmail());
	this.sSendKeyText(TextUtils.i18n('%MODULENAME%/INFO_SEND_KEY', {'EMAIL': this.sEmail()}));
	this.oPublicKey = oPublicKey;
	var sConvertedUser = this.oPublicKey.getUser().replace(/</g, '').replace(/>/g, '');
	this.downloadLinkFilename(TextUtils.i18n('%MODULENAME%/TEXT_PUBLIC_KEY_FILENAME', {'USER': sConvertedUser}) + '.asc');
};

SendKeyPopup.prototype.sendKey = async function ()
{
	if (this.bAllowSendEmails && this.oPublicKey.getArmor() !== '' && this.downloadLinkFilename() !== '')
	{
		Ajax.send(
			'Core',
			'SaveContentAsTempFile',
			{
				'Content': this.oPublicKey.getArmor(),
				'FileName': this.downloadLinkFilename()
			},
			oResponse => {
				if (oResponse.Result)
				{
					ComposeMessageWithData({
						attachments: [oResponse.Result],
						replyToMessage: this.oMessage()
					});
					this.closePopup();
				}
			},
			this
		);
	}
};

module.exports = new SendKeyPopup();
