'use strict';

var
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	// If true show change password button in common settings, not in mail account properties screen.
	ShowSingleMailChangePasswordInCommonSettings: false,

	// If true show change password button in security settings, not in mail account properties screen or in common settings.
	ShowSingleMailChangePasswordInSecuritySettings: false,
	
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
			this.ShowSingleMailChangePasswordInSecuritySettings = Types.pBool(oAppDataSection.ShowSingleMailChangePasswordInSecuritySettings, this.ShowSingleMailChangePasswordInSecuritySettings);
		}
	}
};
