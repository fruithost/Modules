'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	SettingsUtils = require('%PathToCoreWebclientModule%/js/utils/Settings.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	Enums = window.Enums,
	CAbstractSettingsFormView
;

if (App.getUserRole() === Enums.UserRole.SuperAdmin)
{
	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass');
}
else
{
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass');
}

/**
 * @constructor
 */
function CCommonSettingsFormView()
{
	CAbstractSettingsFormView.call(this);
	
	this.bAdmin = App.getUserRole() === Enums.UserRole.SuperAdmin;
	this.bMobile = App.isMobile();
	
	this.aThemes = UserSettings.ThemeList;
	this.aMobileThemes = UserSettings.MobileThemeList;
	this.aLanguages = _.clone(UserSettings.LanguageList);
	this.aDateFormats = SettingsUtils.getDateFormatsForSelector();
	
	if (this.bAdmin)
	{
		this.aLanguages.unshift({value: 'autodetect', name: TextUtils.i18n('%MODULENAME%/LABEL_AUTODETECT')});
	}
	this.aRefreshIntervals = [
		{name: TextUtils.i18n('%MODULENAME%/LABEL_REFRESH_OFF'), value: 0},
		{name: TextUtils.i18n('%MODULENAME%/LABEL_MINUTES_PLURAL', {'COUNT': 1}, null, 1), value: 1},
		{name: TextUtils.i18n('%MODULENAME%/LABEL_MINUTES_PLURAL', {'COUNT': 3}, null, 3), value: 3},
		{name: TextUtils.i18n('%MODULENAME%/LABEL_MINUTES_PLURAL', {'COUNT': 5}, null, 5), value: 5},
		{name: TextUtils.i18n('%MODULENAME%/LABEL_MINUTES_PLURAL', {'COUNT': 10}, null, 10), value: 10},
		{name: TextUtils.i18n('%MODULENAME%/LABEL_MINUTES_PLURAL', {'COUNT': 15}, null, 15), value: 15},
		{name: TextUtils.i18n('%MODULENAME%/LABEL_MINUTES_PLURAL', {'COUNT': 20}, null, 20), value: 20},
		{name: TextUtils.i18n('%MODULENAME%/LABEL_MINUTES_PLURAL', {'COUNT': 30}, null, 30), value: 30}
	];
	
	/* Editable fields */
	this.siteName = ko.observable(UserSettings.SiteName);
	this.selectedTheme = ko.observable(this.getGlobalTheme(this.aThemes, UserSettings.Theme));
	this.selectedMobileTheme = ko.observable(this.getGlobalTheme(this.aMobileThemes, UserSettings.MobileTheme));
	this.selectedLanguage = ko.observable(this.getGlobalLanguage());
	this.autoRefreshInterval = ko.observable(this.getGlobalAutoRefreshIntervalMinutes());
	this.timeFormat = ko.observable(UserSettings.timeFormat());
	this.selectedDateFormat = ko.observable(UserSettings.dateFormat());
	this.desktopNotifications = ko.observable(UserSettings.AllowDesktopNotifications);
	/*-- Editable fields */
	
	this.allowChangeDateFormat = ko.computed(function () {
		return !this.bAdmin && UserSettings.UserSelectsDateFormat;
	}, this);
	this.isDesktopNotificationsEnable = ko.observable((window.Notification && window.Notification.permission !== 'denied'));
	this.desktopNotifications.subscribe(function (bChecked) {
		var self = this;
		if (bChecked && window.Notification.permission === 'default')
		{
			window.Notification.requestPermission(function (sPermission) {
				if (sPermission === 'denied')
				{
					self.desktopNotifications(false);
					self.isDesktopNotificationsEnable(false);
				}
			});
		}
	}, this);
}

_.extendOwn(CCommonSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CCommonSettingsFormView.prototype.ViewTemplate = 'CoreWebclient_CommonSettingsFormView';

/**
 * Returns an array with the values of editable fields.
 * 
 * @returns {Array}
 */
CCommonSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.siteName(),
		this.selectedTheme(),
		this.selectedMobileTheme(),
		this.selectedLanguage(),
		this.autoRefreshInterval(),
		this.timeFormat(),
		this.selectedDateFormat(),
		this.desktopNotifications()
	];
};

CCommonSettingsFormView.prototype.getGlobalLanguage = function ()
{
	var
		sLang = this.bAdmin ? (UserSettings.AutodetectLanguage ? 'autodetect' : UserSettings.CommonLanguage) : UserSettings.Language,
		oFoundLang = _.find(this.aLanguages, function (oLangItem) {
			return oLangItem.value === sLang;
		})
	;
	if (!oFoundLang)
	{
		oFoundLang = _.find(this.aLanguages, function (oLangItem) {
			return oLangItem.value === 'English';
		});
	}
	
	return oFoundLang ? oFoundLang.value : (this.aLanguages.length > 0 ? this.aLanguages[0].value : '');
};

CCommonSettingsFormView.prototype.getGlobalTheme = function (aThemes, sGlobalTheme)
{
	var
		sFoundTheme = _.find(aThemes, function (sThemeItem) {
			return sThemeItem === sGlobalTheme;
		})
	;
	if (!sFoundTheme)
	{
		sFoundTheme = _.find(aThemes, function (sThemeItem) {
			return sThemeItem === 'Default';
		});
	}
	
	return sFoundTheme ? sFoundTheme : (aThemes.length > 0 ? aThemes[0] : '');
};

CCommonSettingsFormView.prototype.getGlobalAutoRefreshIntervalMinutes = function ()
{
	var
		oFoundInterval = _.find(this.aRefreshIntervals, function (oIntervalItem) {
			return oIntervalItem.value === UserSettings.AutoRefreshIntervalMinutes;
		})
	;
	if (!oFoundInterval)
	{
		oFoundInterval = _.find(this.aRefreshIntervals, function (oIntervalItem) {
			return oIntervalItem.value === 0;
		});
	}
	
	return oFoundInterval ? oFoundInterval.value : (this.aRefreshIntervals.length > 0 ? this.aRefreshIntervals[0].value : 0);
};

/**
 * Puts values from the global settings object to the editable fields.
 */
CCommonSettingsFormView.prototype.revertGlobalValues = function ()
{
	this.siteName(UserSettings.SiteName);
	this.selectedTheme(this.getGlobalTheme(this.aThemes, UserSettings.Theme));
	this.selectedMobileTheme(this.getGlobalTheme(this.aMobileThemes, UserSettings.MobileTheme));
	this.selectedLanguage(this.getGlobalLanguage());
	this.autoRefreshInterval(this.getGlobalAutoRefreshIntervalMinutes());
	this.timeFormat(UserSettings.timeFormat());
	this.selectedDateFormat(UserSettings.dateFormat());
	this.desktopNotifications(UserSettings.AllowDesktopNotifications);
};

/**
 * Gets values from the editable fields and prepares object for passing to the server and saving settings therein.
 * 
 * @returns {Object}
 */
CCommonSettingsFormView.prototype.getParametersForSave = function ()
{
	var oParameters = {
		'Theme': this.selectedTheme(),
		'MobileTheme': this.selectedMobileTheme(),
		'TimeFormat': this.timeFormat()
	};
	
	if (this.bAdmin)
	{
		oParameters['SiteName'] = this.siteName();
		if (this.selectedLanguage() === 'autodetect')
		{
			oParameters['AutodetectLanguage'] = true;
		}
		else
		{
			oParameters['AutodetectLanguage'] = false;
			oParameters['Language'] = this.selectedLanguage();
		}
	}
	else
	{
		oParameters['AutoRefreshIntervalMinutes'] = Types.pInt(this.autoRefreshInterval());
		oParameters['AllowDesktopNotifications'] = this.desktopNotifications();
		oParameters['Language'] = this.selectedLanguage();
		if (this.allowChangeDateFormat())
		{
			oParameters['DateFormat'] = this.selectedDateFormat();
		}
	}
	
	return oParameters;
};

/**
 * Applies saved values of settings to the global settings object.
 * 
 * @param {Object} oParameters Object that have been obtained by getParameters function.
 */
CCommonSettingsFormView.prototype.applySavedValues = function (oParameters)
{
	if (oParameters.Theme !== UserSettings.Theme && !this.bMobile || oParameters.MobileTheme !== UserSettings.MobileTheme && this.bMobile || oParameters.Language !== UserSettings.Language && !this.bAdmin)
	{
		window.location.reload();
	}
	else
	{
		UserSettings.update(oParameters.SiteName, oParameters.AutoRefreshIntervalMinutes,
			oParameters.Theme, oParameters.MobileTheme, oParameters.Language,
			oParameters.TimeFormat, oParameters.DateFormat, oParameters.AllowDesktopNotifications);
	}
};

CCommonSettingsFormView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === '');
};

module.exports = new CCommonSettingsFormView();
