'use strict';

var
	_ = require('underscore'),

	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	ModuleName: 'RecaptchaWebclientPlugin',
	PublicKey: '',
	LimitCount: 0,
	ShowRecaptcha: true,

	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var oAppDataSection = oAppData[this.ModuleName] || {};
		
		if (!_.isEmpty(oAppDataSection))
		{
			this.PublicKey = Types.pString(oAppDataSection.PublicKey, this.PublicKey);
			this.LimitCount = Types.pInt(oAppDataSection.LimitCount, this.LimitCount);
			this.ShowRecaptcha = Types.pBool(oAppDataSection.ShowRecaptcha, this.ShowRecaptcha);
		}
	}
};
