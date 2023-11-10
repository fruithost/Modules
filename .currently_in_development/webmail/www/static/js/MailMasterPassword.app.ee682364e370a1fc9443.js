(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[18],{

/***/ "DllP":
/*!***************************************************!*\
  !*** ./modules/MailMasterPassword/js/Settings.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV")
;

module.exports = {
	ServerModuleName: 'MailMasterPassword',
	HashModuleName: 'mailmasterpassword',
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
	}
};


/***/ }),

/***/ "svbr":
/*!**************************************************!*\
  !*** ./modules/MailMasterPassword/js/manager.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function (oAppData) {
	var
		TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
		
		App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),

		Settings = __webpack_require__(/*! modules/MailMasterPassword/js/Settings.js */ "DllP")
	;
	
	Settings.init(oAppData);

	if (App.getUserRole() === Enums.UserRole.SuperAdmin)
	{
		return {
			start: function (ModulesManager) {
				ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
					function(resolve) {
						__webpack_require__.e(/*! require.ensure | admin-bundle */ 7).then((function() {
								resolve(__webpack_require__(/*! modules/MailMasterPassword/js/views/MailMasterPasswordAdminSettingsView.js */ "6yFS"));
							}).bind(null, __webpack_require__)).catch(__webpack_require__.oe);
					},
					Settings.HashModuleName,
					TextUtils.i18n('MAILMASTERPASSWORD/LABEL_SETTINGS_TAB')
				]);
			}
		};
	}
	
	return null;
};


/***/ })

}]);