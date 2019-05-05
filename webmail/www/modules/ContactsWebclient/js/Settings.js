'use strict';

var
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	ServerModuleName: 'Contacts',
	HashModuleName: 'contacts',
	
	ContactsPerPage: 20,
	ImportContactsLink: '',
	Storages: [],
	DefaultStorage: 'personal',
	ImportExportFormats: [],
	SaveVcfServerModuleName: '',

	EContactsPrimaryEmail: {},
	EContactsPrimaryPhone: {},
	EContactsPrimaryAddress: {},
	EContactSortField: {},
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var oAppDataSection = oAppData[this.ServerModuleName];
		
		if (!_.isEmpty(oAppDataSection))
		{
			this.ContactsPerPage = Types.pPositiveInt(oAppDataSection.ContactsPerPage, this.ContactsPerPage);
			this.ImportContactsLink = Types.pString(oAppDataSection.ImportContactsLink, this.ImportContactsLink);
			this.Storages = Types.pArray(oAppDataSection.Storages, this.Storages);
			if (this.Storages.length > 0)
			{
				this.Storages.push('all');
				this.Storages.push('group');
			}
			this.ImportExportFormats = Types.pArray(oAppDataSection.ImportExportFormats, this.ImportExportFormats);
			this.SaveVcfServerModuleName = Types.pString(oAppDataSection.SaveVcfServerModuleName, this.SaveVcfServerModuleName);
			
			this.EContactsPrimaryEmail = Types.pObject(oAppDataSection.PrimaryEmail);
			this.EContactsPrimaryPhone = Types.pObject(oAppDataSection.PrimaryPhone);
			this.EContactsPrimaryAddress = Types.pObject(oAppDataSection.PrimaryAddress);
			this.EContactSortField = Types.pObject(oAppDataSection.SortField);
		}
	},
	
	/**
	 * Updates contacts per page after saving to server.
	 * 
	 * @param {number} iContactsPerPage
	 */
	update: function (iContactsPerPage)
	{
		this.ContactsPerPage = iContactsPerPage;
	}
};
