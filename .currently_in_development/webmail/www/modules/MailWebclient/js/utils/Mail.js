'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
			
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	UrlUtils = require('%PathToCoreWebclientModule%/js/utils/Url.js'),
	
	Storage = require('%PathToCoreWebclientModule%/js/Storage.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),

	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	MailCache = require('modules/%ModuleName%/js/Cache.js'),
	
	MailUtils = {}
;

/**
 * Moves the specified messages in the current folder to the Trash or delete permanently 
 * if the current folder is Trash or Spam.
 * 
 * @param {Array} aUids
 * @param {Function=} fAfterDelete
 */
MailUtils.deleteMessages = function (aUids, fAfterDelete)
{
	if (!$.isFunction(fAfterDelete))
	{
		fAfterDelete = function () {};
	}
	
	var
		oFolderList = MailCache.folderList(),
		sCurrFolder = oFolderList.currentFolderFullName(),
		oTrash = oFolderList.trashFolder(),
		bInTrash =(oTrash && sCurrFolder === oTrash.fullName()),
		oSpam = oFolderList.spamFolder(),
		bInSpam = (oSpam && sCurrFolder === oSpam.fullName()),
		fDeleteMessages = function (bResult) {
			if (bResult)
			{
				MailCache.deleteMessages(aUids);
				fAfterDelete();
			}
		}
	;

	if (bInSpam || bInTrash)
	{
		Popups.showPopup(ConfirmPopup, [
			TextUtils.i18n('%MODULENAME%/CONFIRM_DELETE_MESSAGES_PLURAL', {}, null, aUids.length), 
			fDeleteMessages, '', TextUtils.i18n('COREWEBCLIENT/ACTION_DELETE')
		]);
	}
	else
	{
		if (MailCache.oUnifiedInbox.selected())
		{
			MailUtils.deleteMessagesFromUnifiedInbox(aUids, fAfterDelete);
		}
		else
		{
			if (oTrash)
			{
				MailCache.moveMessagesToFolder(oFolderList.currentFolder(), oTrash, aUids);
				fAfterDelete();
			}
			else
			{
				Popups.showPopup(ConfirmPopup, [TextUtils.i18n('%MODULENAME%/CONFIRM_MESSAGES_DELETE_NO_TRASH_FOLDER'), fDeleteMessages]);
			}
		}
	}
};

MailUtils.deleteMessagesFromUnifiedInbox = function (aUids, fAfterDelete)
{
	var
		bMoved = false,
		bDeleteAsked = false,
		oUidsByAccounts = MailCache.getUidsSeparatedByAccounts(aUids),
		fDeleteMessages = function (oAccInbox, aUidsByAccount, bResult) {
			if (bResult)
			{
				MailCache.deleteMessagesFromFolder(oAccInbox, aUidsByAccount);
				fAfterDelete();
			}
		}
	;

	_.each(oUidsByAccounts, function (oData) {
		var
			aUidsByAccount = oData.Uids,
			iAccountId = oData.AccountId,
			oFolderList = MailCache.oFolderListItems[iAccountId],
			oAccount = AccountList.getAccount(iAccountId),
			oAccTrash = oFolderList ? oFolderList.trashFolder() : null,
			oAccInbox = oFolderList ? oFolderList.inboxFolder() : null
		;
		if (oAccInbox)
		{
			if (oAccTrash)
			{
				MailCache.moveMessagesToFolder(oAccInbox, oAccTrash, aUidsByAccount);
				bMoved = true;
			}
			else
			{
				Popups.showPopup(ConfirmPopup, [
					TextUtils.i18n('%MODULENAME%/CONFIRM_MESSAGES_DELETE_NO_TRASH_FOLDER'),
					fDeleteMessages.bind(null, oAccInbox, aUidsByAccount),
					oAccount ? oAccount.fullEmail() : ''
				]);
				bDeleteAsked = true;
			}
		}
	});

	if (bMoved && !bDeleteAsked)
	{
		fAfterDelete();
	}
};

MailUtils.isAvailableRegisterMailto = function ()
{
	return window.navigator && $.isFunction(window.navigator.registerProtocolHandler);
};

MailUtils.registerMailto = function (bRegisterOnce)
{
	if (MailUtils.isAvailableRegisterMailto() && (!bRegisterOnce || Storage.getData('MailtoAsked') !== true))
	{
		window.navigator.registerProtocolHandler(
			'mailto',
			UrlUtils.getAppPath() + '#mail/compose/to/%s',
			UserSettings.SiteName !== '' ? UserSettings.SiteName : 'WebMail'
		);

		Storage.setData('MailtoAsked', true);
	}
};

module.exports = MailUtils;
