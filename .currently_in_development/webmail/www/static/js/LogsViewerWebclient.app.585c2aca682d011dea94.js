(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[23],{

/***/ "USjE":
/*!*************************************************!*\
  !*** ./modules/LogsViewerWebclient/js/enums.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	
	Settings = __webpack_require__(/*! modules/LogsViewerWebclient/js/Settings.js */ "XjIm"),
	
	Enums = {}
;

Enums.LogLevel = Settings.ELogLevel;

if (typeof window.Enums === 'undefined')
{
	window.Enums = {};
}

_.extendOwn(window.Enums, Enums);


/***/ }),

/***/ "XjIm":
/*!****************************************************!*\
  !*** ./modules/LogsViewerWebclient/js/Settings.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV")
;

module.exports = {
	ServerModuleName: 'LogsViewerWebclient',
	HashModuleName: 'logs-viewer',
	
	EnableLogging: false,
	EnableEventLogging: false,
	LoggingLevel: 0,
	LogSizeBytes: 0,
	EventLogSizeBytes: 0,
	LogFileName: '',
	EventLogFileName: '',
	ViewLastLogSize: 0,
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var 
			oAppDataSection = oAppData['Core'],
			oAppDataSectionLogsViewerWebclient = oAppData[this.ServerModuleName]
		;
		
		if (!_.isEmpty(oAppDataSection))
		{
			this.ViewLastLogSize = oAppDataSectionLogsViewerWebclient['ViewLastLogSize'];
			
			this.ELogLevel = Types.pObject(oAppDataSection.ELogLevel);
			
			this.EnableLogging = Types.pBool(oAppDataSection.EnableLogging);
			this.EnableEventLogging = Types.pBool(oAppDataSection.EnableEventLogging);
			this.LoggingLevel = Types.pEnum(oAppDataSection.LoggingLevel, this.ELogLevel, this.LoggingLevel);
			this.updateLogsData(Types.pObject(oAppDataSection.LogFilesData));
		}
	},
	
	/**
	 * Updates new settings values after saving on server.
	 * 
	 * @param {boolean} bEnableLogging
	 * @param {boolean} bEnableEventLogging
	 * @param {number} iLoggingLevel
	 */
	updateLogging: function (bEnableLogging, bEnableEventLogging, iLoggingLevel)
	{
		this.EnableLogging = !!bEnableLogging;
		this.EnableEventLogging = !!bEnableEventLogging;
		this.LoggingLevel = Types.pInt(iLoggingLevel);
	},
	
	/**
	 * Updates new settings values after requesting from server.
	 * 
	 * @param {Object} oLogFilesData
	 */
	updateLogsData: function (oLogFilesData)
	{
		this.LogSizeBytes = Types.pInt(oLogFilesData.LogSizeBytes);
		this.EventLogSizeBytes = Types.pInt(oLogFilesData.EventLogSizeBytes);
		this.LogFileName = Types.pString(oLogFilesData.LogFileName);
		this.EventLogFileName = Types.pString(oLogFilesData.EventLogFileName);
	}
};


/***/ }),

/***/ "gQcY":
/*!***************************************************!*\
  !*** ./modules/LogsViewerWebclient/js/manager.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function (oAppData) {
	var App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5");
	
	if (App.getUserRole() === Enums.UserRole.SuperAdmin)
	{
		var
			TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
			
			Settings = __webpack_require__(/*! modules/LogsViewerWebclient/js/Settings.js */ "XjIm")
		;

		Settings.init(oAppData);

		__webpack_require__(/*! modules/LogsViewerWebclient/js/enums.js */ "USjE");

		return {
			start: function (ModulesManager) {
				ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
					function(resolve) {
						__webpack_require__.e(/*! require.ensure | admin-bundle */ 7).then((function() {
								resolve(__webpack_require__(/*! modules/LogsViewerWebclient/js/views/AdminSettingsView.js */ "nIpt"));
							}).bind(null, __webpack_require__)).catch(__webpack_require__.oe);
					},
					Settings.HashModuleName,
					TextUtils.i18n('LOGSVIEWERWEBCLIENT/LABEL_LOGGING_SETTINGS_TAB')
				]);
			}
		};
	}
	
	return null;
};


/***/ })

}]);