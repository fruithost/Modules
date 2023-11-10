'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	
	ErrorsUtils = require('modules/%ModuleName%/js/utils/Errors.js'),
	
	Enums = require('modules/%ModuleName%/js/Enums.js'),
	OpenPgp = require('modules/%ModuleName%/js/OpenPgp.js')
;

/**
 * @constructor
 */
function CEncryptPopup()
{
	CAbstractPopup.call(this);
	
	this.bMobile = App.isMobile();
	
	this.data = ko.observable('');
	this.fromEmail = ko.observable('');
	this.emails = ko.observableArray([]);
	this.okCallback = null;
	this.cancelCallback = null;
	this.sign = ko.observable(true);
	this.encrypt = ko.observable(true);
	this.signEncryptButtonText = ko.computed(function () {
		var sText = TextUtils.i18n('%MODULENAME%/ACTION_SIGN_ENCRYPT');
		if (this.sign() && !this.encrypt())
		{
			sText = TextUtils.i18n('%MODULENAME%/ACTION_SIGN');
		}
		if (!this.sign() && this.encrypt())
		{
			sText = TextUtils.i18n('%MODULENAME%/ACTION_ENCRYPT');
		}
		return sText;
	}, this);
	this.isEnableSignEncrypt = ko.computed(function () {
		return this.sign() || this.encrypt();
	}, this);
	this.signEncryptCommand = Utils.createCommand(this, this.executeSignEncrypt, this.isEnableSignEncrypt);
	this.signAndSend = ko.observable(false);
}

_.extendOwn(CEncryptPopup.prototype, CAbstractPopup.prototype);

CEncryptPopup.prototype.PopupTemplate = '%ModuleName%_EncryptPopup';

/**
 * @param {string} sData
 * @param {string} sFromEmail
 * @param {Array} aEmails
 * @param {boolean} bSignAndSend
 * @param {Function} fOkCallback
 * @param {Function} fCancelCallback
 */
CEncryptPopup.prototype.onOpen = function (sData, sFromEmail, aEmails, bSignAndSend, fOkCallback, fCancelCallback)
{
	this.data(sData);
	this.fromEmail(sFromEmail);
	this.emails(aEmails);
	this.okCallback = fOkCallback;
	this.cancelCallback = fCancelCallback;
	this.sign(true);
	this.encrypt(!bSignAndSend);
	this.signAndSend(bSignAndSend);
};

CEncryptPopup.prototype.executeSignEncrypt = function ()
{
	var
		sData = this.data(),
		sPrivateEmail = this.sign() ? this.fromEmail() : '',
		aPrincipalsEmail = this.emails(),
		sOkReport = '',
		sPgpAction = '',
		fOkHandler = _.bind(function (oRes) {
			this.closePopup();
			if (this.okCallback)
			{
				if (!this.signAndSend())
				{
					Screens.showReport(sOkReport);
				}
				this.okCallback(oRes.result, this.encrypt());
			}
		}, this),
		fErrorHandler = function (oRes) {
			if (!oRes || !oRes.userCanceled)
			{
				ErrorsUtils.showPgpErrorByCode(oRes, sPgpAction);
			}
		}
	;
	
	if (this.encrypt())
	{
		if (aPrincipalsEmail.length === 0)
		{
			Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_TO_ENCRYPT_SPECIFY_RECIPIENTS'));
		}
		else
		{
			var
				aUserEmail = [this.fromEmail()],
				aEmailForEncrypt = OpenPgp.findKeysByEmails(aUserEmail, true).length > 0 ? _.union(aPrincipalsEmail, aUserEmail) : aPrincipalsEmail
			;
			if (this.sign())
			{
				sPgpAction = Enums.PgpAction.EncryptSign;
				sOkReport = TextUtils.i18n('%MODULENAME%/REPORT_MESSAGE_SIGNED_ENCRYPTED_SUCCSESSFULLY');
				OpenPgp.signAndEncrypt(sData, sPrivateEmail, aEmailForEncrypt, '', fOkHandler, fErrorHandler);
			}
			else
			{
				sPgpAction = Enums.PgpAction.Encrypt;
				sOkReport = TextUtils.i18n('%MODULENAME%/REPORT_MESSAGE_ENCRYPTED_SUCCSESSFULLY');
				OpenPgp.encrypt(sData, aEmailForEncrypt, fOkHandler, fErrorHandler);
			}
		}
	}
	else if (this.sign())
	{
		sPgpAction = Enums.PgpAction.Sign;
		sOkReport = TextUtils.i18n('%MODULENAME%/REPORT_MESSAGE_SIGNED_SUCCSESSFULLY');
		OpenPgp.sign(sData, sPrivateEmail, fOkHandler, fErrorHandler, '');
	}
};

CEncryptPopup.prototype.cancelPopup = function ()
{
	if (this.cancelCallback)
	{
		this.cancelCallback();
	}
	
	this.closePopup();
};

module.exports = new CEncryptPopup();
