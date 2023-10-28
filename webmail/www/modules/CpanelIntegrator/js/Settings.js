'use strict';

var
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	ServerModuleName: '%ModuleName%',
	HashModuleName: 'cpanel',

	CpanelHost: '',
	CpanelPort: '',
	CpanelUser: '',
	CpanelHasPassword: false,
	AllowAliases: false,
	AllowCreateDeleteAccountOnCpanel: false,

	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var oAppDataSection = oAppData[this.ServerModuleName] || {};
		
		if (!_.isEmpty(oAppDataSection))
		{
			this.CpanelHost = Types.pString(oAppDataSection.CpanelHost, this.CpanelHost);
			this.CpanelPort = Types.pString(oAppDataSection.CpanelPort, this.CpanelPort);
			this.CpanelUser = Types.pString(oAppDataSection.CpanelUser, this.CpanelUser);
			this.CpanelHasPassword = Types.pBool(oAppDataSection.CpanelHasPassword, this.CpanelHasPassword);
			this.AllowAliases = Types.pBool(oAppDataSection.AllowAliases, this.AllowAliases);
			this.AllowCreateDeleteAccountOnCpanel = Types.pBool(oAppDataSection.AllowCreateDeleteAccountOnCpanel, this.AllowCreateDeleteAccountOnCpanel);
		}
	},
	
	updateAdmin: function (sCpanelHost, sCpanelPort, sCpanelUser)
	{
		this.CpanelHost = sCpanelHost;
		this.CpanelPort = sCpanelPort;
		this.CpanelUser = sCpanelUser;
	}
};
