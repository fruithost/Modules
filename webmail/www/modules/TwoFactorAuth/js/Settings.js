'use strict';

var
	ko = require('knockout'),
	_ = require('underscore'),

	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	ServerModuleName: '%ModuleName%',
	HashModuleName: 'two-factor-auth',
	EnableTwoFactorAuth: ko.observable(true),

	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var oAppDataSection = _.extend({}, oAppData[this.ServerModuleName] || {}, oAppData['%ModuleName%'] || {});

		if (!_.isEmpty(oAppDataSection))
		{
			this.EnableTwoFactorAuth(Types.pBool(oAppDataSection.EnableTwoFactorAuth, this.EnableTwoFactorAuth()));
		}
	}
};
