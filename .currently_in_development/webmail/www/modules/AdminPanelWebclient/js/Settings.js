'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	UrlUtils = require('%PathToCoreWebclientModule%/js/utils/Url.js')
;

module.exports = {
	ServerModuleName: 'Core',
	HashModuleName: 'admin',
	
	EntitiesPerPage: 20,
	TabsOrder: ['licensing', 'admin-security', 'admin-db', 'logs-viewer', 'system', 'common', 'modules'],
	EntitiesOrder: [],
	EnableMultiTenant: false,

	startError: ko.observable(''),
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var
			oAppDataSection = oAppData['%ModuleName%'],
			oCoreDataSection = oAppData['Core']
		;

		if (!_.isEmpty(oAppDataSection))
		{
			this.EntitiesPerPage = Types.pPositiveInt(oAppDataSection.EntitiesPerPage, this.EntitiesPerPage);
			this.TabsOrder = Types.pArray(oAppDataSection.TabsOrder, this.TabsOrder);
			this.EntitiesOrder = Types.pArray(oAppDataSection.EntitiesOrder, this.EntitiesOrder);
		}
		
		if (!_.isEmpty(oCoreDataSection))
		{
			this.EnableMultiTenant = Types.pBool(oCoreDataSection.EnableMultiTenant, this.EnableMultiTenant);
		}
		
		this.setStartError();
	},

	setStartError: function ()
	{
		$.ajax({
			url: UrlUtils.getAppPath() + 'data/settings/config.json',
			type: 'GET',
			async: true,
			dataType: 'json',
			complete: function (oXhr, sType) {
				if (sType === 'success')
				{
					this.startError(TextUtils.i18n('%MODULENAME%/ERROR_DATA_FOLDER_ACCESSIBLE_FROM_WEB'));
				}
			}.bind(this),
			timeout: 50000
		});
	},

	/**
	 * Returns error text to show on start if the tab has empty fields.
	 * 
	 * @returns {String}
	 */
	getStartError: function ()
	{
		return this.startError;
	}
};
