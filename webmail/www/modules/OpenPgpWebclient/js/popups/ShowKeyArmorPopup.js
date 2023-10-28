'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),

	ComposeMessageWithAttachments = ModulesManager.run('MailWebclient', 'getComposeMessageWithAttachments'),

	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js')
;

/**
 * @constructor
 */
function CShowKeyArmorPopup()
{
	CAbstractPopup.call(this);

	this.bAllowSendEmails = _.isFunction(ComposeMessageWithAttachments);

	this.armor = ko.observable('');
	this.htmlArmor = ko.computed(function () {
		return TextUtils.encodeHtml(this.armor().replace(/\r/g, ''));
	}, this);
	this.user = ko.observable('');
	this.private = ko.observable(false);
	this.popupHeading = ko.computed(function () {
		return this.private() ?
			TextUtils.i18n('%MODULENAME%/HEADING_VIEW_PRIVATE_KEY', {'USER': this.user()}) :
			TextUtils.i18n('%MODULENAME%/HEADING_VIEW_PUBLIC_KEY', {'USER': this.user()});
	}, this);

	this.downloadLinkHref = ko.computed(function() {
		var
			sHref = '#',
			oBlob = null
		;

		if (Blob && window.URL && $.isFunction(window.URL.createObjectURL))
		{
			oBlob = new Blob([this.armor()], {type: 'text/plain'});
			sHref = window.URL.createObjectURL(oBlob);
		}

		return sHref;
	}, this);

	this.downloadLinkFilename = ko.computed(function () {
		var
			sConvertedUser = this.user().replace(/</g, '').replace(/>/g, ''),
			sLangKey = this.private() ? '%MODULENAME%/TEXT_PRIVATE_KEY_FILENAME' : '%MODULENAME%/TEXT_PUBLIC_KEY_FILENAME'
		;
		return TextUtils.i18n(sLangKey, {'USER': sConvertedUser}) + '.asc';
	}, this);

	this.domKey = ko.observable(null);
}

_.extendOwn(CShowKeyArmorPopup.prototype, CAbstractPopup.prototype);

CShowKeyArmorPopup.prototype.PopupTemplate = '%ModuleName%_ShowKeyArmorPopup';

/**
 * @param {Object} oKey
 */
CShowKeyArmorPopup.prototype.onOpen = function (oKey)
{
	this.armor(oKey.getArmor());
	this.user(oKey.getUser());
	this.private(oKey.isPrivate());
};

CShowKeyArmorPopup.prototype.send = function ()
{
	const fSend = () => {
		if (this.bAllowSendEmails
			&& this.armor() !== ''
			&& this.downloadLinkFilename() !== ''
		)
		{
			Ajax.send('Core', 'SaveContentAsTempFile', { 'Content': this.armor(), 'FileName': this.downloadLinkFilename() }, function (oResponse) {
				if (oResponse.Result)
				{
					ComposeMessageWithAttachments([oResponse.Result]);
					this.closePopup();
				}
			}, this);
		}
	};

	if (this.private())
	{
		const sConfirm = TextUtils.i18n('%MODULENAME%/CONFIRM_SEND_PRIVATE_KEY');
		Popups.showPopup(ConfirmPopup,
			[
				sConfirm,
				bSend => {
					if (bSend)
					{
						fSend();
					}
				}
			]
		);
	}
	else
	{
		fSend();
	}
};

CShowKeyArmorPopup.prototype.select = function ()
{
	var
		oDomKey = (this.domKey() && this.domKey().length === 1) ? this.domKey()[0] : null,
		oSel = null,
		oRange = null
	;

	if (oDomKey && window.getSelection && document.createRange)
	{
		oRange = document.createRange();
		oRange.setStart(oDomKey, 0);
		oRange.setEnd(oDomKey, 1);
		oSel = window.getSelection();
		oSel.removeAllRanges();
		oSel.addRange(oRange);
		if (document.queryCommandSupported('copy'))
		{
			document.execCommand('copy');
			Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_KEY_IN_CLIPBOARD'));
		}
	}
};

module.exports = new CShowKeyArmorPopup();
