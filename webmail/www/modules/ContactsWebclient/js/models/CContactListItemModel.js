'use strict';

var
	ko = require('knockout'),
	
	AddressUtils = require('%PathToCoreWebclientModule%/js/utils/Address.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js'),

	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js')	
;

/**
 * @constructor
 */
function CContactListItemModel()
{
	this.bIsGroup = false;
	this.bIsOrganization = false;
	this.bReadOnly = false;
	this.bItsMe = false;
	this.bTeam = false;
	this.sUUID = '';
	this.sName = '';
	this.sEmail = '';
	this.bSharedToAll = false;
	this.aEmails = [];

	this.deleted = ko.observable(false);
	this.checked = ko.observable(false);
	this.selected = ko.observable(false);
	this.recivedAnim = ko.observable(false).extend({'autoResetToFalse': 500});
	this.sStorage = Settings.DefaultStorage;

	this.isOpenPgpEnabled = ModulesManager.run('OpenPgpWebclient', 'isOpenPgpEnabled') || ko.observable(false);	
	this.HasPgpPublicKey = ko.observable(false);
}

/**
 *
 * @param {Object} oData
 */
CContactListItemModel.prototype.parse = function (oData)
{
	this.sUUID = Types.pString(oData.UUID);
	this.sName = Types.pString(oData.FullName || oData.Name);
	this.sEmail = Types.pString(oData.ViewEmail);
	
	if (Types.isNonEmptyArray(oData.Emails))
	{
		this.aEmails = oData.Emails;
	}

	this.bIsGroup = !!oData.IsGroup;
	this.bIsOrganization = !!oData.IsOrganization;
	this.bReadOnly = !!oData.ReadOnly;
	this.bItsMe = !!oData.ItsMe;
	this.bTeam = oData.Storage === 'team';
	this.bSharedToAll =  oData.Storage === 'shared';
	this.sStorage = oData.Storage;

	this.HasPgpPublicKey(!!oData.HasPgpPublicKey);
};


/**
 * @return {boolean}
 */
CContactListItemModel.prototype.IsGroup = function ()
{
	return this.bIsGroup;
};

/**
 * @return {boolean}
 */
CContactListItemModel.prototype.Team = function ()
{
	return this.bTeam;
};

/**
 * @return {boolean}
 */
CContactListItemModel.prototype.ReadOnly = function ()
{
	return this.bReadOnly;
};

/**
 * @return {boolean}
 */
CContactListItemModel.prototype.ItsMe = function ()
{
	return this.bItsMe;
};

/**
 * @return {string}
 */
CContactListItemModel.prototype.UUID = function ()
{
	return this.sUUID;
};

/**
 * @return {string}
 */
CContactListItemModel.prototype.Name = function ()
{
	return this.sName;
};

/**
 * @return {string}
 */
CContactListItemModel.prototype.Email = function ()
{
	return this.sEmail;
};

/**
 * @return {string}
 */
CContactListItemModel.prototype.getFullEmail = function ()
{
	return AddressUtils.getFullEmail(this.sName, this.sEmail);
};

/**
 * @return {boolean}
 */
CContactListItemModel.prototype.IsSharedToAll = function ()
{
	return this.bSharedToAll;
};

/**
 * @return {boolean}
 */
CContactListItemModel.prototype.IsOrganization = function ()
{
	return this.bIsOrganization;
};

module.exports = CContactListItemModel;
