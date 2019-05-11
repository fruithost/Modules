'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	UrlUtils = require('%PathToCoreWebclientModule%/js/utils/Url.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Browser = require('%PathToCoreWebclientModule%/js/Browser.js'),
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	$html = $('html')
;

/**
 * @constructor
 */
function CLoginView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	
	this.sCustomLogoUrl = Settings.CustomLogoUrl;
	this.sInfoText = Settings.InfoText;
	this.sBottomInfoHtmlText = Settings.BottomInfoHtmlText;
	
	this.login = ko.observable('');
	this.password = ko.observable('');
	
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

	this.beforeButtonsControllers = ko.observableArray([]);
	App.broadcastEvent('AnonymousUserForm::PopulateBeforeButtonsControllers', { ModuleName: '%ModuleName%', RegisterBeforeButtonsController: this.registerBeforeButtonsController.bind(this) });

	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
}

_.extendOwn(CLoginView.prototype, CAbstractScreenView.prototype);

CLoginView.prototype.ViewTemplate = '%ModuleName%_LoginView';
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
	if (!this.loading() && ('' !== $.trim(this.login())))
	{
		var oParameters = {
			'Login': $.trim(this.login()),
			'Password': $.trim(this.password()),
			'Language': $.cookie('aurora-selected-lang') || '',
			'SignMe': this.signMe()
		};
		App.broadcastEvent('AnonymousUserForm::PopulateFormSubmitParameters', { Module: '%ModuleName%', Parameters: oParameters });
		
		this.loading(true);

		Ajax.send('%ModuleName%', 'Login', oParameters, this.onSystemLoginResponse, this, 100000);
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
		$.cookie('AuthToken', oResponse.Result.AuthToken, { expires: 30 });
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
