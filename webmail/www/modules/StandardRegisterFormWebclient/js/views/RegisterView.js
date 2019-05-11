'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	UrlUtils = require('%PathToCoreWebclientModule%/js/utils/Url.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Browser = require('%PathToCoreWebclientModule%/js/Browser.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	$html = $('html')
;

/**
 * @constructor
 */
function CRegisterView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	
	this.sCustomLogoUrl = Settings.CustomLogoUrl;
	this.sInfoText = Settings.InfoText;
	this.sBottomInfoHtmlText = Settings.BottomInfoHtmlText;
	
	this.login = ko.observable('');
	this.enableLoginEdit = ko.observable(true);
	this.password = ko.observable('');
	this.confirmPassword = ko.observable('');
	
	this.loginFocus = ko.observable(false);
	this.passwordFocus = ko.observable(false);
	this.confirmPasswordFocus = ko.observable(false);

	this.loading = ko.observable(false);

	this.canTryRegister = ko.computed(function () {
		return !this.loading();
	}, this);

	this.registerButtonText = ko.computed(function () {
		return this.loading() ? TextUtils.i18n('COREWEBCLIENT/ACTION_REGISTER_IN_PROGRESS') : TextUtils.i18n('COREWEBCLIENT/ACTION_REGISTER');
	}, this);

	this.registerCommand = Utils.createCommand(this, this.register, this.canTryRegister);

	this.shake = ko.observable(false).extend({'autoResetToFalse': 800});
	
	this.welcomeText = ko.observable('');
	App.subscribeEvent('ShowWelcomeRegisterText', _.bind(function (oParams) {
		this.welcomeText(oParams.WelcomeText);
		this.login(oParams.UserName);
		this.enableLoginEdit(false);
	}, this));
	
	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
}

_.extendOwn(CRegisterView.prototype, CAbstractScreenView.prototype);

CRegisterView.prototype.ViewTemplate = '%ModuleName%_RegisterView';
CRegisterView.prototype.ViewConstructorName = 'CRegisterView';

CRegisterView.prototype.onBind = function ()
{
	$html.addClass('non-adjustable-valign');
};

/**
 * Focuses login input after view showing.
 */
CRegisterView.prototype.onShow = function ()
{
	_.delay(_.bind(function(){
		if (this.login() === '')
		{
			this.loginFocus(true);
		}
	},this), 1);
};

/**
 * 
 * @param {string} sLogin
 * @param {string} sPassword
 * @param {string} sConfirmPassword
 * @returns {Boolean}
 */
CRegisterView.prototype.validateForm = function (sLogin, sPassword, sConfirmPassword)
{
	if (sLogin === '')
	{
		this.loginFocus(true);
		this.shake(true);
		return false;
	}
	if (sPassword === '')
	{
		this.passwordFocus(true);
		this.shake(true);
		return false;
	}
	if (sPassword !== '' && sPassword !== sConfirmPassword)
	{
		this.confirmPasswordFocus(true);
		this.shake(true);
		Screens.showError(TextUtils.i18n('COREWEBCLIENT/ERROR_PASSWORDS_DO_NOT_MATCH'));
		return false;
	}
	return true;
};

/**
 * Checks login input value and sends register request to server.
 */
CRegisterView.prototype.register = function ()
{
	if (!this.loading())
	{
		var
			sLogin = $.trim(this.login()),
			sPassword = $.trim(this.password()),
			sConfirmPassword = $.trim(this.confirmPassword()),
			oParameters = {
				'Login': sLogin,
				'Password': sPassword
			}
		;
		if (this.validateForm(sLogin, sPassword, sConfirmPassword))
		{
			this.loading(true);
			Ajax.send('%ModuleName%', 'Register', oParameters, this.onRegisterResponse, this);
		}
	}
};

/**
 * Receives data from the server. Shows error and shakes form if server has returned false-result.
 * Otherwise clears search-string if it don't contain "reset-pass", "invite-auth" and "oauth" parameters and reloads page.
 * 
 * @param {Object} oResponse Data obtained from the server.
 * @param {Object} oRequest Data has been transferred to the server.
 */
CRegisterView.prototype.onRegisterResponse = function (oResponse, oRequest)
{
	if (false === oResponse.Result)
	{
		this.loading(false);
		this.shake(true);
		
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_REGISTRATION_FAILED'));
	}
	else
	{
		$.cookie('AuthToken', oResponse.Result.AuthToken, { expires: 30 });
		
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

module.exports = new CRegisterView();
