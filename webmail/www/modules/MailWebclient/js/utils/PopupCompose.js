'use strict';

var
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	
	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),
	
	PopupComposeUtils = {}
;

function GetComposePopup()
{
	return require('modules/%ModuleName%/js/popups/ComposePopup.js');
}

PopupComposeUtils.composeMessage = function ()
{
	Popups.showPopup(GetComposePopup());
};

/**
 * @param {int} iAccountId
 * @param {string} sFolder
 * @param {string} sUid
 */
PopupComposeUtils.composeMessageFromDrafts = function (iAccountId, sFolder, sUid)
{
	var aParams = LinksUtils.getComposeFromMessage('drafts', iAccountId, sFolder, sUid);
	aParams.shift();
	Popups.showPopup(GetComposePopup(), [aParams]);
};

/**
 * @param {string} sReplyType
 * @param {int} iAccountId
 * @param {string} sFolder
 * @param {string} sUid
 */
PopupComposeUtils.composeMessageAsReplyOrForward = function (sReplyType, iAccountId, sFolder, sUid)
{
	var aParams = LinksUtils.getComposeFromMessage(sReplyType, iAccountId, sFolder, sUid);
	aParams.shift();
	Popups.showPopup(GetComposePopup(), [aParams]);
};

/**
 * @param {string} sToAddresses
 */
PopupComposeUtils.composeMessageToAddresses = function (sToAddresses)
{
	var aParams = LinksUtils.getComposeWithToField(sToAddresses);
	aParams.shift();
	Popups.showPopup(GetComposePopup(), [aParams]);
};

PopupComposeUtils.composeMessageWithData = function (oData)
{
	var aParams = LinksUtils.getComposeWithData(oData);
	aParams.shift();
	Popups.showPopup(GetComposePopup(), [aParams]);
};

/**
 * @param {Object} oMessage
 */
PopupComposeUtils.composeMessageWithEml = function (oMessage)
{
	var aParams = LinksUtils.getComposeWithEmlObject(oMessage.accountId(), oMessage.folder(), oMessage.uid(), oMessage);
	aParams.shift();
	Popups.showPopup(GetComposePopup(), [aParams]);
};

/**
 * @param {Array} aFileItems
 */
PopupComposeUtils.composeMessageWithAttachments = function (aFileItems)
{
	var aParams = LinksUtils.getComposeWithObject('attachments', aFileItems);
	aParams.shift();
	Popups.showPopup(GetComposePopup(), [aParams]);
};

PopupComposeUtils.closeComposePopup = function (iAccountId)
{
	var ComposePopup = GetComposePopup();
	if (ComposePopup.opened() && (!iAccountId || ComposePopup.senderAccountId() === iAccountId))
	{
		Popups.showPopup(ComposePopup, [['close']]);
	}
};

module.exports = PopupComposeUtils;