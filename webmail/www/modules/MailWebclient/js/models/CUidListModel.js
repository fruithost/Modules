'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	MailCache = null,
	MessagesDictionary = require('modules/%ModuleName%/js/MessagesDictionary.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 * 
 * !!!Attention!!!
 * It is not used underscore, because the collection may contain undefined-elements.
 * They have their own importance. But all underscore-functions removes them automatically.
 */
function CUidListModel()
{
	this.iAccountId = 0;
	this.sFullName = '';
	this.search = ko.observable('');
	this.filters = ko.observable('');
	this.sortBy = ko.observable(Settings.MessagesSortBy.DefaultSortBy);
	this.sortOrder = ko.observable(Settings.MessagesSortBy.DefaultSortOrder);
	
	this.resultCount = ko.observable(-1);
	this.collection = ko.observableArray([]);
	this.threadUids = {};
}

/**
 * Requires MailCache. It cannot be required earlier because it is not initialized yet.
 */
CUidListModel.prototype.requireMailCache = function ()
{
	if (MailCache === null)
	{
		MailCache = require('modules/%ModuleName%/js/Cache.js');
	}
};

/**
 * @param {string} sUid
 * @param {Array} aThreadUids
 */
CUidListModel.prototype.addThreadUids = function (sUid, aThreadUids)
{
	if (-1 !== _.indexOf(this.collection(), sUid))
	{
		this.threadUids[sUid] = aThreadUids;
	}
};

/**
 * @param {int} iOffset
 * @param {Object} oResult
 */
CUidListModel.prototype.setUidsAndCount = function (iOffset, oResult)
{
	if (oResult['@Object'] === 'Collection/MessageCollection')
	{
		_.each(oResult.Uids, function (sUid, iIndex) {
			
			this.collection()[iIndex + iOffset] = sUid.toString();

		}, this);

		this.resultCount(oResult.MessageResultCount);
	}
};

/**
 * @param {number} iOffset
 */
CUidListModel.prototype.getUidsForOffset = function (iOffset)
{
	this.requireMailCache();
	
	var
		iIndex = 0,
		iLen = this.collection().length,
		sUid = '',
		iAccountId = this.iAccountId,
		sFullName = this.sFullName,
		iExistsCount = 0,
		aUids = [],
		oMsg = null
	;
	
	for(; iIndex < iLen; iIndex++)
	{
		if (iIndex >= iOffset && iExistsCount < Settings.MailsPerPage)
		{
			sUid = this.collection()[iIndex];
			var sUidForDict = sUid;
			if (sUid !== undefined && this.sFullName === MailCache.oUnifiedInbox.fullName())
			{
				var aParts = sUid.split(':');
				iAccountId = Types.pInt(aParts[0]);
				sFullName = 'INBOX';
				sUidForDict = aParts[1];
			}
			oMsg = (sUid === undefined) ? null : MessagesDictionary.get([iAccountId, sFullName, sUidForDict]);

			if (oMsg && !oMsg.deleted() || sUid === undefined)
			{
				iExistsCount++;
				if (sUid !== undefined)
				{
					aUids.push(sUid);
				}
			}
		}
	}
	
	return aUids;
};

/**
 * @param {Array} aUids
 */
CUidListModel.prototype.deleteUids = function (aUids)
{
	var
		iIndex = 0,
		iLen = this.collection().length,
		sUid = '',
		aNewCollection = [],
		iDiff = 0
	;
	
	for (; iIndex < iLen; iIndex++)
	{
		sUid = this.collection()[iIndex];
		if (_.indexOf(aUids, sUid) === -1)
		{
			aNewCollection.push(sUid);
		}
		else
		{
			iDiff++;
		}
	}
	
	this.collection(aNewCollection);
	this.resultCount(this.resultCount() - iDiff);
};

/**
 * Clears data when cache should be cleared.
 */
CUidListModel.prototype.clearData = function ()
{
	this.resultCount(-1);
	this.collection([]);
	this.threadUids = {};
};

module.exports = CUidListModel;
