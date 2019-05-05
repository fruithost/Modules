webpackJsonp([9],{

/***/ 301:
/*!****************************************************************!*\
  !*** ./modules/MailChangePasswordPoppassdPlugin/js/manager.js ***!
  \****************************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = function (oAppData) {
		var App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ 182);
		
		if (App.getUserRole() === Enums.UserRole.SuperAdmin)
		{
			var
				TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ 185),
				
				Settings = __webpack_require__(/*! modules/MailChangePasswordPoppassdPlugin/js/Settings.js */ 302)
			;

			Settings.init(oAppData);

			return {
				start: function (ModulesManager) {
					ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
						function(resolve) {
							__webpack_require__.e/* nsure */(1/*! admin-bundle */, function() {
									resolve(__webpack_require__(/*! modules/MailChangePasswordPoppassdPlugin/js/views/AdminSettingsView.js */ 303));
								});
						},
						Settings.HashModuleName,
						TextUtils.i18n('MAILCHANGEPASSWORDPOPPASSDPLUGIN/LABEL_POPPASSD_SETTINGS_TAB')
					]);
				}
			};
		}
		
		return null;
	};


/***/ }),

/***/ 302:
/*!*****************************************************************!*\
  !*** ./modules/MailChangePasswordPoppassdPlugin/js/Settings.js ***!
  \*****************************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		
		Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ 181)
	;

	module.exports = {
		ServerModuleName: 'MailChangePasswordPoppassdPlugin',
		HashModuleName: 'mail-poppassd-plugin',
		
		SupportedServers: '',
		Host: '',
		Port: 0,
		
		/**
		 * Initializes settings from AppData object sections.
		 * 
		 * @param {Object} oAppData Object contained modules settings.
		 */
		init: function (oAppData)
		{
			var oAppDataSection = oAppData['MailChangePasswordPoppassdPlugin'];
			
			if (!_.isEmpty(oAppDataSection))
			{
				this.SupportedServers = Types.pString(oAppDataSection.SupportedServers, this.SupportedServers);
				this.Host = Types.pString(oAppDataSection.Host, this.Host);
				this.Port = Types.pNonNegativeInt(oAppDataSection.Port, this.Port);
			}
		},
		
		/**
		 * Updates new settings values after saving on server.
		 * 
		 * @param {string} sSupportedServers
		 * @param {string} sHost
		 * @param {number} iPort
		 */
		updateAdmin: function (sSupportedServers, sHost, iPort)
		{
			this.SupportedServers = Types.pString(sSupportedServers, this.SupportedServers);
			this.Host = Types.pString(sHost, this.Host);
			this.Port = Types.pNonNegativeInt(iPort, this.Port);
		}
	};


/***/ })

});