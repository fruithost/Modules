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
 * @param {string} sFolder
 * @param {string} sUid
 */
PopupComposeUtils.composeMessageFromDrafts = function (sFolder, sUid)
{
	var aParams = LinksUtils.getComposeFromMessage('drafts', sFolder, sUid);
	aParams.shift();
	Popups.showPopup(GetComposePopup(), [aParams]);
};

/**
 * @param {string} sReplyType
 * @param {string} sFolder
 * @param {string} sUid
 */
PopupComposeUtils.composeMessageAsReplyOrForward = function (sReplyType, sFolder, sUid)
{
	var aParams = LinksUtils.getComposeFromMessage(sReplyType, sFolder, sUid);
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

/**
 * @param {Object} oMessage
 */
PopupComposeUtils.composeMessageWithEml = function (oMessage)
{
	var aParams = LinksUtils.getComposeWithEmlObject(oMessage.folder(), oMessage.uid(), oMessage);
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

PopupComposeUtils.closeComposePopup = function ()
{
	Popups.showPopup(GetComposePopup(), [['close']]);
};

module.exports = PopupComposeUtils;