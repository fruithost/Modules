'use strict';

var
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

Ajax.registerAbortRequestHandler(Settings.ServerModuleName, function (oRequest, oOpenedRequest) {
	switch (oRequest.Method)
	{
		case 'GetContacts':
			return oOpenedRequest.Method === 'GetContacts';
		case 'GetContact':
			return oOpenedRequest.Method === 'GetContact';
	}
	
	return false;
});

module.exports = {
	send: function (sMethod, oParameters, fResponseHandler, oContext, oMainParams) {
		Ajax.send(Settings.ServerModuleName, sMethod, oParameters, fResponseHandler, oContext, undefined, oMainParams);
	}
};
