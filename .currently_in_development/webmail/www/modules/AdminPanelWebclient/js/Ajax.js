'use strict';

var
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

Ajax.registerAbortRequestHandler(Settings.ServerModuleName, function (oRequest, oOpenedRequest) {
	switch (oRequest.Method)
	{
		case 'GetUsers':
			return oOpenedRequest.Method === 'GetUsers';
		case 'GetTenants':
			return oOpenedRequest.Method === 'GetTenants';
	}
	
	return false;
});

module.exports = {
	send: function (sMethod, oParameters, fResponseHandler, oContext) {
		Ajax.send(Settings.ServerModuleName, sMethod, oParameters, fResponseHandler, oContext);
	}
};
