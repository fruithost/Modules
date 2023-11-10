'use strict';

var
	_ = require('underscore'),

	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	ModuleName: '%ModuleName%',
	UploadSizeLimitMb: 0,

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
			this.UploadSizeLimitMb = Types.pInt(oAppDataSection.UploadSizeLimitMb, this.UploadSizeLimitMb);
		}
	}
};
