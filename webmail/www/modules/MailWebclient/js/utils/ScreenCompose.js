'use strict';

var
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	
	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),
	
	ScreenComposeUtils = {}
;

ScreenComposeUtils.composeMessage = function ()
{
	Routing.setHash(LinksUtils.getCompose());
};

/**
 * @param {int} iAccountId
 * @param {string} sFolder
 * @param {string} sUid
 */
ScreenComposeUtils.composeMessageFromDrafts = function (iAccountId, sFolder, sUid)
{
	var aParams = LinksUtils.getComposeFromMessage('drafts', iAccountId, sFolder, sUid);
	Routing.setHash(aParams);
};

/**
 * @param {string} sReplyType
 * @param {int} iAccountId
 * @param {string} sFolder
 * @param {string} sUid
 */
ScreenComposeUtils.composeMessageAsReplyOrForward = function (sReplyType, iAccountId, sFolder, sUid)
{
	var aParams = LinksUtils.getComposeFromMessage(sReplyType, iAccountId, sFolder, sUid);
	Routing.setHash(aParams);
};

/**
 * @param {string} sToAddresses
 */
ScreenComposeUtils.composeMessageToAddresses = function (sToAddresses)
{
	var aParams = LinksUtils.getComposeWithToField(sToAddresses);
	Routing.setHash(aParams);
};

ScreenComposeUtils.composeMessageWithData = function (oData)
{
	var aParams = LinksUtils.getComposeWithData(oData);
	aParams.shift();
	aParams.shift();
	Routing.goDirectly(LinksUtils.getCompose(), aParams);
};

/**
 * @param {Object} oMessage
 */
ScreenComposeUtils.composeMessageWithEml = function (oMessage)
{
	var aParams = LinksUtils.getComposeWithEmlObject(oMessage.accountId(), oMessage.folder(), oMessage.uid(), oMessage);
	aParams.shift();
	aParams.shift();
	Routing.goDirectly(LinksUtils.getCompose(), aParams);
};

/**
 * @param {Array} aFileItems
 */
ScreenComposeUtils.composeMessageWithAttachments = function (aFileItems)
{
	var aParams = LinksUtils.getComposeWithObject('attachments', aFileItems);
	aParams.shift();
	aParams.shift();
	Routing.goDirectly(LinksUtils.getCompose(), aParams);
};

module.exports = ScreenComposeUtils;