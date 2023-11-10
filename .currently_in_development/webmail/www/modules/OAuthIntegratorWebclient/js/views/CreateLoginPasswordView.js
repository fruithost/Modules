'use strict';

var
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CCreateLoginPasswordView()
{
	this.visible = ko.computed(function () {
		return Settings.OnlyPasswordForAccountCreate && !Types.isNonEmptyString(App.firstAccountWithPassLogin());
	});
	this.password = ko.observable('');
	this.passwordFocus = ko.observable(false);
	this.confirmPassword = ko.observable('');
	this.confirmPasswordFocus = ko.observable(false);
	this.login = ko.computed(function () {
		return App.getUserPublicId();
	}, this);
}

CCreateLoginPasswordView.prototype.ViewTemplate = '%ModuleName%_CreateLoginPasswordView';

/**
 * Broadcasts event to auth module to create auth account.
 */
CCreateLoginPasswordView.prototype.setPassword = function ()
{
	var
		sLogin = $.trim(this.login()),
		sPassword = $.trim(this.password()),
		sConfirmPassword = $.trim(this.confirmPassword())
	;
	if (sPassword === '')
	{
		this.passwordFocus(true);
		return;
	}
	if (sPassword !== sConfirmPassword)
	{
		Screens.showError(TextUtils.i18n('COREWEBCLIENT/ERROR_PASSWORDS_DO_NOT_MATCH'));
		this.confirmPasswordFocus(true);
		return;
	}
	App.broadcastEvent(Settings.AuthModuleName + '::CreateUserAuthAccount', {
		'Login': sLogin,
		'Password': sPassword
	});
};

module.exports = new CCreateLoginPasswordView();
