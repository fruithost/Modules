'use strict';

module.exports = function (oAppData) {
	var
		TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
		
		App = require('%PathToCoreWebclientModule%/js/App.js'),

		Settings = require('modules/%ModuleName%/js/Settings.js')
	;
	
	Settings.init(oAppData);

	if (App.getUserRole() === Enums.UserRole.SuperAdmin)
	{
		return {
			start: function (ModulesManager) {
				ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
					function(resolve) {
						require.ensure(
							['modules/%ModuleName%/js/views/MailMasterPasswordAdminSettingsView.js'],
							function() {
								resolve(require('modules/%ModuleName%/js/views/MailMasterPasswordAdminSettingsView.js'));
							},
							"admin-bundle"
						);
					},
					Settings.HashModuleName,
					TextUtils.i18n('%MODULENAME%/LABEL_SETTINGS_TAB')
				]);
			}
		};
	}
	
	return null;
};
