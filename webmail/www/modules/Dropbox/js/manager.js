'use strict';

module.exports = function (oAppData) {
	var
		_ = require('underscore'),
				
		TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
				
		App = require('%PathToCoreWebclientModule%/js/App.js'),
		
		Settings = require('modules/%ModuleName%/js/Settings.js'),
		
		bAdminUser = App.getUserRole() === Enums.UserRole.SuperAdmin
	;

	Settings.init(oAppData);
	
	if (bAdminUser)
	{
		return {
			start: function (ModulesManager) {
				ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
					function(resolve) {
						require.ensure(
							['modules/%ModuleName%/js/views/AdminSettingsView.js'],
							function() {
								resolve(require('modules/%ModuleName%/js/views/AdminSettingsView.js'));
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
	
	if (App.isUserNormalOrTenant() && Settings.EnableModule && _.isArray(Settings.Scopes) && Settings.Scopes.length > 0)
	{
		return {
			start: function (ModulesManager) {
				ModulesManager.run('SettingsWebclient', 'registerSettingsTab', [
					function () { return require('modules/%ModuleName%/js/views/DropboxSettingsFormView.js'); },
					Settings.HashModuleName,
					TextUtils.i18n('%MODULENAME%/LABEL_SETTINGS_TAB')
				]);
			}
		};
	}
	
	return null;
};
