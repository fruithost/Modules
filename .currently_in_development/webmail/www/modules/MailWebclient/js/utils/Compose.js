'use strict';

var
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	ComposeUtils = (App.isMobile() || App.isNewTab()) ? require('modules/%ModuleName%/js/utils/ScreenCompose.js') : require('modules/%ModuleName%/js/utils/PopupCompose.js')
;

module.exports = ComposeUtils;