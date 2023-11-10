'use strict';

var
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	CHeaderItemView = require('%PathToCoreWebclientModule%/js/views/CHeaderItemView.js')
;

module.exports = new CHeaderItemView(TextUtils.i18n('%MODULENAME%/ACTION_SHOW_CONTACTS'));
