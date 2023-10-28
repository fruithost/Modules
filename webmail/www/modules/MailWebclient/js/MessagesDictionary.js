'use strict';

var
	CHECK_AND_CLEAR_DICT_EVERY_MINUTES = 30,
	DESTROY_NOT_USED_LAST_HOURS = 4
;

var
	_ = require('underscore'),
	moment = require('moment'),
	
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	MailCache = null
;

function GetMessagesLimitToStore()
{
	return Settings.MailsPerPage * 8 + 700;
}

function CMessagesDictionary()
{
	this.oMessages = {};
	
	// Clears dictionary from old messages every 30 minutes
	setInterval(this.checkAndClear.bind(this), 1000 * 60 * CHECK_AND_CLEAR_DICT_EVERY_MINUTES);
}

/**
 * Obtains message from dictionary.
 * @param {array} aKey
 * @returns {object}
 */
CMessagesDictionary.prototype.get = function (aKey)
{
	var sKey = JSON.stringify(aKey);
	return this.oMessages[sKey];
};

/**
 * Adds message to dictionary.
 * @param {array} aKey
 * @param {object} oMessage
 */
CMessagesDictionary.prototype.set = function (aKey, oMessage)
{
	var sKey = JSON.stringify(aKey);
	this.oMessages[sKey] = oMessage;
};

/**
 * Requires MailCache. It cannot be required earlier because it is not initialized yet.
 */
CMessagesDictionary.prototype.requireMailCache = function ()
{
	if (MailCache === null)
	{
		MailCache = require('modules/%ModuleName%/js/Cache.js');
	}
};

/**
 * Checks the number of messages in the dictionary.
 * If the number is over 1000 destroys messages that have not been used for 4 hours.
 */
CMessagesDictionary.prototype.checkAndClear = function ()
{
	this.requireMailCache();
	
	// Do not check if the current folder has not been synchronized for the last 30 minutes.
	// This may be first moments after computer wakes up.
	var oIndicatorFolder = MailCache.getCurrentFolder();
	if (!oIndicatorFolder && MailCache.folderList())
	{
		oIndicatorFolder = MailCache.folderList().inboxFolder();
	}
	if (!oIndicatorFolder || moment().diff(oIndicatorFolder.oRelevantInformationLastMoment) > 1000 * 60 * CHECK_AND_CLEAR_DICT_EVERY_MINUTES)
	{
		return;
	}
	
	var
		iCount = _.size(this.oMessages),
		iPrevNow = moment().add(-DESTROY_NOT_USED_LAST_HOURS, 'hours').unix(),
		iMessagesLimitToStore = GetMessagesLimitToStore()
	;
	
	if (iCount > iMessagesLimitToStore)
	{
		Utils.log('checkAndClear', iCount, Settings.MailsPerPage, iMessagesLimitToStore);
		
		// Update last access time for messages on the current page.
		_.each(MailCache.messages(), function (oMessage) {
			oMessage.updateLastAccessTime();
		});
		
		// Update last access time for the current message.
		if (MailCache.currentMessage())
		{
			MailCache.currentMessage().updateLastAccessTime();
		}
		
		// Destroy old messages.
		_.each(this.oMessages, function (oMessage, sKey) {
			if (oMessage.iLastAccessTime !== 0 && oMessage.iLastAccessTime < iPrevNow)
			{
				Utils.destroyObjectWithObservables(this.oMessages, sKey);
			}
		}.bind(this));
		
		Utils.log('checkAndClear', _.size(this.oMessages));
	}
};

/**
 * Removes message from the dictionary.
 * @param {Array} aKey
 */
CMessagesDictionary.prototype.remove = function (aKey)
{
	var sKey = JSON.stringify(aKey);
	Utils.destroyObjectWithObservables(this.oMessages, sKey);
};

// Updates all messages dates if current date has been just changed.
CMessagesDictionary.prototype.updateMomentDates = function ()
{
	_.each(this.oMessages, function (oMessage) {
		oMessage.updateMomentDate();
	}, this);
};

module.exports = new CMessagesDictionary();
