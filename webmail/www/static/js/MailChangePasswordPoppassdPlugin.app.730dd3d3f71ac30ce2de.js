(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[19],{

/***/ "K+UY":
/*!*****************************************************************!*\
  !*** ./modules/MailChangePasswordPoppassdPlugin/js/Settings.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV")
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


/***/ }),

/***/ "u3Ck":
/*!****************************************************************!*\
  !*** ./modules/MailChangePasswordPoppassdPlugin/js/manager.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function (oAppData) {
	var App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5");
	
	if (App.getUserRole() === Enums.UserRole.SuperAdmin)
	{
		var
			TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
			
			Settings = __webpack_require__(/*! modules/MailChangePasswordPoppassdPlugin/js/Settings.js */ "K+UY")
		;

		Settings.init(oAppData);

		return {
			start: function (ModulesManager) {
				ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
					function(resolve) {
						__webpack_require__.e(/*! require.ensure | admin-bundle */ 7).then((function() {
								resolve(__webpack_require__(/*! modules/MailChangePasswordPoppassdPlugin/js/views/AdminSettingsView.js */ "ZIwz"));
							}).bind(null, __webpack_require__)).catch(__webpack_require__.oe);
					},
					Settings.HashModuleName,
					TextUtils.i18n('MAILCHANGEPASSWORDPOPPASSDPLUGIN/LABEL_POPPASSD_SETTINGS_TAB')
				]);
			}
		};
	}
	
	return null;
};


/***/ })

}]);