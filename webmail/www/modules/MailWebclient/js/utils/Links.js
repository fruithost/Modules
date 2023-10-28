'use strict';

var
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	
	MailCache = null,
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	LinksUtils = {}
;

/**
 * @param {string} sTemp
 * 
 * @return {boolean}
 */
function IsPageParam(sTemp)
{
	return ('p' === sTemp.substr(0, 1) && (/^[1-9][\d]*$/).test(sTemp.substr(1)));
};

/**
 * @param {string} sTemp
 * 
 * @return {boolean}
 */
function IsMsgParam(sTemp)
{
	return ('msg' === sTemp.substr(0, 3) && (/^[1-9][\d:]*$/).test(sTemp.substr(3)));
};

/**
 * @param {string} sTemp
 * 
 * @return {boolean}
 */
function IsServerParam(sTemp)
{
	return ('s' === sTemp.substr(0, 1) && (/^[1-9][\d]*$/).test(sTemp.substr(1)));
};

/**
 * @param {string=} sFolder = 'INBOX'
 * @param {number=} iPage = 1
 * @param {string=} sUid = ''
 * @param {string=} sSearch = ''
 * @param {string=} sFilters = ''
 * @param {string=} sSortBy = ''
 * @param {string=} iSortOrder = 0
 * @param {string=} sCustom = ''
 * @return {Array}
 */
LinksUtils.getMailbox = function (sFolder, iPage, sUid, sSearch, sFilters, sSortBy, iSortOrder, sCustom)
{
	var
		AccountList = require('modules/%ModuleName%/js/AccountList.js'),
		oCurrAccount = AccountList.getCurrent(),
		aResult = [Settings.HashModuleName, oCurrAccount ? oCurrAccount.hash() : '']
	;
	
	iPage = Types.pInt(iPage, 1);
	sUid = Types.pString(sUid);
	sSearch = Types.pString(sSearch);
	sFilters = Types.pString(sFilters);
	sSortBy = Types.pString(sSortBy, Settings.MessagesSortBy.DefaultSortBy);
	iSortOrder = Types.pInt(iSortOrder, Settings.MessagesSortBy.DefaultSortOrder);
	sCustom = Types.pString(sCustom);

	if (Types.isNonEmptyString(sFolder))
	{
		aResult.push(sFolder);
	}
	
	if ('' !== sFilters)
	{
		aResult.push('filter:' + sFilters);
	}
	
	if ('' !== sSortBy && Settings.MessagesSortBy.DefaultSortBy !== sSortBy)
	{
		aResult.push('sortby:' + sSortBy);
	}
	
	if (Settings.MessagesSortBy.DefaultSortOrder !== iSortOrder)
	{
		aResult.push('sortorder:' + iSortOrder);
	}
	
	if (1 < iPage)
	{
		aResult.push('p' + iPage);
	}

	if ('' !== sUid)
	{
		aResult.push('msg' + sUid);
	}

	if ('' !== sSearch)
	{
		aResult.push(sSearch);
	}
	
	if ('' !== sCustom)
	{
		aResult.push('custom:' + sCustom);
	}
	
	return aResult;
};

/**
 * Requires MailCache. It cannot be required earlier because it is not initialized yet.
 */
LinksUtils.requireMailCache = function ()
{
	if (MailCache === null)
	{
		MailCache = require('modules/%ModuleName%/js/Cache.js');
	}
};

/**
 * @param {Array} aParamsToParse
 * 
 * @return {Object}
 */
LinksUtils.parseMailbox = function (aParamsToParse)
{
	this.requireMailCache();
	
	var
		bMailtoCompose = aParamsToParse.length > 0 && aParamsToParse[0] === 'compose' && aParamsToParse[1] === 'to',
		aParams = bMailtoCompose ? [] : aParamsToParse,
		sAccountHash = '',
		sFolder = '',
		sInboxFullName = MailCache.folderList().inboxFolderFullName() || 'INBOX',
		iPage = 1,
		sUid = '',
		sSearch = '',
		sFilters = '',
		sSortBy = Settings.MessagesSortBy.DefaultSortBy,
		iSortOrder = Settings.MessagesSortBy.DefaultSortOrder,
		sCustom = '',
		sTemp = '',
		iIndex = 0
	;
	
	if (Types.isNonEmptyArray(aParams))
	{
		sAccountHash = Types.pString(aParams[iIndex]);
		iIndex++;
	}

	if (Types.isNonEmptyArray(aParams))
	{
		sFolder = Types.pString(aParams[iIndex]);
		iIndex++;

		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (sTemp === 'filter:' + Enums.FolderFilter.Flagged)
			{
				sFilters = Enums.FolderFilter.Flagged;
				iIndex++;
			}
			if (sTemp === 'filter:' + Enums.FolderFilter.Unseen)
			{
				sFilters = Enums.FolderFilter.Unseen;
				iIndex++;
			}
		}

		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (sTemp.substr(0, 7) === 'sortby:')
			{
				if (Settings.MessagesSortBy.Allow)
				{
					sSortBy = sTemp.substr(7);
				}
				iIndex++;
			}
		}

		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (sTemp.substr(0, 10) === 'sortorder:')
			{
				if (Settings.MessagesSortBy.Allow)
				{
					iSortOrder = Types.pEnum(Types.pInt(sTemp.substr(10)), Enums.SortOrder, Settings.MessagesSortBy.DefaultSortOrder);
				}
				iIndex++;
			}
		}
		
		if (!_.find(Settings.MessagesSortBy.List, function(oSortData) { return oSortData.SortBy === sSortBy; }))
		{
			sSortBy = Settings.MessagesSortBy.DefaultSortBy;
			iSortOrder = Settings.MessagesSortBy.DefaultSortOrder;
		}

		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (IsPageParam(sTemp))
			{
				iPage = Types.pInt(sTemp.substr(1));
				if (iPage <= 0)
				{
					iPage = 1;
				}
				iIndex++;
			}
		}
		
		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (IsMsgParam(sTemp))
			{
				sUid = sTemp.substr(3);
				iIndex++;
			}
		}

		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if ('custom:' !== sTemp.substr(0, 7))
			{
				sSearch = sTemp;
				iIndex++;
			}
		}
		
		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if ('custom:' === sTemp.substr(0, 7))
			{
				sCustom = sTemp.substr(7);
			}
		}
	}
	
	return {
		'MailtoCompose': bMailtoCompose,
		'AccountHash': sAccountHash,
		'Folder': sFolder === '' ? sInboxFullName : sFolder,
		'Page': iPage,
		'Uid': sUid,
		'Search': sSearch,
		'Filters': sFilters,
		'SortBy': sSortBy,
		'SortOrder': iSortOrder,
		'Custom': sCustom
	};
};

/**
 * @param {string} sFolder
 * @param {string} sUid
 * @return {Array}
 */
LinksUtils.getViewMessage = function (iAccountId, sFolder, sUid)
{
	var
		AccountList = require('modules/%ModuleName%/js/AccountList.js'),
		oAccount = AccountList.getAccount(iAccountId),
		sAccountHash = oAccount ? oAccount.hash() : ''
	;
	return [Settings.HashModuleName + '-view', sAccountHash, sFolder, 'msg' + sUid];
};

/**
 * @return {Array}
 */
LinksUtils.getCompose = function ()
{
	var
		AccountList = require('modules/%ModuleName%/js/AccountList.js'),
		oCurrAccount = AccountList.getCurrent(),
		sAccountHash = oCurrAccount ? oCurrAccount.hash() : ''
	;
	return [Settings.HashModuleName + '-compose', sAccountHash];
};

/**
 * @param {string} sType
 * @param {int} iAccountId
 * @param {string} sFolder
 * @param {string} sUid
 * 
 * @return {Array}
 */
LinksUtils.getComposeFromMessage = function (sType, iAccountId, sFolder, sUid)
{
	var
		AccountList = require('modules/%ModuleName%/js/AccountList.js'),
		oAccount = AccountList.getAccount(iAccountId),
		sAccountHash = oAccount ? oAccount.hash() : ''
	;
	return [Settings.HashModuleName + '-compose', sAccountHash, sType, sFolder, sUid];
};

/**
 * @param {string} sTo
 * 
 * @return {Array}
 */
LinksUtils.getComposeWithToField = function (sTo)
{
	var
		AccountList = require('modules/%ModuleName%/js/AccountList.js'),
		oCurrAccount = AccountList.getCurrent(),
		sAccountHash = oCurrAccount ? oCurrAccount.hash() : ''
	;
	return [Settings.HashModuleName + '-compose', sAccountHash, 'to', sTo];
};

LinksUtils.getComposeWithData = function (oData)
{
	var
		AccountList = require('modules/%ModuleName%/js/AccountList.js'),
		oCurrAccount = AccountList.getCurrent(),
		sAccountHash = oCurrAccount ? oCurrAccount.hash() : ''
	;
	return [Settings.HashModuleName + '-compose', sAccountHash, 'data', oData];
};

/**
 * @param {string} sType
 * @param {Object} oObject
 * @returns {Array}
 */
LinksUtils.getComposeWithObject = function (sType, oObject)
{
	var
		AccountList = require('modules/%ModuleName%/js/AccountList.js'),
		oCurrAccount = AccountList.getCurrent(),
		sAccountHash = oCurrAccount ? oCurrAccount.hash() : ''
	;
	return [Settings.HashModuleName + '-compose', sAccountHash, sType, oObject];
};

/**
 * @param {int} iAccountId
 * @param {string} sFolderName
 * @param {string} sUid
 * @param {object} oObject
 * @returns {Array}
 */
LinksUtils.getComposeWithEmlObject = function (iAccountId, sFolderName, sUid, oObject)
{
	var
		AccountList = require('modules/%ModuleName%/js/AccountList.js'),
		oAccount = AccountList.getAccount(iAccountId),
		sAccountHash = oAccount ? oAccount.hash() : ''
	;
	return [Settings.HashModuleName + '-compose', sAccountHash, Enums.ReplyType.ForwardAsAttach, sFolderName, sUid, oObject];
};

/**
 * @param {array} aParams
 * @returns {object}
 */
LinksUtils.parseCompose = function (aParams)
{
	var
		sAccountHash = (aParams.length > 0) ? aParams[0] : '',
		sRouteType = (aParams.length > 1) ? aParams[1] : '',
		oObject = ((sRouteType === Enums.ReplyType.ForwardAsAttach || sRouteType === 'attachments' || sRouteType === 'data') && aParams.length > 2) ? 
					(sRouteType === Enums.ReplyType.ForwardAsAttach ? aParams[4] : aParams[2]) : null,
		oToAddr = (sRouteType === 'to' && aParams.length > 2) ? LinksUtils.parseToAddr(aParams[2]) : null,
		bMessage = ((sRouteType === Enums.ReplyType.Reply || sRouteType === Enums.ReplyType.ReplyAll 
					|| sRouteType === Enums.ReplyType.Resend || sRouteType === Enums.ReplyType.Forward 
					|| sRouteType === 'drafts' || sRouteType === Enums.ReplyType.ForwardAsAttach) && aParams.length > 2),
		sFolderName = bMessage ? aParams[2] : '',
		sUid = bMessage ? aParams[3] : ''
	;
	
	return {
		'AccountHash': sAccountHash,
		'RouteType': sRouteType,
		'ToAddr': oToAddr,
		'Object': oObject,
		'MessageFolderName': sFolderName,
		'MessageUid': sUid
	};
};

/**
 * @param {?} mToAddr
 * @returns {Object}
 */
LinksUtils.parseToAddr = function (mToAddr)
{
	var
		sToAddr = Types.pString(mToAddr),
		bHasMailTo = sToAddr.indexOf('mailto:') !== -1,
		aMailto = [],
		aMessageParts = [],
		sSubject = '',
		sCcAddr = '',
		sBccAddr = '',
		sBody = ''
	;
	
	if (bHasMailTo)
	{
		aMailto = sToAddr.replace(/^mailto:/, '').split('?');
		sToAddr = aMailto[0];
		if (aMailto.length === 2)
		{
			aMessageParts = aMailto[1].split('&');
			_.each(aMessageParts, function (sPart) {
				var aParts = sPart.split('=');
				if (aParts.length === 2)
				{
					switch (aParts[0].toLowerCase())
					{
						case 'subject': sSubject = decodeURIComponent(aParts[1]); break;
						case 'cc': sCcAddr = decodeURIComponent(aParts[1]); break;
						case 'bcc': sBccAddr = decodeURIComponent(aParts[1]); break;
						case 'body': sBody = decodeURIComponent(aParts[1]); break;
					}
				}
			});
		}
	}
	
	return {
		'to': sToAddr,
		'hasMailto': bHasMailTo,
		'subject': sSubject,
		'cc': sCcAddr,
		'bcc': sBccAddr,
		'body': sBody
	};
};

/**
 * @param {array} aParams
 * @returns {Object}
 */
LinksUtils.parseMailServers = function (aParams)
{
	var
		iIndex = 0,
		sTemp = '',
		iPage = 1,
		sSearch = '',
		bCreate = false,
		iEditServerId = 0
	;
	
	if (Types.isNonEmptyArray(aParams))
	{
		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (IsPageParam(sTemp))
			{
				iPage = Types.pInt(sTemp.substr(1));
				if (iPage <= 0)
				{
					iPage = 1;
				}
				iIndex++;
			}
		}
		
		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (!IsServerParam(sTemp) && sTemp !== 'create')
			{
				sSearch = sTemp;
				iIndex++;
			}
		}
		
		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (IsServerParam(sTemp))
			{
				iEditServerId = Types.pInt(sTemp.substr(1), iEditServerId);
				if (iEditServerId <= 0)
				{
					iEditServerId = 1;
				}
				iIndex++;
			}
		}
		
		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			bCreate = sTemp === 'create';
		}
	}
	
	return {
		'Page': iPage,
		'Search': sSearch,
		'Create': bCreate,
		'EditServerId': iEditServerId
	};
};

module.exports = LinksUtils;
