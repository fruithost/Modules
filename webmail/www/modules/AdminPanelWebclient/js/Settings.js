'use strict';

var
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	ServerModuleName: 'AdminPanelWebclient',
	HashModuleName: 'admin',
	
	EntitiesPerPage: 20,
	TabsOrder: ['licensing', 'admin-security', 'admin-db', 'logs-viewer', 'system', 'common', 'modules'],
	EntitiesOrder: [],
	EnableMultiTenant: false,
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var
			oAppDataSection = oAppData[this.ServerModuleName],
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
	}
};
