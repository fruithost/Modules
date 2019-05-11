'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	hasher = require('hasher'),
	
	UrlUtils = require('%PathToCoreWebclientModule%/js/utils/Url.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js')
;

/**
 * @constructor
 */
function CRouting()
{
	this.currentHash = ko.observable(this.getHashFromHref());
	this.previousHash = ko.observable(this.getHashFromHref());
}

/**
 * Initializes object.
 */
CRouting.prototype.init = function ()
{
	hasher.initialized.removeAll();
	hasher.changed.removeAll();
	hasher.initialized.add(this.parseRouting, this);
	hasher.changed.add(this.parseRouting, this);
	hasher.init();
	hasher.initialized.removeAll();
};

/**
 * Finalizes the object and puts an empty hash.
 */
CRouting.prototype.finalize = function ()
{
	hasher.dispose();
};

/**
 * Sets a new hash.
 * 
 * @param {string} sNewHash
 * 
 * @return {boolean}
 */
CRouting.prototype.setHashFromString = function (sNewHash)
{
	var bSame = (location.hash === sNewHash);
	
	if (!bSame)
	{
		location.hash = sNewHash;
	}
	
	return bSame;
};

/**
 * Sets a new hash without part.
 * 
 * @param {string} sUid
 */
CRouting.prototype.replaceHashWithoutMessageUid = function (sUid)
{
	if (typeof sUid === 'string' && sUid !== '')
	{
		var sNewHash = location.hash.replace('/msg' + sUid, '');
		this.replaceHashFromString(sNewHash);
	}
};

/**
 * Sets a new hash.
 * 
 * @param {string} sNewHash
 */
CRouting.prototype.replaceHashFromString = function (sNewHash)
{
	if (location.hash !== sNewHash)
	{
		location.replace(UrlUtils.getAppPath() + window.location.search + sNewHash);
	}
};

/**
 * Sets a new hash made ​​up of an array.
 * 
 * @param {Array} aRoutingParts
 * 
 * @return boolean
 */
CRouting.prototype.setHash = function (aRoutingParts)
{
	return this.setHashFromString(this.buildHashFromArray(aRoutingParts));
};

/**
 * @param {Array} aRoutingParts
 */
CRouting.prototype.replaceHash = function (aRoutingParts)
{
	this.replaceHashFromString(this.buildHashFromArray(aRoutingParts));
};

/**
 * @param {Array} aRoutingParts
 */
CRouting.prototype.replaceHashDirectly = function (aRoutingParts)
{
	hasher.stop();
	this.replaceHashFromString(this.buildHashFromArray(aRoutingParts));
	this.currentHash(location.hash.replace(/^#/, ''));
	hasher.init();
};

CRouting.prototype.setPreviousHash = function ()
{
	var
		sPrevHash = this.previousHash(),
		aPrevHash = sPrevHash.split(/[-|\/]/)
	;
	if (this.currentHash() === sPrevHash)
	{
		sPrevHash = aPrevHash.length > 0 && aPrevHash[0] !== sPrevHash ? aPrevHash[0] : '';
	}
	location.hash = sPrevHash;
};

CRouting.prototype.stopListening = function ()
{
	hasher.stop();
};

CRouting.prototype.startListening = function ()
{
	hasher.init();
};

/**
 * Makes a hash of a string array.
 *
 * @param {(string|Array)} aRoutingParts
 * 
 * @return {string}
 */
CRouting.prototype.buildHashFromArray = function (aRoutingParts)
{
	var
		iIndex = 0,
		iLen = 0,
		sHash = ''
	;

	if (_.isArray(aRoutingParts))
	{
		for (iLen = aRoutingParts.length; iIndex < iLen; iIndex++)
		{
			aRoutingParts[iIndex] = encodeURIComponent(aRoutingParts[iIndex]);
		}
	}
	else
	{
		aRoutingParts = [encodeURIComponent(aRoutingParts.toString())];
	}
	
	sHash = aRoutingParts.join('/');
	
	if (sHash !== '')
	{
		sHash = '#' + sHash;
	}

	return sHash;
};

/**
 * Returns the value of the hash string of location.href.
 * location.hash returns the decoded string and location.href - not, so it uses location.href.
 * 
 * @return {string}
 */
CRouting.prototype.getHashFromHref = function ()
{
	var
		iPos = location.href.indexOf('#'),
		sHash = ''
	;

	if (iPos !== -1)
	{
		sHash = location.href.substr(iPos + 1);
	}

	return sHash;
};

/**
 * @param {Array} aRoutingParts
 * @param {Array} aAddParams
 */
CRouting.prototype.goDirectly = function (aRoutingParts, aAddParams)
{
	hasher.stop();
	this.setHash(aRoutingParts);
	this.parseRouting(aAddParams);
	hasher.init();
};

/**
 * @param {string} sNeedScreen
 */
CRouting.prototype.historyBackWithoutParsing = function (sNeedScreen)
{
	hasher.stop();
	location.hash = this.currentHash();
	hasher.init();
};

/**
 * @returns {String}
 */
CRouting.prototype.getScreenFromHash = function ()
{
	var
		sHash = this.getHashFromHref(),
		aHash = sHash.split('/')
	;
	return decodeURIComponent(aHash.shift());
};

/**
 * Checks if there are changes in current screen and continues screen change or discards changes.
 * @param {Array} aAddParams
 */
CRouting.prototype.parseRouting = function (aAddParams)
{
	var
		App = require('%PathToCoreWebclientModule%/js/App.js'),
		fContinueScreenChange = _.bind(this.chooseScreen, this, aAddParams),
		fRevertScreenChange = _.bind(this.historyBackWithoutParsing, this, aAddParams),
		oCurrentScreen = _.isFunction(Screens.getCurrentScreen) ? Screens.getCurrentScreen() : null
	;
	
	if (oCurrentScreen && _.isFunction(oCurrentScreen.hasUnsavedChanges) && oCurrentScreen.hasUnsavedChanges())
	{
		App.askDiscardChanges(fContinueScreenChange, fRevertScreenChange, oCurrentScreen);
	}
	else if (_.isFunction(fContinueScreenChange))
	{
		fContinueScreenChange();
	}
};

/**
 * Parses the hash string and opens the corresponding routing screen.
 * 
 * @param {Array} aAddParams
 */
CRouting.prototype.chooseScreen = function (aAddParams)
{
	var
		sHash = this.getHashFromHref(),
		aParams = _.map(sHash.split('/'), function (sHashPart) {
			return decodeURIComponent(sHashPart);
		})
	;
	
	this.previousHash(this.currentHash());
	this.currentHash(sHash);
	
	aAddParams = _.isArray(aAddParams) ? aAddParams : [];

	Screens.route(aParams.concat(aAddParams));
};

var Routing = new CRouting();

module.exports = {
	init: _.bind(Routing.init, Routing),
	buildHashFromArray: _.bind(Routing.buildHashFromArray, Routing),
	replaceHashWithoutMessageUid: _.bind(Routing.replaceHashWithoutMessageUid, Routing),
	setHash: _.bind(Routing.setHash, Routing),
	replaceHash: _.bind(Routing.replaceHash, Routing),
	finalize: _.bind(Routing.finalize, Routing),
	currentHash: Routing.currentHash,
	replaceHashDirectly: _.bind(Routing.replaceHashDirectly, Routing),
	setPreviousHash: _.bind(Routing.setPreviousHash, Routing),
	stopListening: _.bind(Routing.stopListening, Routing),
	startListening: _.bind(Routing.startListening, Routing),
	goDirectly: _.bind(Routing.goDirectly, Routing),
	getCurrentHashArray: function () {
		return Routing.currentHash().split('/');
	},
	getAppUrlWithHash: function (aRoutingParts) {
		return UrlUtils.getAppPath() + Routing.buildHashFromArray(aRoutingParts);
	}
};
