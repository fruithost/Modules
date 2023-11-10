(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[17],{

/***/ "D3LK":
/*!************************************************!*\
  !*** ./modules/CpanelIntegrator/js/manager.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function (oAppData) {
	var
		App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
				
		TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
		
		ModulesManager = __webpack_require__(/*! modules/CoreWebclient/js/ModulesManager.js */ "OgeD"),

		Settings = __webpack_require__(/*! modules/CpanelIntegrator/js/Settings.js */ "SVRS")
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
								__webpack_require__.e(/*! require.ensure | admin-bundle */ 7).then((function() {
										resolve(__webpack_require__(/*! modules/CpanelIntegrator/js/views/AliasesPerUserAdminSettingsView.js */ "ZdzK"));
									}).bind(null, __webpack_require__)).catch(__webpack_require__.oe);
							},
							Settings.HashModuleName + '-aliases',
							TextUtils.i18n('CPANELINTEGRATOR/LABEL_SETTINGS_TAB_ALIASES')
						]);
					}
					if (App.getUserRole() === Enums.UserRole.SuperAdmin)
					{
						ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
							function(resolve) {
								__webpack_require__.e(/*! require.ensure | admin-bundle */ 7).then((function() {
										resolve(__webpack_require__(/*! modules/CpanelIntegrator/js/views/AdminSettingsView.js */ "qMJN"));
									}).bind(null, __webpack_require__)).catch(__webpack_require__.oe);
							},
							Settings.HashModuleName,
							TextUtils.i18n('CPANELINTEGRATOR/ADMIN_SETTINGS_TAB_LABEL')
						]);
					}
					App.subscribeEvent('ConfirmDeleteEntity::before', function (oParams) {
						if (Settings.AllowCreateDeleteAccountOnCpanel)
						{
							var sAddText = '';
							switch (oParams.Type)
							{
								case 'User':
									sAddText = TextUtils.i18n('CPANELINTEGRATOR/CONFIRM_CPANEL_ACCOUNTS_WILL_BE_DELETED_WITH_USERS_HTML_PLURAL', {}, null, oParams.Count);
									break;
								case 'Domain':
									sAddText = TextUtils.i18n('CPANELINTEGRATOR/CONFIRM_CPANEL_ACCOUNTS_WILL_BE_DELETED_WITH_DOMAINS_HTML_PLURAL', {}, null, oParams.Count);
									break;
								case 'Server':
									sAddText = TextUtils.i18n('CPANELINTEGRATOR/CONFIRM_CPANEL_ACCOUNTS_WILL_BE_DELETED_WITH_SERVER_HTML');
								case 'Tenant':
									sAddText = TextUtils.i18n('CPANELINTEGRATOR/CONFIRM_CPANEL_ACCOUNTS_WILL_BE_DELETED_WITH_TENANTS_HTML_PLURAL', {}, null, oParams.Count);
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


/***/ }),

/***/ "SVRS":
/*!*************************************************!*\
  !*** ./modules/CpanelIntegrator/js/Settings.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV")
;

module.exports = {
	ServerModuleName: 'CpanelIntegrator',
	HashModuleName: 'cpanel',

	CpanelHost: '',
	CpanelPort: '',
	CpanelUser: '',
	CpanelHasPassword: false,
	AllowAliases: false,
	AllowCreateDeleteAccountOnCpanel: false,

	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var oAppDataSection = oAppData[this.ServerModuleName] || {};
		
		if (!_.isEmpty(oAppDataSection))
		{
			this.CpanelHost = Types.pString(oAppDataSection.CpanelHost, this.CpanelHost);
			this.CpanelPort = Types.pString(oAppDataSection.CpanelPort, this.CpanelPort);
			this.CpanelUser = Types.pString(oAppDataSection.CpanelUser, this.CpanelUser);
			this.CpanelHasPassword = Types.pBool(oAppDataSection.CpanelHasPassword, this.CpanelHasPassword);
			this.AllowAliases = Types.pBool(oAppDataSection.AllowAliases, this.AllowAliases);
			this.AllowCreateDeleteAccountOnCpanel = Types.pBool(oAppDataSection.AllowCreateDeleteAccountOnCpanel, this.AllowCreateDeleteAccountOnCpanel);
		}
	},
	
	updateAdmin: function (sCpanelHost, sCpanelPort, sCpanelUser)
	{
		this.CpanelHost = sCpanelHost;
		this.CpanelPort = sCpanelPort;
		this.CpanelUser = sCpanelUser;
	}
};


/***/ })

}]);