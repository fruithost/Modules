'use strict';

var
	UAParser = require('ua-parser-js'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),

	DeviceUtils = {}
;

DeviceUtils.getName = function ()
{
	var
		sUserAgent = navigator.userAgent,
		oUaData = UAParser(Types.pString(sUserAgent)),
		sName = oUaData.browser.name + '/' + oUaData.browser.major,
		sPlatform = oUaData.os.name + ' ' + oUaData.os.version,
		sDeviceName = TextUtils.i18n('%MODULENAME%/LABEL_DEVICE_NAME', {
			'NAME': sName,
			'PLATFORM': sPlatform
		})
	;
	return sDeviceName;
};

module.exports = DeviceUtils;