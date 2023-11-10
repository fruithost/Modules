'use strict';

var
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

module.exports = function (oAppData) {
	Settings.init(oAppData);

	if (!ModulesManager.isModuleAvailable('Mail') || !ModulesManager.isModuleAvailable('MailWebclient'))
	{
		return null;
	}

	return {
		getImportExportPopup: function () {
			return require('modules/%ModuleName%/js/popups/ImportExportPopup.js');
		}
	};
};
