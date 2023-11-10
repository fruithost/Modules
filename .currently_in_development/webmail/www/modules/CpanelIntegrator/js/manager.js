'use strict';

module.exports = function (oAppData) {
	var
		App = require('%PathToCoreWebclientModule%/js/App.js'),
				
		TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
		
		ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),

		Settings = require('modules/%ModuleName%/js/Settings.js')
	;
	
	Settings.init(oAppData);
	
	if (ModulesManager.isModuleAvailable(Settings.ServerModuleName))
	{
		if (App.getUserRole() === Enums.UserRole.SuperAdmin || App.getUserRole() === Enums.UserRole.TenantAdmin)
		{
			return {
				/**
				 * Registers admin settings tabs before application start.
				 * 
				 * @param {Object} ModulesManager
				 */
				start: function (ModulesManager)
				{
					if (ModulesManager.isModuleAvailable('MailDomains') && Settings.AllowAliases)
					{
						ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
							function(resolve) {
								require.ensure(
									['modules/%ModuleName%/js/views/AliasesPerUserAdminSettingsView.js'],
									function() {
										resolve(require('modules/%ModuleName%/js/views/AliasesPerUserAdminSettingsView.js'));
									},
									'admin-bundle'
								);
							},
							Settings.HashModuleName + '-aliases',
							TextUtils.i18n('%MODULENAME%/LABEL_SETTINGS_TAB_ALIASES')
						]);
					}
					if (App.getUserRole() === Enums.UserRole.SuperAdmin)
					{
						ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
							function(resolve) {
								require.ensure(
									['modules/%ModuleName%/js/views/AdminSettingsView.js'],
									function() {
										resolve(require('modules/%ModuleName%/js/views/AdminSettingsView.js'));
									},
									'admin-bundle'
								);
							},
							Settings.HashModuleName,
							TextUtils.i18n('%MODULENAME%/ADMIN_SETTINGS_TAB_LABEL')
						]);
					}
					App.subscribeEvent('ConfirmDeleteEntity::before', function (oParams) {
						if (Settings.AllowCreateDeleteAccountOnCpanel)
						{
							var sAddText = '';
							switch (oParams.Type)
							{
								case 'User':
									sAddText = TextUtils.i18n('%MODULENAME%/CONFIRM_CPANEL_ACCOUNTS_WILL_BE_DELETED_WITH_USERS_HTML_PLURAL', {}, null, oParams.Count);
									break;
								case 'Domain':
									sAddText = TextUtils.i18n('%MODULENAME%/CONFIRM_CPANEL_ACCOUNTS_WILL_BE_DELETED_WITH_DOMAINS_HTML_PLURAL', {}, null, oParams.Count);
									break;
								case 'Server':
									sAddText = TextUtils.i18n('%MODULENAME%/CONFIRM_CPANEL_ACCOUNTS_WILL_BE_DELETED_WITH_SERVER_HTML');
								case 'Tenant':
									sAddText = TextUtils.i18n('%MODULENAME%/CONFIRM_CPANEL_ACCOUNTS_WILL_BE_DELETED_WITH_TENANTS_HTML_PLURAL', {}, null, oParams.Count);
									break;
							}
							if (sAddText !== '')
							{
								oParams.ConfirmText += '<br /><br /><span style="color: red">' + sAddText + '</span>';
							}
						}
					});
				}
			};
		}
	}
	
	return null;
};
