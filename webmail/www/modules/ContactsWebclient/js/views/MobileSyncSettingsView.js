'use strict';

var
	$ = require('jquery'),
	ko = require('knockout'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CMobileSyncSettingsView()
{
	this.bVisiblePersonalContacts = -1 !== $.inArray('personal', Settings.Storages);
	this.bVisibleSharedWithAllContacts = -1 !== $.inArray('shared', Settings.Storages);
	this.bVisibleTeamContacts = -1 !== $.inArray('team', Settings.Storages);

	this.davPersonalContactsUrl = ko.observable('');
	this.davCollectedAddressesUrl = ko.observable('');
	this.davSharedWithAllUrl = ko.observable('');
	this.davTeamAddressBookUrl = ko.observable('');
}

CMobileSyncSettingsView.prototype.ViewTemplate = '%ModuleName%_MobileSyncSettingsView';

/**
 * @param {Object} oDav
 */
CMobileSyncSettingsView.prototype.populate = function (oDav)
{
	if (oDav.Contacts)
	{
		this.davPersonalContactsUrl(oDav.Contacts.PersonalContactsUrl);
		this.davCollectedAddressesUrl(oDav.Contacts.CollectedAddressesUrl);
		this.davSharedWithAllUrl(oDav.Contacts.SharedWithAllUrl);
		this.davTeamAddressBookUrl(oDav.Contacts.TeamAddressBookUrl);
	}
};

module.exports = new CMobileSyncSettingsView();
