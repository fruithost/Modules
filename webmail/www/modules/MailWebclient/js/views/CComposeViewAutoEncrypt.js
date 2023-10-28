'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	AddressUtils = require('%PathToCoreWebclientModule%/js/utils/Address.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	
	SendingUtils = require('modules/%ModuleName%/js/utils/Sending.js')
;

function CComposeViewAutoEncrypt()
{
	this.recipientsInfo = ko.observable({});
	this.autoEncryptSignMessage = ko.observable(false);
}

CComposeViewAutoEncrypt.prototype.setAutoEncryptSubscribes = function ()
{
	this.hasRecipientsWithKey = ko.computed(function () {
		return !!_.find(this.recipientsInfo(), function (oRecipientInfo) {
			return oRecipientInfo.hasKey && (oRecipientInfo.encryptMessage || oRecipientInfo.signMessage) && _.indexOf(this.recipientEmails(), oRecipientInfo.email) !== -1;
		}.bind(this));
	}, this).extend({ throttle: 10 });
	this.allowAtoEncryptSignMessage = ko.computed(function () {
		return this.hasRecipientsWithKey() && !this.messageSignedOrEncrypted();
	}, this);
	this.allowAtoEncryptSignMessage.subscribe(function () {
		this.autoEncryptSignMessage(this.allowAtoEncryptSignMessage());
	}, this);

	this.recipientEmails.subscribe(function () {
		var
			aInfoKeys = _.keys(this.recipientsInfo()),
			aDiff = _.difference(this.recipientEmails(), aInfoKeys)
		;
		if (aDiff.length > 0)
		{
			ModulesManager.run('ContactsWebclient', 'getContactsByEmails', [aDiff, function (oContacts) {
				_.each(_.values(oContacts), function (oContact) {
					if (oContact)
					{
						this.recipientsInfo()[oContact.email()] = {
							email: oContact.email(),
							encryptMessage: oContact.pgpEncryptMessages(),
							hasKey: typeof oContact.publicPgpKey() === 'string' && oContact.publicPgpKey() !== '',
							id: oContact.uuid(),
							label: oContact.email(),
							name: oContact.displayName(),
							sharedToAll: oContact.sharedToAll(),
							signMessage: oContact.pgpSignMessages(),
							storage: oContact.storage(),
							team: oContact.team(),
							value: oContact.email()
						};
					}
				}.bind(this));
				$(this.toAddrDom()).inputosaurus('refresh');
				$(this.ccAddrDom()).inputosaurus('refresh');
				$(this.bccAddrDom()).inputosaurus('refresh');
				this.recipientsInfo.valueHasMutated();
			}.bind(this)]);
		}
	}, this);
};

CComposeViewAutoEncrypt.prototype.getInputosaurusMethods = function ()
{
	return {
		addRecipientInfo: function (oRecipientInfo) {
			var oRecipient = AddressUtils.getEmailParts(oRecipientInfo.value);
			this.recipientsInfo()[oRecipient.email] = oRecipientInfo;
			this.recipientsInfo.valueHasMutated();
		}.bind(this),
		getRecipientPgpKeyHtml: function (sFullEmail) {
			var
				oRecipient = AddressUtils.getEmailParts(sFullEmail),
				oRecipientInfo = this.recipientsInfo()[oRecipient.email],
				bHasKey = !!oRecipientInfo && !!oRecipientInfo.hasKey,
				sKeyHtml = '',
				sEncryptTitle = null,
				sSignTitle = null
			;
			if (bHasKey)
			{
				sKeyHtml += '<span class="address_capsule_key address_capsule_key_unset"></span>';
				if (oRecipientInfo.encryptMessage)
				{
					sEncryptTitle = TextUtils.i18n('%MODULENAME%/HINT_MESSAGE_ENCRYPT_WITH_KEY');
					sKeyHtml += '<span class="address_capsule_key address_capsule_key_encrypt" title="' + sEncryptTitle + '"></span>';
				}
				else
				{
					sKeyHtml += '<span class="address_capsule_key address_capsule_key_not_encrypt"></span>';
				}
				if (oRecipientInfo.signMessage)
				{
					sSignTitle = TextUtils.i18n('%MODULENAME%/HINT_MESSAGE_SIGN_WITH_KEY');
					sKeyHtml += '<span class="address_capsule_key address_capsule_key_sign" title="' + sSignTitle + '"></span>';
				}
			}
			return sKeyHtml;
		}.bind(this)
	};
};

CComposeViewAutoEncrypt.prototype.groupAllRecipients = function (aRecipients)
{
	var
		aRecipientsSimple = [],
		aRecipientsEncrypt = [],
		aRecipientsSign = [],
		aRecipientsSignEncrypt = [],
		iSendingCount = 0
	;
	_.each(aRecipients, function (sRecipient) {
		var oRecipientInfo = this.recipientsInfo()[sRecipient];
		if (oRecipientInfo && oRecipientInfo.hasKey)
		{
			if (oRecipientInfo.encryptMessage)
			{
				if (oRecipientInfo.signMessage)
				{
					aRecipientsSignEncrypt.push(sRecipient);
				}
				else
				{
					aRecipientsEncrypt.push(sRecipient);
				}
			}
			else if (oRecipientInfo.signMessage)
			{
				aRecipientsSign.push(sRecipient);
			}
			else
			{
				aRecipientsSimple.push(sRecipient);
			}
		}
		else
		{
			aRecipientsSimple.push(sRecipient);
		}
	}.bind(this));
	
	if (aRecipientsSimple.length > 0)
	{
		iSendingCount++;
	}
	if (aRecipientsEncrypt.length > 0)
	{
		iSendingCount++;
	}
	if (aRecipientsSign.length > 0)
	{
		iSendingCount++;
	}
	if (aRecipientsSignEncrypt.length > 0)
	{
		iSendingCount++;
	}
	
	return {
		simple: aRecipientsSimple,
		encrypt: aRecipientsEncrypt,
		sign: aRecipientsSign,
		signEncrypt: aRecipientsSignEncrypt,
		simpleCount: aRecipientsSimple.length,
		encryptCount: aRecipientsEncrypt.length,
		signCount: aRecipientsSign.length,
		signEncryptCount: aRecipientsSignEncrypt.length,
		groupCount: iSendingCount
	};
};

CComposeViewAutoEncrypt.prototype.confirmNotAllRecipientsEncryptSign = function (oRecipients, fCallBack)
{
	var sConfirm = null;
	if (oRecipients.simpleCount > 0)
	{
		if (oRecipients.encryptCount > 0 || oRecipients.signEncryptCount > 0)
		{
			sConfirm = TextUtils.i18n('%MODULENAME%/CONFIRM_ENCRYPT_NOT_ALL_RECIPIENTS');
		}
		else if (oRecipients.signCount > 0)
		{
			sConfirm = TextUtils.i18n('%MODULENAME%/CONFIRM_SIGN_NOT_ALL_RECIPIENTS');
		}
	}
	else
	{
		if (oRecipients.signCount > 0 && (oRecipients.encryptCount > 0 || oRecipients.signEncryptCount > 0))
		{
			sConfirm = TextUtils.i18n('%MODULENAME%/CONFIRM_ENCRYPT_NOT_ALL_RECIPIENTS');
		}
		else if (oRecipients.signCount === 0 && oRecipients.encryptCount > 0 && oRecipients.signEncryptCount > 0)
		{
			sConfirm = TextUtils.i18n('%MODULENAME%/CONFIRM_SIGN_NOT_ALL_RECIPIENTS');
		}
	}
	
	if (sConfirm !== null)
	{
		Popups.showPopup(ConfirmPopup, [sConfirm, fCallBack, '', TextUtils.i18n('%MODULENAME%/ACTION_PROCEED_SENDING')]);
	}
	else
	{
		fCallBack(true);
	}
};

CComposeViewAutoEncrypt.prototype.proceedEncryptSignAndSend = function (oRecipients, sFromEmail, sPassword)
{
	var
		sData = this.oHtmlEditor.getPlainText(),
		oSendParameters = this.getSendSaveParameters(true),
		aInfoToSend = [],
		fOkCallback = function (aRecipients, bAddToSentFolder, sRes, bEncrypt) {
			var oCloneSendParameters = _.clone(oSendParameters);
			oCloneSendParameters.Text = sRes;
			oCloneSendParameters.IsHtml = false;
			oCloneSendParameters.Recipients = aRecipients;
			fContinueSending(oCloneSendParameters, bAddToSentFolder);
		},
		fContinueSending = _.bind(function (oSendParameters, bAddToSentFolder) {
			aInfoToSend.push({
				oSendParameters: oSendParameters,
				bAddToSentFolder: bAddToSentFolder
			});
			if (aInfoToSend.length === oRecipients.groupCount)
			{
				this.sending(true);
				this.requiresPostponedSending(!this.allowStartSending());
				this.backToListOnSendOrSave(true);
				_.each(aInfoToSend, function (oInfoToSend) {
					SendingUtils.send('SendMessage', oInfoToSend.oSendParameters, true, this.onSendOrSaveMessageResponse, 
							this, this.requiresPostponedSending(), oInfoToSend.bAddToSentFolder);
				}.bind(this));
			}
		}, this)
	;
	if (oRecipients.simpleCount > 0)
	{
		var oCloneSendParameters = _.clone(oSendParameters);
		oCloneSendParameters.Recipients = oRecipients.simple;
		fContinueSending(oCloneSendParameters, oRecipients.signCount === 0 && oRecipients.encryptCount === 0 && oRecipients.signEncryptCount === 0);
	}
	if (oRecipients.signCount > 0)
	{
		ModulesManager.run('OpenPgpWebclient', 'encryptSign', [false, true, sData, oRecipients.sign, 
			fOkCallback.bind(this, oRecipients.sign, oRecipients.encryptCount === 0 && oRecipients.signEncryptCount === 0), sFromEmail, sPassword]);
	}
	if (oRecipients.encryptCount > 0)
	{
		ModulesManager.run('OpenPgpWebclient', 'encryptSign', [true, false, sData, oRecipients.encrypt,
			fOkCallback.bind(this, oRecipients.encrypt, oRecipients.signEncryptCount === 0), sFromEmail]);
	}
	if (oRecipients.signEncryptCount > 0)
	{
		ModulesManager.run('OpenPgpWebclient', 'encryptSign', [true, true, sData, oRecipients.signEncrypt, 
			fOkCallback.bind(this, oRecipients.signEncrypt, true), sFromEmail, sPassword]);
	}
};

CComposeViewAutoEncrypt.prototype.encryptSignAndSend = function ()
{
	var
		sFromEmail = this.selectedFetcherOrIdentity().email(),
		aRecipients = this.recipientEmails(),
		oRecipients = this.groupAllRecipients(aRecipients)
	;
	this.confirmNotAllRecipientsEncryptSign(oRecipients, function (bProceed) {
		if (bProceed)
		{
			if (oRecipients.signCount > 0 || oRecipients.signEncryptCount > 0)
			{
				ModulesManager.run('OpenPgpWebclient', 'getPrivateKeyPassword', [sFromEmail, function (sPassword) {
					this.proceedEncryptSignAndSend(oRecipients, sFromEmail, sPassword);
				}.bind(this)]);
			}
			else
			{
				this.proceedEncryptSignAndSend(oRecipients, sFromEmail);
			}
		}
	}.bind(this));
};

module.exports = CComposeViewAutoEncrypt;
