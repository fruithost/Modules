'use strict';

module.exports = function (oAppData) {
	var
		App = require('%PathToCoreWebclientModule%/js/App.js')
	;
	
	if (App.isUserNormalOrTenant())
	{
		var Settings = require('modules/%ModuleName%/js/Settings.js');

		Settings.init(oAppData);

		return {
			start: function (ModulesManager) {
				if (Settings.ShowSingleMailChangePasswordInSecuritySettings && ModulesManager.isModuleEnabled('SecuritySettingsWebclient'))
				{
					ModulesManager.run(
						'SecuritySettingsWebclient',
						'registerSecuritySettingsSection', 
						[
							function () { return require('modules/%ModuleName%/js/views/ChangeDefaultMailAccountPasswordView.js'); },
							'%ModuleName%'
						]
					);
				}
				else if (Settings.ShowSingleMailChangePasswordInCommonSettings)
				{
					ModulesManager.run(
						'SettingsWebclient',
						'registerSettingsTabSection', 
						[
							function () { return require('modules/%ModuleName%/js/views/ChangeDefaultMailAccountPasswordView.js'); },
							'common'
						]
					);
				}
			},
			getChangePasswordPopup: function () {
				return require('modules/%ModuleName%/js/popups/ChangePasswordPopup.js');
			},
			isChangePasswordButtonAllowed: function (iAccountCount, oAccount) {
				return !Settings.ShowSingleMailChangePasswordInCommonSettings
						&& !Settings.ShowSingleMailChangePasswordInSecuritySettings
						&& !!oAccount.aExtend.AllowChangePasswordOnMailServer;
			}
		};
	}
	
	return null;
};
