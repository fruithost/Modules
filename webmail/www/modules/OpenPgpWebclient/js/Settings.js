'use strict';

var
	ko = require('knockout'),
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	ServerModuleName: '%ModuleName%',
	HashModuleName: 'openpgp',
	
	enableOpenPgp: ko.observable(true),
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var oAppDataSection = oAppData['%ModuleName%'];
		
		if (!_.isEmpty(oAppDataSection))
		{
			this.enableOpenPgp(Types.pBool(oAppDataSection.EnableModule, this.enableOpenPgp()));
		}
	},
	
	/**
	 * Updates new settings values after saving on server.
	 * 
	 * @param {boolean} bEnableOpenPgp
	 */
	update: function (bEnableOpenPgp)
	{
		this.enableOpenPgp(bEnableOpenPgp);
	}
};
