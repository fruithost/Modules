'use strict';

module.exports = function (oAppData) {
	var App = require('%PathToCoreWebclientModule%/js/App.js');
	
	if (App.isUserNormalOrTenant())
	{
		return {
			start: function (ModulesManager) {
				if (ModulesManager.isModuleEnabled('MailWebclient'))
				{
					App.subscribeEvent('MailWebclient::RegisterMessagePaneController', function (fRegisterMessagePaneController) {
						fRegisterMessagePaneController(require('modules/%ModuleName%/js/views/MessageControlView.js'), 'BeforeMessageHeaders');
					});
					ModulesManager.run('MailWebclient', 'registerComposeToolbarController', [require('modules/%ModuleName%/js/views/ComposeDropdownView.js')]);
				}
			}
		};
	}
	
	return null;
};
