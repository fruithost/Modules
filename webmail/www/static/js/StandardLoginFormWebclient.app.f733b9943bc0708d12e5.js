(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[14],{

/***/ "8Xhm":
/*!***********************************************************!*\
  !*** ./modules/StandardLoginFormWebclient/js/Settings.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	
	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV")
;

module.exports = {
	ServerModuleName: 'StandardLoginFormWebclient',
	HashModuleName: 'login',
	
	AllowChangeLanguage: false,
	CustomLoginUrl: '',
	CustomLogoUrl: '',
	DemoLogin: '',
	DemoPassword: '',
	InfoText: '',
	BottomInfoHtmlText: '',
	LoginSignMeType: Enums.LoginSignMeType.DefaultOff, // 0 - off, 1 - on, 2 - don't use
	UseDropdownLanguagesView: false,
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var 
			oAppDataSection = oAppData['StandardLoginFormWebclient'],
			oAppDataBrandingWebclientSection = oAppData['BrandingWebclient']
		;
		
		if (!_.isEmpty(oAppDataSection))
		{
			this.ServerModuleName = Types.pString(oAppDataSection.ServerModuleName, this.ServerModuleName);
			this.HashModuleName = Types.pString(oAppDataSection.HashModuleName, this.HashModuleName);
			
			this.AllowChangeLanguage = Types.pBool(oAppDataSection.AllowChangeLanguage, this.AllowChangeLanguage);
			this.CustomLoginUrl = Types.pString(oAppDataSection.CustomLoginUrl, this.CustomLoginUrl);
			this.DemoLogin = Types.pString(oAppDataSection.DemoLogin, this.DemoLogin);
			this.DemoPassword = Types.pString(oAppDataSection.DemoPassword, this.DemoPassword);
			this.InfoText = Types.pString(oAppDataSection.InfoText, this.InfoText);
			this.BottomInfoHtmlText = Types.pString(oAppDataSection.BottomInfoHtmlText, this.BottomInfoHtmlText);
			this.LoginSignMeType = Types.pEnum(oAppDataSection.LoginSignMeType, Enums.LoginSignMeType, this.LoginSignMeType);
			this.UseDropdownLanguagesView = Types.pBool(oAppDataSection.UseDropdownLanguagesView, this.UseDropdownLanguagesView);
		}
		
		if (!_.isEmpty(oAppDataBrandingWebclientSection))
		{
			this.CustomLogoUrl = Types.pString(oAppDataBrandingWebclientSection.LoginLogo, this.CustomLogoUrl);
		}
	}
};


/***/ }),

/***/ "gi37":
/*!********************************************************!*\
  !*** ./modules/StandardLoginFormWebclient/js/enums.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	Enums = {}
;

/**
 * @enum {number}
 */
Enums.LoginSignMeType = {
	'DefaultOff': 0,
	'DefaultOn': 1,
	'Unuse': 2
};

if (typeof window.Enums === 'undefined')
{
	window.Enums = {};
}

_.extendOwn(window.Enums, Enums);


/***/ }),

/***/ "ojz+":
/*!**********************************************************!*\
  !*** ./modules/StandardLoginFormWebclient/js/manager.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function (oAppData) {
	__webpack_require__(/*! modules/StandardLoginFormWebclient/js/enums.js */ "gi37");
	__webpack_require__(/*! modules/CoreWebclient/js/vendors/jquery.cookie.js */ "fJbT");

	var
		Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
		
		App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
		
		Settings = __webpack_require__(/*! modules/StandardLoginFormWebclient/js/Settings.js */ "8Xhm"),
		
		bAnonimUser = App.getUserRole() === window.Enums.UserRole.Anonymous
	;
	
	Settings.init(oAppData);
	
	if (!App.isPublic() && bAnonimUser)
	{
		if (App.isMobile())
		{
			return {
				/**
				 * Returns login view screen as is.
				 */
				getLoginScreenView: function () {
					return __webpack_require__(/*! modules/StandardLoginFormWebclient/js/views/LoginView.js */ "sj3H");
				},
				
				getHashModuleName: function () {
					return Settings.HashModuleName;
				},

				/**
				 * Redirect to custom login url if specified.
				 */
				beforeAppRunning: function () {
					if (Types.isNonEmptyString(Settings.CustomLoginUrl))
					{
						window.location.href = Settings.CustomLoginUrl;
					}
				}
			};
		}
		else
		{
			return {
				/**
				 * Returns login view screen as is.
				 */
				getLoginScreenView: function () {
					return __webpack_require__(/*! modules/StandardLoginFormWebclient/js/views/LoginView.js */ "sj3H");
				},
				
				/**
				 * Returns login view screen.
				 */
				getScreens: function () {
					var oScreens = {};
					
					if (!Types.isNonEmptyString(Settings.CustomLoginUrl))
					{
						oScreens[Settings.HashModuleName] = function () {
							return __webpack_require__(/*! modules/StandardLoginFormWebclient/js/views/LoginView.js */ "sj3H");
						};
					}
					
					return oScreens;
				},

				/**
				 * Redirect to custom login url if specified.
				 */
				beforeAppRunning: function () {
					if (Types.isNonEmptyString(Settings.CustomLoginUrl))
					{
						window.location.href = Settings.CustomLoginUrl;
					}
				}
			};
		}
	}
	
	return null;
};


/***/ }),

/***/ "sj3H":
/*!******************************************************************!*\
  !*** ./modules/StandardLoginFormWebclient/js/views/LoginView.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
	UrlUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Url.js */ "ZP6a"),
	Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
	
	Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ "o0Bx"),
	Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ "JFZZ"),
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	Browser = __webpack_require__(/*! modules/CoreWebclient/js/Browser.js */ "HLSX"),
	CAbstractScreenView = __webpack_require__(/*! modules/CoreWebclient/js/views/CAbstractScreenView.js */ "xcwT"),
	UserSettings = __webpack_require__(/*! modules/CoreWebclient/js/Settings.js */ "hPb3"),
	
	Settings = __webpack_require__(/*! modules/StandardLoginFormWebclient/js/Settings.js */ "8Xhm"),
	
	$html = $('html')
;

/**
 * @constructor
 */
function CLoginView()
{
	CAbstractScreenView.call(this, 'StandardLoginFormWebclient');
	
	this.sCustomLogoUrl = Settings.CustomLogoUrl;
	this.sInfoText = Settings.InfoText;
	this.sBottomInfoHtmlText = Settings.BottomInfoHtmlText;
	
	this.login = ko.observable('');
	this.password = ko.observable('');
	
	this.loginDom = ko.observable(null);
	this.passwordDom = ko.observable(null);
	
	this.loginFocus = ko.observable(false);
	this.passwordFocus = ko.observable(false);

	this.loading = ko.observable(false);

	this.bUseSignMe = (Settings.LoginSignMeType === Enums.LoginSignMeType.Unuse);
	this.signMe = ko.observable(Enums.LoginSignMeType.DefaultOn === Settings.LoginSignMeType);
	this.signMeFocused = ko.observable(false);

	this.canBeLogin = ko.computed(function () {
		return !this.loading();
	}, this);

	this.signInButtonText = ko.computed(function () {
		return this.loading() ? TextUtils.i18n('COREWEBCLIENT/ACTION_SIGN_IN_IN_PROGRESS') : TextUtils.i18n('COREWEBCLIENT/ACTION_SIGN_IN');
	}, this);

	this.loginCommand = Utils.createCommand(this, this.signIn, this.canBeLogin);

	this.login(Settings.DemoLogin || '');
	this.password(Settings.DemoPassword || '');
	
	this.shake = ko.observable(false).extend({'autoResetToFalse': 800});
	
	this.bRtl = UserSettings.IsRTL;
	this.aLanguages = UserSettings.LanguageList;
	this.currentLanguage = ko.observable(UserSettings.Language);
	this.bAllowChangeLanguage = Settings.AllowChangeLanguage && !App.isMobile();
	this.bUseDropdownLanguagesView = Settings.UseDropdownLanguagesView;
	this.headingSelectLanguage = ko.computed(function () {
		var sSiteName = UserSettings.SiteName;
		if (_.isEmpty(sSiteName))
		{
			sSiteName = TextUtils.i18n('STANDARDLOGINFORMWEBCLIENT/HEADING_DEFAULT_SITENAME');
		}
		return TextUtils.i18n('STANDARDLOGINFORMWEBCLIENT/HEADING_SELECT_LANGUAGE', {'SITENAME': sSiteName});
	}, this);

	this.beforeButtonsControllers = ko.observableArray([]);
	App.broadcastEvent('AnonymousUserForm::PopulateBeforeButtonsControllers', { ModuleName: 'StandardLoginFormWebclient', RegisterBeforeButtonsController: this.registerBeforeButtonsController.bind(this) });

	App.broadcastEvent('StandardLoginFormWebclient::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
}

_.extendOwn(CLoginView.prototype, CAbstractScreenView.prototype);

CLoginView.prototype.ViewTemplate = 'StandardLoginFormWebclient_LoginView';
CLoginView.prototype.ViewConstructorName = 'CLoginView';

CLoginView.prototype.onBind = function ()
{
	$html.addClass('non-adjustable-valign');
};

/**
 * Focuses login input after view showing.
 */
CLoginView.prototype.onShow = function ()
{
	_.delay(_.bind(function(){
		if (this.login() === '')
		{
			this.loginFocus(true);
		}
	},this), 1);
};

/**
 * Checks login input value and sends sign-in request to server.
 */
CLoginView.prototype.signIn = function ()
{
	// sometimes nockoutjs conflicts with saved passwords in FF
	this.login($(this.loginDom()).val());
	this.password($(this.passwordDom()).val());
	
	if (!this.loading() && ('' !== $.trim(this.login())))
	{
		var oParameters = {
			'Login': $.trim(this.login()),
			'Password': $.trim(this.password()),
			'Language': $.cookie('aurora-selected-lang') || '',
			'SignMe': this.signMe()
		};
		App.broadcastEvent('AnonymousUserForm::PopulateFormSubmitParameters', { Module: 'StandardLoginFormWebclient', Parameters: oParameters });
		
		this.loading(true);

		Ajax.send('StandardLoginFormWebclient', 'Login', oParameters, this.onSystemLoginResponse, this, 100000);
	}
	else
	{
		this.loginFocus(true);
		this.shake(true);
	}
};

/**
 * Receives data from the server. Shows error and shakes form if server has returned false-result.
 * Otherwise clears search-string if it don't contain "reset-pass", "invite-auth" and "oauth" parameters and reloads page.
 * 
 * @param {Object} oResponse Data obtained from the server.
 * @param {Object} oRequest Data has been transferred to the server.
 */
CLoginView.prototype.onSystemLoginResponseBase = function (oResponse, oRequest)
{
	if (false === oResponse.Result)
	{
		this.loading(false);
		this.shake(true);
		
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_PASS_INCORRECT'));
	}
	else
	{
		App.setAuthToken(oResponse.Result.AuthToken);
		$.removeCookie('aurora-selected-lang');

		if (window.location.search !== '' &&
			UrlUtils.getRequestParam('reset-pass') === null &&
			UrlUtils.getRequestParam('invite-auth') === null &&
			UrlUtils.getRequestParam('oauth') === null)
		{
			UrlUtils.clearAndReloadLocation(Browser.ie8AndBelow, true);
		}
		else
		{
			UrlUtils.clearAndReloadLocation(Browser.ie8AndBelow, false);
		}
	}
};

/**
 * @param {string} sLanguage
 */
CLoginView.prototype.changeLanguage = function (sLanguage)
{
	if (sLanguage && this.bAllowChangeLanguage)
	{
		$.cookie('aurora-lang-on-login', sLanguage, { expires: 30 });
		$.cookie('aurora-selected-lang', sLanguage, { expires: 30 });
		window.location.reload();
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CLoginView.prototype.onSystemLoginResponse = function (oResponse, oRequest)
{
	this.onSystemLoginResponseBase(oResponse, oRequest);
};

/**
 * @param {Object} oComponent
 */
CLoginView.prototype.registerBeforeButtonsController = function (oComponent)
{
	this.beforeButtonsControllers.push(oComponent);
};

module.exports = new CLoginView();


/***/ })

}]);