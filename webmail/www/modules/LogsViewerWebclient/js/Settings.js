'use strict';

var
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
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
