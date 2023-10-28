'use strict';

var
	_ = require('underscore'),

	AddressUtils = require('%PathToCoreWebclientModule%/js/utils/Address.js')
;

/**
 * @todo
 * @param {Object} oOpenPgpKey
 * @constructor
 */
function COpenPgpKey(oOpenPgpKey)
{
	this.pgpKey = oOpenPgpKey;

	var oPrimaryUser = this.pgpKey.getPrimaryUser();

	this.user = (oPrimaryUser && oPrimaryUser.user) ? oPrimaryUser.user.userId.userid :
		(this.pgpKey.users && this.pgpKey.users[0] ? this.pgpKey.users[0].userId.userid : '');
	this.userName = (oPrimaryUser && oPrimaryUser.user) ?
		oPrimaryUser.user.userId.name :
		(this.pgpKey.users && this.pgpKey.users[0] ? this.pgpKey.users[0].userId.name : '');

	this.emailParts = AddressUtils.getEmailParts(this.user);
}

/**
 * @type {Object}
 */
COpenPgpKey.prototype.pgpKey = null;

/**
 * @type {string}
 */
COpenPgpKey.prototype.passphrase = null;

/**
 * @type {Object}
 */
COpenPgpKey.prototype.emailParts = null;

/**
 * @type {string}
 */
COpenPgpKey.prototype.user = '';

/**
 * @type {string}
 */
COpenPgpKey.prototype.userName = '';

/**
 * @type {boolean}
 */
COpenPgpKey.prototype.isExternal = false;

/**
 * @return {string}
 */
COpenPgpKey.prototype.getId = function ()
{
	return this.pgpKey.primaryKey.getKeyId().toHex().toLowerCase();
};

/**
 * @param {string} sId
 * @returns {Boolean}
 */
COpenPgpKey.prototype.hasId = function (sId)
{
	return !!_.find(this.pgpKey.getKeyIds(), function (sKeyId) {
		return sKeyId.toHex() === sId;
	});
};

/**
 * @return {string}
 */
COpenPgpKey.prototype.getEmail = function ()
{
	return this.emailParts['email'] || this.user;
};

/**
 * @return {string}
 */
COpenPgpKey.prototype.getUser = function ()
{
	return this.user;
};

/**
 * @return {string}
 */
COpenPgpKey.prototype.getUserName = function ()
{
	return this.userName;
};

/**
 * @return {string}
 */
COpenPgpKey.prototype.getFingerprint = function ()
{
	return this.pgpKey.primaryKey.getFingerprint();
};

/**
 * @return {number}
 */
COpenPgpKey.prototype.getBitSize = function ()
{
	let
		aAlgorithmInfo = this.pgpKey.primaryKey.getAlgorithmInfo(),
		iBitSize = aAlgorithmInfo.bits ? aAlgorithmInfo.bits : 0
	;

	return iBitSize;
};

/**
 * @return {string}
 */
COpenPgpKey.prototype.getArmor = function ()
{
	return this.pgpKey.armor();
};

/**
 * @return {boolean}
 */
COpenPgpKey.prototype.isPrivate = function ()
{
	return !!this.pgpKey.isPrivate();
};

/**
 * @return {boolean}
 */
COpenPgpKey.prototype.isPublic = function ()
{
	return !this.isPrivate();
};

/**
 * @return {string}
 */
COpenPgpKey.prototype.getPassphrase = function ()
{
	return this.passphrase;
};

COpenPgpKey.prototype.setPassphrase = function (sPassphrase)
{
	this.passphrase = sPassphrase;
};

module.exports = COpenPgpKey;