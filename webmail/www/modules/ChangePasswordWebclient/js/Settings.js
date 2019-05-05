'use strict';

var
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	// If true and there is only one mail account show change password button in common settings, not in mail account properties screen.
	ShowSingleMailChangePasswordInCommonSettings: false,
	
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
			this.ShowSingleMailChangePasswordInCommonSettings = Types.pBool(oAppDataSection.ShowSingleMailChangePasswordInCommonSettings, this.ShowSingleMailChangePasswordInCommonSettings);
		}
	}
};
