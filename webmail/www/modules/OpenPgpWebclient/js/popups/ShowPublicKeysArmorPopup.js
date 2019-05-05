'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
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
	
	this.armors = ko.observable('');
	this.htmlArmor = ko.computed(function () {
		return TextUtils.encodeHtml(this.armors().replace(/\r/g, ''));
	}, this);
	this.popupHeading = ko.computed(function () {
		return TextUtils.i18n('%MODULENAME%/HEADING_VIEW_ALL_PUBLIC_KEYS');
	}, this);
	
	this.downloadLinkHref = ko.computed(function() {
		var
			sHref = '#',
			oBlob = null
		;
		
		if (Blob && window.URL && $.isFunction(window.URL.createObjectURL))
		{
			oBlob = new Blob([this.armors()], {type: 'text/plain'});
			sHref = window.URL.createObjectURL(oBlob);
		}
		
		return sHref;
	}, this);
	
	this.downloadLinkFilename = ko.computed(function () {
		return TextUtils.i18n('%MODULENAME%/TEXT_ALL_PUBLIC_KEYS_FILENAME') + '.asc';
	}, this);
	
	this.domKey = ko.observable(null);
}

_.extendOwn(CShowKeyArmorPopup.prototype, CAbstractPopup.prototype);

CShowKeyArmorPopup.prototype.PopupTemplate = '%ModuleName%_ShowKeyArmorPopup';

/**
 * @param {string} sArmors
 */
CShowKeyArmorPopup.prototype.onOpen = function (sArmors)
{
	this.armors(sArmors);
};

CShowKeyArmorPopup.prototype.send = function ()
{
	if (this.bAllowSendEmails && this.armors() !== '' && this.downloadLinkFilename() !== '')
	{
		Ajax.send('Core', 'SaveContentAsTempFile', { 'Content': this.armors(), 'FileName': this.downloadLinkFilename() }, function (oResponse) {
			if (oResponse.Result)
			{
				ComposeMessageWithAttachments([oResponse.Result]);
				this.closePopup();
			}
		}, this);
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
