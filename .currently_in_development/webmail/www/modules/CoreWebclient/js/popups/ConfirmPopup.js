'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js')
;

/**
 * @constructor
 */
function CConfirmPopup()
{
	CAbstractPopup.call(this);
	
	this.fConfirmCallback = null;
	this.confirmDesc = ko.observable('');
	this.popupHeading = ko.observable('');
	this.okButtonText = ko.observable(TextUtils.i18n('%MODULENAME%/ACTION_OK'));
	this.cancelButtonText = ko.observable(TextUtils.i18n('%MODULENAME%/ACTION_CANCEL'));
	this.shown = false;
}

_.extendOwn(CConfirmPopup.prototype, CAbstractPopup.prototype);

CConfirmPopup.prototype.PopupTemplate = 'CoreWebclient_ConfirmPopup';

/**
 * @param {string} sDesc
 * @param {Function} fConfirmCallback
 * @param {string=} sHeading = ''
 * @param {string=} sOkButtonText = ''
 * @param {string=} sCancelButtonText = ''
 */
CConfirmPopup.prototype.onOpen = function (sDesc, fConfirmCallback, sHeading, sOkButtonText, sCancelButtonText)
{
	this.confirmDesc(sDesc);
	this.popupHeading(sHeading || '');
	this.okButtonText(sOkButtonText || TextUtils.i18n('%MODULENAME%/ACTION_OK'));
	this.cancelButtonText(sCancelButtonText || TextUtils.i18n('%MODULENAME%/ACTION_CANCEL'));
	if ($.isFunction(fConfirmCallback))
	{
		this.fConfirmCallback = fConfirmCallback;
	}
	this.shown = true;
};

CConfirmPopup.prototype.onHide = function ()
{
	this.shown = false;
};

CConfirmPopup.prototype.onEnterHandler = function ()
{
	this.yesClick();
};

CConfirmPopup.prototype.yesClick = function ()
{
	if (this.shown && this.fConfirmCallback)
	{
		this.fConfirmCallback(true);
	}

	this.closePopup();
};

CConfirmPopup.prototype.cancelPopup = function ()
{
	if (this.fConfirmCallback)
	{
		this.fConfirmCallback(false);
	}

	this.closePopup();
};

module.exports = new CConfirmPopup();
