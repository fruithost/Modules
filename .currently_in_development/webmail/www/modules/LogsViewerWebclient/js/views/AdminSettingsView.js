'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	FileSaver = require('%PathToCoreWebclientModule%/js/vendors/FileSaver.js'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	WindowOpener = require('%PathToCoreWebclientModule%/js/WindowOpener.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass')
;

/**
* @constructor
*/
function CLoggingAdminSettingsView()
{
	CAbstractSettingsFormView.call(this, 'Core');
	
	this.iViewLogSizeBytes = Settings.ViewLastLogSize;
	this.aLevelOptions = [
		{text: TextUtils.i18n('%MODULENAME%/LABEL_LOGGING_DEBUG'), value: Enums.LogLevel.Full},
		{text: TextUtils.i18n('%MODULENAME%/LABEL_LOGGING_WARNINGS'), value: Enums.LogLevel.Warning},
		{text: TextUtils.i18n('%MODULENAME%/LABEL_LOGGING_ERRORS'), value: Enums.LogLevel.Error}
	];
	
	this.logSize = ko.observable(Settings.LogSizeBytes);
	this.downloadLogText = ko.computed(function () {
		return TextUtils.i18n('%MODULENAME%/BUTTON_LOGGING_DOWNLOAD', {'SIZE': TextUtils.getFriendlySize(this.logSize())});
	}, this);
	this.viewLogText = ko.computed(function () {
		if (this.logSize() < this.iViewLogSizeBytes)
		{
			return TextUtils.i18n('%MODULENAME%/BUTTON_LOGGING_VIEW');
		}
		else
		{
			return TextUtils.i18n('%MODULENAME%/BUTTON_LOGGING_VIEW_LAST', {'SIZE': TextUtils.getFriendlySize(this.iViewLogSizeBytes)});
		}
	}, this);
	this.eventsLogSize = ko.observable(Settings.EventLogSizeBytes);
	this.downloadEventsLogText = ko.computed(function () {
		return TextUtils.i18n('%MODULENAME%/BUTTON_LOGGING_DOWNLOAD_EVENTS', {'SIZE': TextUtils.getFriendlySize(this.eventsLogSize())});
	}, this);
	this.viewEventsLogText = ko.computed(function () {
		if (this.eventsLogSize() < this.iViewLogSizeBytes)
		{
			return TextUtils.i18n('%MODULENAME%/BUTTON_LOGGING_VIEW');
		}
		else
		{
			return TextUtils.i18n('%MODULENAME%/BUTTON_LOGGING_VIEW_LAST', {'SIZE': TextUtils.getFriendlySize(this.iViewLogSizeBytes)});
		}
	}, this);
	
	this.usersWithSeparateLog = ko.observableArray([]);
	
	/* Editable fields */
	this.enableLogging = ko.observable(Settings.EnableLogging);
	this.enableEventLogging = ko.observable(Settings.EnableEventLogging);
	this.loggingLevel = ko.observable(Settings.LoggingLevel);
	/*-- Editable fields */
}

_.extendOwn(CLoggingAdminSettingsView.prototype, CAbstractSettingsFormView.prototype);

CLoggingAdminSettingsView.prototype.ViewTemplate = '%ModuleName%_AdminSettingsView';

CLoggingAdminSettingsView.prototype.onRouteChild = function ()
{
	this.setUpdateStatusTimer();
	var bDbNotConfigured = (UserSettings.DbLogin === '' || UserSettings.DbName === '' || UserSettings.DbHost === '');
	if (!bDbNotConfigured)
	{
		Ajax.send(Settings.ServerModuleName, 'GetUsersWithSeparateLog', null, function (oResponse) {
			if (oResponse.Result)
			{
				this.usersWithSeparateLog(_.isArray(oResponse.Result) ? oResponse.Result : []);
			}
			else
			{
				Api.showErrorByCode(oResponse);
			}
		}, this);
	}
};

CLoggingAdminSettingsView.prototype.turnOffSeparateLogs = function ()
{
	this.usersWithSeparateLog([]);
	Ajax.send(Settings.ServerModuleName, 'TurnOffSeparateLogs');
};

CLoggingAdminSettingsView.prototype.clearSeparateLogs = function ()
{
	Ajax.send(Settings.ServerModuleName, 'ClearSeparateLogs');
};

CLoggingAdminSettingsView.prototype.setUpdateStatusTimer = function ()
{
	if (this.bShown)
	{
		setTimeout(_.bind(function () {
			Ajax.send(Settings.ServerModuleName, 'GetLogFilesData', null, function (oResponse) {
				if (oResponse.Result)
				{
					Settings.updateLogsData(oResponse.Result);
					this.logSize(Settings.LogSizeBytes);
					this.eventsLogSize(Settings.EventLogSizeBytes);
				}
				this.setUpdateStatusTimer();
			}, this);
		}, this), 5000);
	}
};

CLoggingAdminSettingsView.prototype.getCurrentValues = function ()
{
	return [
		this.enableLogging(),
		this.enableEventLogging(),
		Types.pInt(this.loggingLevel())
	];
};

CLoggingAdminSettingsView.prototype.revertGlobalValues = function ()
{
	this.enableLogging(Settings.EnableLogging);
	this.enableEventLogging(Settings.EnableEventLogging);
	this.loggingLevel(Settings.LoggingLevel);
};

CLoggingAdminSettingsView.prototype.getParametersForSave = function ()
{
	return {
		'EnableLogging': this.enableLogging(),
		'EnableEventLogging': this.enableEventLogging(),
		'LoggingLevel': Types.pInt(this.loggingLevel())
	};
};

/**
 * @param {Object} oParameters
 */
CLoggingAdminSettingsView.prototype.applySavedValues = function (oParameters)
{
	Settings.updateLogging(oParameters.EnableLogging, oParameters.EnableEventLogging, oParameters.LoggingLevel);
};

CLoggingAdminSettingsView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === '');
};

CLoggingAdminSettingsView.prototype.downloadLog = function (bEventsLog, sPublicId)
{
	Ajax.send(Settings.ServerModuleName, 'GetLogFile', {'EventsLog': bEventsLog, 'PublicId': sPublicId || ''}, function (oResponse) {
		var
			oBlob = new Blob([oResponse.ResponseText], {'type': 'text/plain;charset=utf-8'}),
			sFilePrefix = Types.pString(sPublicId) !== '' ? sPublicId + '-' : ''
		;
		FileSaver.saveAs(oBlob, bEventsLog ? Settings.EventLogFileName : sFilePrefix + Settings.LogFileName);
	}, this, undefined, { Format: 'Raw' });
};

CLoggingAdminSettingsView.prototype.viewLog = function (bEventsLog)
{
	Ajax.send(Settings.ServerModuleName, 'GetLog', {'EventsLog': bEventsLog}, function (oResponse) {
		if (oResponse.Result)
		{
			var oWin = WindowOpener.open('', 'view-log');
			if (oWin)
			{
				$(oWin.document.body).html('<pre>' + oResponse.Result + '</pre>');
			}
		}
	}, this);
};

CLoggingAdminSettingsView.prototype.clearLog = function (bEventsLog)
{
	Ajax.send(Settings.ServerModuleName, 'ClearLog', {'EventsLog': bEventsLog}, function (oResponse) {
		if (oResponse.Result)
		{
			if (bEventsLog)
			{
				this.eventsLogSize(0);
			}
			else
			{
				this.logSize(0);
			}
		}
	}, this);
};

module.exports = new CLoggingAdminSettingsView();
