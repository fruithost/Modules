'use strict';

// UserSettings use koExtendings
require('%PathToCoreWebclientModule%/js/koExtendings.js');

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	modernizr = require('%PathToCoreWebclientModule%/js/vendors/modernizr.js'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	UrlUtils = require('%PathToCoreWebclientModule%/js/utils/Url.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	Browser = require('%PathToCoreWebclientModule%/js/Browser.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	WindowOpener = require('%PathToCoreWebclientModule%/js/WindowOpener.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js')
;

require('%PathToCoreWebclientModule%/js/enums.js');

require('%PathToCoreWebclientModule%/js/koBindings.js');

require('%PathToCoreWebclientModule%/js/vendors/inputosaurus.js');

require('%PathToCoreWebclientModule%/js/vendors/jquery.cookie.js');

function InitNotMobileRequires()
{
	require('%PathToCoreWebclientModule%/js/CustomTooltip.js');
	require('%PathToCoreWebclientModule%/js/koBindingsNotMobile.js');
}

/**
 * Modernizr build:
 * Method - addTest
 * CSS classes - cssanimations, csstransitions
 */
function InitModernizr()
{
	if (modernizr && navigator)
	{
		modernizr.addTest('pdf', function() {
			return !!_.find(navigator.mimeTypes, function (oMimeType) {
				return 'application/pdf' === oMimeType.type;
			}) || Browser.firefox; // FireFox have stopped supporting of 'application/pdf' mime type in navigator since 2016
		});

		modernizr.addTest('newtab', function() {
			return App.isNewTab();
		});

		modernizr.addTest('mobile', function() {
			return App.isMobile();
		});
		
		if (navigator)
		{
			modernizr.addTest('native-android-browser', function() {
				var ua = navigator.userAgent;
				return (ua.indexOf('Mozilla/5.0') > -1 && ua.indexOf('Android ') > -1 && ua.indexOf('534') > -1 && ua.indexOf('AppleWebKit') > -1);
			});
		}
	}
}

function CApp()
{
	this.iUserRole = window.auroraAppData.User ? Types.pInt(window.auroraAppData.User.Role) : Enums.UserRole.Anonymous;
	this.iTenantId = window.auroraAppData.User ? Types.pInt(window.auroraAppData.User.TenantId) : 0;
	this.sUserName = window.auroraAppData.User ? Types.pString(window.auroraAppData.User.Name) : '';
	this.sUserPublicId = window.auroraAppData.User ? Types.pString(window.auroraAppData.User.PublicId) : '';
	this.iUserId = window.auroraAppData.User ? Types.pInt(window.auroraAppData.User.Id) : 0;
	this.bPublic = false;
	this.bNewTab = false;
	
	this.userAuthAccountsCountsArray = ko.observableArray([]);
	this.userAccountsCount = ko.computed(function () {
		var iCount = _.reduce(this.userAuthAccountsCountsArray(), function (iSum, koUserAccountsCount) {
			return iSum + koUserAccountsCount();
		}, 0);
		return iCount;
	}, this);
	
	this.userAccountsWithPass = ko.observableArray([]);
	this.firstAccountWithPassLogin = ko.computed(function () {
		var sLogin = '';
		_.each(this.userAccountsWithPass(), function (koAccountsWithPass) {
			var aAccountsLogins = koAccountsWithPass();
			if (!Types.isNonEmptyString(sLogin) && aAccountsLogins.length > 0 && Types.isNonEmptyString(aAccountsLogins[0]))
			{
				sLogin = aAccountsLogins[0];
			}
		});
		return sLogin;
	}, this);
	this.mobileCredentialsHintText = ko.computed(function () {
		var sLogin = this.firstAccountWithPassLogin() || this.getUserPublicId();
		return TextUtils.i18n('COREWEBCLIENT/INFO_MOBILE_CREDENTIALS', {'LOGIN': sLogin});
	}, this);
}

CApp.prototype.registerUserAccountsCount = function (koUserAccountsCount)
{
	this.userAuthAccountsCountsArray.push(koUserAccountsCount);
};

CApp.prototype.registerAccountsWithPass = function (koAccountsWithPass)
{
	this.userAccountsWithPass.push(koAccountsWithPass);
};

CApp.prototype.isAccountDeletingAvailable = function ()
{
	if (this.userAccountsCount() <= 1)
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_ACCOUNT_DELETING_DISABLE'), true);
		return false;
	}
	return true;
};

CApp.prototype.getUserRole = function ()
{
	return this.iUserRole;
};

CApp.prototype.getTenantId = function ()
{
	return this.iTenantId;
};

CApp.prototype.getUserName = function ()
{
	return this.sUserName;
};

CApp.prototype.getUserPublicId = function ()
{
	return this.sUserPublicId;
};

CApp.prototype.getUserId = function ()
{
	return this.iUserId;
};

CApp.prototype.setPublic = function ()
{
	this.bPublic = true;
};

CApp.prototype.isPublic = function ()
{
	return this.bPublic;
};

CApp.prototype.setNewTab = function ()
{
	this.bNewTab = true;
};

CApp.prototype.isNewTab = function ()
{
	return this.bNewTab;
};

CApp.prototype.isMobile = function ()
{
	return UserSettings.IsMobile === 1;
};

CApp.prototype.init = function ()
{
	ModulesManager.run('StandardLoginFormWebclient', 'beforeAppRunning', [this.iUserRole !== Enums.UserRole.Anonymous]);
	
	if (UserSettings.AllowChangeSettings && !this.isMobile())
	{
		ModulesManager.run('SettingsWebclient', 'registerSettingsTab', [
			function () { return require('%PathToCoreWebclientModule%/js/views/CommonSettingsFormView.js'); },
			'common',
			TextUtils.i18n('%MODULENAME%/LABEL_COMMON_SETTINGS_TABNAME')
		]);
	}
		
	if (App.getUserRole() === Enums.UserRole.SuperAdmin)
	{
		ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
			function(resolve) {
				require.ensure(
					['%PathToCoreWebclientModule%/js/views/CommonSettingsFormView.js'],
					function() {
						resolve(require('%PathToCoreWebclientModule%/js/views/CommonSettingsFormView.js'));
					},
					"admin-bundle"
				);
			},
			'system',
			TextUtils.i18n('%MODULENAME%/LABEL_COMMON_SETTINGS_TABNAME')
		]);
	}
		
	if (Browser.iosDevice && this.iUserRole !== Enums.UserRole.Anonymous && UserSettings.SyncIosAfterLogin && UserSettings.AllowIosProfile && $.cookie('skip-ios') !== '1')
	{
		$.cookie('skip-ios', '1');
		window.location.href = '?ios';
	}
	
	if (this.iUserRole !== Enums.UserRole.Anonymous && !this.bPublic)
	{
		var AccountList = ModulesManager.run('MailWebclient', 'getAccountList');
		if (AccountList)
		{
			this.currentAccountId = AccountList.currentId;
			this.hasAccountWithId = _.bind(AccountList.hasAccountWithId, AccountList);

			this.currentAccountEmail = ko.computed(function () {
				var oAccount = AccountList.getAccount(this.currentAccountId());
				return oAccount ? oAccount.email() : '';
			}, this);

			this.getAttendee = function (aAttendees) {
				return AccountList.getAttendee(
					_.map(aAttendees, function (mAttendee) {
						return Types.isString(mAttendee) ? mAttendee : mAttendee.email;
					}, this)
				);
			};
		}
		else
		{
			this.currentAccountEmail = _.bind(function () { return this.sUserName; }, this);
		}
	}
	
	if (!this.isMobile())
	{
		InitNotMobileRequires();
	}
	
	Screens.init(this.iUserRole === Enums.UserRole.Anonymous);
	Routing.init();
	
	require('%PathToCoreWebclientModule%/js/AppTab.js');
	if (!this.bNewTab)
	{
		require('%PathToCoreWebclientModule%/js/Prefetcher.js');
	}

	this.useGoogleAnalytics();

	if (!this.isMobile())
	{
		$(window).unload(function() {
			WindowOpener.closeAll();
		});
	}
	
	window.onbeforeunload = _.bind(function () {
		if (Screens.hasUnsavedChanges() || Popups.hasUnsavedChanges())
		{
			return '';
		}
	}, this);
	
	if (Browser.ie8AndBelow)
	{
		$('body').css('overflow', 'hidden');
	}
	
	this.checkCookies();
	
	this.showLastErrorOnLogin();
	
	if (UserSettings.IsSystemConfigured === false)
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_SYSTEM_NOT_CONFIGURED'), true);
	}
};

CApp.prototype.showLastErrorOnLogin = function ()
{
	if (this.iUserRole === Enums.UserRole.Anonymous)
	{
		var
			iError = Types.pInt(UrlUtils.getRequestParam('error')),
			sErrorModule = Types.pString(UrlUtils.getRequestParam('module'))
		;
		
		if (iError !== 0)
		{
			Api.showErrorByCode({'ErrorCode': iError, 'Module': sErrorModule}, '', true);
		}
		
		if (UserSettings.LastErrorCode === Enums.Errors.AuthError)
		{
			Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_AUTH_PROBLEM'), true);
		}
	}
};

/**
 * Makes user logout if there are no changes in current screen or popup or user chose to discard them.
 */
CApp.prototype.logout = function ()
{
	if (Screens.hasUnsavedChanges() || Popups.hasUnsavedChanges())
	{
		this.askDiscardChanges(this.logoutAndGotoLogin.bind(this));
	}
	else
	{
		this.logoutAndGotoLogin();
	}
};

/**
 * Makes user logout and relocate to login screen after that.
 * @param {number=} iLastErrorCode
 */
CApp.prototype.logoutAndGotoLogin = function (iLastErrorCode)
{
	var Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js');

	Ajax.send('Core', 'Logout', iLastErrorCode ? {'LastErrorCode': iLastErrorCode} : null);

	Ajax.abortAndStopSendRequests();

	$.removeCookie('AuthToken');

	window.onbeforeunload = null;
	
	WindowOpener.closeAll();
	
	Routing.finalize();
	
	if (Types.isNonEmptyString(UserSettings.CustomLogoutUrl))
	{
		window.location.href = UserSettings.CustomLogoutUrl;
	}
	else
	{
		UrlUtils.clearAndReloadLocation(Browser.ie8AndBelow, true);
	}
};

/**
 * Asks user if he prefer discard changes or stay on current screen/popup.
 * @param {function} fOnDiscard Function to execute if user prefer to discard changes.
 * @param {function} fOnNotDiscard Function to execute if user prefer to stay on current screen/popup.
 * @param {object} oCurrentScreen Current screen object.
 */
CApp.prototype.askDiscardChanges = function (fOnDiscard, fOnNotDiscard, oCurrentScreen)
{
	var
		sConfirm = TextUtils.i18n('COREWEBCLIENT/CONFIRM_DISCARD_CHANGES'),
		fOnConfirm = _.bind(function (bOk) {
			if (bOk && _.isFunction(fOnDiscard))
			{
				if (oCurrentScreen && _.isFunction(oCurrentScreen.discardChanges))
				{
					oCurrentScreen.discardChanges();
				}
				fOnDiscard();
			}
			else if (_.isFunction(fOnNotDiscard))
			{
				fOnNotDiscard();
			}
		}, this)
	;

	Popups.showPopup(ConfirmPopup, [sConfirm, fOnConfirm]);
};

CApp.prototype.tokenProblem = function ()
{
	var
		sReloadFunc = 'window.location.reload(); return false;',
		sHtmlError = TextUtils.i18n('%MODULENAME%/ERROR_TOKEN_PROBLEM_HTML', {'RELOAD_FUNC': sReloadFunc})
	;
	Screens.showError(sHtmlError, true);
};

CApp.prototype.checkMobile = function () {
	/**
	 * UserSettings.IsMobile:
	 *	-1 - first time, mobile is not determined
	 *	0 - mobile is switched off
	 *	1 - mobile is switched on
	 */
	
	if (UserSettings.AllowMobile && UserSettings.IsMobile === -1)
	{
		var
			Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
			bMobile = !window.matchMedia('all and (min-width: 768px)').matches
		;

		Ajax.send('Core', 'SetMobile', {'Mobile': bMobile}, function (oResponse) {
			if (bMobile && oResponse.Result)
			{
				window.location.reload();
			}
		}, this);
		
		return bMobile;
	}
	else if (this.iUserRole === Enums.UserRole.SuperAdmin && UserSettings.AllowMobile && UserSettings.IsMobile === 1)
	{
		// There is no admin panel for mobile version so go to full version
		var Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js');

		Ajax.send('Core', 'SetMobile', {'Mobile': false}, function (oResponse) {
			window.location.reload();
		}, this);
		
		return false;
	}
	
	return false;
};

CApp.prototype.useGoogleAnalytics = function ()
{
	var
		oGoogleAnalytics = null,
		oFirstScript = null
	;
	
	if (UserSettings.GoogleAnalyticsAccount && 0 < UserSettings.GoogleAnalyticsAccount.length)
	{
		window._gaq = window._gaq || [];
		window._gaq.push(['_setAccount', UserSettings.GoogleAnalyticsAccount]);
		window._gaq.push(['_trackPageview']);

		oGoogleAnalytics = document.createElement('script');
		oGoogleAnalytics.type = 'text/javascript';
		oGoogleAnalytics.async = true;
		oGoogleAnalytics.src = ('https:' === document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
		oFirstScript = document.getElementsByTagName('script')[0];
		oFirstScript.parentNode.insertBefore(oGoogleAnalytics, oFirstScript);
	}
};

/**
 * @returns {Boolean}
 */
CApp.prototype.checkCookies = function ()
{
	$.cookie.defaults = { path: UserSettings.CookiePath };
	
	$.cookie('checkCookie', '1');
	var bCookieWorks = $.cookie('checkCookie') === '1';
	$.removeCookie('checkCookie');
	
	if (!bCookieWorks)
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_COOKIES_DISABLED'), true);
	}
	else
	{
		if (this.iUserRole === Enums.UserRole.Anonymous)
		{
			$.removeCookie('AuthToken');
		}
		else
		{
			var sAuthToken = $.cookie('AuthToken');
			if (sAuthToken)
			{
				$.cookie('AuthToken', sAuthToken, { expires: 30 });
			}
		}
	}
	
	return bCookieWorks;
};

CApp.prototype.getCommonRequestParameters = function ()
{
	var oParameters = {
		TenantName: UserSettings.TenantName
	};
	
	return oParameters;
};

CApp.prototype.broadcastEvent = function (sEventName, oArguments)
{
	if (_.isArray(this.aEventsCallbacks) && _.isArray(this.aEventsCallbacks[sEventName]))
	{
		_.each(this.aEventsCallbacks[sEventName], function (fCallback) {
			fCallback(oArguments);
		});
		return true;
	}
	return  false;
};

CApp.prototype.subscribeEvent = function (sEventName, fCallback)
{
	if (!_.isArray(this.aEventsCallbacks))
	{
		this.aEventsCallbacks = [];
	}
	
	if (!_.isArray(this.aEventsCallbacks[sEventName]))
	{
		this.aEventsCallbacks[sEventName] = [];
	}
	
	this.aEventsCallbacks[sEventName].push(fCallback);
};

var App = new CApp();

InitModernizr();
	
module.exports = App;
