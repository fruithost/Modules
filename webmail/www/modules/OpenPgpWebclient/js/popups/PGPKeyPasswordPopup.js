'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js')
;

/**
 * @constructor
 */
function PGPKeyPasswordPopup()
{
	CAbstractPopup.call(this);

	this.keyPassword = ko.observable('');
	this.keyPasswordDom = ko.observable(null);
	this.keyPasswordFocused = ko.observable(false);
	this.fOnPasswordEnterCallback = null;
	this.fOnCancellCallback = null;
	this.sHintText = ko.observable('');
}

_.extendOwn(PGPKeyPasswordPopup.prototype, CAbstractPopup.prototype);

PGPKeyPasswordPopup.prototype.PopupTemplate = '%ModuleName%_PGPKeyPasswordPopup';

PGPKeyPasswordPopup.prototype.onOpen = function (sKeyName, fOnPasswordEnterCallback, fOnCancellCallback)
{
	this.sHintText(TextUtils.i18n(
		'%MODULENAME%/LABEL_ENTER_YOUR_PASSWORD',
		{'KEY': sKeyName}
	));
	this.fOnPasswordEnterCallback = fOnPasswordEnterCallback;
	this.fOnCancellCallback = fOnCancellCallback;
	this.keyPasswordFocused(true);
};

PGPKeyPasswordPopup.prototype.enterPassword = function ()
{
	if (_.isFunction(this.fOnPasswordEnterCallback))
	{
		// sometimes nockoutjs conflicts with saved passwords in FF
		this.keyPassword($(this.keyPasswordDom()).val());
		this.fOnPasswordEnterCallback(this.keyPassword());
	}
	this.closePopup();
	return false; // stopPropagation
};

PGPKeyPasswordPopup.prototype.cancelPopup = function ()
{
	if (_.isFunction(this.fOnCancellCallback))
	{
		this.fOnCancellCallback();
	}
	this.closePopup();
};

PGPKeyPasswordPopup.prototype.onShow = function ()
{
	this.keyPassword('');
};

module.exports = new PGPKeyPasswordPopup();
