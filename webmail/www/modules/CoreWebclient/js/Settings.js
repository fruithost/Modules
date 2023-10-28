'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	moment = require('moment-timezone'),
	
	UrlUtils = require('%PathToCoreWebclientModule%/js/utils/Url.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	AppData = window.auroraAppData,
	
	bRtl = $('html').hasClass('rtl')
;

var Settings = {
	ServerModuleName: 'Core',
	HashModuleName: 'core',
	
	DebugMode: Types.isString(UrlUtils.getRequestParam('debugmode')),
	
	// Settings from Core module
	AuthTokenCookieExpireTime: 30,
	AutodetectLanguage: false,
	UserSelectsDateFormat: false,
	dateFormat: ko.observable('DD/MM/YYYY'),
	DateFormatList: ['DD/MM/YYYY'],
	EUserRole: {},
	IsSystemConfigured: false,
	Language: 'English',
	LastErrorCode: 0,
	ShortLanguage: 'en',
	SiteName: 'Afterlogic Platform',
	SocialName: '',
	StoreAuthTokenInDB: false,
	TenantName: '',
	timeFormat: ko.observable('0'), // 0 - 24, 1 - 12
	timezone: ko.observable(''),
	UserId: 0,
	PasswordMinLength: 0,
	PasswordMustBeComplex: false,
	CookiePath: '/',
	CookieSecure: false,
	Version: '',
	ProductName: '',
	
	// Settings from Core module only for super admin
	AdminHasPassword: '',
	AdminLanguage: '',
	AdminLogin: '',
	CommonLanguage: '',
	DbHost: '',
	DbLogin: '',
	DbName: '',
	SaltNotEmpty: false,
	dbSettingsChanged: ko.observable(false).extend({'autoResetToFalse': 100}),
	
	// Settings from CoreWebclient module
	AllowChangeSettings: false,
	AllowClientDebug: false,
	AllowDesktopNotifications: false,
	AllowMobile: false,
	AllowPrefetch: true,
	AttachmentSizeLimit: 0,
	AutoRefreshIntervalMinutes: 1,
	CustomLogoutUrl: '',
	DefaultAnonymScreenHash: '',
	DefaultUserScreenHash: '',
	GoogleAnalyticsAccount: '',
	HeaderModulesOrder: [],
	IsDemo: false,
	IsMobile: -1,
	LanguageList: [{name: 'English', text: 'English'}],
	MultipleFilesUploadLimit: 50,
	ShowQuotaBar: false,
	QuotaWarningPerc: 0,
	Theme: 'Default',
	ThemeList: ['Default'],
	
	// Settings from CoreMobileWebclient module
	MobileTheme: 'Default',
	MobileThemeList: ['Default'],
	
	// Settings from BrandingWebclient module
	LogoUrl: '',
	TopIframeUrl: '',
	TopIframeHeightPx: 0,
	
	// Settings from HTML
	IsRTL: bRtl,
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var
			oAppDataCoreSection = oAppData[Settings.ServerModuleName],
			oAppDataCoreWebclientSection = oAppData['%ModuleName%'],
			oAppDataCoreMobileWebclientSection = oAppData['CoreMobileWebclient'],
			oAppDataBrandingWebclientSection = oAppData['BrandingWebclient']
		;
		
		if (!_.isEmpty(oAppDataCoreSection))
		{
			this.AuthTokenCookieExpireTime = Types.pInt(oAppDataCoreSection.AuthTokenCookieExpireTime, this.AuthTokenCookieExpireTime);
			this.AutodetectLanguage = Types.pBool(oAppDataCoreSection.AutodetectLanguage, this.AutodetectLanguage);
			this.UserSelectsDateFormat = Types.pBool(oAppDataCoreSection.UserSelectsDateFormat, this.UserSelectsDateFormat);
			this.dateFormat(Types.pString(oAppDataCoreSection.DateFormat, this.dateFormat()));
			this.DateFormatList = Types.pArray(oAppDataCoreSection.DateFormatList, this.DateFormatList);
			if (_.indexOf(this.DateFormatList, this.dateFormat()) === -1) {
				this.DateFormatList.unshift(this.dateFormat());
			}
			this.EUserRole = Types.pObject(oAppDataCoreSection.EUserRole, this.EUserRole);
			this.IsSystemConfigured = Types.pBool(oAppDataCoreSection.IsSystemConfigured, this.IsSystemConfigured);
			this.Language = Types.pString(oAppDataCoreSection.Language, this.Language);
			this.LastErrorCode = Types.pInt(oAppDataCoreSection.LastErrorCode, this.LastErrorCode);
			this.ShortLanguage = Types.pString(oAppDataCoreSection.ShortLanguage, this.ShortLanguage);
			this.SiteName = Types.pString(oAppDataCoreSection.SiteName, this.SiteName);
			this.SocialName = Types.pString(oAppDataCoreSection.SocialName, this.SocialName);
			this.StoreAuthTokenInDB = Types.pBool(oAppDataCoreSection.StoreAuthTokenInDB, this.StoreAuthTokenInDB);
			this.TenantName = Types.pString(oAppDataCoreSection.TenantName || UrlUtils.getRequestParam('tenant'), this.TenantName);
			this.timeFormat(Types.pString(oAppDataCoreSection.TimeFormat, this.timeFormat()));
			this.timezone(Types.pString(oAppDataCoreSection.Timezone, this.timezone()));
			this.UserId = Types.pInt(oAppDataCoreSection.UserId, this.UserId);
			this.PasswordMinLength = Types.pNonNegativeInt(oAppDataCoreSection.PasswordMinLength, this.PasswordMinLength);
			this.PasswordMustBeComplex = Types.pBool(oAppDataCoreSection.PasswordMustBeComplex, this.PasswordMustBeComplex);
			this.CookiePath = Types.pString(oAppDataCoreSection.CookiePath, this.CookiePath);
			if (this.CookiePath === '')
			{
				this.CookiePath = '/';
			}
			this.CookieSecure = Types.pBool(oAppDataCoreSection.CookieSecure, this.CookieSecure);
			this.Version = Types.pString(oAppDataCoreSection.Version, this.Version);
			this.ProductName = Types.pString(oAppDataCoreSection.ProductName, this.ProductName);
			
			//only for admin
			this.AdminHasPassword = Types.pBool(oAppDataCoreSection.AdminHasPassword, this.AdminHasPassword);
			this.AdminLanguage = Types.pString(oAppDataCoreSection.AdminLanguage, this.AdminLanguage);
			this.AdminLogin = Types.pString(oAppDataCoreSection.AdminLogin, this.AdminLogin);
			this.CommonLanguage = Types.pString(oAppDataCoreSection.CommonLanguage, this.CommonLanguage);
			this.DbHost = Types.pString(oAppDataCoreSection.DBHost, this.DbHost);
			this.DbLogin = Types.pString(oAppDataCoreSection.DBLogin, this.DbLogin);
			this.DbName = Types.pString(oAppDataCoreSection.DBName, this.DbName);
			this.SaltNotEmpty = Types.pBool(oAppDataCoreSection.SaltNotEmpty, this.SaltNotEmpty);
		}
		
		if (!_.isEmpty(oAppDataCoreWebclientSection))
		{
			this.AllowChangeSettings = Types.pBool(oAppDataCoreWebclientSection.AllowChangeSettings, this.AllowChangeSettings);
			this.AllowClientDebug = Types.pBool(oAppDataCoreWebclientSection.AllowClientDebug, this.AllowClientDebug);
			this.AllowDesktopNotifications = Types.pBool(oAppDataCoreWebclientSection.AllowDesktopNotifications, this.AllowDesktopNotifications);
			this.AllowMobile = Types.pBool(oAppDataCoreWebclientSection.AllowMobile, this.AllowMobile);
			this.AllowPrefetch = Types.pBool(oAppDataCoreWebclientSection.AllowPrefetch, this.AllowPrefetch);
			this.AttachmentSizeLimit = Types.pNonNegativeInt(oAppDataCoreWebclientSection.AttachmentSizeLimit, this.AttachmentSizeLimit);
			this.AutoRefreshIntervalMinutes = Types.pNonNegativeInt(oAppDataCoreWebclientSection.AutoRefreshIntervalMinutes, this.AutoRefreshIntervalMinutes);
			this.CustomLogoutUrl = Types.pString(oAppDataCoreWebclientSection.CustomLogoutUrl, this.CustomLogoutUrl);
			this.DefaultAnonymScreenHash = Types.pString(oAppDataCoreWebclientSection.DefaultAnonymScreenHash, this.DefaultAnonymScreenHash);
			this.DefaultUserScreenHash = Types.pString(oAppDataCoreWebclientSection.DefaultUserScreenHash, this.DefaultUserScreenHash);
			this.GoogleAnalyticsAccount = Types.pString(oAppDataCoreWebclientSection.GoogleAnalyticsAccount, this.GoogleAnalyticsAccount);
			this.HeaderModulesOrder = Types.pArray(oAppDataCoreWebclientSection.HeaderModulesOrder, this.HeaderModulesOrder);
			this.IsDemo = Types.pBool(oAppDataCoreWebclientSection.IsDemo, this.IsDemo);
			this.IsMobile = Types.pInt(oAppDataCoreWebclientSection.IsMobile, this.IsMobile);
			this.LanguageList = Types.pArray(oAppDataCoreWebclientSection.LanguageListWithNames, this.LanguageList);
			this.MultipleFilesUploadLimit = Types.pNonNegativeInt(oAppDataCoreWebclientSection.MultipleFilesUploadLimit, this.MultipleFilesUploadLimit);
			this.ShowQuotaBar = Types.pBool(oAppDataCoreWebclientSection.ShowQuotaBar, this.ShowQuotaBar);
			this.QuotaWarningPerc = Types.pInt(oAppDataCoreWebclientSection.QuotaWarningPerc, this.QuotaWarningPerc);
			this.Theme = Types.pString(oAppDataCoreWebclientSection.Theme, this.Theme);
			this.ThemeList = Types.pArray(oAppDataCoreWebclientSection.ThemeList, this.ThemeList);
		}

		if (!_.isEmpty(oAppDataCoreMobileWebclientSection))
		{
			this.MobileTheme = Types.pString(oAppDataCoreMobileWebclientSection.Theme, this.MobileTheme);
			this.MobileThemeList = Types.pArray(oAppDataCoreMobileWebclientSection.ThemeList, this.MobileThemeList);
		}

		if (!_.isEmpty(oAppDataBrandingWebclientSection))
		{
			this.LogoUrl = Types.pString(oAppDataBrandingWebclientSection.TabsbarLogo, this.LogoUrl);
			this.TopIframeUrl = Types.pString(oAppDataBrandingWebclientSection.TopIframeUrl, this.TopIframeUrl);
			this.TopIframeHeightPx = Types.pString(oAppDataBrandingWebclientSection.TopIframeHeightPx, this.TopIframeHeightPx);
		}
		
		if (moment.locale() !== this.ShortLanguage && this.Language !== 'Arabic' && this.Language !== 'Persian')
		{
			moment.locale(this.ShortLanguage);
		}
		
		setTimeout(_.bind(this.initTimezone, this), 1000);
	},
	
	initTimezone: function ()
	{
		var App = require('%PathToCoreWebclientModule%/js/App.js');
		if (App.isUserNormalOrTenant())
		{
			var
				TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

				Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
				Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
				Storage = require('%PathToCoreWebclientModule%/js/Storage.js'),

				oNowMoment = moment(),
				sBrowserTimezone = moment.tz.guess(),
				sServerTimezone = this.timezone()
			;

			if (sServerTimezone === '')
			{
				Ajax.send('Core', 'UpdateUserTimezone', {Timezone: sBrowserTimezone});
			}
			else
			{
				if (sServerTimezone !== sBrowserTimezone && Storage.getData('showNewTimezone') !== sBrowserTimezone)
				{
					Screens.showReport(TextUtils.i18n('%MODULENAME%/CONFIRM_TIMEZONE_CHANGES', {
						OLDTIME: oNowMoment.clone().tz(sServerTimezone).format('HH:mm') + ' (' + sServerTimezone + ')',
						NEWTIME: oNowMoment.format('HH:mm') + ' (' + sBrowserTimezone + ')'
					}), 0);

					$('.report_panel.report a').on('click', _.bind(function () {
						Storage.removeData('showNewTimezone');
						Ajax.send('Core', 'UpdateUserTimezone', {Timezone: sBrowserTimezone}, _.bind(function (oUpdateResponse) {
							Screens.hideReport();
							if (oUpdateResponse.Result === true)
							{
								Storage.setData('showNewTimezone', sBrowserTimezone);
								this.timezone(sBrowserTimezone);
							}
							else
							{
								Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_TIMEZONE_CHANGES'));
							}
						}, this));
					}, this));
				}
				Storage.setData('showNewTimezone', sBrowserTimezone);
			}
		}
	},
	
	/**
	 * Updates new settings values after saving on server.
	 * 
	 * @param {string} sSiteName
	 * @param {number} iAutoRefreshIntervalMinutes
	 * @param {string} sDefaultTheme
	 * @param {string} sDefaultMobileTheme
	 * @param {string} sLanguage
	 * @param {string} sTimeFormat
	 * @param {string} sDateFormat
	 * @param {boolean} bAllowDesktopNotifications
	 */
	update: function (sSiteName, iAutoRefreshIntervalMinutes, sDefaultTheme, sDefaultMobileTheme, sLanguage, sTimeFormat, sDateFormat, bAllowDesktopNotifications)
	{
		if (typeof(sSiteName) === 'string')
		{
			this.SiteName = sSiteName;
		}
		if (typeof(sLanguage) === 'string')
		{
			this.Language = sLanguage;
		}
		if (typeof(sTimeFormat) === 'string')
		{
			this.timeFormat(sTimeFormat);
		}
		if (typeof(sDateFormat) === 'string')
		{
			this.dateFormat(sDateFormat);
		}
		
		if (typeof(bAllowDesktopNotifications) === 'boolean')
		{
			this.AllowDesktopNotifications = bAllowDesktopNotifications;
		}
		if (typeof(iAutoRefreshIntervalMinutes) === 'number')
		{
			this.AutoRefreshIntervalMinutes = iAutoRefreshIntervalMinutes;
		}
		if (typeof(sDefaultTheme) === 'string')
		{
			this.Theme = sDefaultTheme;
		}
		if (typeof(sDefaultMobileTheme) === 'string')
		{
			this.MobileTheme = sDefaultMobileTheme;
		}
	},
	
	/**
	 * Updates admin login from settings tab in admin panel.
	 * 
	 * @param {string} sAdminLogin Admin login.
	 * @param {boolean} bAdminHasPassword
	 */
	updateSecurity: function (sAdminLogin, bAdminHasPassword)
	{
		this.AdminHasPassword = bAdminHasPassword;
		this.AdminLogin = sAdminLogin;
	},
	
	/**
	 * Updates settings from db settings tab in admin panel.
	 * 
	 * @param {string} sDbLogin Database login.
	 * @param {string} sDbName Database name.
	 * @param {string} sDbHost Database host.
	 */
	updateDb: function (sDbLogin, sDbName, sDbHost)
	{
		this.DbHost = sDbHost;
		this.DbLogin = sDbLogin;
		this.DbName = sDbName;
		this.dbSettingsChanged(true);
	}
};

Settings.init(AppData);

module.exports = Settings;
