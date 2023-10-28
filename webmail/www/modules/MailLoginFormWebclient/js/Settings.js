'use strict';

var
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	ServerModuleName: '%ModuleName%',
	HashModuleName: 'mail',

	AllowChangeLanguage: false,
	CustomLoginUrl: '',
	CustomLogoUrl: '',
	DemoLogin: '',
	DemoPassword: '',
	InfoText: '',
	BottomInfoHtmlText: '',
	LoginSignMeType: Enums.LoginSignMeType.DefaultOff, // 0 - off, 1 - on, 2 - don't use
	UseDropdownLanguagesView: false,
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var 
			oAppDataSection = oAppData['%ModuleName%'],
			oAppDataBrandingWebclientSection = oAppData['BrandingWebclient']
		;
		
		if (!_.isEmpty(oAppDataSection))
		{
			this.ServerModuleName = Types.pString(oAppDataSection.ServerModuleName, this.ServerModuleName);
			this.HashModuleName = Types.pString(oAppDataSection.HashModuleName, this.HashModuleName);
			this.AllowChangeLanguage = Types.pBool(oAppDataSection.AllowChangeLanguage, this.AllowChangeLanguage);
			this.CustomLoginUrl = Types.pString(oAppDataSection.CustomLoginUrl, this.CustomLoginUrl);
			this.DemoLogin = Types.pString(oAppDataSection.DemoLogin, this.DemoLogin);
			this.DemoPassword = Types.pString(oAppDataSection.DemoPassword, this.DemoPassword);
			this.InfoText = Types.pString(oAppDataSection.InfoText, this.InfoText);
			this.BottomInfoHtmlText = Types.pString(oAppDataSection.BottomInfoHtmlText, this.BottomInfoHtmlText);
			this.LoginSignMeType = Types.pEnum(oAppDataSection.LoginSignMeType, Enums.LoginSignMeType, this.LoginSignMeType);
			this.UseDropdownLanguagesView = Types.pBool(oAppDataSection.UseDropdownLanguagesView, this.UseDropdownLanguagesView);
		}
		
		if (!_.isEmpty(oAppDataBrandingWebclientSection))
		{
			this.CustomLogoUrl = Types.pString(oAppDataBrandingWebclientSection.LoginLogo, this.CustomLogoUrl);
		}
	}
};
